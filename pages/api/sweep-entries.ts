import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing sweepstake ID' });
  }

  try {
    const key = `sweep:${id}:entries`;
    const raw = await redis.lrange(key, 0, -1);
    const entries = raw.map((e: any) => typeof e === 'string' ? JSON.parse(e) : e);
    return res.status(200).json({ entries, count: entries.length });
  } catch (err) {
    console.error('sweep-entries error:', err);
    return res.status(500).json({ error: 'Failed to fetch entries' });
  }
}
