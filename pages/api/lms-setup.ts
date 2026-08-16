import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import sgMail from '@sendgrid/mail';

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
    const { pool, k, organiserName, organiserEmail, roundName, buyIn } = req.body;
    if (!pool || !k || !organiserName || !roundName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const storedToken = await redis.get<string>(`lms:orgtoken:${pool}`);
    if (!storedToken || storedToken !== k) {
      return res.status(401).json({ error: 'Invalid organiser link' });
    }

    const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

    // Free pools never went through Stripe, so this is the first place we
    // learn the organiser's email — pools created via the old paid flow
    // already have one, but let a re-submission update it either way.
    if (!poolData.organiserEmail && !organiserEmail) {
      return res.status(400).json({ error: 'Missing organiser email' });
    }
    if (organiserEmail && !/^[^@]+@[^@]+\.[^@]+$/.test(organiserEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    poolData.name = String(roundName).trim();
    poolData.organiser = String(organiserName).trim();
    if (organiserEmail) poolData.organiserEmail = String(organiserEmail).trim().toLowerCase();
    poolData.buyIn = buyIn ? Number(buyIn) : null;
    poolData.status = 'active';

    await redis.set(`lms:pool:${pool}`, JSON.stringify(poolData));

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
      <p style="color:#475569;font-size:13px;margin:0">${poolData.name}</p>
    </div>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px">Your pool is live. This link is the only way back into your organiser hub — invite players, watch picks come in, and manage the pool from here.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${orgHubUrl}" style="display:inline-block;background:#ffd54a;color:#000;font-weight:900;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;font-family:Arial,sans-serif">Go To Your Organiser Hub &rarr;</a>
    </div>
    <div style="text-align:center;margin-bottom:16px">
      <p style="color:#475569;font-size:12px;margin:0 0 4px">Or copy this link into your browser:</p>
      <span style="color:#ffd54a;font-size:11px;word-break:break-all;font-family:Arial,sans-serif">${orgHubUrl}</span>
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
