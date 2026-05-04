// Run with: node --test readback.test.js
//
// Covers the readback engine helpers — describeTeamShape, extractThemesFromFreeText,
// runReadbackPostCheck, topDimensionsByFrequency, q1ByEnergyCounts, q2Distribution,
// parseReadbackJSON, and a sanity check that the insufficient-confidence fallback
// itself passes the post-check (it's the official fallback — it must be valid).
//
// No LLM calls are made. These are pure-logic tests covering the boundary cases
// the readback engine relies on.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  describeTeamShape,
  extractThemesFromFreeText,
  runReadbackPostCheck,
  topDimensionsByFrequency,
  q1ByEnergyCounts,
  q2Distribution,
  parseReadbackJSON,
  INSUFFICIENT_CONFIDENCE_READBACK,
  PATTERN_LIBRARY,
  buildReadbackUserMessage,
  buildReadbackSystemPrompt,
  READBACK_VOICE_RULES,
} from "./readback.js";

const aggregateOf = (counts) => ({
  memberCount: counts.memberCount,
  spark: counts.spark,
  glow:  counts.glow,
  tend:  counts.tend,
  flow:  counts.flow,
});

const bands = (n, i, d) => ({
  "Naturally present": n,
  "Intentionally present": i,
  "Developing": d,
});

// ─── describeTeamShape ───────────────────────────────────────────────────────

test("describeTeamShape: empty/no member team is balanced", () => {
  assert.deepEqual(
    describeTeamShape({ memberCount: 0, spark: bands(0,0,0), glow: bands(0,0,0), tend: bands(0,0,0), flow: bands(0,0,0) }),
    { wellRepresented: [], thin: [], absent: [], developing: [], balanced: true }
  );
  assert.deepEqual(
    describeTeamShape(null),
    { wellRepresented: [], thin: [], absent: [], developing: [], balanced: true }
  );
});

test("describeTeamShape: well-represented and absent energies are detected", () => {
  // 6-member team. Spark naturally present in 3 (50%), Glow in 0 (absent),
  // Tend in 1 (~17% — thin), Flow in 4 (66% — well-represented).
  const shape = describeTeamShape(aggregateOf({
    memberCount: 6,
    spark: bands(3, 2, 1),
    glow:  bands(0, 2, 4),
    tend:  bands(1, 3, 2),
    flow:  bands(4, 1, 1),
  }));
  assert.ok(shape.wellRepresented.includes("spark"));
  assert.ok(shape.wellRepresented.includes("flow"));
  assert.ok(shape.absent.includes("glow"));
  assert.ok(shape.thin.includes("tend"));
  assert.equal(shape.balanced, false);
});

test("describeTeamShape: developing-band detection (≥40% in Developing)", () => {
  const shape = describeTeamShape(aggregateOf({
    memberCount: 5,
    spark: bands(2, 2, 1),
    glow:  bands(0, 2, 3), // 60% Developing
    tend:  bands(1, 2, 2), // 40% Developing
    flow:  bands(3, 1, 1),
  }));
  assert.ok(shape.developing.includes("glow"));
  assert.ok(shape.developing.includes("tend"));
  assert.equal(shape.developing.includes("spark"), false);
});

// ─── extractThemesFromFreeText ───────────────────────────────────────────────

test("extractThemesFromFreeText: returns null when nothing substantive", () => {
  assert.equal(extractThemesFromFreeText([]), null);
  assert.equal(extractThemesFromFreeText([null, "", "  ", "n/a", "none", "no", "."]), null);
  assert.equal(extractThemesFromFreeText([null, undefined]), null);
  assert.equal(extractThemesFromFreeText(null), null);
});

test("extractThemesFromFreeText: filters short responses and dedupes near-identical text", () => {
  const out = extractThemesFromFreeText([
    "short",                                  // <10 chars — dropped
    "A quick chat with my colleague helped",  // kept
    "a quick chat with my colleague helped",  // dedupe (case-insensitive)
    "Smaller meetings worked better today",   // kept
    "n/a",                                    // dropped
  ]);
  assert.equal(out.length, 2);
  assert.ok(out[0].toLowerCase().includes("quick chat"));
  assert.ok(out[1].toLowerCase().includes("smaller meetings"));
});

// ─── topDimensionsByFrequency / q1ByEnergyCounts / q2Distribution ────────────

const sampleResponses = [
  { q1_dimensions: '["decision","momentum","reflection"]', q2_landing: "lighter" },
  { q1_dimensions: '["decision","communication"]',         q2_landing: "expected" },
  { q1_dimensions: '["momentum","reflection"]',            q2_landing: "lighter" },
  { q1_dimensions: '["communication"]',                    q2_landing: "heavier" },
  { q1_dimensions: '["decision","reflection"]',            q2_landing: "expected" },
  { q1_dimensions: '["wellbeing"]',                        q2_landing: "lighter" },
];

test("topDimensionsByFrequency: ranks by frequency, includes energy tag", () => {
  const top = topDimensionsByFrequency(sampleResponses, 3);
  assert.equal(top[0].key, "decision");
  assert.equal(top[0].count, 3);
  assert.equal(top[0].energy, "spark");
  assert.equal(top[1].key, "reflection");
  assert.equal(top[1].count, 3);
  assert.equal(top[1].energy, "flow");
});

test("q1ByEnergyCounts: counts the union of all selected keys", () => {
  // decision×3 + momentum×2 = 5 spark; communication×2 = 2 glow; wellbeing×1 = 1 tend; reflection×3 = 3 flow.
  assert.deepEqual(
    q1ByEnergyCounts(sampleResponses),
    { spark: 5, glow: 2, tend: 1, flow: 3 }
  );
});

test("q1ByEnergyCounts: handles malformed JSON gracefully", () => {
  const out = q1ByEnergyCounts([{ q1_dimensions: "not json", q2_landing: "expected" }]);
  assert.deepEqual(out, { spark: 0, glow: 0, tend: 0, flow: 0 });
});

test("q2Distribution: percentages sum to ~100", () => {
  const d = q2Distribution(sampleResponses);
  // 3 lighter, 2 expected, 1 heavier, 0 unsure → 50/33/17/0
  assert.equal(d.lighter, 50);
  assert.equal(d.expected, 33);
  assert.equal(d.heavier, 17);
  assert.equal(d.unsure, 0);
});

test("q2Distribution: empty responses returns all zeroes", () => {
  assert.deepEqual(
    q2Distribution([]),
    { heavier: 0, expected: 0, lighter: 0, unsure: 0 }
  );
});

// ─── parseReadbackJSON ───────────────────────────────────────────────────────

test("parseReadbackJSON: parses bare JSON", () => {
  const out = parseReadbackJSON('{"reading":"x","question":"?"}');
  assert.equal(out.reading, "x");
});

test("parseReadbackJSON: strips ```json fences", () => {
  const out = parseReadbackJSON('```json\n{"a":1}\n```');
  assert.deepEqual(out, { a: 1 });
});

test("parseReadbackJSON: tolerates leading/trailing text", () => {
  const out = parseReadbackJSON('Here is the readback: {"a":1}\n\nThanks.');
  assert.deepEqual(out, { a: 1 });
});

test("parseReadbackJSON: returns null on garbage", () => {
  assert.equal(parseReadbackJSON("not even close"), null);
  assert.equal(parseReadbackJSON(""), null);
  assert.equal(parseReadbackJSON(null), null);
});

// ─── runReadbackPostCheck ────────────────────────────────────────────────────

const validReadback = {
  reading:
    "Spark carried the cycle. Decision and Momentum came up most often, with Courage close behind — the dimensions that show up when something needs to be moved. Two-thirds of the team experienced the cycle as heavier than expected.\n\nFor a team where Tend is naturally present in most members, the absence of trust, accountability or wellbeing in the responses suggests something else was demanding attention.",
  threads: null,
  question: "What did the team have to put down to keep moving on the things that came up?",
  confidence: "moderate",
  claims: [
    { claim: "Spark carried the cycle.", anchor: "Decision×6, Momentum×5, Courage×3 across 9 responses." },
    { claim: "Two-thirds experienced the cycle as heavier.", anchor: "Q2: 67% heavier, 22% expected, 11% lighter." },
  ],
  notes_for_lead: null,
};

test("runReadbackPostCheck: a valid readback passes", () => {
  const r = runReadbackPostCheck(validReadback);
  assert.equal(r.passed, true, `failures: ${r.failures?.join("; ")}`);
});

test("runReadbackPostCheck: insufficient-confidence fallback passes", () => {
  const r = runReadbackPostCheck(INSUFFICIENT_CONFIDENCE_READBACK);
  assert.equal(r.passed, true, `fallback must pass own post-check: ${r.failures?.join("; ")}`);
});

test("runReadbackPostCheck: missing reading fails", () => {
  const r = runReadbackPostCheck({ ...validReadback, reading: "" });
  assert.equal(r.passed, false);
});

test("runReadbackPostCheck: invalid confidence fails", () => {
  const r = runReadbackPostCheck({ ...validReadback, confidence: "great" });
  assert.equal(r.passed, false);
});

test("runReadbackPostCheck: question must be a single sentence ending in '?'", () => {
  const r1 = runReadbackPostCheck({ ...validReadback, question: "What's the team to do? Or not?" });
  assert.equal(r1.passed, false);
  const r2 = runReadbackPostCheck({ ...validReadback, question: "The team should reflect." });
  assert.equal(r2.passed, false);
});

test("runReadbackPostCheck: banned coach-speak phrase fails", () => {
  const bad = { ...validReadback, reading: validReadback.reading + " It's worth sitting with that." };
  const r = runReadbackPostCheck(bad);
  assert.equal(r.passed, false);
  assert.ok(r.failures.some(f => /banned/i.test(f)), `expected banned-phrase failure, got: ${r.failures}`);
});

test("runReadbackPostCheck: first-person attribution fails", () => {
  const bad = { ...validReadback, reading: "One member mentioned the meeting was hard." };
  const r = runReadbackPostCheck(bad);
  assert.equal(r.passed, false);
});

test('runReadbackPostCheck: the word "data" in member-facing copy fails', () => {
  const bad = { ...validReadback, reading: "The data shows the team reached for Spark." };
  const r = runReadbackPostCheck(bad);
  assert.equal(r.passed, false);
});

test("runReadbackPostCheck: claims missing anchors fail", () => {
  const bad = { ...validReadback, claims: [{ claim: "Spark carried the cycle.", anchor: "" }] };
  const r = runReadbackPostCheck(bad);
  assert.equal(r.passed, false);
});

test("runReadbackPostCheck: reading too long fails", () => {
  const bad = { ...validReadback, reading: "a".repeat(1300) };
  const r = runReadbackPostCheck(bad);
  assert.equal(r.passed, false);
  assert.ok(r.failures.some(f => /reading too long/.test(f)));
});

test("runReadbackPostCheck: 'This isn't X. It's Y.' construction fails", () => {
  const bad = { ...validReadback, reading: "This isn't a Spark cycle. It's a Tend one." };
  const r = runReadbackPostCheck(bad);
  assert.equal(r.passed, false);
});

// ─── prompt assembly sanity checks ───────────────────────────────────────────

test("buildReadbackSystemPrompt: includes voice rules and pattern library", () => {
  const sp = buildReadbackSystemPrompt("FAKE_HUE_VOICE_RULES", "TCMG");
  assert.ok(sp.includes("FAKE_HUE_VOICE_RULES"));
  assert.ok(sp.includes("READBACK_VOICE_RULES") || sp.includes("Readback-specific rules"));
  assert.ok(sp.includes("TCMG"));
  // Each pattern name appears once in the rendered library
  for (const p of PATTERN_LIBRARY) {
    assert.ok(sp.includes(p.name), `pattern ${p.name} missing from system prompt`);
  }
  // Output schema is included
  assert.ok(sp.includes('"reading":'));
  assert.ok(sp.includes('"confidence":'));
});

test("buildReadbackUserMessage: renders all four energies and Q2 distribution", () => {
  const msg = buildReadbackUserMessage({
    team: {
      name: "TCMG",
      memberCount: 6,
      energyDistribution: {
        spark: bands(3, 2, 1),
        glow:  bands(1, 2, 3),
        tend:  bands(0, 4, 2),
        flow:  bands(2, 2, 2),
      },
      teamShape: { wellRepresented: ["spark"], thin: ["glow"], absent: [], developing: ["tend"], balanced: false },
    },
    cycle: {
      responseCount: 6, threshold: 6,
      q1ByEnergy: { spark: 5, glow: 2, tend: 0, flow: 3 },
      q1Top: [{ key: "decision", label: "Decision", energy: "spark", count: 3 }],
      q1EnergiesPresent: ["spark", "glow", "flow"],
      q1EnergiesAbsent: ["tend"],
      q2Distribution: { heavier: 17, expected: 33, lighter: 50, unsure: 0 },
      q3Themes: ["A quick chat helped"],
      q4Themes: null,
    },
    previousReadback: null,
  });
  assert.ok(msg.includes("Members: 6"));
  assert.ok(msg.includes("Decision (spark): 3"));
  assert.ok(msg.includes("Lighter than expected: 50%"));
  assert.ok(msg.includes("A quick chat helped"));
  assert.ok(msg.includes("(no substantive responses)"));
});

test("READBACK_VOICE_RULES is non-empty and contains the anonymity rule", () => {
  assert.ok(READBACK_VOICE_RULES.length > 200);
  assert.ok(/anonymised|anonymity|anonymise|individual member/i.test(READBACK_VOICE_RULES));
});

// ─── Pattern library shape ──────────────────────────────────────────────────

test("PATTERN_LIBRARY: every pattern has the required fields", () => {
  assert.ok(PATTERN_LIBRARY.length >= 20, `expected ≥20 patterns, got ${PATTERN_LIBRARY.length}`);
  const names = new Set();
  for (const p of PATTERN_LIBRARY) {
    assert.ok(p.name && typeof p.name === "string", "name missing");
    assert.ok(p.look_for && typeof p.look_for === "string", `look_for missing for ${p.name}`);
    assert.ok(p.interpret && typeof p.interpret === "string", `interpret missing for ${p.name}`);
    assert.ok(p.example != null, `example missing for ${p.name}`);
    assert.ok(!names.has(p.name), `duplicate pattern name: ${p.name}`);
    names.add(p.name);
  }
});
