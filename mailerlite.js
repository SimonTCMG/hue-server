// ─── Hue — MailerLite API helpers ─────────────────────────────────────────
//
// Uses MailerLite REST API directly (no library).
// API key: set MAILERLITE_API_KEY in .env / Railway environment variables.
//
// SIMON: Two different MailerLite APIs are in use here:
//
//   1. Subscriber management  → connect.mailerlite.com/api  (standard plan, free)
//      Used to: add/update subscribers, manage groups
//
//   2. Transactional email send → connect.mailerlite.com/api/emails/send
//      REQUIRES: MailerLite transactional email addon or Email API plan (~$9/month extra)
//      Check: app.mailerlite.com → Email API
//      If you don't have it, the daily send will fail silently (logged to console).
//      Alternative: build a MailerLite automation triggered on group entry instead.
//
// ──────────────────────────────────────────────────────────────────────────

const ML_BASE = "https://connect.mailerlite.com/api";

function mlHeaders() {
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${process.env.MAILERLITE_API_KEY}`,
  };
}

async function mlFetch(path, method = "GET", body = null) {
  return fetch(`${ML_BASE}${path}`, {
    method,
    headers: mlHeaders(),
    body: body ? JSON.stringify(body) : null,
  });
}

// ─── Subscriber management ────────────────────────────────────────────────

// Add or update a subscriber. Scores and labels are optional (set after assessment).
export async function upsertSubscriber({ name, email, dominantEnergy, scores, labels, userState }) {
  if (!process.env.MAILERLITE_API_KEY) {
    console.warn("MAILERLITE_API_KEY not set — skipping subscriber upsert");
    return false;
  }

  const [firstName, ...rest] = name.trim().split(" ");
  const groupId = await getOrCreateGroup("Hue Beta Testers");

  const body = {
    email: email.toLowerCase().trim(),
    fields: {
      name: firstName,
      last_name: rest.join(" ") || "",
      dominant_energy: dominantEnergy || "",
      spark_score: scores?.spark ?? "",
      glow_score:  scores?.glow  ?? "",
      tend_score:  scores?.tend  ?? "",
      flow_score:  scores?.flow  ?? "",
      spark_label: labels?.spark ?? "",
      glow_label:  labels?.glow  ?? "",
      tend_label:  labels?.tend  ?? "",
      flow_label:  labels?.flow  ?? "",
      user_state:  userState     || "",
      beta_tester: "true",
    },
    groups: groupId ? [groupId] : [],
  };

  const res = await mlFetch("/subscribers", "POST", body);
  if (!res.ok) {
    const err = await res.text();
    console.error("MailerLite upsert error:", res.status, err);
  }
  return res.ok;
}

// ─── Transactional email ──────────────────────────────────────────────────

export async function sendTransactional({ to, toName, subject, html }) {
  if (!process.env.MAILERLITE_API_KEY) {
    console.warn("MAILERLITE_API_KEY not set — skipping email send");
    return false;
  }

  const fromEmail = process.env.FROM_EMAIL || "hello@myhue.co";

  const body = {
    to:      [{ email: to, name: toName }],
    from:    { email: fromEmail, name: "Hue" },
    subject,
    html,
  };

  const res = await mlFetch("/emails/send", "POST", body);
  if (!res.ok) {
    const err = await res.text();
    console.error("MailerLite transactional send error:", res.status, err);
    // SIMON: If you see 422 or 403 here, transactional addon is not enabled.
    // See mailerlite.js header for options.
  }
  return res.ok;
}

// ─── Group helpers ────────────────────────────────────────────────────────

async function getOrCreateGroup(name) {
  try {
    const res = await mlFetch("/groups");
    if (!res.ok) return null;
    const data = await res.json();
    const existing = (data.data || []).find(g => g.name === name);
    if (existing) return existing.id;

    const createRes = await mlFetch("/groups", "POST", { name });
    if (!createRes.ok) return null;
    const created = await createRes.json();
    return created.data?.id ?? null;
  } catch (err) {
    console.error("MailerLite group error:", err);
    return null;
  }
}
