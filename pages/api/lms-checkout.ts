import type { NextApiRequest, NextApiResponse } from 'next';

// Retired: Last Man Standing pool creation is free now (see lms-create.ts),
// so this old £4.99 checkout must never take another payment.
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({ error: 'Paid pool creation has been retired — pools are now free to create.' });
}
