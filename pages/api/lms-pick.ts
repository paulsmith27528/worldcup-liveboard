import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import sgMail from '@sendgrid/mail';
import { wipeoutPicks, addUsedTeams, historyTeams } from '../../lib/lms-used-teams';
import { getRounds, currentRound, isLocked, leagueConfigFor, FixturesUnavailable, Round } from '../../lib/lms-rounds';
import { readPool, readPlayer, commit, withRetry } from '../../lib/lms-store';
import { escapeHtml } from '../../lib/escape-html';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const BASE_URL = process.env.BASE_URL!;
const FROM_EMAIL = process.env.NOREPLY_EMAIL!;
const FROM_NAME = 'Last Man Standing';

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();

// Team names and badges for the pick grid. They don't change during a
// season, so they're cached for a day.
async function getTeams(cfg: { id: number; season: number }) {
  const cacheKey = `lms:teams-cache:${cfg.id}:${cfg.season}`;
  const cached = await redis.get<any>(cacheKey).catch(() => null);
  if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;
  const teamsRes = await fetch(`https://v3.football.api-sports.io/teams?league=${cfg.id}&season=${cfg.season}`, { headers: { "x-apisports-key": API_KEY } });
  const teamsData = await teamsRes.json();
  const teams = (teamsData.response || []).map((t: any) => ({
    id: t.team.id,
    name: t.team.name,
    code: t.team.code || t.team.name.slice(0, 3).toUpperCase(),
    logo: t.team.logo,
  }));
  if (teams.length > 0) await redis.set(cacheKey, JSON.stringify(teams), { ex: 24 * 60 * 60 }).catch(() => {});
  return teams;
}

function fixtureView(f: Round['fixtures'][number]) {
  return {
    id: f.id,
    date: f.date,
    venue: f.venue,
    status: f.status,
    home: { id: f.home.id, name: f.home.name },
    away: { id: f.away.id, name: f.away.name },
  };
}

// Every team the player can no longer pick: their used list, plus anything
// in their permanent pick history or a wipeout week that's missing from it.
async function repairUsedTeams(poolId: string, pool: any, player: any) {
  player.usedTeams = player.usedTeams || [];
  const fromWipeouts = (await wipeoutPicks(redis, poolId, pool))(player);
  const a = addUsedTeams(player, fromWipeouts);
  const b = addUsedTeams(player, historyTeams(player));
  return a || b;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!API_KEY) return res.status(500).json({ error: "API_FOOTBALL_KEY not configured" });
  try {
    if (req.method === 'GET') return await handleGet(req, res);
    if (req.method === 'POST') return await handlePost(req, res);
    return res.status(405).end();
  } catch (err: any) {
    if (err instanceof FixturesUnavailable) {
      console.error('lms-pick fixtures unavailable:', err.message);
      return res.status(503).json({ error: 'The fixture list is temporarily unavailable. Please try again in a minute.' });
    }
    console.error('lms-pick error:', err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { pool, t } = req.query;
  if (!pool || typeof pool !== 'string' || !t || typeof t !== 'string') {
    return res.status(400).json({ error: 'Missing pool or t' });
  }

  const poolRec = await readPool(pool);
  if (!poolRec) return res.status(404).json({ error: 'Pool not found' });
  const poolData = poolRec.pool;
  const cfg = leagueConfigFor(poolData.league, poolData.season);
  const rounds = await getRounds(redis, cfg);
  const round = currentRound(rounds);
  const locked = round ? await isLocked(redis, cfg, round) : true;
  const teams = await getTeams(cfg);

  // Repair the player's used teams (see repairUsedTeams). If this week's
  // pick turns out to be one of them and picks are still open, clear it so
  // the player is asked to choose again.
  const out = await withRetry(5, async () => {
    const rec = await readPlayer(pool, t);
    if (!rec) return null;
    const player = rec.player;
    let clearedPick: string | null = null;
    if (await repairUsedTeams(pool, poolData, player)) {
      if (round && !locked && player.currentPick && player.currentPickGw === round.gw
          && player.usedTeams.includes(player.currentPick)) {
        clearedPick = player.currentPick;
        player.currentPick = null;
        player.currentPickGw = null;
        player.currentPickJoker = false;
      }
      const playersKey = `lms:pool:${pool}:players`;
      const ok = await commit([{ hash: playersKey, field: t, was: rec.raw }], [{ hash: playersKey, field: t, value: JSON.stringify(player) }]);
      if (!ok) return 'conflict' as const;
    }
    return { player, clearedPick };
  });
  if (!out) return res.status(404).json({ error: 'Player not found' });
  const { player, clearedPick } = out;

  const next = round ? rounds[rounds.indexOf(round) + 1] : undefined;
  return res.status(200).json({
    clearedPick,
    poolName: poolData.name,
    leagueName: cfg.name,
    poolStatus: poolData.status,
    winner: poolData.winner || null,
    isWinner: poolData.status === 'finished' && (poolData.winnerToken ? poolData.winnerToken === t : !!player.alive),
    whatsappGroupUrl: poolData.whatsappGroupUrl || null,
    player: {
      name: player.name,
      alive: player.alive,
      usedTeams: player.usedTeams,
      currentPick: player.currentPick,
      currentPickGw: player.currentPickGw,
      currentPickJoker: player.currentPickJoker || false,
      autoPicked: !!player.autoPicked,
      eliminatedWeek: player.eliminatedWeek,
      proPaid: player.proPaid || false,
      hasJoker: player.hasJoker !== false,
      jokerUsedWeek: player.jokerUsedWeek ?? null,
    },
    // Set when the pool hasn't started yet (it was created while this
    // gameweek was already under way).
    poolStartsGw: round && poolData.firstGw && round.gw < poolData.firstGw ? poolData.firstGw : null,
    gw: round ? round.gw : null,
    fixtures: round ? round.fixtures.map(fixtureView) : [],
    pickableTeams: round ? round.pickableTeams : [],
    teams,
    deadline: round ? round.deadline : null,
    locked,
    nextGw: next ? next.gw : null,
    nextFixtures: next ? next.fixtures.map(fixtureView) : [],
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { pool, t, team, useJoker } = req.body || {};
  if (typeof pool !== 'string' || typeof t !== 'string' || typeof team !== 'string' || !pool || !t || !team) {
    return res.status(400).json({ error: 'Missing pool, t, or team' });
  }

  const poolRec = await readPool(pool);
  if (!poolRec) return res.status(404).json({ error: 'Pool not found' });
  const poolData = poolRec.pool;
  if (poolData.status === 'finished') {
    return res.status(403).json({ error: `This pool has already finished — ${poolData.winner || 'someone'} won.` });
  }

  const cfg = leagueConfigFor(poolData.league, poolData.season);
  const rounds = await getRounds(redis, cfg);
  const round = currentRound(rounds);
  if (!round) {
    return res.status(400).json({ error: 'No upcoming gameweek available to pick for.' });
  }
  if (poolData.firstGw && round.gw < poolData.firstGw) {
    return res.status(403).json({ error: `Your pool starts in Gameweek ${poolData.firstGw}. Picks open once Gameweek ${round.gw} has finished.` });
  }
  if (await isLocked(redis, cfg, round)) {
    return res.status(403).json({ error: 'Picks have locked for this gameweek — the first match has kicked off.' });
  }
  if (!round.pickableTeams.includes(team)) {
    return res.status(400).json({ error: `${team} doesn't have a match you can pick in Gameweek ${round.gw}.` });
  }

  const playersKey = `lms:pool:${pool}:players`;
  const result = await withRetry(5, async () => {
    const rec = await readPlayer(pool, t);
    if (!rec) return { status: 404, error: 'Player not found' };
    const player = rec.player;
    if (!player.alive) return { status: 403, error: 'You have already been eliminated from this pool.' };

    await repairUsedTeams(pool, poolData, player);
    if (player.usedTeams.includes(team)) {
      return { status: 409, error: 'You have already picked this team in a previous gameweek.' };
    }

    // Playing the joker is a choice made alongside the pick, same as the pick
    // itself it can be changed right up until the deadline. Whatever it's set
    // to when the deadline passes is what grading acts on.
    if (useJoker && player.hasJoker === false) {
      return { status: 400, error: "You've already used your joker." };
    }

    // A pick for an earlier week that hasn't been marked yet (its last match
    // has finished but grading hasn't run) is kept aside, so picking for the
    // new week can never wipe it out.
    if (player.currentPick && player.currentPickGw && player.currentPickGw < round.gw
        && player.currentPickGw > (poolData.lastGradedGw ?? 0)) {
      player.pendingPicks = {
        ...(player.pendingPicks || {}),
        [String(player.currentPickGw)]: { team: player.currentPick, joker: !!player.currentPickJoker },
      };
    }

    player.currentPick = team;
    player.currentPickGw = round.gw;
    player.currentPickJoker = !!useJoker;
    player.autoPicked = false;

    const ok = await commit([{ hash: playersKey, field: t, was: rec.raw }], [{ hash: playersKey, field: t, value: JSON.stringify(player) }]);
    if (!ok) return 'conflict' as const;
    return { status: 200, player };
  });
  if (result.status !== 200) return res.status(result.status).json({ error: result.error });
  const player = (result as any).player;

  const poolName = escapeHtml(poolData.name || 'Last Man Standing');
  const teamHtml = escapeHtml(team);
  const gwData = { gw: round.gw };

  const pickUrl = `${BASE_URL}/lms-pick.html?pool=${encodeURIComponent(pool)}&t=${encodeURIComponent(t)}`;
  const deadlineFormatted = new Date(round.deadline).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
  });

  try {
    await sgMail.send({
      to: player.email,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: `\u2705 Pick confirmed — ${team} (Gameweek ${gwData.gw})`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="format-detection" content="telephone=no, address=no, email=no, date=no, url=no"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
<div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid rgba(52,211,153,.3);border-radius:18px;padding:32px">
  <div style="text-align:center;margin-bottom:20px">
    <div style="font-size:52px;margin-bottom:12px">&#9989;</div>
    <h1 style="color:#34d399;font-size:22px;font-weight:900;margin:0 0 6px">Pick Confirmed</h1>
    <p style="color:#475569;font-size:13px;margin:0">${poolName} &middot; Gameweek ${gwData.gw}</p>
  </div>
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:16px;text-align:center;margin-bottom:20px">
    <p style="color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:1px;margin:0 0 6px">YOUR PICK</p>
    <p style="color:#ffd54a;font-size:20px;font-weight:900;margin:0">${teamHtml}</p>
    ${useJoker ? `<p style="color:#94a3b8;font-size:11px;margin:8px 0 0">&#128737;&#65039; Joker played on this pick</p>` : ''}
  </div>
  <p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px">Changed your mind${useJoker ? ' about your pick or your joker' : ''}? You can update anytime before <strong style="color:#fff">${deadlineFormatted}</strong> &mdash; after that it locks in${useJoker ? ', joker and all' : ''}.</p>
  <div style="text-align:center">
    <a href="${pickUrl}" style="display:inline-block;background:#ffd54a;color:#000;font-weight:900;font-size:14px;padding:13px 28px;border-radius:50px;text-decoration:none;font-family:Arial,sans-serif">Change Your Pick &rarr;</a>
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
  } catch (mailErr: any) {
    console.error('Pick confirmation mail error:', mailErr.message);
    // Don't fail the pick save if the email fails — the pick is already saved
  }

  return res.status(200).json({ ok: true, pick: team, gw: gwData.gw });
}
