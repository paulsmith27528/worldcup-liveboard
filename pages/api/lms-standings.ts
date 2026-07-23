import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { pool, t } = req.query;
  if (!pool || typeof pool !== 'string') return res.status(400).json({ error: 'Missing pool' });

  const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
  if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
  const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

  const playersRaw = await redis.hgetall<Record<string, string>>(`lms:pool:${pool}:players`);
  const players = playersRaw
    ? Object.values(playersRaw).map((raw: any) => typeof raw === 'string' ? JSON.parse(raw) : raw)
    : [];

  const you = (t && typeof t === 'string') ? t : null;

  return res.status(200).json({
    pool: {
      name: poolData.name,
      organiser: poolData.organiser,
      lastGradedGw: poolData.lastGradedGw || 0,
      wipeoutWeeks: poolData.wipeoutWeeks || [],
      status: poolData.status,
    },
    players: players.map((p: any) => ({
      name: p.name,
      displayName: p.displayName || null,
      avatarUrl: p.avatarUrl || null,
      alive: p.alive,
      eliminatedWeek: p.eliminatedWeek,
      lifeUsedWeek: p.lifeUsedWeek,
      isYou: you ? p.token === you : false,
    })),
  });
}
