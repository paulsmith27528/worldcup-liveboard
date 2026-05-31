import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = req.query;

  if (!teamId) {
    return res.status(400).json({ error: 'teamId required' });
  }

  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API_FOOTBALL_KEY not set in environment variables' });
  }

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/players/squads?team=${teamId}`,
      {
        headers: {
          'x-apisports-key': apiKey,
        },
      }
    );

    const data = await response.json();

    // Cache for 1 hour
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch squad data' });
  }
}
