import type { NextApiRequest, NextApiResponse } from "next";

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();
const WC_LEAGUE = 1;
const WC_SEASON = 2026;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  if (!API_KEY) return res.status(500).json({ error: "API_FOOTBALL_KEY not configured" });

  try {
    const r = await fetch(
      `https://v3.football.api-sports.io/players/topscorers?league=${WC_LEAGUE}&season=${WC_SEASON}`,
      { headers: { "x-apisports-key": API_KEY } }
    );
    const data = await r.json();
    const players = (data.response || []).slice(0, 10).map((p: any) => ({
      name: p.player.name,
      firstname: p.player.firstname,
      nationality: p.player.nationality,
      goals: p.statistics[0]?.goals?.total ?? 0,
      assists: p.statistics[0]?.goals?.assists ?? 0,
      games: p.statistics[0]?.games?.appearences ?? 0,
    }));

    return res.status(200).json({ updatedAt: new Date().toISOString(), players });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch top scorers", message: String(err) });
  }
}
