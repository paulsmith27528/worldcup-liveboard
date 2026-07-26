import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { Redis } from '@upstash/redis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const BASE_URL = process.env.BASE_URL!;

// Same £5 fee, but "charged independently" per competition — a separate
// Stripe price per league, even though the amount is identical, so each
// product's revenue is reported separately in Stripe.
// TODO: replace the two placeholders once created (one-time, £5 each) — must
// match PRICE_MAP in stripe-webhook.ts exactly.
const LMS_ORGANISER_FEE_PRICE_ID: Record<string, string> = {
  PL: 'price_1TxODB3g62IhPcY7FUPj1XzO',
  CHAMPIONSHIP: 'price_REPLACE_WITH_CHAMPIONSHIP_ORGANISER_FEE_PRICE_ID',
  UCL: 'price_REPLACE_WITH_UCL_ORGANISER_FEE_PRICE_ID',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { pool, k } = req.query;
  if (!pool || typeof pool !== 'string' || !k || typeof k !== 'string') {
    return res.status(400).json({ error: 'Missing pool or k' });
  }

  const storedToken = await redis.get<string>(`lms:orgtoken:${pool}`);
  if (!storedToken || storedToken !== k) {
    return res.status(401).json({ error: 'Invalid organiser link' });
  }

  const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
  if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
  const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

  if (poolData.organiserFeePaid) {
    return res.redirect(303, `${BASE_URL}/lms-organiser.html?pool=${pool}&k=${k}`);
  }

  const priceId = LMS_ORGANISER_FEE_PRICE_ID[poolData.league || 'PL'] || LMS_ORGANISER_FEE_PRICE_ID.PL;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: poolData.organiserEmail || undefined,
      success_url: `${BASE_URL}/lms-organiser.html?pool=${pool}&k=${k}`,
      cancel_url: `${BASE_URL}/lms-organiser.html?pool=${pool}&k=${k}`,
      metadata: {
        product: 'lms_organiser_fee',
        pool,
      },
    });

    res.redirect(303, session.url!);
  } catch (err: any) {
    console.error('LMS organiser fee checkout error:', err.message);
    res.status(500).json({ error: 'Failed to start checkout', detail: err.message });
  }
}
