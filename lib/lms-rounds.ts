import type { Redis } from '@upstash/redis';

// The one place that decides what a "gameweek" is, when it locks, when it's
// over and what each team's result was. Every LMS endpoint and cron uses
// this, so the pick page, auto-pick, grading and every display page can never
// disagree about which week it is.

export const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'WO'];
// Postponed, cancelled or abandoned: no result this gameweek, so anyone who
// picked either team goes through (a bye), but the team still counts as used.
export const BYE_STATUSES = ['PST', 'CANC', 'ABD'];

export const LEAGUE_CONFIG: Record<string, { id: number; season: number; name: string; roundPrefix: string }> = {
  PL: { id: 39, season: 2026, name: 'Premier League', roundPrefix: 'Regular Season' },
  CHAMPIONSHIP: { id: 40, season: 2026, name: 'Championship', roundPrefix: 'Regular Season' },
  SPL: { id: 179, season: 2026, name: 'Scottish Premiership', roundPrefix: 'Regular Season' },
  UCL: { id: 2, season: 2026, name: 'Champions League', roundPrefix: 'League Stage' },
};

// Defaults to PL for pools created before leagues existed. A pool remembers
// the season it was created in, so next season's pools don't read this one's.
export function leagueConfigFor(league: string | null | undefined, season?: number | null) {
  const cfg = LEAGUE_CONFIG[league || 'PL'] || LEAGUE_CONFIG.PL;
  return season ? { ...cfg, season } : cfg;
}

export interface Fixture {
  id: number;
  date: string;
  round: string;
  status: string;
  elapsed: number | null;
  venue: string;
  home: { id: number; name: string; logo: string; winner: boolean | null };
  away: { id: number; name: string; logo: string; winner: boolean | null };
  goals: { home: number | null; away: number | null };
}

export interface Round {
  gw: number;
  name: string;
  // Fixtures that belong to this gameweek's window, in kickoff order. A match
  // rescheduled to weeks later is not in here; it's in movedOut.
  fixtures: Fixture[];
  movedOut: Fixture[];
  // First kickoff: picks lock here.
  deadline: string;
  // Every fixture in the window has a result or was postponed/cancelled.
  over: boolean;
  // Teams with a real match this gameweek that hasn't kicked off yet.
  pickableTeams: string[];
  // Teams whose match didn't happen this gameweek (postponed, cancelled,
  // abandoned, or moved out of the round).
  byeTeams: string[];
  // Only meaningful once over: W/D/L for every team that played.
  results: Record<string, 'W' | 'D' | 'L'>;
}

const DAY = 24 * 60 * 60 * 1000;
// A PL round runs Friday to Monday; a fixture more than this far from the
// middle of its round has been moved to another date.
const WINDOW_MS = 6 * DAY;

function trim(f: any): Fixture {
  return {
    id: f.fixture.id,
    date: f.fixture.date,
    round: f.league.round,
    status: f.fixture.status.short,
    elapsed: f.fixture.status.elapsed ?? null,
    venue: f.fixture.venue?.name || '',
    home: { id: f.teams.home.id, name: f.teams.home.name, logo: f.teams.home.logo, winner: f.teams.home.winner ?? null },
    away: { id: f.teams.away.id, name: f.teams.away.name, logo: f.teams.away.logo, winner: f.teams.away.winner ?? null },
    goals: { home: f.goals?.home ?? null, away: f.goals?.away ?? null },
  };
}

const time = (d: string) => new Date(d).getTime();

// Groups a season's fixtures into numbered gameweeks. Only "<prefix> - N"
// rounds count; cup knockout rounds ("Round of 16") are not gameweeks.
export function buildRounds(fixtures: Fixture[], roundPrefix: string, now = Date.now()): Round[] {
  const pattern = new RegExp(`^${roundPrefix} - (\\d+)$`);
  const groups: Record<number, Fixture[]> = {};
  for (const f of fixtures) {
    const m = (f.round || '').match(pattern);
    if (!m) continue;
    const gw = parseInt(m[1], 10);
    (groups[gw] = groups[gw] || []).push(f);
  }

  const gws = Object.keys(groups).map(Number).sort((a, b) => a - b);
  // First pass: which fixtures sit in each round's own window.
  const windows = gws.map(gw => {
    const all = groups[gw].slice().sort((a, b) => time(a.date) - time(b.date));
    const middle = time(all[Math.floor(all.length / 2)].date);
    const inside = all.filter(f => Math.abs(time(f.date) - middle) <= WINDOW_MS);
    return { gw, all, inside };
  });

  return windows.map(({ gw, all, inside }, i) => {
    // A match that still hasn't been played by the time the next gameweek
    // starts has been moved out of this one, even if it's only a few days.
    const next = windows[i + 1];
    const nextStart = next && next.inside.length ? time(next.inside[0].date) : Infinity;
    const fixturesIn = inside.filter(f =>
      FINISHED_STATUSES.includes(f.status) || BYE_STATUSES.includes(f.status) || time(f.date) < nextStart);
    const movedOut = all.filter(f => !fixturesIn.includes(f));

    const results: Record<string, 'W' | 'D' | 'L'> = {};
    const byeTeams = new Set<string>();
    for (const f of movedOut) { byeTeams.add(f.home.name); byeTeams.add(f.away.name); }
    let over = fixturesIn.length > 0;
    for (const f of fixturesIn) {
      if (BYE_STATUSES.includes(f.status)) {
        byeTeams.add(f.home.name);
        byeTeams.add(f.away.name);
      } else if (FINISHED_STATUSES.includes(f.status)) {
        if (f.home.winner === true) { results[f.home.name] = 'W'; results[f.away.name] = 'L'; }
        else if (f.away.winner === true) { results[f.away.name] = 'W'; results[f.home.name] = 'L'; }
        else { results[f.home.name] = 'D'; results[f.away.name] = 'D'; }
      } else {
        over = false;
      }
    }

    const pickableTeams: string[] = [];
    for (const f of fixturesIn) {
      if (f.status !== 'NS' && f.status !== 'TBD') continue;
      if (time(f.date) <= now) continue;
      pickableTeams.push(f.home.name, f.away.name);
    }

    return {
      gw,
      name: `${roundPrefix} - ${gw}`,
      fixtures: fixturesIn,
      movedOut,
      deadline: (fixturesIn[0] || all[0]).date,
      over,
      pickableTeams,
      byeTeams: Array.from(byeTeams),
      results,
    };
  });
}

export class FixturesUnavailable extends Error {}

// The whole season's fixtures for one league. API-Football answers a rate
// limit or outage with HTTP 200, an "errors" object and no fixtures, so an
// empty or errored answer throws rather than looking like "no matches".
// Cached briefly in Redis because every page view needs it; grading asks
// for fresh data.
export async function getSeasonFixtures(redis: Redis, cfg: { id: number; season: number }, opts: { fresh?: boolean } = {}): Promise<Fixture[]> {
  const cacheKey = `lms:fixtures-cache:${cfg.id}:${cfg.season}`;
  if (!opts.fresh) {
    const cached = await redis.get<any>(cacheKey).catch(() => null);
    if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;
  }
  const apiKey = (process.env.API_FOOTBALL_KEY || '').trim();
  if (!apiKey) throw new FixturesUnavailable('API_FOOTBALL_KEY not configured');
  const res = await fetch(`https://v3.football.api-sports.io/fixtures?league=${cfg.id}&season=${cfg.season}`, {
    headers: { 'x-apisports-key': apiKey },
  });
  if (!res.ok) throw new FixturesUnavailable(`API-Football HTTP ${res.status}`);
  const data = await res.json();
  const errors = data.errors && (Array.isArray(data.errors) ? data.errors.length : Object.keys(data.errors).length);
  if (errors) throw new FixturesUnavailable(`API-Football error: ${JSON.stringify(data.errors)}`);
  if (!Array.isArray(data.response) || data.response.length === 0) throw new FixturesUnavailable('API-Football returned no fixtures');
  const fixtures = data.response.map(trim);
  await redis.set(cacheKey, JSON.stringify(fixtures), { ex: 60 }).catch(() => {});
  return fixtures;
}

export async function getRounds(redis: Redis, cfg: { id: number; season: number; roundPrefix: string }, opts: { fresh?: boolean } = {}) {
  return buildRounds(await getSeasonFixtures(redis, cfg, opts), cfg.roundPrefix);
}

// The gameweek players are on now: the earliest one that isn't over. Open
// for picks until its deadline, then locked until it's over.
export function currentRound(rounds: Round[]): Round | null {
  return rounds.find(r => !r.over) || null;
}

export function roundByGw(rounds: Round[], gw: number): Round | null {
  return rounds.find(r => r.gw === gw) || null;
}

// Once a gameweek has locked it stays locked, even if its first match is
// later postponed and moved: the first lock time seen is remembered.
export async function lockedAt(redis: Redis, cfg: { id: number; season: number }, round: Round): Promise<string | null> {
  const key = `lms:locked:${cfg.id}:${cfg.season}:${round.gw}`;
  const stored = await redis.get<string>(key).catch(() => null);
  if (stored) return stored;
  if (Date.now() >= time(round.deadline)) {
    await redis.set(key, round.deadline, { ex: 400 * 24 * 60 * 60 }).catch(() => {});
    return round.deadline;
  }
  return null;
}

export async function isLocked(redis: Redis, cfg: { id: number; season: number }, round: Round) {
  return (await lockedAt(redis, cfg, round)) !== null;
}

// For pages that only need "which gameweek is it and are picks locked".
// Never throws: if fixtures can't be fetched, locked is null (unknown), and
// callers must then treat this week's picks as still secret.
export async function upcomingRoundInfo(redis: Redis, cfg: { id: number; season: number; roundPrefix: string }): Promise<{ gw: number | null; deadline: string | null; locked: boolean | null }> {
  try {
    const round = currentRound(await getRounds(redis, cfg));
    if (!round) return { gw: null, deadline: null, locked: null };
    return { gw: round.gw, deadline: round.deadline, locked: await isLocked(redis, cfg, round) };
  } catch (err: any) {
    console.error('upcomingRoundInfo failed:', err.message);
    return { gw: null, deadline: null, locked: null };
  }
}
