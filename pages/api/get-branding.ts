import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { token } = req.query;
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'token required' });
  res.setHeader('Cache-Control', 'no-store');
  try {
    const raw = await redis.get('branding:' + token);
    if (!raw) return res.status(200).json({ branding: null });
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw as any;
    if (!data.logoUrl) return res.status(200).json({ branding: null });
    return res.status(200).json({ branding: { companyName: data.companyName || '', logoUrl: data.logoUrl } });
  } catch {
    return res.status(200).json({ branding: null });
  }
}
