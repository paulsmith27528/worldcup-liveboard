import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: "ok",
    updatedAt: new Date().toISOString(),
    matches: [
      {
        id: 1,
        status: "LIVE",
        minute: 78,
        homeTeam: "Brazil",
        awayTeam: "Argentina",
        homeScore: 2,
        awayScore: 1,
      },
      {
        id: 2,
        status: "HT",
        minute: 45,
        homeTeam: "USA",
        awayTeam: "Japan",
        homeScore: 2,
        awayScore: 2,
      },
      {
        id: 3,
        status: "TODAY",
        minute: null,
        homeTeam: "England",
        awayTeam: "France",
        homeScore: null,
        awayScore: null,
      },
    ],
  });
}
