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
    const raw = await redis.get(`token:${token}`);
    const data = typeof raw === "string" ? JSON.parse(raw) : raw as any;

    if (!data) return res.status(200).json({ valid: false });
    if (Date.now() > data.expiresAt) return res.status(200).json({ valid: false, reason: "expired" });

    return res.status(200).json({
      valid: true,
      productName: data.productName,
      priceId: data.priceId,
      email: data.email,
    });
  } catch (err) {
    return res.status(200).json({ valid: true, productName: "World Cup Access" });
  }
}
