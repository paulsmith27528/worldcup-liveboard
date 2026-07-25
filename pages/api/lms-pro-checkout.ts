import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { Redis } from '@upstash/redis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const BASE_URL = process.env.BASE_URL!;

// TODO: replace with the real Stripe price ID once created (one-time, £1) —
// see PRICE_MAP in stripe-webhook.ts, which must use the exact same ID.
const LMS_PRO_PRICE_ID = 'price_REPLACE_WITH_LMS_PRO_PRICE_ID';

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

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: LMS_PRO_PRICE_ID, quantity: 1 }],
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
