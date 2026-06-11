import type { NextApiRequest, NextApiResponse } from 'next';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const BASE_URL = 'https://www.worldcupliveboard.com';
const FROM_EMAIL = 'noreply@worldcupsweepstake-liveboard.com';
const FROM_NAME = 'WC2026 Sweepstake';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { sweepstakeName, organiser, currency, entries, eliminated } = req.body;

  if (!entries || !Array.isArray(entries)) {
    return res.status(400).json({ error: 'Missing entries array' });
  }

  const cur = currency || '£';
  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const entry of entries) {
    if (!entry.email || !entry.teamName) {
      results.skipped++;
      continue;
    }

    // Build bracket URL (all entries encoded in hash so sweep-view.html works client-side)
    const data = {
      n: sweepstakeName,
      org: organiser,
      cur,
      entries: entries.map((e: any) => ({
        name: e.name,
        teamName: e.teamName,
        colour: e.colour || '#4ECDC4',
        eliminated: e.eliminated || false,
        paid: e.paid || false,
        token: e.token,
      })),
      eliminated: eliminated || [],
      tok: entry.token,
    };

    const bracketUrl = `${BASE_URL}/sweep-view.html#V1:${Buffer.from(JSON.stringify(data)).toString('base64')}`;
    const flag = entry.teamFlag || '⚽';
    const name = sweepstakeName || 'WC2026 Sweepstake';

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid rgba(255,213,74,.3);border-radius:18px;padding:32px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:72px;margin-bottom:12px">${flag}</div>
      <h1 style="color:#ffd54a;font-size:26px;font-weight:900;margin:0 0 6px">You've got ${entry.teamName}!</h1>
      <p style="color:#475569;font-size:13px;margin:0">${name}</p>
    </div>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 12px">Hi <strong style="color:#fff">${entry.name}</strong>,</p>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">The draw has been run by <strong style="color:#fff">${organiser || 'the organiser'}</strong> and you've been assigned <strong style="color:#ffd54a">${flag} ${entry.teamName}</strong>. Good luck — follow your team's journey through the tournament using your personal bracket link below!</p>
    <div style="text-align:center;margin:28px 0">
      <a href="${bracketUrl}" style="display:inline-block;background:linear-gradient(135deg,#ffd54a,#f59e0b);color:#000;font-weight:900;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none">📊 View My Bracket →</a>
    </div>
    <div style="background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:14px 16px;margin-bottom:20px">
      <p style="color:#475569;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px">YOUR PERSONAL BRACKET LINK — BOOKMARK THIS</p>
      <p style="color:#22d3ee;font-size:10px;word-break:break-all;margin:0;font-family:monospace;line-height:1.5">${bracketUrl}</p>
    </div>
    <div style="background:rgba(34,211,238,.06);border:1px solid rgba(34,211,238,.12);border-radius:10px;padding:14px 16px">
      <p style="color:#22d3ee;font-size:11px;font-weight:700;margin:0 0 4px;letter-spacing:1px">💡 TIP</p>
      <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6">Your bracket link updates live as matches are played. Bookmark it and check back during the tournament to see how your team is doing.</p>
    </div>
    <p style="color:#334155;font-size:11px;text-align:center;margin-top:24px">Remember to pay your buy-in to ${organiser || 'the organiser'} if you haven't already. Good luck! 🏆</p>
  </div>
</div>
</body>
</html>`;

    try {
      await sgMail.send({
        to: entry.email,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: `${flag} You've got ${entry.teamName}! — ${name}`,
        html,
      });
      results.sent++;
    } catch (err) {
      console.error(`Draw email failed for ${entry.name} (${entry.email}):`, err);
      results.failed++;
    }
  }

  return res.status(200).json({ success: true, results });
}
