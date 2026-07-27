import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { Redis } from '@upstash/redis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const BASE_URL = process.env.BASE_URL!;

// Same £1 upgrade, but "charged independently" per competition — a separate
// Stripe price per league, even though the amount is identical, so each
// product's revenue is reported separately in Stripe.
// TODO: replace the two placeholders once created (one-time, £1 each) — must
// match PRICE_MAP in stripe-webhook.ts exactly.
const LMS_PRO_PRICE_ID: Record<string, string> = {
  PL: 'price_1TxOB73g62IhPcY7W8hVpZUJ',
  CHAMPIONSHIP: 'price_1TxZGA3g62IhPcY7OV2OZxSp',
  UCL: 'price_1TxZK13g62IhPcY7Va4dW1xd',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { pool, t } = req.query;
  if (!pool || typeof pool !== 'string' || !t || typeof t !== 'string') {
    return res.status(400).json({ error: 'Missing pool or t' });
  }

  const playerRaw = await redis.hget<string>(`lms:pool:${pool}:players`, t);
  if (!playerRaw) return res.status(404).json({ error: 'Player not found' });
  const player = typeof playerRaw === 'string' ? JSON.parse(playerRaw) : playerRaw as any;

  if (player.proPaid) {
    return res.redirect(303, `${BASE_URL}/lms-pick.html?pool=${pool}&t=${t}`);
  }

  const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
  const poolData = poolRaw ? (typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any) : null;
  const priceId = LMS_PRO_PRICE_ID[poolData?.league || 'PL'] || LMS_PRO_PRICE_ID.PL;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: player.email,
      success_url: `${BASE_URL}/lms-pick.html?pool=${pool}&t=${t}&pro=1`,
      cancel_url: `${BASE_URL}/lms-pick.html?pool=${pool}&t=${t}`,
      metadata: {
        product: 'lms_pro',
        pool,
        playerToken: t,
      },
    });

    res.redirect(303, session.url!);
  } catch (err: any) {
    console.error('LMS Pro checkout error:', err.message);
    res.status(500).json({ error: 'Failed to start checkout', detail: err.message });
  }
}
