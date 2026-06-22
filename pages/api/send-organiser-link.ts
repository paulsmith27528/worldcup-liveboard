import type { NextApiRequest, NextApiResponse } from 'next';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM_EMAIL = 'noreply@worldcupsweepstake-liveboard.com';
const FROM_NAME  = 'WC2026 Sweepstake';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, organiser, sweepstakeName, organiserLink } = req.body;

  if (!email || !organiserLink) {
    return res.status(400).json({ error: 'Missing email or organiserLink' });
  }

  const name = sweepstakeName || 'WC2026 Sweepstake';
  const org  = organiser || 'Organiser';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid rgba(255,213,74,.3);border-radius:18px;padding:32px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:56px;margin-bottom:12px">🎲</div>
      <h1 style="color:#ffd54a;font-size:24px;font-weight:900;margin:0 0 6px">Your Organiser Link</h1>
      <p style="color:#475569;font-size:13px;margin:0">${name}</p>
    </div>

    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px">
      Hi <strong style="color:#fff">${org}</strong>,<br><br>
      Here's your organiser link for <strong style="color:#ffd54a">${name}</strong>.
      Tap it from any device — phone, tablet, laptop — to instantly access your sweepstake dashboard.
    </p>

    <div style="text-align:center;margin:28px 0">
      <a href="${organiserLink}" style="display:inline-block;background:linear-gradient(135deg,#ffd54a,#f59e0b);color:#000;font-weight:900;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none">
        🎲 Open My Sweepstake →
      </a>
    </div>

    <div style="background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:14px 16px;margin-bottom:20px">
      <p style="color:#475569;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px">YOUR ORGANISER LINK — KEEP THIS EMAIL</p>
      <p style="color:#22d3ee;font-size:10px;word-break:break-all;margin:0;font-family:monospace;line-height:1.5">${organiserLink}</p>
    </div>

    <div style="background:rgba(34,211,238,.06);border:1px solid rgba(34,211,238,.12);border-radius:10px;padding:14px 16px">
      <p style="color:#22d3ee;font-size:11px;font-weight:700;margin:0 0 4px;letter-spacing:1px">💡 TIP</p>
      <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6">
        Bookmark this link in your browser for one-tap access. This link is unique to your sweepstake — don't share it with participants.
      </p>
    </div>

    <p style="color:#334155;font-size:11px;text-align:center;margin-top:24px">
      This email was sent because you set up a sweepstake on worldcupsweepstake-liveboard.com
    </p>
  </div>
</div>
</body>
</html>`;

  try {
    await sgMail.send({
      to:      email,
      from:    { email: FROM_EMAIL, name: FROM_NAME },
      subject: `🎲 Your organiser link — ${name}`,
      html,
      trackingSettings: {
        clickTracking: { enable: false, enableText: false },
        openTracking: { enable: false },
      },
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Organiser link email failed:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
