# CLAUDE.md — Hue / myhue.co
*Master brief for all Claude sessions. Last updated: 7 April 2026.*
*Read this before doing anything. All decisions documented here are resolved unless Simon explicitly reopens them.*

---

## WHAT HUE IS

An AI-conducted colour energy assessment and ongoing companion. Through a natural conversation — not a questionnaire — Hue identifies how each person tends to show up across four energy dimensions. The result is a personalised profile with specific observations. The companion chat continues the relationship after assessment.

**Live at:** myhue.co
**Also accessible at:** hue-server-production.up.railway.app
**Owner:** Simon Phillips / The Change Maker Group

---

## CURRENT BUILD STATUS

### Working and live
- Full assessment conversation flow (AI-conducted, 6–8 exchanges)
- Four energy scores generated from conversation, with six-dimension scoring criteria in system prompt
- Results screen: observation hero + four energy cards with reach labels + bespoke observation
- Companion chat: profile-aware, responds to questions about results
- Returning user flow: shows last result, offers retake after 90 days
- Static SVG favicon
- Deployed on Railway, auto-deploys on GitHub push
- User registration, email login, session cookies
- SQLite user database with trial fields (trial_started_at, user_state, stripe_customer_id)
- Root → Tend rename complete throughout codebase and database (idempotent migration)
- `<EnergyWord>` component — energy names rendered in their colour everywhere in UI
- Assessment system prompt updated with all six scoring dimensions
- Trial gate: `individual-trial-expired` users see hard-stop TrialExpiredScreen
- Stripe integration: checkout (14-day trial), billing portal, webhook handler
- MailerLite sync: subscribers tagged with user_state on registration, assessment complete, and Stripe events
- Share my profile link (facilitator use case) — token-based, expiry, revoke
- Bespoke observation (second API call after assessment)
- One-sentence summary screen post-assessment
- Cross-device profile sync via server-side hydration

### Built but needs real content
- Consent conversation: drafted in `hue-consent-conversation-v1.md`, not yet built into app

### Stripe env vars needed in Railway before trial gate is live for real users
- `STRIPE_SECRET_KEY` — from Stripe dashboard
- `STRIPE_PUBLISHABLE_KEY` — from Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` — from Stripe webhook endpoint settings
- `STRIPE_PRICE_MONTHLY` — price ID for £9.99/month plan
- `STRIPE_PRICE_ANNUAL` — price ID for £79/year plan
- `APP_URL` — https://myhue.co

### Not yet built
- Score-gap logic (profile shape observations)
- Shareable result card
- Team dashboard
- Gamification / mini missions layer
- AI help layer
- @search for team members

---

## FILE LOCATIONS

| File | Purpose |
|------|---------|
| `public/hue.html` | Entire frontend — single HTML file, React via CDN |
| `server.js` | Node/Express backend, proxies Anthropic API calls |
| `.env` | Local API key (ANTHROPIC_API_KEY) |
| `hue-strategy-v1.md` | Full product strategy and decisions |
| `hue-commercialisation-v1.md` | Commercial model, pricing, channels — all decided |
| `hue-observations-v1.md` | 16 written observations + 71-observation scope plan |
| `hue-team-client-doc-v1.md` | One-page sales document for team buyers |
| `hue-consent-conversation-v1.md` | Three-exchange consent flow (not yet in app) |
| `hue-share-profile-spec-v1.md` | Spec for facilitator share link feature |
| `hue-psychology-foundations-v1.md` | Theoretical and psychological foundations — design constraint, not background reading |
| `hue-email-strategy-v1.md` | Trial email sequence, tagging structure, nurture flows — to be written |
| `hue-language-guide-v1.md` | Single vocabulary reference — to be written |
| `hue-launch-checklist.md` | Beta launch steps, BPS consistency, validation tasks — to be written |

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

**Post-trial (no payment):** Hard stop. Product is fully gated — "Your trial has ended. Subscribe to continue." Profile data is retained server-side (nothing is lost), but the experience is blocked entirely until subscription. No read-only mode, no partial access. The day-14 expiry email must reassure: "Your Hue profile is saved and waiting — pick up exactly where you left off." This preserves urgency at the highest conversion moment while removing fear of data loss. User moves to tagged email nurture sequence. No further AI calls until resubscription.

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

**Results screen:** Redesigned to celebrate all four energies equally. Observation hero first (full-bleed), then all four energy cards with reach labels and percentages — each with its own celebratory framing, not a hierarchy with three supporting items.

**Companion chat:** Profile-aware. Never gives advice — notices, reflects, asks. Has a graceful boundary response for conversations that feel heavier than an energy tool can hold. Speaks with autonomy voice at all times.

**Retests:** Unlimited, quarterly cadence default. If retest comes too soon, Hue notes it conversationally — not as a gate.

**Therapist-adjacent risk:** Hue never diagnoses, never names clinical states, never advises. Particularly important for low-energy profiles — frame as spaciousness, not deficit.

**Psychological validity:** Hue is a structured conversational AI instrument that measures behavioural energy preference through naturalistic language analysis across six explicit scoring dimensions (spontaneous choice, effort language, frequency signals, valence, cross-context consistency, recovery pattern). It does not claim to be a psychometric test in the clinical or regulatory sense. See `hue-psychology-foundations-v1.md` Section 8 for the full BPS-aligned framework. Nigel Evans is named collaborator for the joint validation paper.

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

16 observations written and saved in `hue-observations-v1.md`:
- All four energies × four reach positions (Instinctive / Fluent / Intentional / Developing)

71 observation headings scoped in full in the same file. Priority next batch (to write before first client demo):
- Two-energy pairings (12) — highest differentiation value
- Misread observations (8) — highly shareable
- Profile shape observations (6) — unique to Hue
- Flex crossing observations (4) — dominant→4th energy
- Under pressure (4)

**Bespoke observation (not yet built):** A second API call after assessment generates one observation drawn from the specific conversation — the "only you" moment. Draft prompt is in `hue-observations-v1.md`.

**Note on observations voice:** All Fluent, Intentional, and Developing position observations must celebrate what each energy adds — not describe it as a lesser version of the Instinctive. See section 72 of `hue-observations-v1.md` as the template philosophy.

---

## COMPETITIVE CONTEXT

Primary competitor: Insights Discovery. Most organisations bought it once (£85–130/person, static PDF, one workshop, then dormant). The Hue conversation opener: *"What happened to your last Insights Discovery profiles?"*

The answer is almost always: "We did a workshop, people liked it, and then nothing." That gap is where Hue lives. What they paid for is finished. Hue never is.

**C4D cross-reference:** The Clarity4D energy framework is closely aligned with Hue's four energies. See `hue-psychology-foundations-v1.md` Section 9 for the full attribute mapping. Never name or reference C4D in any user-facing material. For C4D-familiar practitioners, lead with method and depth as differentiators — conversation vs questionnaire, living profile vs static PDF, practice layer vs one-time workshop.

---

## CURRENT PRIORITIES

1. ✅ Rename Root → Tend throughout codebase (tokens, variables, stored data fields)
2. ✅ Implement real observations into app (all approved, delivered from `hue-observations-delivery-v1.md`)
3. Build consent conversation into onboarding flow (copy ready in `hue-consent-conversation-v1.md`)
4. ✅ Build trial/payment integration (Stripe — checkout, portal, webhook, trial gate, TrialExpiredScreen)
5. ✅ Build user accounts and authentication (email login, user states, MailerLite tagging)
6. Results screen redesign — celebrate all four energies (existing screen is functional; redesign to give positions 2–4 equal celebratory framing)
7. Set Stripe env vars in Railway (see "Stripe env vars needed" section above)
8. Write next batch of observations (pairings + misread + profile shape)
9. Write `hue-launch-checklist.md` (beta steps, BPS consistency, validation tasks)
10. Engage Nigel Evans — share `hue-psychology-foundations-v1.md` as starting brief for joint paper

---

## WHAT NOT TO DO

- Do not use the word "arc" in any user-facing copy
- Do not describe any energy as unavailable or locked
- Do not call anyone "a [energy] person" — energies are always verbs
- Do not call the energy Tend "Root" — Root is retired as an energy name
- Do not refer to any energy as leading, dominant in a hierarchical sense, or better than another
- Do not give advice in the companion — only notice, reflect, ask
- Do not name clinical states (depression, burnout) in any observation copy
- Do not describe Hue as a psychometric test in clinical or regulatory contexts
- Do not reopen any decision in this document without explicit instruction from Simon

---

*Part of The Change Maker Group ecosystem. IP belongs to Simon Phillips.*
