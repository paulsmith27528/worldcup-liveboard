import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const LMS_TTL = 60 * 60 * 24 * 300; // 300 days — matches every other LMS key

const ALLOWED_EMOJI = ['💀', '🔥', '😂', '🤌', '🚨', '🙈', '💩'];

// Sending is Pro-only (viewing isn't) — same pattern as every other Pro
// gate in LMS: 403 with an upgradeUrl the frontend can drop straight into
// its existing pro-gate UI.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pool, t, target, emoji } = req.body;
  if (!pool || typeof pool !== 'string') return res.status(400).json({ error: 'Missing pool' });
  if (!t || typeof t !== 'string') return res.status(400).json({ error: 'Missing player token' });
  if (!target || (typeof target !== 'string' && typeof target !== 'number')) return res.status(400).json({ error: 'Missing target' });
  if (!ALLOWED_EMOJI.includes(emoji)) return res.status(400).json({ error: 'Invalid emoji' });

  const playersRaw = await redis.hgetall<Record<string, string>>(`lms:pool:${pool}:players`);
  if (!playersRaw) return res.status(404).json({ error: 'Pool not found' });
  const players = Object.values(playersRaw).map((raw: any) => typeof raw === 'string' ? JSON.parse(raw) : raw);

  const sender = players.find((p: any) => p.token === t);
  if (!sender) return res.status(404).json({ error: 'Player not found' });
  if (!sender.proPaid) {
    return res.status(403).json({
      error: 'pro_required',
      upgradeUrl: `/api/lms-pro-checkout?pool=${pool}&t=${t}`,
    });
  }

  const targetPlayer = players.find((p: any) => String(p.id) === String(target));
  if (!targetPlayer) return res.status(404).json({ error: 'Target player not found' });

  const field = `${target}:${emoji}`;
  const reactionsKey = `lms:pool:${pool}:reactions`;
  const count = await redis.hincrby(reactionsKey, field, 1);
  await redis.expire(reactionsKey, LMS_TTL);

  return res.status(200).json({ ok: true, target: String(target), emoji, count });
}
