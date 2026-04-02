import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync } from "fs";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import cron from "node-cron";
import { v4 as uuidv4 } from "uuid";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env"), override: true });

import {
  getUser,
  getUserByEmail,
  createUser,
  updateAssessment,
  updateLastEmailSent,
  getUsersForDailyEmail,
  saveConversationSummary,
  getConversationSummaries,
  saveOneSentence,
  getAnniversarySentence,
  resetUserAssessment,
  createShareToken,
  getShareToken,
  revokeShareToken,
  getUserActiveShares,
} from "./db.js";

import { upsertSubscriber } from "./mailerlite.js";
import { sendEmail } from "./mailersend.js";

const app = express();
const PORT = process.env.PORT || 3001;

// SIMON: Set INVITE_TOKEN in Railway environment variables before sharing the beta link.
// Default is BETA2026 — change it to something less guessable.
const INVITE_TOKEN = process.env.INVITE_TOKEN || "BETA2026";

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(join(__dirname, "public")));

// Serve hue.html for both / and /register (React app handles routing)
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "hue.html"));
});
app.get("/register", (req, res) => {
  res.sendFile(join(__dirname, "public", "hue.html"));
});
app.get("/shared/:token", (req, res) => {
  res.sendFile(join(__dirname, "public", "hue.html"));
});

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

function formatUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    betaAccess: true,
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

// POST /api/register — create beta user (requires valid invite token)
app.post("/api/register", async (req, res) => {
  const { name, email, inviteToken } = req.body;

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: "Please enter your name and email." });
  }

  if (inviteToken !== INVITE_TOKEN) {
    return res.status(403).json({ error: "This invite link isn't valid." });
  }

  const normalised = email.toLowerCase().trim();
  const existing = getUserByEmail(normalised);

  if (existing) {
    // Already registered — refresh their cookie and return
    setUserCookie(res, existing.id);
    return res.json({ user: formatUserResponse(existing), alreadyRegistered: true });
  }

  const id = uuidv4();
  try {
    createUser({ id, name: name.trim(), email: normalised, registered_at: Date.now() });
  } catch (err) {
    console.error("DB error on register:", err);
    return res.status(500).json({ error: "Could not create your account. Please try again." });
  }

  // Add to MailerLite (non-blocking — don't fail registration if this errors)
  upsertSubscriber({ name: name.trim(), email: normalised }).catch(console.error);

  setUserCookie(res, id);
  return res.json({ user: { id, name: name.trim(), email: normalised, betaAccess: true, assessmentCompleted: false } });
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

  const ENERGY_ORDER = ["spark", "glow", "root", "flow"];
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
  root:  "#1A8C4E",
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

// ─── Start ──────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Hue server running on http://localhost:${PORT}`);
});
