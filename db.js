// ─── Hue — User database (SQLite) ─────────────────────────────────────────
//
// SIMON: SQLite stores data in hue.db in the project root.
// Railway's filesystem is EPHEMERAL — this file is wiped on every redeploy.
// Before deploying to Railway, do ONE of the following:
//
//   Option A (recommended): Provision Railway's Postgres plugin
//   → Go to your Railway project → + New → Database → PostgreSQL
//   → Railway will set DATABASE_URL automatically
//   → Then replace this file with a pg-based version (see CLAUDE.md)
//
//   Option B: Add a Railway Volume (persistent filesystem)
//   → Railway project → + New → Volume → mount at /app/data
//   → Change the db path below to: join("/app/data", "hue.db")
//
// For local development, SQLite is fine as-is.
// ──────────────────────────────────────────────────────────────────────────

import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || join(__dirname, "hue.db");
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS one_sentences (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    sentence   TEXT NOT NULL,
    energy     TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS conversation_summaries (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    summary    TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id                      TEXT PRIMARY KEY,
    name                    TEXT NOT NULL,
    email                   TEXT UNIQUE NOT NULL,
    registered_at           INTEGER NOT NULL,
    assessment_completed_at INTEGER,
    energy_scores           TEXT,
    reach_labels            TEXT,
    dominant_energy         TEXT,
    last_email_sent_at      INTEGER,
    trial_started_at        INTEGER,
    user_state              TEXT,
    stripe_customer_id      TEXT
  )
`);

try { db.exec(`ALTER TABLE users ADD COLUMN stripe_customer_id TEXT`); } catch {}

// Add trial columns to existing deployments that predate the trial model
try { db.exec(`ALTER TABLE users ADD COLUMN trial_started_at INTEGER`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN user_state TEXT`); } catch {}
// Issue 7: store retest date at registration, not computed at render time
try { db.exec(`ALTER TABLE users ADD COLUMN retest_available_at TEXT`); } catch {}

// Migrate Root → Tend in existing user records (one-time, idempotent)
db.exec(`
  UPDATE users SET dominant_energy = 'tend' WHERE dominant_energy = 'root';
  UPDATE users SET energy_scores = REPLACE(energy_scores, '"root":', '"tend":') WHERE energy_scores LIKE '%"root":%';
  UPDATE users SET reach_labels  = REPLACE(reach_labels,  '"root":', '"tend":') WHERE reach_labels  LIKE '%"root":%';
`);

export function getUser(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

export function getUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

export function createUser({ id, name, email, registered_at, trial_started_at = null, user_state = null }) {
  return db.prepare(
    "INSERT INTO users (id, name, email, registered_at, trial_started_at, user_state) VALUES (@id, @name, @email, @registered_at, @trial_started_at, @user_state)"
  ).run({ id, name, email, registered_at, trial_started_at, user_state });
}

export function updateUserState(id, user_state, previousState) {
  if (previousState !== undefined) {
    return db.prepare("UPDATE users SET user_state = ?, previous_state = ? WHERE id = ?").run(user_state, previousState, id);
  }
  return db.prepare("UPDATE users SET user_state = ? WHERE id = ?").run(user_state, id);
}

export function updateStripeCustomer(id, stripe_customer_id) {
  return db.prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?").run(stripe_customer_id, id);
}

export function updateAssessment(id, { completed_at, energy_scores, reach_labels, dominant_energy }) {
  return db.prepare(
    `UPDATE users
     SET assessment_completed_at = @completed_at,
         energy_scores           = @energy_scores,
         reach_labels            = @reach_labels,
         dominant_energy         = @dominant_energy
     WHERE id = @id`
  ).run({ id, completed_at, energy_scores, reach_labels, dominant_energy });
}

export function updateLastEmailSent(id, ts) {
  return db.prepare("UPDATE users SET last_email_sent_at = ? WHERE id = ?").run(ts, id);
}

export function getUsersForDailyEmail() {
  // Send daily emails to subscribers, org members, beta users, and legacy beta users (null state)
  return db.prepare(
    "SELECT * FROM users WHERE assessment_completed_at IS NOT NULL AND (user_state IN ('individual-subscriber', 'org-member-active', 'beta-user') OR user_state IS NULL)"
  ).all();
}

export function getUsersForTrialEmails() {
  // All trial-active users, including beta (null state) — filter by state in caller
  return db.prepare(
    "SELECT * FROM users WHERE trial_started_at IS NOT NULL"
  ).all();
}

db.exec(`
  CREATE TABLE IF NOT EXISTS shared_profiles (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    mode       TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    revoked    INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  )
`);

export function createShareToken(userId, mode, expiresAt) {
  const id = uuidv4();
  db.prepare(
    "INSERT INTO shared_profiles (id, user_id, mode, expires_at, revoked, created_at) VALUES (?, ?, ?, ?, 0, ?)"
  ).run(id, userId, mode, expiresAt, Date.now());
  return id;
}

export function getShareToken(token) {
  return db.prepare("SELECT * FROM shared_profiles WHERE id = ?").get(token) || null;
}

export function revokeShareToken(token, userId) {
  return db.prepare(
    "UPDATE shared_profiles SET revoked = 1 WHERE id = ? AND user_id = ?"
  ).run(token, userId);
}

export function getUserActiveShares(userId) {
  const now = Date.now();
  return db.prepare(
    "SELECT * FROM shared_profiles WHERE user_id = ? AND revoked = 0 AND expires_at > ?"
  ).all(userId, now);
}

export function resetUserAssessment(userId) {
  db.prepare(
    `UPDATE users SET assessment_completed_at = NULL, energy_scores = NULL, reach_labels = NULL, dominant_energy = NULL WHERE id = ?`
  ).run(userId);
  db.prepare("DELETE FROM conversation_summaries WHERE user_id = ?").run(userId);
  db.prepare("DELETE FROM one_sentences WHERE user_id = ?").run(userId);
}

export function saveOneSentence(userId, sentence, energy) {
  return db.prepare(
    "INSERT INTO one_sentences (id, user_id, sentence, energy, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(uuidv4(), userId, sentence, energy, Date.now());
}

export function getAnniversarySentence(userId) {
  const row = db.prepare(
    "SELECT sentence, energy, created_at FROM one_sentences WHERE user_id = ? ORDER BY created_at ASC LIMIT 1"
  ).get(userId);
  if (!row) return null;
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  const window  = 7   * 24 * 60 * 60 * 1000;
  const anniversary = row.created_at + oneYear;
  const now = Date.now();
  if (now >= anniversary - window && now <= anniversary + window) {
    return { sentence: row.sentence, energy: row.energy, created_at: row.created_at };
  }
  return null;
}

export function saveConversationSummary(userId, summary) {
  return db.prepare(
    "INSERT INTO conversation_summaries (id, user_id, summary, created_at) VALUES (?, ?, ?, ?)"
  ).run(uuidv4(), userId, summary, Date.now());
}

export function getConversationSummaries(userId, limit = 5) {
  return db.prepare(
    "SELECT summary, created_at FROM conversation_summaries WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"
  ).all(userId, limit);
}

// ─── Trial email tracking ─────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS trial_emails (
    user_id    TEXT NOT NULL,
    day_number INTEGER NOT NULL,
    sent_at    INTEGER NOT NULL,
    PRIMARY KEY (user_id, day_number)
  )
`);

export function hasTrialEmailBeenSent(userId, dayNumber) {
  return !!db.prepare(
    "SELECT 1 FROM trial_emails WHERE user_id = ? AND day_number = ?"
  ).get(userId, dayNumber);
}

export function recordTrialEmailSent(userId, dayNumber) {
  db.prepare(
    "INSERT OR IGNORE INTO trial_emails (user_id, day_number, sent_at) VALUES (?, ?, ?)"
  ).run(userId, dayNumber, Date.now());
}

// ─── Org member onboarding emails ─────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS org_emails (
    user_id    TEXT NOT NULL,
    day_number INTEGER NOT NULL,
    sent_at    INTEGER NOT NULL,
    PRIMARY KEY (user_id, day_number)
  )
`);

export function hasOrgEmailBeenSent(userId, dayNumber) {
  return !!db.prepare(
    "SELECT 1 FROM org_emails WHERE user_id = ? AND day_number = ?"
  ).get(userId, dayNumber);
}

export function recordOrgEmailSent(userId, dayNumber) {
  db.prepare(
    "INSERT OR IGNORE INTO org_emails (user_id, day_number, sent_at) VALUES (?, ?, ?)"
  ).run(userId, dayNumber, Date.now());
}

export function getOrgMembersForEmails() {
  return db.prepare(
    "SELECT * FROM users WHERE user_state = 'org-member-active' AND registered_at IS NOT NULL"
  ).all();
}

// ─── Team dashboard — data model ──────────────────────────────────────────
// TWO STRICT PIPELINES:
//   Pipeline 1 (team layer): energy BANDS only. Never raw scores, never behavioural
//     patterns, never longitudinal data per person.
//   Pipeline 2 (personal companion): full individual data. Never crosses into team layer.
//
// Band calculation thresholds:
//   65%+ = "Naturally present"
//   40-64% = "Intentionally present"
//   <40% = "Developing"
//
// The UI never shows a number — only the band label.
// ──────────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS organisations (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id         TEXT PRIMARY KEY,
    org_id     TEXT NOT NULL,
    name       TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    visibility TEXT DEFAULT 'full_team',
    dashboard_revealed INTEGER DEFAULT 0,
    FOREIGN KEY (org_id) REFERENCES organisations(id)
  )
`);

// Migration: add dashboard_revealed if missing (existing DBs)
try { db.exec("ALTER TABLE teams ADD COLUMN dashboard_revealed INTEGER DEFAULT 0"); } catch(e) { /* already exists */ }

// A user can belong to multiple teams. Role per team.
// Roles: org-admin (all teams in org), team-lead (their teams), member
db.exec(`
  CREATE TABLE IF NOT EXISTS team_members (
    user_id  TEXT NOT NULL,
    team_id  TEXT NOT NULL,
    role     TEXT NOT NULL DEFAULT 'member',
    added_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, team_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
  )
`);

// Pipeline 1 storage: bands only. Raw scores NEVER stored here.
// Each energy is stored as a band label string, never a percentage.
// second_energy = the energy ranked second in the individual profile (label only, no score)
// second_energy_gap = the integer percentage-point gap between ranked[1] and ranked[2]
//   in the individual profile. Used by the constellation to decide whether to show a
//   fluent arc (gap >= 4 = meaningful second energy; below = flat profile, no arc).
//   Storing the gap as a single integer does not constitute a raw score — it is a
//   derived shape signal that the team layer needs to render the constellation
//   correctly. Individual energy percentages remain on users.energy_scores only.
db.exec(`
  CREATE TABLE IF NOT EXISTS team_energy_bands (
    user_id           TEXT NOT NULL,
    team_id           TEXT NOT NULL,
    spark_band        TEXT,
    glow_band         TEXT,
    tend_band         TEXT,
    flow_band         TEXT,
    second_energy     TEXT,
    second_energy_gap INTEGER,
    updated_at        INTEGER NOT NULL,
    PRIMARY KEY (user_id, team_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
  )
`);

// Idempotent migration for existing deployments: add the two new columns if missing.
const tebCols = db.prepare("PRAGMA table_info(team_energy_bands)").all().map(c => c.name);
if (!tebCols.includes("second_energy")) {
  db.exec("ALTER TABLE team_energy_bands ADD COLUMN second_energy TEXT");
}
if (!tebCols.includes("second_energy_gap")) {
  db.exec("ALTER TABLE team_energy_bands ADD COLUMN second_energy_gap INTEGER");
}

// ─── Invitations tracking ─────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS invitations (
    email      TEXT NOT NULL,
    org_id     TEXT NOT NULL,
    team_id    TEXT NOT NULL,
    invited_by TEXT NOT NULL,
    invited_at INTEGER NOT NULL,
    status     TEXT DEFAULT 'invited',
    PRIMARY KEY (email, org_id),
    FOREIGN KEY (org_id) REFERENCES organisations(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
  )
`);

export function recordInvitation(email, orgId, teamId, invitedBy) {
  return db.prepare(
    `INSERT OR REPLACE INTO invitations (email, org_id, team_id, invited_by, invited_at, status)
     VALUES (?, ?, ?, ?, ?, 'invited')`
  ).run(email.toLowerCase().trim(), orgId, teamId, invitedBy, Date.now());
}

export function markInvitationRegistered(email, orgId) {
  return db.prepare(
    "UPDATE invitations SET status = 'registered' WHERE email = ? AND org_id = ?"
  ).run(email.toLowerCase().trim(), orgId);
}

export function getInvitationsForOrg(orgId) {
  return db.prepare(
    "SELECT * FROM invitations WHERE org_id = ? ORDER BY invited_at DESC"
  ).all(orgId);
}

export function getInvitationsForTeam(teamId) {
  return db.prepare(
    "SELECT * FROM invitations WHERE team_id = ? ORDER BY invited_at DESC"
  ).all(teamId);
}

// ─── Band calculation ─────────────────────────────────────────────────────
// Input: raw scores object { spark: N, glow: N, tend: N, flow: N }
// Output: bands object { spark: "label", glow: "label", tend: "label", flow: "label" }
// This function is the ONLY place where raw scores touch the team layer.
// After this, only band labels exist.

// Thresholds for percentage-of-total model (4 energies sum to 100%, baseline = 25% each)
// 33%+ = clearly dominant, 22–32% = present but not leading, <22% = below baseline
const BAND_THRESHOLDS = { high: 33, mid: 22 };
const BAND_LABELS = { high: "Naturally present", mid: "Intentionally present", low: "Developing" };

export function calculateBands(scores) {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  if (total === 0) return { spark: BAND_LABELS.low, glow: BAND_LABELS.low, tend: BAND_LABELS.low, flow: BAND_LABELS.low };
  const bands = {};
  for (const energy of ["spark", "glow", "tend", "flow"]) {
    const pct = Math.round((scores[energy] / total) * 100);
    if (pct >= BAND_THRESHOLDS.high) bands[energy] = BAND_LABELS.high;
    else if (pct >= BAND_THRESHOLDS.mid) bands[energy] = BAND_LABELS.mid;
    else bands[energy] = BAND_LABELS.low;
  }
  return bands;
}

// Compute the second-ranked energy and the percentage-point gap to the third.
// Used at assessment-completion time to feed the constellation's fluent arc logic.
// Excludes the dominant (instinctive) energy so we always return the genuine 2nd.
// Returns { second: "tend"|"glow"|"spark"|"flow"|null, gap: integer }
export function calculateSecondEnergy(scores, dominantEnergy) {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  if (total === 0) return { second: null, gap: 0 };
  const ranked = ["spark", "glow", "tend", "flow"]
    .filter(e => e !== dominantEnergy)
    .map(e => ({ id: e, pct: Math.round((scores[e] / total) * 100) }))
    .sort((a, b) => b.pct - a.pct);
  if (ranked.length < 2) return { second: ranked[0]?.id || null, gap: 0 };
  return { second: ranked[0].id, gap: ranked[0].pct - ranked[1].pct };
}

// ─── Team CRUD ────────────────────────────────────────────────────────────

export function createOrganisation(id, name) {
  return db.prepare(
    "INSERT INTO organisations (id, name, created_at) VALUES (?, ?, ?)"
  ).run(id, name, Date.now());
}

export function getOrganisation(id) {
  return db.prepare("SELECT * FROM organisations WHERE id = ?").get(id);
}

export function createTeam(id, orgId, name) {
  return db.prepare(
    "INSERT INTO teams (id, org_id, name, created_at) VALUES (?, ?, ?, ?)"
  ).run(id, orgId, name, Date.now());
}

export function getTeam(id) {
  return db.prepare("SELECT * FROM teams WHERE id = ?").get(id);
}

export function getTeamsForOrg(orgId) {
  return db.prepare("SELECT * FROM teams WHERE org_id = ? ORDER BY name").all(orgId);
}

export function addTeamMember(userId, teamId, role = "member") {
  return db.prepare(
    "INSERT OR REPLACE INTO team_members (user_id, team_id, role, added_at) VALUES (?, ?, ?, ?)"
  ).run(userId, teamId, role, Date.now());
}

export function getTeamMembers(teamId) {
  return db.prepare(
    `SELECT tm.user_id, tm.role, tm.added_at, u.name, u.email, u.dominant_energy,
            u.assessment_completed_at, u.energy_scores
     FROM team_members tm
     JOIN users u ON u.id = tm.user_id
     WHERE tm.team_id = ?
     ORDER BY u.name`
  ).all(teamId);
}

export function getTeamsForUser(userId) {
  return db.prepare(
    `SELECT t.*, tm.role
     FROM team_members tm
     JOIN teams t ON t.id = tm.team_id
     WHERE tm.user_id = ?
     ORDER BY t.name`
  ).all(userId);
}

export function updateTeamVisibility(teamId, visibility) {
  return db.prepare("UPDATE teams SET visibility = ? WHERE id = ?").run(visibility, teamId);
}

export function revealDashboard(teamId) {
  return db.prepare("UPDATE teams SET dashboard_revealed = 1 WHERE id = ?").run(teamId);
}

// ─── Pipeline 1: team energy bands ────────────────────────────────────────
// Stores band labels derived from scores. Raw scores never touch this table.

// bands: { spark, glow, tend, flow, second, gap }
//   second / gap optional — older callers without raw scores may omit them and
//   the columns will be left null. The constellation falls back gracefully when null.
export function upsertTeamEnergyBands(userId, teamId, bands) {
  return db.prepare(
    `INSERT OR REPLACE INTO team_energy_bands
       (user_id, team_id, spark_band, glow_band, tend_band, flow_band, second_energy, second_energy_gap, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId, teamId,
    bands.spark, bands.glow, bands.tend, bands.flow,
    bands.second || null, (bands.gap == null ? null : bands.gap),
    Date.now()
  );
}

export function getTeamEnergyBands(teamId) {
  return db.prepare(
    `SELECT teb.*, u.name
     FROM team_energy_bands teb
     JOIN users u ON u.id = teb.user_id
     WHERE teb.team_id = ?`
  ).all(teamId);
}

// Aggregate: count of each band per energy for a team
export function getTeamAggregate(teamId) {
  const rows = getTeamEnergyBands(teamId);
  const aggregate = {
    memberCount: rows.length,
    spark: { "Naturally present": 0, "Intentionally present": 0, "Developing": 0 },
    glow:  { "Naturally present": 0, "Intentionally present": 0, "Developing": 0 },
    tend:  { "Naturally present": 0, "Intentionally present": 0, "Developing": 0 },
    flow:  { "Naturally present": 0, "Intentionally present": 0, "Developing": 0 },
  };
  for (const row of rows) {
    if (row.spark_band) aggregate.spark[row.spark_band]++;
    if (row.glow_band)  aggregate.glow[row.glow_band]++;
    if (row.tend_band)  aggregate.tend[row.tend_band]++;
    if (row.flow_band)  aggregate.flow[row.flow_band]++;
  }
  // Suppress behavioural observations below 8 members
  aggregate.observationsEnabled = rows.length >= 8;
  return aggregate;
}

export function removeTeamMember(userId, teamId) {
  db.prepare("DELETE FROM team_energy_bands WHERE user_id = ? AND team_id = ?").run(userId, teamId);
  return db.prepare("DELETE FROM team_members WHERE user_id = ? AND team_id = ?").run(userId, teamId);
}

export function getOrgMembers(orgId) {
  return db.prepare(
    `SELECT u.id, u.name, u.email, u.assessment_completed_at, u.user_state, u.dominant_energy,
            tm.team_id, tm.role, t.name as team_name
     FROM users u
     JOIN team_members tm ON tm.user_id = u.id
     JOIN teams t ON t.id = tm.team_id
     WHERE t.org_id = ?
     ORDER BY u.name`
  ).all(orgId);
}

export function getUserRole(userId, teamId) {
  const row = db.prepare("SELECT role FROM team_members WHERE user_id = ? AND team_id = ?").get(userId, teamId);
  return row ? row.role : null;
}

export function isOrgAdmin(userId, orgId) {
  const row = db.prepare(
    `SELECT tm.role FROM team_members tm
     JOIN teams t ON t.id = tm.team_id
     WHERE tm.user_id = ? AND t.org_id = ? AND tm.role = 'org-admin'
     LIMIT 1`
  ).get(userId, orgId);
  return !!row;
}

// ─── Email change tokens ─────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS email_change_tokens (
    token      TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    new_email  TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    consumed   INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

export function createEmailChangeToken(token, userId, newEmail) {
  return db.prepare(
    "INSERT INTO email_change_tokens (token, user_id, new_email, created_at) VALUES (?, ?, ?, ?)"
  ).run(token, userId, newEmail.toLowerCase().trim(), Date.now());
}

export function getEmailChangeToken(token) {
  return db.prepare(
    "SELECT * FROM email_change_tokens WHERE token = ? AND consumed = 0"
  ).get(token);
}

export function consumeEmailChangeToken(token) {
  return db.prepare("UPDATE email_change_tokens SET consumed = 1 WHERE token = ?").run(token);
}

export function updateUserEmail(userId, newEmail) {
  return db.prepare("UPDATE users SET email = ? WHERE id = ?").run(newEmail.toLowerCase().trim(), userId);
}

// ─── Subscription pause/resume columns ───────────────────────────────────
try { db.exec(`ALTER TABLE users ADD COLUMN subscription_paused_at INTEGER`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN subscription_paused_reason TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN previous_state TEXT`); } catch {}

export function pauseSubscription(userId, reason) {
  return db.prepare(
    "UPDATE users SET subscription_paused_at = ?, subscription_paused_reason = ? WHERE id = ?"
  ).run(Date.now(), reason, userId);
}

export function clearSubscriptionPause(userId) {
  return db.prepare(
    "UPDATE users SET subscription_paused_at = NULL, subscription_paused_reason = NULL WHERE id = ?"
  ).run(userId);
}

// ─── Team notification email (routing preference — Pipeline 3) ─────────────
// Personal email = identity anchor (users.email). Never changes without user action.
// Team notification email = routing preference, set by the user only, never the employer.
// All personal-scope emails use users.email. All team-scope emails use
// team_notification_email (with fallback to personal email when null).
try { db.exec(`ALTER TABLE users ADD COLUMN team_notification_email TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN team_notification_preference TEXT DEFAULT 'personal'`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN team_notification_bounce_count INTEGER DEFAULT 0`); } catch {}

export function updateTeamNotificationEmail(userId, teamEmail, preference) {
  return db.prepare(
    "UPDATE users SET team_notification_email = ?, team_notification_preference = ?, team_notification_bounce_count = 0 WHERE id = ?"
  ).run(teamEmail || null, preference || "personal", userId);
}

export function incrementTeamNotificationBounce(userId) {
  const user = getUser(userId);
  if (!user) return;
  const newCount = (user.team_notification_bounce_count || 0) + 1;
  if (newCount >= 3) {
    // Auto-revert to personal email after 3 bounces
    db.prepare(
      "UPDATE users SET team_notification_email = NULL, team_notification_preference = 'personal', team_notification_bounce_count = 0 WHERE id = ?"
    ).run(userId);
    console.log(`Team notification email auto-reverted for user ${userId} after 3 bounces`);
  } else {
    db.prepare(
      "UPDATE users SET team_notification_bounce_count = ? WHERE id = ?"
    ).run(newCount, userId);
  }
}

// ─── Part B: Team share tokens ────────────────────────────────────────────
// Extends the individual share token pattern to team dashboards.
// Only link tokens (30-day, multi-use) in v1. Session tokens deferred to v2.
db.exec(`
  CREATE TABLE IF NOT EXISTS team_share_tokens (
    token          TEXT PRIMARY KEY,
    team_id        TEXT NOT NULL,
    created_by     TEXT NOT NULL,
    created_at     INTEGER NOT NULL,
    expires_at     INTEGER NOT NULL,
    revoked_at     INTEGER,
    last_accessed_at INTEGER,
    FOREIGN KEY (team_id)    REFERENCES teams(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);

export function createTeamShareToken(teamId, createdBy, expiresAt) {
  const token = uuidv4();
  db.prepare(
    `INSERT INTO team_share_tokens (token, team_id, created_by, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(token, teamId, createdBy, Date.now(), expiresAt);
  return token;
}

export function getTeamShareToken(token) {
  return db.prepare("SELECT * FROM team_share_tokens WHERE token = ?").get(token) || null;
}

export function revokeTeamShareToken(token, userId) {
  return db.prepare(
    "UPDATE team_share_tokens SET revoked_at = ? WHERE token = ? AND created_by = ? AND revoked_at IS NULL"
  ).run(Date.now(), token, userId);
}

export function getActiveTeamShareTokens(teamId) {
  const now = Date.now();
  return db.prepare(
    "SELECT * FROM team_share_tokens WHERE team_id = ? AND revoked_at IS NULL AND expires_at > ? ORDER BY created_at DESC"
  ).all(teamId, now);
}

export function touchTeamShareToken(token) {
  return db.prepare(
    "UPDATE team_share_tokens SET last_accessed_at = ? WHERE token = ?"
  ).run(Date.now(), token);
}

// ─── Part C: Team check-ins — Pipeline 3 ─────────────────────────────────
// Pipeline 3 (team-layer state) is architecturally separate from:
//   Pipeline 1 (team-layer preference — bands, dimensions)
//   Pipeline 2 (personal companion — full individual profile + history)
// Individual check-in responses (team_checkin_responses) are NEVER exposed to
// team leads, org admins, or any role other than the respondent themselves.
// Only aggregated readbacks (cached at close) are shown to the team.

// New columns on teams for check-in configuration
try { db.exec(`ALTER TABLE teams ADD COLUMN checkin_cadence TEXT DEFAULT 'fortnightly'`); } catch {}
try { db.exec(`ALTER TABLE teams ADD COLUMN checkin_timezone TEXT DEFAULT 'Europe/London'`); } catch {}
try { db.exec(`ALTER TABLE teams ADD COLUMN checkin_trigger_time TEXT DEFAULT '15:00'`); } catch {}
try { db.exec(`ALTER TABLE teams ADD COLUMN checkin_min_responses INTEGER DEFAULT 8`); } catch {}
try { db.exec(`ALTER TABLE teams ADD COLUMN checkin_paused INTEGER DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE teams ADD COLUMN checkin_adhoc_count_this_month INTEGER DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE teams ADD COLUMN checkin_adhoc_month TEXT`); } catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS team_checkins (
    id              TEXT PRIMARY KEY,
    team_id         TEXT NOT NULL,
    triggered_by    TEXT,
    context_note    TEXT,
    opened_at       INTEGER NOT NULL,
    closed_at       INTEGER,
    cadence_type    TEXT NOT NULL,
    readback_slot_1 TEXT,
    readback_slot_2 TEXT,
    readback_slot_3 TEXT,
    response_count  INTEGER DEFAULT 0,
    status          TEXT DEFAULT 'open',
    FOREIGN KEY (team_id) REFERENCES teams(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS team_checkin_responses (
    id            TEXT PRIMARY KEY,
    checkin_id    TEXT NOT NULL,
    user_id       TEXT NOT NULL,
    q1_dimensions TEXT NOT NULL,
    q2_landing    TEXT NOT NULL,
    q3_helped     TEXT,
    q4_carrying   TEXT,
    submitted_at  INTEGER NOT NULL,
    UNIQUE (checkin_id, user_id),
    FOREIGN KEY (checkin_id) REFERENCES team_checkins(id),
    FOREIGN KEY (user_id)    REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS team_notification_log (
    id                TEXT PRIMARY KEY,
    team_id           TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    sent_at           INTEGER NOT NULL,
    suppressed        INTEGER DEFAULT 0,
    suppressed_reason TEXT,
    FOREIGN KEY (team_id) REFERENCES teams(id)
  )
`);

// ─── Check-in CRUD ────────────────────────────────────────────────────────

export function createCheckin(teamId, cadenceType, triggeredBy = null, contextNote = null) {
  const id = uuidv4();
  const openedAt = Date.now();
  // Window: ad-hoc = 48h; scheduled = Friday 3pm → Monday 9am (handled by close cron)
  db.prepare(
    `INSERT INTO team_checkins (id, team_id, triggered_by, context_note, opened_at, cadence_type, status)
     VALUES (?, ?, ?, ?, ?, ?, 'open')`
  ).run(id, teamId, triggeredBy, contextNote, openedAt, cadenceType);
  return id;
}

export function getOpenCheckin(teamId) {
  return db.prepare(
    "SELECT * FROM team_checkins WHERE team_id = ? AND status = 'open' ORDER BY opened_at DESC LIMIT 1"
  ).get(teamId);
}

export function getCheckin(checkinId) {
  return db.prepare("SELECT * FROM team_checkins WHERE id = ?").get(checkinId);
}

export function closeCheckin(checkinId, readback1, readback2, readback3, responseCount) {
  return db.prepare(
    `UPDATE team_checkins
     SET status = 'closed', closed_at = ?, readback_slot_1 = ?,
         readback_slot_2 = ?, readback_slot_3 = ?, response_count = ?
     WHERE id = ?`
  ).run(Date.now(), readback1, readback2, readback3, responseCount, checkinId);
}

export function submitCheckinResponse(checkinId, userId, q1Dimensions, q2Landing, q3Helped, q4Carrying) {
  const id = uuidv4();
  db.prepare(
    `INSERT OR REPLACE INTO team_checkin_responses
       (id, checkin_id, user_id, q1_dimensions, q2_landing, q3_helped, q4_carrying, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, checkinId, userId, JSON.stringify(q1Dimensions), q2Landing, q3Helped || null, q4Carrying || null, Date.now());
  // Update cached response count on the parent checkin
  db.prepare(
    "UPDATE team_checkins SET response_count = (SELECT COUNT(*) FROM team_checkin_responses WHERE checkin_id = ?) WHERE id = ?"
  ).run(checkinId, checkinId);
  return id;
}

export function hasUserRespondedToCheckin(checkinId, userId) {
  return !!db.prepare(
    "SELECT 1 FROM team_checkin_responses WHERE checkin_id = ? AND user_id = ?"
  ).get(checkinId, userId);
}

export function getCheckinResponses(checkinId) {
  // Returns aggregated data only — never exposing individual user_id in practice.
  // The user_id is stored for deduplication only.
  return db.prepare(
    "SELECT q1_dimensions, q2_landing FROM team_checkin_responses WHERE checkin_id = ?"
  ).all(checkinId);
}

export function getRecentCheckins(teamId, limit = 6) {
  return db.prepare(
    "SELECT * FROM team_checkins WHERE team_id = ? AND status = 'closed' ORDER BY closed_at DESC LIMIT ?"
  ).all(teamId, limit);
}

export function getOpenCheckins() {
  return db.prepare("SELECT * FROM team_checkins WHERE status = 'open'").all();
}

export function updateCheckinSettings(teamId, cadence, timezone, triggerTime) {
  return db.prepare(
    "UPDATE teams SET checkin_cadence = ?, checkin_timezone = ?, checkin_trigger_time = ? WHERE id = ?"
  ).run(cadence, timezone, triggerTime, teamId);
}

export function pauseNextCheckin(teamId) {
  return db.prepare("UPDATE teams SET checkin_paused = 1 WHERE id = ?").run(teamId);
}

export function clearCheckinPause(teamId) {
  return db.prepare("UPDATE teams SET checkin_paused = 0 WHERE id = ?").run(teamId);
}

// Track ad-hoc check-in count per month (soft cap: 4/month)
export function incrementAdHocCount(teamId) {
  const team = getTeam(teamId);
  if (!team) return 0;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const currentMonth = team.checkin_adhoc_month;
  const currentCount = currentMonth === thisMonth ? (team.checkin_adhoc_count_this_month || 0) : 0;
  const newCount = currentCount + 1;
  db.prepare(
    "UPDATE teams SET checkin_adhoc_count_this_month = ?, checkin_adhoc_month = ? WHERE id = ?"
  ).run(newCount, thisMonth, teamId);
  return newCount;
}

export function logTeamNotification(teamId, type, suppressed = false, reason = null) {
  return db.prepare(
    "INSERT INTO team_notification_log (id, team_id, notification_type, sent_at, suppressed, suppressed_reason) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(uuidv4(), teamId, type, Date.now(), suppressed ? 1 : 0, reason);
}

export function hasNotificationBeenSent(teamId, type, sinceMs) {
  return !!db.prepare(
    "SELECT 1 FROM team_notification_log WHERE team_id = ? AND notification_type = ? AND sent_at > ? AND suppressed = 0"
  ).get(teamId, type, sinceMs);
}

export default db;
