import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const POOL_ADMIN_KEY = process.env.POOL_ADMIN_KEY || '';

// Temporary endpoint to fabricate graded-round data on a throwaway test
// pool, purely so the Arena ladder-orientation fix can be visually
// verified without waiting on real fixtures. Remove again once done.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const key = (req.method === 'GET' ? req.query.key : req.body?.key) as string | undefined;
  if (!POOL_ADMIN_KEY || key !== POOL_ADMIN_KEY) {
    return res.status(401).json({ error: 'Invalid or missing key' });
  }

  if (req.method === 'POST') {
    const { poolId, poolPatch, playerPatches, picks } = req.body || {};
    if (!poolId || typeof poolId !== 'string') return res.status(400).json({ error: 'Missing poolId' });

    if (poolPatch) {
      const poolRaw = await redis.get<string>(`lms:pool:${poolId}`);
      if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
      const pool = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;
      Object.assign(pool, poolPatch);
      await redis.set(`lms:pool:${poolId}`, JSON.stringify(pool));
    }

    if (Array.isArray(playerPatches)) {
      const playersKey = `lms:pool:${poolId}:players`;
      for (const patch of playerPatches) {
        const raw = await redis.hget<string>(playersKey, patch.token);
        if (!raw) continue;
        const player = typeof raw === 'string' ? JSON.parse(raw) : raw as any;
        Object.assign(player, patch);
        await redis.hset(playersKey, { [patch.token]: JSON.stringify(player) });
      }
    }

    if (Array.isArray(picks)) {
      const picksTTL = 60 * 60 * 24 * 300;
      for (const p of picks) {
        await redis.set(`lms:pool:${poolId}:picks:${p.gw}`, JSON.stringify({
          gw: p.gw,
          totalPlayers: p.totalPlayers,
          counts: p.counts,
          picks: p.picks,
          noPick: p.noPick ?? 0,
        }), { ex: picksTTL });
      }
    }

    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { poolId } = req.body || {};
    if (!poolId || typeof poolId !== 'string') return res.status(400).json({ error: 'Missing poolId' });
    const poolRaw = await redis.get<string>(`lms:pool:${poolId}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const pool = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

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
