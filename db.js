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

export function updateUserState(id, user_state) {
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
  // Send daily emails to subscribers, org members, and legacy beta users (null state)
  return db.prepare(
    "SELECT * FROM users WHERE assessment_completed_at IS NOT NULL AND (user_state IN ('individual-subscriber', 'org-member-active') OR user_state IS NULL)"
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

export default db;
