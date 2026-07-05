import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const BASE_URL = 'https://www.worldcupliveboard.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { bid, email } = req.query;
  if (!bid || typeof bid !== 'string') {
    return res.status(400).json({ error: 'Missing bid' });
  }

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      line_items: [{
        price: 'price_1TpoVC3g62IhPcY79JRQOJV7',
        quantity: 1,
      }],
      success_url: `${BASE_URL}/success.html`,
      cancel_url: `${BASE_URL}/sweep-view.html?bid=${bid}`,
      metadata: {
        bid,
        product: 'pro',
      },
      client_reference_id: bid,
    };

    // Pre-fill email if provided
    if (email && typeof email === 'string') {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    
    // Redirect straight to the Stripe checkout
    res.redirect(303, session.url!);
  } catch (err: any) {
    console.error('Pro checkout error:', err.message);
    // Fall back to the payment link if session creation fails
    res.redirect(303, `https://buy.stripe.com/28E8wI3tm36JcTQ3eV3F606`);
  }
}
