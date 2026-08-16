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
  SPL: { id: 179, season: 2026, name: 'Scottish Premiership' },
  UCL: { id: 2, season: 2026, name: 'Champions League' },
};
function leagueConfigFor(league: string | null | undefined) {
  return LEAGUE_CONFIG[league || 'PL'] || LEAGUE_CONFIG.PL;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  if (!API_KEY) return res.status(500).json({ error: 'API_FOOTBALL_KEY not configured' });

  const { pool, t } = req.query;
  if (!pool || typeof pool !== 'string') return res.status(400).json({ error: 'Missing pool' });

  const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
  if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
  const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

  const playersRaw = await redis.hgetall<Record<string, string>>(`lms:pool:${pool}:players`);
  const players = playersRaw
    ? Object.values(playersRaw).map((raw: any) => typeof raw === 'string' ? JSON.parse(raw) : raw)
    : [];
  const alivePlayers = players.filter((p: any) => p.alive);

  // The Live Table is a Pro-only feature — anyone viewing it must be a
  // player in this pool who has personally paid for Pro.
  const viewer = (t && typeof t === 'string') ? players.find((p: any) => p.token === t) : null;
  if (!viewer || !viewer.proPaid) {
    return res.status(403).json({
      error: 'pro_required',
      upgradeUrl: t ? `/api/lms-pro-checkout?pool=${pool}&t=${t}` : null,
      fallbackUrl: t ? `/lms-standings.html?pool=${pool}&t=${t}` : `/lms-standings.html?pool=${pool}`,
    });
  }

  try {
    const cfg = leagueConfigFor(poolData.league);
    const hdrs = { "x-apisports-key": API_KEY };
    const standingsRes = await fetch(`https://v3.football.api-sports.io/standings?league=${cfg.id}&season=${cfg.season}`, { headers: hdrs });
    const standingsData = await standingsRes.json();
    const table = standingsData.response?.[0]?.league?.standings?.[0] || [];

    const rows = table.map((row: any) => {
      const teamName = row.team.name;
      const reserveCount = alivePlayers.filter((p: any) => !p.usedTeams.includes(teamName)).length;
      return {
        rank: row.rank,
        team: teamName,
        logo: row.team.logo,
        played: row.all.played,
        goalDiff: row.goalsDiff,
        points: row.points,
        reserveCount,
      };
    });

    return res.status(200).json({
      poolName: poolData.name,
      leagueName: cfg.name,
      aliveCount: alivePlayers.length,
      table: rows,
    });
  } catch (err: any) {
    console.error('lms-table error:', err.message);
    return res.status(500).json({ error: 'Failed to load table', detail: err.message });
  }
}
