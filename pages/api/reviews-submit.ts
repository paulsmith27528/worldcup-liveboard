import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import sgMail from '@sendgrid/mail';
import { randomBytes } from 'crypto';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const BASE_URL = process.env.BASE_URL!;
const FROM_EMAIL = 'noreply@worldcupsweepstake-liveboard.com';
const FROM_NAME = 'myofficesweepstake.com';
const OWNER_EMAIL = 'hello@myofficesweepstake.com';
const ADMIN_KEY = process.env.ADMIN_KEY || '';

// Reviews are never shown publicly until approved via the emailed link -
// prevents a fake or nasty review from going live with no review step.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, rating, text } = req.body;
  const ratingNum = Number(rating);

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Missing name' });
  }
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Missing review text' });
  }

  const id = randomBytes(8).toString('hex');
  const entry = {
    id,
    name: name.trim().slice(0, 80),
    rating: Math.round(ratingNum),
    text: text.trim().slice(0, 1000),
    createdAt: new Date().toISOString(),
  };

  try {
    await redis.set(`site:review:${id}`, JSON.stringify(entry));
    await redis.sadd('site:reviews:pending', id);
  } catch (err: any) {
    console.error('Review storage error:', err.message);
    return res.status(500).json({ error: 'Failed to save review' });
  }

  const stars = '⭐'.repeat(entry.rating);
  const approveUrl = `${BASE_URL}/api/reviews-approve?id=${id}&key=${ADMIN_KEY}&action=approve`;
  const rejectUrl = `${BASE_URL}/api/reviews-approve?id=${id}&key=${ADMIN_KEY}&action=reject`;

  try {
    await sgMail.send({
      to: OWNER_EMAIL,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: `⭐ New review awaiting approval — ${entry.name}`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid rgba(255,213,74,.3);border-radius:18px;padding:32px">
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:44px;margin-bottom:10px">⭐</div>
      <h1 style="color:#ffd54a;font-size:20px;font-weight:900;margin:0">New Review Awaiting Approval</h1>
    </div>
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:16px;margin-bottom:20px">
      <p style="color:#ffd54a;font-size:16px;margin:0 0 8px">${stars}</p>
      <p style="color:#fff;font-weight:700;font-size:14px;margin:0 0 6px">${entry.name.replace(/</g, '&lt;')}</p>
      <p style="color:#e2e8f0;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap">${entry.text.replace(/</g, '&lt;')}</p>
    </div>
    <div style="display:flex;gap:10px">
      <a href="${approveUrl}" style="flex:1;text-align:center;text-decoration:none;padding:13px;border-radius:10px;background:#34d399;color:#04150e;font-weight:900;font-size:13px">✓ Approve</a>
      <a href="${rejectUrl}" style="flex:1;text-align:center;text-decoration:none;padding:13px;border-radius:10px;background:transparent;border:1px solid rgba(239,68,68,.4);color:#ef4444;font-weight:900;font-size:13px">✗ Reject</a>
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
    console.error('Review notification mail error:', mailErr.message);
    // Don't fail the request if the email fails — review is already queued
  }

  return res.status(200).json({ ok: true });
}
