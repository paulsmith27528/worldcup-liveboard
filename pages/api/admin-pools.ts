import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const POOL_ADMIN_KEY = process.env.POOL_ADMIN_KEY || '';

// Temporary endpoint to inspect one pool's raw record and backfill firstGw
// on pools created before that field existed. Remove again once done.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const key = (req.method === 'GET' ? req.query.key : req.body?.key) as string | undefined;
  if (!POOL_ADMIN_KEY || key !== POOL_ADMIN_KEY) {
    return res.status(401).json({ error: 'Invalid or missing key' });
  }

  if (req.method === 'GET') {
    const { poolId } = req.query;
    if (!poolId || typeof poolId !== 'string') return res.status(400).json({ error: 'Missing poolId' });
    const poolRaw = await redis.get<string>(`lms:pool:${poolId}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const pool = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;
    return res.status(200).json(pool);
  }

  if (req.method === 'POST') {
    const { poolId, firstGw } = req.body || {};
    if (!poolId || typeof poolId !== 'string' || typeof firstGw !== 'number') {
      return res.status(400).json({ error: 'Missing poolId or firstGw' });
    }
    const poolRaw = await redis.get<string>(`lms:pool:${poolId}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const pool = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;
    pool.firstGw = firstGw;
    await redis.set(`lms:pool:${poolId}`, JSON.stringify(pool));
    return res.status(200).json({ ok: true, poolId, firstGw });
  }

  return res.status(405).end();
}
