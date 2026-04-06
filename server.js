import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync } from "fs";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import cron from "node-cron";
import { v4 as uuidv4 } from "uuid";
import Stripe from "stripe";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env"), override: true });

import db, {
  getUser,
  getUserByEmail,
  createUser,
  updateAssessment,
  updateLastEmailSent,
  getUsersForDailyEmail,
  getUsersForTrialEmails,
  saveConversationSummary,
  getConversationSummaries,
  saveOneSentence,
  getAnniversarySentence,
  resetUserAssessment,
  createShareToken,
  getShareToken,
  revokeShareToken,
  getUserActiveShares,
  updateUserState,
  updateStripeCustomer,
  hasTrialEmailBeenSent,
  recordTrialEmailSent,
} from "./db.js";

import { upsertSubscriber } from "./mailerlite.js";
import { sendEmail } from "./mailersend.js";

const app = express();
const PORT = process.env.PORT || 3001;

// SIMON: Set INVITE_TOKEN in Railway environment variables before sharing the beta link.
// Default is BETA2026 — change it to something less guessable.
const INVITE_TOKEN = process.env.INVITE_TOKEN || "BETA2026";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const TRIAL_DAYS = 14;
const TRIAL_MS   = TRIAL_DAYS * 24 * 60 * 60 * 1000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// ─── Maintenance mode ────────────────────────────────────────────────────────
// Set MAINTENANCE_MODE=true in Railway environment variables to close the site.
// Remove or set to false to reopen. Takes effect on next request (no redeploy needed
// if Railway supports dynamic env — otherwise a redeploy will pick it up).
const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hue — Coming Soon</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@900&family=Plus+Jakarta+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Plus Jakarta Sans',sans-serif;background:#FDFAF5;color:#1A1410;
         display:flex;align-items:center;justify-content:center;min-height:100vh;padding:32px;text-align:center}
    .logo{font-family:'Fraunces',serif;font-size:40px;font-weight:900;letter-spacing:-0.03em;margin-bottom:32px}
    .logo .u{color:#D92010}
    h1{font-family:'Fraunces',serif;font-size:clamp(28px,5vw,40px);font-weight:900;
       letter-spacing:-0.02em;line-height:1.1;margin-bottom:16px}
    p{font-size:16px;line-height:1.7;color:#6B6357;max-width:400px;margin:0 auto}
  </style>
</head>
<body>
  <div>
    <div class="logo">h<span class="u">u</span>e</div>
    <h1>Something new<br>is taking shape.</h1>
    <p>We're putting the finishing touches on Hue. Check back very soon.</p>
  </div>
</body>
</html>`;

app.use((req, res, next) => {
  if (process.env.MAINTENANCE_MODE !== "true") return next();
  // Always let the Stripe webhook through so subscriptions still process
  if (req.path === "/api/stripe-webhook") return next();
  if (req.path.startsWith("/api/")) {
    return res.status(503).json({ error: "maintenance" });
  }
  res.set("Cache-Control", "no-store");
  return res.send(MAINTENANCE_HTML);
});

app.use(express.static(join(__dirname, "public")));

// Serve hue.html with no-cache headers so browsers always fetch the latest
function sendApp(req, res) {
  // no-store: browser never caches. Cloudflare respects this and won't cache either.
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Surrogate-Control", "no-store");
  res.sendFile(join(__dirname, "public", "hue.html"));
}
app.get("/", sendApp);
app.get("/register", sendApp);
app.get("/shared/:token", sendApp);

// ─── Session helper ────────────────────────────────────────────────────────

function getUserFromCookie(req) {
  const userId = req.cookies?.hue_user;
  if (!userId) return null;
  return getUser(userId);
}

function setUserCookie(res, userId) {
  res.cookie("hue_user", userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
  });
}

function resolveUserState(user) {
  // Beta users (no user_state set) keep full access during the beta period
  if (!user.user_state) return "beta";
  // If trial active, check whether it has expired
  if (user.user_state === "individual-trial-active") {
    const started = user.trial_started_at || user.registered_at;
    if (Date.now() > started + TRIAL_MS) return "individual-trial-expired";
  }
  return user.user_state;
}

function formatUserResponse(user) {
  const userState = resolveUserState(user);
  const started   = user.trial_started_at || user.registered_at;
  const trialEndsAt = (userState === "individual-trial-active")
    ? started + TRIAL_MS
    : null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    betaAccess: true,
    userState,
    trialEndsAt,
    assessmentCompleted: !!user.assessment_completed_at,
    dominantEnergy: user.dominant_energy || null,
    scores: user.energy_scores ? JSON.parse(user.energy_scores) : null,
    labels: user.reach_labels  ? JSON.parse(user.reach_labels)  : null,
  };
}

// ─── Routes ────────────────────────────────────────────────────────────────

// GET /api/me — returns current user if session cookie exists
app.get("/api/me", (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.json({ user: null });
  return res.json({ user: formatUserResponse(user) });
});

// POST /api/register — create new user account
// Invite token is optional: if REQUIRE_INVITE=true env var is set, it is enforced.
app.post("/api/register", async (req, res) => {
  const { name, email, inviteToken } = req.body;

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: "Please enter your name and email." });
  }

  if (process.env.REQUIRE_INVITE === "true" && inviteToken !== INVITE_TOKEN) {
    return res.status(403).json({ error: "This invite link isn't valid." });
  }

  const normalised = email.toLowerCase().trim();
  const existing = getUserByEmail(normalised);

  if (existing) {
    // Already registered — refresh their cookie and return
    setUserCookie(res, existing.id);
    return res.json({ user: formatUserResponse(existing), alreadyRegistered: true });
  }

  const id  = uuidv4();
  const now = Date.now();
  try {
    createUser({ id, name: name.trim(), email: normalised, registered_at: now,
                 trial_started_at: now, user_state: "individual-trial-active" });
  } catch (err) {
    console.error("DB error on register:", err);
    return res.status(500).json({ error: "Could not create your account. Please try again." });
  }

  // Add to MailerLite (non-blocking)
  upsertSubscriber({ name: name.trim(), email: normalised, userState: "individual-trial-active" }).catch(console.error);

  // Send day 1 welcome email immediately (non-blocking)
  const day1 = buildTrialEmail(1, { name: name.trim(), dominant_energy: null, assessment_completed_at: null });
  if (day1) {
    const firstName = name.trim().split(" ")[0];
    sendEmail({ to: normalised, toName: firstName, subject: day1.subject, html: day1.html.replace("{{EMAIL}}", normalised) })
      .then(sent => { if (sent) recordTrialEmailSent(id, 1); })
      .catch(() => {});
  }

  setUserCookie(res, id);
  const newUser = getUser(id);
  return res.json({ user: formatUserResponse(newUser) });
});

// POST /api/login — sign in existing user by email (sets session cookie)
app.post("/api/login", (req, res) => {
  const { email } = req.body;
  if (!email?.trim()) return res.status(400).json({ error: "Please enter your email." });
  const user = getUserByEmail(email.toLowerCase().trim());
  if (!user) return res.status(404).json({ error: "No account found with that email." });
  setUserCookie(res, user.id);
  return res.json({ user: formatUserResponse(user) });
});

// ─── Stripe routes ──────────────────────────────────────────────────────────

// POST /api/create-checkout — creates a Stripe Checkout session (14-day trial, card required)
app.post("/api/create-checkout", async (req, res) => {
  if (!stripe) return res.status(503).json({ error: "Payment not configured." });
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not signed in." });
  const { plan, priceId: explicitPriceId } = req.body;
  const priceId = explicitPriceId
    || (plan === "annual"  ? process.env.STRIPE_PRICE_ANNUAL  : null)
    || (plan === "monthly" ? process.env.STRIPE_PRICE_MONTHLY : null)
    || process.env.STRIPE_PRICE_MONTHLY;
  if (!priceId) return res.status(400).json({ error: "No Stripe price configured." });
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: TRIAL_DAYS },
      success_url: `${process.env.APP_URL || "https://myhue.co"}/?checkout=success`,
      cancel_url:  `${process.env.APP_URL || "https://myhue.co"}/?checkout=cancelled`,
      metadata: { hue_user_id: user.id },
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ error: "Could not create checkout session." });
  }
});

// POST /api/billing-portal — opens Stripe customer portal for subscription management
app.post("/api/billing-portal", async (req, res) => {
  if (!stripe) return res.status(503).json({ error: "Payment not configured." });
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not signed in." });
  if (!user.stripe_customer_id) return res.status(400).json({ error: "No billing account found." });
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: process.env.APP_URL || "https://myhue.co",
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    res.status(500).json({ error: "Could not open billing portal." });
  }
});

// POST /api/stripe-webhook — handles Stripe subscription lifecycle events
app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) return res.status(503).send("Payment not configured.");
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature error:", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  const getUserByStripeCustomer = (customerId) =>
    db.prepare("SELECT * FROM users WHERE stripe_customer_id = ?").get(customerId) || null;

  switch (event.type) {
    case "checkout.session.completed": {
      // Card captured — store customer ID. User stays individual-trial-active.
      const session  = event.data.object;
      const userId   = session.metadata?.hue_user_id;
      const customer = session.customer;
      if (userId) {
        updateStripeCustomer(userId, customer);
        // State stays individual-trial-active — subscriber conversion happens on invoice.paid
      }
      break;
    }
    case "invoice.paid": {
      // First real charge after trial — user becomes a subscriber
      const inv      = event.data.object;
      const customer = inv.customer;
      if (inv.billing_reason === "subscription_cycle" || inv.billing_reason === "subscription_update") {
        const user = await getUserByStripeCustomer(customer);
        if (user) {
          updateUserState(user.id, "individual-subscriber");
          upsertSubscriber({ name: user.name, email: user.email, userState: "individual-subscriber" }).catch(() => {});
        }
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub      = event.data.object;
      const customer = sub.customer;
      const user     = await getUserByStripeCustomer(customer);
      if (user) {
        updateUserState(user.id, "individual-trial-expired");
        upsertSubscriber({ name: user.name, email: user.email, userState: "individual-trial-expired" }).catch(() => {});
      }
      break;
    }
    case "invoice.payment_failed": {
      const inv      = event.data.object;
      const customer = inv.customer;
      const user     = await getUserByStripeCustomer(customer);
      if (user) {
        updateUserState(user.id, "individual-trial-expired");
        upsertSubscriber({ name: user.name, email: user.email, userState: "individual-trial-expired" }).catch(() => {});
      }
      break;
    }
  }
  res.json({ received: true });
});

// POST /api/complete — save completed assessment results
app.post("/api/complete", async (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not registered." });

  const { scores, labels, dominantEnergy } = req.body;
  if (!scores || !dominantEnergy) {
    return res.status(400).json({ error: "Missing scores or dominantEnergy." });
  }

  try {
    updateAssessment(user.id, {
      completed_at:   Date.now(),
      energy_scores:  JSON.stringify(scores),
      reach_labels:   JSON.stringify(labels || {}),
      dominant_energy: dominantEnergy,
    });
  } catch (err) {
    console.error("DB error on complete:", err);
    return res.status(500).json({ error: "Could not save your results." });
  }

  // Update MailerLite with scores (non-blocking)
  upsertSubscriber({
    name: user.name,
    email: user.email,
    dominantEnergy,
    scores,
    labels,
    userState: user.user_state || "",
  }).catch(console.error);

  return res.json({ ok: true });
});

// POST /api/reset-assessment — clears assessment data for current user (keeps account)
app.post("/api/reset-assessment", (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not registered." });
  resetUserAssessment(user.id);
  return res.json({ ok: true });
});

// ─── Conversation memory ────────────────────────────────────────────────────

// GET /api/summaries — returns recent conversation summaries + anniversary sentence for current user
app.get("/api/summaries", (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.json({ summaries: [], anniversary: null });
  const summaries = getConversationSummaries(user.id, 5);
  const anniversary = getAnniversarySentence(user.id);
  return res.json({ summaries, anniversary });
});

// POST /api/summarise — generates and saves a summary of a companion conversation
app.post("/api/summarise", async (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not registered." });

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length < 2) {
    return res.json({ ok: true }); // Nothing worth summarising
  }

  const transcript = messages
    .map(m => `${m.role === "user" ? "Person" : "Hue"}: ${m.content}`)
    .join("\n\n");

  const system = `You are Hue. Summarise the key themes, questions, tensions, or shifts in thinking from this companion conversation in 2–3 sentences. Focus on what would be worth reflecting back in a future session — recurring concerns, things this person is actively working through, any realisations or resistance that surfaced. Write in third person. Be specific, not generic. Plain prose only.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 200,
        system,
        messages: [{ role: "user", content: `Summarise this conversation:\n\n${transcript}` }],
      }),
    });

    if (!response.ok) return res.json({ ok: false });
    const data = await response.json();
    const summary = data.content?.find(b => b.type === "text")?.text?.trim();
    if (summary) saveConversationSummary(user.id, summary);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Summarise error:", err);
    return res.json({ ok: false });
  }
});

// ─── One sentence ────────────────────────────────────────────────────────────

// POST /api/one-sentence — generates one identity-distillation sentence from assessment conversation
app.post("/api/one-sentence", async (req, res) => {
  const { messages, scores } = req.body;
  if (!Array.isArray(messages) || messages.length < 4 || !scores) {
    return res.json({ sentence: null });
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const ranked = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([id, score]) => ({
      name: id.charAt(0).toUpperCase() + id.slice(1),
      pct: Math.round((score / total) * 100),
    }));
  const dominantEnergy = ranked[0].name.toLowerCase();

  // Use only the user's own words — more specific, more personal
  const userWords = messages
    .filter(m => m.role === "user")
    .map(m => m.content)
    .join("\n");

  const system = `You are Hue. Based on this assessment conversation, write one sentence — one only — that distils who this person is at their energetic core.

This is the sentence they will screenshot and share. It must be:
- One sentence. Not two. Not a sentence with a semicolon or em dash hiding a second thought.
- Poetic but grounded in something they actually said — a specific situation, phrase, or pattern from their words, not a generic description of their energy
- Second person (you, your)
- Something that would feel uncanny to read back — specific enough that they think "how did it know that?"
- Designed to be read aloud and felt, not just understood

This is not a summary. Not a profile description. A recognition of something true about this specific person.

Do not include quotation marks. Do not explain. Return only the sentence.`;

  const prompt = `Their colour energy profile (ranked):\n${ranked.map((e, i) => `${i + 1}. ${e.name}: ${e.pct}%`).join("\n")}\n\nWhat they said (their words only):\n${userWords}\n\nWrite the one sentence.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 100,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) return res.json({ sentence: null });
    const data = await response.json();
    const sentence = data.content?.find(b => b.type === "text")?.text?.trim();
    if (!sentence) return res.json({ sentence: null });

    // Save to DB if user is logged in — non-blocking
    const user = getUserFromCookie(req);
    if (user) {
      try { saveOneSentence(user.id, sentence, dominantEnergy); } catch (e) { /* ignore */ }
    }

    return res.json({ sentence });
  } catch (err) {
    console.error("One sentence error:", err);
    return res.json({ sentence: null });
  }
});

// ─── Bespoke observation ─────────────────────────────────────────────────────

// POST /api/bespoke-observation — generates one unrepeatable observation from the assessment conversation
app.post("/api/bespoke-observation", async (req, res) => {
  const { messages, scores } = req.body;
  if (!Array.isArray(messages) || messages.length < 4 || !scores) {
    return res.json({ observation: null });
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const ranked = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([id, score]) => ({
      name: id.charAt(0).toUpperCase() + id.slice(1),
      pct: Math.round((score / total) * 100),
    }));

  const transcript = messages
    .map(m => `${m.role === "user" ? "Person" : "Hue"}: ${m.content}`)
    .join("\n\n");

  const system = `You are Hue. Based on this assessment conversation and colour energy scores, write one observation about this specific person that could only be written about them — drawn from something concrete in what they said: a specific moment, situation, phrase, or pattern that emerged in the conversation.

This is the "only you" moment in their profile. It should feel weirdly specific — not a description of their energy in general, but something that references what they actually said.

Rules:
- 2–3 sentences only
- Second person (you, your)
- Warm and precise — not clinical
- Do not name an energy directly
- Do not use "This isn't X, it's Y" or "That's not X, it's Y"
- Draw from a specific detail in the conversation — not a generic observation that could apply to anyone with this profile
- Plain prose only`;

  const prompt = `Their colour energy profile (ranked):\n${ranked.map((e, i) => `${i + 1}. ${e.name}: ${e.pct}%`).join("\n")}\n\nThe assessment conversation:\n${transcript}\n\nWrite the observation.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 200,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) return res.json({ observation: null });
    const data = await response.json();
    const observation = data.content?.find(b => b.type === "text")?.text?.trim();
    return res.json({ observation: observation || null });
  } catch (err) {
    console.error("Bespoke observation error:", err);
    return res.json({ observation: null });
  }
});

// ─── Colleague sharing ──────────────────────────────────────────────────────

// POST /api/share — create a share token for the current user
app.post("/api/share", (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not registered." });

  const { mode } = req.body;
  if (mode !== "link" && mode !== "session") {
    return res.status(400).json({ error: "mode must be 'link' or 'session'" });
  }

  const durationMs = mode === "link"
    ? 30 * 24 * 60 * 60 * 1000   // 30 days
    : 8  * 60 * 60 * 1000;        // 8 hours

  const expiresAt = Date.now() + durationMs;

  try {
    const token = createShareToken(user.id, mode, expiresAt);
    const base = process.env.BASE_URL || `https://myhue.co`;
    const url = `${base}/shared/${token}`;
    return res.json({ token, url, expiresAt, mode });
  } catch (err) {
    console.error("Share token error:", err);
    return res.status(500).json({ error: "Could not create share link." });
  }
});

// GET /api/shared/:token — return profile data for a valid share token
app.get("/api/shared/:token", (req, res) => {
  const row = getShareToken(req.params.token);

  if (!row) return res.status(404).json({ error: "expired" });
  if (row.revoked) return res.status(410).json({ error: "revoked" });
  if (row.expires_at < Date.now()) return res.status(410).json({ error: "expired" });

  const user = getUser(row.user_id);
  if (!user || !user.energy_scores) return res.status(404).json({ error: "expired" });

  const scores = JSON.parse(user.energy_scores);
  const labels = user.reach_labels ? JSON.parse(user.reach_labels) : {};
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  const ENERGY_ORDER = ["spark", "glow", "tend", "flow"];
  const ranked = ENERGY_ORDER
    .map(id => ({ id, score: scores[id] || 0 }))
    .sort((a, b) => b.score - a.score)
    .map((e, i) => ({
      id: e.id,
      score: e.score,
      pct: Math.round((e.score / total) * 100),
      label: labels[e.id] || ["Instinctive","Fluent","Intentional","Developing"][i],
      rank: i,
    }));

  return res.json({
    profile: {
      name: user.name,
      dominantEnergy: user.dominant_energy || ranked[0].id,
      scores,
      labels,
      ranked,
    }
  });
});

// DELETE /api/share/:token — revoke a share token (current user only)
app.delete("/api/share/:token", (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not registered." });

  try {
    const result = revokeShareToken(req.params.token, user.id);
    if (result.changes === 0) return res.status(404).json({ error: "Token not found or not yours." });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Revoke token error:", err);
    return res.status(500).json({ error: "Could not revoke link." });
  }
});

// ─── Anthropic proxy ────────────────────────────────────────────────────────

app.post("/api/chat", async (req, res) => {
  const { system, messages } = req.body;

  if (!system || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing system or messages" });
  }
  if (messages[0].role !== "user") {
    return res.status(400).json({ error: "messages must start with role: user" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 800,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", response.status, err);
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === "text");
    return res.json({ text: textBlock?.text ?? "" });

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Daily email ────────────────────────────────────────────────────────────

const EMAIL_TEMPLATE_PATH = join(__dirname, "hue-email-template.html");
const EMAIL_TEMPLATE = existsSync(EMAIL_TEMPLATE_PATH)
  ? readFileSync(EMAIL_TEMPLATE_PATH, "utf8")
  : null;

const ENERGY_COLORS = {
  spark: "#D92010",
  glow:  "#C9A800", // Darker value for text legibility on yellow background
  tend:  "#1A8C4E",
  flow:  "#1755B8",
};

const CONTENT_TYPES = [
  "A thought for today",
  "A question to sit with",
  "A small experiment",
];

async function generateEmailContent(user) {
  const scores = JSON.parse(user.energy_scores);
  const labels = JSON.parse(user.reach_labels || "{}");
  const total  = Object.values(scores).reduce((a, b) => a + b, 0);

  const ranked = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([id, score]) => ({
      id,
      name:  id.charAt(0).toUpperCase() + id.slice(1),
      pct:   Math.round((score / total) * 100),
      label: labels[id] || "",
    }));

  // Rotate content type by day of week so users get variety
  const contentType = CONTENT_TYPES[new Date().getDay() % CONTENT_TYPES.length];

  const contentInstruction = {
    "A thought for today":    "Write a single observation or insight — something concrete worth noticing today.",
    "A question to sit with": "Write a single question for them to sit with today. No answer needed.",
    "A small experiment":     "Suggest one small, specific thing to try today. Make it concrete and doable.",
  }[contentType];

  const system = `You are Hue, a warm and curious colour energy companion. You are writing 1–3 sentences for a daily email.

${contentInstruction}

This person's colour energy profile (ranked by preference):
${ranked.map(e => `- ${e.name}: ${e.label} (${e.pct}%)`).join("\n")}

Rules:
- 1–3 sentences only — nothing more
- Warm and human, never corporate or clinical
- Always "tends toward", "naturally reaches for" — never "you are a [energy] person"
- Draw on their specific profile in a concrete, surprising way
- No sign-off, no salutation, no subject line
- Plain prose only`;

  const messages = [{ role: "user", content: `Write a "${contentType}" for ${user.name.split(" ")[0]}.` }];

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 200, system, messages }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = data.content?.find(b => b.type === "text")?.text?.trim();
    if (!text) return null;
    return { contentType, contentText: text, dominant: ranked[0] };
  } catch (err) {
    console.error("Email content generation error:", err);
    return null;
  }
}

async function sendDailyEmails() {
  if (!EMAIL_TEMPLATE) {
    console.error("Daily email: hue-email-template.html not found — skipping");
    return;
  }

  console.log("Daily email: starting");
  const users = getUsersForDailyEmail();
  console.log(`Daily email: ${users.length} user(s) with completed assessments`);

  for (const user of users) {
    try {
      const content = await generateEmailContent(user);
      if (!content) {
        console.error(`Daily email: failed to generate content for ${user.email}`);
        continue;
      }

      const firstName = user.name.trim().split(" ")[0];
      const dayName   = new Date().toLocaleDateString("en-GB", { weekday: "long" });

      const html = EMAIL_TEMPLATE
        .replace(/\{\{FIRST_NAME\}\}/g,    firstName)
        .replace(/\{\{PRIMARY_COLOR\}\}/g, ENERGY_COLORS[content.dominant.id] || "#1A1410")
        .replace(/\{\{ENERGY_NAME\}\}/g,   content.dominant.name)
        .replace(/\{\{CONTENT_TYPE\}\}/g,  content.contentType)
        .replace(/\{\{CONTENT_TEXT\}\}/g,  content.contentText)
        .replace(/\{\{CTA_URL\}\}/g,       "https://myhue.co")
        .replace(/\{\{UNSUBSCRIBE_URL\}\}/g, `https://myhue.co/unsubscribe?id=${user.id}`);

      const sent = await sendEmail({
        to:      user.email,
        toName:  firstName,
        subject: `${content.contentType} — ${dayName}`,
        html,
      });

      if (sent) {
        updateLastEmailSent(user.id, Date.now());
        console.log(`Daily email: sent to ${user.email}`);
      }
    } catch (err) {
      console.error(`Daily email: error sending to ${user.email}:`, err);
    }
  }

  console.log("Daily email: complete");
}

// Schedule: 8:00 AM UK time every day
// SIMON: Adjust timezone if your team is not UK-based. UK = Europe/London.
// Note Europe/London automatically handles BST (UTC+1 in summer) vs GMT (UTC in winter).
cron.schedule("0 8 * * *", sendDailyEmails, {
  timezone: "Europe/London",
});

// ─── Trial email sequence ────────────────────────────────────────────────────

const APP_URL = process.env.APP_URL || "https://myhue.co";
const TRIAL_EMAIL_DAYS = [1, 3, 5, 7, 10, 12, 13, 14];
const DAY_MS = 24 * 60 * 60 * 1000;

function trialEmailHtml({ firstName, body, ctaText, ctaUrl }) {
  const cta = ctaText
    ? `<p style="margin:28px 0 0"><a href="${ctaUrl}" style="display:inline-block;background:#1A1410;color:#FDFAF5;border-radius:99px;padding:14px 32px;font-family:Arial,sans-serif;font-weight:700;font-size:15px;text-decoration:none">${ctaText}</a></p>`
    : "";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FDFAF5;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:48px 24px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px">
<tr><td style="padding-bottom:32px">
  <span style="font-family:Georgia,serif;font-size:24px;font-weight:900;letter-spacing:-0.02em;color:#1A1410">h<span style="color:#D92010">u</span>e</span>
</td></tr>
<tr><td style="font-size:16px;line-height:1.75;color:#1A1410">${body}${cta}</td></tr>
<tr><td style="padding-top:40px;font-family:Arial,sans-serif;font-size:12px;color:#9A8F86;line-height:1.6;border-top:1px solid #EAE4DB;margin-top:40px">
  <p style="margin:0">Hue · <a href="${APP_URL}" style="color:#9A8F86">myhue.co</a></p>
  <p style="margin:6px 0 0">Your profile belongs to you. <a href="${APP_URL}/unsubscribe?email=${encodeURIComponent("{{EMAIL}}")}" style="color:#9A8F86">Unsubscribe</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

function buildTrialEmail(dayNumber, user) {
  const firstName  = user.name.trim().split(" ")[0];
  const energy     = user.dominant_energy
    ? user.dominant_energy.charAt(0).toUpperCase() + user.dominant_energy.slice(1)
    : null;
  const energyLine = energy ? `your ${energy} energy` : "your colour energy";

  const appUrl = APP_URL;

  switch (dayNumber) {
    case 1:
      return {
        subject: "You're in. Here's where to start.",
        html: trialEmailHtml({
          firstName,
          body: `<p style="margin:0 0 16px">Hi ${firstName},</p>
<p style="margin:0 0 16px">Welcome to Hue. Over the next 14 days, you'll explore how you naturally show up — not through a quiz, but through conversation.</p>
<p style="margin:0 0 16px">There's no right way to do this. Start when you're ready, take your time, go at your own pace. Your first conversation is waiting.</p>
<p style="margin:0 0 16px">One thing worth knowing now: everything you discover here belongs to you — not your employer, not Hue. Your profile travels with you.</p>`,
          ctaText: "Start your first conversation",
          ctaUrl: appUrl,
        }),
      };

    case 3:
      return {
        subject: "What we're starting to understand about you",
        html: trialEmailHtml({
          firstName,
          body: `<p style="margin:0 0 16px">Hi ${firstName},</p>
<p style="margin:0 0 16px">By now, something is starting to take shape. ${energy
  ? `You tend to reach for ${energy} energy naturally — it shows up in how you described the situations that matter most to you.`
  : "The conversations so far are starting to reveal how you show up."}</p>
<p style="margin:0 0 16px">There are more conversations waiting. Each one adds something different — a fuller picture of you across different contexts, pressures, and relationships.</p>
<p style="margin:0 0 16px">No rush. Your 14 days are running from when you signed up.</p>`,
          ctaText: "Continue exploring",
          ctaUrl: appUrl,
        }),
      };

    case 5:
      return {
        subject: `The energy that shapes how ${energyLine} shows up`,
        html: trialEmailHtml({
          firstName,
          body: `<p style="margin:0 0 16px">Hi ${firstName},</p>
<p style="margin:0 0 16px">Every energy looks and feels different depending on what sits next to it. ${energy
  ? `The way your ${energy} energy shows up is shaped by whatever sits alongside it.`
  : "Your instinctive energy is shaped by everything that sits alongside it."}</p>
<p style="margin:0 0 16px">The next conversation looks at exactly that. It's worth going in directly — the combinations are where the most specific, most useful observations come from.</p>`,
          ctaText: "Continue the conversation",
          ctaUrl: appUrl,
        }),
      };

    case 7:
      return {
        subject: "Halfway. Here's what's taking shape.",
        html: trialEmailHtml({
          firstName,
          body: `<p style="margin:0 0 16px">Hi ${firstName},</p>
<p style="margin:0 0 16px">You're halfway through your 14 days.</p>
${user.assessment_completed_at
  ? `<p style="margin:0 0 16px">You've built a picture of yourself that most people never have — specific, grounded in how you actually behave, not how you think you should. That's rare.</p>
<p style="margin:0 0 16px">The companion is here to keep working with what you've found. Come back whenever something's on your mind.</p>`
  : `<p style="margin:0 0 16px">The conversation is still here, waiting. There's no pressure to rush — but what you'd find in the next hour is worth more than most things on your calendar today.</p>`}`,
          ctaText: "Open Hue",
          ctaUrl: appUrl,
        }),
      };

    case 10:
      return {
        subject: "Four days left — and something worth knowing",
        html: trialEmailHtml({
          firstName,
          body: `<p style="margin:0 0 16px">Hi ${firstName},</p>
<p style="margin:0 0 16px">Your trial ends in four days. On day 14, the app pauses. Your profile doesn't go anywhere — it waits for you.</p>
<p style="margin:0 0 16px">Subscribing keeps the conversation going. The companion builds a relationship with you over time — what's available at six months isn't available at 14 days. It gets more specific, more useful, the longer it runs.</p>
<p style="margin:0 0 16px"><strong>£9.99 a month.</strong> Or £79 for the year — that's two months free.</p>
<p style="margin:0 0 16px">One clear call to action: subscribe now, or wait until day 14. Both are fine.</p>`,
          ctaText: "Subscribe to continue",
          ctaUrl: `${appUrl}?subscribe=1`,
        }),
      };

    case 12:
      return {
        subject: "What changed after three months with Hue",
        html: trialEmailHtml({
          firstName,
          body: `<p style="margin:0 0 16px">Hi ${firstName},</p>
<p style="margin:0 0 16px">Your trial ends in two days.</p>
<p style="margin:0 0 16px">We asked some of our earliest users what changed after a few months with Hue. One answer stayed with us:</p>
<blockquote style="border-left:3px solid #D92010;margin:20px 0;padding:0 0 0 20px;font-style:italic;color:#6B6357">
  "I stopped explaining myself so much. I already knew why I was doing what I was doing — I just needed the words for it."
</blockquote>
<p style="margin:0 0 16px">That's what the companion does over time. Not more insight — sharper language for what you already know about yourself.</p>
<p style="margin:0 0 16px">Your trial ends in two days. Subscribe to keep going.</p>`,
          ctaText: "Subscribe — £9.99/month",
          ctaUrl: `${appUrl}?subscribe=1`,
        }),
      };

    case 13:
      return {
        subject: "Tomorrow your trial ends — your profile is safe",
        html: trialEmailHtml({
          firstName,
          body: `<p style="margin:0 0 16px">Hi ${firstName},</p>
<p style="margin:0 0 16px">Tomorrow your trial ends. The product pauses.</p>
<p style="margin:0 0 16px">Your Hue profile — everything you've explored, every observation, your full energy picture — is saved. It isn't going anywhere. If you choose to subscribe, you pick up exactly where you left off. If you don't, your profile waits.</p>
<p style="margin:0 0 16px">Nothing is lost. Nothing expires.</p>
<p style="margin:0 0 16px">£9.99 a month. £79 a year. One button below.</p>`,
          ctaText: "Subscribe to continue",
          ctaUrl: `${appUrl}?subscribe=1`,
        }),
      };

    case 14:
      return {
        subject: "Your trial has ended",
        html: trialEmailHtml({
          firstName,
          body: `<p style="margin:0 0 16px">Hi ${firstName},</p>
<p style="margin:0 0 16px">Your 14-day trial has ended. The product is now paused — but your profile is here whenever you're ready.</p>
<p style="margin:0 0 16px">Everything you explored is saved. Subscribing gives you back the companion, the daily practice, and the full conversation — exactly where you left off.</p>
<p style="margin:0 0 16px">No pressure. The door stays open.</p>`,
          ctaText: "Subscribe to continue",
          ctaUrl: `${appUrl}?subscribe=1`,
        }),
      };

    default:
      return null;
  }
}

async function sendTrialEmails() {
  const users = getUsersForTrialEmails();

  for (const user of users) {
    // Skip beta users (no user_state) and already-converted/expired users
    if (!user.user_state || user.user_state === "individual-subscriber" || user.user_state === "org-member-active") continue;

    const trialStart = user.trial_started_at || user.registered_at;
    if (!trialStart) continue;

    const daysSinceStart = (Date.now() - trialStart) / DAY_MS;

    for (const dayNumber of TRIAL_EMAIL_DAYS) {
      // Send this email if: we're past that day, haven't sent it yet
      if (daysSinceStart < dayNumber) continue;
      if (hasTrialEmailBeenSent(user.id, dayNumber)) continue;

      const email = buildTrialEmail(dayNumber, user);
      if (!email) continue;

      const firstName = user.name.trim().split(" ")[0];
      const sent = await sendEmail({
        to:      user.email,
        toName:  firstName,
        subject: email.subject,
        html:    email.html.replace("{{EMAIL}}", user.email),
      }).catch(() => false);

      if (sent) {
        recordTrialEmailSent(user.id, dayNumber);
        console.log(`Trial email day ${dayNumber} sent to ${user.email}`);
      } else {
        console.error(`Trial email day ${dayNumber} FAILED for ${user.email}`);
      }

      // Small delay between sends to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

// Trial emails run at 9:00 AM UK time daily (1 hour after daily companion emails)
cron.schedule("0 9 * * *", sendTrialEmails, {
  timezone: "Europe/London",
});

// ─── Start ──────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Hue server running on http://localhost:${PORT}`);
});
