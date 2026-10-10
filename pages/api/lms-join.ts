import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import { leagueConfigFor, upcomingRoundInfo } from '../../lib/lms-rounds';
import sgMail from '@sendgrid/mail';
import { randomBytes, randomInt } from 'crypto';
import { escapeHtml } from '../../lib/escape-html';
import { poolPlayerLimit, STANDARD_LIMIT, BIG_POOL_WARNING_AT } from '../../lib/lms-limits';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const BASE_URL = process.env.BASE_URL!;
const FROM_EMAIL = process.env.NOREPLY_EMAIL!;
const FROM_NAME = 'Last Man Standing';
const LMS_TTL = 60 * 60 * 24 * 300; // 300 days — covers a full PL season

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();

// Same definition the grading cron uses for "this round is done, ready to
// grade" — kept identical so "current gameweek" here can never disagree
// with when the cron considers a round finished.


function genToken(): string {
  return randomBytes(16).toString('hex');
}

// Ids stay numeric (other code sorts and compares them as numbers) and in
// join order, with a random tail so two joins in the same millisecond differ.
function genPlayerId(): number {
  return Date.now() * 1000 + randomInt(1000);
}

const MAX_NAME = 40;
const MAX_EMAIL = 254;
// Avatars live inside each player's record and grading writes every player
// in one request, so they're kept small (the join page resizes to 160x160).
const MAX_AVATAR_LEN = 60000;
const AVATAR_RE = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/;

// Duplicate-email check, player cap and insert in one step, so two people
// joining at the same moment can't both squeeze past the limit or join twice
// with the same email. ARGV: token, lowercased email, limit (-1 = none),
// player JSON, TTL. Returns { status, countBefore }: 1 joined, -1 duplicate
// email, -2 full, -3 token clash.
const JOIN_SCRIPT = `
local vals = redis.call('HVALS', KEYS[1])
for _, raw in ipairs(vals) do
  local ok, p = pcall(cjson.decode, raw)
  if ok and type(p) == 'table' and type(p.email) == 'string' and string.lower(p.email) == ARGV[2] then
    return {-1, #vals}
  end
end
local limit = tonumber(ARGV[3])
if limit >= 0 and #vals >= limit then return {-2, #vals} end
if redis.call('HSETNX', KEYS[1], ARGV[1], ARGV[4]) == 0 then return {-3, #vals} end
redis.call('EXPIRE', KEYS[1], tonumber(ARGV[5]))
return {1, #vals}
`;

// Re-reads the pool right before saving a single flag, so a concurrent
// change (grading, an upgrade payment) isn't overwritten with a stale copy;
// keepTtl so the pool's expiry never moves.
async function setPoolFlag(poolId: string, flag: string): Promise<void> {
  const raw = await redis.get<string>(`lms:pool:${poolId}`);
  if (!raw) return;
  const latest = typeof raw === 'string' ? JSON.parse(raw) : raw as any;
  latest[flag] = true;
  await redis.set(`lms:pool:${poolId}`, JSON.stringify(latest), { keepTtl: true });
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { poolId } = req.query;
    if (!poolId || typeof poolId !== 'string') return res.status(400).json({ error: 'Missing poolId' });
    const poolRaw = await redis.get<string>(`lms:pool:${poolId}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const pool = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;
    const locked = pool.status === 'finished' || pool.status === 'pending_setup';
    return res.status(200).json({ name: pool.name, organiser: pool.organiser, status: pool.status, buyIn: pool.buyIn, locked, winner: pool.winner || null, leagueName: leagueConfigFor(pool.league, pool.season).name });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const { poolId, name, email, displayName, avatarDataUrl } = req.body || {};
  if (!poolId || !name || !email) {
    return res.status(400).json({ error: 'Missing poolId, name, or email' });
  }
  if (typeof poolId !== 'string' || typeof name !== 'string' || typeof email !== 'string') {
    return res.status(400).json({ error: 'Invalid poolId, name, or email' });
  }
  if (name.trim().length < 1 || name.trim().length > MAX_NAME) {
    return res.status(400).json({ error: `Name must be 1-${MAX_NAME} characters` });
  }
  if (email.trim().length > MAX_EMAIL || !/^[^@]+@[^@]+\.[^@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (displayName && typeof displayName !== 'string') {
    return res.status(400).json({ error: 'Invalid display name' });
  }
  if (displayName && displayName.trim().length > 30) {
    return res.status(400).json({ error: 'Display name must be 30 characters or fewer' });
  }
  if (avatarDataUrl) {
    if (typeof avatarDataUrl !== 'string') {
      return res.status(400).json({ error: 'Avatar must be an image file' });
    }
    if (avatarDataUrl.length > MAX_AVATAR_LEN) {
      return res.status(400).json({ error: 'That photo is too large — please choose a smaller one, or join without a photo.' });
    }
    if (!AVATAR_RE.test(avatarDataUrl)) {
      return res.status(400).json({ error: 'Avatar must be an image file' });
    }
  }

  const poolRaw = await redis.get<string>(`lms:pool:${poolId}`);
  if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
  const pool = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

  if (pool.status === 'finished') {
    return res.status(403).json({ error: 'This pool has already been won — start a new pool to play again.' });
  }
  if (pool.status === 'pending_setup') {
    return res.status(403).json({ error: 'This pool is still being set up by the organiser.' });
  }

  const playersKey = `lms:pool:${poolId}:players`;

  const token = genToken();
  const player = {
    id: genPlayerId(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    displayName: displayName && displayName.trim() ? displayName.trim() : null,
    avatarUrl: avatarDataUrl || null,
    token,
    usedTeams: [] as string[],
    currentPick: null as string | null,
    currentPickGw: null as number | null,
    currentPickJoker: false,
    alive: true,
    eliminatedWeek: null as number | null,
    hasJoker: true,
    paid: false,
    proPaid: false,
    jokerUsedWeek: null as number | null,
    joinedAt: new Date().toISOString(),
  };

  // Free up to 11 players, £5 takes the pool to 100, £20 removes the limit
  // (see lib/lms-limits). Whoever's already in is never affected — only new
  // joins are blocked once the pool is at its limit.
  const limit = poolPlayerLimit(pool);
  // Field is keyed by token so a pick submission can look itself up and update in place
  const result = await redis.eval(JOIN_SCRIPT, [playersKey], [
    token, player.email, Number.isFinite(limit) ? limit : -1, JSON.stringify(player), LMS_TTL,
  ]) as [number, number];
  const [joinStatus, existingCount] = [Number(result[0]), Number(result[1])];
  if (joinStatus === -1) {
    return res.status(409).json({ error: 'This email has already joined this pool.' });
  }
  if (joinStatus === -2) {
    return res.status(403).json({ error: 'This pool is full for now — ask the organiser to upgrade before more players can join.' });
  }
  if (joinStatus !== 1) {
    return res.status(503).json({ error: 'Something went wrong joining — please try again.' });
  }

  // The 11th player is still free, but this is the moment to give the
  // organiser a heads-up before the 12th+ actually gets blocked — only
  // ever sent once per pool.
  if (existingCount === 10 && !pool.organiserFeeNotified && pool.organiserEmail) {
    pool.organiserFeeNotified = true;
    await setPoolFlag(poolId, 'organiserFeeNotified');
    try {
      await sgMail.send({
        to: pool.organiserEmail,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: `👀 Your pool just hit 11 players — ${pool.name}`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid rgba(255,213,74,.3);border-radius:18px;padding:32px">
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:52px;margin-bottom:12px">&#128064;</div>
      <h1 style="color:#ffd54a;font-size:22px;font-weight:900;margin:0 0 6px">You're at 11 players!</h1>
      <p style="color:#475569;font-size:13px;margin:0">${escapeHtml(pool.name)}</p>
    </div>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px">Your pool is growing nicely. If it goes any further than 11, you'll need to upgrade for a one-off £5 to keep accepting new players (up to 100; bigger pools are a one-off £20) — everyone already in stays exactly as they are either way, this only affects new joins.</p>
    <div style="text-align:center">
      <a href="${escapeHtml(`${BASE_URL}/lms-organiser.html?pool=${poolId}&k=${pool.orgToken}`)}" style="display:inline-block;background:#ffd54a;color:#000;font-weight:900;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;font-family:Arial,sans-serif">Go To Your Organiser Hub &rarr;</a>
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
      console.error('LMS 11-player notification mail error:', mailErr.message);
    }
  }

  // Same idea for the £5 tier: warn the organiser as the pool nears 100 so
  // they can move to the £20 no-limit upgrade before anyone gets turned away.
  if (pool.organiserFeePaid && poolPlayerLimit(pool) === STANDARD_LIMIT
      && existingCount + 1 === BIG_POOL_WARNING_AT && !pool.organiserBigFeeNotified && pool.organiserEmail) {
    pool.organiserBigFeeNotified = true;
    await setPoolFlag(poolId, 'organiserBigFeeNotified');
    try {
      await sgMail.send({
        to: pool.organiserEmail,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: `🔥 Your pool just hit ${BIG_POOL_WARNING_AT} players — ${pool.name}`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid rgba(255,213,74,.3);border-radius:18px;padding:32px">
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:52px;margin-bottom:12px">&#128293;</div>
      <h1 style="color:#ffd54a;font-size:22px;font-weight:900;margin:0 0 6px">You're at ${BIG_POOL_WARNING_AT} players!</h1>
      <p style="color:#475569;font-size:13px;margin:0">${escapeHtml(pool.name)}</p>
    </div>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px">Your pool can take up to ${STANDARD_LIMIT} players. To go beyond that, upgrade for a one-off £20 and there's no limit at all. Everyone already in stays exactly as they are either way.</p>
    <div style="text-align:center">
      <a href="${escapeHtml(`${BASE_URL}/lms-organiser.html?pool=${poolId}&k=${pool.orgToken}`)}" style="display:inline-block;background:#ffd54a;color:#000;font-weight:900;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;font-family:Arial,sans-serif">Go To Your Organiser Hub &rarr;</a>
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
      console.error('LMS big pool notification mail error:', mailErr.message);
    }
  }

  const pickUrl = `${BASE_URL}/lms-pick.html?pool=${poolId}&t=${token}`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid rgba(239,68,68,.3);border-radius:18px;padding:32px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:52px;margin-bottom:12px">&#128128;</div>
      <h1 style="color:#ffd54a;font-size:22px;font-weight:900;margin:0 0 6px">You're in!</h1>
      <p style="color:#475569;font-size:13px;margin:0">${escapeHtml(pool.name)}</p>
    </div>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px">Hi <strong style="color:#fff">${escapeHtml(player.name)}</strong>, you've joined <strong style="color:#fff">${escapeHtml(pool.organiser)}</strong>'s Last Man Standing pool. One wrong pick and you're out — good luck!</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${escapeHtml(pickUrl)}" style="display:inline-block;background:#ffd54a;color:#000;font-weight:900;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;font-family:Arial,sans-serif">Make Your First Pick &rarr;</a>
    </div>${pool.whatsappGroupUrl ? `
    <div style="text-align:center;margin:0 0 24px">
      <a href="${escapeHtml(pool.whatsappGroupUrl)}" style="display:inline-block;background:#25D366;color:#fff;font-weight:900;font-size:14px;padding:12px 28px;border-radius:50px;text-decoration:none;font-family:Arial,sans-serif">Join the pool's WhatsApp group</a>
    </div>` : ''}
    <div style="text-align:center;margin-bottom:16px">
      <p style="color:#475569;font-size:12px;margin:0 0 4px">Or copy this link into your browser:</p>
      <span style="color:#ffd54a;font-size:11px;word-break:break-all;font-family:Arial,sans-serif">${escapeHtml(pickUrl)}</span>
    </div>
    <p style="color:#334155;font-size:11px;text-align:center;margin:0">Bookmark this link — it's yours until the game ends. Good luck! &#127942;</p>
  </div>
</div>
</body>
</html>`;

  try {
    await sgMail.send({
      to: player.email,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: `\uD83D\uDC80 You're in — ${pool.name}`,
      html,
      trackingSettings: {
        clickTracking: { enable: false, enableText: false },
        openTracking: { enable: false },
      },
    });
  } catch (mailErr: any) {
    console.error('LMS join mail error:', mailErr.message);
    // Don't fail the join if email fails — they're still registered
  }

  const lockInfo = await upcomingRoundInfo(redis, leagueConfigFor(pool.league, pool.season));

  return res.status(200).json({
    ok: true,
    token,
    pickUrl,
    poolName: pool.name,
    whatsappGroupUrl: pool.whatsappGroupUrl || null,
    currentGw: lockInfo.gw,
    currentGwLocked: lockInfo.locked === true,
    nextGw: lockInfo.locked && lockInfo.gw ? lockInfo.gw + 1 : null,
  });
}
