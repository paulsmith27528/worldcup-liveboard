import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const TTL = 60 * 60 * 24 * 120; // 120 days

function genId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POST — store bracket data, return short ID
  if (req.method === 'POST') {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'Missing data' });
    const id = genId();
    await redis.set(`bracket:${id}`, JSON.stringify(data), { ex: TTL });
    return res.status(200).json({ id });
  }

  // GET — fetch bracket data by ID
  if (req.method === 'GET') {
    const { bid } = req.query;
    if (!bid || typeof bid !== 'string') return res.status(400).json({ error: 'Missing bid' });
    const raw = await redis.get<string>(`bracket:${bid}`);
    if (!raw) return res.status(404).json({ error: 'Not found' });
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return res.status(200).json({ data });
  }

  return res.status(405).end();
}
