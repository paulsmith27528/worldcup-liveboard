import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const BASE_URL = process.env.BASE_URL!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { token, companyName } = req.body;
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'token required' });
  if (!companyName || typeof companyName !== 'string') return res.status(400).json({ error: 'companyName required' });
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'gbp', product_data: { name: 'World Cup LiveBoard — Company Branding', description: 'Your logo on the bracket, header and invite emails' }, unit_amount: 1999 }, quantity: 1 }],
      metadata: { isBranding: 'true', token, companyName },
      success_url: BASE_URL + '/branding-upload.html?token=' + token + '&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: BASE_URL + '/branding.html?token=' + token,
    });
    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
