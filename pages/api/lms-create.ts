import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import { randomBytes } from 'crypto';
import { getRounds, currentRound, isLocked, leagueConfigFor } from '../../lib/lms-rounds';
import { genPoolId, POOL_ID_ATTEMPTS } from '../../lib/lms-ids';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const LMS_TTL = 60 * 60 * 24 * 300; // 300 days — covers a full PL season

// Which competitions this button can create a pool for — each is its own
// separate product on the landing page, run and charged independently.
const VALID_LEAGUES = ['PL', 'CHAMPIONSHIP', 'UCL', 'SPL'];

// A new pool starts on the next gameweek players can still pick for: the
// current one if it hasn't kicked off, otherwise the one after. Falls back
// to 1 if fixtures can't be fetched, so a flaky API call never blocks
// pool creation.
async function getStartingGw(league: string): Promise<number> {
  try {
    const cfg = leagueConfigFor(league);
    const rounds = await getRounds(redis, cfg);
    const round = currentRound(rounds);
    if (!round) return 1;
    if (!(await isLocked(redis, cfg, round))) return round.gw;
    const next = rounds[rounds.indexOf(round) + 1];
    return next ? next.gw : round.gw;
  } catch {
    return 1;
  }
}

function generateOrgToken(): string {
  return randomBytes(32).toString('hex');
}


// Free, instant pool creation — no payment involved. Mirrors exactly what the
// Stripe webhook used to create on successful LMS payment, minus the payment.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const requestedLeague = typeof req.body?.league === 'string' ? req.body.league.toUpperCase() : 'PL';
  const league = VALID_LEAGUES.includes(requestedLeague) ? requestedLeague : 'PL';

  let poolId = '';
  const orgToken = generateOrgToken();
  const startingGw = await getStartingGw(league);

  try {
    // NX so a clash with an existing pool's id can never overwrite it —
    // just try again with a fresh id.
    for (let attempt = 0; attempt < POOL_ID_ATTEMPTS && !poolId; attempt++) {
      const candidate = genPoolId();
      const created = await redis.set(`lms:pool:${candidate}`, JSON.stringify({
        id: candidate,
        league,
        // Which season's fixtures this pool plays, so it keeps working once
        // the next season's pools exist.
        season: leagueConfigFor(league).season,
        name: null,
        organiser: null,
        organiserEmail: null,
        orgToken,
        buyIn: null,
        // Permanent record of the real gameweek this pool actually started
        // on — currentGameweek/lastGradedGw both move forward as the season
        // progresses, so this is the only place that fact is preserved.
        firstGw: startingGw,
        currentGameweek: startingGw,
        lastGradedGw: startingGw - 1,
        wipeoutRule: 'rollback',
        wipeoutWeeks: [] as number[],
        createdAt: Date.now(),
        status: 'pending_setup',
        organiserFeePaid: false,
        organiserFeeNotified: false,
      }), { ex: LMS_TTL, nx: true });
      if (created) poolId = candidate;
    }
    if (!poolId) throw new Error('Could not find a free pool id');

    await redis.set(`lms:orgtoken:${poolId}`, orgToken, { ex: LMS_TTL });
    await redis.sadd('lms:allpools', poolId);
  } catch (err: any) {
    console.error('Failed to create free LMS pool:', err.message);
    return res.status(500).json({ error: 'Failed to create pool' });
  }

  return res.status(200).json({ poolId, orgToken, setupUrl: `/lms-setup.html?pool=${poolId}&k=${orgToken}` });
}
