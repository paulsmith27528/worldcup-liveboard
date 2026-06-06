import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { Resend } from "resend";
import { Redis } from "@upstash/redis";
import { randomBytes } from "crypto";
import { buffer } from "micro";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });
const resend = new Resend(process.env.RESEND_API_KEY!);
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Price IDs mapped to product info
const PRICE_MAP: Record<string, { name: string; emoji: string; type: "sweepstake" | "dashboard" | "bundle" }> = {
  price_1TeMKT3g62IhPcY7PvqpncJF: { name: "World Cup Sweepstake", emoji: "🏆", type: "sweepstake" },
  price_1TeMHw3g62IhPcY7CCZhO3T6: { name: "Live Dashboard",       emoji: "📺", type: "dashboard" },
  price_1TetFJ3g62IhPcY7exBoTMtq: { name: "Bundle — Dashboard + Sweepstake", emoji: "⚡", type: "bundle" },
};

const BASE_URL = "https://worldcup-liveboard.vercel.app";

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function buildEmailHtml(product: { name: string; emoji: string; type: string }, dashUrl: string, sweepUrl: string | null): string {
  const isSweep = product.type === "sweepstake";
  const isBundle = product.type === "bundle";
  const isDash = product.type === "dashboard";

  const primaryBtn = isSweep
    ? `<a href="${sweepUrl}" style="display:block;background:#ffd54a;color:#000;text-decoration:none;text-align:center;font-weight:900;font-size:16px;padding:16px 24px;border-radius:50px;">🏆 Open Sweepstake Organiser Hub →</a>`
    : `<a href="${dashUrl}" style="display:block;background:#00e5ff;color:#000;text-decoration:none;text-align:center;font-weight:900;font-size:16px;padding:16px 24px;border-radius:50px;">📊 Open Live Dashboard →</a>`;

  const bundleExtra = isBundle ? `
    <div style="margin-top:16px;padding:16px;background:rgba(255,213,74,.08);border:1px solid rgba(255,213,74,.2);border-radius:12px;">
      <p style="color:#ffd54a;font-size:13px;font-weight:700;margin:0 0 8px;">🏆 Also included: Sweepstake Organiser Hub</p>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 12px;">Set up your group sweepstake, run the draw and send everyone their personal bracket link. Start here first — then use the Dashboard to follow the action.</p>
      <a href="${sweepUrl}" style="display:block;background:rgba(255,213,74,.15);border:1px solid rgba(255,213,74,.3);color:#ffd54a;text-decoration:none;text-align:center;font-weight:700;font-size:14px;padding:12px 24px;border-radius:50px;">🎲 Open Sweepstake Hub →</a>
    </div>` : "";

  const sweepNote = isSweep ? `
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 16px;">As the organiser, you can set up your sweepstake, invite participants, run the draw and track who is still in — all from your hub. Share your join link with your group and they will register themselves.</p>` : "";

  const dashNote = isDash ? `
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 16px;">Your personal access link is below. Bookmark it — it is yours for the entire tournament. It gives you the live bracket, all group tables, live scores and player squad cards.</p>` : "";

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#05070A;font-family:-apple-system,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <p style="color:#00e5ff;font-size:12px;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 8px;">World Cup LiveBoard 2026</p>
    <h1 style="color:#fff;font-size:28px;font-weight:900;margin:0;">You are in. ${product.emoji}</h1>
  </div>
  <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(0,229,255,0.2);border-radius:16px;padding:32px;margin-bottom:24px;">
    <p style="color:#94a3b8;font-size:14px;margin:0 0 4px;">Your product</p>
    <p style="color:#00e5ff;font-size:18px;font-weight:700;margin:0 0 20px;">${product.name}</p>
    ${sweepNote}${dashNote}
    ${primaryBtn}
    ${bundleExtra}
  </div>
  <p style="color:#475569;font-size:12px;text-align:center;margin:0;">Questions? <a href="mailto:hello@worldcupsweepstake-liveboard.com" style="color:#00e5ff;">hello@worldcupsweepstake-liveboard.com</a></p>
</div>
</body></html>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const rawBody = await buffer(req);
  const sig = req.headers["stripe-signature"]!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email;
    const priceId = session.metadata?.price_id ?? "unknown";
    const product = PRICE_MAP[priceId] ?? { name: "World Cup Access", emoji: "⚽", type: "dashboard" };

    if (!customerEmail) return res.status(400).json({ error: "No customer email" });

    const token = generateToken();
    const expiresAt = Date.now() + 90 * 24 * 60 * 60 * 1000;

    await redis.set(`token:${token}`, JSON.stringify({
      email: customerEmail,
      priceId,
      productName: product.name,
      productType: product.type,
      stripeSessionId: session.id,
      createdAt: Date.now(),
      expiresAt,
    }), { exat: Math.floor(expiresAt / 1000) });

    // Build the correct access URLs based on what they bought
    const dashUrl = `${BASE_URL}/dashboard.html?token=${token}`;
    const sweepUrl = `${BASE_URL}/sweepstake.html?token=${token}`;

    await resend.emails.send({
      from: "World Cup LiveBoard <onboarding@resend.dev>",
      to: customerEmail,
      subject: `${product.emoji} Your World Cup access is ready`,
      html: buildEmailHtml(product, dashUrl, sweepUrl),
    });
  }

  res.status(200).json({ received: true });
}
