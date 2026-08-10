import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Public — only ever returns approved reviews, never the pending queue.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const ids = await redis.smembers('site:reviews:approved');
    if (!ids || ids.length === 0) return res.status(200).json({ reviews: [] });

    const raw = await Promise.all(ids.map((id) => redis.get<string>(`site:review:${id}`)));
    const reviews = raw
      .filter((r): r is string | object => !!r)
      .map((r) => (typeof r === 'string' ? JSON.parse(r) : r))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r: any) => ({ name: r.name, rating: r.rating, text: r.text }));

    return res.status(200).json({ reviews });
  } catch (err: any) {
    console.error('reviews GET error:', err.message);
    return res.status(500).json({ error: 'Failed to load reviews' });
  }
}
