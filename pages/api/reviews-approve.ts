import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ADMIN_KEY = process.env.ADMIN_KEY || '';

function page(icon: string, title: string, message: string, color: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#020810;color:#fff;font-family:-apple-system,Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px">
  <div>
    <div style="font-size:52px;margin-bottom:16px">${icon}</div>
    <h1 style="font-size:22px;color:${color};margin:0 0 8px">${title}</h1>
    <p style="color:#94a3b8;font-size:14px;margin:0">${message}</p>
  </div>
</body>
</html>`;
}

// One-click approve/reject from the email notification - no login, same
// secret-token-in-URL pattern as every other admin action on this site.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id, key, action } = req.query;

  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(401).send(page('⚠️', 'Invalid Link', "This approval link isn't valid.", '#ef4444'));
  }
  if (!id || typeof id !== 'string') {
    res.setHeader('Content-Type', 'text/html');
    return res.status(400).send(page('⚠️', 'Missing Review', 'No review ID was given.', '#ef4444'));
  }

  const raw = await redis.get<string>(`site:review:${id}`);
  if (!raw) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(404).send(page('ℹ️', 'Already Handled', 'This review was already approved, rejected, or no longer exists.', '#94a3b8'));
  }
  const review = typeof raw === 'string' ? JSON.parse(raw) : raw;

  await redis.srem('site:reviews:pending', id);

  if (action === 'reject') {
    await redis.del(`site:review:${id}`);
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(page('🗑️', 'Review Rejected', `${review.name}'s review has been deleted and will not appear on the site.`, '#ef4444'));
  }

  await redis.sadd('site:reviews:approved', id);
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(page('✅', 'Review Approved', `${review.name}'s review is now live on the site.`, '#34d399'));
}
