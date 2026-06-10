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

function mapStatus(short: string): string {
  if (["1H", "2H", "ET"].includes(short)) return "LIVE";
  if (short === "HT") return "HT";
  if (["FT", "AET"].includes(short)) return "FT";
  if (short === "PEN") return "PEN";
  return "NS";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=40");

  if (!API_KEY) {
    return res.status(500).json({ error: "API_FOOTBALL_KEY not configured" });
  }

  try {
    const hdrs = { "x-apisports-key": API_KEY };
    const today = new Date().toISOString().slice(0, 10);

    const [liveRes, todayRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/fixtures?live=all&league=${WC_LEAGUE}&season=${WC_SEASON}`, { headers: hdrs }),
      fetch(`https://v3.football.api-sports.io/fixtures?date=${today}&league=${WC_LEAGUE}&season=${WC_SEASON}`, { headers: hdrs }),
    ]);

    const [liveData, todayData] = await Promise.all([liveRes.json(), todayRes.json()]);

    const liveFixtures: any[] = liveData.response || [];
    const todayFixtures: any[] = todayData.response || [];
    const liveIds = new Set(liveFixtures.map((f: any) => f.fixture.id));

    const combined = [
      ...liveFixtures,
      ...todayFixtures.filter((f: any) => !liveIds.has(f.fixture.id)),
    ];

    const matches = combined.map((f: any) => ({
      id: f.fixture.id,
      status: mapStatus(f.fixture.status.short),
      minute: f.fixture.status.elapsed ?? null,
      homeTeam: f.teams.home.name,
      homeCode: getCode(f.teams.home.id, f.teams.home.code, f.teams.home.name),
      homeFlag: null,
      awayTeam: f.teams.away.name,
      awayCode: getCode(f.teams.away.id, f.teams.away.code, f.teams.away.name),
      awayFlag: null,
      homeScore: f.goals.home,
      awayScore: f.goals.away,
      venue: f.fixture.venue?.name || "",
      date: f.fixture.date,
      round: f.league.round || "",
      group: (f.league.round || "").replace(/Group Stage - /i, "").trim(),
    }));

    return res.status(200).json({
      status: "ok",
      updatedAt: new Date().toISOString(),
      matches,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch live scores", message: String(err) });
  }
}
