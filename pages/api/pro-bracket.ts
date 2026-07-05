import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { pro } = req.query;
  if (!pro || typeof pro !== 'string') {
    return res.status(400).json({ error: 'Missing pro token' });
  }

  // Look up the Pro token in Redis
  const raw = await redis.get<string>(`protoken:${pro}`);
  if (!raw) return res.status(404).json({ error: 'Pro token not found or expired' });

  const proData = typeof raw === 'string' ? JSON.parse(raw) : raw;

  // Now fetch the bracket data so we can return the full draw
  let bracketData = null;
  if (proData.bid) {
    const bracketRaw = await redis.get<string>(`bracket:${proData.bid}`);
    if (bracketRaw) {
      bracketData = typeof bracketRaw === 'string' ? JSON.parse(bracketRaw) : bracketRaw;
    }
  }

  return res.status(200).json({
    name: proData.name,
    email: proData.email,
    teamName: proData.teamName,
    teamFlag: proData.teamFlag,
    colour: proData.colour,
    bid: proData.bid,
    sweepstakeName: proData.sweepstakeName,
    entries: bracketData?.entries || [],
    currency: bracketData?.cur || '£',
  });
}
