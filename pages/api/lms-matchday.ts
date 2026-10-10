import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import { leagueConfigFor, upcomingRoundInfo } from '../../lib/lms-rounds';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();

const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT'];
const FIXTURES_CACHE_TTL = 30; // seconds — shared across every viewer, not per-request

async function getRoundFixtures(cfg: { id: number; season: number; roundPrefix: string }, gw: number) {
  const cacheKey = `lms:matchday-cache:${cfg.id}:${cfg.season}:${gw}`;
  const cached = await redis.get<string>(cacheKey);
  if (cached) {
    return typeof cached === 'string' ? JSON.parse(cached) : cached;
  }

  const hdrs = { "x-apisports-key": API_KEY };
  const round = `${cfg.roundPrefix} - ${gw}`;
  const res = await fetch(`https://v3.football.api-sports.io/fixtures?league=${cfg.id}&season=${cfg.season}&round=${encodeURIComponent(round)}`, { headers: hdrs });
  const data = await res.json();

  const fixtures = (data.response || []).map((f: any) => ({
    id: f.fixture.id,
    date: f.fixture.date,
    status: f.fixture.status.short,
    elapsed: f.fixture.status.elapsed,
    home: { id: f.teams.home.id, name: f.teams.home.name, logo: f.teams.home.logo },
    away: { id: f.teams.away.id, name: f.teams.away.name, logo: f.teams.away.logo },
    goals: { home: f.goals.home, away: f.goals.away },
  })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  await redis.set(cacheKey, JSON.stringify(fixtures), { ex: FIXTURES_CACHE_TTL });
  return fixtures;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  if (!API_KEY) return res.status(500).json({ error: 'API_FOOTBALL_KEY not configured' });

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
    // Redis hash field order isn't guaranteed stable — sort by join order so
    // each fixture's pick-avatar row doesn't shuffle position between loads.
    players.sort((a: any, b: any) => (a.id || 0) - (b.id || 0));

    const you = (t && typeof t === 'string') ? t : null;

    // Same Pro-only rule as the Arena, and the same "no dead-end paywall"
    // fix — upgradeUrl/fallbackUrl follow the identical shape so the
    // frontend can reuse the Arena's pro-gate + email-lookup fallback.
    const viewer = you ? players.find((p: any) => p.token === you) : null;
    if (!viewer || !viewer.proPaid) {
      return res.status(403).json({
        error: 'pro_required',
        upgradeUrl: you ? `/api/lms-pro-checkout?pool=${encodeURIComponent(pool)}&t=${encodeURIComponent(you)}` : null,
        fallbackUrl: you ? `/lms-standings.html?pool=${pool}&t=${you}` : `/lms-standings.html?pool=${pool}`,
      });
    }

    const cfg = leagueConfigFor(poolData.league, poolData.season);
    const gw: number = poolData.currentGameweek || 1;
    const fixtures = await getRoundFixtures(cfg, gw);

    // Picks stay secret until the gameweek's first kickoff, same as
    // everywhere else. If we can't tell, they stay hidden.
    const upcoming = await upcomingRoundInfo(redis, cfg, poolData.lastGradedGw ?? 0);
    const picksVisible = upcoming.gw !== null && (gw < upcoming.gw || (gw === upcoming.gw && upcoming.locked === true));
    // A player's pick for this week: their current one, or one kept aside
    // because they've already picked for the following week.
    const pickOf = (p: any) => !picksVisible ? null
      : p.currentPickGw === gw ? p.currentPick : (p.pendingPicks?.[String(gw)]?.team || null);

    const anyLive = fixtures.some((f: any) => LIVE_STATUSES.includes(f.status));
    const allFinished = fixtures.length > 0 && fixtures.every((f: any) =>
      ['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(f.status)
    );

    const fixturesWithPicks = fixtures.map((f: any) => ({
      ...f,
      homePicks: players
        .filter((p: any) => pickOf(p) === f.home.name)
        .map((p: any) => ({ name: p.name, displayName: p.displayName || null, avatarUrl: p.avatarUrl || null, alive: p.alive })),
      awayPicks: players
        .filter((p: any) => pickOf(p) === f.away.name)
        .map((p: any) => ({ name: p.name, displayName: p.displayName || null, avatarUrl: p.avatarUrl || null, alive: p.alive })),
    }));

    return res.status(200).json({
      pool: { name: poolData.name, leagueName: cfg.name },
      gw,
      fixtures: fixturesWithPicks,
      anyLive,
      allFinished,
      picksVisible,
    });
  } catch (err: any) {
    console.error('lms-matchday error:', err.message);
    return res.status(500).json({ error: 'Failed to load match day data', detail: err.message });
  }
}
