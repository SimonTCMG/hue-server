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
    last_email_sent_at      INTEGER
  )
`);

export function getUser(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

export function getUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

export function createUser({ id, name, email, registered_at }) {
  return db.prepare(
    "INSERT INTO users (id, name, email, registered_at) VALUES (@id, @name, @email, @registered_at)"
  ).run({ id, name, email, registered_at });
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
  return db.prepare("SELECT * FROM users WHERE assessment_completed_at IS NOT NULL").all();
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

export default db;
