// ─── Canonical dimension-to-energy map (single source of truth) ──────────────
//
// 32 Functional Dimensions, each tagged with exactly one primary energy.
// `checkin-dimensions.json` is the underlying data file; this module loads it,
// validates the shape, and exposes the data + helpers for both server and
// client consumers.
//
// Server: import from "./dimensions.js" directly.
// Client: GET /api/dimensions returns the same `DIMENSIONS` array — do NOT
// redeclare the dimension list anywhere on the client.
//
// To change a label or energy assignment: edit checkin-dimensions.json and
// restart the server. Do not edit DIMENSIONS_32 (or any equivalent) in
// public/hue.html — it is populated at runtime from this module's API.
//
// Source documents: team-checkin-readback-redesign-v1.md, Code instruction
// item 2.1 (4 May 2026).

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const ENERGY_IDS = ["spark", "glow", "tend", "flow"];

export const DIMENSIONS = JSON.parse(
  readFileSync(join(__dirname, "checkin-dimensions.json"), "utf8")
);

// Energy-keyed object — each value is an array of dimension objects sorted by
// sortOrder. Used by the readback prompt assembly (Q1 grouped by energy) and
// the team dashboard's 32-dimension panel.
export const DIMENSIONS_BY_ENERGY = ENERGY_IDS.reduce((acc, e) => {
  acc[e] = DIMENSIONS
    .filter(d => d.energy === e)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return acc;
}, {});

const DIMENSION_BY_KEY = new Map(DIMENSIONS.map(d => [d.key, d]));

// Set of valid dimension keys, for fast membership checks (response validation).
export const DIMENSION_KEYS = new Set(DIMENSIONS.map(d => d.key));

// Returns the energy ('spark'|'glow'|'tend'|'flow') for a dimension key, or
// null if the key is unknown.
export function getDimensionEnergy(key) {
  const d = DIMENSION_BY_KEY.get(key);
  return d ? d.energy : null;
}

// Returns the full dimension object for a key, or null if unknown.
export function getDimension(key) {
  return DIMENSION_BY_KEY.get(key) || null;
}

// Takes an array of dimension keys (typically the union of all keys selected
// by all respondents in a single check-in cycle, with duplicates) and returns
// a count grouped by energy. Unknown keys are skipped silently — validation
// of input keys is the caller's job (the response endpoint already does this
// at submission time).
//
// Example: groupDimensionsByEnergy(['decision', 'momentum', 'collaboration'])
//   → { spark: 2, glow: 1, tend: 0, flow: 0 }
export function groupDimensionsByEnergy(keys) {
  const counts = { spark: 0, glow: 0, tend: 0, flow: 0 };
  if (!Array.isArray(keys)) return counts;
  for (const key of keys) {
    const energy = getDimensionEnergy(key);
    if (energy) counts[energy]++;
  }
  return counts;
}

// ─── Load-time shape validation ──────────────────────────────────────────────
// Fail fast if checkin-dimensions.json drifts from the expected shape. The
// server boots before the cron fires, so catching a malformed dimensions file
// here is much better than discovering it inside a check-in close on Monday
// 09:00.

(function assertDimensionShape() {
  if (!Array.isArray(DIMENSIONS) || DIMENSIONS.length !== 32) {
    throw new Error(
      `dimensions.js: expected 32 dimensions, found ${DIMENSIONS.length}`
    );
  }
  const seenKeys = new Set();
  for (const d of DIMENSIONS) {
    if (!d || typeof d !== "object") {
      throw new Error(`dimensions.js: malformed entry ${JSON.stringify(d)}`);
    }
    if (!d.key || typeof d.key !== "string") {
      throw new Error(`dimensions.js: missing key in ${JSON.stringify(d)}`);
    }
    if (!d.label || typeof d.label !== "string") {
      throw new Error(`dimensions.js: missing label for ${d.key}`);
    }
    if (!ENERGY_IDS.includes(d.energy)) {
      throw new Error(
        `dimensions.js: invalid energy "${d.energy}" for ${d.key}`
      );
    }
    if (seenKeys.has(d.key)) {
      throw new Error(`dimensions.js: duplicate key ${d.key}`);
    }
    seenKeys.add(d.key);
  }
  for (const e of ENERGY_IDS) {
    const count = DIMENSIONS_BY_ENERGY[e].length;
    if (count !== 8) {
      throw new Error(
        `dimensions.js: expected 8 dimensions for ${e}, found ${count}`
      );
    }
  }
})();
