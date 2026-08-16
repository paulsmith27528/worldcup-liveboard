import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import { randomBytes } from 'crypto';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const LMS_TTL = 60 * 60 * 24 * 300; // 300 days — covers a full PL season

// Which competitions this button can create a pool for — each is its own
// separate product on the landing page, run and charged independently.
const VALID_LEAGUES = ['PL', 'CHAMPIONSHIP', 'UCL', 'SPL'];

// id/season only needed here to work out which gameweek a brand-new pool
// should actually start on — matters for any league added after its season
// is already underway (e.g. Scottish Premiership), where GW1 has already
// been played and grading it would wrongly eliminate players who never had
// a chance to pick for it.
const LEAGUE_CONFIG: Record<string, { id: number; season: number }> = {
  PL: { id: 39, season: 2026 },
  CHAMPIONSHIP: { id: 40, season: 2026 },
  SPL: { id: 179, season: 2026 },
  UCL: { id: 2, season: 2026 },
};

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();

function genPoolId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateOrgToken(): string {
  return randomBytes(32).toString('hex');
}

// Same "earliest upcoming fixture's round" approach lms-pick.ts already uses
// to find the real current gameweek — reused here so a pool starts on
// whatever gameweek the league is actually on right now, not always GW1.
// Falls back to 1 (today's old behaviour) if anything about this lookup
// fails, so a flaky API call can never block pool creation.
async function getStartingGw(league: string): Promise<number> {
  try {
    const cfg = LEAGUE_CONFIG[league];
    const hdrs = { "x-apisports-key": API_KEY };
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?league=${cfg.id}&season=${cfg.season}&status=NS`, { headers: hdrs });
    const data = await res.json();
    const upcoming = (data.response || []).sort((a: any, b: any) =>
      new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    );
    if (upcoming.length === 0) return 1;

    // The earliest not-started fixture's round may already have had earlier
    // matches kick off (e.g. one game held back for Monday night) — a pool
    // created mid-round like that would start with a deadline already in the
    // past, and every player would be wrongly graded as "no pick" the moment
    // that round finishes. Skip to the earliest round whose first fixture is
    // still in the future.
    const now = Date.now();
    const roundFirstSeen: string[] = [];
    const roundMinDate: Record<string, string> = {};
    for (const f of upcoming) {
      const r = f.league.round;
      if (!(r in roundMinDate)) {
        roundMinDate[r] = f.fixture.date;
        roundFirstSeen.push(r);
      }
    }
    const round = roundFirstSeen.find((r) => new Date(roundMinDate[r]).getTime() > now);
    if (!round) return 1;
    const match = round.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : 1;
  } catch {
    return 1;
  }
}

// Free, instant pool creation — no payment involved. Mirrors exactly what the
// Stripe webhook used to create on successful LMS payment, minus the payment.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const requestedLeague = typeof req.body?.league === 'string' ? req.body.league.toUpperCase() : 'PL';
  const league = VALID_LEAGUES.includes(requestedLeague) ? requestedLeague : 'PL';

  const poolId = genPoolId();
  const orgToken = generateOrgToken();
  const startingGw = await getStartingGw(league);

  try {
    await redis.set(`lms:pool:${poolId}`, JSON.stringify({
      id: poolId,
      league,
      name: null,
      organiser: null,
      organiserEmail: null,
      orgToken,
      buyIn: null,
      currentGameweek: startingGw,
      lastGradedGw: startingGw - 1,
      wipeoutRule: 'rollback',
      wipeoutWeeks: [] as number[],
      createdAt: Date.now(),
      status: 'pending_setup',
      organiserFeePaid: false,
      organiserFeeNotified: false,
    }), { ex: LMS_TTL });

    await redis.set(`lms:orgtoken:${poolId}`, orgToken, { ex: LMS_TTL });
    await redis.sadd('lms:allpools', poolId);
  } catch (err: any) {
    console.error('Failed to create free LMS pool:', err.message);
    return res.status(500).json({ error: 'Failed to create pool' });
  }

  return res.status(200).json({ poolId, orgToken, setupUrl: `/lms-setup.html?pool=${poolId}&k=${orgToken}` });
}
