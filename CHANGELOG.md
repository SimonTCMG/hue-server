# Changelog — MyHue / myhue.co

All notable changes to the MyHue product. Ordered by date, most recent first. Each entry references the numbered item in CLAUDE.md where the full specification lives.

---

## 4 May 2026 — Team check-in readback redesign — full build complete

Replaces the mechanical 3-slot readback (top dimensions + Q2 distribution + keyed prompt) with an LLM-driven three-part readback that reads each cycle through the lens of the team's energy shape. The full eight-item build instruction landed in a single day; first cycle on the new engine fires Friday 8 May 15:00 UK (TCMG). Hard freeze Thursday 7 May 17:00 UK. Design rationale: `claude-project-files/team assessment redesign/team-checkin-readback-redesign-v1.md`.

### What changed at the user level

The team-facing readback is now three parts:
- **The reading** — up to three short paragraphs naming what the cycle's data shows about how the team's natural shape met the cycle. Energy-aware. Specific. Anchored to data points (every substantive claim has a `claim`/`anchor` pair the post-check verifies).
- **The threads** — one short paragraph surfacing themes that recurred across multiple Q3/Q4 responses. Null when nothing recurred — no padding.
- **The question** — one earned sentence the team can take into a conversation. Not advice, not motivational.

Leads/admins additionally see a "Lead view — not shown to the team" block beneath the readback, with `confidence` (high/moderate/low/insufficient) and `notes_for_lead`. Members never receive these fields in the API payload.

The Monday 09:00 close cron now flips the dashboard reveal automatically once the readback is generated, so the team sees it the next time they open the dashboard. Lead-gate-before-reveal remains available as a kill-switch by setting `dashboard_revealed = 0` manually before close.

### Engine architecture

`generateReadback(teamId, checkinId)` is now an async orchestrator:

1. Assemble structured context — `getTeamAggregate` + `getCheckinResponses` + `getMostRecentClosedReadback`. `describeTeamShape` turns band counts into a structured shape (`wellRepresented`, `thin`, `absent`, `developing`, `balanced`). `extractThemesFromFreeText` deduplicates and length-filters Q3/Q4 strings. No user_id ever leaves the DB layer.
2. Insufficient-data short-circuit — if `responseCount < threshold` or `ANTHROPIC_API_KEY` is missing, persist the deterministic `INSUFFICIENT_CONFIDENCE_READBACK` template and return.
3. LLM call — `claude-sonnet-4-6`, max 1500 tokens. System prompt = `HUE_VOICE_RULES` + `READBACK_VOICE_RULES` + task framing + 20-pattern `PATTERN_LIBRARY` + 3 worked few-shot examples + output schema. User message = team profile + cycle data + previous readback.
4. Parse + post-check — `parseReadbackJSON` is tolerant of code fences and surrounding text. `runReadbackPostCheck` enforces: schema, four valid `confidence` values, length ceilings (1200/400/200), single-sentence question ending in `?`, banned-phrase scan (coach-speak, AI cadence, energy-words-as-plain-English, the word "data" in member-facing copy), first-person attribution scan (anonymity), and that every claim has both `claim` and `anchor`.
5. Up to 3 attempts. After 3 post-check failures, falls back to insufficient-confidence with a lead-only note explaining the failure.
6. Persists atomically — `team_checkins` updated with reading/threads/question/confidence; `team_checkin_readbacks` audit row written with full prompt + raw response + parsed response + post-check result + attempts + model. Audit logging stays verbose for the first 4–6 cycles.

### Files

**New:**
- `dimensions.js` — single source of truth for the 32 Functional Dimensions. Loads `checkin-dimensions.json` once, validates 32-entries / 8-per-energy / unique-keys / valid-energies at module load. Exports `DIMENSIONS`, `DIMENSIONS_BY_ENERGY` (energy-keyed, sortOrder-sorted), `DIMENSION_KEYS`, `ENERGY_IDS`, `getDimension`, `getDimensionEnergy`, `groupDimensionsByEnergy`.
- `readback.js` — readback voice rules + 20-pattern `PATTERN_LIBRARY` + `describeTeamShape` + `extractThemesFromFreeText` + `topDimensionsByFrequency` + `q1ByEnergyCounts` + `q2Distribution` + `buildReadbackSystemPrompt(huevoice, teamName)` + `buildReadbackUserMessage(context)` + `parseReadbackJSON` + `runReadbackPostCheck` + `INSUFFICIENT_CONFIDENCE_READBACK`. Pure logic — no DB, no network.
- `dimensions.test.js` — 12 tests over the dimension helpers.
- `readback.test.js` — 29 tests over the readback helpers, including a sanity check that the insufficient-confidence fallback itself passes the post-check (it has to — it's the official fallback) and that the rendered system prompt includes every pattern in the library.

**Modified:**
- `server.js` — imports from `dimensions.js` + `readback.js`; `generateReadback` rewritten as the async LLM orchestrator above; close cron now `await`s the engine and auto-flips `dashboard_revealed`; readback API endpoints (`/api/team/:teamId/checkin/:checkinId/readback`, `/api/team/:teamId/checkin/latest`) updated via `buildReadbackPayload(checkin, isLead)` to return the new schema with lead-only fields gated server-side; legacy `slot1/slot2/slot3` still returned alongside for cycles closed before the redesign; new `GET /api/dimensions` (public) returns canonical dimensions; new `POST /api/admin/dry-run-readback/:checkinId` (SESSION_SECRET-gated) lets Simon preview the engine against real check-in data without firing the cron — default returns context + assembled prompts only; `?live=true` actually calls the model and returns the parsed result + post-check verdict; never persists.
- `db.js` — idempotent migration adds `readback_reading`, `readback_threads`, `readback_question`, `readback_confidence` columns to `team_checkins`; new `team_checkin_readbacks` audit table with index on `checkin_id`. New helpers: `persistReadback(checkinId, readback, responseCount, audit)` (atomic transaction, writes both team_checkins update and audit row), `getReadbackForCheckin(checkinId)` (most recent audit row), `getMostRecentClosedReadback(teamId)` (used to feed previous-cycle context into prompt). `getCheckinResponses` widened to include Q3/Q4 (still no `user_id` returned — anonymity preserved). Legacy `closeCheckin(checkinId, slot1, slot2, slot3, count)` retained for backward compatibility but no longer called.
- `public/hue.html` — `TeamCheckinReadback` rewritten to render reading paragraphs (split on blank lines), conditional threads block (only when non-null), italic question, and a lead-only "Lead view — not shown to the team" block beneath the team-facing readback. Falls back to legacy slot1/slot2/slot3 rendering when `reading` is null (covers cycles closed before the redesign). `DIMENSIONS_32` continues to derive from `/api/dimensions` (item 2.1).
- `package.json` — `npm test` wired up; runs both test files.

### What stayed the same

- The check-in machinery itself: Friday 15:00 open cron, Sunday 18:00 reminder, Monday 09:00 close cron, the four questions, anonymity model, ad-hoc trigger, 48h window, MailerSend templates, response validation, threshold gating.
- Pipeline 3 anonymity guarantee — no user_id leaves the DB layer; the LLM only sees aggregated counts and deduplicated themes.
- Reveal-gate flow — kill-switch still available; default behaviour just changes the trigger from "lead clicks reveal" to "engine generated readback".

### Verified

- 41/41 tests pass (`npm test`).
- Server boots cleanly with both shape validations passing (dimensions + audit migration).
- All endpoints respond correctly: `GET /api/dimensions` (200, 32 entries), `POST /api/admin/dry-run-readback` (403 without secret), `GET /` (200, no console errors).
- Browser verification: `DIMENSIONS_32` populates from `/api/dimensions` correctly; `TeamCheckinReadback` component is defined; no console errors on home page.
- Schema check on `team_checkins`: new columns present and nullable. `team_checkin_readbacks` table exists with the index.
- Frontend handles both new schema (cycles closed after 4 May 2026) and legacy schema (TCMG's 1 May cycle has slot1/slot2/slot3 only — falls back automatically).

### Important visible side-effect

The 32-dimension panel chip order within each quadrant now follows `sortOrder` from `checkin-dimensions.json` (defaultVisible chips first per energy) rather than the previous hand-typed order. Same dimensions, slightly reordered. Most visible on Tend (was Trust/Accountability/Commitment/...; now Accountability/Wellbeing/Trust/...). Flag if this is wrong.

### Next steps

- Simon: review the system prompt + a synthetic dry-run before Friday's cycle. The admin endpoint accepts `?live=true` to actually call the model — useful for sanity-checking against TCMG's 1 May data once we recreate it (TCMG production has the data; local dev DB is empty).
- After Friday's cycle: read the audit row for TCMG's first new-engine readback. If the post-check fired or anything reads off, the pattern library and voice rules are the dials to turn — they live in `readback.js` and are the easy part of the system to adjust.
- Logging stays verbose for the first 4–6 cycles per the build instruction. After ~6 cycles, evaluate whether `system_prompt`/`user_message`/`raw_response` need to keep being persisted on every audit row.

---

## 2 May 2026 — Assessment v2.1: signal-density gate + always-all-four progress line (CLAUDE.md item 117)

The v2 assessment (12–18 exchanges, fixed coverage gate) was over-asking in-depth respondents — a verbose user could satisfy all five coverage counters in 6–8 exchanges but the floor of 12 forced another 4–6 turns of essentially redundant questioning. v2.1 fixes that without weakening the coverage rigour, and adds an ambient progress indicator so the user can sense how far through the picture is.

### Assessment loop changes (system prompt in `public/hue.html` ~lines 270–360)

- **Floor lowered: 12 → 8 exchanges.** Preserves a sensible minimum baseline; removes artificial padding for in-depth respondents. Ceiling unchanged at 18.
- **Density-aware counter increments.** Replaces v2's "+1 per response containing X" with "+1 per *distinct situation or context* in the response that exhibits X." Cap +2 per counter per response so one essay-length answer can't trip a counter alone. Cross-counter increments explicitly allowed — a single rich response may legitimately raise multiple counters at once.
- **Bias schedule shift.** Exchanges 1–6 from the original topic bank (was 1–8); 7+ coverage-driven (was 12+). Drops the redundant 9–11 transitional band.
- **Coverage emission.** Model appends a hidden `<!--coverage:{"v":N,"c":N,"r":N,"u":N,"i":N}-->` line at the end of every non-completion turn, allowing the frontend to drive the progress line without exposing the counters to the user.

### Frontend (`public/hue.html`)

- **`HueProgressLine` component** (added near the SpinMark definition). Two-layer always-all-four-colours gradient strip: a 22%-opacity track shimmer (`::before`) and a full-saturation fill, both sized at 200% width with `background-size: 200% 100%` so all four colours are present at any visible width. Same `hue-drift` keyframe animates `background-position-x` from 100% to 0% over 14s on both layers in sync. `prefers-reduced-motion: reduce` halts the drift.
- **Assessment screen header** gains a new bottom row: `STARTED ──── COMPLETE` strip below the existing SpinMark/MyHue/Home row. Border between header and chat moved to the bottom of the new strip.
- **`parseCoverage` / `stripCoverage` / `coverageFillPoints`** helpers added next to `parseScores`. Frontend parses the hidden coverage line, strips it before display, and maps the five counters to the 0–8 fill points total (with per-counter caps applied).
- **`ChatScreen` wiring**: `fillPoints` state, updated on each model reply; rendered into the strip; locked to 8 on the completion turn.

### Time estimate copy

All three places updated to "around 10 minutes — sometimes a bit more if there's more ground to cover":
- `hue-consent-conversation-v1.md` — Exchange 1
- `public/hue.html` home screen WelcomeScreen
- `public/hue.html` ConsentScreen system prompt string

### Files touched

`public/hue.html`, `hue-consent-conversation-v1.md`, `CLAUDE.md` (item 117 added; "Working and live" assessment line + KEY PRODUCT DECISIONS Assessment format paragraph rewritten), `hue-assessment-v2-code-brief.md` (new — full v2.1 spec, reconstructs v2 baseline plus density gate and progress line), `.claude/mocks/progress-line.html` (new — interactive visual mock).

### Open follow-ups

- Counter persistence on browser refresh — currently the line resets on reload; conversation history still lives server-side, so a re-derive-from-history pass could come later (see brief §8.2)
- Drift behaviour at completion — currently continues until the screen transitions; revisit if the transition feels jarring (see brief §8.3)

---

## 24 April 2026 — Check-in backend complete (Pipeline 3) — TCMG first run 1 May 2026

The check-in system was previously DB-complete (all CRUD helpers in `db.js`, frontend components in `hue.html`) but had no wired backend. This session verified that gap, then built everything needed for TCMG's first real check-in on Friday 1 May at 15:00 UK.

**Verification finding:** CLAUDE.md items 109/110/112 described the system as complete. In reality, no cron jobs and no API routes existed. DB layer was confirmed live. Frontend components were confirmed live. Backend was missing entirely. (See instruction file `CODE_INSTRUCTION_checkin_first_run.md`.)

### What was built (CLAUDE.md items 109, 112)

**6 API routes added to `server.js`:**
- `GET /api/team/:teamId/checkin/current` — open check-in + 32 dimensions + alreadyResponded flag for auth'd user
- `POST /api/team/:teamId/checkin` — ad-hoc trigger (lead/admin only), soft cap 4/month, emails all members
- `POST /api/team/:teamId/checkin/:checkinId/respond` — validated anonymous response (Q1: 1–3 valid dimension keys; Q2: enum; Q3/Q4: ≤200 chars)
- `GET /api/team/:teamId/checkin/:checkinId/readback` — gated: status=closed + threshold + reveal gate (leads bypass reveal)
- `GET /api/team/:teamId/checkin/latest` — most recent closed readback, same gating
- `PUT /api/team/:teamId/checkin/notification-email` — self-only notification routing update

**3 cron jobs added:**
- `0 15 * * 5` (Friday 15:00 UK) — `openScheduledCheckins`: filters paused teams, checks fortnightly parity (even ISO weeks are "on"), skips teams below threshold, creates check-in, emails all members
- `0 18 * * 0` (Sunday 18:00 UK) — `sendCheckinReminders`: gentle optional reminder to non-responders only; scheduled check-ins only
- `0 9 * * 1` (Monday 09:00 UK) — `closeCheckinsAndGenerateReadbacks`: generates readback, closes check-in, emails leads/admins only if threshold met

**`generateReadback(teamId, checkinId)`:**
- Slot 1: template aggregate — top 3 Q1 dimensions by frequency + Q2 landing distribution as percentages
- Slot 2: `null` — observation library (~40 sentences) not yet written; frontend renders 2-slot layout
- Slot 3: keyed prompt from `CHECKIN_SLOT3_PROMPTS` (stretch/matched/celebratory/quiet/mixed) based on Q2 majority (≥50%)

**Helpers added to `server.js`:** `resolveTeamEmail()`, `getISOWeek()`, `CHECKIN_SLOT3_PROMPTS`, `checkinEmailHtml` (alias of `trialEmailHtml`)

**2 functions added to `db.js`:** `getTeamMembersForNotification()` (includes notification routing columns), `getTeamsEligibleForCheckin()` (teams where `checkin_paused = 0`)

### TCMG first-run configuration

Startup migration added to `app.listen` block — runs once on first deploy, idempotent (skips if `checkin_cadence` already set):
```
checkin_cadence = 'weekly', checkin_timezone = 'Europe/London',
checkin_trigger_time = '15:00', checkin_min_responses = 6, checkin_paused = 0
```
Applied to `tcmg-team-001`. No manual SQL required — will apply automatically on Railway startup.

### What was deliberately left out

- Slot 2 copy — suppressed entirely (null), not stubbed. No placeholder visible to users.
- No ad-hoc 24h auto-close cron — TCMG is weekly; the Monday close handles all scheduled check-ins. Ad-hoc check-ins stay open until Monday close.
- No changes to frontend — `TeamCheckinFlow` and `TeamCheckinReadback` components were already present.

---

## 22 April 2026 — Static pages voice pass + manifesto goes live

Simon spotted "lands" language on the About page ("Something that didn't land", "didn't land the way you meant") and asked for a voice pass across all static pages (About, Privacy, Manifesto). Did a full scan for banned phrasing, reserved-word misuse, and AI-cadence patterns. Results:

### About page — 3 fixes
1. Hero supporting copy: "Something that didn't land" → "Something that didn't go the way you meant"
2. WIIFM statement 4: "It's not a personality quiz. It's a conversation" → "A conversation, not a personality quiz" (banned "It's not X. It's Y." cadence; rewritten as appositional contrast)
3. Step 4 italic teaser + body: two instances of "didn't land the way you meant" → "didn't go the way you meant"

### Privacy page — clean
Full scan found no banned phrasing, no reserved-word misuse, no AI cadence. No changes.

### Manifesto — 2 fixes + now a live page
The manifesto was previously a source markdown doc only. No `/manifesto` route existed. Two voice fixes made before conversion:
1. Line 51: "aren't a ranking of better and worse. They're reach labels..." → "are reach labels... rather than a ranking of better and worse" (banned "not X. It's Y." cadence rewritten as appositional qualifier)
2. Line 59: "is not a refinement of the old model. It's a different category." → "is a different category altogether — not a refinement of the old model, but a different kind of instrument." (banned cadence rewritten as single assertion with dash-clarifier)

The fixed markdown was then converted to `public/manifesto.html`, matching the Privacy page's visual scaffolding (same fonts, colours, shared footer). Added `/manifesto` route to `server.js`. Footer navigation on all three static pages already contained the manifesto link (present in earlier shared-footer work); page now resolves.

### Pattern for future static-page voice updates
Markdown source stays canonical in `hue-manifesto-v1.md`. If the manifesto copy ever changes, the source is edited first, and `public/manifesto.html` is regenerated from it — not edited in parallel. Same principle applies if we convert About or Privacy back to markdown-sourced in future.

---

## 21 April 2026 — Shared voice rules across all AI-generated copy

The daily subscriber email for 21 April included the banned phrase "That's not about control. It's about care." — spotted by Simon. Root cause: every AI call site in `server.js` had its own hand-written partial voice rules pasted into its system prompt. Each version was slightly different — the daily email prompt only banned "This isn't X. It's Y."; the bespoke observation prompt banned both that and "That's not X. It's Y."; none of them carried the full 15 April 2026 banned-phrase list.

Fix: one shared `HUE_VOICE_RULES` constant declared once at the top of `server.js`, referenced by all six Anthropic API call sites.

### Rules now enforced in one place
- The read-it-aloud test
- Autonomy voice — no outcome forecasting, no instructions to pause / reflect / sit with
- Energies describe preferences, not capabilities — no "leads with" as a verb tied to one colour, no "can't do X", no framing any energy as unavailable to anyone
- Reserved words rule (spark, glow, tend, flow — energy names only, never plain English)
- Full banned-phrase list including both forms "This isn't X. It's Y." AND "That's not X. It's Y." (both forms, in any tense, including softened variants)
- All April 15 additions: "sit with", "when you're ready", "people will notice", "bring something deliberately", "two engines running in parallel", "that's not a tension", direct instructions to pause
- Position labels (Instinctive / Fluent / Intentional / Developing) — never as fixed identity
- Flex mechanic language — "reaching for", "deliberately drawing on", never "switching to" or "unlocking"

### Call sites updated
- `/api/summarise` — conversation summary
- `/api/one-sentence` — one-sentence distillation
- `/api/bespoke-observation` — unrepeatable observation
- `/api/chat` — companion chat (proxy, appended server-side to whatever the client sends — defence in depth)
- `generateEmailContent()` — daily subscriber email

### Content type rename
The daily email content type "A question to sit with" renamed to "A question to hold". The phrase "sit with" is on the banned list (15 April 2026) and was leaking cues into generated output. Updated in `CONTENT_TYPES`, the `contentInstruction` map, and `hue-email-strategy-v1.md`.

### Why this matters
Voice drift across AI calls was inevitable with four hand-maintained partial copies. A rule added to one prompt would be forgotten in another. The new pattern makes voice update = one edit.

---

## 20 April 2026 — Retake date drift (#75 follow-up)

The 11 April fix was incomplete. Backend stored `retest_available_at` correctly at assessment completion; frontend correctly preferred the server value when present. But pre-11-April users had `retest_available_at = NULL` in the database (the column was added but never backfilled), and the frontend fallback path (`retakeAvailableDate`) used localStorage's `savedAt` — which was rewritten to `Date.now()` on every server hydration. Result: affected users saw the retake date slide forward by one day per session.

Fixes:
- Backfill migration: `retest_available_at = assessment_completed_at + 90 days` for all users with a completed assessment and null retest date. Runs at startup in `db.js`.
- `retakeAvailableDate()` fallback changed from `Date.now()` to `null`. Missing date is safer than invented date.
- `saveProfile()` now accepts an explicit `savedAt` so hydration from server data uses `assessment_completed_at`, not the moment of hydration.
- `formatUserResponse` now exposes `assessmentCompletedAt` for frontend use.

---

## 20 April 2026 — Header consistency pass (#115)

All team and org pages now use the same sticky header pattern as the Results screen.

### Team dashboard sticky header
- Left: SpinMark (38px, paused) + "Hue" wordmark (Fraunces 20px 700) — identical to Results page
- Centre: team name, truncated with ellipsis
- Right: `checkin` + `share` + `home` NavIcons for leads/admins; `home` only for members
- `checkin` NavIcon: new type added to `NavIcon` component — circle + exclamation mark. Shows active (tinted) state when a check-in is currently open or the ad-hoc panel is open
- Old pill-style "Check-in" and "Share" buttons removed entirely
- Padding changed to `20px 40px` / `16px 20px` to match Results exactly
- `overflowX: "hidden"` removed from outer wrapper — this property creates a new scroll context and silently breaks `position: sticky` on child elements. This was the root cause of the header scrolling away

### Org admin sticky header (#115)
- New sticky header: SpinMark + "Hue" left, org name centred, home NavIcon right
- No share button — share is team-level, not org-level
- Back arrow removed; home NavIcon replaces it for navigation
- Org name heading (`h1`) retained in page body below the header
- Outer wrapper `overflowX: "hidden"` removed (same sticky fix as above)

### Shared team sticky header (#115)
- New sticky header: SpinMark + "Hue" left, team name + "Read only" badge centred, `myhue.co` text link right
- No home NavIcon — shared team links are unauthenticated; `myhue.co` is the appropriate exit

### NavIcon component
- New `checkin` type added alongside existing `home`, `share`, `save`

---

## 19 April 2026 — Team invite + registration bug fixes (#99–101)

### Team registration silent failure (#99)
- When `teamId` is submitted but `getTeam(teamId)` returns null or `team.org_id` doesn't match the submitted `orgCode`, the old code created the user account but added them to no team — silent failure with no error
- Root cause in production: users invited to Team Hue Demo (the second team in TCMG org) were registered but not appearing on the Team Hue Demo dashboard
- Fix: added `else` branch that logs a warning with full diagnostic detail (team found, `org_id` value, user email) and falls back to the first team in the org so the user is never stranded
- Affected user (Nick, `iss52219@gmail.com`) recovered via one-time admin endpoint — added to Team Hue Demo with energy bands synced. Original invitation (`iss52218@gmail.com`) marked as registered.

### Pending-invites filter (#100)
- `GET /api/team/:teamId` had a broken filter: `!memberList.some(m => m.name && members.find(mm => mm.email === inv.email))` — logically convoluted, checked `memberList` names rather than directly comparing emails
- Simplified to `!members.some(m => m.email === inv.email)` — matches the org admin endpoint pattern exactly

### Copy-invite-link team label (#101)
- "Copy invite link" button in org admin had no indication of which team the link was for — easy to accidentally share the wrong team's link when the dropdown defaulted to the first team
- Now shows "Link is for: **[Team Name]**" inline, dynamically reflecting the currently selected team in the invite dropdown

---

## 16 April 2026 — MyHue rebrand + daily email energy rotation

### MyHue rebrand (#93–98)
- **Product is now MyHue everywhere.** The companion remains Hue ("Hi, I'm Hue"). All UI, emails, marketing, headers, and footers use MyHue.
- Email header: static spin logo SVG (H with four colour dots) + MyHue wordmark in Georgia serif — replaces old red-u `hue` text
- Email footer: `MyHue · myhue.co`
- Maintenance page: `MyHue` logo text, body copy updated, `.u` CSS rule removed
- about.html: title tag updated to MyHue. Body copy references to Hue as companion unchanged
- Home screen: large "Hue" heading replaced with spin logo (36px) inline with MyHue wordmark in Fraunces, tagline promoted to hero weight (Fraunces 28px italic bold, ink)
- Project documents updated: CLAUDE.md, hue-voice-v1.md, hue-email-strategy-v1.md

### Daily email energy rotation (#90–92)
- Weekly focus mode cycle across all four energy positions: instinctive (Sun/Thu), fluent (Mon/Fri), intentional (Tue/Sat), developing (Wed)
- Four distinct content instructions per mode — instinctive (what it makes possible), fluent (what it adds alongside instinctive), intentional (precision when reached for), developing (where practice has most visible impact)
- Badges show focus energy + instinctive (or focus + fluent on instinctive days)
- Subject line includes energy name on intentional/developing days only
- Two-facts technique: occasional overlay on alternate Wednesdays — exactly two standalone observable-behaviour sentences, no connective, no question. Content type label stays "A thought for today"
- System prompt: energy-name-in-body-copy rule added — names appear only in template badges

---

## 15 April 2026 — Daily email, companion language, privacy, constellation

### Daily email redesign (#79)
- Replaced single-energy colour background block with four-colour top bar (Spark/Glow/Tend/Flow stripes)
- Cream background throughout — no longer stamps one colour on the user
- Two energy badges: instinctive + second-ranked energy, with dark readable text colours
- Energy names in body copy rendered in their energy colours via `formatEmailCopy()` helper
- `{{PRIMARY_COLOR}}` placeholder removed from template and server.js
- CTA button is ink black, not energy-coloured
- Footer: "Your profile belongs to you."

### Companion language fixes (#80)
- No outcome-forecasting ("people will notice", "others will notice")
- No readiness/preparation language ("when you're ready", "bring something to the companion")
- No direct instructions ("pause and ask yourself") — offer the observation and stop
- Both forms of banned rhetorical construction explicitly listed ("This isn't X. It's Y." and "That's not X. That's Y.")
- Additional banned phrases: "when you bring it deliberately", "that's not a tension", "two engines running in parallel", "each one ready when you need it"

### PII stripped from API payloads (#81)
- `user.name` removed from daily email generation API call
- PRIVACY COMMITMENT comment block added above all 5 Anthropic API call sites in server.js
- Rule documented in CLAUDE.md architecture section — non-negotiable, published user promise

### Privacy & Terms page (#82–86)
- Standalone `/privacy` page: three sections (Your conversations, Your profile, The legal version)
- Privacy section added to `/about` marketing page between trial reassurance and final CTA
- Companion system prompt includes privacy Q&A guidance for in-conversation questions
- Consent screen: "By continuing you're agreeing to our Privacy & Terms" link below Continue button
- Persistent "Privacy & Terms" footer link on all non-chat screens in hue.html

### Constellation fixes (#87–89)
- Positioning rewritten: dominant energy determines which quadrant the node is in (placed 55% from centre), other three energies adjust position within that quadrant. Replaces axis-ratio formula that could place a Glow-dominant person in the Tend area
- Initials disambiguation: when two members share the same initials, shows first 4 chars of first name (e.g. "Jacq" vs "Jill") with slightly larger nodes
- Overlap nudging: threshold increased to 50px, nudge distance to 46–58px, alternating direction — overlapping nodes always readable

---

## 11 April 2026 — UI/UX fixes from beta testing

### Org admin member status (#69)
- Member list now reads profile completion from canonical `assessment_completed_at` on users table
- Added filter controls: filter by team (dropdown) and filter by status (All / Profile complete / Pending)

### Multi-team profile association (#70)
- Team dashboard endpoint auto-syncs missing energy bands on load
- Fixes case where user completed assessment before being added to a second team

### Mobile submit button (#71)
- Input row uses flex layout with `minWidth: 0` on text input, `flexShrink: 0` on buttons, `overflow: hidden` on container
- Submit button always visible and tappable on all mobile viewports

### Results screen nav (#72)
- Nav bar pinned at top with `position: sticky` — Home icon always reachable at any scroll position
- Opaque cream background with sand border prevents content showing through

### Energy card collapse/expand (#74)
- Card 1 (Instinctive) expanded by default; cards 2–4 collapsed
- Prominent "More" / "Less" toggle in energy colour — not accordion, cards toggle independently

### Registration/retest dates (#75)
- `retest_available_at` column added to users table, set once at registration
- Dates served from stored values — no longer recomputed at render time

### Legend dots (#76)
- All dots fixed at 14px circles with explicit `minWidth` — no more ovals
- Legend moved to own visually separated row above member list with subtle background
- Label text increased to 12px; three band states visually distinct (solid, partial, hollow)

### Additional result cards (#77)
- Four-colour gradient border (Spark → Glow → Tend → Flow) replaces single energy colour
- Card heading text is ink, not energy-coloured; background is cream
- EnergyWord components inside body text unchanged

---

## 9 April 2026 — Polish and voice pass

### Member list mobile (#58)
- Admin/Lead pill wraps with name row; energy band dots allowed to wrap on narrow screens

### Daily email copy (#59)
- "your profile is right here whenever you want to explore this further" → "whenever you want to pick this up, I'm here"

### Companion opener (#60)
- Simplified to "I've got your colours. What's on your mind?" — no reserved-word collision

### Copy invite link (#61)
- Org admin can grab the team invite link and send via any channel as fallback

### Reserved words in AI prompts (#62)
- Enforced in all three system prompts: assessment, companion, daily email

### Glow two-context rendering (#64)
- `#F5D000` for fills/borders, `#C8960C` (glowOnLight) for text on light backgrounds — system-wide

### Team dashboard instinctive energy (#65)
- Uses stored `dominant_energy` with band-rank fallback — fixes faint/missing avatar colour

### Daily email safety (#66)
- Context block marked internal-only; no-markdown rule in system prompt; `stripMarkdown()` safety net

---

## 8 April 2026 — Beta launch and account continuity

### Beta user state (#48–50)
- `beta-user` state: full access, no trial clock, no Stripe, suppressed from trial emails
- `BETA_EMAILS` env var for automatic beta assignment on registration
- Beta welcome email: warm, honest, no clock, feedback invite

### Team Hue Demo (#51)
- Second team in TCMG org for live demo purposes

### Email change flow (#52)
- Initiated from authenticated session, confirmed via new email only (24h token)
- MailerLite atomic sync on change; old email gets informational notification

### Returning user on /register-org (#53)
- Existing users get team membership attached without creating duplicate account
- Welcome-back email if profile exists; standard onboarding if new

### Subscription pause/resume (#55)
- Org join pauses active individual subscription via Stripe API
- Org lapse auto-resumes paused subscription seamlessly

### Email sequence logic (#56)
- State transitions correctly suppress/redirect emails across all paths

---

## Pre-April 2026 — Core build

### Assessment and profile
- Full assessment conversation flow: AI-conducted, 6–8 exchanges, six scoring dimensions (#1–2, #14)
- Four energy scores generated; results screen with bespoke observation, four energy cards (#9, #11)
- Observation library: 73 observations across 16 primary, 12 pairings, 8 misread, and more (#2, #15)
- One sentence: identity-distillation sentence, shareable, with canvas download
- Score-gap logic for profile shape observations (#15)

### User accounts and payments
- Email registration, login, session cookies, user states (#4)
- Stripe integration: checkout sessions, 14-day trial, webhooks (#3)
- Trial email sequence: days 1, 3, 5, 7, 10, 12, 13, 14 via MailerSend (#5)
- MailerLite subscriber sync with user_state tagging (#6)
- App gate: all visitors must register before accessing assessment (#7)
- Trial gate: hard stop at day 14 with reassurance messaging
- Multi-currency pricing: 8 currencies, Cloudflare geo-detection (#78)

### Companion
- Profile-aware companion chat with coaching register
- Conversation memory (summaries), anniversary sentence, pre/post situation practice
- Voice input via Web Speech API (#34)

### Team dashboard
- Team dashboard overview: band bars, member list, 32-dimension panel (#22, #26)
- Team constellation view (#25)
- Cultural prompt before visibility toggle (#23)
- Dashboard reveal gate (#37)
- Org admin interface: create teams, invite members, bulk invite (#24, #31)
- Org member registration flow with data ownership messaging (#16)
- Org member onboarding emails: 4-email sequence (#27)

### Sharing
- Share my profile: link and session share tokens, revoke capability (#12)
- Shareable result card: canvas-rendered PNG (#18)

### Marketing and pages
- `/about` marketing page (#67)
- Consent conversation: three-exchange flow (#10)
- Maintenance mode (#8)
- EnergyWord component + colorize helper (#13)

### Infrastructure
- Deployed on Railway, auto-deploys on GitHub push (#30)
- TCMG org and team created on production
- Tend rename from Root — complete throughout codebase (#1)

---

*Part of The Change Maker Group ecosystem. IP belongs to Simon Phillips.*
