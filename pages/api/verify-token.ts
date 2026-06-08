import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ valid: false, error: "No token provided" });
  }

  try {
    // 1. Check current key format: token:{token} → JSON object
    const raw = await redis.get(`token:${token}`);
    if (raw) {
      const data = typeof raw === "string" ? JSON.parse(raw) : raw as any;
      if (Date.now() > data.expiresAt) return res.status(200).json({ valid: false, reason: "expired" });
      return res.status(200).json({
        valid: true,
        productName: data.productName,
        priceId: data.priceId,
        email: data.email,
      });
    }

    // 2. Backward compat: sweep:{token} → email string (old sweepstake/bundle purchases)
    const sweepRaw = await redis.get(`sweep:${token}`);
    if (sweepRaw) {
      return res.status(200).json({
        valid: true,
        productName: "World Cup Sweepstake",
        email: sweepRaw,
      });
    }

    // 3. Backward compat: dash:{token} → email string (old dashboard purchases)
    const dashRaw = await redis.get(`dash:${token}`);
    if (dashRaw) {
      return res.status(200).json({
        valid: true,
        productName: "Live Dashboard",
        email: dashRaw,
      });
    }

    return res.status(200).json({ valid: false });

  } catch (err) {
    console.error("verify-token Redis error:", err);
    // Fail open so valid users aren't locked out on Redis blip
    return res.status(200).json({ valid: true, productName: "World Cup Access" });
  }
}
