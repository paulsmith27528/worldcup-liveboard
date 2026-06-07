import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { token, companyName, logoDataUrl } = req.body;
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'token required' });
  if (!companyName || typeof companyName !== 'string') return res.status(400).json({ error: 'companyName required' });
  if (!logoDataUrl || typeof logoDataUrl !== 'string') return res.status(400).json({ error: 'logoDataUrl required' });
  if (!logoDataUrl.startsWith('data:image/')) return res.status(400).json({ error: 'Must be an image file' });
  if (logoDataUrl.length > 600000) return res.status(400).json({ error: 'Image too large. Please use a file under 400KB.' });
  try {
    const raw = await redis.get('branding:' + token);
    const existing = typeof raw === 'string' ? JSON.parse(raw) : raw as any;
    if (!existing?.paid) return res.status(403).json({ error: 'Payment not confirmed for this token' });
    await redis.set('branding:' + token, JSON.stringify({ ...existing, companyName, logoUrl: logoDataUrl, uploadedAt: Date.now() }));
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
