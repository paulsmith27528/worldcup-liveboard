import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import { leagueConfigFor, upcomingRoundInfo } from '../../lib/lms-rounds';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();

// Same definition the grading cron uses for "this round is done, ready to
// grade" — kept identical so "current gameweek" here can never disagree
// with when the cron considers a round finished.


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
    // Redis hash field order isn't guaranteed stable across requests — sort
    // by join order (id is a timestamp set once at join) so a player always
    // renders in the same position, instead of visibly shuffling on reload.
    players.sort((a: any, b: any) => (a.id || 0) - (b.id || 0));

    const you = (t && typeof t === 'string') ? t : null;

    // The Arena is a Pro-only feature — anyone viewing it must be a player
    // in this pool who has personally paid for Pro, not just anyone with
    // the link (and not the organiser view, which carries no player token).
    const viewer = you ? players.find((p: any) => p.token === you) : null;
    if (!viewer || !viewer.proPaid) {
      return res.status(403).json({
        error: 'pro_required',
        upgradeUrl: you ? `/api/lms-pro-checkout?pool=${pool}&t=${you}` : null,
        fallbackUrl: you ? `/lms-standings.html?pool=${pool}&t=${you}` : `/lms-standings.html?pool=${pool}`,
      });
    }

    const lastGradedGw: number = poolData.lastGradedGw || 0;
    // firstGw is the real gameweek this pool actually started on — a pool
    // created mid-season (e.g. GW6) has no rounds before that, so the loop
    // below must not start counting from 1. Falls back to 1 for pools
    // created before this field existed, which were always season-start pools.
    const firstGw: number = poolData.firstGw || 1;
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
    for (let g = firstGw; g <= lastGradedGw; g++) {
      const wipeout = wipeoutWeeks.includes(g);
      const picksRaw = await redis.get<string>(`lms:pool:${pool}:picks:${g}`);
      if (!picksRaw) {
        rounds.push({ gw: g, wipeout, totalPlayers: null, pickedCount: null, popularity: null, picks: null, noPick: null });
        continue;
      }
      const picksData = typeof picksRaw === 'string' ? JSON.parse(picksRaw) : picksRaw as any;
      const total = picksData.totalPlayers || 0;
      // Percentages are of the players who actually picked.
      const picked = Math.max(0, total - (picksData.noPick || 0));
      const popularity = Object.entries(picksData.counts || {})
        .map(([team, count]) => ({ team, count: count as number, pct: picked > 0 ? Math.round((count as number) / picked * 100) : 0 }))
        .sort((a, b) => b.count - a.count);
      // Only present for rounds graded after this field was added — older
      // snapshots only have the aggregate counts, not who picked what.
      rounds.push({ gw: g, wipeout, totalPlayers: total, pickedCount: picked, popularity, picks: picksData.picks || null, noPick: picksData.noPick ?? 0 });
    }

    const upcoming = poolData.status === 'active' ? await upcomingRoundInfo(redis, leagueConfigFor(poolData.league, poolData.season)) : { gw: null, deadline: null, locked: true };
    // true while this week's picks are still open (and so still secret)
    const locked = upcoming.locked !== true;

    return res.status(200).json({
      pool: {
        name: poolData.name,
        leagueName: leagueConfigFor(poolData.league, poolData.season).name,
        organiser: poolData.organiser,
        status: poolData.status,
        winner: poolData.winner || null,
        lastGradedGw,
        firstGw,
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
    });
  } catch (err: any) {
    console.error('lms-arena error:', err.message);
    return res.status(500).json({ error: 'Failed to load arena data', detail: err.message });
  }
}
