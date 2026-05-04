// ─── Team check-in readback: voice rules, pattern library, and helpers ──────
//
// Composed alongside HUE_VOICE_RULES (server.js) — the readback system prompt
// is assembled as: HUE_VOICE_RULES + READBACK_VOICE_RULES + task framing +
// PATTERN_LIBRARY + few-shot examples + output schema.
//
// READBACK_VOICE_RULES carries the rules specific to the team-facing observation
// pass: anonymity, anti-coach-speak, no advice without anchor, no false
// positivity. The base voice (autonomy, reserved words, banned phrases,
// life-domain neutrality) is owned by HUE_VOICE_RULES and inherited via
// composition — do not duplicate those rules here.
//
// This module is pure logic — no DB calls, no network calls. The orchestrator
// (`generateReadback` in server.js) handles those and uses the helpers below.
//
// Source documents: team-checkin-readback-redesign-v1.md, Code instruction
// items 2.3, 2.5, 2.6, 2.7, 2.8 (4 May 2026).

import {
  ENERGY_IDS,
  DIMENSIONS_BY_ENERGY,
  getDimension,
  groupDimensionsByEnergy,
} from "./dimensions.js";

// ─── 2.3: Voice rules ────────────────────────────────────────────────────────

export const READBACK_VOICE_RULES = `## Readback-specific rules (in addition to HUE_VOICE_RULES)

- Never name an individual member or attribute a response to one person. The data you receive is anonymised; your output must keep it that way. Banned phrasings include "one member", "someone said", "one person mentioned", "a team member noted", and any near-equivalent.
- Never write coach-speak. Specifically banned phrases (do not produce these or close variants): "sit with", "sitting with", "hold space", "holding space", "the team picture", "averaging away", "worth noticing" (without saying what about it is worth anything), "worth sitting with", "lands", "lean into", "showing up" (in the inspirational sense).
- Never give advice unless the data clearly supports it. The readback's job is observation, not prescription. If the data points at something to consider, frame it as a question for the team to answer — not as instruction.
- Never produce false positivity. If the data is thin, divergent, or unclear, say so plainly. A short honest readback is better than a padded encouraging one.
- Plain English throughout. No abstractions where concrete words exist.
- Never claim a pattern that isn't anchored in specific data points. Every substantive statement in the reading must cite the data that supports it (the output schema's \`claims\` array enforces this — see the schema below).
- Never use the word "data" in member-facing copy (the reading, threads, or question). Lead-only notes may use it.
- The reading is at most three short paragraphs. The threads section, if present, is at most one paragraph. The question is one sentence.
- Use British English spelling and idiom throughout. The team is UK-based.`;

// ─── 2.7: Pattern library — 20 grounded observation patterns ─────────────────
//
// Anchors for what the LLM should look for, NOT phrases to reproduce. The
// model writes the prose; the library tells it where to look. Multiple
// patterns may apply to a single cycle — that's normal.
//
// Source: drafted by Claude 4 May 2026 alongside the build instruction.
// Refined against real readback output across the first 1–2 cycles of the
// new engine (first cycle: Friday 8 May 2026).

export const PATTERN_LIBRARY = [
  // ── Energy distribution patterns ─────────────────────────────────────────

  {
    name: "energy_concentration",
    look_for: "60% or more of selected dimensions cluster in a single energy.",
    interpret: "The team's attention this week sat heavily in one energy. Name which energy, name which dimensions, and ask what the week was asking for. Don't characterise the energy — just name where attention went.",
    example: "Most of the dimensions that came up this week sit in Spark — Decision, Momentum, and Courage. Whatever was happening, it asked the team to act.",
  },
  {
    name: "energy_absence",
    look_for: "One of the four energies received zero selections in Q1.",
    interpret: "This is almost always the most concrete observation in a readback. Name the energy that's missing, name what's in it (the dimensions that didn't come up). If it's an energy the team is well-represented in, that's especially worth surfacing.",
    example: "Tend didn't appear in any response this week. None of trust, accountability, consistency, commitment, wellbeing, or memory came up — for a team where Tend is naturally present in most members, that's the most concrete thing about this week's picture.",
  },
  {
    name: "team_strong_energy_missing",
    look_for: "An energy where most of the team has 'Naturally present' band did not appear in Q1 dimensions.",
    interpret: "Significant. The team didn't reach for what they normally would. Pose the question rather than answering it: was that energy not needed this week, or did it not get reached for?",
    example: "Glow is naturally present across most of the team, but none of its dimensions appeared this week. That's worth holding alongside the question of whether the week left room for it.",
  },
  {
    name: "team_developing_energy_present",
    look_for: "An energy where most of the team is in 'Developing' band appeared in Q1 dimensions.",
    interpret: "Worth noticing — the team reached for something less natural to them. Name what specifically came up. Suggests the week pulled the team into territory they don't usually occupy.",
    example: "Flow is mostly Developing across the team, but Reflection, Clarity, and Planning all came up this week. The team reached for something that doesn't always come naturally.",
  },
  {
    name: "all_four_energies_present",
    look_for: "All four energies represented in Q1 selections, no single energy carrying a majority.",
    interpret: "Describes a week that asked for the team's full range. Don't valorise it ('great range!'); just name it. Worth pairing with the team profile — if the team is well-represented across all four, this looks like normal range; if not, the team flexed.",
    example: "All four energies appeared in this week's responses — Decision (Spark), Communication (Glow), Trust (Tend), and Reflection (Flow). The week asked for the team's full range.",
  },
  {
    name: "two_energies_dominant",
    look_for: "Two energies account for ≥75% of Q1 selections, the other two are thin or absent.",
    interpret: "The week sat in a particular pair of energies. Name the pair. If the pair maps to the team's two strongest energies, the team played to type. If not, name that.",
    example: "Spark and Flow accounted for most of this week's responses. Decision, Momentum, and Reflection all came up — action and analysis, with less weight on connection or steadiness.",
  },
  {
    name: "energy_scatter_with_size",
    look_for: "Q1 dimensions span 3+ energies AND response count is ≤ 8.",
    interpret: "With a small team and dimensions spread across most of the energies, the readback should describe what was reported but not over-claim a 'team picture'. Name the spread. Acknowledge the size. Don't pretend to a unified reading.",
    example: "Six responses, three energies represented — Momentum, Communication, Reflection. With this much spread across this small a team, the readback is describing what was reported, not a shared experience.",
  },

  // ── Q2 (felt experience) patterns ─────────────────────────────────────────

  {
    name: "q2_clear_majority",
    look_for: "60% or more of Q2 responses fell into a single category (heavier / expected / lighter / unsure).",
    interpret: "The team had a recognisable shared experience of the week. Name it accurately — 'the week ran heavier than expected for most of the team' or 'most of the team experienced the week as lighter than expected'. Avoid celebratory framing; this is observation, not cheerleading.",
    example: "Most of the team experienced the week as lighter than expected. Whatever was happening, it landed with less weight than the team had braced for.",
  },
  {
    name: "q2_split_evenly",
    look_for: "No Q2 category exceeds 50%; the four categories are spread.",
    interpret: "The team experienced the week differently. Don't say 'the team didn't share a week' — that's judgemental. Say something like 'the week was a different shape for different parts of the team'. If Q1 also scattered, the patterns may track each other.",
    example: "Half the team experienced the week as lighter than expected and a third as expected, with one response heavier. The week didn't have a single shape across the team.",
  },
  {
    name: "q2_lighter_with_unsure",
    look_for: "≥50% lighter AND ≥10% unsure.",
    interpret: "Most found it lighter, but some couldn't read the week. The unsure response may be the more interesting signal — surface it without speculating about why.",
    example: "Half the team experienced the week as lighter than expected, but at least one response was unsure how to read it — which can be its own kind of signal.",
  },
  {
    name: "q2_heavier_majority",
    look_for: "≥50% heavier than expected.",
    interpret: "The week asked more than anticipated. Pair this with Q1 to name what kind of more — Decision-heavy week reads differently from a Wellbeing-heavy week.",
    example: "Most of the team experienced the week as heavier than expected. Decision and Challenge came up most often — the week asked for action under pressure.",
  },
  {
    name: "q2_high_unsure",
    look_for: "≥30% of Q2 responses are 'unsure'.",
    interpret: "Hard-to-read week. The unsure response itself is a signal — don't treat it as a missing answer. Pair with Q1: was attention scattered? Were Q3/Q4 thin?",
    example: "A meaningful share of responses couldn't read the week confidently. Combined with the dimensions that came up, this looks like a week the team is still making sense of.",
  },

  // ── Cross-question patterns ───────────────────────────────────────────────

  {
    name: "q2_split_with_q1_scatter",
    look_for: "Q2 spread across 3+ categories AND Q1 dimensions spread across 3+ energies.",
    interpret: "Both the felt experience and the focus of attention scattered. Name them together — they often track each other. Different parts of the team noticed different things and felt the week differently.",
    example: "Q1 attention spread across three energies, and the week was a different shape for different parts of the team. The two patterns probably track each other.",
  },
  {
    name: "q2_clear_q1_scattered",
    look_for: "Q2 has clear majority (≥60%) AND Q1 dimensions spread across 3+ energies.",
    interpret: "The team agreed on how the week felt but not on what was carrying it. Worth surfacing — usually means the week's tone was shared but the contents were different for different people.",
    example: "Most of the team experienced the week as lighter than expected, even though the dimensions that came up spanned Spark, Glow, and Flow. A shared sense of how the week felt, despite different focuses.",
  },
  {
    name: "q1_clear_q2_scattered",
    look_for: "Q1 dimensions concentrated in 1-2 energies (≥60%) AND Q2 has no majority.",
    interpret: "The team agreed on what the week was about but felt it differently. Name the agreement and the divergence as two facts. Don't speculate about why.",
    example: "Decision and Momentum came up across most of the team — but how the week felt varied. The same focus produced different felt experiences.",
  },
  {
    name: "q3_q4_thin",
    look_for: "Q3 and Q4 produced little substance — most responses empty, very short, or generic.",
    interpret: "Don't pad. Omit the threads section entirely (set threads to null). The reading does the work alone. Don't draw attention to the absence — just don't write anything that requires content that isn't there.",
    example: "(threads section: null)",
  },
  {
    name: "q3_recurring_theme",
    look_for: "Two or more Q3 responses mention a similar concrete element (a kind of activity, a kind of person, a kind of moment).",
    interpret: "Surface as a theme. Anonymise. Describe the theme in the team's own register — don't formalise it. Two or more is the floor; one alone is never surfaced.",
    example: "What helped, across multiple responses, often involved smaller and more specific conversations rather than larger group settings.",
  },
  {
    name: "q3_contradicts_q2",
    look_for: "What people described as helpful in Q3 doesn't match the felt experience reported in Q2.",
    interpret: "Worth surfacing carefully. Describe both sides of the contradiction without trying to resolve it. The team will know what to do with that information.",
    example: "Several responses described what helped in terms that suggested an easier week than the Q2 distribution captured. Whatever helped didn't fully translate into how the week felt.",
  },
  {
    name: "q4_carries_weight",
    look_for: "Q4 (what's being carried) responses across multiple replies share a recognisable theme of pressure, uncertainty, or a specific kind of demand.",
    interpret: "Surface as a thread, anonymised. Use the team's own register. Don't editorialise about how heavy or how worrying — describe what was reported.",
    example: "What's being carried into next week, across several responses, has to do with decisions that haven't yet been made and the time those decisions are taking.",
  },

  // ── Cross-cycle patterns ──────────────────────────────────────────────────

  {
    name: "comparison_to_last_cycle",
    look_for: "Previous readback exists; this cycle's energy pattern, top dimensions, or Q2 distribution differs meaningfully from last cycle.",
    interpret: "Name the change. 'Last cycle the team's attention sat in Spark; this cycle it's spread across three energies' — that kind of observation. Don't compare more than two cycles back; the readback isn't a trend report.",
    example: "Last cycle's responses sat almost entirely in Spark and Tend. This cycle, three of the four energies appeared, with Tend missing — the team's focus shifted into different territory.",
  },
  {
    name: "continuity_to_last_cycle",
    look_for: "Previous readback exists; this cycle's dominant energy or top dimensions closely resemble last cycle.",
    interpret: "Name the continuity. 'For the second cycle running, attention sat in [energy].' Continuity is signal — could be unresolved, could be a settled rhythm. Pose rather than answer.",
    example: "For the second cycle running, Decision and Momentum were the dimensions that came up most. Whether that means the same demand is still on the team or that it's become the rhythm is a question worth holding.",
  },
];

// ─── 2.5: describeTeamShape — turn team aggregate into structured shape ──────
//
// Takes the output of getTeamAggregate(teamId) and produces a short structured
// description that the LLM can use without re-deriving from raw band counts.
//
// Thresholds may need tuning against real cycles — they're surfaced as
// constants here so they're easy to adjust after the first 2–3 runs.

const TEAM_SHAPE_THRESHOLDS = {
  WELL_REPRESENTED: 0.40, // ≥40% of team has Naturally present in this energy
  THIN:             0.20, // ≤20% of team has Naturally present (and >0)
  DEVELOPING:       0.40, // ≥40% of team is in Developing band for this energy
};

export function describeTeamShape(aggregate) {
  const empty = { wellRepresented: [], thin: [], absent: [], developing: [], balanced: true };
  if (!aggregate || !aggregate.memberCount) return empty;
  const total = aggregate.memberCount;

  const wellRepresented = [];
  const thin = [];
  const absent = [];
  const developing = [];

  for (const e of ENERGY_IDS) {
    const bands = aggregate[e] || {};
    const naturallyPct = (bands["Naturally present"] || 0) / total;
    const developingPct = (bands["Developing"] || 0) / total;
    if (naturallyPct >= TEAM_SHAPE_THRESHOLDS.WELL_REPRESENTED) wellRepresented.push(e);
    else if (naturallyPct === 0) absent.push(e);
    else if (naturallyPct <= TEAM_SHAPE_THRESHOLDS.THIN) thin.push(e);
    if (developingPct >= TEAM_SHAPE_THRESHOLDS.DEVELOPING) developing.push(e);
  }

  const balanced =
    wellRepresented.length === 0 && thin.length === 0 && absent.length === 0;

  return { wellRepresented, thin, absent, developing, balanced };
}

// ─── 2.6: extractThemesFromFreeText — anonymous theme bundle for Q3/Q4 ───────
//
// Strips empty / null-equivalent / very short responses and dedupes
// near-identical text. The LLM does the actual theme-extraction in its prompt;
// this helper is just the upstream cleaner. Returns either a non-empty array
// of distinct strings or null (so the prompt can omit the section entirely).

const NULL_RESPONSE_LITERALS = new Set([
  "n/a", "na", "none", "nothing", "no", "-", ".", "—", "n / a",
  "nope", "nil", "blank",
]);

export function extractThemesFromFreeText(strings) {
  if (!Array.isArray(strings)) return null;
  const seen = new Set();
  const out = [];
  for (const raw of strings) {
    if (!raw || typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (trimmed.length < 10) continue;
    const lower = trimmed.toLowerCase();
    if (NULL_RESPONSE_LITERALS.has(lower)) continue;
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(trimmed);
  }
  return out.length === 0 ? null : out;
}

// ─── 2.8: Insufficient-confidence fallback template ──────────────────────────
//
// Used when:
//   - response count is below the team's anonymity threshold but the close
//     cron is firing anyway (rare — the close cron currently suppresses email
//     in this case, but the readback record still gets written), OR
//   - LLM generation failed post-check 3 times, OR
//   - the LLM itself returned confidence: 'insufficient'.
//
// Caller may overwrite notes_for_lead with a generation-failure note.

export const INSUFFICIENT_CONFIDENCE_READBACK = Object.freeze({
  reading:
    "This week's check-in didn't produce enough signal to read with confidence. " +
    "The most useful thing this readback can do is name that, and let the team's own conversation fill the gap.",
  threads: null,
  question:
    "What did this week feel like — and was it the kind of week the readback would have caught even with more responses?",
  confidence: "insufficient",
  claims: [],
  notes_for_lead: null,
});

// ─── Helpers used by the readback orchestrator ───────────────────────────────

// Top N Q1 dimensions across all responses, with energy and count.
export function topDimensionsByFrequency(responses, n = 5) {
  const counts = new Map();
  for (const r of responses) {
    let dims;
    try {
      dims = JSON.parse(r.q1_dimensions || "[]");
    } catch {
      dims = [];
    }
    if (!Array.isArray(dims)) continue;
    for (const key of dims) counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => {
      const dim = getDimension(key);
      return dim
        ? { key, label: dim.label, energy: dim.energy, count }
        : { key, label: key, energy: null, count };
    });
}

// Returns { spark, glow, tend, flow } counts of dimension selections across
// every response (i.e. the same key counted once per respondent who picked it).
export function q1ByEnergyCounts(responses) {
  const allKeys = [];
  for (const r of responses) {
    let dims;
    try {
      dims = JSON.parse(r.q1_dimensions || "[]");
    } catch {
      dims = [];
    }
    if (Array.isArray(dims)) allKeys.push(...dims);
  }
  return groupDimensionsByEnergy(allKeys);
}

// Q2 distribution as percentages summing to 100 (rounded; may sum to 99 or
// 101 due to rounding — that's fine for a prompt).
export function q2Distribution(responses) {
  const counts = { heavier: 0, expected: 0, lighter: 0, unsure: 0 };
  for (const r of responses) {
    if (Object.prototype.hasOwnProperty.call(counts, r.q2_landing)) {
      counts[r.q2_landing]++;
    }
  }
  const total = responses.length;
  if (!total) return { heavier: 0, expected: 0, lighter: 0, unsure: 0 };
  return {
    heavier: Math.round((counts.heavier / total) * 100),
    expected: Math.round((counts.expected / total) * 100),
    lighter: Math.round((counts.lighter / total) * 100),
    unsure: Math.round((counts.unsure / total) * 100),
  };
}

// ─── Prompt assembly ─────────────────────────────────────────────────────────

const FEW_SHOT_BLOCK = `## Few-shot examples

The following are illustrative — patterns of *what good looks like*, not phrases to reproduce. Each example pairs a short scenario with the kind of reading that earns the team's attention.

### Example A — energy absence, small team

Scenario: 6 responses; Q1 surfaces Momentum (Spark), Communication (Glow), Reflection (Flow); no Tend dimension picked. Q2: 50% lighter, 33% expected, 17% heavier, 0% unsure. Team profile: Tend naturally present in most members.

Reading (good):
"The team's attention this week landed across three energies — Momentum (Spark), Communication (Glow), Reflection (Flow). Tend didn't appear in any response, which is the most concrete thing about this week's picture. For a team where trust, accountability and consistency sit naturally in most members, a week where none of those came up usually means something else was demanding attention.

Half the team experienced the week as lighter than expected and a third as expected; one response found the week heavier. Lighter for some and heavier for others, when attention has scattered into three different energies, often marks the kind of week where the team wasn't quite in the same room — even if everyone was working."

Question (good): "Was Tend's absence this week because it wasn't needed, or because it didn't get reached for?"

Why this works: names the energy pattern (not just the dimension list); reads the data against the team's shape; the question is one only this week's data could earn.

### Example B — clear Q2 majority, Q1 concentrated, threads omitted

Scenario: 9 responses; Q1 mostly Spark (Decision 6, Momentum 5, Courage 3) and a single Flow (Clarity 1); Q2: 67% heavier, 22% expected, 11% lighter; Q3/Q4 mostly empty.

Reading (good):
"Spark carried this week. Decision and Momentum came up across most of the team, with Courage close behind — the dimensions that show up when something needs to be moved. Two-thirds of the team experienced the week as heavier than expected.

This is the readable version of a week that asked for action under pressure. The combination of Spark-heavy attention and a heavier-than-expected felt experience tracks the kind of week most teams recognise — there was a lot to push through."

Threads: null (Q3/Q4 thin — no recurring substance).

Question (good): "What did the team have to put down to keep moving on the things that came up?"

### Example C — the data is genuinely thin

Scenario: 4 responses; Q1 selections scattered across 4 dimensions and 4 energies; Q2: each category has exactly 1; Q3/Q4 blank.

Reading (good):
"With four responses spread across four dimensions and the felt experience landing differently for each person, this week's check-in didn't produce a shared shape. The most honest thing the readback can do is name that."

Threads: null.

Question (good): "Was this a week the team experienced as four different weeks, or did the responses just happen to land at four different angles?"

Confidence: "low".

Why this works: doesn't manufacture a story. Names what the data shows and stops.`;

export function buildReadbackSystemPrompt(huevoiceRules, teamName) {
  const patterns = PATTERN_LIBRARY
    .map(p => `**${p.name}** — Look for: ${p.look_for} How to read it: ${p.interpret}`)
    .join("\n\n");

  return `${huevoiceRules}

${READBACK_VOICE_RULES}

## Your task

You are producing a team check-in readback for the ${teamName} team.

The team uses four energy preferences: Spark, Glow, Tend, Flow. Each of the 32 Functional Dimensions you'll see in the data maps to one of these energies. The team's natural shape — which energies are well-represented, which are thin, which are absent — is the lens through which you read the week's responses.

Your job: produce a three-part readback that names what this week's data shows about how the team's shape met the week.

- **The reading** describes what the responses show. Up to three short paragraphs. Energy-aware. Specific. Names what was reported and what's notable about it given the team's shape. No advice.
- **The threads** surfaces themes that recurred across multiple Q3/Q4 responses, anonymised. If nothing recurred across at least two responses, threads is null — do not write filler.
- **The question** is one sentence. Earned by the data. Answerable. Not advice. Not motivational. The kind of question the team could take into a real conversation.

You also return:
- **confidence**: high, moderate, low, or insufficient.
- **claims**: every substantive statement in the reading anchored to a specific data point.
- **notes_for_lead**: things the lead (admin) should see that the team should not. May be null.

## Patterns to look for

The patterns below are anchors for what to notice in the data. They are NOT phrases to reproduce. You write the prose; these tell you where to look. Multiple patterns may apply to a single cycle — that's normal.

${patterns}

${FEW_SHOT_BLOCK}

## Output schema

Return ONLY a JSON object matching this schema. No preamble, no commentary, no markdown code fences. Just the JSON.

{
  "reading": "string — up to three short paragraphs separated by \\n\\n. Maximum 1200 characters total.",
  "threads": "string or null — one paragraph if Q3/Q4 had recurring substance across at least two responses; null otherwise. Maximum 400 characters.",
  "question": "string — one sentence. Maximum 200 characters. Single question only.",
  "confidence": "high | moderate | low | insufficient",
  "claims": [
    { "claim": "string — a substantive statement made in the reading", "anchor": "string — the specific data point that supports it" }
  ],
  "notes_for_lead": "string or null — observations the lead should see that the team should not"
}

If the responses are genuinely too thin or too divergent to read with confidence, set confidence to "insufficient" and produce a short, honest reading that names exactly that.

Do not include any text outside the JSON object.`;
}

function formatEnergyBands(bands) {
  if (!bands) return "(no data)";
  const parts = Object.entries(bands)
    .filter(([, n]) => n > 0)
    .map(([band, n]) => `${n} ${band}`);
  return parts.join(", ") || "(no data)";
}

function formatDimensionList(items) {
  if (!items || items.length === 0) return "none";
  if (typeof items[0] === "string") return items.join(", ");
  return items.map(d => `${d.label} (${d.count})`).join(", ");
}

export function buildReadbackUserMessage(context) {
  const { team, cycle, previousReadback } = context;
  const q1Top = cycle.q1Top
    .map(d => `- ${d.label} (${d.energy || "?"}): ${d.count} mention${d.count === 1 ? "" : "s"}`)
    .join("\n") || "(no dimensions selected)";

  return `## Team profile

Members: ${team.memberCount}
Response threshold for this cycle: ${cycle.threshold}

Energy distribution across the team (band counts):
- Spark: ${formatEnergyBands(team.energyDistribution.spark)}
- Glow:  ${formatEnergyBands(team.energyDistribution.glow)}
- Tend:  ${formatEnergyBands(team.energyDistribution.tend)}
- Flow:  ${formatEnergyBands(team.energyDistribution.flow)}

Team shape:
- Well-represented energies: ${team.teamShape.wellRepresented.join(", ") || "none stand out"}
- Thin energies: ${team.teamShape.thin.join(", ") || "none"}
- Absent energies: ${team.teamShape.absent.join(", ") || "none"}
- Energies in Developing across the team: ${team.teamShape.developing.join(", ") || "none"}
- Balanced shape (no energy stands out): ${team.teamShape.balanced ? "yes" : "no"}

## This cycle's responses

Total responses: ${cycle.responseCount} (threshold: ${cycle.threshold})

Q1 — dimensions selected, grouped by energy (counts across all responses):
- Spark: ${cycle.q1ByEnergy.spark}
- Glow:  ${cycle.q1ByEnergy.glow}
- Tend:  ${cycle.q1ByEnergy.tend}
- Flow:  ${cycle.q1ByEnergy.flow}

Q1 — energies present this cycle: ${cycle.q1EnergiesPresent.join(", ") || "none"}
Q1 — energies absent this cycle: ${cycle.q1EnergiesAbsent.join(", ") || "none"}

Q1 — top dimensions by frequency:
${q1Top}

Q2 — how the cycle landed (percentages):
- Heavier than expected: ${cycle.q2Distribution.heavier}%
- As expected:           ${cycle.q2Distribution.expected}%
- Lighter than expected: ${cycle.q2Distribution.lighter}%
- Unsure:                ${cycle.q2Distribution.unsure}%

Q3 — what helped (anonymised, deduplicated; the LLM extracts themes):
${cycle.q3Themes ? cycle.q3Themes.map(t => `- ${t}`).join("\n") : "(no substantive responses)"}

Q4 — what's being carried (anonymised, deduplicated; the LLM extracts themes):
${cycle.q4Themes ? cycle.q4Themes.map(t => `- ${t}`).join("\n") : "(no substantive responses)"}

## Previous readback (if available)

${previousReadback
  ? `From last cycle:\nReading: ${previousReadback.reading}\nQuestion asked: ${previousReadback.question}`
  : "(no previous readback — this is the first cycle for this team, or the previous readback was insufficient)"}

## Now produce the readback

Return ONLY the JSON object specified in the system prompt. No preamble.`;
}

// ─── Output parsing + post-check ─────────────────────────────────────────────

// Tolerant JSON parse — strips code fences, finds the outermost {...} block.
export function parseReadbackJSON(rawText) {
  if (!rawText || typeof rawText !== "string") return null;
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Banned phrases: regex patterns scanned against member-facing fields.
// Carefully scoped to avoid false positives on natural readback prose.
const BANNED_PATTERNS = [
  // Coach-speak (HUE_VOICE_RULES + READBACK_VOICE_RULES)
  /\bsit with\b/i,
  /\bsitting with\b/i,
  /\bhold space\b/i,
  /\bholding space\b/i,
  /\baveraging away\b/i,
  /\blean into\b/i,
  /\bworth sitting with\b/i,
  /the team picture/i,
  // "lands" forms — past tense "the week landed" is fine, the coach-speak
  // forms below are not
  /\blands with\b/i,
  /\blands the way\b/i,
  /didn'?t land\b/i,
  // Banned rhetorical constructions (both forms of "This isn't X. It's Y.")
  /\bthis isn'?t [^.]{1,120}\.\s*it'?s\b/i,
  /\bthat'?s not [^.]{1,120}\.\s*it'?s\b/i,
  // First-person attribution (anonymity)
  /\bone member\b/i,
  /\bsomeone said\b/i,
  /\bone person (mentioned|noted|wrote|shared|said|raised)\b/i,
  /\ba team member\b/i,
  // Outcome forecasting
  /people will notice/i,
  /others will notice/i,
  // Direct instructions
  /pause and ask yourself/i,
  /when you'?re ready/i,
  // Reserved energy words used as plain English
  /\btend to\b/i,
  /\bnatural flow\b/i,
  /could spark/i,
  /warm glow/i,
];

const VALID_CONFIDENCES = new Set(["high", "moderate", "low", "insufficient"]);

export const READBACK_LIMITS = {
  READING_MAX: 1200,
  THREADS_MAX: 400,
  QUESTION_MAX: 200,
};

export function runReadbackPostCheck(parsed) {
  const failures = [];
  if (!parsed || typeof parsed !== "object") {
    return { passed: false, failures: ["malformed JSON or non-object response"] };
  }

  // Schema
  if (typeof parsed.reading !== "string" || !parsed.reading.trim()) {
    failures.push("missing or empty reading");
  }
  if (parsed.threads !== null && typeof parsed.threads !== "string") {
    failures.push("threads must be a string or null");
  }
  if (typeof parsed.question !== "string" || !parsed.question.trim()) {
    failures.push("missing or empty question");
  }
  if (!VALID_CONFIDENCES.has(parsed.confidence)) {
    failures.push(`confidence must be one of high|moderate|low|insufficient (got: ${parsed.confidence})`);
  }
  if (!Array.isArray(parsed.claims)) {
    failures.push("claims must be an array");
  }
  if (parsed.notes_for_lead != null && typeof parsed.notes_for_lead !== "string") {
    failures.push("notes_for_lead must be a string or null");
  }

  // If schema is broken, skip the rest — regenerate.
  if (failures.length) return { passed: false, failures };

  // Length
  if (parsed.reading.length > READBACK_LIMITS.READING_MAX) {
    failures.push(`reading too long: ${parsed.reading.length} > ${READBACK_LIMITS.READING_MAX}`);
  }
  if (parsed.threads && parsed.threads.length > READBACK_LIMITS.THREADS_MAX) {
    failures.push(`threads too long: ${parsed.threads.length} > ${READBACK_LIMITS.THREADS_MAX}`);
  }
  if (parsed.question.length > READBACK_LIMITS.QUESTION_MAX) {
    failures.push(`question too long: ${parsed.question.length} > ${READBACK_LIMITS.QUESTION_MAX}`);
  }

  // Question must be a single sentence — at most one terminal punctuation.
  const terminalCount = (parsed.question.match(/[.?!]/g) || []).length;
  if (terminalCount > 1) {
    failures.push(`question has multiple sentences (${terminalCount} terminal punctuation marks)`);
  }
  if (!parsed.question.includes("?")) {
    failures.push("question must end with a question mark");
  }

  // Banned phrases — only on member-facing fields.
  const memberFacing = [parsed.reading, parsed.threads || "", parsed.question].join("\n");
  for (const re of BANNED_PATTERNS) {
    if (re.test(memberFacing)) {
      failures.push(`banned phrase matched: ${re.toString()}`);
    }
  }
  // "data" word — banned in member-facing only.
  if (/\bdata\b/i.test(memberFacing)) {
    failures.push('the word "data" is banned in member-facing copy');
  }

  // Claims anchored to data points.
  for (let i = 0; i < parsed.claims.length; i++) {
    const c = parsed.claims[i];
    if (!c || typeof c !== "object") {
      failures.push(`claim[${i}] is not an object`);
      continue;
    }
    if (!c.claim || typeof c.claim !== "string" || !c.claim.trim()) {
      failures.push(`claim[${i}] missing claim text`);
    }
    if (!c.anchor || typeof c.anchor !== "string" || !c.anchor.trim()) {
      failures.push(`claim[${i}] missing anchor`);
    }
  }

  return { passed: failures.length === 0, failures };
}
