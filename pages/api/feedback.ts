import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import sgMail from '@sendgrid/mail';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM_EMAIL = process.env.NOREPLY_EMAIL!;
const FROM_NAME = 'myofficesweepstake.com';
const OWNER_EMAIL = 'hello@myofficesweepstake.com';

// Private feedback — never shown publicly, just stored and emailed to the owner.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, email, page } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Missing feedback message' });
  }

  const entry = {
    message: message.trim().slice(0, 2000),
    email: email && typeof email === 'string' ? email.trim().slice(0, 200) : null,
    page: page && typeof page === 'string' ? page.slice(0, 200) : null,
    createdAt: new Date().toISOString(),
  };

  try {
    await redis.lpush('site:feedback', JSON.stringify(entry));
  } catch (err: any) {
    console.error('Feedback storage error:', err.message);
    return res.status(500).json({ error: 'Failed to save feedback' });
  }

  try {
    await sgMail.send({
      to: OWNER_EMAIL,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: '💬 New feedback received',
      html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid rgba(34,211,238,.3);border-radius:18px;padding:32px">
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:44px;margin-bottom:10px">💬</div>
      <h1 style="color:#22d3ee;font-size:20px;font-weight:900;margin:0">New Feedback</h1>
    </div>
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:16px;margin-bottom:16px">
      <p style="color:#e2e8f0;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap">${entry.message.replace(/</g, '&lt;')}</p>
    </div>
    <p style="color:#64748b;font-size:12px;margin:0">From: ${entry.email ? entry.email.replace(/</g, '&lt;') : 'Anonymous'}${entry.page ? ' · Page: ' + entry.page.replace(/</g, '&lt;') : ''}</p>
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
    console.error('Feedback notification mail error:', mailErr.message);
    // Don't fail the request if the email fails — feedback is already saved
  }

  return res.status(200).json({ ok: true });
}
