import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Recovery path for a player who reached a Pro-gated page without their
// personal token (e.g. a shared pool link) — lets them find their own
// upgrade link by confirming the email they joined with, instead of being
// stuck with no way to pay at all.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pool, email } = req.body;
  if (!pool || typeof pool !== 'string' || !email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Missing pool or email' });
  }

  const playersRaw = await redis.hgetall<Record<string, string>>(`lms:pool:${pool}:players`);
  const players = playersRaw
    ? Object.values(playersRaw).map((raw: any) => typeof raw === 'string' ? JSON.parse(raw) : raw)
    : [];

  const normalisedEmail = email.trim().toLowerCase();
  const match = players.find((p: any) => (p.email || '').toLowerCase() === normalisedEmail);

  if (!match) {
    return res.status(404).json({ error: "We couldn't find that email in this pool." });
  }

  return res.status(200).json({ token: match.token });
}
