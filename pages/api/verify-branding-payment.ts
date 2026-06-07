import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { Redis } from '@upstash/redis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { session_id, token } = req.query;
  if (!session_id || typeof session_id !== 'string') return res.status(400).json({ error: 'session_id required' });
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'token required' });
  try {
    const raw = await redis.get('branding:' + token);
    const existing = typeof raw === 'string' ? JSON.parse(raw) : raw as any;
    if (existing?.paid) {
      return res.status(200).json({ paid: true, companyName: existing.companyName, hasLogo: !!existing.logoUrl });
    }
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') return res.status(200).json({ paid: false });
    const companyName = session.metadata?.companyName || '';
    if (session.metadata?.token !== token) return res.status(400).json({ error: 'Token mismatch' });
    await redis.set('branding:' + token, JSON.stringify({ paid: true, companyName, logoUrl: null, paidAt: Date.now() }));
    return res.status(200).json({ paid: true, companyName, hasLogo: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
