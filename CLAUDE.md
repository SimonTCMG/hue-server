# CLAUDE.md — Hue / myhue.co
*Master brief for all Claude sessions. Last updated: 8 April 2026.*
*Read this before doing anything. All decisions documented here are resolved unless Simon explicitly reopens them.*

---

## WHAT HUE IS

An AI-conducted colour energy assessment and ongoing companion. Through a natural conversation — not a questionnaire — Hue identifies how each person tends to show up across four energy dimensions. The result is a personalised profile with specific observations. The companion chat continues the relationship after assessment.

**Live at:** myhue.co
**Also accessible at:** hue-server-production.up.railway.app
**Owner:** Simon Phillips / The Change Maker Group

---

## CURRENT BUILD STATUS

**⚠️ Railway billing: 22 days / $4.85 remaining — Simon must top up at railway.app/account/billing before site goes offline.**

### Working and live
- Full assessment conversation flow (AI-conducted, 6–8 exchanges, six scoring dimensions in system prompt)
- Four energy scores generated from conversation
- Results screen: redesigned — bespoke observation at top ("only you", always shown in full), four energy cards each with position-specific celebratory framing (Instinctive/Fluent/Intentional/Developing) plus sub-labels ("This is where you go first" / "You move here easily when it helps" / "You reach for this when the situation calls for it" / "There's more here for you when you're ready"), flex and surprise cards, extended observations. Long observations truncated at ~200 chars at sentence boundary (180–220 range, always at full sentence end) with "Read more" / "Read less" inline toggle. Learn-more prompt uses accessible language (no framework vocabulary in navigation)
- Bespoke observation: second API call generates one unrepeatable observation from the specific conversation
- One sentence: identity-distillation sentence, shareable, with canvas download
- Observation library: all 16 primary observations live (4 energies × 4 reach positions), plus 12 pairings, 8 misread, 4 under pressure, 4 leadership, 4 conflict, 4 relationships, 8 flex crossings, 7 near-equal, 6 profile shapes — all in companion and results
- Score-gap logic: profile shape observations triggered by wide gap, near-zero, all-high, all-low, all-equal patterns
- Consent conversation: three-exchange conversational flow before first assessment (ConsentScreen component, stored in localStorage)
- `<EnergyWord>` component: renders Spark, Glow, Tend, Flow in their energy colours throughout the app
- `colorize()` helper: auto-wraps energy names in EnergyWord within any text string
- Voice input: browser-native Speech Recognition (Web Speech API) on both assessment and companion chat. Microphone button next to send, pulses red while listening, input field shows "Listening..." placeholder. No backend, no API keys, no cost. Falls back gracefully if unsupported. Works in Chrome and Safari.
- Companion chat: profile-aware, coaching register, colour energy in coaching, conversation memory (summaries), anniversary sentence, pre/post situation practice. Response length rules enforced in system prompt: max 2 sentences of observation before a question, one question per response, no affirmation openers ("That's a really interesting reflection..."), match the person's energy/length
- User accounts: email registration, login, session cookies, user states
- Stripe integration: checkout sessions, 14-day trial with card at sign-up, webhook handling (checkout.session.completed, invoice.paid, customer.subscription.deleted, invoice.payment_failed), billing portal
- Trial email sequence: days 1, 3, 5, 7, 10, 12, 13, 14 via MailerSend, cron at 9am UK. Day 12 uses testimonial library matched to recipient's dominant energy (Spark→Rachel, Glow→Dom, Tend→Priya, Flow→Kiran). Blockquote border colour matches energy.
- MailerLite subscriber sync with user_state tagging and energy score custom fields
- App gate: all visitors must register before accessing assessment
- Trial gate: hard stop at day 14 — TrialExpiredScreen leads with reassurance ("Your profile is still here. Pick up exactly where you left off."), CTAs say "Keep going — £9.99/month"
- Share my profile: link and session share tokens (30-day / 8-hour), SharedProfileScreen, revoke capability
- Shareable result card: canvas-rendered PNG (1080×1350) with four energy bars, dominant energy, myhue.co branding — "Save card" button on results screen
- Org member registration: separate screen at `/register-org`, no payment, no trial clock, `org-member-active` state, data ownership messaging. Invite link passes org and team IDs — user auto-added to team on registration. Form asks for "Personal email address" (not work email — profile outlasts the job). Org code field hidden when passed via URL.
- Org member onboarding emails: 4-email sequence via MailerSend. Email 1 (Welcome, immediate on registration), Email 2 (First insight, Day 3 — personalised by dominant/developing energy), Email 3 (Team context, Day 7 — what employer sees), Email 4 (Companion intro, Day 14). Cron at 9:15am UK for Days 3/7/14. Tracked in `org_emails` table. Org members never receive trial emails (suppressed by state).
- Invite email: language-guide-compliant, explains what Hue is, states data ownership, links to `/register-org`. Uses proper email HTML template.
- Returning user flow: shows last result, offers retake after 90 days
- Maintenance mode: `MAINTENANCE_MODE` env var closes site instantly (Stripe webhook still passes through)
- Tend rename: complete throughout codebase (tokens, variables, stored data, migration for old profiles)
- Static SVG favicon, PWA manifest
- Deployed on Railway, auto-deploys on GitHub push

### Team dashboard — UI built
- Team dashboard overview at `/team/:teamId`: four energy band bars (all full colour — visual weight from bar length, not opacity), member count, member list with initials in instinctive energy colour, subtle tinted card backgrounds per member. Band labels have hover tooltips ("The team reaches for this without thinking" / "The team brings this deliberately when it's needed" / "This energy is available — the team is still building its reach here")
- Member list: shows all four energy band dots per person (not just instinctive colour) — reinforces that everyone has access to all four energies. Legend in header row explains dot styles (full = Naturally present, partial = Intentionally present, hollow = Developing)
- 32-dimension functional panel: four quadrants (Spark/Glow/Tend/Flow), each showing 8 confirmed dimensions as dots. Qualifying text per quadrant based on relative ranking — energies ranked against each other so the team always sees contrast (strongest, present-but-deliberate, growth frontier). Legend in header row. Spark: Purpose/Vision/Decision/Transformation/Momentum/Courage/Ambition/Challenge. Glow: Collaboration/Communication/Environment/Team Meetings/Celebration/Inclusion/Belonging/Energy. Tend: Trust/Accountability/Commitment/Diversity/Wellbeing/Consistency/Loyalty/Memory. Flow: Planning/Processes/Roles & Skills/Reflection/Clarity/Evidence/Learning/Systems.
- Team constellation view: SVG spatial layout using consistent X/Y axis mapping — X: Spark (right) vs Tend (left), Y: Flow (top) vs Glow (bottom). Same energy bands = same position. Overlap nudging prevents stacking. No connection lines (removed — "shared energy affinity" was undefined and meaningless). Ambient float animation, quadrant glow, Fraunces labels at edges. Initials only on nodes, full name on hover. List/table alternative for teams of 10+.
- Cultural prompt inline above visibility toggle — exact copy from strategy doc. Toggle only for team-lead/org-admin. Green when full_team, sand when leader_only.
- Restricted view for members when leader_only visibility is set
- Observations threshold notice: below 8 members, shows progress message

### Team data model and architecture
- DB tables: `organisations`, `teams`, `team_members`, `team_energy_bands`
- Band calculation: 33%+ Naturally present, 22–32% Intentionally present, <22% Developing (percentage-of-total model — 4 energies sum to 100%, baseline 25%)
- Two strict data pipelines enforced at DB level — team layer stores bands only, never raw scores
- Sub-team support: user can belong to multiple teams, profile contributes independently to each
- Roles: org-admin (all teams), team-lead (their teams), member
- Aggregate function: band counts per energy, observations suppressed below 8 members
- Auto-sync: assessment completion pushes bands to all teams user belongs to

### Org admin — UI built
- Org admin screen at `/org/:orgId`: create teams, invite members by email (sends invite via MailerSend with data ownership message), view all members with status (Profile complete / Joined, not started / Invited), remove members, assign team leads
- Bulk invite: textarea accepts multiple emails separated by commas, semicolons, newlines, or spaces. Single email sends immediately. Multiple emails show confirmation panel listing all addresses before sending. Maximum 50 per batch. Helper text explains format.
- API endpoints: `/api/org/create`, `/api/org/:orgId`, `/api/org/:orgId/team`, `/api/org/:orgId/invite`, `/api/org/:orgId/member/:userId` (DELETE), `/api/org/:orgId/team/:teamId/lead`
- Team API endpoints: `/api/teams`, `/api/team/:teamId`, `/api/team/:teamId/visibility`
- Welcome screen shows team links and "Manage organisation" link for org admins

### TCMG beta — live and ready
- Organisation "The Change Maker Group" created on production (ID: `tcmg-org-001`)
- Team "TCMG" created (ID: `tcmg-team-001`)
- Simon registered as org-admin with simon@thechangemakergroup.com
- Auto-promotion: simon@thechangemakergroup.com automatically gets org-admin role on registration via either route
- Invite flow tested end-to-end: invite email → registration → assessment → team dashboard update → onboarding emails
- Invite email sent from hello@myhue.co (sender name: "Hue"), subject: "[Name] has invited you to Hue"

### Production environment — complete
- Stripe env vars live in Railway ✓
- MailerLite fields clean, `mailerlite.js` updated to correct tag names, backfill complete ✓
- Four redundant Stripe webhook destinations deleted — only `upbeat-harmony` remains ✓
- MailerSend and MailerLite API keys set ✓

### Not yet built
- Team dashboard: gap radar, new hire modeller panels
- Gamification / mini missions layer
- AI help layer
- @search for team members

---

## FILE LOCATIONS

| File | Purpose |
|------|---------|
| `public/hue.html` | Entire frontend — single HTML file, React via CDN |
| `server.js` | Node/Express backend, proxies Anthropic API calls, Stripe, email cron |
| `db.js` | SQLite schema and queries — users, teams, orgs, shares, summaries, trial emails |
| `mailerlite.js` | MailerLite subscriber sync |
| `mailersend.js` | MailerSend email sending |
| `.env` | Local API keys (ANTHROPIC_API_KEY, STRIPE, MAILERLITE, MAILERSEND) |
| `hue-strategy-v1.md` | Full product strategy and decisions |
| `hue-commercialisation-v1.md` | Commercial model, pricing, channels — all decided |
| `hue-observations-v1.md` | 73 observations — all written and implemented in app |
| `hue-team-client-doc-v1.md` | One-page sales document for team buyers |
| `hue-consent-conversation-v1.md` | Three-exchange consent flow — implemented in app |
| `hue-share-profile-spec-v1.md` | Spec for facilitator share link feature — implemented |
| `hue-psychology-foundations-v1.md` | Theoretical and psychological foundations — design constraint, not background reading |
| `hue-email-strategy-v1.md` | Trial email sequence, tagging structure, nurture flows — written and implemented |
| `hue-voice-v1.md` | **Master voice and copy reference** — supersedes voice/tone sections of language guide. Read before writing any user-facing text |
| `hue-language-guide-v1.md` | Technical vocabulary reference (energy names, hex codes, rendering rules, data ownership language, team/org language). Voice/tone sections now in `hue-voice-v1.md` |
| `hue-identity-v1.jsx` | Design language reference (tokens, logo mark, typography) |
| `hue-launch-checklist.md` | Beta launch steps, BPS consistency, validation tasks — not yet written |

**GitHub:** github.com/SimonTCMG/hue-server (private)
**Railway project:** humorous-sparkle / production
**DNS:** Cloudflare (nameservers: jose.ns.cloudflare.com + magdalena.ns.cloudflare.com)

---

## HOW TO DEPLOY

```
cd "/Users/simonphillipstcm/Documents/Project Hue"
git add . && git commit -m "description" && git push
```
Railway auto-deploys within ~1 minute.

**How to run locally:**
```
cd "/Users/simonphillipstcm/Documents/Project Hue"
node server.js
```
Then open `http://localhost:3001`

---

## THE FOUR ENERGIES

| Energy | Colour | Description |
|--------|--------|-------------|
| Spark | Red `#D92010` | Drive · Action · Ignition |
| Glow | Yellow `#F5D000` | Warmth · Optimism · Connection |
| Tend | Green `#1A8C4E` | Steadiness · Care · Depth |
| Flow | Blue `#1755B8` | Clarity · Systems · Vision |

**Note:** The energy previously called Root is now called **Tend** everywhere it refers to the energy. The word "root" remains valid in plain English usage (root cause, rooted in, etc.) — only the energy name changes.

Every person has access to all four. The assessment measures preference — which energies someone tends to reach for most naturally. Rankings reflect preference, not capability.

**Colour-coded energy words:** Wherever the words Spark, Glow, Tend, and Flow appear in the web app, emails, or any digital output, they must be rendered in their energy colour. This is a non-negotiable design standard. An `<EnergyWord>` component (or equivalent) handles this. Plain text contexts (e.g. this document) are exempt.

---

## VOICE AND COPY

Before writing any user-facing copy — UI labels, companion responses, email content, observations, onboarding text, error states, or any other text a user will read — read `hue-voice-v1.md` in full. All copy decisions not covered by that document default to the autonomy voice principle in its section 2.

---

## CRITICAL LANGUAGE RULES — apply to every word in the product

### Energies are verbs, never nouns
- **Never:** "a Spark person", "she's a Flow type", "your energy is Tend"
- **Always:** "reaching for Spark energy", "tends to show up with Glow energy", "naturally reaches for Flow"

### The word "arc" is internal only — never in user-facing copy
| Never say | Always say |
|-----------|------------|
| Start Arc 1 | Explore your dominant energy |
| Arc 1 complete | You know your [energy] well |
| Arc 1 result | Your [energy] profile |
| You've completed 2 arcs | You've explored 2 of 4 energies |

### Autonomy voice — non-negotiable
Hue speaks to someone who already knows themselves. The observation confirms, it does not prescribe. The person is always the expert on their own life. Hue never positions itself as the authority on what someone should do, feel, or become. This applies to every word in the product — the companion, the observations, the emails, the onboarding.

- **Never:** nudge, suggest action, imply what someone "should" do
- **Always:** notice, reflect, ask — then step back
- The person decides what to do with their profile entirely. Hue's role is to hold up the mirror, not interpret what the person sees in it.

### Banned phrasing
- **"This isn't X. It's Y."** / **"That's not X. It's Y."** — recognised AI-generated phrasing. Never in any shareable material. Permitted only in live companion conversation inside the app.
- **"Available"** as a reach label — implies others are unavailable. Use the approved label set below.
- **"Unlock"** — transactional, wrong tone
- **"Arc"** in anything user-facing
- **"Lead with"** as a verb tied to one colour — implies others follow or are lesser

### Approved reach label set (energy position labels)
| Position | Label |
|----------|-------|
| 1st | Instinctive |
| 2nd | Fluent |
| 3rd | Intentional |
| 4th | Developing |

### When scores are close
When two or more energies are similarly scored, rank order is less meaningful than the scores themselves. The report should acknowledge closeness explicitly. Never present a 3rd-ranked energy at 62% the same way as a 3rd-ranked energy at 31%.

### Celebrating all four energies
The results experience must celebrate all four energies with equal presence — not just display them. Positions 2, 3, and 4 each deserve their own moment, their own framing, their own articulation of what they specifically add to this person's life. The Fluent, Intentional, and Developing position observations must be written with this spirit. See `hue-observations-v1.md` section 72 (The power of lower energies) as the philosophical foundation.

---

## KEY PRODUCT DECISIONS (all resolved)

**Assessment format:** Conversational, AI-conducted, 6–8 exchanges per energy exploration. Behavioural questions ("what did you do") not hypothetical ("what would you prefer"). See `hue-psychology-foundations-v1.md` for the theoretical basis (Mischel, Gosling).

**Trial model:** 14-day free trial — all four energies explored, full access. Clock starts at sign-up, not first conversation. Card required at sign-up for individuals (auto-converts or cancels). No card required for org/team members — access managed under org contract.

**Post-trial (no payment):** Hard stop. Product is fully gated. Screen leads with reassurance — "Your profile is still here. Pick up exactly where you left off." — not with the gate. CTAs say "Keep going — £9.99/month". Profile data is retained server-side (nothing is lost), but the experience is blocked entirely until subscription. No read-only mode, no partial access. The day-14 expiry email must reassure: "Your Hue profile is saved and waiting — pick up exactly where you left off." This preserves urgency at the highest conversion moment while removing fear of data loss. User moves to tagged email nurture sequence. No further AI calls until resubscription.

**Two-track entry:**
- Individual → card at sign-up → 14-day trial → subscriber or lapsed
- Org/team member → registers free → access via org contract → no trial clock

**User states for tagging:**
- `individual-trial-active`
- `individual-subscriber`
- `individual-trial-expired`
- `org-member-active`
- `org-member-lapsed`

**All four energies in trial:** Every user explores all four energies within their 14 days. The assessment is complete, not a teaser. The companion and daily practice are what subscription maintains.

**Individual owns the profile:** Not the employer. Profile is portable — travels with the person if they leave a company. This is a public commitment, not a policy.

**Consent:** Three conversational exchanges before assessment begins — warm, not legal. Already drafted in `hue-consent-conversation-v1.md`.

**Results screen:** Redesigned to celebrate all four energies equally. Bespoke observation ("only you") at the very top, then four energy cards vertically — each with its own celebratory framing and position-specific text plus a plain-English sub-label. No observation hero panel. No hierarchy with three supporting items beneath a dominant energy. Flex/surprise cards, extended observations (misread, profile shape, near-equal, power of lower), and CTA follow. The "learn more" prompt uses accessible language — no framework vocabulary in navigation (no "misreads", "flex crossings" in UI chrome).

**Companion response style:** Max two sentences of observation before asking a question. One question per response, never two. Questions must be specific to what the person just said, not generic coaching prompts. Never open with affirmations ("That's a really interesting reflection"). Match the person's message length. Same insight, a third of the length.

**Voice input:** Available in both assessment and companion chat via browser-native Web Speech API. No backend, no cost, no API keys. Microphone button sits beside the send button. This may produce more natural, spontaneous responses than typing — better signal for the scoring dimensions (especially effort language and spontaneous choice).

**The accessibility test (added to language guide 8 April):** Before any piece of UI copy is finalised: would someone on their very first day, who knows nothing about Hue, understand this immediately? If not, rewrite it. Framework vocabulary (flex crossings, misreads, arc) is never used in navigation, buttons, prompts, or helper text — only in observations and companion responses where context has already been established.

**Companion chat:** Profile-aware. Never gives advice — notices, reflects, asks. Has a graceful boundary response for conversations that feel heavier than an energy tool can hold. Speaks with autonomy voice at all times.

**Retests:** Unlimited, quarterly cadence default. If retest comes too soon, Hue notes it conversationally — not as a gate.

**Therapist-adjacent risk:** Hue never diagnoses, never names clinical states, never advises. Particularly important for low-energy profiles — frame as spaciousness, not deficit.

**Psychological validity:** Hue is a structured conversational AI instrument that measures behavioural energy preference through naturalistic language analysis across six explicit scoring dimensions (spontaneous choice, effort language, frequency signals, valence, cross-context consistency, recovery pattern). It does not claim to be a psychometric test in the clinical or regulatory sense. See `hue-psychology-foundations-v1.md` Section 8 for the full BPS-aligned framework. Nigel Evans is named collaborator for the joint validation paper.

**Team dashboard — all data displayed in bands, never percentages:** The three bands are Naturally present / Intentionally present / Developing. Raw percentages exist in the data model but never surface in the UI under any circumstances. This is non-negotiable.

**Team dashboard — two strict data pipelines, architecturally separate:**
- Pipeline 1 (team layer): receives energy band per member only. Produces aggregate picture, 32-dimension panel, gap radar, constellation, new hire modeller. Never contains individual scores, behavioural patterns, or longitudinal data.
- Pipeline 2 (personal companion): receives full individual profile and history. Never crosses into the team layer. Ever.
Individual behavioural patterns (overstretch, check-ins, longitudinal observations) go only to the individual via their companion — never to the team layer or the team lead.

**Team dashboard — default visibility is full team.** Every member sees the same dashboard. Aligned with lovingworkplace.org OD principles — the dashboard is a shared team resource, not a management report. Team leads can switch to leader-only visibility, but only after encountering a deliberate prompt that asks them to consider the cultural implications of that choice. The friction before the toggle is intentional — it is itself an OD intervention.

**Team dashboard — minimum threshold:** Below 8 members, behavioural observations are suppressed. Banding alone protects anonymity at small team sizes.

**Team dashboard — sub-teams:** Fully supported. One person can belong to multiple teams; their profile contributes independently to each aggregate. Org admins see all teams; team leads see only their team; members see the team dashboard (by default) but no individual data beyond their own.

**Team dashboard — band bar styling:** All bars rendered in full energy colour. Visual weight comes from bar length (how many members fall in that band), not from opacity or fill style. Pale/hollow bars were rejected — not impactful enough.

**Team dashboard — band thresholds (percentage-of-total model):** Since four energies sum to 100% (baseline 25% each), the thresholds are: 33%+ = Naturally present, 22–32% = Intentionally present, <22% = Developing. The original 65%/40% thresholds were unreachable in this model.

**Team dashboard — functional dimensions use relative ranking:** The 32-dimension panel ranks the four energies against each other by "Naturally present" count across the team. The energy with the most naturally-present members = "Naturally present" (strongest), the energy with fewest = "Developing" (growth frontier), middle two = "Intentionally present." This guarantees contrast — the panel always shows where the team is strongest and where it has gaps, regardless of team composition. Absolute thresholds were rejected because with varied profiles every energy gets covered by someone.

**Team dashboard — member list shows all four energies:** Each member row displays four band dots (Spark/Glow/Tend/Flow) below their name, not just their instinctive energy colour. This reinforces that every person has access to all four energies. The initials avatar still uses the instinctive energy colour, but the full picture is always visible.

**Team constellation — axis logic:** X axis maps Spark (right) vs Tend (left). Y axis maps Flow (top) vs Glow (bottom). Same energy band profile = same position on the canvas. Overlap nudging prevents stacking but keeps similar profiles clustered. No connection lines — "shared energy affinity" was an undefined concept and added visual noise without meaning. Positioning alone shows who shares energy tendencies.

**New hire modeller — three scenarios:** (1) No profile: hiring manager inputs estimate, marked as such, replaced when real profile exists. (2) Existing subscriber: explicit consent to contribute to team picture, declining has no bearing on hiring process. (3) Standard onboarding: 30-day settling period before profile influences team-level observations.

---

## WHAT CLAUDE IS MEASURING IN THE ASSESSMENT CONVERSATION

For each of the four energies, Claude attends to these six dimensions. They are not preferences — they are the scoring criteria.

1. **Spontaneous choice** — which energy orientation does the person default to when describing situations unprompted?
2. **Effort language** — are natural behaviours described as effortless ("I just...") or deliberate ("I had to force myself...")?
3. **Frequency signals** — how often does each energy appear across multiple independent situations in the conversation?
4. **Valence** — is the energy described with positive affect (preference) or negative affect (cost)?
5. **Cross-context consistency** — does the same energy appear across work, relationships, and pressure situations?
6. **Recovery pattern** — what does the person reach for when things go wrong or get hard?

Instinctive energies appear spontaneously, effortlessly, frequently, positively, consistently, and in recovery. Developing energies appear with effort language, low frequency, cost framing, context-specificity, and absence in recovery. All six dimensions together produce the energy ranking — not self-report alone.

---

## PRICING (decided)

| Tier | Price | Notes |
|------|-------|-------|
| Individual trial | Free for 14 days | Card required at sign-up. Full access — all four energies. Clock starts at sign-up. |
| Individual paid | £9.99/month or £79/year | Auto-converts at trial end |
| Organisational | £8/seat/month | Annual contract, min 10 seats. Team dashboard included. Team members register free. |
| Not-for-profit / charity | £6/seat/month | Applied in conversation, not advertised |
| Facilitator | £49/month (up to 20 active clients) | |
| Training partner seats | £5/seat/month | |

---

## OBSERVATION LIBRARY STATUS

All 73 observations written, saved in `hue-observations-v1.md`, and implemented in the app:
- 4 primary observations (one per energy, full mirror + in-practice + flex + surprise)
- 12 reach-position observations (4 energies × Fluent/Intentional/Developing)
- 12 two-energy pairings (1st + 2nd combination)
- 8 misread observations (2 per energy — what others see vs what's happening)
- 4 under pressure (with Jungian shadow dynamics)
- 4 leadership, 4 conflict, 4 relationships (companion-only, surfaced contextually)
- 8 flex crossings (dominant → each other energy)
- 7 near-equal combinations (triggered when top energies within close range)
- 6 profile shapes (specialist, natural flex, structural distance, quiet, high-range, power of lower)

**Bespoke observation:** Built. Second API call generates one unrepeatable observation from the specific conversation — the "only you" moment. Displayed at the top of the results screen.

**One sentence:** Built. Identity-distillation sentence generated from conversation, displayed on full-screen card with share and download.

**Note on observations voice:** All Fluent, Intentional, and Developing position observations celebrate what each energy adds — not describe it as a lesser version of the Instinctive. See section 72 of `hue-observations-v1.md` as the template philosophy.

---

## COMPETITIVE CONTEXT

Primary competitor: Insights Discovery. Most organisations bought it once (£85–130/person, static PDF, one workshop, then dormant). The Hue conversation opener: *"What happened to your last Insights Discovery profiles?"*

The answer is almost always: "We did a workshop, people liked it, and then nothing." That gap is where Hue lives. What they paid for is finished. Hue never is.

**C4D cross-reference:** The Clarity4D energy framework is closely aligned with Hue's four energies. See `hue-psychology-foundations-v1.md` Section 9 for the full attribute mapping. Never name or reference C4D in any user-facing material. For C4D-familiar practitioners, lead with method and depth as differentiators — conversation vs questionnaire, living profile vs static PDF, practice layer vs one-time workshop.

---

## CURRENT PRIORITIES

1. ✅ Rename Root → Tend throughout codebase
2. ✅ Implement real observations into app — all 73 observations live
3. ✅ Build trial/payment integration (Stripe)
4. ✅ Build user accounts and authentication
5. ✅ Trial email sequence
6. ✅ MailerLite subscriber sync
7. ✅ App gate
8. ✅ Maintenance mode
9. ✅ Results screen redesign — bespoke obs at top, four cards with celebratory position framing
10. ✅ Consent conversation built into onboarding flow
11. ✅ Bespoke observation (second API call)
12. ✅ Share my profile (link + session tokens)
13. ✅ EnergyWord component + colorize helper
14. ✅ Six scoring dimensions in assessment system prompt
15. ✅ Score-gap logic for profile shape observations
16. ✅ Org member registration flow (`/register-org`, no payment, data ownership messaging)
17. ✅ Team dashboard data model and architecture (bands, pipelines, sub-teams, roles)
18. ✅ Shareable result card (canvas PNG, "Save card" button)
19. ✅ Set Railway env vars — Stripe + APP_URL live
20. ✅ Create MailerLite custom fields — 11 fields set, backfill complete, tag names corrected
21. ✅ Day 12 email — testimonials matched by dominant energy (Rachel/Dom/Priya/Kiran)
22. ✅ Team dashboard overview screen (bands, member list, 32-dimension panel)
23. ✅ Cultural prompt before team visibility toggle — inline, exact strategy doc copy
24. ✅ Org admin interface (create team, invite members by email, view status, remove members)
25. ✅ Team constellation view (SVG spatial, no connection lines, list alternative for 10+)
26. ✅ 32-dimension panel — all 32 dimensions confirmed by Simon (Tend: +Consistency/Loyalty/Memory; Flow: Planning/Processes/Roles & Skills/Reflection/Clarity/Evidence/Learning/Systems)
27. ✅ Org member onboarding emails (4-email sequence: Welcome, First insight, Team context, Companion intro)
28. ✅ Invite email rewritten to language-guide standard
29. ✅ Register-org flow updated — auto-adds to team from invite link, validates org exists
30. ✅ Deploy to Railway — code live, TCMG org created on production
31. ✅ Bulk invite — textarea with confirmation, max 50 per batch
32. ✅ Org registration UX — personal email label, org code hidden from invite links, Simon auto-promoted to org-admin
33. ✅ Language and copy updates (language-brief.md) — registration subtitle, results learn-more, position sub-labels, trial expired screen, companion response length rules, band tooltips, org admin status labels, accessibility test added to language guide
34. ✅ Voice input — Web Speech API on assessment and companion chat, mic button, no backend changes
35. ✅ Observation truncation — long observations in energy cards truncated at sentence boundary, Read more/less inline, bespoke obs always full
36. ✅ hue-voice-v1.md integrated — master voice reference, redundant sections in language guide and email strategy replaced with pointers
37. Write `hue-launch-checklist.md`
36. Engage Nigel Evans — share `hue-psychology-foundations-v1.md` as starting brief for joint paper

---

## WHAT NOT TO DO

**All user-facing copy rules are in `hue-voice-v1.md`.** Read that document before writing any text a user will see. The banned phrasing list, autonomy voice rules, energy description rules, and accessibility test all live there.

**Architecture and code rules (not covered by voice doc):**
- Do not call the energy Tend "Root" — Root is retired as an energy name
- Do not surface raw percentages anywhere in the team dashboard UI — bands only
- Do not allow any individual behavioural data to cross from the personal companion pipeline into the team layer — these pipelines are architecturally separate and must stay that way
- Do not reopen any decision in this document without explicit instruction from Simon

---

*Part of The Change Maker Group ecosystem. IP belongs to Simon Phillips.*
