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

// Find the gw and deadline (first kickoff) of the next round nobody has picked yet.
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

    const you = (t && typeof t === 'string') ? t : null;

    // The visual Arena itself is free to view for everyone — only sending
    // reactions and the per-round popularity breakdown stay Pro-only.
    const viewer = you ? players.find((p: any) => p.token === you) : null;
    const isPro = !!(viewer && viewer.proPaid);
    const upgradeUrl = you ? `/api/lms-pro-checkout?pool=${pool}&t=${you}` : null;

    const reactionsRaw = await redis.hgetall<Record<string, string>>(`lms:pool:${pool}:reactions`);
    const reactions: Record<string, Record<string, number>> = {};
    if (reactionsRaw) {
      for (const [field, count] of Object.entries(reactionsRaw)) {
        const sep = field.indexOf(':');
        const pid = field.slice(0, sep);
        const emoji = field.slice(sep + 1);
        if (!reactions[pid]) reactions[pid] = {};
        reactions[pid][emoji] = parseInt(count as string, 10);
      }
    }

    const lastGradedGw: number = poolData.lastGradedGw || 0;
    const wipeoutWeeks: number[] = poolData.wipeoutWeeks || [];
    const aliveCount = players.filter((p: any) => p.alive).length;

    const paidCount = players.filter((p: any) => p.paid).length;
    const pot = poolData.buyIn ? {
      buyIn: poolData.buyIn,
      potential: poolData.buyIn * players.length,
      collected: poolData.buyIn * paidCount,
      paidCount,
    } : null;

    const rounds = [];
    for (let g = 1; g <= lastGradedGw; g++) {
      if (wipeoutWeeks.includes(g)) {
        rounds.push({ gw: g, wipeout: true, totalPlayers: null, popularity: null, noPick: null });
        continue;
      }
      const picksRaw = await redis.get<string>(`lms:pool:${pool}:picks:${g}`);
      if (!picksRaw) {
        rounds.push({ gw: g, wipeout: false, totalPlayers: null, popularity: null, noPick: null });
        continue;
      }
      const picksData = typeof picksRaw === 'string' ? JSON.parse(picksRaw) : picksRaw as any;
      const total = picksData.totalPlayers || 0;
      const popularity = Object.entries(picksData.counts || {})
        .map(([team, count]) => ({ team, count: count as number, pct: total > 0 ? Math.round((count as number) / total * 100) : 0 }))
        .sort((a, b) => b.count - a.count);
      // Popularity breakdown stays Pro-only even though the ladder itself
      // is now free — non-Pro viewers get totalPlayers (so the sheet can
      // still say "X picked this round") but not the per-team split.
      rounds.push({ gw: g, wipeout: false, totalPlayers: total, popularity: isPro ? popularity : null, noPick: picksData.noPick ?? 0 });
    }

    const upcoming = poolData.status === 'active' ? await getUpcomingRound(leagueConfigFor(poolData.league)) : { gw: null, deadline: null };
    const locked = upcoming.deadline ? new Date() < new Date(upcoming.deadline) : true;

    return res.status(200).json({
      pool: {
        name: poolData.name,
        leagueName: leagueConfigFor(poolData.league).name,
        organiser: poolData.organiser,
        status: poolData.status,
        winner: poolData.winner || null,
        lastGradedGw,
      },
      players: players.map((p: any) => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName || null,
        avatarUrl: p.avatarUrl || null,
        alive: p.alive,
        eliminatedWeek: p.eliminatedWeek,
        jokerUsedWeek: p.jokerUsedWeek,
        isYou: you ? p.token === you : false,
      })),
      startersCount: players.length,
      aliveCount,
      pot,
      rounds,
      current: {
        gw: upcoming.gw,
        deadline: upcoming.deadline,
        locked,
      },
      reactions,
      isPro,
      upgradeUrl,
    });
  } catch (err: any) {
    console.error('lms-arena error:', err.message);
    return res.status(500).json({ error: 'Failed to load arena data', detail: err.message });
  }
}
