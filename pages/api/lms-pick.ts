import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import sgMail from '@sendgrid/mail';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const BASE_URL = process.env.BASE_URL!;
const FROM_EMAIL = process.env.NOREPLY_EMAIL!;
const FROM_NAME = 'Last Man Standing';

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();

// Every LMS product (Premier League, Championship, Champions League, ...)
// is the same game running against a different competition — this is the
// one thing that changes per pool. Defaults to PL for pools created before
// this existed, since they were always Premier League pools.
const LEAGUE_CONFIG: Record<string, { id: number; season: number; name: string }> = {
  PL: { id: 39, season: 2026, name: 'Premier League' },
  CHAMPIONSHIP: { id: 40, season: 2026, name: 'Championship' },
  SPL: { id: 179, season: 2026, name: 'Scottish Premiership' },
  UCL: { id: 2, season: 2026, name: 'Champions League' },
};
function leagueConfigFor(league: string | null | undefined) {
  return LEAGUE_CONFIG[league || 'PL'] || LEAGUE_CONFIG.PL;
}

async function getCurrentGameweek(cfg: { id: number; season: number }) {
  const hdrs = { "x-apisports-key": API_KEY };

  const teamsRes = await fetch(`https://v3.football.api-sports.io/teams?league=${cfg.id}&season=${cfg.season}`, { headers: hdrs });
  const teamsData = await teamsRes.json();
  const teams = (teamsData.response || []).map((t: any) => ({
    id: t.team.id,
    name: t.team.name,
    code: t.team.code || t.team.name.slice(0, 3).toUpperCase(),
    logo: t.team.logo,
  }));

  // Fetch every fixture, not just not-started ones — a round's own deadline
  // (its first kickoff) still counts even once that fixture has finished and
  // dropped off an NS-only list, so filtering by status=NS here would hide
  // exactly the evidence needed to tell "hasn't started" from "in progress".
  const allRes = await fetch(`https://v3.football.api-sports.io/fixtures?league=${cfg.id}&season=${cfg.season}`, { headers: hdrs });
  const allData = await allRes.json();
  const allFixtures = (allData.response || []).sort((a: any, b: any) =>
    new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  );

  if (allFixtures.length === 0) return { gw: null, fixtures: [], teams, deadline: null };

  // A round is only genuinely "upcoming" if none of its fixtures have kicked
  // off yet — a round spread across several days with one match held back
  // (e.g. Monday Night Football) has already had its deadline (first
  // kickoff) pass even though a later fixture in it still shows NS.
  const roundOrder: string[] = [];
  const roundMinDate: Record<string, string> = {};
  const roundStarted: Record<string, boolean> = {};
  for (const f of allFixtures) {
    const r = f.league.round;
    if (!(r in roundMinDate)) {
      roundMinDate[r] = f.fixture.date;
      roundStarted[r] = false;
      roundOrder.push(r);
    }
    if (f.fixture.status.short !== 'NS') roundStarted[r] = true;
  }
  const round = roundOrder.find((r) => !roundStarted[r]);
  if (!round) return { gw: null, fixtures: [], teams, deadline: null };

  const gwMatch = round.match(/(\d+)$/);
  const gwNumber = gwMatch ? parseInt(gwMatch[1], 10) : null;

  const roundRes = await fetch(`https://v3.football.api-sports.io/fixtures?league=${cfg.id}&season=${cfg.season}&round=${encodeURIComponent(round)}`, { headers: hdrs });
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

    const gwData = await getCurrentGameweek(leagueConfigFor(poolData.league));

    return res.status(200).json({
      poolName: poolData.name,
      leagueName: leagueConfigFor(poolData.league).name,
      poolStatus: poolData.status,
      winner: poolData.winner || null,
      player: {
        name: player.name,
        alive: player.alive,
        usedTeams: player.usedTeams,
        currentPick: player.currentPick,
        currentPickGw: player.currentPickGw,
        currentPickJoker: player.currentPickJoker || false,
        eliminatedWeek: player.eliminatedWeek,
        proPaid: player.proPaid || false,
        hasJoker: player.hasJoker !== false,
        jokerUsedWeek: player.jokerUsedWeek ?? null,
      },
      gw: gwData.gw,
      fixtures: gwData.fixtures,
      teams: gwData.teams,
      deadline: gwData.deadline,
    });
  }

  if (req.method === 'POST') {
    const { pool, t, team, useJoker } = req.body;
    if (!pool || !t || !team) return res.status(400).json({ error: 'Missing pool, t, or team' });

    const playersKey = `lms:pool:${pool}:players`;
    const playerRaw = await redis.hget<string>(playersKey, t);
    if (!playerRaw) return res.status(404).json({ error: 'Player not found' });
    const player = typeof playerRaw === 'string' ? JSON.parse(playerRaw) : playerRaw as any;

    if (!player.alive) {
      return res.status(403).json({ error: 'You have already been eliminated from this pool.' });
    }

    const poolRawCheck = await redis.get<string>(`lms:pool:${pool}`);
    const poolCheck = poolRawCheck ? (typeof poolRawCheck === 'string' ? JSON.parse(poolRawCheck) : poolRawCheck as any) : null;
    if (poolCheck?.status === 'finished') {
      return res.status(403).json({ error: `This pool has already finished — ${poolCheck.winner || 'someone'} won.` });
    }

    const gwData = await getCurrentGameweek(leagueConfigFor(poolCheck?.league));
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

    // Playing the joker is a choice made alongside the pick, same as the pick
    // itself it can be changed right up until the deadline. Whatever it's set
    // to when the deadline passes is what grading acts on.
    if (useJoker && player.hasJoker === false) {
      return res.status(400).json({ error: "You've already used your joker." });
    }

    player.currentPick = team;
    player.currentPickGw = gwData.gw;
    player.currentPickJoker = !!useJoker;

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
      ${useJoker ? `<p style="color:#94a3b8;font-size:11px;margin:8px 0 0">&#128737;&#65039; Joker played on this pick</p>` : ''}
    </div>
    <p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 20px">Changed your mind${useJoker ? ' about your pick or your joker' : ''}? You can update anytime before <strong style="color:#fff">${deadlineFormatted}</strong> &mdash; after that it locks in${useJoker ? ', joker and all' : ''}.</p>
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
