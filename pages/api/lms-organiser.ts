import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();

// Same league config as every other LMS endpoint — defaults to PL for pools
// created before this existed, since they were always Premier League pools.
const LEAGUE_CONFIG: Record<string, { id: number; season: number; name: string }> = {
  PL: { id: 39, season: 2026, name: 'Premier League' },
  CHAMPIONSHIP: { id: 40, season: 2026, name: 'Championship' },
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
  const upcomingRes = await fetch(`https://v3.football.api-sports.io/fixtures?league=${cfg.id}&season=${cfg.season}&status=NS`, { headers: hdrs });
  const upcomingData = await upcomingRes.json();
  const upcoming = (upcomingData.response || []).sort((a: any, b: any) =>
    new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  );
  if (upcoming.length === 0) return { gw: null, deadline: null };

  const round = upcoming[0].league.round;
  const gwMatch = (round || '').match(/(\d+)$/);
  const gw = gwMatch ? parseInt(gwMatch[1], 10) : null;
  return { gw, deadline: upcoming[0].fixture.date };
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
      },
      players,
    });
  } catch (err) {
    console.error('lms-organiser GET error:', err);
    return res.status(500).json({ error: 'Failed to load pool data' });
  }
}
