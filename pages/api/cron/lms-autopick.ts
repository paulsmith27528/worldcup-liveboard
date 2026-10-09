import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import sgMail from '@sendgrid/mail';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const API_KEY = (process.env.API_FOOTBALL_KEY || '').trim();
const BASE_URL = process.env.BASE_URL!;
const FROM_EMAIL = process.env.NOREPLY_EMAIL!;
const FROM_NAME = 'Last Man Standing';

// Same league config as the other LMS endpoints. Defaults to PL for pools
// created before leagues existed.
const LEAGUE_CONFIG: Record<string, { id: number; season: number }> = {
  PL: { id: 39, season: 2026 },
  CHAMPIONSHIP: { id: 40, season: 2026 },
  SPL: { id: 179, season: 2026 },
  UCL: { id: 2, season: 2026 },
};

// Same "this round is over" definition as the grading cron: finished, or
// postponed/cancelled/abandoned (those become byes at grading).
const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'WO'];
const BYE_STATUSES = ['PST', 'CANC', 'ABD'];

type Round = { gw: number; deadline: string; teams: Set<string> } | null;

// The round being played right now: the earliest round that isn't over yet,
// but only once its first match has kicked off (picks are locked).
async function lockedRound(cfg: { id: number; season: number }): Promise<Round> {
  const res = await fetch(`https://v3.football.api-sports.io/fixtures?league=${cfg.id}&season=${cfg.season}`, {
    headers: { 'x-apisports-key': API_KEY },
  });
  const data = await res.json();
  const fixtures = (data.response || []).sort((a: any, b: any) =>
    new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());

  const order: string[] = [];
  const over: Record<string, boolean> = {};
  for (const f of fixtures) {
    const r = f.league.round;
    if (!(r in over)) { over[r] = true; order.push(r); }
    const s = f.fixture.status.short;
    if (!FINISHED_STATUSES.includes(s) && !BYE_STATUSES.includes(s)) over[r] = false;
  }
  const round = order.find(r => !over[r]);
  if (!round) return null;
  const m = round.match(/(\d+)$/);
  if (!m) return null;

  const inRound = fixtures.filter((f: any) => f.league.round === round);
  const deadline = inRound[0].fixture.date;
  if (new Date() < new Date(deadline)) return null;

  // Only teams with a real match this round; a postponed match would just
  // be a bye, which isn't a fair pick to make for someone.
  const teams = new Set<string>();
  for (const f of inRound) {
    if (BYE_STATUSES.includes(f.fixture.status.short)) continue;
    teams.add(f.teams.home.name);
    teams.add(f.teams.away.name);
  }
  return { gw: parseInt(m[1], 10), deadline, teams };
}

// A random team the player hasn't used that is actually playing this round.
export function chooseAutoPick(playing: Set<string>, used: string[], rand: () => number = Math.random): string | null {
  const options = Array.from(playing).filter(t => !used.includes(t));
  if (options.length === 0) return null;
  return options[Math.floor(rand() * options.length)];
}

async function sendAutoPickEmail(player: any, poolId: string, poolName: string, gw: number, team: string) {
  const pickUrl = `${BASE_URL}/lms-pick.html?pool=${poolId}&t=${player.token}`;
  try {
    await sgMail.send({
      to: player.email,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: `🤖 We picked ${team} for you — Gameweek ${gw}`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid rgba(255,213,74,.3);border-radius:18px;padding:32px">
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:52px;margin-bottom:12px">&#129302;</div>
      <h1 style="color:#ffd54a;font-size:22px;font-weight:900;margin:0 0 6px">We Picked For You</h1>
      <p style="color:#475569;font-size:13px;margin:0">${poolName} &middot; Gameweek ${gw}</p>
    </div>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px">You didn't make a pick before kickoff, so we've picked <strong style="color:#fff">${team}</strong> for you, at random from the teams you hadn't used yet. Fingers crossed. Don't forget next week!</p>
    <div style="text-align:center">
      <a href="${pickUrl}" style="display:inline-block;background:#ffd54a;color:#000;font-weight:900;font-size:14px;padding:13px 28px;border-radius:50px;text-decoration:none;font-family:Arial,sans-serif">Open Your Pick Page &rarr;</a>
    </div>
  </div>
</div>
</body>
</html>`,
      trackingSettings: {
        clickTracking: { enable: false, enableText: false },
        openTracking: { enable: false },
      },
    });
  } catch (err: any) {
    console.error(`Auto-pick email failed for ${player.email}:`, err.message);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!API_KEY) return res.status(500).json({ error: 'API_FOOTBALL_KEY not configured' });

  try {
    const poolIds = await redis.smembers('lms:allpools');
    const roundByLeague: Record<string, Round> = {};
    const log: any[] = [];

    for (const poolId of poolIds) {
      const poolRaw = await redis.get<string>(`lms:pool:${poolId}`);
      if (!poolRaw) continue;
      const pool = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;
      if (pool.status !== 'active') continue;

      const league = pool.league || 'PL';
      const cfg = LEAGUE_CONFIG[league] || LEAGUE_CONFIG.PL;
      if (!(league in roundByLeague)) roundByLeague[league] = await lockedRound(cfg);
      const round = roundByLeague[league];
      if (!round) continue;
      // Only the round this pool is about to be graded on, and only once.
      if (round.gw !== (pool.lastGradedGw ?? 0) + 1) continue;
      if (pool.autoPickedGw === round.gw) continue;

      const playersKey = `lms:pool:${poolId}:players`;
      const playersRaw = await redis.hgetall<Record<string, string>>(playersKey);
      const players = playersRaw
        ? Object.values(playersRaw).map((raw: any) => typeof raw === 'string' ? JSON.parse(raw) : raw)
        : [];

      const changed: Record<string, string> = {};
      const picked: { player: any; team: string }[] = [];
      for (const p of players) {
        if (!p.alive) continue;
        if (p.currentPickGw === round.gw && p.currentPick) continue;
        const team = chooseAutoPick(round.teams, p.usedTeams || []);
        if (!team) continue;
        p.currentPick = team;
        p.currentPickGw = round.gw;
        p.currentPickJoker = false;
        p.autoPicked = true;
        changed[p.token] = JSON.stringify(p);
        picked.push({ player: p, team });
      }

      pool.autoPickedGw = round.gw;
      const tx = redis.multi();
      if (Object.keys(changed).length > 0) tx.hset(playersKey, changed);
      tx.set(`lms:pool:${poolId}`, JSON.stringify(pool), { keepTtl: true });
      await tx.exec();

      for (const { player, team } of picked) {
        await sendAutoPickEmail(player, poolId, pool.name || 'Last Man Standing', round.gw, team);
      }
      log.push({ poolId, gw: round.gw, autoPicked: picked.map(x => ({ name: x.player.name, team: x.team })) });
    }

    return res.status(200).json({ done: log });
  } catch (err: any) {
    console.error('Auto-pick cron error:', err.message);
    return res.status(500).json({ error: 'Auto-pick failed', detail: err.message });
  }
}
