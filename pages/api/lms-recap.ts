import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { pool } = req.query;
  if (!pool || typeof pool !== 'string') return res.status(400).json({ error: 'Missing pool' });

  const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
  if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
  const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

  const gwParam = req.query.gw;
  const gw = gwParam && typeof gwParam === 'string' ? parseInt(gwParam, 10) : poolData.lastGradedGw;

  if (!gw || gw < 1) {
    return res.status(200).json({ poolName: poolData.name, gw: null, recap: null });
  }

  const recapRaw = await redis.get<string>(`lms:pool:${pool}:recap:${gw}`);
  if (!recapRaw) {
    return res.status(200).json({ poolName: poolData.name, gw, recap: null });
  }
  const recap = typeof recapRaw === 'string' ? JSON.parse(recapRaw) : recapRaw as any;

  return res.status(200).json({ poolName: poolData.name, gw, recap });
}
