import type { NextApiRequest, NextApiResponse } from "next";

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();
const WC_LEAGUE = 1;
const WC_SEASON = 2026;

// Override API codes that clash (e.g. Australia vs Austria both get AUS)
const CODE_OVERRIDES: Record<number, string> = {
  1531: "RSA", // South Africa (not SOU)
  17:   "KOR", // South Korea (not SOU)
  768:  "AUT", // Austria (not AUS)
  32:   "AUS", // Australia stays AUS
  1113: "BIH", // Bosnia & Herzegovina
  770:  "CZE", // Czech Republic (api returns CZE already but belt+braces)
  497:  "IRN", // Iran
  4301: "IRQ", // Iraq
  107:  "COD", // Congo DR
  6665: "CPV", // Cape Verde Islands
  6667: "CUW", // Curacao
  5529: "CAN", // Canada
  2:    "KSA", // Saudi Arabia
};

function getCode(teamId: number, apiCode: string | null, name: string): string {
  if (CODE_OVERRIDES[teamId]) return CODE_OVERRIDES[teamId];
  if (apiCode && apiCode.length <= 4) return apiCode.toUpperCase();
  return name.slice(0, 3).toUpperCase();
}

function mapStatus(s: string): string {
  if (["FT","AET"].includes(s)) return "FT";
  if (s === "PEN") return "PEN";
  if (["1H","2H","ET"].includes(s)) return "LIVE";
  if (s === "HT") return "HT";
  if (s === "NS") return "NS";
  return s;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=40");
  if (!API_KEY) return res.status(500).json({ error: "API_FOOTBALL_KEY not configured" });

  try {
    const [allRes, liveRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}`, { headers: { "x-apisports-key": API_KEY } }),
      fetch(`https://v3.football.api-sports.io/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}&live=all`, { headers: { "x-apisports-key": API_KEY } }),
    ]);

    const [allData, liveData] = await Promise.all([allRes.json(), liveRes.json()]);
    const allFixtures: any[] = allData.response || [];
    const liveFixtures: any[] = liveData.response || [];

    const liveById: Record<number, any> = {};
    liveFixtures.forEach((f: any) => { liveById[f.fixture.id] = f; });

    const matches = allFixtures.map((f: any) => {
      const src = liveById[f.fixture.id] || f;
      const homeId = src.teams.home.id;
      const awayId = src.teams.away.id;
      return {
        id: src.fixture.id,
        homeCode: getCode(homeId, src.teams.home.code, src.teams.home.name),
        homeName: src.teams.home.name,
        homeScore: src.goals.home,
        awayCode: getCode(awayId, src.teams.away.code, src.teams.away.name),
        awayName: src.teams.away.name,
        awayScore: src.goals.away,
        status: mapStatus(src.fixture.status.short),
        minute: src.fixture.status.elapsed ?? null,
        round: src.league.round || "",
        date: src.fixture.date,
        venue: src.fixture.venue?.name || "",
      };
    });

    const liveMatches = liveFixtures.map((f: any) => ({
      id: f.fixture.id,
      status: f.fixture.status.short === "HT" ? "HT" : "LIVE",
      minute: f.fixture.status.elapsed ?? 0,
      hTeam: f.teams.home.name,
      hAbbr: getCode(f.teams.home.id, f.teams.home.code, f.teams.home.name),
      aTeam: f.teams.away.name,
      aAbbr: getCode(f.teams.away.id, f.teams.away.code, f.teams.away.name),
      hScore: f.goals.home ?? 0,
      aScore: f.goals.away ?? 0,
      venue: f.fixture.venue?.name || "",
      scorers: [],
    }));

    return res.status(200).json({ updatedAt: new Date().toISOString(), matches, liveMatches });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch bracket data", message: String(err) });
  }
}