import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { pool, k } = req.query;
    if (!pool || typeof pool !== 'string' || !k || typeof k !== 'string') {
      return res.status(400).json({ error: 'Missing pool or k' });
    }

    const storedToken = await redis.get<string>(`lms:orgtoken:${pool}`);
    if (!storedToken || storedToken !== k) {
      return res.status(401).json({ error: 'Invalid organiser link' });
    }

    const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

    return res.status(200).json({
      status: poolData.status,
      name: poolData.name,
      organiser: poolData.organiser,
      buyIn: poolData.buyIn,
    });
  }

  if (req.method === 'POST') {
    const { pool, k, organiserName, roundName, buyIn } = req.body;
    if (!pool || !k || !organiserName || !roundName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const storedToken = await redis.get<string>(`lms:orgtoken:${pool}`);
    if (!storedToken || storedToken !== k) {
      return res.status(401).json({ error: 'Invalid organiser link' });
    }

    const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

    poolData.name = String(roundName).trim();
    poolData.organiser = String(organiserName).trim();
    poolData.buyIn = buyIn ? Number(buyIn) : null;
    poolData.status = 'active';

    await redis.set(`lms:pool:${pool}`, JSON.stringify(poolData));

    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
