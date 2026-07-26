import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import { randomBytes } from 'crypto';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const LMS_TTL = 60 * 60 * 24 * 300; // 300 days — covers a full PL season

function genPoolId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateOrgToken(): string {
  return randomBytes(32).toString('hex');
}

// Free, instant pool creation — no payment involved. Mirrors exactly what the
// Stripe webhook used to create on successful LMS payment, minus the payment.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const poolId = genPoolId();
  const orgToken = generateOrgToken();

  try {
    await redis.set(`lms:pool:${poolId}`, JSON.stringify({
      id: poolId,
      name: null,
      organiser: null,
      organiserEmail: null,
      orgToken,
      buyIn: null,
      currentGameweek: 1,
      lastGradedGw: 0,
      wipeoutRule: 'rollback',
      wipeoutWeeks: [] as number[],
      createdAt: Date.now(),
      status: 'pending_setup',
      organiserFeePaid: false,
      organiserFeeNotified: false,
    }), { ex: LMS_TTL });

    await redis.set(`lms:orgtoken:${poolId}`, orgToken, { ex: LMS_TTL });
    await redis.sadd('lms:allpools', poolId);
  } catch (err: any) {
    console.error('Failed to create free LMS pool:', err.message);
    return res.status(500).json({ error: 'Failed to create pool' });
  }

  return res.status(200).json({ poolId, orgToken, setupUrl: `/lms-setup.html?pool=${poolId}&k=${orgToken}` });
}
