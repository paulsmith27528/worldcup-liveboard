import type { NextApiRequest, NextApiResponse } from 'next';

const API_KEY = (process.env.API_FOOTBALL_KEY || '').trim();
const WC_LEAGUE = 1;
const WC_SEASON = 2026;

function mapStatus(s: string): string {
  if (['FT','AET'].includes(s)) return 'FT';
  if (s === 'PEN') return 'PEN';
  if (['1H','2H','ET'].includes(s)) return 'LIVE';
  if (s === 'HT') return 'HT';
  if (s === 'NS') return 'NS';
  if (s === 'PST') return 'PST';
  return s;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  if (!API_KEY) {
    return res.status(500).json({ error: 'API_FOOTBALL_KEY not configured' });
  }

  try {
    // Fetch all WC 2026 fixtures + any currently live fixtures
    const [allRes, liveRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}`, {
        headers: { 'x-apisports-key': API_KEY },
      }),
      fetch(`https://v3.football.api-sports.io/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}&live=all`, {
        headers: { 'x-apisports-key': API_KEY },
      }),
    ]);

    if (!allRes.ok) {
      return res.status(502).json({ error: 'API-Football request failed', status: allRes.status });
    }

    const [allData, liveData] = await Promise.all([allRes.json(), liveRes.json()]);

    const allFixtures: any[] = allData.response || [];
    const liveFixtures: any[] = liveData.response || [];

    // Build a live match lookup by fixture id for fast merging
    const liveById: Record<number, any> = {};
    liveFixtures.forEach((f: any) => { liveById[f.fixture.id] = f; });

    // Flatten all fixtures into a simple map keyed by "HOMECODE_AWAYCODE"
    const matches = allFixtures.map((f: any) => {
      const live = liveById[f.fixture.id];
      const src = live || f;
      const homeCode = (src.teams.home.code || src.teams.home.name.slice(0, 3)).toUpperCase();
      const awayCode = (src.teams.away.code || src.teams.away.name.slice(0, 3)).toUpperCase();
      const status = mapStatus(src.fixture.status.short);
      const minute = src.fixture.status.elapsed ?? null;

      return {
        id: src.fixture.id,
        homeCode,
        homeName: src.teams.home.name,
        homeScore: src.goals.home,
        awayCode,
        awayName: src.teams.away.name,
        awayScore: src.goals.away,
        status,
        minute,
        round: src.league.round || '',
        date: src.fixture.date,
        venue: src.fixture.venue?.name || '',
      };
    });

    // Also return live matches in LIVE_MATCHES format for the match centre panel
    const liveMatches = liveFixtures.map((f: any) => {
      const homeCode = (f.teams.home.code || f.teams.home.name.slice(0, 3)).toUpperCase();
      const awayCode = (f.teams.away.code || f.teams.away.name.slice(0, 3)).toUpperCase();
      return {
        id: f.fixture.id,
        status: f.fixture.status.short === 'HT' ? 'HT' : 'LIVE',
        minute: f.fixture.status.elapsed ?? 0,
        hTeam: f.teams.home.name,
        hAbbr: homeCode,
        aTeam: f.teams.away.name,
        aAbbr: awayCode,
        hScore: f.goals.home ?? 0,
        aScore: f.goals.away ?? 0,
        venue: f.fixture.venue?.name || '',
        scorers: [],
      };
    });

    // Today's fixtures (not live, not finished) for the match centre
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMatches = allFixtures
      .filter((f: any) => {
        const matchDate = f.fixture.date.split('T')[0];
        const status = f.fixture.status.short;
        return matchDate === todayStr && status === 'NS';
      })
      .map((f: any) => {
        const homeCode = (f.teams.home.code || f.teams.home.name.slice(0, 3)).toUpperCase();
        const awayCode = (f.teams.away.code || f.teams.away.name.slice(0, 3)).toUpperCase();
        return {
          id: f.fixture.id,
          status: 'TODAY',
          minute: null,
          hTeam: f.teams.home.name,
          hAbbr: homeCode,
          aTeam: f.teams.away.name,
          aAbbr: awayCode,
          hScore: null,
          aScore: null,
          venue: f.fixture.venue?.name || '',
          kickoff: f.fixture.date,
          scorers: [],
        };
      });

    return res.status(200).json({
      updatedAt: new Date().toISOString(),
      matches,
      liveMatches: [...liveMatches, ...todayMatches],
    });

  } catch (err) {
    console.error('bracket.ts error:', err);
    return res.status(500).json({ error: 'Failed to fetch bracket data', message: String(err) });
  }
}
