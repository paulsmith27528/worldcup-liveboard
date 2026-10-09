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

// "Lost your link?" for players and organisers. Links are personal and act
// as the password, so they are only ever EMAILED to the address that joined
// or set up the pool — never shown on screen. (This used to hand the link
// straight back to whoever typed the email in, which let anyone in a pool
// open someone else's pick page just by knowing their email address.)
//
// Always answers the same way, whether or not the email is in the pool, so
// it can't be used to check who's playing.
const RESEND_COOLDOWN_SECONDS = 60;

function linkEmailHtml(poolName: string, heading: string, intro: string, buttons: { label: string; url: string }[]) {
  const buttonHtml = buttons.map(b => `
    <div style="text-align:center;margin:20px 0 6px">
      <a href="${b.url}" style="display:inline-block;background:#ffd54a;color:#000;font-weight:900;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;font-family:Arial,sans-serif">${b.label} &rarr;</a>
    </div>
    <p style="text-align:center;margin:0 0 12px"><span style="color:#ffd54a;font-size:11px;word-break:break-all;font-family:Arial,sans-serif">${b.url}</span></p>`).join('');
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid rgba(255,213,74,.3);border-radius:18px;padding:32px">
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:52px;margin-bottom:12px">&#128273;</div>
      <h1 style="color:#ffd54a;font-size:22px;font-weight:900;margin:0 0 6px">${heading}</h1>
      <p style="color:#475569;font-size:13px;margin:0">${poolName}</p>
    </div>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 8px">${intro}</p>
    ${buttonHtml}
    <p style="color:#334155;font-size:11px;text-align:center;margin:16px 0 0">Didn't ask for this? You can ignore it. Your links haven't changed and nobody else has been sent them.</p>
  </div>
</div>
</body>
</html>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pool, email } = req.body || {};
  if (!pool || typeof pool !== 'string' || !email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Missing pool or email' });
  }
  const normalisedEmail = email.trim().toLowerCase();
  const done = () => res.status(200).json({ sent: true });

  // One email per address per pool per minute, so the form can't be used to
  // flood someone's inbox.
  const cooldown = await redis.set(`lms:resend:${pool}:${normalisedEmail}`, '1', { nx: true, ex: RESEND_COOLDOWN_SECONDS });
  if (cooldown === null) return done();

  const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
  if (!poolRaw) return done();
  const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

  const playersRaw = await redis.hgetall<Record<string, string>>(`lms:pool:${pool}:players`);
  const players = playersRaw
    ? Object.values(playersRaw).map((raw: any) => typeof raw === 'string' ? JSON.parse(raw) : raw)
    : [];
  const player = players.find((p: any) => (p.email || '').toLowerCase() === normalisedEmail);

  const buttons: { label: string; url: string }[] = [];
  if (player) {
    buttons.push({ label: 'Your Pick Page', url: `${BASE_URL}/lms-pick.html?pool=${pool}&t=${player.token}` });
  }
  if ((poolData.organiserEmail || '').toLowerCase() === normalisedEmail) {
    const k = await redis.get<string>(`lms:orgtoken:${pool}`);
    if (k) buttons.push({ label: 'Your Organiser Hub', url: `${BASE_URL}/lms-organiser.html?pool=${pool}&k=${k}` });
  }
  if (buttons.length === 0) return done();

  try {
    await sgMail.send({
      to: normalisedEmail,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: `🔑 Your Last Man Standing link${buttons.length > 1 ? 's' : ''} — ${poolData.name}`,
      html: linkEmailHtml(poolData.name, 'Here are your links', 'Someone (hopefully you) asked for your links for this pool. Tap below to get back in, and bookmark the page this time.', buttons),
      trackingSettings: {
        clickTracking: { enable: false, enableText: false },
        openTracking: { enable: false },
      },
    });
  } catch (mailErr: any) {
    console.error('LMS resend link mail error:', mailErr.message);
  }
  return done();
}
