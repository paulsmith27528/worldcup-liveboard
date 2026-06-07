import type { NextApiRequest, NextApiResponse } from "next";

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();
const WC_LEAGUE = 1;
const WC_SEASON = 2026;

const CODE_OVERRIDES: Record<number, string> = {
  1531: "RSA", 17: "KOR", 768: "AUT", 32: "AUS", 1113: "BIH",
  770: "CZE", 497: "IRN", 4301: "IRQ", 107: "COD", 6665: "CPV",
  6667: "CUW", 5529: "CAN", 2: "KSA",
};

function getCode(teamId: number, apiCode: string | null, name: string): string {
  if (CODE_OVERRIDES[teamId]) return CODE_OVERRIDES[teamId];
  if (apiCode && apiCode.length <= 4) return apiCode.toUpperCase();
  return name.slice(0, 3).toUpperCase();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
  if (!API_KEY) return res.status(500).json({ error: "API_FOOTBALL_KEY not configured" });

  try {
    const r = await fetch(
      `https://v3.football.api-sports.io/standings?league=${WC_LEAGUE}&season=${WC_SEASON}`,
      { headers: { "x-apisports-key": API_KEY } }
    );
    const data = await r.json();
    const leagues = data.response || [];
    if (!leagues.length) return res.status(200).json({ groups: {}, qualifying3rds: [] });

    const standingsGroups = leagues[0].league.standings;
    const groups = {};

    for (const group of standingsGroups) {
      if (!group.length) continue;
      const letter = (group[0].group || "").replace(/Group\s*/i, "").trim();
      if (!letter) continue;
      groups[letter] = group.map((t) => ({
        rank: t.rank,
        teamId: t.team.id,
        name: t.team.name,
        code: getCode(t.team.id, t.team.code || null, t.team.name),
        played: t.all.played,
        points: t.points,
        gd: t.goalsDiff,
        gf: t.all.goals.for,
        ga: t.all.goals.against,
        won: t.all.win,
        drawn: t.all.draw,
        lost: t.all.lose,
      }));
    }

    const thirds = (Object.entries(groups) as Array<[string, any[]]>)
      .filter(([, teams]) => teams.length >= 3)
      .map(([letter, teams]) => ({ group: letter, ...teams[2] }))
      .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

    const qualifying3rds = thirds.slice(0, 8).map((t) => t.group);

    return res.status(200).json({
      updatedAt: new Date().toISOString(),
      groups,
      qualifying3rds,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch standings", message: String(err) });
  }
}