import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const BASE_URL = process.env.BASE_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price: 'price_1TtoGI3g62IhPcY7hIKrcKiX',
        quantity: 1,
      }],
      success_url: `${BASE_URL}/lms-success.html`,
      cancel_url: `${BASE_URL}/landing.html`,
      metadata: {
        product: 'lms',
      },
    });

    res.redirect(303, session.url!);
  } catch (err: any) {
    console.error('LMS checkout error:', err.message);
    res.status(500).json({ error: 'Failed to start checkout', detail: err.message });
  }
}
