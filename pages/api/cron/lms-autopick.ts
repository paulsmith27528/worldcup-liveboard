import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import sgMail from '@sendgrid/mail';
import { getRounds, currentRound, isLocked, leagueConfigFor, Round } from '../../../lib/lms-rounds';
import { readPool, readPlayers, commit } from '../../../lib/lms-store';
import { wipeoutPicks, addUsedTeams, historyTeams } from '../../../lib/lms-used-teams';
import { escapeHtml } from '../../../lib/escape-html';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const API_KEY = (process.env.API_FOOTBALL_KEY || '').trim();
const BASE_URL = process.env.BASE_URL!;
const FROM_EMAIL = process.env.NOREPLY_EMAIL!;
const FROM_NAME = 'Last Man Standing';

// A random team the player hasn't used that is actually playing this round.
export function chooseAutoPick(playing: Set<string>, used: string[], rand: () => number = Math.random): string | null {
  const options = Array.from(playing).filter(t => !used.includes(t));
  if (options.length === 0) return null;
  return options[Math.floor(rand() * options.length)];
}

async function sendAutoPickEmail(player: any, poolId: string, poolName: string, gw: number, team: string) {
  const pickUrl = `${BASE_URL}/lms-pick.html?pool=${encodeURIComponent(poolId)}&t=${encodeURIComponent(player.token)}`;
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
      <p style="color:#475569;font-size:13px;margin:0">${escapeHtml(poolName)} &middot; Gameweek ${gw}</p>
    </div>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px">You didn't make a pick before kickoff, so we've picked <strong style="color:#fff">${escapeHtml(team)}</strong> for you, at random from the teams you hadn't used yet. Fingers crossed. Don't forget next week!</p>
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

  const poolIds = await redis.smembers('lms:allpools');
  const roundByLeague: Record<string, { round: Round | null; locked: boolean } | null> = {};
  const log: any[] = [];
  const problems: any[] = [];

  for (const poolId of poolIds) {
    // One pool's problem never stops the others.
    try {
      const poolRec = await readPool(poolId);
      if (!poolRec) continue;
      const pool = poolRec.pool;
      if (pool.status !== 'active') continue;

      const cfg = leagueConfigFor(pool.league, pool.season);
      const leagueKey = `${cfg.id}:${cfg.season}`;
      if (!(leagueKey in roundByLeague)) {
        try {
          const round = currentRound(await getRounds(redis, cfg));
          roundByLeague[leagueKey] = { round, locked: round ? await isLocked(redis, cfg, round) : false };
        } catch (err: any) {
          roundByLeague[leagueKey] = null;
          problems.push({ league: leagueKey, error: err.message });
        }
      }
      const info = roundByLeague[leagueKey];
      if (!info || !info.round || !info.locked) continue;
      const round = info.round;
      // Only the round this pool is about to be graded on, and only once.
      if (round.gw !== (pool.lastGradedGw ?? ((pool.firstGw || 1) - 1)) + 1) continue;
      const doneKey = `lms:pool:${poolId}:autopicked:${round.gw}`;
      if (pool.autoPickedGw === round.gw || await redis.get(doneKey)) continue;

      // Only teams whose match hasn't kicked off yet, so nobody is handed a
      // team that's already playing or already lost.
      const stillToPlay = new Set(round.pickableTeams);
      const playersKey = `lms:pool:${poolId}:players`;
      const earlierWipeoutTeams = await wipeoutPicks(redis, poolId, pool);
      const picked: { player: any; team: string }[] = [];
      let conflicts = 0;

      for (const rec of await readPlayers(poolId)) {
        const p = rec.player;
        p.token = p.token || rec.token;
        if (!p.alive) continue;
        if (p.currentPickGw === round.gw && p.currentPick) continue;
        p.usedTeams = p.usedTeams || [];
        addUsedTeams(p, earlierWipeoutTeams(p));
        addUsedTeams(p, historyTeams(p));
        // A pick for an earlier week that's still waiting to be marked is
        // kept aside, exactly as when a player picks for themselves.
        if (p.currentPick && p.currentPickGw && p.currentPickGw < round.gw && p.currentPickGw > (pool.lastGradedGw ?? 0)) {
          p.pendingPicks = { ...(p.pendingPicks || {}), [String(p.currentPickGw)]: { team: p.currentPick, joker: !!p.currentPickJoker } };
        }
        const team = chooseAutoPick(stillToPlay, p.usedTeams);
        if (!team) continue;
        p.currentPick = team;
        p.currentPickGw = round.gw;
        p.currentPickJoker = false;
        p.autoPicked = true;
        const ok = await commit([{ hash: playersKey, field: rec.token, was: rec.raw }], [{ hash: playersKey, field: rec.token, value: JSON.stringify(p) }]);
        if (ok) picked.push({ player: p, team });
        else conflicts++;
      }

      // A player whose record changed mid-run (they were saving something)
      // is retried on the next run, 15 minutes later.
      if (conflicts === 0) await redis.set(doneKey, '1', { ex: 60 * 60 * 24 * 300 });

      for (const { player, team } of picked) {
        await sendAutoPickEmail(player, poolId, pool.name || 'Last Man Standing', round.gw, team);
      }
      log.push({ poolId, gw: round.gw, autoPicked: picked.map(x => ({ name: x.player.name, team: x.team })), conflicts });
    } catch (err: any) {
      console.error(`Auto-pick failed for pool ${poolId}:`, err.message);
      problems.push({ poolId, error: err.message });
    }
  }

  return res.status(200).json({ done: log, problems });
}
