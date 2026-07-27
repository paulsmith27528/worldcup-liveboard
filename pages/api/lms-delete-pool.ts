import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Only deletable when nothing's at stake for anyone else: no one has joined
// yet, or the competition already ran to its conclusion (a winner is set).
// Anything in between has real players who'd lose access with no warning.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pool, k } = req.body;
  if (!pool || !k) {
    return res.status(400).json({ error: 'Missing pool or k' });
  }

  const storedToken = await redis.get<string>(`lms:orgtoken:${pool}`);
  if (!storedToken || storedToken !== k) {
    return res.status(401).json({ error: 'Invalid organiser link' });
  }

  const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
  if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
  const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

  const playersRaw = await redis.hgetall<Record<string, string>>(`lms:pool:${pool}:players`);
  const playerCount = playersRaw ? Object.keys(playersRaw).length : 0;

  const canDelete = playerCount === 0 || poolData.status === 'finished';
  if (!canDelete) {
    return res.status(403).json({ error: "This pool can't be deleted — it has players in it and hasn't finished yet." });
  }

  const keysToDelete = [
    `lms:pool:${pool}`,
    `lms:pool:${pool}:players`,
    `lms:orgtoken:${pool}`,
  ];
  const lastGw = poolData.currentGameweek || 1;
  for (let gw = 1; gw <= lastGw; gw++) {
    keysToDelete.push(`lms:pool:${pool}:picks:${gw}`);
    keysToDelete.push(`lms:pool:${pool}:recap:${gw}`);
  }

  await redis.del(...keysToDelete);
  await redis.srem('lms:allpools', pool);

  return res.status(200).json({ ok: true });
}
