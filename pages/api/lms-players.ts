import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const LEAGUE_NAMES: Record<string, string> = {
  PL: 'Premier League',
  CHAMPIONSHIP: 'Championship',
  SPL: 'Scottish Premiership',
  UCL: 'Champions League',
};
function leagueNameFor(league: string | null | undefined) {
  return LEAGUE_NAMES[league || 'PL'] || LEAGUE_NAMES.PL;
}

// The full player table: every player in the pool, whether they're still in,
// and the team they picked in each gameweek that's already been graded.
// Free and open to anyone with the pool link, like the standings ladder.
// Only graded gameweeks are included, so the current round's picks stay
// hidden exactly as they do everywhere else.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { pool, t } = req.query;
  if (!pool || typeof pool !== 'string') return res.status(400).json({ error: 'Missing pool' });

  try {
    const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

    const playersRaw = await redis.hgetall<Record<string, string>>(`lms:pool:${pool}:players`);
    const players = playersRaw
      ? Object.values(playersRaw).map((raw: any) => typeof raw === 'string' ? JSON.parse(raw) : raw)
      : [];
    players.sort((a: any, b: any) => (a.id || 0) - (b.id || 0));

    const you = (t && typeof t === 'string') ? t : null;
    const firstGw: number = poolData.firstGw || 1;
    const lastGradedGw: number = poolData.lastGradedGw || 0;

    const weeks: number[] = [];
    for (let g = firstGw; g <= lastGradedGw; g++) weeks.push(g);

    // One round trip for every gameweek's pick snapshot, not one per week.
    const snapshots = weeks.length > 0
      ? await redis.mget<(string | null)[]>(...weeks.map(g => `lms:pool:${pool}:picks:${g}`))
      : [];

    // Snapshots from before player ids were recorded only have names, so
    // fall back to matching on name for those older weeks.
    const picksById: Record<string, Record<number, string>> = {};
    const picksByName: Record<string, Record<number, string>> = {};
    snapshots.forEach((raw, i) => {
      if (!raw) return;
      const snap = typeof raw === 'string' ? JSON.parse(raw) : raw as any;
      const g = weeks[i];
      (snap.picks || []).forEach((pk: any) => {
        if (pk.id != null) {
          (picksById[String(pk.id)] ||= {})[g] = pk.team;
        } else {
          (picksByName[pk.name] ||= {})[g] = pk.team;
        }
      });
    });

    return res.status(200).json({
      pool: {
        name: poolData.name,
        leagueName: leagueNameFor(poolData.league),
        status: poolData.status,
        winner: poolData.winner || null,
        wipeoutWeeks: poolData.wipeoutWeeks || [],
      },
      weeks,
      players: players.map((p: any) => ({
        name: p.name,
        displayName: p.displayName || null,
        alive: p.alive,
        eliminatedWeek: p.eliminatedWeek,
        jokerUsedWeek: p.jokerUsedWeek,
        isYou: you ? p.token === you : false,
        picks: { ...(picksByName[p.name] || {}), ...(picksById[String(p.id)] || {}), ...(p.pickHistory || {}) },
      })),
    });
  } catch (err: any) {
    console.error('lms-players error:', err.message);
    return res.status(500).json({ error: 'Failed to load players' });
  }
}
