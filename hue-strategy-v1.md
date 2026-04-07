# Hue AI — Strategy & Build Documentation
**myhue.co · Living document · Started March 2026 · Updated April 2026**

---

## What Hue Is

A colour energy assessment and daily practice tool. Four energies — Spark, Glow, Tend, Flow — describe how individuals *tend to* show up, not who they are. Everyone has access to all four energies and can flex between them deliberately. Hue helps people understand their preferences and practise reaching for less-preferred energies to connect better with others.

**The core philosophy:** Energies are tendencies, not fixed traits. No energy is better than another. All four are always present — rankings reflect preference, not capability.

---

## Language Rules (Non-Negotiable)

These govern every word Hue produces — in the product, in copy, in observations, in documentation. Full reference in `hue-language-guide-v1.md`.

- **Always:** tends toward · naturally reaches for · feels most at home when · often draws on
- **Never:** leads with (as a verb tied to one colour) · can't do · is a [colour] person · your colour is
- **Never** imply any energy is unavailable to someone
- **Never** use clinical or assessment-speak — warm, curious, human at all times
- Individuals *choose* (out of preference) to draw on some energies more than others
- All four energies are always accessible — flex is always possible

**Autonomy voice:** Hue speaks to someone who already knows themselves. The observation confirms, it does not prescribe. The person is always the expert on their own life. Hue never positions itself as the authority on what someone should do, feel, or become. This principle governs every word in the product.

---

## The Four Energies

| Energy | Colour | Symbol | Core Description |
|--------|--------|--------|-----------------|
| Spark  | Red `#D92010`  | ◆ | Drive · Action · Ignition |
| Glow   | Yellow `#F5D000` | ● | Warmth · Optimism · Connection |
| Tend   | Green `#1A8C4E` | ▲ | Steadiness · Care · Depth |
| Flow   | Blue `#1755B8`  | ◉ | Clarity · Systems · Vision |

**Note on Tend:** The energy previously called Root is now called Tend everywhere it refers to the energy. The word "root" in plain English usage is unaffected.

**Canonical quadrant order (clockwise from TL):** Spark TL · Glow TR · Tend BR · Flow BL

**Colour-coded energy words:** Wherever Spark, Glow, Tend, and Flow appear in the web app, emails, or any digital output, they must be rendered in their energy colour. An `<EnergyWord>` component handles this. Plain text documents are exempt.

---

## What's Already Built

### Visual Identity System (`hue-identity-v1.jsx`)
- Complete colour token system (all 16 tokens — root tokens renamed to tend)
- HueLogo component — orbiting dots, all variants (light/dark/icon/float), all sizes
- EnergyCard component with animated progress bars
- ChatBubble component with typing indicator
- SwatchRow, SectionLabel components
- Three core screens: Welcome (dark), Assessment conversation, Results
- App header, navigation, progress indicator
- Elevation system, button system, energy tags
- Size scale, clear space rules, mark anatomy

### Motion (`spin-playground.jsx`)
- Speed, direction, dot scale, orbit radius all resolved
- Presets decided: Ambient (10s) for chat avatar, Alive (6s) for hero
- The H stays still. The colours move around it.

### Team Constellation (prototype)
- Live energy landscape visualisation built — see session notes April 2026
- Needs refinement for 10+ members with longer names
- List/table alternative view needed for larger teams
- Feeds into Team Dashboard section below

### Brand decisions made
- Fraunces (serif) for display · Plus Jakarta Sans for body
- Cream `#FDFAF4` primary background
- Ink `#1A1410` primary text
- cubic-bezier(0.23, 1, 0.32, 1) for all transitions
- Results stagger at 120ms · Chat bubbles slide up from 12px

---

## Competitive Strategy

### The moat isn't the colours
The four-colour framework is not protectable. The moat must live in the conversation, the data, the philosophy, and the individual ownership model.

### Primary moat sources

**1. The conversation as the product**
Every competitor uses a questionnaire. Hue's assessment is a conversation — and gets smarter with every iteration. The training data from real assessment conversations is the asset incumbents cannot replicate without rebuilding their entire product model.

**2. Individual data ownership**
HR tools own data on behalf of the employer. Hue's profile is the individual's — portable, persistent, theirs to carry between jobs and contexts. This is a public commitment made at launch, making it legally and reputationally costly to reverse.

**3. The whole-person scope**
HR tools are permitted to know you only inside work boundaries. Hue can know how energy expression shifts across work, relationships, parenting, creative life. That cross-context richness is completely out of bounds for any legitimate HR platform.

**4. Language philosophy as critique**
The language rules encode a different philosophy about human identity. Published openly as a manifesto, they make competitors look deterministic and reductive by comparison without Hue having to say a word.

**5. Longitudinal identity**
Today's tools give snapshots. Hue gives a living profile that tracks how energy expression shifts over time. The data asset this creates is impossible to replicate quickly.

**6. Team dynamics as B2B wedge**
Individual profiling is commoditised. Team profiling — collective energy landscape, where teams over-index, what they're missing — is where enterprise budget lives.

### Against HR tools specifically

The structural incompatibility with HR tools comes from four things:
- **Individual owns the profile** — not the employer
- **Whole person scope** — not just work context
- **Community and peer validation** — chosen, not administered
- **Speed of iteration** — weekly model improvements vs. annual enterprise releases

**Key moves against HR tools:**
1. Establish individual data ownership as a public commitment before enterprise customers can pressure otherwise
2. Build the alumni use case — profile travels with the person when they leave a job
3. Price individual tier accessibly without employer sponsorship
4. Build every feature for the individual first — opposite incentive structure to HR tools

### Reference tools (internal only — never name in user-facing copy)
- **What Colour Is My Parachute (Bolles):** Cross-check for overlap in self-discovery methodology and natural tendency framing. Hue's energy model and Parachute's "petal" approach share the philosophy that understanding natural preference informs how someone operates — not just what job they should do. Complementary rather than competitive; potential referral relationship with career coaches who use Parachute.
- **Team DyNAmics framework:** Reference only for team dashboard thinking (see Team Dashboard section below). Their IP — never name or reproduce in any Hue material.

---

## Product Architecture

### Assessment model
**Measuring:** Stable energy preference (who someone tends to be across time) — with a secondary 'how are you showing up today' layer added in Phase 3.

**What Claude is specifically looking for:** Six scoring dimensions applied to every assessment conversation — spontaneous choice, effort language, frequency signals, valence, cross-context consistency, and recovery pattern. See `hue-psychology-foundations-v1.md` Section 8 and `CLAUDE.md` for the full framework.

**Format:** Four conversation arcs, one per energy. All four available during trial. User controls pacing.

**Onboarding choice offered upfront:**
- *Quick hit* — one arc, full result, ~10 minutes. Come back when ready for the rest.
- *Full journey* — all four arcs, complete profile, ~40 minutes.

### The four arcs
Each arc is 10–15 conversational exchanges exploring one energy in depth — how it shows up for this person, their version of it, how it interacts with their other energies.

- **Arc 1:** Dominant energy — completes in first session, produces shareable result
- **Arc 2:** Second energy — how it shows up differently when it's not dominant
- **Arc 3:** Third energy — often the most surprising arc
- **Arc 4:** Least preferred energy — the flex frontier, where practice begins

All four arcs available during the 14-day trial. No artificial gating. User agency over pacing.

### Daily practice (post-arcs)
Once all four arcs complete, Hue becomes a practice tool — short sessions coaching the user to reach for a less-preferred energy in a real context they describe. This is the ongoing subscription mechanic.

### Gamification — Mini Missions
A structured layer of short, practical challenges sitting alongside the daily companion. Designed to make flex feel achievable and rewarding, not clinical.

**What mini missions are:** Specific, time-bound invitations to practise reaching for a less-preferred energy in a real-world context the user has described. Not generic tips. Grounded in what the person actually said in their conversation.

**Scope of missions — across all aspects of life:**
- Work and task management
- Time and focus
- Networking and relationship-building
- Communicating across energy styles
- Decision-making under pressure
- Sharing and visibility (making their work known)
- Supporting others
- Managing up and across

**Tone:** Always framed as an invitation, never an instruction. Consistent with autonomy voice. The mission is offered — the person decides whether to take it.

**Completion loop:** User reports back. Hue reflects on what they noticed. This creates the daily conversation hook and builds longitudinal data on flex development.

### Observations library
**Scope:** 40–60 observations covering all four energies and meaningful two-energy pairings.

**What an observation must do:** Produce one recognition moment — something the user didn't know about themselves but immediately recognises as true. Not a description. A mirror.

**Critical principle — celebrating all four energies:** Every energy position must be celebrated for what it specifically adds — not described as a lesser version of the instinctive. The Fluent (2nd), Intentional (3rd), and Developing (4th) position observations must each articulate the irreplaceable thing that energy contributes. See observation 72 ("The power of lower energies") as the philosophical foundation.

**Writing approach:**
- Collaborative: Claude drafts, founder reacts, Claude refines
- Read observations aloud — hearing them matters
- Vary rhythm, specificity, and emotional register across the set
- Check every observation against language rules before finalising

---

## Business Model & Pricing

### Trial model (decided April 2026)
**14-day trial** replaces free tier entirely. Full access — all four energy conversations, companion, daily emails. Clock starts at sign-up. Card required at sign-up for individuals (auto-converts or cancels). No card for org/team members — access managed under org contract.

**Post-trial hard stop:** Product is fully gated. "Your trial has ended. Subscribe to continue." Profile retained server-side — nothing lost. Day-14 email reassures: "Your profile is saved and waiting." No read-only access. See `hue-email-strategy-v1.md` for the full sequence.

### The flywheel (updated)
14-day trial → all four energies explored → high-intent card-confirmed conversion → word of mouth at work → manager asks what it is → inbound enterprise lead.

The trial model replaces the previous free tier flywheel. The card requirement means lower sign-up volume but significantly higher conversion intent (opt-out trial conversion benchmarks: 49–60% vs 18–25% for opt-in). Quality of trial users is the priority.

### Three buyer/user relationships

**The individual** — card at sign-up, 14-day trial, then subscriber. Owns their profile permanently. Takes it when they leave a company.

**The team** — purchased by a manager or People team. Team members register free under org contract — no trial clock, no card. Gives aggregate energy mapping, team composition insight, and Hue-guided prompts for the team's specific profile.

**The facilitator** — coach, L&D professional, therapist. Practitioner tier. Uses Hue with clients as a tool in their existing practice. Largely uncontested channel. Builds credibility fast.

### Pricing (decided)

| Tier | Price | Notes |
|------|-------|-------|
| Individual trial | Free for 14 days | Card required. Full access. Clock from sign-up. |
| Individual paid | £9.99/month or £79/year | Auto-converts at trial end |
| Organisational | £8/seat/month | Annual, min 10 seats. Team dashboard included. Members register free. |
| Not-for-profit / charity | £6/seat/month | In conversation only, not advertised |
| Facilitator | £49/month | Up to 20 active clients |
| Training partner seats | £5/seat/month | |

**Reference:** Headspace corporate model reviewed — individuals at £4.99/month, all content behind trial/paywall. Hue's pricing is at the higher end of the individual wellness app market, justified by the personalisation depth and AI cost per user.

---

## Results Screen — Redesign Brief

**Decision (April 2026):** The results screen must celebrate all four energies with equal presence — not display them as a hierarchy with three subordinate items.

**What this means in practice:**
- All four energy cards given visual weight and distinct framing
- Each card articulates what that specific energy position adds for this person — not just a score and a label
- The instinctive energy is not "the result" — the full picture of all four is the result
- The Developing (4th) energy is framed as a growth frontier, not a low score
- Observation hero remains first (full-bleed) — but the observation itself should ideally reference more than one energy

**This is a deliberate departure from how every existing tool works.** Most tools anchor everything on the dominant type and list the others as supporting information. Hue's position is that the second, third, and fourth energies are as interesting and as specific as the first — and the results experience must demonstrate that.

---

## Team Dashboard — Brief

The Team Dashboard is the B2B product layer. It sits above individual profiles — showing the collective picture, not personal data. This section defines what it should contain, the privacy architecture that governs it, and all resolved design decisions.

---

### Core principle — banded display throughout

All energy data in the team dashboard is displayed in bands, never as precise percentages. Raw percentages exist in the data model (Code needs them to calculate bands and detect shifts) but never surface in the UI.

**The three bands:**

| Band | Meaning | Display |
|------|---------|---------|
| Naturally present | This energy shows up without effort in this team | Full colour fill |
| Intentionally present | This energy is here but requires deliberate attention | Partial colour fill |
| Developing | This energy is the team's growth frontier | Outline only |

**Why banding, not percentages:**
Precise numbers invite reverse-engineering in small teams — 20% means one person in a team of five. Numbers also invite debate ("is 29% actually a problem?") where bands force a decision ("we're Developing in Tend — what do we do?"). The banding language maps directly onto the individual reach label set (Instinctive / Fluent / Intentional / Developing) so the vocabulary is consistent across personal profile and team picture. The new hire modeller shows band shifts (Developing → Intentionally present) rather than percentage deltas — more legible for a hiring conversation and impossible to reverse-engineer.

**This decision is non-negotiable.** Do not surface raw percentages anywhere in the team dashboard UI under any circumstances.

---

### Privacy architecture — two strict data pipelines

The team dashboard and the personal companion operate on strictly separate data pipelines. This is an architectural decision, not a policy — it must be built this way, not configured this way.

**Pipeline 1 — Team layer:**
Receives: energy band per member (calculated from profile scores). Nothing else.
Produces: aggregate team energy picture in bands, 32-dimension panel, gap radar, new hire modeller, constellation view.
Never contains: individual scores, individual behavioural patterns, longitudinal data per person, any data that could identify an individual's specific state.

**Pipeline 2 — Personal companion:**
Receives: full individual profile, all conversation history, longitudinal energy patterns.
Produces: personal observations, flex challenges, check-ins, "Hue has noticed..." prompts.
Never crosses into: the team layer. Ever.

Hue never surfaces individual behavioural patterns to anyone other than the individual themselves. The team leader sees "one or more members have been operating in high-Spark mode" — not which members. The member themselves sees it in their personal companion as a private check-in. That observation is theirs alone.

This separation must be stated publicly as part of the product's data commitment — not just a technical fact but a published promise. The onboarding conversation for every org member must include: "Here is exactly what your employer sees. Here is what only you see. These two things never mix."

---

### Team dashboard visibility model — who sees what

**Default: full team visibility.**

Every team member can see the team dashboard — the energy picture, the 32-dimension panel, the gap radar, the constellation. This is not a management report. It is a shared team resource. The default position is that the information belongs to everyone in the team equally.

This is a deliberate philosophical choice aligned with the organisational development principles of [lovingworkplace.org](https://lovingworkplace.org) — the belief that transparency, shared understanding, and psychological safety are the conditions under which people and teams genuinely flourish. A dashboard that only the leader sees is a surveillance tool with good intentions. A dashboard everyone sees is a shared language.

**The leader switch:**

Team leads can choose to move to leader-only visibility. This is not presented as a restriction option — it is presented as a cultural decision that requires deliberate consideration. When a team lead navigates to visibility settings, they encounter this before any toggle:

> *"By default, your team dashboard is visible to everyone on the team. This is intentional — the energy picture belongs to all of you, not just to you as the leader. Turning this off means only you see it. Before you do, it's worth asking: what does that choice signal to your team about how you intend to use this information? There's no wrong answer — but it's worth the conversation."*

Then, and only then, the toggle.

**Why the friction is the feature:**

The prompt before the toggle is not a warning — it is an organisational development intervention. It asks the leader to be conscious about a cultural choice they might otherwise make automatically. Many will read it and leave visibility on. Some will turn it off and be more thoughtful about how they share what they learn. A few will use the prompt as the opening for exactly the team conversation that Hue is designed to create. All three outcomes are good.

**What individual members always control:**

Regardless of the team visibility setting, each member's individual profile — their personal observations, their companion conversations, their longitudinal energy data — is always and only theirs. The team layer shows the aggregate. The personal layer is inviolable. The leader switching to leader-only visibility affects what team members see about the team — it has no effect on what anyone can see about any individual. Those pipelines are architecturally separate and that separation cannot be changed by any setting.

---

### Anonymity in small teams

**Minimum threshold for behavioural observations:** 8 members.

Below 8 members, the dashboard shows energy bands and the 32-dimension panel but suppresses any observation that could identify an individual — no "one or more members have been..." language, no gap observations that in a small team effectively point at a specific person.

**Banding protects small teams by default.** Because precise numbers are never shown, reverse-engineering ("Tend is 19% — that must be just Marcus") is not possible. The band ("Tend: Developing") tells the leader what they need to act on without revealing who.

**Consent-based individual visibility (opt-in):** Members can choose to make their energy band visible to their team lead or their whole team — beyond the default aggregate contribution. This is an explicit opt-in action in their personal settings, never a default. It respects autonomy and creates the possibility of team members who choose to be openly known — which some people will actively want.

---

### New hire modeller — process design

Three scenarios, each handled differently:

**Scenario 1 — Candidate has no Hue profile:**
The hiring manager inputs approximate energy bands based on interview observation. The modeller runs on this estimate and marks the result as "Based on interview estimate — not a verified profile." If the candidate is hired and completes their assessment, the estimate is replaced with their real profile and the team picture updates automatically.

**Scenario 2 — Candidate is an existing Hue subscriber:**
Their profile exists and belongs to them. They are asked: "Your prospective employer uses Hue for team insights. Would you like your energy profile to contribute to their team picture? Your individual result stays private — they see only the aggregate." This is an explicit consent action. Declining has no bearing on the hiring process (Hue never communicates consent decisions to employers).

**Scenario 3 — Standard org onboarding:**
New joiner completes assessment as part of onboarding. Profile feeds team dashboard once complete. A 30-day settling period applies before the profile influences team-level observations — early conversations may not yet reflect the stable profile.

**The onboarding note:** Every new hire modeller result includes a section on what the team needs to do to integrate this person's energy well. This is one of the highest-value outputs — specific, actionable, and impossible to get from any existing tool.

---

### Sub-teams

Sub-teams are fully supported. One person can belong to multiple teams — their profile contributes to each aggregate independently.

**Setup:** Org admin creates named teams, assigns members by email or @search, designates a team lead per team. Team leads see only their team's dashboard. Org admins see all teams. Members see nothing in the team layer — only their personal profile.

**Cross-team comparison (Phase 3):** "How does the leadership team's energy picture compare to the teams they lead?" If the leadership team is predominantly Spark and Flow and the delivery teams are predominantly Tend and Glow, there is a structural mismatch between how decisions get made and how they land. Hue names that. No existing tool can.

---

### The Constellation view
A live spatial representation of the team's energy landscape. Each team member appears as a node positioned by their energy band profile.

**Axis mapping (decided 7 April 2026):**
- X axis: Spark (right) ←→ Tend (left) — drive vs steadiness
- Y axis: Flow (top) ←→ Glow (bottom) — systems vs connection
- Same energy band profile = same position. Overlap nudging prevents stacking but keeps similar profiles clustered.

**No connection lines.** Connection lines were prototyped and removed — "shared energy affinity" was an undefined concept that added visual noise without conveying meaning. Proximity alone shows who shares energy tendencies.

**Current state:** Built and functional (April 2026). List/table alternative view available for teams of 10+. Ambient float animation on nodes.

**Display note:** Member nodes are labelled with initials only. Full names visible on hover. This reduces visual identification of individuals in the spatial layout.

---

### The 32-dimension functional panel
Surfaces what the team tends to do well and what it structurally tends to skip — the functional implications of the collective energy profile. Displayed in bands, never percentages.

**Relative ranking (decided 7 April 2026):** The four energies are ranked against each other by "Naturally present" count. The energy with the most naturally-present members = strongest (full dots), the energy with fewest = growth frontier (hollow dots), middle two = intentionally present (partial dots). This guarantees contrast regardless of team composition. Absolute thresholds were rejected because with varied profiles every energy gets covered by someone.

**Spark dimensions (what the team drives):**
Purpose · Vision · Decision · Transformation · Momentum · Courage · Ambition · Challenge

**Glow dimensions (how the team connects):**
Collaboration · Communication · Environment · Team Meetings · Celebration · Inclusion · Belonging · Energy

**Tend dimensions (what the team holds):**
Trust · Accountability · Commitment · Diversity · Wellbeing · Consistency · Loyalty · Memory

**Flow dimensions (what the team structures):**
Planning · Processes · Roles & Skills · Reflection · Clarity · Evidence · Learning · Systems

---

## Minimum Remarkable Product (MRP)

### MRP scope

| Item | Status |
|------|--------|
| Visual identity system | ✓ Done |
| All UI components | ✓ Done |
| 3 core screens | ✓ Done |
| HueLogo all variants | ✓ Done |
| Brand language rules | ✓ Done |
| Motion decisions | ✓ Done |
| Tend rename in all tokens and code | → Code |
| Wire ChatBubble to Claude API | → Code |
| System prompt + question flow | → Write |
| All four arc conversation flows | → Write |
| 40–60 result observations | → Write |
| Results screen redesign (celebrate all four) | → Code + Design |
| Consent-as-conversation (3 exchanges) | → Code |
| Trial/payment integration (Stripe, card at sign-up) | → Code |
| User accounts + authentication | → Code |
| Colour-coded EnergyWord component | → Code |
| Data ownership commitment (written + published) | → Write |
| Shareable result card | → Code |
| Emotional slow-down response in system prompt | → Write |
| Keyboard nav + WCAG AA verification | → Verify |

---

## Challenge Register

### Critical (must resolve before launch)

**What the assessment measures**
Decision: Stable energy preference, with situational 'showing up' layer in Phase 3. See `hue-psychology-foundations-v1.md` for full theoretical and methodological framework.

**Cold start problem**
Decision: Lead with the observation, not the percentages. The feeling of being seen comes first.

**The result that lands**
Decision: Redesign results screen — all four energies celebrated equally. Not a hierarchy. See Results Screen section above.

**Individual data ownership**
Decision: Publish as a named principle — 'Your Hue, your data' — in product and on site at launch.

**Trial model**
Decision: 14-day trial, card at sign-up, hard stop at expiry. See CLAUDE.md and `hue-email-strategy-v1.md`.

### High priority (resolve in Phases 1–2)

**Conversation length vs. accuracy**
Decision: 6–8 exchanges at launch. Architecture expandable without users noticing.

**Autonomy voice**
Decision: Named design principle — Hue speaks to someone who already knows themselves. Governs all copy. See `hue-language-guide-v1.md`.

**Flex surfaced in results**
Decision: Visible in results from day one. 'Your flex range' section showing all four energies as accessible.
Risk: Without this, Hue becomes what it's trying not to be.

**Consent architecture**
Decision: 3-screen conversation with Hue — not a modal. Meeting someone, not signing a form.

**Therapist-adjacent risk**
Decision: Graceful slow-down response designed into system prompt. Warm acknowledgment, gentle redirect.

**Gaming problem**
Decision: Behavioural, specific questions ('what did you do' not 'what do you prefer'). Unpredictable pivots.

### Medium priority (Phase 2–3)

**Accessibility**
Decision: WCAG AA from day one. Keyboard navigation. ARIA labels on ChatBubble components.

**Longitudinal story**
Decision: Start immediately even crudely. 'How are you showing up this week?' stored and shown back.

**Gamification / mini missions**
Decision: Build in Phase 2. See Mini Missions section above. Needs missions data model, completion tracking, and UI surface.

### Opportunities (Phase 3+)

**Facilitator market**
Decision: Don't build at launch. Design data model so facilitator view is a thin layer, not a rebuild.
Action: 'Share my profile' link in result is the facilitator entry point.

**Team Dashboard**
Decision: Architect individual profile data model to support aggregation from the start. Full brief above.

**AI help layer**
Decision: Phase 3. In-app AI to answer questions, monitor usage patterns, flag content for model improvement. Separate system prompt and conversation thread from the companion.

---

## Phasing

### Now — Already built
Visual identity, UI components, 3 screens, motion decisions, brand philosophy, Team Constellation prototype

### Phase 1 — MRP launch
Tend rename throughout · Trial/payment integration · User accounts · API integration · Question flows for all four arcs · 40–60 observations · Results screen redesign (all four celebrated) · Consent screens · EnergyWord component · Data ownership commitment · Shareable result card · Email sequence live

### Phase 2 — Depth + integrity
Flex surfaced in results · Gamification / mini missions · Gaming-resistant question pivots · Screen reader / ARIA · Profile export · Post-result check-in prompt · Data ownership badge in UI · Team Dashboard v1

### Phase 3 — Growth + longitudinal
Check-in mini-conversation · Energy timeline view · Flex-for-context prompt · Facilitator tier · AI help layer · Deeper assessment option · 'Showing up as' situational layer · Team Dashboard full (32-dimension panel, gap radar, @search)

---

## Key Decisions Log

| Decision | Rationale | Date |
|----------|-----------|------|
| Measure stable preference, not situational | Keeps first result grounded; situational layer adds depth in Phase 3 | Mar 2026 |
| All four arcs at launch, user controls pacing | Power users hit a wall if arcs gate post-launch; agency beats artificial friction | Mar 2026 |
| Individual owns the profile, not employer | Structural incompatibility with HR tools; must be public commitment before enterprise pressure | Mar 2026 |
| Observations before engineering in Weeks 1–3 | The observations are the moat; generic copy makes Hue just another tool | Mar 2026 |
| Consent as conversation, not modal | Philosophy must be felt before first question; lawyerly tone undermines brand | Mar 2026 |
| Lead result with observation, not percentages | Feeling of being seen comes first; numbers are context not revelation | Mar 2026 |
| Companies buy the team layer, not the individual layer | Individual ownership is the trust foundation; aggregate is the organisational value | Mar 2026 |
| Arc 1 generates the hook for Arc 2 from the conversation itself | Demand for subsequent arcs comes from genuine insight not marketing; pull not push | Mar 2026 |
| Root renamed Tend (energy name only) | Tend better captures the quality of that energy — steadiness, care, tending to things | Apr 2026 |
| 14-day trial replaces free tier | Card at sign-up drives 49–60% conversion vs 18–25% opt-in; quality over volume | Apr 2026 |
| Hard stop at trial expiry, no read-only access | Preserves urgency at highest conversion moment; profile retained server-side | Apr 2026 |
| Results screen redesigns to celebrate all four energies equally | Competitors anchor on dominant type; Hue's differentiation is the whole picture | Apr 2026 |
| Autonomy voice as named design principle | Hue speaks to someone who already knows themselves — the observation confirms, not prescribes | Apr 2026 |
| Colour-coded EnergyWord component — non-negotiable | Visual identity requires consistent colour rendering of energy names everywhere | Apr 2026 |
| Team Dashboard includes 32 functional dimensions | Goes beyond who the team is to what the team tends to do well and skip | Apr 2026 |
| All team dashboard data displayed in bands not percentages | Prevents reverse-engineering in small teams; forces decisions not debates; consistent with individual reach label vocabulary | Apr 2026 |
| Two strict data pipelines — team layer and personal companion never cross | Architectural decision not a policy; personal behavioural patterns never reach the team layer under any circumstances | Apr 2026 |
| Minimum 8 members for behavioural observations in team dashboard | Below threshold, banding alone protects anonymity; observations suppressed | Apr 2026 |
| Team dashboard default visibility: all members | Dashboard is a shared team resource not a management report; aligned with lovingworkplace.org OD principles | Apr 2026 |
| Leader can switch to leader-only visibility with deliberate friction | The prompt before the toggle is an OD intervention — makes the cultural choice conscious, not automatic | Apr 2026 |
| New hire modeller handles three candidate scenarios | No profile (estimate), existing subscriber (consent), standard onboarding (30-day settling period) | Apr 2026 |
| Sub-teams fully supported; one person can belong to multiple teams | Profile contributes independently to each team aggregate | Apr 2026 |

---

*Part of The Change Maker Group ecosystem. IP belongs to Simon Phillips.*
