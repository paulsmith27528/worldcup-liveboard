import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import { wipeoutPicks, addUsedTeams } from '../../../lib/lms-used-teams';
import { getRounds, roundByGw, leagueConfigFor, Round } from '../../../lib/lms-rounds';
import { readPool, readPlayers, commit, withRetry } from '../../../lib/lms-store';
import { escapeHtml } from '../../../lib/escape-html';
import sgMail from '@sendgrid/mail';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();

const BASE_URL = process.env.BASE_URL!;
const FROM_EMAIL = process.env.NOREPLY_EMAIL!;
const FROM_NAME = 'Last Man Standing';

export interface Player {
  id: number;
  name: string;
  displayName?: string | null;
  email: string;
  token: string;
  usedTeams: string[];
  currentPick: string | null;
  currentPickGw: number | null;
  currentPickJoker: boolean;
  alive: boolean;
  eliminatedWeek: number | null;
  hasJoker: boolean;
  jokerUsedWeek: number | null;
  pickHistory?: Record<string, string>;
  pendingPicks?: Record<string, { team: string; joker: boolean }>;
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

async function sendPlayerEmail(player: Player, poolId: string, poolName: string, gw: number, type: 'survived' | 'survived_joker_used' | 'eliminated' | 'no_pick' | 'wipeout' | 'joker_used' | 'you_won' | 'pool_won' | 'bye', winnerName?: string, pick?: string | null) {
  // Names and teams are typed by players and organisers, so escape them.
  const pickHtml = escapeHtml(pick);
  const winnerHtml = escapeHtml(winnerName);
  const poolNamePlain = poolName;
  poolName = escapeHtml(poolName);
  const pickUrl = `${BASE_URL}/lms-pick.html?pool=${poolId}&t=${player.token}`;
  const pickBtn = `<div style="text-align:center;margin-top:4px"><a href="${pickUrl}" style="display:inline-block;background:#ffd54a;color:#000;font-weight:900;font-size:14px;padding:13px 28px;border-radius:50px;text-decoration:none;font-family:Arial,sans-serif">Make Your Next Pick &rarr;</a></div>`;
  let html = '';
  let subject = '';

  if (type === 'survived') {
    subject = `\u2705 You're through — Gameweek ${gw}`;
    html = buildEmail('&#9989;', '#34d399', "You're Through!",  poolName, gw,
      `<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px">Nice one — <strong style="color:#fff">${pickHtml}</strong> won. You're still in the pool for the next round. Somewhere out there, someone who picked a team that's already been knocked out is refreshing their phone in quiet despair. Not you. Not this week.</p>${pickBtn}`);
  } else if (type === 'survived_joker_used') {
    subject = `✅ You're through — but your joker's gone (Gameweek ${gw})`;
    html = buildEmail('&#9989;', '#34d399', "You're Through!",  poolName, gw,
      `<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px"><strong style="color:#fff">${pickHtml}</strong> won, so you're still in — but you'd played your joker on this pick, and that's spent the moment you play it, whether you needed it or not. You're out of jokers now, so the next loss or draw is game over. Walk the tightrope wisely.</p>${pickBtn}`);
  } else if (type === 'joker_used') {
    subject = `\uD83D\uDEE1\uFE0F Joker played — you're still in! (Gameweek ${gw})`;
    const reason = pick
      ? `Your pick, <strong style="color:#fff">${pickHtml}</strong>, didn't win this week`
      : `You didn't make a pick before the deadline this gameweek`;
    html = buildEmail('&#128737;&#65039;', '#ffd54a', "Joker Played — You're Still In!",  poolName, gw,
      `<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px">${reason} — but you'd played your joker on this pick, so you survive instead of being knocked out. That's your one lifeline gone, spent like someone who just used their get-out-of-jail-free card. Because you have. You're out of jokers now, so the next loss or draw is game over. Good luck!</p>${pickBtn}`);
  } else if (type === 'eliminated') {
    subject = `\u2620\ufe0f You're out — Gameweek ${gw}`;
    const jokerNote = player.jokerUsedWeek != null
      ? `You'd already played your joker back in gameweek ${player.jokerUsedWeek}, so there was no safety net left this time.`
      : `You had a joker available but didn't play it on this pick, so there was no safety net this time.`;
    html = buildEmail('&#128128;', '#ef4444', "You're Out",  poolName, gw,
      `<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px">Your pick, <strong style="color:#fff">${pickHtml}</strong>, didn't win this week. ${jokerNote} You've been eliminated from the pool. Thanks for playing — good luck to whoever's left!</p>`);
  } else if (type === 'no_pick') {
    subject = `\u2620\ufe0f You're out — no pick made (Gameweek ${gw})`;
    const jokerNote2 = player.jokerUsedWeek != null
      ? `You'd already played your joker back in gameweek ${player.jokerUsedWeek}, so there was no safety net left this time.`
      : `You didn't have your joker played this gameweek, so there was no safety net.`;
    html = buildEmail('&#128128;', '#ef4444', "You're Out",  poolName, gw,
      `<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px">You didn't make a pick before the deadline this gameweek. ${jokerNote2} You've been eliminated from the pool. Thanks for playing!</p>`);
  } else if (type === 'bye') {
    subject = `🎫 Free pass — Gameweek ${gw}`;
    html = buildEmail('🎫', '#ffd54a', 'You Got A Bye!', poolName, gw,
      `<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px">Your pick, <strong style="color:#fff">${pickHtml}</strong>, didn't play this gameweek — postponed, cancelled, or moved out of the round. Nobody's punished for a match that never happened: you're straight through to the next round. Just like any other pick, <strong style="color:#fff">${pickHtml}</strong> now counts as used, so you can't pick them again this season.</p>${pickBtn}`);
  } else if (type === 'wipeout') {
    subject = `\u267b\ufe0f Gameweek ${gw} wiped out — everyone survives`;
    html = buildEmail('&#9851;', '#ffd54a', "Total Wipeout!",  poolName, gw,
      `<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px">Every player still standing lost or drew this gameweek — so under the rules, it doesn't count. Nobody's eliminated and nobody's joker is touched, but the team you picked still counts as used. A collective bottle job, but everyone gets away with it. Onwards.</p>${pickBtn}`);
  } else if (type === 'you_won') {
    subject = `\uD83D\uDC51 You won the pool! — ${poolNamePlain}`;
    html = buildEmail('&#128081;', '#ffd54a', "You Won!",  poolName, gw,
      `<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px">You're the last one standing — congratulations! This pool is now finished. If you want to run it back, ask your organiser to set up a new pool.</p>`);
  } else {
    subject = `\uD83D\uDC51 ${winnerName} won the pool — ${poolNamePlain}`;
    html = buildEmail('&#128081;', '#ffd54a', "We Have a Winner",  poolName, gw,
      `<p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px"><strong style="color:#fff">${winnerHtml}</strong> is the last one standing and wins the pool! Thanks for playing — this pool is now finished. Ask your organiser to set up a new one to play again.</p>`);
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

// The pick a player made for a gameweek: their current pick if it's for
// that week, otherwise one kept aside when they picked for the next week
// before this one was marked (see lms-pick.ts).
export function pickFor(p: Player, gw: number): { team: string; joker: boolean } | null {
  if (p.currentPickGw === gw && p.currentPick) return { team: p.currentPick, joker: !!p.currentPickJoker };
  const kept = p.pendingPicks?.[String(gw)];
  return kept && kept.team ? { team: kept.team, joker: !!kept.joker } : null;
}

type EmailType = Parameters<typeof sendPlayerEmail>[4];
type Email = { p: Player; pick: string | null; type: EmailType; winnerName?: string };

// Works out everything one gameweek changes for one pool. Pure: it only
// changes the objects passed in and says what to save and who to email.
export function gradeRound(pool: any, players: Player[], gw: number, results: Record<string, 'W' | 'D' | 'L'>, byeTeams: Set<string>, earlierWipeoutTeams: (p: Player) => string[]) {
  const alivePlayers = players.filter(p => p.alive);
  const changed = new Set<Player>();
  const emails: Email[] = [];

  // Repair teams missed in earlier wipeout weeks (see lib/lms-used-teams).
  for (const p of alivePlayers) {
    p.usedTeams = p.usedTeams || [];
    if (addUsedTeams(p, earlierWipeoutTeams(p))) changed.add(p);
  }

  const survivors: Player[] = [];
  const losers: Player[] = [];
  const noPicks: Player[] = [];
  const byes: Player[] = [];
  const picks = new Map<Player, { team: string; joker: boolean }>();

  for (const p of alivePlayers) {
    const pick = pickFor(p, gw);
    // This week's pick is now final: drop the kept-aside copy and the
    // joker flag, so neither can carry over into a later week.
    if (p.pendingPicks && String(gw) in p.pendingPicks) {
      delete p.pendingPicks[String(gw)];
      changed.add(p);
    }
    if (p.currentPickGw === gw && p.currentPickJoker) {
      p.currentPickJoker = false;
      changed.add(p);
    }
    if (!pick) {
      noPicks.push(p);
      continue;
    }
    picks.set(p, pick);
    // Every pick made for this gameweek is recorded here, once, whatever
    // happens next (win, loss, draw, wipeout, joker, postponed): the pick is
    // kept permanently on the player and the team is used up, so no outcome
    // can ever leave a used team pickable again. A postponed match still
    // counts as using the team, the player just goes through (Paul's rule).
    p.pickHistory = { ...(p.pickHistory || {}), [String(gw)]: pick.team };
    addUsedTeams(p, [pick.team]);
    changed.add(p);
    if (byeTeams.has(pick.team)) byes.push(p);
    else if (results[pick.team] === 'W') survivors.push(p);
    else losers.push(p);
  }

  // Byes aren't wins or losses — a round where every remaining pick got
  // byed (e.g. the whole round was postponed) isn't a "wipeout" either,
  // that label is reserved for everyone genuinely losing or not picking.
  const gradedCount = alivePlayers.length - byes.length;
  const wipeout = gradedCount > 0 && (losers.length + noPicks.length) === gradedCount;

  for (const p of byes) emails.push({ p, pick: picks.get(p)!.team, type: 'bye' });

  // Snapshot who picked what this gameweek, permanently: the only record of
  // round-by-round pick popularity once the season moves on.
  const counts: Record<string, number> = {};
  const pickDetails: { id: number; name: string; displayName: string | null; team: string }[] = [];
  for (const p of [...survivors, ...losers, ...byes]) {
    const team = picks.get(p)!.team;
    counts[team] = (counts[team] || 0) + 1;
    pickDetails.push({ id: p.id, name: p.name, displayName: p.displayName || null, team });
  }
  const snapshot = { gw, totalPlayers: alivePlayers.length, counts, picks: pickDetails, noPick: noPicks.length };

  const eliminatedNames: string[] = [];
  const jokerUsedNames: string[] = [];

  if (wipeout) {
    pool.wipeoutWeeks = Array.from(new Set([...(pool.wipeoutWeeks || []), gw]));
    for (const p of [...losers, ...noPicks]) emails.push({ p, pick: picks.get(p)?.team || null, type: 'wipeout' });
  } else {
    for (const p of survivors) {
      // The joker is a pre-match gamble, not automatic insurance — if it was
      // played on this pick it's spent the moment it's played, win or lose.
      const jokerSpent = picks.get(p)!.joker && p.hasJoker !== false;
      if (jokerSpent) {
        p.hasJoker = false;
        p.jokerUsedWeek = gw;
        jokerUsedNames.push(p.name);
      }
      emails.push({ p, pick: picks.get(p)!.team, type: jokerSpent ? 'survived_joker_used' : 'survived' });
    }
    // Only a joker played on this gameweek's pick protects against
    // elimination; no pick means no joker.
    for (const p of [...losers, ...noPicks]) {
      const pick = picks.get(p) || null;
      if (pick && pick.joker && p.hasJoker !== false) {
        p.hasJoker = false;
        p.jokerUsedWeek = gw;
        jokerUsedNames.push(p.name);
        emails.push({ p, pick: pick.team, type: 'joker_used' });
      } else {
        p.alive = false;
        p.eliminatedWeek = gw;
        eliminatedNames.push(p.name);
        emails.push({ p, pick: pick ? pick.team : null, type: pick ? 'eliminated' : 'no_pick' });
      }
      changed.add(p);
    }
  }

  const finalAlive = alivePlayers.filter(p => p.alive);
  const recap = {
    gw,
    wipeout,
    survivedCount: wipeout ? alivePlayers.length : survivors.length + byes.length,
    eliminatedNames,
    jokerUsedNames,
    byeNames: byes.map(p => p.name),
    stillAliveCount: finalAlive.length,
  };

  pool.lastGradedGw = gw;
  pool.currentGameweek = gw + 1;

  // A pool that started with more than one player and is now down to exactly
  // one winner is over - lock it so a new pool is needed to play again
  if (alivePlayers.length > 1 && finalAlive.length === 1) {
    pool.status = 'finished';
    pool.winner = finalAlive[0].name;
    pool.winnerToken = finalAlive[0].token;
    for (const p of players) {
      emails.push({ p, pick: null, type: p.token === finalAlive[0].token ? 'you_won' : 'pool_won', winnerName: pool.winner });
    }
  }

  return { changed: Array.from(changed), emails, snapshot, recap };
}

const KEEP_DAYS = 60 * 60 * 24 * 300;

// Grades one gameweek for one pool and saves it all in one go: players,
// pool, snapshot and recap land together or not at all, and only if nothing
// else (a pick being saved, another grading run) changed them meanwhile.
// Emails go out only after a successful save, so a re-run never re-sends.
async function gradePool(poolId: string, gw: number, results: Record<string, 'W' | 'D' | 'L'>, byeTeams: Set<string>): Promise<boolean> {
  return withRetry(5, async () => {
    const poolRec = await readPool(poolId);
    if (!poolRec) return false;
    const pool = poolRec.pool;
    if (pool.status !== 'active') return false;
    // Already graded (a duplicate cron run, or one that overlapped).
    if ((pool.lastGradedGw ?? 0) >= gw) return false;

    const playersKey = `lms:pool:${poolId}:players`;
    const recs = await readPlayers(poolId);
    const players: Player[] = recs.map(r => ({ ...r.player, token: r.player.token || r.token }));
    const rawByToken = new Map(recs.map(r => [r.token, r.raw]));
    const earlierWipeoutTeams = await wipeoutPicks(redis, poolId, pool);

    const { changed, emails, snapshot, recap } = gradeRound(pool, players, gw, results, byeTeams, earlierWipeoutTeams);

    const ok = await commit(
      [
        { key: `lms:pool:${poolId}`, was: poolRec.raw },
        ...changed.map(p => ({ hash: playersKey, field: p.token, was: rawByToken.get(p.token) ?? null })),
      ],
      [
        ...changed.map(p => ({ hash: playersKey, field: p.token, value: JSON.stringify(p) })),
        { key: `lms:pool:${poolId}:picks:${gw}`, value: JSON.stringify(snapshot), ttl: KEEP_DAYS },
        { key: `lms:pool:${poolId}:recap:${gw}`, value: JSON.stringify(recap), ttl: KEEP_DAYS },
        { key: `lms:pool:${poolId}`, value: JSON.stringify(pool), ttl: 'keep' as const },
      ],
    );
    if (!ok) return 'conflict' as const;

    await sendEmailsInBatches(emails.map(e => () => sendPlayerEmail(e.p, poolId, pool.name, gw, e.type, e.winnerName, e.pick)));
    return true;
  });
}

// Sends a batch at a time rather than one by one, so a 500-player pool takes
// seconds rather than minutes. sendPlayerEmail already catches its own
// failures, so one bad address never stops the rest.
const EMAIL_BATCH_SIZE = 25;
async function sendEmailsInBatches(sends: (() => Promise<void>)[]) {
  for (let i = 0; i < sends.length; i += EMAIL_BATCH_SIZE) {
    await Promise.all(sends.slice(i, i + EMAIL_BATCH_SIZE).map(send => send()));
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Protect against public triggering if a secret is configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!API_KEY) return res.status(500).json({ error: 'API_FOOTBALL_KEY not configured' });

  const gradedLog: any[] = [];
  const problems: any[] = [];
  // One fresh fixture list per league per run, shared by every pool in it.
  const roundsByLeague: Record<string, Round[] | null> = {};

  const poolIds = await redis.smembers('lms:allpools');
  for (const poolId of poolIds) {
    // One pool's problem never stops the others being graded.
    try {
      const poolRec = await readPool(poolId);
      if (!poolRec) continue;
      const pool = poolRec.pool;
      if (pool.status !== 'active') continue;

      const cfg = leagueConfigFor(pool.league, pool.season);
      const leagueKey = `${cfg.id}:${cfg.season}`;
      if (!(leagueKey in roundsByLeague)) {
        try {
          roundsByLeague[leagueKey] = await getRounds(redis, cfg, { fresh: true });
        } catch (err: any) {
          // No fixture data means no grading this run, never a guess.
          roundsByLeague[leagueKey] = null;
          problems.push({ league: leagueKey, error: err.message });
        }
      }
      const rounds = roundsByLeague[leagueKey];
      if (!rounds) continue;

      // Gameweeks are marked strictly in order, each only once every match
      // in it has a result (or was postponed). A later week finishing first
      // never causes an earlier one to be marked early.
      let lastGraded = pool.lastGradedGw ?? ((pool.firstGw || 1) - 1);
      for (;;) {
        const round = roundByGw(rounds, lastGraded + 1);
        if (!round || !round.over) break;
        await gradePool(poolId, round.gw, round.results, new Set(round.byeTeams));
        gradedLog.push({ poolId, gw: round.gw });
        lastGraded = round.gw;
      }
    } catch (err: any) {
      console.error(`Grading failed for pool ${poolId}:`, err.message);
      problems.push({ poolId, error: err.message });
    }
  }

  if (problems.length) console.error('Grading problems:', JSON.stringify(problems));
  return res.status(200).json({ graded: gradedLog, problems });
}
