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
db.exec(`
  CREATE TABLE IF NOT EXISTS team_energy_bands (
    user_id    TEXT NOT NULL,
    team_id    TEXT NOT NULL,
    spark_band TEXT,
    glow_band  TEXT,
    tend_band  TEXT,
    flow_band  TEXT,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, team_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
  )
`);

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
    `SELECT tm.user_id, tm.role, tm.added_at, u.name, u.email
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

export function upsertTeamEnergyBands(userId, teamId, bands) {
  return db.prepare(
    `INSERT OR REPLACE INTO team_energy_bands (user_id, team_id, spark_band, glow_band, tend_band, flow_band, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(userId, teamId, bands.spark, bands.glow, bands.tend, bands.flow, Date.now());
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

export default db;
