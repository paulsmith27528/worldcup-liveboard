import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { Redis } from '@upstash/redis';
import { poolPlayerLimit } from '../../lib/lms-limits';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const BASE_URL = process.env.BASE_URL!;
const BIG_POOL_FEE_PENCE = 2000; // £20

// £5 upgrade (up to 100 players). Same £5 fee, but "charged independently" per competition — a separate
// Stripe price per league, even though the amount is identical, so each
// product's revenue is reported separately in Stripe.
// TODO: replace the placeholder once created (one-time, £5) — must
// match PRICE_MAP in stripe-webhook.ts exactly.
const LMS_ORGANISER_FEE_PRICE_ID: Record<string, string> = {
  PL: 'price_1TxODB3g62IhPcY7FUPj1XzO',
  CHAMPIONSHIP: 'price_1TxZHh3g62IhPcY7CKUJMBDC',
  UCL: 'price_1TxZLB3g62IhPcY7VAvHsXrA',
  SPL: 'price_1U19BR3g62IhPcY7ZjYDdlhJ',
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

  const hubUrl = `${BASE_URL}/lms-organiser.html?pool=${pool}&k=${k}`;
  // Already at no limit — nothing left to buy.
  if (poolPlayerLimit(poolData) === Infinity) return res.redirect(303, hubUrl);

  // £20 no-limit upgrade: for pools that already paid £5, or an organiser who
  // asks for it up front (?tier=big). Priced inline so no Stripe dashboard
  // setup is needed; the webhook recognises it by its metadata.
  const wantsBig = poolData.organiserFeePaid || req.query.tier === 'big';
  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = wantsBig
    ? {
        price_data: {
          currency: 'gbp',
          unit_amount: BIG_POOL_FEE_PENCE,
          product_data: { name: 'Last Man Standing — Big Pool Upgrade (no player limit)' },
        },
        quantity: 1,
      }
    : { price: LMS_ORGANISER_FEE_PRICE_ID[poolData.league || 'PL'] || LMS_ORGANISER_FEE_PRICE_ID.PL, quantity: 1 };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [lineItem],
      customer_email: poolData.organiserEmail || undefined,
      success_url: hubUrl,
      cancel_url: hubUrl,
      metadata: {
        product: wantsBig ? 'lms_organiser_big_fee' : 'lms_organiser_fee',
        pool,
      },
    });

    res.redirect(303, session.url!);
  } catch (err: any) {
    console.error('LMS organiser fee checkout error:', err.message);
    res.status(500).json({ error: 'Failed to start checkout', detail: err.message });
  }
}
