import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const POOL_ADMIN_KEY = process.env.POOL_ADMIN_KEY || '';

// Temporary one-off maintenance endpoint for a single cleanup pass — list
// every pool (GET) or delete one (DELETE), both gated by a key only the
// organiser and Claude know. Not linked from anywhere in the product.
// Intended to be removed again once the cleanup this was built for is done.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const key = (req.method === 'GET' ? req.query.key : req.body?.key) as string | undefined;
  if (!POOL_ADMIN_KEY || key !== POOL_ADMIN_KEY) {
    return res.status(401).json({ error: 'Invalid or missing key' });
  }

  if (req.method === 'GET') {
    const poolIds = await redis.smembers('lms:allpools');
    const pools = [];
    for (const poolId of poolIds) {
      const poolRaw = await redis.get<string>(`lms:pool:${poolId}`);
      if (!poolRaw) continue;
      const pool = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;
      const playersRaw = await redis.hgetall<Record<string, string>>(`lms:pool:${poolId}:players`);
      const playerCount = playersRaw ? Object.keys(playersRaw).length : 0;
      pools.push({
        id: pool.id || poolId,
        name: pool.name,
        league: pool.league,
        status: pool.status,
        createdAt: pool.createdAt ? new Date(pool.createdAt).toISOString() : null,
        playerCount,
      });
    }
    pools.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    return res.status(200).json({ count: pools.length, pools });
  }

  if (req.method === 'DELETE') {
    const { poolId } = req.body || {};
    if (!poolId || typeof poolId !== 'string') {
      return res.status(400).json({ error: 'Missing poolId' });
    }

    const poolRaw = await redis.get<string>(`lms:pool:${poolId}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const pool = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

    // Every key namespaced to this pool — mirrors exactly what lms-create.ts
    // and its siblings write, so nothing is left behind.
    const picksKeys: string[] = [];
    const recapKeys: string[] = [];
    for (let g = 1; g <= 60; g++) {
      picksKeys.push(`lms:pool:${poolId}:picks:${g}`);
      recapKeys.push(`lms:pool:${poolId}:recap:${g}`);
    }

    await redis.del(
      `lms:pool:${poolId}`,
      `lms:pool:${poolId}:players`,
      `lms:pool:${poolId}:reactions`,
      `lms:orgtoken:${poolId}`,
      ...picksKeys,
      ...recapKeys,
    );
    await redis.srem('lms:allpools', poolId);

    return res.status(200).json({ ok: true, deleted: poolId, name: pool.name });
  }

  return res.status(405).end();
}
