// ─── Hue — MailerSend transactional email helper ──────────────────────────
//
// MailerSend is used for the daily personalised email send only.
// (MailerLite handles subscriber management — see mailerlite.js)
//
// Required env var: MAILERSEND_API_KEY
// Get it from: app.mailersend.com → Integrations → API Tokens
//
// SIMON: Add MAILERSEND_API_KEY to Railway environment variables.
// Sending domain must be verified in MailerSend (myhue.co — done).
// FROM_EMAIL should be hello@myhue.co or similar.
// ──────────────────────────────────────────────────────────────────────────

const MS_BASE = "https://api.mailersend.com/v1";

export async function sendEmail({ to, toName, subject, html }) {
  const apiKey = process.env.MAILERSEND_API_KEY;

  if (!apiKey) {
    console.warn("MAILERSEND_API_KEY not set — skipping email send");
    return false;
  }

  const fromEmail = process.env.FROM_EMAIL || "hello@myhue.co";

  const body = {
    from:    { email: fromEmail, name: "Hue" },
    to:      [{ email: to, name: toName }],
    subject,
    html,
  };

  try {
    const res = await fetch(`${MS_BASE}/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept":        "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("MailerSend send error:", res.status, err);
      // SIMON: Common errors:
      // 401 — API key invalid or not set
      // 422 — domain not verified (check app.mailersend.com → Domains)
      // 429 — rate limit hit
      return false;
    }

    return true;
  } catch (err) {
    console.error("MailerSend network error:", err);
    return false;
  }
}
