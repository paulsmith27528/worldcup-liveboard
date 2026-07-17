import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();
const PL_LEAGUE = 39;
const PL_SEASON = 2026;

// Whatever gameweek is next-upcoming right now becomes this pool's "gameweek 1" -
// important for pools started mid-season, not just at the true start of the season
async function getUpcomingGw(): Promise<{ gw: number | null; deadline: string | null }> {
  if (!API_KEY) return { gw: null, deadline: null };
  try {
    const hdrs = { "x-apisports-key": API_KEY };
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?league=${PL_LEAGUE}&season=${PL_SEASON}&status=NS`, { headers: hdrs });
    const data = await res.json();
    const upcoming = (data.response || []).sort((a: any, b: any) =>
      new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    );
    if (upcoming.length === 0) return { gw: null, deadline: null };
    const round = upcoming[0].league.round;
    const match = round.match(/(\d+)$/);
    const gw = match ? parseInt(match[1], 10) : null;
    return { gw, deadline: upcoming[0].fixture.date };
  } catch (err) {
    console.error('getUpcomingGw failed:', err);
    return { gw: null, deadline: null };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { pool, k } = req.query;
    if (!pool || typeof pool !== 'string' || !k || typeof k !== 'string') {
      return res.status(400).json({ error: 'Missing pool or k' });
    }

    const storedToken = await redis.get<string>(`lms:orgtoken:${pool}`);
    if (!storedToken || storedToken !== k) {
      return res.status(401).json({ error: 'Invalid organiser link' });
    }

    const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

    return res.status(200).json({
      status: poolData.status,
      name: poolData.name,
      organiser: poolData.organiser,
      buyIn: poolData.buyIn,
    });
  }

  if (req.method === 'POST') {
    const { pool, k, organiserName, roundName, buyIn } = req.body;
    if (!pool || !k || !organiserName || !roundName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const storedToken = await redis.get<string>(`lms:orgtoken:${pool}`);
    if (!storedToken || storedToken !== k) {
      return res.status(401).json({ error: 'Invalid organiser link' });
    }

    const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

    poolData.name = String(roundName).trim();
    poolData.organiser = String(organiserName).trim();
    poolData.buyIn = buyIn ? Number(buyIn) : null;
    poolData.status = 'active';

    // Lock in this pool's own "gameweek 1" - whatever's next-upcoming right now,
    // not necessarily the season's actual gameweek 1 (pools can start mid-season)
    const upcoming = await getUpcomingGw();
    poolData.startGw = upcoming.gw;
    poolData.startGwDeadline = upcoming.deadline;

    await redis.set(`lms:pool:${pool}`, JSON.stringify(poolData));

    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
