import type { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from '@upstash/redis';
import { leagueConfigFor, upcomingRoundInfo } from '../../lib/lms-rounds';
import { poolPlayerLimit } from '../../lib/lms-limits';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const API_KEY = (process.env.API_FOOTBALL_KEY || "").trim();

// Same definition the grading cron uses for "this round is done, ready to
// grade" — kept identical so "current gameweek" here can never disagree
// with when the cron considers a round finished.


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST' && req.body?.action === 'setWhatsAppGroup') {
    const { pool, k } = req.body;
    const raw = typeof req.body.whatsappGroupUrl === 'string' ? req.body.whatsappGroupUrl.trim() : '';
    if (!pool || !k) return res.status(400).json({ error: 'Missing pool or k' });
    // Only real WhatsApp group invite links, so this can never be used to put
    // some other link in front of every player. Newer WhatsApp versions add
    // things like "?mode=ac_t" when copying, so only the invite code is kept.
    // Empty clears it.
    const match = raw.match(/^(?:https?:\/\/)?chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9]+)\/?(?:\?.*)?$/);
    if (raw && !match) {
      return res.status(400).json({ error: "That doesn't look like a WhatsApp group invite link. It should start with https://chat.whatsapp.com/" });
    }
    const url = match ? `https://chat.whatsapp.com/${match[1]}` : '';

    const storedToken = await redis.get<string>(`lms:orgtoken:${pool}`);
    if (!storedToken || storedToken !== k) {
      return res.status(401).json({ error: 'Invalid organiser link' });
    }
    const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;
    poolData.whatsappGroupUrl = url || null;
    // keepTtl so saving this never changes when the pool expires.
    await redis.set(`lms:pool:${pool}`, JSON.stringify(poolData), { keepTtl: true });
    return res.status(200).json({ ok: true, whatsappGroupUrl: poolData.whatsappGroupUrl });
  }

  if (req.method === 'POST') {
    const { pool, k, playerToken, paid } = req.body;
    if (!pool || !k || !playerToken || typeof paid !== 'boolean') {
      return res.status(400).json({ error: 'Missing pool, k, playerToken, or paid' });
    }

    const storedToken = await redis.get<string>(`lms:orgtoken:${pool}`);
    if (!storedToken || storedToken !== k) {
      return res.status(401).json({ error: 'Invalid organiser link' });
    }

    const playersKey = `lms:pool:${pool}:players`;
    const playerRaw = await redis.hget<string>(playersKey, playerToken);
    if (!playerRaw) return res.status(404).json({ error: 'Player not found' });
    const player = typeof playerRaw === 'string' ? JSON.parse(playerRaw) : playerRaw as any;

    player.paid = paid;
    await redis.hset(playersKey, { [playerToken]: JSON.stringify(player) });

    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'GET') return res.status(405).end();

  const { pool, k } = req.query;
  if (!pool || typeof pool !== 'string' || !k || typeof k !== 'string') {
    return res.status(400).json({ error: 'Missing pool or k' });
  }

  try {
    const storedToken = await redis.get<string>(`lms:orgtoken:${pool}`);
    if (!storedToken || storedToken !== k) {
      return res.status(401).json({ error: 'Invalid organiser link' });
    }

    const poolRaw = await redis.get<string>(`lms:pool:${pool}`);
    if (!poolRaw) return res.status(404).json({ error: 'Pool not found' });
    const poolData = typeof poolRaw === 'string' ? JSON.parse(poolRaw) : poolRaw as any;

    const playersRaw = await redis.hgetall<Record<string, string>>(`lms:pool:${pool}:players`);
    const rawPlayers = playersRaw ? Object.values(playersRaw).map((raw: any) => typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
    // Redis hash field order isn't guaranteed stable — sort by join order so
    // the player list doesn't shuffle position on the organiser between loads.
    rawPlayers.sort((a: any, b: any) => (a.id || 0) - (b.id || 0));

    // Picks for the round still in progress must stay hidden here too, same as
    // everywhere else — an organiser link is not a way to see picks early.
    const upcoming = poolData.status === 'active' ? await upcomingRoundInfo(redis, leagueConfigFor(poolData.league, poolData.season)) : { gw: null, deadline: null, locked: true };
    // If we can't tell (fixtures unavailable), keep this week's picks hidden.
    const deadlinePassed = upcoming.locked === true;
    const players = rawPlayers.map((p: any) => {
      if (!deadlinePassed && p.currentPickGw === upcoming.gw) {
        // The joker flag gives the pick away just as much, so it goes too.
        const { currentPick, currentPickGw, currentPickJoker, ...rest } = p;
        return rest;
      }
      return p;
    });

    // Organiser identity and player identity are separate tokens with no link
    // between them — but if the organiser also joined their own pool (common),
    // their player record almost always shares the same email they set the
    // pool up with. Matching on that lets pages like the Arena link work for
    // them without asking them to dig out their personal pick link.
    const organiserEmail = (poolData.organiserEmail || '').toLowerCase();
    const ownPlayer = organiserEmail
      ? rawPlayers.find((p: any) => (p.email || '').toLowerCase() === organiserEmail)
      : null;

    return res.status(200).json({
      pool: {
        id: poolData.id,
        name: poolData.name,
        leagueName: leagueConfigFor(poolData.league, poolData.season).name,
        organiser: poolData.organiser,
        buyIn: poolData.buyIn,
        currentGameweek: poolData.currentGameweek,
        lastGradedGw: poolData.lastGradedGw || 0,
        whatsappGroupUrl: poolData.whatsappGroupUrl || null,
        status: poolData.status,
        createdAt: poolData.createdAt,
        organiserFeeNotified: poolData.organiserFeeNotified || false,
        organiserFeePaid: poolData.organiserFeePaid || false,
        organiserBigFeeNotified: poolData.organiserBigFeeNotified || false,
        playerLimit: Number.isFinite(poolPlayerLimit(poolData)) ? poolPlayerLimit(poolData) : null,
        yourPlayerToken: ownPlayer ? ownPlayer.token : null,
      },
      players,
    });
  } catch (err) {
    console.error('lms-organiser GET error:', err);
    return res.status(500).json({ error: 'Failed to load pool data' });
  }
}
