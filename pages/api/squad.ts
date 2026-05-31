import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = req.query;

  if (!teamId) {
    return res.status(400).json({ error: 'teamId required' });
  }

  const apiKey = (process.env.API_FOOTBALL_KEY || '').trim();

  if (!apiKey) {
    return res.status(500).json({ error: 'API_FOOTBALL_KEY not set in Vercel environment variables' });
  }

  // Debug: confirm key length without exposing it
  console.log('API key length:', apiKey.length, 'first 4 chars:', apiKey.substring(0, 4));

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/players/squads?team=${teamId}`,
      {
        headers: {
          'x-apisports-key': apiKey,
          'x-rapidapi-host': 'v3.football.api-sports.io',
        },
      }
    );

    const data = await response.json();

    // If the API still returns an error, expose it for debugging
    if (data.errors && Object.keys(data.errors).length > 0) {
      return res.status(200).json({
        error: 'API-Football rejected the key',
        details: data.errors,
        keyLength: apiKey.length,
        hint: 'Copy the key fresh from dashboard.api-football.com — no spaces',
      });
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Fetch failed', message: String(error) });
  }
}
