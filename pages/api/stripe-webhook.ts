import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { Resend } from "resend";
import { Redis } from "@upstash/redis";
import { randomBytes } from "crypto";
import { buffer } from "micro";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const resend = new Resend(process.env.RESEND_API_KEY!);
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const PRICE_MAP: Record<string, { name: string; emoji: string }> = {
  price_1TeMKT3g62IhPcY7PvqpncJF: { name: "World Cup Sweepstake", emoji: "🏆" },
  price_1TeMHw3g62IhPcY7CCZhO3T6: { name: "Live Dashboard",        emoji: "📺" },
  price_1TetFJ3g62IhPcY7exBoTMtq: { name: "Bundle — Dashboard + Sweepstake", emoji: "⚡" },
};

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await buffer(req);
  const sig = req.headers["stripe-signature"]!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email;
    const priceId = session.metadata?.price_id ?? "unknown";
    const product = PRICE_MAP[priceId] ?? { name: "World Cup Access", emoji: "⚽" };

    if (!customerEmail) {
      return res.status(400).json({ error: "No customer email" });
    }

    const token = generateToken();
    const expiresAt = Date.now() + 90 * 24 * 60 * 60 * 1000;

    await redis.set(`token:${token}`, JSON.stringify({
      email: customerEmail,
      priceId,
      productName: product.name,
      stripeSessionId: session.id,
      createdAt: Date.now(),
      expiresAt,
    }), { exat: Math.floor(expiresAt / 1000) });

    const accessUrl = `https://worldcupsweepstake-liveboard.com/dashboard.html?token=${token}`;

    await resend.emails.send({
      from: "World Cup LiveBoard <onboarding@resend.dev>",
      to: customerEmail,
      subject: `${product.emoji} Your World Cup access is ready`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#05070A;font-family:-apple-system,sans-serif;"><div style="max-width:560px;margin:0 auto;padding:40px 24px;"><div style="text-align:center;margin-bottom:32px;"><p style="color:#00e5ff;font-size:12px;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 8px;">World Cup LiveBoard 2026</p><h1 style="color:#fff;font-size:28px;font-weight:900;margin:0;">You're in. ${product.emoji}</h1></div><div style="background:rgba(255,255,255,0.05);border:1px solid rgba(0,229,255,0.2);border-radius:16px;padding:32px;margin-bottom:24px;"><p style="color:#94a3b8;font-size:14px;margin:0 0 4px;">Your product</p><p style="color:#00e5ff;font-size:18px;font-weight:700;margin:0 0 24px;">${product.name}</p><p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 28px;">Your personal access link is below. Bookmark it — it's yours for the entire tournament.</p><a href="${accessUrl}" style="display:block;background:#00e5ff;color:#000;text-decoration:none;text-align:center;font-weight:900;font-size:16px;padding:16px 24px;border-radius:50px;">Open World Cup LiveBoard →</a></div><p style="color:#475569;font-size:12px;text-align:center;">worldcupsweepstake-liveboard.com</p></div></body></html>`,
    });
  }

  res.status(200).json({ received: true });
}
