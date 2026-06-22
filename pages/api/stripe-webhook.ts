import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import sgMail from "@sendgrid/mail";
import { Redis } from "@upstash/redis";
import { randomBytes } from "crypto";
import { buffer } from "micro";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const PRICE_MAP: Record<string, { name: string; emoji: string; type: "sweepstake" | "dashboard" | "bundle" }> = {
  price_1TeMKT3g62IhPcY7PvqpncJF: { name: "World Cup Sweepstake", emoji: "&#127967;", type: "sweepstake" },
  price_1TeMHw3g62IhPcY7CCZhO3T6: { name: "Live Dashboard", emoji: "&#128250;", type: "dashboard" },
  price_1TetFJ3g62IhPcY7exBoTMtq: { name: "Bundle &mdash; Dashboard + Sweepstake", emoji: "&#9889;", type: "bundle" },
};

const BASE_URL = "https://www.worldcupliveboard.com";
const TTL = 60 * 60 * 24 * 30;

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

async function storeToken(token: string, email: string, productName: string, priceId: string) {
  await redis.set(`token:${token}`, JSON.stringify({
    email,
    productName,
    priceId,
    expiresAt: Date.now() + TTL * 1000,
  }), { ex: TTL });
}

function buildEmailHtml(
  product: { name: string; emoji: string; type: string },
  dashUrl: string | null,
  sweepUrl: string | null
): string {
  const isSweep = product.type === "sweepstake";
  const isBundle = product.type === "bundle";
  const isDash = product.type === "dashboard";

  const primaryBtn = (isSweep || isBundle)
    ? `<a href="${sweepUrl}" style="display:block;background:#ffd54a;color:#000;text-decoration:none;text-align:center;font-weight:900;font-size:16px;padding:16px 24px;border-radius:50px;">&#127967; Open Sweepstake Organiser Hub &rarr;</a>`
    : `<a href="${dashUrl}" style="display:block;background:#00e5ff;color:#000;text-decoration:none;text-align:center;font-weight:900;font-size:16px;padding:16px 24px;border-radius:50px;">&#128250; Open Live Dashboard &rarr;</a>`;

  const bundleExtra = isBundle ? `
<div style="margin-top:16px;padding:16px;background:rgba(255,213,74,.08);border:1px solid rgba(255,213,74,.2);border-radius:12px;">
<p style="color:#00e5ff;font-size:13px;font-weight:700;margin:0 0 8px;">&#128250; Also included: Live Dashboard</p>
<p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 12px;">Follow every match live &mdash; scores, bracket, group tables and squad cards.</p>
<a href="${dashUrl}" style="display:block;background:rgba(0,229,255,.12);border:1px solid rgba(0,229,255,.25);color:#ffd54a;text-decoration:none;text-align:center;font-weight:700;font-size:14px;padding:12px 24px;border-radius:50px;">&#128250; Open Live Dashboard &rarr;</a>
</div>` : "";

  const bodyNote = isSweep
    ? `<p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 16px;">Set up your sweepstake, invite participants, run the draw and track who is still in &mdash; all from your organiser hub.</p>`
    : isDash
    ? `<p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 16px;">Your personal access link is below. Bookmark it &mdash; it is yours for the entire tournament.</p>`
    : `<p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 16px;">You have got everything. Run your sweepstake from the organiser hub, and follow the action on the live dashboard.</p>`;

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#05070A;font-family:-apple-system,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
<div style="text-align:center;margin-bottom:32px;">
<p style="color:#00e5ff;font-size:12px;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 8px;">World Cup LiveBoard 2026</p>
<h1 style="color:#fff;font-size:28px;font-weight:900;margin:0;">You are in! ${product.emoji}</h1>
</div>
<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(0,229,255,0.2);border-radius:16px;padding:32px;margin-bottom:24px;">
<p style="color:#94a3b8;font-size:14px;margin:0 0 4px;">Your product</p>
<p style="color:#00e5ff;font-size:18px;font-weight:700;margin:0 0 20px;">${product.name}</p>
${bodyNote}
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

  if (event.type !== "checkout.session.completed") return res.status(200).json({ received: true });

  const session = event.data.object as Stripe.Checkout.Session;
  const email = session.customer_details?.email;
  console.log("Webhook session:", session.id, "email:", email);
  if (!email) {
    console.error("No email in session:", session.id);
    return res.status(200).json({ received: true });
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
  const priceId = lineItems.data[0]?.price?.id ?? session.metadata?.price_id ?? "unknown";
  const product = PRICE_MAP[priceId] ?? { name: "World Cup Access", emoji: "&#9917;", type: "dashboard" };

  const dashToken = (product.type === "dashboard" || product.type === "bundle") ? generateToken() : null;
  const sweepToken = (product.type === "sweepstake" || product.type === "bundle") ? generateToken() : null;

  if (dashToken) await storeToken(dashToken, email, product.name, priceId);
  if (sweepToken) await storeToken(sweepToken, email, product.name, priceId);

  const dashUrl = dashToken ? `${BASE_URL}/dashboard.html?token=${dashToken}` : null;
  const sweepUrl = sweepToken ? `${BASE_URL}/sweepstake.html?token=${sweepToken}` : null;

  const html = buildEmailHtml(product, dashUrl, sweepUrl);

  try {
    await sgMail.send({
      from: { name: "World Cup LiveBoard", email: "noreply@worldcupsweepstake-liveboard.com" },
      to: email,
      subject: `Your ${product.name} is ready`,
      html,
      trackingSettings: {
        clickTracking: { enable: false, enableText: false },
        openTracking: { enable: false },
      },
    });
    console.log("Email sent to:", email, "product:", product.type);
  } catch (mailErr: any) {
    console.error("Mail error:", mailErr.message);
    return res.status(500).json({ error: "Email failed", detail: mailErr.message });
  }
  return res.status(200).json({ received: true });
}
