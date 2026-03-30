# Hue AI — Strategy & Build Documentation
**myhue.co · Living document · Started March 2026**

---

## What Hue Is

A colour energy assessment and daily practice tool. Four energies — Spark, Glow, Root, Flow — describe how individuals *tend to* show up, not who they are. Everyone has access to all four energies and can flex between them deliberately. Hue helps people understand their preferences and practice reaching for less-preferred energies to connect better with others.

**The core philosophy:** Energies are tendencies, not fixed traits. No energy is better than another. All four are always present — rankings reflect preference, not capability.

---

## Language Rules (Non-Negotiable)

These govern every word Hue produces — in the product, in copy, in observations, in documentation.

- **Always:** tends toward · naturally reaches for · feels most at home when · often draws on
- **Never:** leads with (as a verb tied to one colour) · can't do · is a [colour] person · your colour is
- **Never** imply any energy is unavailable to someone
- **Never** use clinical or assessment-speak — warm, curious, human at all times
- Individuals *choose* (out of preference) to draw on some energies more than others
- All four energies are always accessible — flex is always possible

---

## The Four Energies

| Energy | Colour | Symbol | Core Description |
|--------|--------|--------|-----------------|
| Spark  | Red `#D92010`  | ◆ | Drive · Action · Ignition |
| Glow   | Yellow `#F5D000` | ● | Warmth · Optimism · Connection |
| Root   | Green `#1A8C4E` | ▲ | Steadiness · Care · Depth |
| Flow   | Blue `#1755B8`  | ◉ | Clarity · Systems · Vision |

**Canonical quadrant order (clockwise from TL):** Spark TL · Glow TR · Root BR · Flow BL

---

## What's Already Built

### Visual Identity System (`hue-identity-v1.jsx`)
- Complete colour token system (all 16 tokens)
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

---

## Product Architecture

### Assessment model
**Measuring:** Stable energy preference (who someone tends to be across time) — with a secondary 'how are you showing up today' layer added in Phase 3.

**Format:** Four conversation arcs, one per energy. All four available at launch. User controls pacing.

**Onboarding choice offered upfront:**
- *Quick hit* — one arc, full result, ~10 minutes. Come back when ready for the rest.
- *Full journey* — all four arcs, complete profile, ~40 minutes.

### The four arcs
Each arc is 10–15 conversational exchanges exploring one energy in depth — how it shows up for this person, their version of it, how it interacts with their other energies.

- **Arc 1:** Dominant energy — completes in first session, produces shareable result. This is the MRP hook.
- **Arc 2:** Second energy — how it shows up differently when it's not dominant
- **Arc 3:** Third energy — often the most surprising arc
- **Arc 4:** Least preferred energy — the flex frontier, where practice begins

All four arcs ready at launch. No artificial gating. User agency over pacing.

### Daily practice (post-arcs)
Once all four arcs complete, Hue becomes a practice tool — short sessions coaching the user to reach for a less-preferred energy in a real context they describe. This is the ongoing subscription mechanic. Like Duolingo but for human energy flexibility.

### Observations library
**Scope:** 40–60 observations covering all four energies and meaningful two-energy pairings.

**What an observation must do:** Produce one recognition moment — something the user didn't know about themselves but immediately recognises as true. Not a description. A mirror.

**Writing approach:**
- Collaborative: Claude drafts, founder reacts, Claude refines
- Read observations aloud — hearing them matters
- Vary rhythm, specificity, and emotional register across the set
- Check every observation against language rules before finalising
- The observations that get screenshotted and shared are the ones that feel weirdly specific

**Structure per energy:**
- Core observation (the mirror moment)
- What this looks like in practice (3 concrete, recognisable behaviours)
- Flex insight: 'When you deliberately reach for [other energy]...'
- 'You might surprise people who expect you to...'

---

## Business Model & Pricing

### The core tension — resolved
The Duolingo comparison applies to the *experience mechanic* (short sessions, progressive practice, habit formation) but not the business model. The better parallel is Calm or Headspace — consumer products individuals love that companies buy in bulk because the benefit is visible at the organisational level.

**The resolution:** Individuals own their profile and experience. Companies sponsor access and get visibility into the *aggregate* — not individual data, but the collective picture. What energies does our team tend toward? Where are we thin? What does our leadership group look like as a whole?

**Companies buy the team layer, not the individual layer.** Individual experience stays personal, autonomous, and trustworthy. Companies get the organisational intelligence that sits above it.

This is also the internal selling point for People teams: *"Your profile is yours. We can't see your individual result. We only see the team picture."* That's a fundamentally easier internal sell than any existing tool.

### Three buyer/user relationships

**The individual** — pays for themselves or gets sponsored. Owns their profile permanently. Takes it when they leave a company.

**The team** — purchased by a manager or People team. Gives aggregate energy mapping, team composition insight, and Hue-guided prompts for working better together given their collective profile.

**The facilitator** — coach, L&D professional, therapist. Practitioner tier. Uses Hue with clients as a tool in their existing practice. Largely uncontested channel. Builds credibility fast.

### Pricing model (to mull over)

**Individual — £8–12/month or £70–90/year**
Free tier: Arc 1 only (dominant energy, shareable result — complete enough to feel genuinely valuable, not a teaser).
Paid: All four arcs + daily practice.
*The free tier is the enterprise sales funnel. Employees discover Hue individually before companies adopt it.*

**Team — £6–9/seat/month (billed to company)**
Minimum meaningful size: ~5 seats.
Includes everything in individual plus team dashboard — aggregate energy map, composition analysis, Hue-generated prompts for the team's specific profile.
Per-seat price lower than individual: volume and contract stability justify it; needs to feel like an easy budget decision for a team of 10–20.

**Facilitator — £30–50/month (up to 20 active clients)**
Lightweight client management view, ability to share results within a session, priority access to new arc content.
High-margin, high-credibility. Facilitators become advocates.

**Enterprise — custom**
SSO, aggregate reporting across departments, HR tool integration, white-glove onboarding.
Not a Year 1 focus — but architecture should support it from the start.

### The flywheel
Individual free tier → word of mouth at work → manager asks what it is → inbound enterprise lead.
This is the Slack growth model. Individual adoption inside organisations creates bottom-up pressure that converts to team contracts. Only works if Arc 1 is remarkable enough that people talk about it unprompted.

**Pricing principle to anchor to:** The price should never be the reason someone doesn't complete their profile. Get the individual price wrong and the enterprise pipeline never fills.

---

## Driving Demand Across All Four Arcs

### The problem
Arc 1 will feel complete to many users. They won't know what they're missing — and telling them "there are three more arcs" before Arc 1 has proven its value is the wrong sequence.

### The solution: Arc 1 creates the pull for Arc 2 from the conversation itself

Hue has enough data from the Arc 1 conversation to make a genuinely specific observation about the user's *second* energy — not a generic tease, but something that lands because it's derived from what they actually said.

Example of the transition moment:
*"The way you described how you approach new relationships suggests your Glow energy is closer to the surface than your ranking might imply. That's worth exploring — people whose second energy is Glow often find it's the one others see before they do."*

This is not marketing. It's a real insight. It creates genuine curiosity rather than manufactured urgency. The mechanic: **Arc 1 generates the specific hook for Arc 2 from the conversation itself.**

### The result screen as an incomplete picture

All four energies visible in the result from the start — but Arc 1 only fully illuminates one. The other three are present but unresolved. Not locked with a paywall banner, not greyed out with a padlock. Just quieter. Less defined. Waiting.

This mirrors the truth: you have all four energies, but you only deeply understand one yet. The incompleteness is honest, not manipulative. The natural human response to seeing three unexplored energies — after Arc 1 has proven Hue's insights are specific and surprising — is wanting to understand the whole picture.

### The transition language at the end of Arc 1

Craft matters here. Not "unlock Arc 2" — that's transactional. Closer to:

*"You now have a clear picture of how your [energy] tends to show up. But here's what's interesting — [energy] looks and feels different depending on what's sitting next to it. Your second energy shapes it in ways that are often invisible until you look directly at them. When you're ready, that's where we go next."*

*When you're ready* does important work — it respects autonomy, consistent with the whole philosophy. No urgency. No pressure. Just genuine curiosity opened up.

### The social mechanic

Shareable Arc 1 result card shows all four energies — with only the dominant one fully revealed. Recipients who are Hue users immediately understand what the incomplete ones mean. Recipients who aren't, ask.

Creates peer conversation: *"Have you done your other arcs yet? My Root arc completely changed how I understood my Arc 1 result."* Peer conversation is far more compelling than any in-product prompt.

### The team layer as Arc completion accelerant

A team dashboard that shows "3 members have completed all arcs, 4 have completed one" creates gentle social visibility — not shame, but presence. Teams whose members have all completed arcs get access to richer collective insight than partially complete teams. This gives companies purchasing the team tier a legitimate reason to actively encourage staff to complete all four arcs. Organisational value increases meaningfully with each arc completed across the team.

### The one thing to avoid

Don't tell people they need the other arcs to get the full picture *before* Arc 1 has proven it delivers one. Earn the trust first. The sequence is always: **delight → curiosity → return.** In that order. Always.

---

## Minimum Remarkable Product (MRP)

### Launch readiness: 3–4 weeks

**What makes it remarkable, not just minimum:**
The observations are the moat. A technically working assessment with generic result copy is just another tool. The 40–60 observations, written with craft, are what make someone screenshot their result and come back.

### MRP scope (Weeks 1–3)

| Item | Status |
|------|--------|
| Visual identity system | ✓ Done |
| All UI components | ✓ Done |
| 3 core screens | ✓ Done |
| HueLogo all variants | ✓ Done |
| Brand language rules | ✓ Done |
| Motion decisions | ✓ Done |
| Wire ChatBubble to Claude API | → Build |
| System prompt + question flow (6–8 exchanges, branching) | → Write |
| All four arc conversation flows | → Write |
| 40–60 result observations | → Write |
| Restructure result screen (observation hero first) | → Build |
| Consent-as-conversation (3 exchanges, existing components) | → Build |
| Data ownership commitment (written + published) | → Write |
| Shareable result card | → Build |
| Emotional slow-down response in system prompt | → Write |
| Keyboard nav + WCAG AA verification | → Verify |

---

## Challenge Register

### Critical (must resolve before launch)

**What the assessment measures**
Decision: Stable energy preference, with situational 'showing up' layer in Phase 3.
Action: Document as a one-pager that all future build decisions reference.

**Cold start problem**
Decision: Lead with the observation, not the percentages. The feeling of being seen comes first.
Action: Write 40–60 observations before any other content work. These are the product.

**The result that lands**
Decision: Restructure Screen 03 — observation card full-bleed at top, ranked cards below.
Action: Hero typographic moment ('You tend toward X first') needs more visual weight.

**Individual data ownership**
Decision: Publish as a named principle — 'Your Hue, your data' — in product and on site at launch.
Action: Build profile export (JSON + readable format) even if unused — signals the commitment.

### High priority (resolve in Phases 1–2)

**Conversation length vs. accuracy**
Decision: 6–8 exchanges at launch. Architecture expandable without users noticing.

**How flex is surfaced**
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
Note: Language rules are already a head start — plain warm language is more accessible language.

**Longitudinal story**
Decision: Start immediately even crudely. 'How are you showing up this week?' stored and shown back.

### Opportunities (Phase 3+)

**Facilitator market**
Decision: Don't build at launch. Design data model so facilitator view is a thin layer, not a rebuild.
Action: 'Share my profile' link in result is the facilitator entry point.

**Team dynamics**
Decision: Architect individual profile data model to support aggregation from the start.

---

## Phasing

### Now — Already built
Visual identity, UI components, 3 screens, motion decisions, brand philosophy

### Phase 1 — Weeks 1–3 (MRP launch)
API integration · Question flows for all four arcs · 40–60 observations · Result screen restructure · Consent screens · Data ownership commitment · Shareable result card

### Phase 2 — Weeks 4–6 (Depth + integrity)
Flex surfaced in results · Gaming-resistant question pivots · Screen reader / ARIA · Profile export · Post-result check-in prompt · Data ownership badge in UI

### Phase 3 — Weeks 7–10 (Growth + longitudinal)
Check-in mini-conversation · Energy timeline view · Flex-for-context prompt · Facilitator waitlist · Deeper assessment option · 'Showing up as' situational layer

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
| Free tier = Arc 1 complete, not a teaser | Arc 1 must be remarkable enough to drive word of mouth; a truncated free tier kills the flywheel | Mar 2026 |
| Arc 1 generates the hook for Arc 2 from the conversation itself | Demand for subsequent arcs comes from genuine insight not marketing; pull not push | Mar 2026 |
| Result shows all four energies from day one, three unresolved | Incompleteness is honest and curiosity-creating; not a dark pattern — a true picture of where the user is | Mar 2026 |

---

## Next Session Priorities

1. **Decide combinatorial scope** — primary energy only, or meaningful two-energy pairings? (Changes scope from ~40 to ~60 observations)
2. **Begin observations work** — start with Flow (already in example result screen), draft core observation + 3 behaviours + flex insight + Arc 1→2 transition hook
3. **Write the system prompt** — assessment persona, question flow, emotional slow-down, language rules baked in
4. **Write data ownership commitment** — one page, plain English, publish at launch
5. **Design the unresolved energy states** — how the three non-Arc-1 energies appear visually in the result screen (present but quieter, not locked)

---

*Add this file to the Hue Project in Claude so it's visible in every future session.*
