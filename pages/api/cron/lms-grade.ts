import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import sgMail from '@sendgrid/mail';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();

// Every LMS product (Premier League, Championship, Champions League, ...) is
// the same game running against a different competition. roundPrefix matters
// because we construct round names ourselves here (e.g. "Regular Season - 5")
// to ask API-Football for a specific gameweek's results — cup competitions
// like the Champions League name rounds differently ("League Stage - 5")
// during their league phase, and switch to named knockout rounds
// ("Quarter-finals") after that, which this doesn't attempt to handle.
// Defaults to PL for pools created before this existed.
const LEAGUE_CONFIG: Record<string, { id: number; season: number; name: string; roundPrefix: string }> = {
  PL: { id: 39, season: 2026, name: 'Premier League', roundPrefix: 'Regular Season' },
  CHAMPIONSHIP: { id: 40, season: 2026, name: 'Championship', roundPrefix: 'Regular Season' },
  UCL: { id: 2, season: 2026, name: 'Champions League', roundPrefix: 'League Stage' },
};
function leagueConfigFor(league: string | null | undefined) {
  return LEAGUE_CONFIG[league || 'PL'] || LEAGUE_CONFIG.PL;
}

const BASE_URL = process.env.BASE_URL!;
const FROM_EMAIL = 'noreply@worldcupsweepstake-liveboard.com';
const FROM_NAME = 'Last Man Standing';

const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];

interface Player {
  id: number;
  name: string;
  email: string;
  token: string;
  usedTeams: string[];
  currentPick: string | null;
  currentPickGw: number | null;
  alive: boolean;
  eliminatedWeek: number | null;
  hasLife: boolean;
  lifeUsedWeek: number | null;
}

// Find the highest gameweek number where every fixture has finished
async function findLatestFinishedGw(cfg: { id: number; season: number }): Promise<number> {
  const hdrs = { "x-apisports-key": API_KEY };
  const res = await fetch(`https://v3.football.api-sports.io/fixtures?league=${cfg.id}&season=${cfg.season}`, { headers: hdrs });
  const data = await res.json();
  const fixtures = data.response || [];

  const byRound: Record<number, any[]> = {};
  fixtures.forEach((f: any) => {
    const match = (f.league.round || '').match(/(\d+)$/);
    if (!match) return;
    const gw = parseInt(match[1], 10);
    if (!byRound[gw]) byRound[gw] = [];
    byRound[gw].push(f);
  });

  let latest = 0;
  Object.keys(byRound).forEach((gwStr) => {
    const gw = parseInt(gwStr, 10);
    const allFinished = byRound[gw].every((f: any) => FINISHED_STATUSES.includes(f.fixture.status.short));
    if (allFinished && gw > latest) latest = gw;
  });

  return latest;
}

// Get win/draw/loss result per team name for a specific gameweek
async function getGwResults(gw: number, cfg: { id: number; season: number; roundPrefix: string }): Promise<Record<string, 'W' | 'D' | 'L'>> {
  const hdrs = { "x-apisports-key": API_KEY };
  const round = `${cfg.roundPrefix} - ${gw}`;
  const res = await fetch(`https://v3.football.api-sports.io/fixtures?league=${cfg.id}&season=${cfg.season}&round=${encodeURIComponent(round)}`, { headers: hdrs });
  const data = await res.json();

  const results: Record<string, 'W' | 'D' | 'L'> = {};
  (data.response || []).forEach((f: any) => {
    const home = f.teams.home;
    const away = f.teams.away;
    if (home.winner === true) {
      results[home.name] = 'W';
      results[away.name] = 'L';
    } else if (away.winner === true) {
      results[away.name] = 'W';
      results[home.name] = 'L';
    } else {
      results[home.name] = 'D';
      results[away.name] = 'D';
    }
  });

  return results;
}

function buildEmail(icon: string, color: string, title: string, poolName: string, gw: number, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="format-detection" content="telephone=no, address=no, email=no, date=no, url=no"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid ${color}4d;border-radius:18px;padding:32px">
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:52px;margin-bottom:12px">${icon}</div>
      <h1 style="color:${color};font-size:22px;font-weight:900;margin:0 0 6px">${title}</h1>
      <p style="color:#475569;font-size:13px;margin:0">${poolName} &middot; Gameweek ${gw}</p>
    </div>
    ${bodyHtml}
  </div>
</div>
</body>
</html>`;
}

async function sendPlayerEmail(player: Player, poolId: string, poolName: string, gw: number, type: 'survived' | 'eliminated' | 'no_pick' | 'wipeout' | 'life_used' | 'you_won' | 'pool_won', winnerName?: string) {
  const hubUrl = `${BASE_URL}/lms-join.html?pool=${poolId}`;
  let html = '';
  let subject = '';

  if (type === 'survived') {
    subject = `\u2705 You're through — Gameweek ${gw}`;
    html = buildEmail('&#9989;', '#34d399', "You're Through!",  poolName, gw,
      `<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px">Nice one — <strong style="color:#fff">${player.currentPick}</strong> won. You're still in the pool for the next round.</p>`);
  } else if (type === 'life_used') {
    subject = `\uD83D\uDEE1\uFE0F Life used — you're still in! (Gameweek ${gw})`;
    const reason = player.currentPick
      ? `Your pick, <strong style="color:#fff">${player.currentPick}</strong>, didn't win this week`
      : `You didn't make a pick before the deadline this gameweek`;
    html = buildEmail('&#128737;&#65039;', '#ffd54a', "Life Used — You're Still In!",  poolName, gw,
      `<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px">${reason}, so you've used your one life to survive. You're still in the pool — but you're out of lives now, so the next loss is game over. Good luck!</p>`);
  } else if (type === 'eliminated') {
    subject = `\u2620\ufe0f You're out — Gameweek ${gw}`;
    html = buildEmail('&#128128;', '#ef4444', "You're Out",  poolName, gw,
      `<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px">Your pick, <strong style="color:#fff">${player.currentPick}</strong>, didn't win this week. You've already used your life, so you've been eliminated from the pool. Thanks for playing — good luck to whoever's left!</p>`);
  } else if (type === 'no_pick') {
    subject = `\u2620\ufe0f You're out — no pick made (Gameweek ${gw})`;
    html = buildEmail('&#128128;', '#ef4444', "You're Out",  poolName, gw,
      `<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px">You didn't make a pick before the deadline this gameweek, and you'd already used your life, so you've been eliminated from the pool. Thanks for playing!</p>`);
  } else if (type === 'wipeout') {
    subject = `\u267b\ufe0f Gameweek ${gw} wiped out — everyone survives`;
    html = buildEmail('&#9851;', '#ffd54a', "Total Wipeout!",  poolName, gw,
      `<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px">Every player still standing lost or drew this gameweek — so under the rules, it doesn't count. Nobody's eliminated, nobody's team is used up, and nobody's life is touched. Everyone carries on to the next round!</p>`);
  } else if (type === 'you_won') {
    subject = `\uD83D\uDC51 You won the pool! — ${poolName}`;
    html = buildEmail('&#128081;', '#ffd54a', "You Won!",  poolName, gw,
      `<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px">You're the last one standing — congratulations! This pool is now finished. If you want to run it back, ask your organiser to set up a new pool.</p>`);
  } else {
    subject = `\uD83D\uDC51 ${winnerName} won the pool — ${poolName}`;
    html = buildEmail('&#128081;', '#ffd54a', "We Have a Winner",  poolName, gw,
      `<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px"><strong style="color:#fff">${winnerName}</strong> is the last one standing and wins the pool! Thanks for playing — this pool is now finished. Ask your organiser to set up a new one to play again.</p>`);
  }

  try {
    await sgMail.send({
      to: player.email,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      html,
      trackingSettings: {
        clickTracking: { enable: false, enableText: false },
        openTracking: { enable: false },
      },
    });
  } catch (err: any) {
    console.error(`Grading email failed for ${player.email}:`, err.message);
  }
}

async function gradePool(poolId: string, gw: number, results: Record<string, 'W' | 'D' | 'L'>) {
  const poolRaw = await redis.get<string>(`lms:pool:${poolId}`);
  if (!poolRaw) return;
  const pool = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;
  if (pool.status !== 'active') return;

  const playersKey = `lms:pool:${poolId}:players`;
  const playersRaw = await redis.hgetall<Record<string, string>>(playersKey);
  if (!playersRaw) return;

  const players: Player[] = Object.values(playersRaw).map((raw: any) => typeof raw === 'string' ? JSON.parse(raw) : raw);
  const alivePlayers = players.filter(p => p.alive);

  if (alivePlayers.length === 0) {
    pool.lastGradedGw = gw;
    pool.currentGameweek = gw + 1;
    await redis.set(`lms:pool:${poolId}`, JSON.stringify(pool));
    return;
  }

  const survivors: Player[] = [];
  const losers: Player[] = [];
  const noPicks: Player[] = [];

  alivePlayers.forEach(p => {
    if (p.currentPickGw !== gw || !p.currentPick) {
      noPicks.push(p);
      return;
    }
    const result = results[p.currentPick];
    if (result === 'W') {
      survivors.push(p);
    } else {
      losers.push(p);
    }
  });

  const wipeout = (losers.length + noPicks.length) === alivePlayers.length;

  // Snapshot who picked what this gameweek, permanently — currentPick gets
  // overwritten the moment a player makes their next pick, so this is the
  // only record of round-by-round pick popularity once the season moves on.
  const pickCounts: Record<string, number> = {};
  [...survivors, ...losers].forEach(p => {
    pickCounts[p.currentPick as string] = (pickCounts[p.currentPick as string] || 0) + 1;
  });
  const picksTTL = 60 * 60 * 24 * 300;
  await redis.set(`lms:pool:${poolId}:picks:${gw}`, JSON.stringify({
    gw,
    totalPlayers: alivePlayers.length,
    counts: pickCounts,
    noPick: noPicks.length,
  }), { ex: picksTTL });

  const eliminatedNames: string[] = [];
  const lifeUsedNames: string[] = [];

  if (wipeout) {
    pool.wipeoutWeeks = pool.wipeoutWeeks || [];
    pool.wipeoutWeeks.push(gw);
    for (const p of alivePlayers) {
      await sendPlayerEmail(p, poolId, pool.name, gw, 'wipeout');
    }
  } else {
    for (const p of survivors) {
      p.usedTeams.push(p.currentPick as string);
      await redis.hset(playersKey, { [p.token]: JSON.stringify(p) });
      await sendPlayerEmail(p, poolId, pool.name, gw, 'survived');
    }
    // Losers and no-picks both go through the same life check —
    // a life protects against elimination either way
    for (const p of [...losers, ...noPicks]) {
      if (p.currentPick) {
        p.usedTeams.push(p.currentPick);
      }
      if (p.hasLife) {
        p.hasLife = false;
        p.lifeUsedWeek = gw;
        lifeUsedNames.push(p.name);
        await redis.hset(playersKey, { [p.token]: JSON.stringify(p) });
        await sendPlayerEmail(p, poolId, pool.name, gw, 'life_used');
      } else {
        p.alive = false;
        p.eliminatedWeek = gw;
        eliminatedNames.push(p.name);
        await redis.hset(playersKey, { [p.token]: JSON.stringify(p) });
        await sendPlayerEmail(p, poolId, pool.name, gw, p.currentPick ? 'eliminated' : 'no_pick');
      }
    }
  }

  const finalAlive = alivePlayers.filter(p => p.alive);
  const stillAliveCount = finalAlive.length;
  const recapTTL = 60 * 60 * 24 * 300;
  await redis.set(`lms:pool:${poolId}:recap:${gw}`, JSON.stringify({
    gw,
    wipeout,
    survivedCount: wipeout ? alivePlayers.length : survivors.length,
    eliminatedNames,
    lifeUsedNames,
    stillAliveCount,
  }), { ex: recapTTL });

  pool.lastGradedGw = gw;
  pool.currentGameweek = gw + 1;

  // A pool that started with more than one player and is now down to exactly
  // one winner is over - lock it so a new pool is needed to play again
  if (alivePlayers.length > 1 && stillAliveCount === 1) {
    pool.status = 'finished';
    pool.winner = finalAlive[0].name;
    for (const p of players) {
      await sendPlayerEmail(p, poolId, pool.name, gw, p.token === finalAlive[0].token ? 'you_won' : 'pool_won', pool.winner);
    }
  }

  await redis.set(`lms:pool:${poolId}`, JSON.stringify(pool));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Protect against public triggering if a secret is configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!API_KEY) return res.status(500).json({ error: 'API_FOOTBALL_KEY not configured' });

  try {
    const poolIds = await redis.smembers('lms:allpools');
    const gradedLog: any[] = [];

    // Different leagues finish their gameweeks on different schedules, so this
    // can no longer be found once globally — cached per league code so pools
    // sharing a league (e.g. two separate Premier League pools) don't each
    // trigger their own identical lookup.
    const latestFinishedByLeague: Record<string, number> = {};

    for (const poolId of poolIds) {
      const poolRaw = await redis.get<string>(`lms:pool:${poolId}`);
      if (!poolRaw) continue;
      const pool = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;
      if (pool.status !== 'active') continue;

      const league = pool.league || 'PL';
      const cfg = leagueConfigFor(league);
      if (!(league in latestFinishedByLeague)) {
        latestFinishedByLeague[league] = await findLatestFinishedGw(cfg);
      }
      const latestFinishedGw = latestFinishedByLeague[league];

      let lastGraded = pool.lastGradedGw ?? 0;

      while (lastGraded < latestFinishedGw) {
        const gwToGrade = lastGraded + 1;
        const results = await getGwResults(gwToGrade, cfg);
        await gradePool(poolId, gwToGrade, results);
        gradedLog.push({ poolId, league, gw: gwToGrade });
        lastGraded = gwToGrade;
      }
    }

    return res.status(200).json({ latestFinishedByLeague, graded: gradedLog });
  } catch (err: any) {
    console.error('Grading cron error:', err.message);
    return res.status(500).json({ error: 'Grading failed', detail: err.message });
  }
}
