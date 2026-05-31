import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId, page = '1' } = req.query;

  if (!teamId) {
    return res.status(400).json({ error: 'teamId required' });
  }

  const apiKey = (process.env.API_FOOTBALL_KEY || '').trim();

  if (!apiKey) {
    return res.status(500).json({ error: 'API_FOOTBALL_KEY not set in Vercel environment variables' });
  }

  try {
    // Use /players endpoint — returns full profile: DOB, birthplace, height, nationality, club stats
    const url = `https://v3.football.api-sports.io/players?team=${teamId}&season=2024&page=${page}`;

    const response = await fetch(url, {
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      // Fallback to squad endpoint if players endpoint fails
      const fallback = await fetch(
        `https://v3.football.api-sports.io/players/squads?team=${teamId}`,
        { headers: { 'x-apisports-key': apiKey } }
      );
      const fallbackData = await fallback.json();
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
      return res.status(200).json({ ...fallbackData, _source: 'squads' });
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json({ ...data, _source: 'players' });
  } catch (error) {
    res.status(500).json({ error: 'Fetch failed', message: String(error) });
  }
}
