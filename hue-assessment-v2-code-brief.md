# hue-assessment-v2-code-brief.md

*Reconstructed 2 May 2026 from the live system prompt in `public/hue.html`, the v2 paragraph in `CLAUDE.md`, and `hue-psychology-foundations-v1.md` Section 8. The original v2 brief referenced from CLAUDE.md was not present in the project at the time of reconstruction.*

*Status: v2 baseline is **live in production** since 21 April 2026. v2.1 amendments (signal-density gate + visual progress line) are **decided and pending implementation** — sign-off captured in conversation 2 May 2026, code change not yet made.*

---

## 1. PURPOSE

The assessment is the front door to MyHue. It must:

- Produce a defensible four-energy ranking through naturalistic conversation (not a questionnaire)
- Score against six explicit dimensions (see `hue-psychology-foundations-v1.md` Section 8)
- Stop when it has enough signal — neither sooner (under-evidenced) nor later (over-asked)
- Read as a conversation, not an interview
- Generate a bespoke "only you" observation as a separate API call once scores are in

This brief specifies the assessment loop only — the system prompt, completion logic, and the user-facing progress indicator. It does not cover the bespoke observation, the results screen, or the companion handover; those are documented elsewhere.

---

## 2. METHODOLOGICAL POSITIONING

Hue's assessment inverts classical questionnaire design. Traditional instruments fix the items and let coverage vary by respondent. Hue **fixes coverage and lets items vary by respondent** — every conversation must produce evidence across the same six scoring dimensions, but the route to that evidence adapts to what the respondent says.

This is the core methodological claim. It is what allows a 9-exchange conversation with a verbose respondent and an 18-exchange conversation with a terse respondent to produce comparably evidenced rankings. The fixed point is the evidence base, not the question count.

This positioning is explicit in `hue-psychology-foundations-v1.md` Section 8 and is the design constraint everything below derives from.

---

## 3. v2 BASELINE — WHAT IS LIVE

### 3.1 Format

- AI-conducted, conversational
- Adaptive length: **floor 12 exchanges, ceiling 18 exchanges, median 14**
- Coverage-driven completion gate (see 3.4)
- Behavioural framing only ("what did you do") — never hypothetical ("what would you prefer")
- One question per turn
- No emojis, no markdown, plain prose

### 3.2 Six scoring dimensions

Held in the system prompt; the model attends to all six across the conversation. Defined formally in `hue-psychology-foundations-v1.md` Section 8.

1. Spontaneous choice
2. Effort language
3. Frequency signals
4. Valence
5. Cross-context consistency
6. Recovery pattern

### 3.3 Question bank

**Original topics (exchanges 1–8 draw primarily from here):**

1. What energises them
2. How they handle conflict
3. What a great day looks like
4. How they make decisions
5. What people thank them for
6. How they spend free time
7. How they approach new challenges

**Adaptive bank — Q9–Q16 (each tagged to a coverage counter):**

| ID  | Counter            | Question |
|-----|--------------------|----------|
| Q9  | valence            | Tell me about a recent time you did what the moment needed, but it cost you more than it looked like from the outside. What was happening? |
| Q10 | valence            | Is there something people assume you find easy that actually takes real effort? When did that last come up? |
| Q11 | crossContext       | Think of a recent moment outside work where you surprised yourself — the good kind or the other kind. What happened? |
| Q12 | crossContext       | When you're with close friends or family, are you the same person you are at work? Or does something shift? |
| Q13 | recovery           | Think back to a recent week when everything arrived at once — too much, too fast, not enough time. What were you actually doing? |
| Q14 | recovery           | When a plan falls apart at the last minute, what's the first thing you do — before you've had a chance to think about it? |
| Q15 | updateMechanism    | Tell me about a recent time you changed your mind about something that mattered. What got you there? |
| Q16 | identityInSuccess  | When you look back at something you handled well, what part of it feels most like you? |

### 3.4 Coverage tracking — five counters

The model silently increments these as it reads each response.

| Counter            | Increment rule (v2) |
|--------------------|---------------------|
| valence            | +1 for each response containing cost / drain / effort language, or describing behaviour performed despite preference |
| crossContext       | +1 for each distinct non-work context the person describes (home, friends, solo, family, body, community, etc.) |
| recovery           | +1 for each response describing behaviour under pressure, disruption, overload, or things going wrong |
| updateMechanism    | +1 for evidence of how the person shifts position — what they accept as evidence, what changes their mind |
| identityInSuccess  | +1 for unguarded self-location in a good outcome — what they take credit for, what they're proud of |

### 3.5 Completion gate (v2)

Run silently before any final JSON:

1. **Floor:** ≥ 12 exchanges? If not, continue.
2. **Coverage:** all five counters at threshold? `valence ≥ 2 · crossContext ≥ 2 · recovery ≥ 2 · updateMechanism ≥ 1 · identityInSuccess ≥ 1`. If any counter under threshold, ask the Q9–Q16 question that targets the lowest-scoring counter. If all questions for that counter have been asked, move to the next-lowest.
3. **Ceiling:** ≥ 18 exchanges? If yes, stop and emit JSON regardless of coverage.

Total threshold points across all five counters = **8** (2+2+2+1+1). This number is load-bearing for the v2.1 progress line (see §5).

### 3.6 Bias schedule (v2)

- Exchanges 1–8: original bank (free choice based on conversation flow)
- Exchanges 9–11: bias toward the lowest-scoring counter
- Exchanges 12+: strictly coverage-driven

### 3.7 Completion JSON

Emitted on its own line, exactly:

```
{"done":true,"scores":{"spark":N,"glow":N,"tend":N,"flow":N}}
```

Integers summing to ~28, reflecting all six scoring dimensions across the conversation.

---

## 4. v2.1 AMENDMENT — SIGNAL-DENSITY COMPLETION GATE

*Decided 2 May 2026. Pending implementation. Approved by Simon.*

### 4.1 The problem v2.1 solves

The v2 floor of 12 exchanges punishes verbose, in-depth respondents. A user who answers each question with a rich multi-context story can satisfy all five counters in 6–8 exchanges, but the floor forces the conversation to continue for another 4–6 turns of essentially redundant questioning. Surfaced from beta feedback 2 May 2026.

The fix is not to remove the floor entirely (which would risk under-evidenced completions for terse respondents) but to make both the floor and the counter increments more honest about signal sufficiency.

### 4.2 Changes

**(a) Density-aware counter increments.** Replace v2's "+1 per response containing X" with: "+1 per *distinct situation or context* in the response that exhibits X." A single response that genuinely spans two distinct situations earns +2 on that counter. Length alone never increments — only count of distinct situations or contexts described.

**(b) Per-counter density cap.** Maximum +2 per counter per response. Prevents a single essay-length answer from satisfying a counter to its full threshold alone, which would erode the multi-angle character of the conversation.

**(c) Cross-counter increments.** Make explicit (already implicit in v2): a single rich response may legitimately satisfy multiple counters at once. A story that spans home and work, was performed at a personal cost, and describes recovery from disruption can simultaneously raise crossContext, valence, and recovery.

**(d) Lower floor: 12 → 8 exchanges.** Preserves a sensible minimum baseline (no completion at exchange 5 even if every counter has fired) while removing the artificial padding for in-depth respondents.

**(e) Ceiling unchanged at 18 exchanges.**

**(f) Bias schedule shift to match the new floor.**
- Exchanges 1–6: original bank
- Exchanges 7+: coverage-driven (lowest counter first)
- (Drops the 9–11 transitional band — at the new tighter floor it's redundant.)

### 4.3 Why this works

- **Terse-but-clear respondents:** still hit the 8-exchange floor, with coverage usually firing right at or near that point.
- **Verbose-but-rich respondents:** finish at 8–10 exchanges instead of 12–14. No more padding.
- **Verbose-but-vague respondents:** the density rule requires *distinct situations* per increment, not word count. A person who writes long, abstract answers without anchoring to specific situations does not accumulate fast — the conversation continues until they do.

### 4.4 Updated counter rules (v2.1 wording)

| Counter            | Increment rule (v2.1) |
|--------------------|------------------------|
| valence            | +1 per distinct situation in the response that contains cost / drain / effort language, or describes behaviour performed despite preference. Cap +2 per response. |
| crossContext       | +1 per distinct non-work context described in the response. Cap +2 per response. |
| recovery           | +1 per distinct situation described in the response involving pressure, disruption, overload, or things going wrong. Cap +2 per response. |
| updateMechanism    | +1 per distinct instance of position-shift evidence. Cap +2 per response. |
| identityInSuccess  | +1 per distinct unguarded self-location in a good outcome. Cap +2 per response. |

### 4.5 Updated completion gate (v2.1)

1. **Floor:** ≥ 8 exchanges? If not, continue.
2. **Coverage:** unchanged thresholds.
3. **Ceiling:** ≥ 18 exchanges? If yes, stop.

---

## 5. v2.1 AMENDMENT — VISUAL PROGRESS LINE

*Decided 2 May 2026. Pending implementation. Approved by Simon (gradient line confirmed; always-all-four behaviour confirmed; idle drift confirmed). Visual mock: `.claude/mocks/progress-line.html`.*

*Design history note for future readers: an earlier sketch in this conversation proposed a four-quadrant progress ring (one quadrant per energy). It was rejected because mid-fill states would show some colours present and others absent, which would teach the respondent to "perform" the missing colours and corrupt the assessment. The continuous gradient line below sidesteps that risk by keeping all four colours present at all times.*

### 5.1 Why a progress indicator at all

The adaptive 8–18 exchange range, while methodologically clean, is opaque to the user. A person partway through doesn't know whether they're a quarter, half, or three-quarters of the way to a complete picture. This produces low-grade anxiety especially on first-run, and especially for in-depth respondents who feel the conversation might continue indefinitely.

The line solves this without exposing the underlying mechanism (exposing the five counters would tempt people to game them) and without implying any per-energy attribution (which would corrupt the conversation by inviting the respondent to perform for absent colours).

### 5.2 Visual design

A thin horizontal strip — `STARTED ──────── COMPLETE` — that sits as its own row inside the assessment screen's sticky header, below the SpinMark/wordmark/Home row, acting as the seam between the brand bar and the chat.

**Anatomy (two layers, both running the same idle drift in sync):**

- **Track:** sand `#E8DFC8` background, full strip width, always visible.
- **Track shimmer (`::before`):** the full Spark→Glow→Tend→Flow gradient at low opacity (≈22%), drifting. Gives the line life from the moment the screen opens, even before the first coverage point is earned. 200%-wide doubled gradient (so the visible window always contains all four colours regardless of drift position).
- **Fill (`.fill`):** the same 200%-wide doubled gradient at full saturation, also drifting in sync with the shimmer. Width grows from 0% to 100% as coverage points accumulate. A 1/8 fill shows a small compressed rainbow ribbon; an 8/8 fill spans the full strip with the same colours stretched out.
- **End labels:** "STARTED" left-anchored, "COMPLETE" right-anchored. Small letter-spaced stone caps (`#9B8E7E`, ~11px, letter-spacing ≈ 0.04em). Always visible.
- **No number, no percentage, no tooltip.** The strip is ambient; the only text is the two end labels.

### 5.3 Why all four colours are always present, always

The fill gradient is doubled — `linear-gradient(90deg, spark, glow, tend, flow, spark, glow, tend, flow)` — sized to 200% of the visible width. Any 100% slice of that doubled gradient contains all four colours in order. This is true at the smallest visible width (a 1/8 fill ribbon shows a tiny rainbow with all four bands) and at the largest (an 8/8 fill spans the strip with the colours at their natural proportions).

The user never encounters a state where one or more energy colours is absent from the line. There is therefore no signal to "perform for the missing colour."

### 5.4 Idle drift

Both the track shimmer and the fill run the same animation: `background-position-x` shifts from `100%` to `0%` over **14 seconds, linear, infinite**. Visually this reads as the colours flowing slowly right-to-left through the line.

The drift is independent of completion progress. It runs continuously while the user is mid-typing, mid-thinking, mid-anything. The two layers stay in perfect sync because they share the same keyframe and start at the same moment (page load).

Tells the user "this is alive, listening" without any explicit cue.

**Direction:** right-to-left ("drawing in / listening"). Confirmed in conversation 2 May 2026.

**Speed:** 14s/cycle. Confirmed in conversation 2 May 2026. Slow enough to read as ambient, fast enough to be perceptible.

**Reduced motion:** wrapped in `@media (prefers-reduced-motion: reduce)` — drift halts; the line still fills as coverage advances.

### 5.5 Mapping logic — coverage to line fill width

Total threshold points across the five counters = 8 (2+2+2+1+1). Each fill point = 12.5% of strip width. The line fills as counters earn their threshold points, *not* as exchanges accumulate.

```
fillPoints = min(valence, 2)
           + min(crossContext, 2)
           + min(recovery, 2)
           + min(updateMechanism, 1)
           + min(identityInSuccess, 1)

fillWidthPct = (fillPoints / 8) * 100
```

`fillPoints` is in [0, 8]. Width transitions on change with `cubic-bezier(0.22, 0.61, 0.36, 1)` over **450ms**.

### 5.6 Fill semantics

- **0 points:** sand track + low-opacity drifting shimmer only. Strip reads as alive but unfilled.
- **1–7 points:** fill grows from the left, all four colours visible inside the filled portion at all times.
- **8 points + floor reached:** line is full → completion fires.
- **8 points + floor not yet reached:** line sits at 8/8 while the conversation continues for the remaining exchanges. Rare in practice — coverage typically lags the floor, not vice versa. If observed repeatedly in beta, revisit the floor.
- **Floor reached + < 8 points:** line continues to fill as the conversation continues toward coverage. No special visual state.
- **Ceiling reached (18 exchanges) + < 8 points:** completion fires. Line shows whatever fill state it's in. Rare under v2.1.

### 5.7 Where it sits

Inside the assessment screen's existing sticky header, as a new bottom row beneath the SpinMark/wordmark/Home row:

```
┌──────────────────────────────────────────────────┐
│  [SpinMark]  MyHue                       [Home]  │   ← existing top row
├──────────────────────────────────────────────────┤
│  STARTED  ──gradient-line──────────  COMPLETE    │   ← new bottom row
└──────────────────────────────────────────────────┘
   chat conversation begins below this seam
```

The line appears **only on the assessment screen**. The companion chat does not have a completion target, so it does not get one. The home screen does not get one either.

### 5.8 Quarterly retest variant

Retests run the same assessment loop. To signal "we're refreshing the picture, not starting from nothing," the retest variant opens with the line at full width, ghosted at 30% opacity (the drift continues). As the new conversation accumulates and `fillPoints` advances, the live full-saturation fill grows over the ghost. By the time the new fill reaches 8/8, the ghost has faded to 0.

Implementation detail: the ghost is always a "full" state because prior assessments completed by definition. No need to store a per-user ghost level — it's simply a CSS opacity on a full-width rendering of the same gradient.

### 5.9 Accessibility

- ARIA label on the strip wrapper: `"Assessment depth indicator"`. Avoids "progress" framing because the line isn't a strict percentage of a known total.
- `role="img"`. Not interactive.
- The line's information is non-essential for completion — the conversation will end correctly whether or not the line is visible. No keyboard or screen-reader path required beyond the label.
- `prefers-reduced-motion: reduce` halts the drift animation but does not prevent the fill width transition (which is itself slow and gentle).

### 5.10 Component contract (sketch)

```jsx
<HueProgressLine
  fillPoints={5}                    // 0..8, derived from coverage counters
  ghost={false}                     // true on retest — shows previous-completion ghost behind
  ariaLabel="Assessment depth indicator"
/>
```

CSS lives alongside the SpinMark styles (currently around `public/hue.html` line ~466). Keyframe `hue-drift` declared once at top of stylesheet. Both layers (track `::before` and `.fill`) reference it.

### 5.11 Visual reference

Interactive mock at `.claude/mocks/progress-line.html`. Includes the in-context header placement, a five-row snapshot grid (0/8 through 8/8), a live scrubber, the live idle drift, and a full anatomy block. To view: `cp .claude/mocks/progress-line.html public/_mock-progress-line.html` and visit `/_mock-progress-line.html` while `hue-server` is running. Delete the `public/` copy before any commit.

---

## 6. IMPLEMENTATION PLAN

### 6.1 Backend / system prompt

`public/hue.html` lines ~270–358 (the assessment system prompt block):

- Update §3.4 counter rules → v2.1 wording (§4.4 above)
- Update §3.5 floor `≥ 12` → `≥ 8`
- Update §3.6 bias schedule wording
- Add explicit cap-2-per-response sentence
- Add explicit cross-counter-permitted sentence

### 6.2 Counter visibility for the line

The line needs the current counter values per turn, not just at completion. Two options:

**Option A — Model emits per-turn counter state.** Append a hidden machine-readable line at the end of each model turn:

```
<!--coverage:{"v":1,"c":2,"r":0,"u":0,"i":0}-->
```

Frontend parses, strips before display, updates `fillPoints`. Lightweight. Cost: token budget per turn (~30 tokens), negligible. **Recommended.**

**Option B — Server-side estimation.** Run a small classifier on each turn server-side. Heavier, more failure modes, more tokens. Not recommended.

### 6.3 Frontend component and header layout

- `HueProgressLine` React component declared near the SpinMark definition (`public/hue.html` ~line 466).
- Keyframe `hue-drift` declared once at top of stylesheet; both the `::before` shimmer and the `.fill` reference it.
- The assessment screen's sticky header gains a new bottom row containing `<HueProgressLine fillPoints={...} />` flanked by "STARTED" and "COMPLETE" stone caps. The existing top row (SpinMark + MyHue + Home) is unchanged.
- State: `fillPoints` derived from parsed coverage values. Initial value `0` on screen mount.

### 6.4 Document updates

- **CLAUDE.md** "Key Product Decisions / Assessment format" paragraph: rewrite to reflect v2.1 (floor 8, density gate, progress line indicator). Reference this doc.
- **`hue-consent-conversation-v1.md`**: update the time estimate — v2 said "12–18 exchanges, about 14 minutes typically"; v2.1 should say "8–18 exchanges, around 10 minutes for most people."
- **Home-screen "start your assessment" CTA copy**: same time estimate update.
- **CHANGELOG.md**: entry for v2.1.

### 6.5 Order of work

1. System prompt edits (§6.1) — can ship independently and would already improve the verbose-respondent experience
2. Counter emission (§6.2 Option A) — required before the line can be wired
3. Line component + header bottom row (§6.3)
4. Document updates (§6.4)

Steps 1–4 can be done in one session. Step 1 alone is also viable as a smaller first ship if the line needs more design iteration.

---

## 7. TEST PLAN

### 7.1 Three-persona behavioural test

Run the assessment three times manually with deliberate personas:

| Persona | Expected behaviour |
|---------|---------------------|
| Terse-but-clear (one or two sentences per answer, anchored to specific situations) | Reaches floor at 8, coverage fires at or near 8, completes between 8 and 10 exchanges |
| Verbose-but-rich (multi-paragraph answers with multiple distinct situations per turn) | Coverage fires before 8, floor enforces minimum, completes at 8 |
| Verbose-but-vague (long answers without anchoring to specific situations) | Density rule prevents fast counter accumulation, conversation continues past 8 toward ceiling |

If any persona finishes in materially different exchange counts than expected, revisit either the floor or the density rule.

### 7.2 Line rendering

- Renders at 0/8 through 8/8 cleanly; `fillPoints` width equals `(fillPoints / 8) × strip width` ± 1px
- Width transition triggers on counter change, completes within ~450ms
- Sand track + low-opacity drifting shimmer visible at 0/8 (verify the empty state still feels alive)
- Idle drift cycles at 14s on both layers, in sync (`::before` opacity ≈ 0.22, `.fill` opacity 1.0)
- All four colours present in any visible portion of the fill at any drift position — never a moment where one colour is absent
- `prefers-reduced-motion: reduce` halts drift; width transition still works
- Header layout holds at mobile (375px) and desktop (1280px) — line spans the full width of the header card on both, end labels do not wrap or clip

### 7.3 Counter parsing

- Hidden coverage line correctly stripped before chat display
- Malformed coverage line does not crash the page (defensive parse)
- Missing coverage line does not advance the line but does not block the conversation

### 7.4 Retest variant

- Ghost (full-width gradient at 30% opacity) visible on retest open
- Drift continues on the ghost
- New fill grows over the ghost; ghost fades to 0 by the time `fillPoints` reaches 8

---

## 8. OPEN QUESTIONS

1. **Counter emission format.** §6.2 Option A is recommended but the exact wire format (HTML comment, JSON tag, sentinel token) needs a final decision based on what the chat-rendering pipeline already strips reliably.
2. **Counter persistence on browser refresh.** If the user reloads mid-assessment, the conversation history is preserved server-side. Counter state needs to be either re-derived from history (simple if Option A is in place) or persisted explicitly. Resolve when Option A is implemented.
3. **Drift on completion.** Once the line reaches 8/8 and completion fires, should the drift continue for the brief moment before the screen transitions to results, or should it pause as a "we're done" signal? Initial proposal: continue (the screen is about to transition anyway, and pausing introduces a new visual state to maintain). Worth a final eye in implementation.

---

## 9. REFERENCES

- `hue-psychology-foundations-v1.md` — Section 8 (the BPS/EFPA framework), Section 7 (recovery pattern grounding)
- `hue-consent-conversation-v1.md` — three-exchange consent flow, holds the user-facing time estimate
- `public/hue.html` — assessment system prompt at ~lines 270–358; SpinMark component at ~line 466
- `CLAUDE.md` — "Key Product Decisions" paragraph naming the v2 spec
- `.claude/mocks/progress-line.html` — interactive visual mock of the line at all fill states, including the live idle drift
- Conversation 2 May 2026 — sign-off on v2.1 amendments (signal-density gate, gradient progress line, always-all-four behaviour, idle drift)
