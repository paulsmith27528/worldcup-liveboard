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

const PRICE_MAP: Record<string, { name: string; emoji: string; type: "sweepstake" | "dashboard" | "bundle" | "pro" | "lms" | "lms_pro" }> = {
  price_1TeMKT3g62IhPcY7PvqpncJF: { name: "World Cup Sweepstake", emoji: "&#127967;", type: "sweepstake" },
  price_1TodvS3g62IhPcY7Q9ePkimH: { name: "World Cup Sweepstake", emoji: "&#127967;", type: "sweepstake" },
  price_1TeMHw3g62IhPcY7CCZhO3T6: { name: "Live Dashboard", emoji: "&#128250;", type: "dashboard" },
  price_1Todyt3g62IhPcY7ZA9hLaEz: { name: "Live Dashboard", emoji: "&#128250;", type: "dashboard" },
  price_1TetFJ3g62IhPcY7exBoTMtq: { name: "Bundle &mdash; Dashboard + Sweepstake", emoji: "&#9889;", type: "bundle" },
  price_1Todzd3g62IhPcY7dq3Fmhcd: { name: "Bundle &mdash; Dashboard + Sweepstake", emoji: "&#9889;", type: "bundle" },
  price_1TpoVC3g62IhPcY79JRQOJV7: { name: "Pro Bracket", emoji: "&#127942;", type: "pro" },
  price_1Trj6f3g62IhPcY7V2jgis7d: { name: "Last Man Standing", emoji: "&#128128;", type: "lms" },
  price_1TtoGI3g62IhPcY7hIKrcKiX: { name: "Last Man Standing", emoji: "&#128128;", type: "lms" },
  // TODO: replace with the real Stripe price ID once created (one-time, £1) —
  // must match LMS_PRO_PRICE_ID in pages/api/lms-pro-checkout.ts exactly.
  price_REPLACE_WITH_LMS_PRO_PRICE_ID: { name: "Last Man Standing — Pro Upgrade", emoji: "&#11088;", type: "lms_pro" },
};

const LMS_TTL = 60 * 60 * 24 * 300; // 300 days — covers a full PL season

function genPoolId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function buildLmsSetupEmailHtml(setupUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid rgba(239,68,68,.3);border-radius:18px;padding:32px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:60px;margin-bottom:12px">&#128128;</div>
      <h1 style="color:#ffd54a;font-size:24px;font-weight:900;margin:0 0 6px">You're in!</h1>
      <p style="color:#475569;font-size:13px;margin:0">Last Man Standing</p>
    </div>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px">Payment received — one last step. Set your pool's name and buy-in amount, and we'll give you a link to share with everyone.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${setupUrl}" style="display:inline-block;background:#ffd54a;color:#000;font-weight:900;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;font-family:Arial,sans-serif">&#128128; Set Up Your Pool &rarr;</a>
    </div>
    <p style="color:#334155;font-size:11px;text-align:center;margin:0">Bookmark this link — it's yours until the game ends. Good luck! &#127942;</p>
  </div>
</div>
</body>
</html>`;
}

const BASE_URL = "https://www.worldcupliveboard.com";
const TTL = 60 * 60 * 24 * 30;
const PRO_TTL = 60 * 60 * 24 * 120; // 120 days — lasts the tournament

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

function buildProEmailHtml(
  participantName: string,
  teamName: string,
  teamFlag: string,
  sweepstakeName: string,
  proUrl: string
): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid rgba(255,213,74,.3);border-radius:18px;padding:32px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:72px;margin-bottom:12px">${teamFlag}</div>
      <h1 style="color:#ffd54a;font-size:26px;font-weight:900;margin:0 0 6px">Your Pro Bracket is ready! &#127942;</h1>
      <p style="color:#475569;font-size:13px;margin:0">${sweepstakeName}</p>
    </div>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 12px">Hi <strong style="color:#fff">${participantName}</strong>,</p>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">Your Pro Bracket is unlocked. You get the full live dashboard with your sweepstake built right in &mdash; <strong style="color:#ffd54a">${teamFlag} ${teamName}</strong> is highlighted throughout as you follow the tournament.</p>
    <div style="text-align:center;margin:28px 0">
      <a href="${proUrl}" style="display:inline-block;background:#ffd54a;color:#000;font-weight:900;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;font-family:Arial,sans-serif;mso-padding-alt:0">&#127942; Open My Pro Bracket &rarr;</a>
    </div>
    <div style="text-align:center;margin-bottom:16px">
      <p style="color:#475569;font-size:12px;margin:0 0 4px">Or copy this link into your browser:</p>
      <a href="${proUrl}" style="color:#ffd54a;font-size:11px;word-break:break-all;font-family:Arial,sans-serif">${proUrl}</a>
    </div>
    <div style="background:rgba(34,211,238,.06);border:1px solid rgba(34,211,238,.12);border-radius:10px;padding:14px 16px">
      <p style="color:#22d3ee;font-size:11px;font-weight:700;margin:0 0 4px;letter-spacing:1px">&#128250; WHAT YOU GET</p>
      <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.8">&#9989; Live scores and match centre<br>&#9989; Full knockout bracket with your team highlighted<br>&#9989; Group tables and tournament stats<br>&#9989; Your sweepstake draw embedded &mdash; see all participants and their teams<br>&#9989; Squad cards and stadium info</p>
    </div>
    <p style="color:#334155;font-size:11px;text-align:center;margin-top:24px">Bookmark your Pro link &mdash; it is yours for the entire tournament. Good luck! &#127942;</p>
  </div>
</div>
</body>
</html>`;
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

  // ── PRO BRACKET FLOW ─────────────────────────────────────────────────────
  if (product.type === "pro") {
    // The bid (bracket ID) is passed via Stripe metadata or custom fields
    // Log everything so we can debug
    console.log("Pro session custom_fields:", JSON.stringify(session.custom_fields));
    console.log("Pro session client_reference_id:", session.client_reference_id);
    console.log("Pro session metadata:", JSON.stringify(session.metadata));

    // Try every possible location Stripe might put the bracket ID
    const customFieldValue = session.custom_fields?.find((f: any) =>
      f.key === "bracket_id" ||
      f.key === "bracketid" ||
      f.key === "bracketID" ||
      f.key === "bracket id" ||
      f.label?.custom?.toLowerCase()?.includes("bracket")
    )?.text?.value || null;

    const bid =
      session.client_reference_id ||
      session.metadata?.bid ||
      customFieldValue ||
      null;

    console.log("Pro bid resolved to:", bid);

    if (!bid) {
      console.error("Pro payment received but no bid in session metadata:", session.id);
      // Still send a generic success email so they're not left hanging
      try {
        await sgMail.send({
          from: { name: "WC2026 Sweepstake", email: "noreply@worldcupsweepstake-liveboard.com" },
          to: email,
          subject: "Your Pro Bracket — action needed",
          html: `<p style="font-family:Arial,sans-serif;color:#fff;background:#020810;padding:32px">Hi, we received your Pro Bracket payment but couldn't find your sweepstake automatically. Please reply to this email and we'll get you set up straight away. Sorry for the inconvenience!</p>`,
          trackingSettings: { clickTracking: { enable: false, enableText: false }, openTracking: { enable: false } },
        });
      } catch (_) {}
      return res.status(200).json({ received: true });
    }

    // Look up the bracket data from Redis
    let bracketData: any = null;
    try {
      const raw = await redis.get<string>(`bracket:${bid}`);
      if (raw) bracketData = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (err) {
      console.error("Failed to fetch bracket for Pro:", err);
    }

    if (!bracketData) {
      console.error("No bracket data found for bid:", bid);
      return res.status(200).json({ received: true });
    }

    // Find this participant in the bracket entries
    const entries: any[] = bracketData.entries || [];
    console.log("Bracket entry keys:", entries.length > 0 ? Object.keys(entries[0]) : "no entries");
    console.log("Bracket entries raw:", JSON.stringify(entries));
    console.log("Looking for email:", email);
    // Try multiple possible email field names, then fall back to first entry
    const participant = entries.find((e: any) => {
      const entryEmail = (e.email || e.e_mail || e.mail || e.emailAddress || e.Email || "").toLowerCase().trim();
      return entryEmail === email.toLowerCase().trim();
    }) || (entries.length > 0 ? entries[0] : null);
    if (participant) console.log("Found participant:", participant.name, "team:", participant.teamName);

    if (!participant) {
      console.error("Participant not found in bracket for email:", email, "bid:", bid);
      // If only one entry exists, use it anyway (handles test scenarios)
      // Otherwise send a fallback email
      const fallbackEntry = entries.length === 1 ? entries[0] : null;
      if (!fallbackEntry) {
        return res.status(200).json({ received: true });
      }
      console.log("Using fallback entry:", fallbackEntry.name, fallbackEntry.email);
      // Use the fallback entry to generate the pro token
      const proToken = generateToken();
      await redis.set(`protoken:${proToken}`, JSON.stringify({
        email,
        name: fallbackEntry.name,
        teamName: fallbackEntry.teamName,
        teamFlag: fallbackEntry.teamFlag || "⚽",
        colour: fallbackEntry.colour || "#22d3ee",
        bid,
        sweepstakeName: bracketData.n || "WC2026 Sweepstake",
        createdAt: Date.now(),
      }), { ex: PRO_TTL });
      const proUrl = `${BASE_URL}/dashboard.html?pro=${proToken}`;
      await sgMail.send({
        from: { name: "WC2026 Sweepstake", email: "noreply@worldcupsweepstake-liveboard.com" },
        to: email,
        subject: `🏆 Your Pro Bracket is ready — ${fallbackEntry.teamFlag || ""} ${fallbackEntry.teamName}`,
        html: buildProEmailHtml(fallbackEntry.name, fallbackEntry.teamName, fallbackEntry.teamFlag || "⚽", bracketData.n || "WC2026 Sweepstake", proUrl),
        trackingSettings: { clickTracking: { enable: false, enableText: false }, openTracking: { enable: false } },
      });
      return res.status(200).json({ received: true });
    }

    // Generate a Pro token and store it in Redis
    const proToken = generateToken();
    await redis.set(`protoken:${proToken}`, JSON.stringify({
      email,
      name: participant.name,
      teamName: participant.teamName,
      teamFlag: participant.teamFlag || "⚽",
      colour: participant.colour || "#22d3ee",
      bid,
      sweepstakeName: bracketData.n || "WC2026 Sweepstake",
      createdAt: Date.now(),
    }), { ex: PRO_TTL });

    // Build the Pro URL — opens the full dashboard with their pro token
    const proUrl = `${BASE_URL}/dashboard.html?pro=${proToken}`;

    // Send the Pro email
    try {
      await sgMail.send({
        from: { name: "WC2026 Sweepstake", email: "noreply@worldcupsweepstake-liveboard.com" },
        to: email,
        subject: `🏆 Your Pro Bracket is ready — ${participant.teamFlag || ""} ${participant.teamName}`,
        html: buildProEmailHtml(
          participant.name,
          participant.teamName,
          participant.teamFlag || "⚽",
          bracketData.n || "WC2026 Sweepstake",
          proUrl
        ),
        trackingSettings: {
          clickTracking: { enable: false, enableText: false },
          openTracking: { enable: false },
        },
      });
      console.log("Pro email sent to:", email, "team:", participant.teamName, "bid:", bid);
    } catch (mailErr: any) {
      console.error("Pro mail error:", mailErr.message);
      return res.status(500).json({ error: "Email failed", detail: mailErr.message });
    }

    return res.status(200).json({ received: true });
  }
  // ── END PRO BRACKET FLOW ─────────────────────────────────────────────────

  // ── LAST MAN STANDING FLOW ───────────────────────────────────────────────
  if (product.type === "lms") {
    const poolId = genPoolId();
    const orgToken = generateToken();

    try {
      await redis.set(`lms:pool:${poolId}`, JSON.stringify({
        id: poolId,
        name: null,
        organiser: null,
        organiserEmail: email,
        orgToken,
        buyIn: null,
        currentGameweek: 1,
        lastGradedGw: 0,
        wipeoutRule: "rollback",
        wipeoutWeeks: [] as number[],
        createdAt: Date.now(),
        status: "pending_setup",
      }), { ex: LMS_TTL });

      await redis.set(`lms:orgtoken:${poolId}`, orgToken, { ex: LMS_TTL });
      await redis.sadd('lms:allpools', poolId);
    } catch (err) {
      console.error("Failed to create LMS pool:", err);
      return res.status(500).json({ error: "Failed to create pool" });
    }

    const setupUrl = `${BASE_URL}/lms-setup.html?pool=${poolId}&k=${orgToken}`;

    try {
      await sgMail.send({
        from: { name: "Last Man Standing", email: "noreply@worldcupsweepstake-liveboard.com" },
        to: email,
        subject: `\uD83D\uDC80 You're in — set up your Last Man Standing pool`,
        html: buildLmsSetupEmailHtml(setupUrl),
        trackingSettings: {
          clickTracking: { enable: false, enableText: false },
          openTracking: { enable: false },
        },
      });
      console.log("LMS setup email sent to:", email, "pool:", poolId);
    } catch (mailErr: any) {
      console.error("LMS mail error:", mailErr.message);
      return res.status(500).json({ error: "Email failed", detail: mailErr.message });
    }

    return res.status(200).json({ received: true });
  }
  // ── END LAST MAN STANDING FLOW ───────────────────────────────────────────

  // ── LMS PRO UPGRADE FLOW (per-player, £1) ────────────────────────────────
  if (product.type === "lms_pro") {
    const poolId = session.metadata?.pool;
    const playerToken = session.metadata?.playerToken;

    if (!poolId || !playerToken) {
      console.error("LMS Pro payment received but missing pool/playerToken in metadata:", session.id);
      return res.status(200).json({ received: true });
    }

    const playersKey = `lms:pool:${poolId}:players`;
    const playerRaw = await redis.hget<string>(playersKey, playerToken);
    if (!playerRaw) {
      console.error("LMS Pro payment received but player not found:", poolId, playerToken);
      return res.status(200).json({ received: true });
    }

    const player = typeof playerRaw === "string" ? JSON.parse(playerRaw) : playerRaw as any;
    player.proPaid = true;
    await redis.hset(playersKey, { [playerToken]: JSON.stringify(player) });

    try {
      await sgMail.send({
        from: { name: "Last Man Standing", email: "noreply@worldcupsweepstake-liveboard.com" },
        to: email,
        subject: `⭐ You're Pro — Last Man Standing`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(150deg,#051226,#020914);border:1px solid rgba(255,213,74,.3);border-radius:18px;padding:32px">
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:52px;margin-bottom:12px">&#11088;</div>
      <h1 style="color:#ffd54a;font-size:22px;font-weight:900;margin:0 0 6px">You're Pro!</h1>
      <p style="color:#475569;font-size:13px;margin:0">Last Man Standing</p>
    </div>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px">Thanks for upgrading — Pro features for this pool are unlocked on your account, starting with the Arena visual standings.</p>
    <div style="text-align:center">
      <a href="${BASE_URL}/lms-pick.html?pool=${poolId}&t=${playerToken}" style="display:inline-block;background:#ffd54a;color:#000;font-weight:900;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;font-family:Arial,sans-serif">Back to Your Pool &rarr;</a>
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
      console.error("LMS Pro mail error:", mailErr.message);
    }

    return res.status(200).json({ received: true });
  }
  // ── END LMS PRO UPGRADE FLOW ──────────────────────────────────────────────

  // Existing flow: dashboard / sweepstake / bundle
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
