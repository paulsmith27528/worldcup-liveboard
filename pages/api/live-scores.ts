import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: "ok",
    updatedAt: new Date().toISOString(),
    matches: [
      {
        id: 1,
        status: "TODAY",
        minute: null,
        homeTeam: "Mexico",
        homeFlag: "🇲🇽",
        awayTeam: "Ecuador",
        awayFlag: "🇪🇨",
        homeScore: null,
        awayScore: null,
        venue: "AT&T Stadium, Dallas",
        group: "A",
      },
      {
        id: 2,
        status: "TODAY",
        minute: null,
        homeTeam: "USA",
        homeFlag: "🇺🇸",
        awayTeam: "Canada",
        awayFlag: "🇨🇦",
        homeScore: null,
        awayScore: null,
        venue: "MetLife Stadium, New Jersey",
        group: "D",
      },
      {
        id: 3,
        status: "TODAY",
        minute: null,
        homeTeam: "Brazil",
        homeFlag: "🇧🇷",
        awayTeam: "Morocco",
        awayFlag: "🇲🇦",
        homeScore: null,
        awayScore: null,
        venue: "SoFi Stadium, Los Angeles",
        group: "C",
      },
    ],
  });
}
