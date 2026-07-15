import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import sgMail from '@sendgrid/mail';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const BASE_URL = 'https://www.worldcupliveboard.com';
const FROM_EMAIL = 'noreply@worldcupsweepstake-liveboard.com';
const FROM_NAME = 'Last Man Standing';

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();
const PL_LEAGUE = 39;
const PL_SEASON = 2026;

async function getCurrentGameweek() {
  const hdrs = { "x-apisports-key": API_KEY };

  const teamsRes = await fetch(`https://v3.football.api-sports.io/teams?league=${PL_LEAGUE}&season=${PL_SEASON}`, { headers: hdrs });
  const teamsData = await teamsRes.json();
  const teams = (teamsData.response || []).map((t: any) => ({
    id: t.team.id,
    name: t.team.name,
    code: t.team.code || t.team.name.slice(0, 3).toUpperCase(),
    logo: t.team.logo,
  }));

  const upcomingRes = await fetch(`https://v3.football.api-sports.io/fixtures?league=${PL_LEAGUE}&season=${PL_SEASON}&status=NS`, { headers: hdrs });
  const upcomingData = await upcomingRes.json();
  const upcoming = (upcomingData.response || []).sort((a: any, b: any) =>
    new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  );

  if (upcoming.length === 0) return { gw: null, fixtures: [], teams, deadline: null };

  const round = upcoming[0].league.round;
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

  return { gw: gwNumber, fixtures, teams, deadline };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!API_KEY) return res.status(500).json({ error: "API_FOOTBALL_KEY not configured" });

  if (req.method === 'GET') {
    const { pool, t } = req.query;
    if (!pool || typeof pool !== 'string' || !t || typeof t !== 'string') {
      return res.status(400).json({ error: 'Missing pool or t' });
    }

    const playerRaw = await redis.hget<string>(`lms:pool:${pool}:players`, t);
    if (!playerRaw) return res.status(404).json({ error: 'Player not found' });
    const player = typeof playerRaw === 'string' ? JSON.parse(playerRaw) : playerRaw as any;

    const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

    const gwData = await getCurrentGameweek();

    return res.status(200).json({
      poolName: poolData.name,
      player: {
        name: player.name,
        alive: player.alive,
        usedTeams: player.usedTeams,
        currentPick: player.currentPick,
        currentPickGw: player.currentPickGw,
        eliminatedWeek: player.eliminatedWeek,
      },
      gw: gwData.gw,
      fixtures: gwData.fixtures,
      teams: gwData.teams,
      deadline: gwData.deadline,
    });
  }

  if (req.method === 'POST') {
    const { pool, t, team } = req.body;
    if (!pool || !t || !team) return res.status(400).json({ error: 'Missing pool, t, or team' });

    const playersKey = `lms:pool:${pool}:players`;
    const playerRaw = await redis.hget<string>(playersKey, t);
    if (!playerRaw) return res.status(404).json({ error: 'Player not found' });
    const player = typeof playerRaw === 'string' ? JSON.parse(playerRaw) : playerRaw as any;

    if (!player.alive) {
      return res.status(403).json({ error: 'You have already been eliminated from this pool.' });
    }

    const gwData = await getCurrentGameweek();
    if (!gwData.gw || !gwData.deadline) {
      return res.status(400).json({ error: 'No upcoming gameweek available to pick for.' });
    }

    if (new Date() >= new Date(gwData.deadline)) {
      return res.status(403).json({ error: 'Picks have locked for this gameweek — the first match has kicked off.' });
    }

    if (player.usedTeams.includes(team)) {
      return res.status(409).json({ error: 'You have already picked this team in a previous gameweek.' });
    }

    const validTeam = gwData.teams.some((tm: any) => tm.name === team);
    if (!validTeam) {
      return res.status(400).json({ error: 'That team is not recognised.' });
    }

    player.currentPick = team;
    player.currentPickGw = gwData.gw;

    await redis.hset(playersKey, { [t]: JSON.stringify(player) });

    const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
    const poolData = poolRaw ? (typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any) : null;
    const poolName = poolData?.name || 'Last Man Standing';

    const pickUrl = `${BASE_URL}/lms-pick.html?pool=${pool}&t=${t}`;
    const deadlineFormatted = new Date(gwData.deadline).toLocaleString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    try {
      await sgMail.send({
        to: player.email,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: `\u2705 Pick confirmed — ${team} (Gameweek ${gwData.gw})`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="format-detection" content="telephone=no, address=no, email=no, date=no, url=no"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid rgba(52,211,153,.3);border-radius:18px;padding:32px">
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:52px;margin-bottom:12px">&#9989;</div>
      <h1 style="color:#34d399;font-size:22px;font-weight:900;margin:0 0 6px">Pick Confirmed</h1>
      <p style="color:#475569;font-size:13px;margin:0">${poolName} &middot; Gameweek ${gwData.gw}</p>
    </div>
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:16px;text-align:center;margin-bottom:20px">
      <p style="color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:1px;margin:0 0 6px">YOUR PICK</p>
      <p style="color:#ffd54a;font-size:20px;font-weight:900;margin:0">${team}</p>
    </div>
    <p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px">Changed your mind? You can update your pick anytime before <strong style="color:#fff">${deadlineFormatted}</strong> &mdash; after that it locks in.</p>
    <div style="text-align:center">
      <a href="${pickUrl}" style="display:inline-block;background:#ffd54a;color:#000;font-weight:900;font-size:14px;padding:13px 28px;border-radius:50px;text-decoration:none;font-family:Arial,sans-serif">Change Your Pick &rarr;</a>
    </div>
  </div>
</div>
</body>
</html>`,
        trackingSettings: {
          clickTracking: { enable: false, enableText: false },
          openTracking: { enable: false },
        },
      });
    } catch (mailErr: any) {
      console.error('Pick confirmation mail error:', mailErr.message);
      // Don't fail the pick save if the email fails — the pick is already saved
    }

    return res.status(200).json({ ok: true, pick: team, gw: gwData.gw });
  }

  return res.status(405).end();
}
