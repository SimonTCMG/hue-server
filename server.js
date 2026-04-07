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
  calculateBands,
  getTeamsForUser,
  upsertTeamEnergyBands,
  createOrganisation,
  getOrganisation,
  createTeam,
  getTeam,
  getTeamsForOrg,
  updateTeamVisibility,
  addTeamMember,
  getTeamMembers,
  getTeamEnergyBands,
  getTeamAggregate,
  removeTeamMember,
  getOrgMembers,
  getUserRole,
  isOrgAdmin,
  hasOrgEmailBeenSent,
  recordOrgEmailSent,
  getOrgMembersForEmails,
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
app.get("/register-org", sendApp);
app.get("/shared/:token", sendApp);
app.get("/team/:teamId", sendApp);
app.get("/org/:orgId", sendApp);

// ─── TCMG org bootstrap (idempotent — runs once on first deploy) ──────────
{
  const TCMG_ORG_ID = "tcmg-org-001";
  const TCMG_TEAM_ID = "tcmg-team-001";
  const existing = getOrganisation(TCMG_ORG_ID);
  if (!existing) {
    createOrganisation(TCMG_ORG_ID, "The Change Maker Group");
    createTeam(TCMG_TEAM_ID, TCMG_ORG_ID, "TCMG");
    console.log("TCMG org and team created (first deploy)");
  }
  // If Simon has already registered, make him org-admin
  const simon = getUserByEmail("simon@thechangemakergroup.com");
  if (simon) {
    const role = getUserRole(simon.id, TCMG_TEAM_ID);
    if (!role) {
      addTeamMember(simon.id, TCMG_TEAM_ID, "org-admin");
      console.log("Simon added as TCMG org-admin");
    }
  }
}

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

  // Auto-link TCMG org admin if Simon registers with his known email
  if (normalised === "simon@thechangemakergroup.com") {
    const tcmgTeam = getTeam("tcmg-team-001");
    if (tcmgTeam) {
      addTeamMember(id, "tcmg-team-001", "org-admin");
      console.log("Simon auto-linked as TCMG org-admin on registration");
    }
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

// POST /api/register-org — create org member account (no payment, no trial clock)
app.post("/api/register-org", async (req, res) => {
  const { name, email, orgCode, teamId } = req.body;

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: "Please enter your name and email." });
  }

  // orgCode is the org ID from the invite link
  if (!orgCode?.trim()) {
    return res.status(400).json({ error: "Please enter your organisation code." });
  }

  // Validate org exists
  const org = getOrganisation(orgCode.trim());
  if (!org) {
    return res.status(400).json({ error: "Organisation not found. Please check your invite link." });
  }

  const normalised = email.toLowerCase().trim();
  const existing = getUserByEmail(normalised);

  if (existing) {
    // Auto-add to team if teamId provided and not already a member
    if (teamId) {
      const role = getUserRole(existing.id, teamId);
      if (!role) {
        addTeamMember(existing.id, teamId, "member");
        if (existing.energy_scores) {
          try {
            const scores = JSON.parse(existing.energy_scores);
            upsertTeamEnergyBands(existing.id, teamId, calculateBands(scores));
          } catch {}
        }
      }
    }
    setUserCookie(res, existing.id);
    return res.json({ user: formatUserResponse(existing), alreadyRegistered: true });
  }

  const id  = uuidv4();
  const now = Date.now();
  try {
    createUser({ id, name: name.trim(), email: normalised, registered_at: now,
                 trial_started_at: null, user_state: "org-member-active" });
  } catch (err) {
    console.error("DB error on org register:", err);
    return res.status(500).json({ error: "Could not create your account. Please try again." });
  }

  // Auto-add to team from invite link
  if (teamId) {
    const team = getTeam(teamId);
    if (team && team.org_id === orgCode.trim()) {
      addTeamMember(id, teamId, "member");
    }
  } else {
    // No specific team — add to first team in the org
    const teams = getTeamsForOrg(orgCode.trim());
    if (teams.length > 0) {
      addTeamMember(id, teams[0].id, "member");
    }
  }

  // Add to MailerLite with org-member-active state (non-blocking)
  upsertSubscriber({ name: name.trim(), email: normalised, userState: "org-member-active" }).catch(console.error);

  // Send Email 1 (Welcome) immediately
  const firstName = name.trim().split(" ")[0];
  sendEmail({
    to: normalised,
    toName: firstName,
    subject: "Welcome to Hue \u2014 your profile is yours",
    html: orgOnboardingEmailHtml({
      firstName,
      body: `<p style="margin:0 0 16px">Hi ${firstName},</p>
<p style="margin:0 0 16px">Welcome to Hue. Through a short conversation, Hue identifies how you tend to show up across four colour energy dimensions. Then it stays with you \u2014 an ongoing companion that helps you understand your own patterns over time.</p>
<p style="margin:0 0 16px"><strong>Your profile belongs to you \u2014 not your employer. They see the team picture, never your individual result.</strong></p>
<p style="margin:0 0 16px">When you\u2019re ready, start your first conversation. It takes about five minutes. There are no right or wrong answers \u2014 just honest ones.</p>`,
      ctaText: "Start your first conversation",
      ctaUrl: APP_URL,
    }),
  }).then(() => {
    recordOrgEmailSent(id, 0);
    console.log(`Org welcome email sent to ${normalised}`);
  }).catch(err => console.error("Org welcome email failed:", err));

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

  // Pipeline 1: calculate bands and push to any teams this user belongs to.
  // Only band labels cross into the team layer — never raw scores.
  try {
    const bands = calculateBands(scores);
    const teams = getTeamsForUser(user.id);
    for (const team of teams) {
      upsertTeamEnergyBands(user.id, team.id, bands);
    }
  } catch (err) {
    console.error("Team bands update error (non-blocking):", err);
  }

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

// ─── Team & Org API ──────────────────────────────────────────────────────────

// Get teams for current user
app.get("/api/teams", (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  const teams = getTeamsForUser(user.id);
  res.json({ teams });
});

// Get team dashboard data (overview)
app.get("/api/team/:teamId", (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { teamId } = req.params;
  const team = getTeam(teamId);
  if (!team) return res.status(404).json({ error: "Team not found" });

  // Check membership
  const role = getUserRole(user.id, teamId);
  if (!role) return res.status(403).json({ error: "Not a member of this team" });

  // If visibility is leader-only and user is not lead/admin, block
  if (team.visibility === "leader_only" && role === "member") {
    return res.json({ team: { id: team.id, name: team.name, visibility: team.visibility }, restricted: true });
  }

  const aggregate = getTeamAggregate(teamId);
  const members = getTeamMembers(teamId);
  const bands = getTeamEnergyBands(teamId);

  // Build member list with initials and instinctive energy colour (never raw scores)
  const memberList = members.map(m => {
    const band = bands.find(b => b.user_id === m.user_id);
    return {
      userId: m.user_id,
      name: m.name,
      initials: m.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
      role: m.role,
      assessmentComplete: !!band,
      // Instinctive energy = the one with "Naturally present" band (or first if multiple)
      instinctiveEnergy: band ? (
        band.spark_band === "Naturally present" ? "spark" :
        band.glow_band === "Naturally present" ? "glow" :
        band.tend_band === "Naturally present" ? "tend" :
        band.flow_band === "Naturally present" ? "flow" : null
      ) : null,
      bands: band ? {
        spark: band.spark_band,
        glow: band.glow_band,
        tend: band.tend_band,
        flow: band.flow_band,
      } : null,
    };
  });

  res.json({
    team: { id: team.id, name: team.name, visibility: team.visibility, orgId: team.org_id },
    role,
    aggregate,
    members: memberList,
  });
});

// Update team visibility (team-lead or org-admin only)
app.put("/api/team/:teamId/visibility", (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { teamId } = req.params;
  const { visibility } = req.body;
  if (!["full_team", "leader_only"].includes(visibility)) {
    return res.status(400).json({ error: "Invalid visibility value" });
  }

  const role = getUserRole(user.id, teamId);
  if (!role || role === "member") {
    return res.status(403).json({ error: "Only team leads and org admins can change visibility" });
  }

  updateTeamVisibility(teamId, visibility);
  res.json({ ok: true, visibility });
});

// ─── Org admin endpoints ─────────────────────────────────────────────────────

// Create organisation + first team
app.post("/api/org/create", (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { orgName, teamName } = req.body;
  if (!orgName || !teamName) return res.status(400).json({ error: "orgName and teamName required" });

  const orgId = uuidv4();
  const teamId = uuidv4();
  createOrganisation(orgId, orgName);
  createTeam(teamId, orgId, teamName);
  addTeamMember(user.id, teamId, "org-admin");

  // Sync bands if user has completed assessment
  if (user.energy_scores) {
    try {
      const scores = JSON.parse(user.energy_scores);
      const bands = calculateBands(scores);
      upsertTeamEnergyBands(user.id, teamId, bands);
    } catch {}
  }

  res.json({ ok: true, orgId, teamId });
});

// Create additional team within an org
app.post("/api/org/:orgId/team", (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { orgId } = req.params;
  const { teamName } = req.body;
  if (!teamName) return res.status(400).json({ error: "teamName required" });

  if (!isOrgAdmin(user.id, orgId)) {
    return res.status(403).json({ error: "Only org admins can create teams" });
  }

  const teamId = uuidv4();
  createTeam(teamId, orgId, teamName);
  res.json({ ok: true, teamId });
});

// Get org overview (all teams, all members)
app.get("/api/org/:orgId", (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { orgId } = req.params;
  if (!isOrgAdmin(user.id, orgId)) {
    return res.status(403).json({ error: "Only org admins can view org overview" });
  }

  const org = getOrganisation(orgId);
  if (!org) return res.status(404).json({ error: "Organisation not found" });

  const teams = getTeamsForOrg(orgId);
  const members = getOrgMembers(orgId);

  // Group members by user (a user can be in multiple teams)
  const memberMap = {};
  for (const m of members) {
    if (!memberMap[m.id]) {
      memberMap[m.id] = {
        userId: m.id,
        name: m.name,
        email: m.email,
        assessmentComplete: !!m.assessment_completed_at,
        userState: m.user_state,
        dominantEnergy: m.dominant_energy,
        teams: [],
      };
    }
    memberMap[m.id].teams.push({ teamId: m.team_id, teamName: m.team_name, role: m.role });
  }

  res.json({
    org: { id: org.id, name: org.name },
    teams: teams.map(t => ({ id: t.id, name: t.name, visibility: t.visibility })),
    members: Object.values(memberMap),
  });
});

// Invite member to team by email
app.post("/api/org/:orgId/invite", (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { orgId } = req.params;
  const { email, teamId } = req.body;
  if (!email || !teamId) return res.status(400).json({ error: "email and teamId required" });

  if (!isOrgAdmin(user.id, orgId)) {
    return res.status(403).json({ error: "Only org admins can invite members" });
  }

  // Check team belongs to this org
  const team = getTeam(teamId);
  if (!team || team.org_id !== orgId) {
    return res.status(400).json({ error: "Team not found in this organisation" });
  }

  // Check if user already exists
  const existingUser = getUserByEmail(email.toLowerCase().trim());
  if (existingUser) {
    // Add to team if not already a member
    const role = getUserRole(existingUser.id, teamId);
    if (role) return res.json({ ok: true, status: "already_member" });
    addTeamMember(existingUser.id, teamId, "member");
    // Sync bands if assessment complete
    if (existingUser.energy_scores) {
      try {
        const scores = JSON.parse(existingUser.energy_scores);
        const bands = calculateBands(scores);
        upsertTeamEnergyBands(existingUser.id, teamId, bands);
      } catch {}
    }
    return res.json({ ok: true, status: "added" });
  }

  // User doesn't exist yet — send invite email
  const inviteUrl = `${APP_URL}/register-org?org=${orgId}&team=${teamId}`;
  const orgObj = getOrganisation(orgId);
  sendEmail({
    to: email.toLowerCase().trim(),
    toName: email.split("@")[0],
    subject: `${user.name} has invited you to Hue`,
    html: trialEmailHtml({
      firstName: email.split("@")[0],
      body: `<p style="margin:0 0 16px">${user.name} has invited you to join <strong>${team.name}</strong> on Hue.</p>
<p style="margin:0 0 16px">Hue is a short conversation that identifies how you tend to show up across four colour energy dimensions. It takes about five minutes, and there are no right or wrong answers. Afterwards, you get a profile with specific observations about your energy patterns \u2014 and an ongoing companion that helps you make sense of them over time.</p>
<p style="margin:0 0 16px"><strong>Your profile belongs to you \u2014 not your employer. They see the team picture, never your individual result.</strong></p>
<p style="margin:0 0 16px">Your individual scores, observations, and companion conversations are completely private. The team dashboard shows only the aggregate energy picture \u2014 which energies the team tends to reach for collectively.</p>`,
      ctaText: `Join ${team.name}`,
      ctaUrl: inviteUrl,
    }),
  }).catch(err => console.error("Invite email failed:", err));

  res.json({ ok: true, status: "invited" });
});

// Remove member from org (all their teams in this org)
app.delete("/api/org/:orgId/member/:userId", (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { orgId, userId } = req.params;
  if (!isOrgAdmin(user.id, orgId)) {
    return res.status(403).json({ error: "Only org admins can remove members" });
  }

  // Remove from all teams in this org
  const teams = getTeamsForOrg(orgId);
  for (const team of teams) {
    removeTeamMember(userId, team.id);
  }

  res.json({ ok: true });
});

// Assign team lead role
app.put("/api/org/:orgId/team/:teamId/lead", (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { orgId, teamId } = req.params;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  if (!isOrgAdmin(user.id, orgId)) {
    return res.status(403).json({ error: "Only org admins can assign team leads" });
  }

  addTeamMember(userId, teamId, "team-lead");
  res.json({ ok: true });
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

// Org onboarding emails use the same HTML wrapper as trial emails
const orgOnboardingEmailHtml = trialEmailHtml;

// ─── Org member onboarding email builder ──────────────────────────────────

const ORG_EMAIL_DAYS = [3, 7, 14]; // Day 0 (welcome) is sent immediately at registration

function buildOrgEmail(dayNumber, user) {
  const firstName = user.name.trim().split(" ")[0];
  const energy = user.dominant_energy
    ? user.dominant_energy.charAt(0).toUpperCase() + user.dominant_energy.slice(1)
    : null;

  // Developing energy = 4th ranked
  let developingEnergy = null;
  if (user.reach_labels) {
    try {
      const labels = JSON.parse(user.reach_labels);
      const dev = Object.entries(labels).find(([, v]) => v === "Developing");
      if (dev) developingEnergy = dev[0].charAt(0).toUpperCase() + dev[0].slice(1);
    } catch {}
  }

  const appUrl = APP_URL;

  switch (dayNumber) {
    case 3:
      if (!energy) return null; // Can't send personalised email without assessment
      return {
        subject: `Your ${energy} energy \u2014 and what the other three are telling us`,
        html: orgOnboardingEmailHtml({
          firstName,
          body: `<p style="margin:0 0 16px">Hi ${firstName},</p>
<p style="margin:0 0 16px">Your conversation with Hue revealed something worth sitting with. You tend to reach for ${energy} energy first \u2014 it\u2019s where you go naturally, often without thinking about it.</p>
<p style="margin:0 0 16px">${developingEnergy ? `Your ${developingEnergy} energy sits in a different place. Not absent \u2014 but not instinctive. This is where deliberate practice produces the most visible change. When you consciously reach for ${developingEnergy}, people notice.` : "The energy you reach for least isn\u2019t missing \u2014 it\u2019s where deliberate practice produces the most visible change."}</p>
<p style="margin:0 0 16px">The companion knows your profile. Bring it a real situation and see what it reflects back.</p>`,
          ctaText: "Talk to the companion",
          ctaUrl: appUrl,
        }),
      };

    case 7:
      return {
        subject: "What your employer sees \u2014 and what they don\u2019t",
        html: orgOnboardingEmailHtml({
          firstName,
          body: `<p style="margin:0 0 16px">Hi ${firstName},</p>
<p style="margin:0 0 16px">You might be wondering what your employer can see. Here\u2019s the short answer: the team picture, never your individual result.</p>
<p style="margin:0 0 16px">Your employer sees an aggregate \u2014 which energies the team tends to reach for collectively. They never see your individual scores, your personal observations, or anything from your companion conversations. Those are yours.</p>
<p style="margin:0 0 16px"><strong>Your profile belongs to you \u2014 not your employer. They see the team picture, never your individual result.</strong></p>
<p style="margin:0 0 16px">The companion is completely private. Whatever you bring to it stays between you and Hue.</p>`,
          ctaText: "Continue the conversation",
          ctaUrl: appUrl,
        }),
      };

    case 14:
      return {
        subject: "Two weeks in \u2014 here\u2019s what Hue can do from here",
        html: orgOnboardingEmailHtml({
          firstName,
          body: `<p style="margin:0 0 16px">Hi ${firstName},</p>
<p style="margin:0 0 16px">You\u2019ve had your profile for two weeks now. The companion is the part of Hue that continues the conversation \u2014 it knows your energy picture, remembers what you\u2019ve talked about, and can help you think through real situations using the lens of your profile.</p>
<p style="margin:0 0 16px">It\u2019s not therapy. It\u2019s not coaching. It\u2019s a specific, informed conversation that gets more useful the more you use it.</p>
<p style="margin:0 0 16px">${energy ? `Try bringing something real \u2014 a situation you\u2019re navigating, a relationship you\u2019re thinking about, a decision you\u2019re weighing. See what your ${energy} energy looks like in context.` : "Try bringing something real \u2014 a situation you\u2019re navigating, a relationship you\u2019re thinking about, a decision you\u2019re weighing."}</p>`,
          ctaText: "Talk to the companion",
          ctaUrl: appUrl,
        }),
      };

    default:
      return null;
  }
}

// ─── Org member onboarding email cron ─────────────────────────────────────

async function sendOrgOnboardingEmails() {
  const users = getOrgMembersForEmails();

  for (const user of users) {
    const daysSinceReg = (Date.now() - user.registered_at) / DAY_MS;

    for (const dayNumber of ORG_EMAIL_DAYS) {
      if (daysSinceReg < dayNumber) continue;
      if (hasOrgEmailBeenSent(user.id, dayNumber)) continue;

      const email = buildOrgEmail(dayNumber, user);
      if (!email) continue;

      const firstName = user.name.trim().split(" ")[0];
      const sent = await sendEmail({
        to:      user.email,
        toName:  firstName,
        subject: email.subject,
        html:    email.html.replace("{{EMAIL}}", user.email),
      }).catch(() => false);

      if (sent) {
        recordOrgEmailSent(user.id, dayNumber);
        console.log(`Org email day ${dayNumber} sent to ${user.email}`);
      } else {
        console.error(`Org email day ${dayNumber} FAILED for ${user.email}`);
      }

      await new Promise(r => setTimeout(r, 500));
    }
  }
}

// Org onboarding emails run at 9:15 AM UK time daily (after trial emails)
cron.schedule("15 9 * * *", sendOrgOnboardingEmails, {
  timezone: "Europe/London",
});

// ─── Trial email builder ──────────────────────────────────────────────────

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

    case 12: {
      // Testimonial library — matched to recipient's dominant energy
      const testimonials = {
        spark: {
          name: "Rachel",
          colour: "#D92010",
          quote: "I did it because a friend wouldn\u2019t stop going on about it. Expected to get told I\u2019m bossy and impatient, which, fair enough. But there was this bit about how I move fastest when I can already see how everything fits together \u2014 and that\u2019s so specifically true it was a bit irritating. Showed my husband. He just laughed and said \u2018well yeah.\u2019",
        },
        glow: {
          name: "Dom",
          colour: "#F5D000",
          quote: "I thought it would be a bit woo. It wasn\u2019t really. It just had this way of describing stuff I do without making it sound like a flaw or a superpower \u2014 just, this is how you are. There was a line about bringing warmth without holding things up that I\u2019ve thought about quite a bit since. I don\u2019t fully know why it landed but it did.",
        },
        tend: {
          name: "Priya",
          colour: "#1A8C4E",
          quote: "The conversation took about 20 minutes and I nearly didn\u2019t finish it. Glad I did. It said something about commitments I\u2019ve never walked away from even when it would\u2019ve been easier \u2014 which is true and I\u2019d never really clocked that about myself before. My mum would say I\u2019ve always been like that. She\u2019s probably right.",
        },
        flow: {
          name: "Kiran",
          colour: "#1755B8",
          quote: "I\u2019ve spent a lot of my career being told I overthink things. Hue basically said \u2014 no, you\u2019re checking whether the question is even the right one. Which is different. I don\u2019t know if that makes me feel better or just more aware of it, but either way it\u2019s more useful than being told to trust my gut.",
        },
      };
      const t = testimonials[(user.dominant_energy || "").toLowerCase()] || testimonials.spark;
      return {
        subject: `What ${t.name} noticed`,
        html: trialEmailHtml({
          firstName,
          body: `<p style="margin:0 0 16px">Hi ${firstName},</p>
<p style="margin:0 0 16px">Your trial ends in two days.</p>
<p style="margin:0 0 16px">We asked some of our earliest users what changed after spending time with Hue. Here\u2019s what ${t.name} said:</p>
<blockquote style="border-left:3px solid ${t.colour};margin:20px 0;padding:0 0 0 20px;font-style:italic;color:#6B6357">
  "${t.quote}"
</blockquote>
<p style="margin:0 0 12px;font-weight:600;color:#3D3630">\u2014 ${t.name}</p>
<p style="margin:0 0 16px">That\u2019s what the companion does over time. Not more insight \u2014 sharper language for what you already know about yourself.</p>
<p style="margin:0 0 16px">Your trial ends in two days. Subscribe to keep going.</p>`,
          ctaText: "Subscribe \u2014 \u00A39.99/month",
          ctaUrl: `${appUrl}?subscribe=1`,
        }),
      };
    }

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
