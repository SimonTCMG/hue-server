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
- **Never** use the reductive reframe construction: *"This isn't X. It's Y."* / *"That's not X. It's Y."* — this phrasing is widely recognised as AI-generated and must not appear in any shareable material (observations, copy, client documents, social). It is permitted only in live Hue–user conversation within the app.
- Individuals *choose* (out of preference) to draw on some energies more than others
- All four energies are always accessible — flex is always possible

### Additional Language Rule — Internal vs. Client-Facing Terminology

The word "arc" is internal terminology only. It must never appear in any UI copy, result screens, emails, onboarding flows, prompts, or anything a user touches.

Client-facing language always frames the experience around the energy itself, never the structural unit containing it:

| Never say | Always say |
|-----------|------------|
| Start Arc 1 | Explore your dominant energy |
| Arc 1 complete | You know your [energy] well *(personalised to their result)* |
| Start Arc 2 | Ready to explore your [next energy]? |
| Arc 1 result | Your [energy] profile *(personalised to their result)* |
| You've completed 2 arcs | You've explored 2 of 4 energies |

**Critical framing:** The free tier is always the dominant energy — whichever energy the conversation reveals. Someone whose top energy is Flow gets their Flow exploration free. Someone whose top energy is Glow gets Glow. It is never assumed to be Spark. The free tier is personalised to the individual.

The user's mental model becomes "I've explored my [energy]" — not "I've done Arc 1." A new user never needs to learn what an arc is. They just explore an energy.

**Before shipping any user-facing string, check it contains no instance of the word "arc."**

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

### Live at myhue.co (as of 1 April 2026)
- Full assessment conversation — AI-conducted, 8–10 exchanges, all four energies scored
- Results screen — observation hero (mirror + in-practice bullets), four energy cards with reach labels, flex insight and surprise sections
- 16 primary observations written and live (4 energies × 4 reach positions: Instinctive / Fluent / Intentional / Developing)
- Consent conversation — three warm exchanges before assessment; skipped for returning users
- Companion chat — profile-aware, energy-specific suggested questions, memory-informed reflective opener
- Conversation memory — session summaries saved to SQLite, injected into companion system prompt on return
- Beta registration — invite-token gated, personal email, session cookies (1-year)
- Daily personalised email — Claude-generated, 8am UK via MailerSend; rotating content type (thought / question / experiment)
- MailerLite sync — beta testers added to "Hue Beta Testers" group with 10 custom energy fields
- Persistent SQLite at Railway Volume `/app/data`

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
| Wire ChatBubble to Claude API | ✓ Done |
| System prompt + question flow (8–10 exchanges) | ✓ Done |
| 16 primary observations (4 energies × 4 reach positions) | ✓ Done |
| Restructure result screen (observation hero first) | ✓ Done |
| Consent-as-conversation (3 exchanges) | ✓ Done — live in app |
| Beta registration + session persistence | ✓ Done |
| Daily personalised email (MailerSend, 8am UK) | ✓ Done |
| Conversation memory (session summaries, reflective opener) | ✓ Done — live in app |
| All four arc conversation flows | → Write (currently single assessment) |
| 40–60 result observations (pairings + misread + profile shape) | → Write (16 primary done) |
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
| Conversation memory uses session summaries not full transcript | Token-efficient; distilled insight is more Hue-like than raw recall; 2–3 sentences per session stored | Apr 2026 |
| Summary triggers: every 5th message + Home button | 5-message checkpoint covers tab-close; Home button gives clean final wrap; belt and braces | Apr 2026 |
| Reflective opener (Option A) — Hue opens with memory, not hardcoded line | Most human approach; immediately demonstrates return value; produces specific beta feedback | Apr 2026 |
| Consent copy frames notes as continuity, not surveillance | "Brief notes so I remember where we left off" — specific purpose stated; closes off implied alternative uses | Apr 2026 |
| Consent screen skipped for returning users via localStorage | Consent given once is sufficient; no friction on repeat visits | Apr 2026 |
| Energy-specific companion suggestions — dynamic from ranked profile | Generic suggestions replaced; primary, developing, and pairing questions drawn from actual profile | Apr 2026 |

---

## Next Session Priorities

1. **Confirm beta email** — check simon@simesco.co.uk for 8am send on 2 April 2026
2. **Invite beta team** — share `https://myhue.co/register?invite=BETA2026`
3. **Write next observation batch** — two-energy pairings (12 highest-differentiation), misread observations (8 highly shareable), profile shape (6 unique to Hue)
4. **Build bespoke observation** — second Claude API call post-assessment; one observation drawn from the specific conversation — the "only you" moment
5. **Build share my profile link** — facilitator entry point; spec in `hue-share-profile-spec-v1.md`
6. **Write hue-language-guide-v1.md** — single vocabulary reference for all copy decisions
7. **Write data ownership commitment** — one page, plain English, publish at launch
8. **Post-beta: build organisations + org_memberships tables** — required before first paid team account; schema documented in CLAUDE.md

---

*Add this file to the Hue Project in Claude so it's visible in every future session.*

---

## Commercialisation Strategy

*Added to strategy doc: 31 March 2026*

### Revenue Target: £1M Year 1

The path to £1M runs across three channels simultaneously. Retail grows organically through product sharing. B2B requires direct outreach from week one. The training partner channel multiplies both.

| Channel | Target | Unit value | Revenue |
|---------|--------|------------|---------|
| Individual subscribers | 2,000 annual | £79/yr | £158K |
| Organisational clients | 8 × 50 seats | £57.6K/yr each | £461K |
| Facilitator tier | 60 subscribers | £588/yr | £35K |
| Org training/onboarding add-on | 10 sessions | £5K each | £50K |
| **Indicative total** | | | **~£704K base** |

The gap to £1M closes through training partner channel revenue and organisational upsell. These are not stretch targets — they are the natural commercial extension of the product once the core arc and observations are built.

---

### Pricing Model (Decided)

| Tier | Price | Notes |
|------|-------|-------|
| Individual free | £0 | Dominant energy exploration — whichever energy the conversation reveals. Complete, remarkable, shareable |
| Individual paid | £9.99/month or £79/year | All four arcs + daily companion |
| Organisational | £8/seat/month | Annual contract, min 10 seats. Team dashboard included |
| Not-for-profit / charity | £6/seat/month | 25% sector discount — applied in conversation, not advertised publicly |
| Facilitator tier | £49/month | Up to 20 active clients |
| Training partner seats | £5/seat/month | Partner rate — see Training Partner section |

---

### The Three Customer Channels

#### 1. Retail (Self-development individuals)

**Acquisition model:** Arc 1 result card sharing drives organic growth — zero ad spend required. The shareable card shows all four energies with only the dominant one fully revealed. This creates peer conversation and inbound curiosity.

**Conversion mechanic:** Arc 1 generates a specific insight about the user's second energy from the conversation itself — not a generic tease. This creates genuine pull toward Arc 2 without marketing pressure.

**Key principle:** The free tier must be remarkable enough that people talk about it unprompted. A truncated or teaser free tier kills the flywheel. Arc 1 is complete, valuable, and shareable in its own right.

**Transition to paid:** Offered at end of Arc 1 with language like "When you're ready, that's where we go next." No urgency. No countdown. Autonomy respected throughout — consistent with Hue's philosophy.

#### 2. Organisational (Leaders buying for staff)

**What they're buying:** The team layer — aggregate energy mapping, composition analysis, Hue-generated prompts for the team's specific profile. They never see individual results.

**What individuals get:** Full platform access. Their profile belongs to them, not the employer. It travels with them when they leave.

**The internal selling point for People teams:** "Your profile is yours. We can't see your individual result. We only see the team picture." This is an easier internal sell than any existing tool.

**Acquisition motion:** Cannot wait for the organic flywheel alone — requires direct outreach to L&D directors and People teams from week one. Target 8 clients in Year 1.

#### 3. Facilitators and Coaches

**The pitch:** Not "cheaper Insights Discovery." It's "give your clients something that keeps working after you leave the room." The AI companion continues between sessions. No accreditation course required.

**Why this channel punches above its revenue weight:** Each facilitator using Hue with 15 clients creates 15 people who mention it at work. Some of those workplaces become organisational clients. The facilitator channel has a multiplier effect that retail and direct B2B don't.

**Early strategy:** Onboard 20–30 excellent coaches at no charge or heavily discounted rate before full commercial launch. These become advocates. Credibility in this channel compounds fast.

**Entry point:** A "share my profile" link in the result screen that lets a coach view a client's result within a session. Build this early.

---

### Training Company Partner Model

**Why this matters:** A CCS-listed training company gives Hue immediate access to public sector procurement without the admin overhead of a separate CCS listing. They bring existing L&D relationships where team development spend is already allocated — often on Insights Discovery (£85–130/profile, static PDF) or DISC. Hue replaces that product at lower cost with higher ongoing value.

**The win-win:**

*What the training company gets:*
- A recurring subscription revenue stream — structurally different from project-based delivery income
- Something to sell between workshops — Hue creates a reason to stay in contact with clients
- A differentiated product in a commoditised market where every competitor sells the same coloured wheel
- Better workshop material — the live team dashboard is richer than any static profile PDF

*What Hue gets:*
- CCS framework access through an established route
- Warm introductions into organisations already spending in this category
- Delivery credibility and facilitation expertise that makes the product more impactful
- A B2B sales channel that doesn't require Hue to build a direct enterprise sales function from scratch

**Decided commercial terms:**

| Term | Decision |
|------|----------|
| Revenue share | Flat 20% of licence value, ongoing. Simple to administer. |
| Partner seat pricing | £5/seat/month (vs standard £8) |
| White-labelling | Not now. Co-branding (partner logo alongside Hue) available. Revisit white-label at scale. |
| Exclusivity | Never granted. Preferred partner status available — better terms, priority support, joint case studies. |

**Two delivery models:**

*Model A — Referral/Reseller:* Partner introduces Hue to clients and earns 20% of licence value. Minimal delivery involvement beyond introduction and optional onboarding session. Works for partners with large client bases who want passive income from existing relationships.

*Model B — Integrated Delivery:* Partner wraps Hue into their workshop and programme design. They charge their normal day rate for facilitation. Hue is priced at £5/seat/month partner rate. Post-workshop, clients stay on Hue as a subscription and the partner earns 20% ongoing. This is the more valuable relationship for both sides.

**What to look for in a partner:** Before engaging any training company as a partner, establish:
- How many active public sector client relationships do they have where team development is in scope?
- Are they currently delivering Insights Discovery or a comparable tool?

If both answers are yes, they have clients already spending in this category. That's the profile to prioritise.

**Watch points:**
- *Accreditation expectations:* Some training companies are used to gated, certified tools. Frame Hue's open model as a feature: facilitators get everything they need without a costly certification course.
- *White-label requests:* Position is no for now. Co-branding available. Revisit at scale.
- *Exclusivity requests:* Never grant CCS or sector exclusivity. Preferred partner status only.

---

### Public Sector Procurement

**Beta / pilot pricing for public sector clients:** Do not offer a low price — offer a structured Beta Partnership with a waived licence fee.

A token price (e.g. £2/seat) creates procurement friction — purchase orders, budget codes, sign-off — with none of the benefits of a genuine partnership. Free with structure removes friction and secures commitment.

**What a Beta Partnership includes:**

*They get:* Full platform access for a defined cohort (20–50 people). Direct input into product development. First-mover pricing locked in on conversion to paid (£6/seat/month vs standard £8).

*Hue gets:* A named public sector reference client. Real usage data. A case study with a named quote from someone senior. A 30-minute debrief call at 6 weeks.

**Language rule:** Never call it free internally or in conversation. It is a waived licence fee during the Beta Partnership phase. This is a temporary commercial arrangement, not a gift.

**Sector pricing differentiation:**

| Sector | Price | Notes |
|--------|-------|-------|
| Private sector | £8/seat/month | Standard rate |
| Not-for-profit / charity | £6/seat/month | 25% discount — applied in conversation, not advertised |
| Public sector | £8 standard, £6 on conversion from beta | CCS framework route preferred for procurement simplicity |

**CCS listing:** Pursue own CCS listing in Phase 2 alongside the training partner route. Both paths run in parallel. The training partner route provides immediate access. The own listing provides independence and opens direct inbound from procurement portals. Worth doing once the first public sector reference client is secured and the product is stable.

---

### Individual Continuity — Changing Organisations

This is a trust-critical design decision. The profile belongs to the individual. The transition moment must honour that or it breaks the core promise.

**How it works:**

*During employment (org-sponsored):* Individual has a full account. Profile, history, and observations are theirs. The organisation sees only aggregate team data.

*When they leave:* Account does not disappear or lock. An automated email is triggered when the org licence lapses:

> "Your Hue profile is yours — it always has been. Your employer's licence has ended, but your profile, your results, and your history are still here. Continue with a personal subscription to keep your companion active."

*Grace period:* 30 days free access after org licence ends before subscription prompt. People hit a paywall the day they leave a job and abandon. 30 free days means they re-engage before the prompt arrives.

**Critical data model requirement:** Capture personal email at account creation, not just work email. Work emails die the moment IT access is cut. Frame the ask honestly during onboarding: "So your profile stays with you if you ever change jobs." Most users will give it without hesitation — it's in their interest.

Tag every org-sponsored account with both work email and personal email from day one. This single field retains subscribers who would otherwise be lost entirely at the point of highest transition motivation.

---

### Key Decisions Log (Commercialisation)

**All decisions below are resolved. Do not reopen without explicit instruction from Simon.**

| Decision | Rationale | Date |
|----------|-----------|------|
| Flat 20% ongoing revenue share for training partners | Simpler to administer than tiered model | Mar 2026 |
| Partner seat pricing £5/seat/month | Attractive enough to win partners, sustainable margin retained | Mar 2026 |
| No white-labelling now, revisit at scale | Protects brand building and individual ownership story | Mar 2026 |
| Pursue own CCS listing in Phase 2 alongside partner route | Independence from any single partner for public sector access | Mar 2026 |
| Beta partnerships waived licence fee, not discounted price | Removes procurement friction, positions as commercial arrangement not gift | Mar 2026 |
| Not-for-profit discount applied in conversation, not advertised | Prevents universal claiming, preserves relationship-based pricing | Mar 2026 |
| Capture personal email at org account creation | Retains subscribers through job transitions — single most important retention mechanic | Mar 2026 |
