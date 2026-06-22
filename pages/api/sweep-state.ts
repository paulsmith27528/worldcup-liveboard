import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const STATE_TTL = 60 * 60 * 24 * 90; // 90 days

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET /api/sweep-state?id=xxx&k=yyy  — load organiser state by sweep id
  // GET /api/sweep-state?purchaseToken=xxx — load organiser state by purchase token
  if (req.method === 'GET') {
    const { id, k, purchaseToken } = req.query;

    // Lookup by purchase token (for cross-device resume)
    if (purchaseToken && typeof purchaseToken === 'string') {
      try {
        const mapping = await redis.get<{id: string, k: string}>(`sweep:bytoken:${purchaseToken}`);
        if (!mapping) return res.status(404).json({ error: 'No sweepstake found for this token' });
        const state = await redis.get<object>(`sweep:orgstate:${mapping.id}`);
        if (!state) return res.status(404).json({ error: 'No saved state found' });
        return res.status(200).json({ state, sw: mapping.id, k: mapping.k });
      } catch (err) {
        console.error('sweep-state GET by purchaseToken error:', err);
        return res.status(500).json({ error: 'Failed to load state' });
      }
    }

    if (!id || !k || typeof id !== 'string' || typeof k !== 'string') {
      return res.status(400).json({ error: 'Missing id or k' });
    }
    try {
      const storedToken = await redis.get<string>(`sweep:orgtoken:${id}`);
      if (!storedToken || storedToken !== k) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      const state = await redis.get<object>(`sweep:orgstate:${id}`);
      if (!state) return res.status(404).json({ error: 'No saved state found' });
      return res.status(200).json({ state });
    } catch (err) {
      console.error('sweep-state GET error:', err);
      return res.status(500).json({ error: 'Failed to load state' });
    }
  }

  // POST /api/sweep-state — register purchase token → sweepstake mapping
  if (req.method === 'POST') {
    const { purchaseToken, id, k } = req.body;
    if (!purchaseToken || !id || !k) {
      return res.status(400).json({ error: 'Missing purchaseToken, id, or k' });
    }
    try {
      await redis.set(`sweep:bytoken:${purchaseToken}`, JSON.stringify({ id, k }), { ex: STATE_TTL });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('sweep-state POST error:', err);
      return res.status(500).json({ error: 'Failed to register mapping' });
    }
  }

  // PUT /api/sweep-state  — save organiser state
  if (req.method === 'PUT') {
    const { id, k, state } = req.body;
    if (!id || !k || !state) {
      return res.status(400).json({ error: 'Missing id, k, or state' });
    }
    try {
      const tokenKey = `sweep:orgtoken:${id}`;
      const storedToken = await redis.get<string>(tokenKey);

      // First save: register the token. Subsequent saves: verify it.
      if (storedToken && storedToken !== k) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (!storedToken) {
        await redis.set(tokenKey, k, { ex: STATE_TTL });
      }

      await redis.set(`sweep:orgstate:${id}`, JSON.stringify(state), { ex: STATE_TTL });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('sweep-state PUT error:', err);
      return res.status(500).json({ error: 'Failed to save state' });
    }
  }

  return res.status(405).end();
}

      }
      const state = await redis.get<object>(`sweep:orgstate:${id}`);
      if (!state) return res.status(404).json({ error: 'No saved state found' });
      return res.status(200).json({ state });
    } catch (err) {
      console.error('sweep-state GET error:', err);
      return res.status(500).json({ error: 'Failed to load state' });
    }
  }

  // PUT /api/sweep-state  — save organiser state
  if (req.method === 'PUT') {
    const { id, k, state } = req.body;
    if (!id || !k || !state) {
      return res.status(400).json({ error: 'Missing id, k, or state' });
    }
    try {
      const tokenKey = `sweep:orgtoken:${id}`;
      const storedToken = await redis.get<string>(tokenKey);

      // First save: register the token. Subsequent saves: verify it.
      if (storedToken && storedToken !== k) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (!storedToken) {
        await redis.set(tokenKey, k, { ex: STATE_TTL });
      }

      await redis.set(`sweep:orgstate:${id}`, JSON.stringify(state), { ex: STATE_TTL });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('sweep-state PUT error:', err);
      return res.status(500).json({ error: 'Failed to save state' });
    }
  }

  return res.status(405).end();
}
