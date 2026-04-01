# CLAUDE.md — Hue / myhue.co
*Master brief for all Claude sessions. Last updated: 1 April 2026 (beta infrastructure added).*
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
- Four energy scores generated from conversation
- Results screen: observation hero + four energy cards with reach labels (Instinctive / Fluent / Intentional / Developing)
- Companion chat: profile-aware, responds to questions about results
- Returning user flow: shows last result, offers retake after 90 days
- Static SVG favicon
- Deployed on Railway, auto-deploys on GitHub push

### Beta infrastructure (built, needs Railway deployment steps before launch)
- User registration at `/register?invite=TOKEN` — name + email, invite-token gated
- Session cookies — persistent identity across visits (1-year cookie, httpOnly)
- SQLite user store (`hue.db`) — name, email, scores, reach labels, dominant energy
- MailerLite subscriber sync — adds beta testers to "Hue Beta Testers" group with energy fields
- Assessment completion saves to server (`POST /api/complete`)
- Daily email cron — 8:00 AM UK time, Claude-generated personalised content, uses `hue-email-template.html`
- **BEFORE deploying:** see Railway deployment steps below

### Built but needs real content
- Observation copy: placeholder text in app — real observations drafted in `hue-observations-v1.md`, not yet implemented
- Consent conversation: drafted in `hue-consent-conversation-v1.md`, not yet built into app

### Not yet built
- Second API call for bespoke conversation-generated observation
- Score-gap logic (profile shape observations)
- Share my profile link (facilitator use case)
- Shareable result card
- Team dashboard
- Payment integration
- Free-tier restriction (dominant energy only) — public app currently shows all four scores

---

## FILE LOCATIONS

| File | Purpose |
|------|---------|
| `public/hue.html` | Entire frontend — single HTML file, React via CDN |
| `server.js` | Node/Express backend — Anthropic proxy, registration routes, daily email cron |
| `db.js` | SQLite user store — schema + query helpers |
| `mailerlite.js` | MailerLite REST API helpers — subscriber upsert, transactional send |
| `hue-email-template.html` | Daily email HTML template — variables: `{{FIRST_NAME}}` etc. |
| `.env` | Local secrets — see `.env.example` for all required variables |
| `.env.example` | Documents all required environment variables |
| `hue-strategy-v1.md` | Full product strategy and decisions |
| `hue-commercialisation-v1.md` | Commercial model, pricing, channels — all decided |
| `hue-observations-v1.md` | 16 written observations + 71-observation scope plan |
| `hue-team-client-doc-v1.md` | One-page sales document for team buyers |
| `hue-consent-conversation-v1.md` | Three-exchange consent flow (not yet in app) |
| `hue-share-profile-spec-v1.md` | Spec for facilitator share link feature |

**GitHub:** github.com/SimonTCMG/hue-server (private)
**Railway project:** humorous-sparkle / production
**DNS:** Cloudflare (nameservers: jose.ns.cloudflare.com + magdalena.ns.cloudflare.com)

---

## BEFORE DEPLOYING BETA — RAILWAY SETUP

SQLite (`hue.db`) is wiped on every Railway redeploy. Do this before pushing the beta build:

**Option A — Railway Volume (simplest)**
1. Railway project → + New → Volume
2. Mount path: `/app/data`
3. In `db.js`, change the db path line to: `const db = new Database("/app/data/hue.db");`

**Option B — Railway Postgres (more robust)**
1. Railway project → + New → Database → PostgreSQL
2. Railway sets `DATABASE_URL` automatically
3. Replace `db.js` with a `pg`-based version (ask Claude Code to do this)

**Environment variables to set in Railway:**
- `ANTHROPIC_API_KEY` — already set
- `MAILERLITE_API_KEY` — from app.mailerlite.com → Integrations → API
- `FROM_EMAIL` — e.g. `hello@myhue.co` (must be authenticated in MailerLite)
- `INVITE_TOKEN` — e.g. `BETA2026` (change before sharing)
- `NODE_ENV` — set to `production`

**Beta invite link:** `https://myhue.co/register?invite=BETA2026`
(Replace BETA2026 with whatever you set INVITE_TOKEN to)

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
| Root | Green `#1A8C4E` | Steadiness · Care · Depth |
| Flow | Blue `#1755B8` | Clarity · Systems · Vision |

Every person has access to all four. The assessment measures preference — which energies someone tends to reach for most naturally. Rankings reflect preference, not capability.

---

## CRITICAL LANGUAGE RULES — apply to every word in the product

### Energies are verbs, never nouns
- **Never:** "a Spark person", "she's a Flow type", "your energy is Root"
- **Always:** "reaching for Spark energy", "tends to show up with Glow energy", "naturally reaches for Flow"

### The word "arc" is internal only — never in user-facing copy
| Never say | Always say |
|-----------|------------|
| Start Arc 1 | Explore your dominant energy |
| Arc 1 complete | You know your [energy] well |
| Arc 1 result | Your [energy] profile |
| You've completed 2 arcs | You've explored 2 of 4 energies |

### Free tier framing
The free tier is always the **dominant energy** — whichever the conversation reveals. If someone's top energy is Flow, they get their Flow exploration free. Never assume or imply it is Spark. It is personalised to the individual.

### Banned phrasing
- **"This isn't X. It's Y."** / **"That's not X. It's Y."** — recognised AI-generated phrasing. Never in any shareable material. Permitted only in live companion conversation inside the app.
- **"Available"** as a reach label — implies others are unavailable. Use the approved label set below.
- **"Unlock"** — transactional, wrong tone
- **"Arc"** in anything user-facing

### Approved reach label set (energy position labels)
| Position | Label |
|----------|-------|
| 1st | Instinctive |
| 2nd | Fluent |
| 3rd | Intentional |
| 4th | Developing |

### When scores are close
When two or more energies are similarly scored, rank order is less meaningful than the scores themselves. The report should acknowledge closeness explicitly. Never present a 3rd-ranked energy at 62% the same way as a 3rd-ranked energy at 31%.

---

## KEY PRODUCT DECISIONS (all resolved)

**Assessment format:** Conversational, AI-conducted, 6–8 exchanges per energy exploration. Behavioural questions ("what did you do") not hypothetical ("what would you prefer").

**Free tier:** Dominant energy exploration only — complete, remarkable, shareable. Never a teaser. The free tier must be good enough to drive word of mouth unprompted.

**Paid tier:** All four energy explorations + daily companion. The distinction is accuracy (deeper picture from more conversations), not feature gating.

**Individual owns the profile:** Not the employer. Profile is portable — travels with the person if they leave a company. This is a public commitment, not a policy.

**Consent:** Three conversational exchanges before assessment begins — warm, not legal. Already drafted in `hue-consent-conversation-v1.md`.

**Results screen:** Observation hero first (full-bleed), energy cards below with reach labels and percentages.

**Companion chat:** Profile-aware. Can discuss any energy but is honest about accuracy limits for unexplored energies. Never gives advice — notices, reflects, asks. Has a graceful boundary response for conversations that feel heavier than an energy tool can hold.

**Retests:** Unlimited, quarterly cadence default. If retest comes too soon, Hue notes it conversationally — not as a gate.

**Therapist-adjacent risk:** Hue never diagnoses, never names clinical states, never advises. Particularly important for low-energy profiles (all energies low) — frame as spaciousness, not deficit.

---

## PRICING (decided)

| Tier | Price |
|------|-------|
| Individual free | £0 — dominant energy exploration |
| Individual paid | £9.99/month or £79/year |
| Organisational | £8/seat/month, annual contract, min 10 seats |
| Not-for-profit / charity | £6/seat/month — applied in conversation, not advertised |
| Facilitator | £49/month (up to 20 active clients) |
| Training partner seats | £5/seat/month |

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

---

## COMPETITIVE CONTEXT

Primary competitor: Insights Discovery. Most organisations bought it once (£85–130/person, static PDF, one workshop, then dormant). The Hue conversation opener: *"What happened to your last Insights Discovery profiles?"*

The answer is almost always: "We did a workshop, people liked it, and then nothing." That gap is where Hue lives. What they paid for is finished. Hue never is.

---

## CURRENT PRIORITIES

1. Implement real observations into app (copy is ready in `hue-observations-v1.md`)
2. Build consent conversation into onboarding flow (copy ready in `hue-consent-conversation-v1.md`)
3. Write next batch of observations (pairings + misread + profile shape)
4. Build bespoke conversation-generated observation (second API call)
5. Build share my profile link (facilitator entry point)
6. Write hue-language-guide-v1.md (single vocabulary reference)

---

## WHAT NOT TO DO

- Do not use the word "arc" in any user-facing copy
- Do not describe any energy as unavailable or locked
- Do not call anyone "a [energy] person" — energies are always verbs
- Do not assume the free tier is Spark — it is always the dominant energy
- Do not give advice in the companion — only notice, reflect, ask
- Do not name clinical states (depression, burnout) in any observation copy
- Do not reopen any decision in this document without explicit instruction from Simon

---

*Part of The Change Maker Group ecosystem. IP belongs to Simon Phillips.*
