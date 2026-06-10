import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import sgMail from '@sendgrid/mail';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const BASE_URL = 'https://worldcupsweepstake-liveboard.com';
const FROM_EMAIL = 'noreply@worldcupsweepstake-liveboard.com';
const FROM_NAME = 'WC2026 Sweepstake';

const COLOURS = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9','#F0B27A','#82E0AA','#F1948A','#7FB3D3','#F9E79F','#A9CCE3','#A3E4D7','#F8C471','#C39BD3','#76D7C4'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { sweepstakeId, sweepstakeName, organiser, name, email, currency, pricePerEntry } = req.body;

  if (!sweepstakeId || !name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Basic email validation
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const key = `sweep:${sweepstakeId}:entries`;

  // Check if email already registered for this sweepstake
  const existing = await redis.lrange(key, 0, -1);
  for (const raw of existing) {
    const e = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (e.email && e.email.toLowerCase() === email.toLowerCase()) {
      return res.status(409).json({ error: 'This email is already registered. Use a different email address for a second entry.' });
    }
  }

  // Assign a colour based on current count
  const colour = COLOURS[existing.length % COLOURS.length];
  const token = Math.random().toString(36).substring(2, 12);

  const entry = {
    id: Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    token,
    colour,
    teamName: null,
    teamFlag: null,
    eliminated: false,
    paid: false,
    registeredAt: new Date().toISOString(),
    source: 'link', // vs 'manual'
  };

  // Store in Redis (90 day TTL)
  await redis.rpush(key, JSON.stringify(entry));
  await redis.expire(key, 60 * 60 * 24 * 90);

  // Send confirmation email
  const price = pricePerEntry ? `${currency || '£'}${pricePerEntry}` : null;

  const confirmHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid rgba(34,211,238,.2);border-radius:18px;padding:32px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:52px;margin-bottom:12px">🎲</div>
      <h1 style="color:#ffd54a;font-size:22px;font-weight:900;margin:0 0 6px">You're in!</h1>
      <p style="color:#475569;font-size:13px;margin:0">${sweepstakeName || 'WC2026 Sweepstake'}</p>
    </div>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 12px">Hi <strong style="color:#fff">${name}</strong>,</p>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px">Your entry is confirmed. <strong style="color:#fff">${organiser || 'The organiser'}</strong> will run the draw soon — you'll get another email the moment your team is revealed.</p>
    ${price ? `<div style="background:rgba(255,213,74,.06);border:1px solid rgba(255,213,74,.2);border-radius:10px;padding:14px 16px;margin-bottom:20px"><p style="color:#ffd54a;font-size:12px;font-weight:700;margin:0 0 4px;letter-spacing:1px">BUY-IN REMINDER</p><p style="color:#94a3b8;font-size:13px;margin:0">Please pay your <strong style="color:#fff">${price}</strong> buy-in directly to ${organiser || 'the organiser'} — not through this app.</p></div>` : ''}
    <div style="background:rgba(34,211,238,.06);border:1px solid rgba(34,211,238,.15);border-radius:10px;padding:14px 16px;margin-bottom:20px">
      <p style="color:#22d3ee;font-size:12px;font-weight:700;margin:0 0 4px;letter-spacing:1px">WANT MORE THAN ONE TEAM?</p>
      <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.6">Register again using a <strong style="color:#fff">different email address</strong>. Each email address = one entry in the draw.</p>
    </div>
    <p style="color:#334155;font-size:11px;text-align:center;margin:0">Good luck! 🏆</p>
  </div>
</div>
</body>
</html>`;

  try {
    await sgMail.send({
      to: email,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: `You're in! — ${sweepstakeName || 'WC2026 Sweepstake'} 🎲`,
      html: confirmHtml,
    });
  } catch (err) {
    console.error('Confirmation email error:', err);
    // Don't block registration if email fails
  }

  return res.status(200).json({ success: true, token, name: entry.name });
}
