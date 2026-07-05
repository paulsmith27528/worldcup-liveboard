import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, tournament } = req.body;
  if (!name || !email || !tournament) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const entry = {
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    tournament: String(tournament).trim(),
    joinedAt: new Date().toISOString(),
  };

  // Store in a Redis list so we can retrieve all entries later
  await redis.lpush('waitlist:combined', JSON.stringify(entry));

  // Also store by tournament for easy filtering
  const key = tournament.toLowerCase().includes('premier')
    ? 'waitlist:pl'
    : 'waitlist:ucl';
  await redis.lpush(key, JSON.stringify(entry));

  console.log('Waitlist signup:', entry.email, '—', entry.tournament);

  return res.status(200).json({ ok: true });
}
