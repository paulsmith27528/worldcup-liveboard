import type { NextApiRequest, NextApiResponse } from "next";

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!API_KEY) return res.status(500).json({ error: "No API key" });

  try {
    // Try WC 2026 fixtures
    const r1 = await fetch("https://v3.football.api-sports.io/fixtures?league=1&season=2026", {
      headers: { "x-apisports-key": API_KEY }
    });
    const d1 = await r1.json();

    // Also check available leagues for 2026
    const r2 = await fetch("https://v3.football.api-sports.io/leagues?id=1&season=2026", {
      headers: { "x-apisports-key": API_KEY }
    });
    const d2 = await r2.json();

    // Check account status
    const r3 = await fetch("https://v3.football.api-sports.io/status", {
      headers: { "x-apisports-key": API_KEY }
    });
    const d3 = await r3.json();

    res.status(200).json({
      accountStatus: d3.response,
      wcLeague: d2.response,
      fixtureCount: d1.results,
      fixtureErrors: d1.errors,
      firstFewFixtures: (d1.response || []).slice(0, 3)
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}