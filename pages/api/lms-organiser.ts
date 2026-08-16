import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();

// Same definition the grading cron uses for "this round is done, ready to
// grade" — kept identical so "current gameweek" here can never disagree
// with when the cron considers a round finished.
const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];

// Same league config as every other LMS endpoint — defaults to PL for pools
// created before this existed, since they were always Premier League pools.
const LEAGUE_CONFIG: Record<string, { id: number; season: number; name: string }> = {
  PL: { id: 39, season: 2026, name: 'Premier League' },
  CHAMPIONSHIP: { id: 40, season: 2026, name: 'Championship' },
  SPL: { id: 179, season: 2026, name: 'Scottish Premiership' },
  UCL: { id: 2, season: 2026, name: 'Champions League' },
};
function leagueConfigFor(league: string | null | undefined) {
  return LEAGUE_CONFIG[league || 'PL'] || LEAGUE_CONFIG.PL;
}

// Same "next round, first kickoff" lookup used by the pick screen — needed here
// so this endpoint can hide the in-progress round's picks until that deadline passes,
// same as everywhere else picks are locked.
async function getUpcomingRound(cfg: { id: number; season: number }): Promise<{ gw: number | null; deadline: string | null }> {
  if (!API_KEY) return { gw: null, deadline: null };
  const hdrs = { "x-apisports-key": API_KEY };
  // Fetch every fixture, not just not-started ones — an already-finished
  // fixture still proves its round has started, and filtering by status=NS
  // would hide exactly that evidence (see lms-pick.ts for the full story).
  const allRes = await fetch(`https://v3.football.api-sports.io/fixtures?league=${cfg.id}&season=${cfg.season}`, { headers: hdrs });
  const allData = await allRes.json();
  const allFixtures = (allData.response || []).sort((a: any, b: any) =>
    new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  );
  if (allFixtures.length === 0) return { gw: null, deadline: null };

  // "Current gameweek" is the earliest round, in chronological order, that
  // hasn't fully finished yet — if it hasn't started, it's open; if it's
  // started but not finished (e.g. one match held back for Monday Night
  // Football), it still correctly shows as that same round rather than
  // jumping ahead to one that merely hasn't started.
  const roundOrder: string[] = [];
  const roundMinDate: Record<string, string> = {};
  const roundFinished: Record<string, boolean> = {};
  for (const f of allFixtures) {
    const r = f.league.round;
    if (!(r in roundMinDate)) {
      roundMinDate[r] = f.fixture.date;
      roundFinished[r] = true;
      roundOrder.push(r);
    }
    if (!FINISHED_STATUSES.includes(f.fixture.status.short)) roundFinished[r] = false;
  }
  const round = roundOrder.find((r) => !roundFinished[r]);
  if (!round) return { gw: null, deadline: null };

  const gwMatch = (round || '').match(/(\d+)$/);
  const gw = gwMatch ? parseInt(gwMatch[1], 10) : null;
  return { gw, deadline: roundMinDate[round] };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { pool, k, playerToken, paid } = req.body;
    if (!pool || !k || !playerToken || typeof paid !== 'boolean') {
      return res.status(400).json({ error: 'Missing pool, k, playerToken, or paid' });
    }

    const storedToken = await redis.get<string>(`lms:orgtoken:${pool}`);
    if (!storedToken || storedToken !== k) {
      return res.status(401).json({ error: 'Invalid organiser link' });
    }

    const playersKey = `lms:pool:${pool}:players`;
    const playerRaw = await redis.hget<string>(playersKey, playerToken);
    if (!playerRaw) return res.status(404).json({ error: 'Player not found' });
    const player = typeof playerRaw === 'string' ? JSON.parse(playerRaw) : playerRaw as any;

    player.paid = paid;
    await redis.hset(playersKey, { [playerToken]: JSON.stringify(player) });

    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'GET') return res.status(405).end();

  const { pool, k } = req.query;
  if (!pool || typeof pool !== 'string' || !k || typeof k !== 'string') {
    return res.status(400).json({ error: 'Missing pool or k' });
  }

  try {
    const storedToken = await redis.get<string>(`lms:orgtoken:${pool}`);
    if (!storedToken || storedToken !== k) {
      return res.status(401).json({ error: 'Invalid organiser link' });
    }

    const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

    const playersRaw = await redis.hgetall<Record<string, string>>(`lms:pool:${pool}:players`);
    const rawPlayers = playersRaw ? Object.values(playersRaw).map((raw: any) => typeof raw === 'string' ? JSON.parse(raw) : raw) : [];

    // Picks for the round still in progress must stay hidden here too, same as
    // everywhere else — an organiser link is not a way to see picks early.
    const upcoming = poolData.status === 'active' ? await getUpcomingRound(leagueConfigFor(poolData.league)) : { gw: null, deadline: null };
    const deadlinePassed = upcoming.deadline ? new Date() >= new Date(upcoming.deadline) : true;
    const players = rawPlayers.map((p: any) => {
      if (!deadlinePassed && p.currentPickGw === upcoming.gw) {
        const { currentPick, currentPickGw, ...rest } = p;
        return rest;
      }
      return p;
    });

    // Organiser identity and player identity are separate tokens with no link
    // between them — but if the organiser also joined their own pool (common),
    // their player record almost always shares the same email they set the
    // pool up with. Matching on that lets pages like the Arena link work for
    // them without asking them to dig out their personal pick link.
    const organiserEmail = (poolData.organiserEmail || '').toLowerCase();
    const ownPlayer = organiserEmail
      ? rawPlayers.find((p: any) => (p.email || '').toLowerCase() === organiserEmail)
      : null;

    return res.status(200).json({
      pool: {
        id: poolData.id,
        name: poolData.name,
        leagueName: leagueConfigFor(poolData.league).name,
        organiser: poolData.organiser,
        buyIn: poolData.buyIn,
        currentGameweek: poolData.currentGameweek,
        status: poolData.status,
        createdAt: poolData.createdAt,
        organiserFeeNotified: poolData.organiserFeeNotified || false,
        organiserFeePaid: poolData.organiserFeePaid || false,
        yourPlayerToken: ownPlayer ? ownPlayer.token : null,
      },
      players,
    });
  } catch (err) {
    console.error('lms-organiser GET error:', err);
    return res.status(500).json({ error: 'Failed to load pool data' });
  }
}
