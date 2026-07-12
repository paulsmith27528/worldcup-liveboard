import type { NextApiRequest, NextApiResponse } from 'next';

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();
const PL_LEAGUE = 39;
const PL_SEASON = 2026; // 2026/27 season

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!API_KEY) return res.status(500).json({ error: "API_FOOTBALL_KEY not configured" });

  try {
    const hdrs = { "x-apisports-key": API_KEY };
    const requestedGw = req.query.gw ? String(req.query.gw) : null;

    // Get the full team list once (used to build the pick grid)
    const teamsRes = await fetch(`https://v3.football.api-sports.io/teams?league=${PL_LEAGUE}&season=${PL_SEASON}`, { headers: hdrs });
    const teamsData = await teamsRes.json();
    const teams = (teamsData.response || []).map((t: any) => ({
      id: t.team.id,
      name: t.team.name,
      code: t.team.code || t.team.name.slice(0, 3).toUpperCase(),
      logo: t.team.logo,
    }));

    let round: string | null = null;

    if (requestedGw) {
      round = `Regular Season - ${requestedGw}`;
    } else {
      // Auto-detect: find the earliest fixture that hasn't kicked off yet, use its round
      const upcomingRes = await fetch(`https://v3.football.api-sports.io/fixtures?league=${PL_LEAGUE}&season=${PL_SEASON}&status=NS`, { headers: hdrs });
      const upcomingData = await upcomingRes.json();
      const upcoming = (upcomingData.response || []).sort((a: any, b: any) =>
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
      );
      if (upcoming.length > 0) {
        round = upcoming[0].league.round;
      }
    }

    if (!round) {
      return res.status(200).json({ gw: null, fixtures: [], teams, deadline: null, message: "No upcoming gameweek found" });
    }

    const gwMatch = round.match(/(\d+)$/);
    const gwNumber = gwMatch ? parseInt(gwMatch[1], 10) : null;

    const roundRes = await fetch(`https://v3.football.api-sports.io/fixtures?league=${PL_LEAGUE}&season=${PL_SEASON}&round=${encodeURIComponent(round)}`, { headers: hdrs });
    const roundData = await roundRes.json();

    const fixtures = (roundData.response || []).map((f: any) => ({
      id: f.fixture.id,
      date: f.fixture.date,
      venue: f.fixture.venue?.name || "",
      status: f.fixture.status.short,
      home: { id: f.teams.home.id, name: f.teams.home.name },
      away: { id: f.teams.away.id, name: f.teams.away.name },
    })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const deadline = fixtures.length > 0 ? fixtures[0].date : null;

    return res.status(200).json({ gw: gwNumber, round, fixtures, teams, deadline });
  } catch (err: any) {
    console.error("lms-fixtures error:", err.message);
    return res.status(500).json({ error: "Failed to load fixtures", detail: err.message });
  }
}
