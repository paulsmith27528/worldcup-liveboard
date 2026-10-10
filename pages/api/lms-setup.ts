import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import sgMail from '@sendgrid/mail';
import { escapeHtml } from '../../lib/escape-html';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
const BASE_URL = process.env.BASE_URL!;
const FROM_EMAIL = process.env.NOREPLY_EMAIL!;
const FROM_NAME = 'Last Man Standing';

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

const MAX_POOL_NAME = 60;
const MAX_PERSON_NAME = 40;
const MAX_EMAIL = 254;

// Only overwrites the pool while it's still pending_setup.
const ACTIVATE_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
if cjson.decode(raw).status ~= 'pending_setup' then return 0 end
redis.call('SET', KEYS[1], ARGV[1], 'KEEPTTL')
return 1
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { pool, k } = req.query;
    if (!pool || typeof pool !== 'string' || !k || typeof k !== 'string') {
      return res.status(400).json({ error: 'Missing pool or k' });
    }

    const storedToken = await redis.get<string>(`lms:orgtoken:${pool}`);
    if (!storedToken || storedToken !== k) {
      return res.status(401).json({ error: 'Invalid organiser link' });
    }

    const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

    return res.status(200).json({
      status: poolData.status,
      name: poolData.name,
      organiser: poolData.organiser,
      organiserEmail: poolData.organiserEmail || null,
      buyIn: poolData.buyIn,
      leagueName: leagueConfigFor(poolData.league).name,
    });
  }

  if (req.method === 'POST') {
    const { pool, k, organiserName, organiserEmail, roundName, buyIn } = req.body || {};
    if (!pool || !k || !organiserName || !roundName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (typeof pool !== 'string' || typeof k !== 'string') {
      return res.status(400).json({ error: 'Invalid organiser link' });
    }
    if (typeof roundName !== 'string' || roundName.trim().length < 1 || roundName.trim().length > MAX_POOL_NAME) {
      return res.status(400).json({ error: `Round name must be 1-${MAX_POOL_NAME} characters` });
    }
    if (typeof organiserName !== 'string' || organiserName.trim().length < 1 || organiserName.trim().length > MAX_PERSON_NAME) {
      return res.status(400).json({ error: `Your name must be 1-${MAX_PERSON_NAME} characters` });
    }
    if (organiserEmail != null && organiserEmail !== '' && (typeof organiserEmail !== 'string' || organiserEmail.trim().length > MAX_EMAIL)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    // Optional; the form sends '' when left blank.
    const buyInNum = buyIn === undefined || buyIn === null || buyIn === '' ? null : Number(buyIn);
    if (buyInNum !== null && ((typeof buyIn !== 'string' && typeof buyIn !== 'number') || !Number.isFinite(buyInNum) || buyInNum < 0)) {
      return res.status(400).json({ error: 'Buy-in must be a number of £0 or more' });
    }

    const storedToken = await redis.get<string>(`lms:orgtoken:${pool}`);
    if (!storedToken || storedToken !== k) {
      return res.status(401).json({ error: 'Invalid organiser link' });
    }

    const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

    // Setup is a one-off pending_setup -> active move; once live, the name,
    // organiser and buy-in players signed up under can't be swapped out.
    if (poolData.status !== 'pending_setup') {
      return res.status(409).json({ error: 'This pool has already been set up.' });
    }

    // Free pools never went through Stripe, so this is the first place we
    // learn the organiser's email — pools created via the old paid flow
    // already have one.
    if (!poolData.organiserEmail && !organiserEmail) {
      return res.status(400).json({ error: 'Missing organiser email' });
    }
    if (organiserEmail && !/^[^@]+@[^@]+\.[^@]+$/.test(organiserEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    poolData.name = roundName.trim();
    poolData.organiser = organiserName.trim();
    if (organiserEmail) poolData.organiserEmail = organiserEmail.trim().toLowerCase();
    poolData.buyIn = buyInNum ? buyInNum : null;
    poolData.status = 'active';

    // Status re-checked and written in one step, so two submissions racing
    // each other can't both get through; KEEPTTL so the pool's expiry never moves.
    const saved = await redis.eval(ACTIVATE_SCRIPT, [`lms:pool:${pool}`], [JSON.stringify(poolData)]);
    if (Number(saved) !== 1) {
      return res.status(409).json({ error: 'This pool has already been set up.' });
    }

    // Organiser access is a bare link, not a login — if they lose the tab
    // without this email, the pool is unreachable forever. Fires exactly once,
    // since the setup form only ever submits on the pending_setup -> active move.
    const orgHubUrl = `${BASE_URL}/lms-organiser.html?pool=${pool}&k=${k}`;
    try {
      await sgMail.send({
        to: poolData.organiserEmail,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: `👑 You're the organiser — ${poolData.name}`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid rgba(255,213,74,.3);border-radius:18px;padding:32px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:52px;margin-bottom:12px">&#128081;</div>
      <h1 style="color:#ffd54a;font-size:22px;font-weight:900;margin:0 0 6px">You're the organiser!</h1>
      <p style="color:#475569;font-size:13px;margin:0">${escapeHtml(poolData.name)}</p>
    </div>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px">Your pool is live. This link is the only way back into your organiser hub — invite players, watch picks come in, and manage the pool from here.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${escapeHtml(orgHubUrl)}" style="display:inline-block;background:#ffd54a;color:#000;font-weight:900;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;font-family:Arial,sans-serif">Go To Your Organiser Hub &rarr;</a>
    </div>
    <div style="text-align:center;margin-bottom:16px">
      <p style="color:#475569;font-size:12px;margin:0 0 4px">Or copy this link into your browser:</p>
      <span style="color:#ffd54a;font-size:11px;word-break:break-all;font-family:Arial,sans-serif">${escapeHtml(orgHubUrl)}</span>
    </div>
    <p style="color:#334155;font-size:11px;text-align:center;margin:0">Bookmark this link — there's no password to get it back. &#127942;</p>
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
      console.error('LMS organiser setup mail error:', mailErr.message);
      // Don't fail the setup if email fails — they're still set up, just without the safety net
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
