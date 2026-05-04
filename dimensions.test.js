// Run with: node --test dimensions.test.js
//
// Basic tests for dimensions.js — covers the helpers that the readback
// engine (item 2.4) depends on. Built on Node's built-in test runner so the
// project doesn't need a test framework yet.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DIMENSIONS,
  DIMENSIONS_BY_ENERGY,
  DIMENSION_KEYS,
  ENERGY_IDS,
  getDimension,
  getDimensionEnergy,
  groupDimensionsByEnergy,
} from "./dimensions.js";

test("DIMENSIONS has 32 entries", () => {
  assert.equal(DIMENSIONS.length, 32);
});

test("DIMENSIONS_BY_ENERGY has 8 dimensions per energy", () => {
  for (const e of ENERGY_IDS) {
    assert.equal(DIMENSIONS_BY_ENERGY[e].length, 8, `${e} should have 8 dimensions`);
  }
});

test("DIMENSION_KEYS contains every key in DIMENSIONS", () => {
  assert.equal(DIMENSION_KEYS.size, 32);
  for (const d of DIMENSIONS) {
    assert.ok(DIMENSION_KEYS.has(d.key), `key ${d.key} missing from DIMENSION_KEYS`);
  }
});

test("getDimensionEnergy returns the right energy for each dimension", () => {
  for (const d of DIMENSIONS) {
    assert.equal(getDimensionEnergy(d.key), d.energy);
  }
});

test("getDimensionEnergy returns null for unknown keys", () => {
  assert.equal(getDimensionEnergy("nonexistent_key"), null);
  assert.equal(getDimensionEnergy(""), null);
  assert.equal(getDimensionEnergy(null), null);
});

test("getDimension returns the full object for known keys", () => {
  const decision = getDimension("decision");
  assert.equal(decision?.label, "Decision");
  assert.equal(decision?.energy, "spark");
});

test("getDimension returns null for unknown keys", () => {
  assert.equal(getDimension("nonexistent_key"), null);
});

test("groupDimensionsByEnergy counts simple cases", () => {
  const counts = groupDimensionsByEnergy(["decision", "momentum", "collaboration"]);
  assert.deepEqual(counts, { spark: 2, glow: 1, tend: 0, flow: 0 });
});

test("groupDimensionsByEnergy counts duplicates (the union across respondents)", () => {
  const counts = groupDimensionsByEnergy([
    "decision", "decision", "momentum", "trust", "trust", "trust",
  ]);
  assert.deepEqual(counts, { spark: 3, glow: 0, tend: 3, flow: 0 });
});

test("groupDimensionsByEnergy handles all four energies", () => {
  const counts = groupDimensionsByEnergy([
    "decision",      // spark
    "communication", // glow
    "trust",         // tend
    "reflection",    // flow
  ]);
  assert.deepEqual(counts, { spark: 1, glow: 1, tend: 1, flow: 1 });
});

test("groupDimensionsByEnergy skips unknown keys silently", () => {
  const counts = groupDimensionsByEnergy(["decision", "nonsense", "trust"]);
  assert.deepEqual(counts, { spark: 1, glow: 0, tend: 1, flow: 0 });
});

test("groupDimensionsByEnergy handles empty / non-array input", () => {
  assert.deepEqual(
    groupDimensionsByEnergy([]),
    { spark: 0, glow: 0, tend: 0, flow: 0 }
  );
  assert.deepEqual(
    groupDimensionsByEnergy(null),
    { spark: 0, glow: 0, tend: 0, flow: 0 }
  );
  assert.deepEqual(
    groupDimensionsByEnergy(undefined),
    { spark: 0, glow: 0, tend: 0, flow: 0 }
  );
});
