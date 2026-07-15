import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import sgMail from '@sendgrid/mail';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const BASE_URL = 'https://www.worldcupliveboard.com';
const FROM_EMAIL = 'noreply@worldcupsweepstake-liveboard.com';
const FROM_NAME = 'Last Man Standing';
const LMS_TTL = 60 * 60 * 24 * 300; // 300 days — covers a full PL season

function genToken(): string {
  return Math.random().toString(36).substring(2, 12);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { poolId } = req.query;
    if (!poolId || typeof poolId !== 'string') return res.status(400).json({ error: 'Missing poolId' });
    const poolRaw = await redis.get<string>(`lms:pool:${poolId}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const pool = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;
    return res.status(200).json({ name: pool.name, organiser: pool.organiser, status: pool.status });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const { poolId, name, email } = req.body;
  if (!poolId || !name || !email) {
    return res.status(400).json({ error: 'Missing poolId, name, or email' });
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const poolRaw = await redis.get<string>(`lms:pool:${poolId}`);
  if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
  const pool = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

  const playersKey = `lms:pool:${poolId}:players`;
  const existing = await redis.hgetall<Record<string, string>>(playersKey);
  if (existing) {
    for (const raw of Object.values(existing)) {
      const p = typeof raw === 'string' ? JSON.parse(raw) : raw as any;
      if (p.email && p.email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ error: 'This email has already joined this pool.' });
      }
    }
  }

  const token = genToken();
  const player = {
    id: Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    token,
    usedTeams: [] as string[],
    currentPick: null as string | null,
    currentPickGw: null as number | null,
    alive: true,
    eliminatedWeek: null as number | null,
    hasLife: true,
    joinedAt: new Date().toISOString(),
  };

  // Field is keyed by token so a pick submission can look itself up and update in place
  await redis.hset(playersKey, { [token]: JSON.stringify(player) });
  await redis.expire(playersKey, LMS_TTL);

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
      <p style="color:#475569;font-size:13px;margin:0">${pool.name}</p>
    </div>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px">Hi <strong style="color:#fff">${player.name}</strong>, you've joined <strong style="color:#fff">${pool.organiser}</strong>'s Last Man Standing pool. One wrong pick and you're out — good luck!</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${pickUrl}" style="display:inline-block;background:#ffd54a;color:#000;font-weight:900;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;font-family:Arial,sans-serif">Make Your First Pick &rarr;</a>
    </div>
    <div style="text-align:center;margin-bottom:16px">
      <p style="color:#475569;font-size:12px;margin:0 0 4px">Or copy this link into your browser:</p>
      <span style="color:#ffd54a;font-size:11px;word-break:break-all;font-family:Arial,sans-serif">${pickUrl}</span>
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

  return res.status(200).json({ ok: true, token, pickUrl, poolName: pool.name });
}
