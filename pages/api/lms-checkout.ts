import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const BASE_URL = 'https://www.worldcupliveboard.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { poolName, organiser, email } = req.query;
  if (!poolName || typeof poolName !== 'string' || !organiser || typeof organiser !== 'string') {
    return res.status(400).json({ error: 'Missing poolName or organiser' });
  }

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      line_items: [{
        price: 'price_1Trj6f3g62IhPcY7V2jgis7d',
        quantity: 1,
      }],
      success_url: `${BASE_URL}/success.html`,
      cancel_url: `${BASE_URL}/lms-create.html`,
      metadata: {
        product: 'lms',
        poolName,
        organiser,
      },
    };

    if (email && typeof email === 'string') {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.redirect(303, session.url!);
  } catch (err: any) {
    console.error('LMS checkout error:', err.message);
    res.status(500).json({ error: 'Failed to start checkout', detail: err.message });
  }
}
