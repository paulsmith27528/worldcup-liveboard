import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { pool, k } = req.query;
  if (!pool || typeof pool !== 'string' || !k || typeof k !== 'string') {
    return res.status(400).json({ error: 'Missing pool or k' });
  }

  try {
    const storedToken = await redis.get<string>(`lms:orgtoken:${pool}`);
    if (!storedToken || storedToken !== k) {
      return res.status(401).json({ error: 'Invalid organiser link' });
    }

    const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

    const playersRaw = await redis.hgetall<Record<string, string>>(`lms:pool:${pool}:players`);
    const players = playersRaw ? Object.values(playersRaw).map((raw: any) => typeof raw === 'string' ? JSON.parse(raw) : raw) : [];

    return res.status(200).json({
      pool: {
        id: poolData.id,
        name: poolData.name,
        organiser: poolData.organiser,
        currentGameweek: poolData.currentGameweek,
        status: poolData.status,
        createdAt: poolData.createdAt,
      },
      players,
    });
  } catch (err) {
    console.error('lms-organiser GET error:', err);
    return res.status(500).json({ error: 'Failed to load pool data' });
  }
}
