# CLAUDE.md — MyHue / myhue.co
*Master brief for all Claude sessions. Last updated: 16 April 2026 (MyHue rebrand + daily email energy rotation session).*
*Read this before doing anything. All decisions documented here are resolved unless Simon explicitly reopens them.*

---

## WHAT MYHUE IS

MyHue is an AI-conducted colour energy assessment and ongoing companion. Through a natural conversation — not a questionnaire — the product identifies how each person tends to show up across four energy dimensions. The result is a personalised profile with specific observations. The companion chat continues the relationship after assessment.

**The product is MyHue. The companion is Hue.** In all UI copy, marketing, and external communications the product is always MyHue. In the companion chat, Hue speaks — "Hi, I'm Hue" — as the named presence inside MyHue. Never refer to the companion as MyHue.

**Live at:** myhue.co
**Also accessible at:** hue-server-production.up.railway.app
**Owner:** Simon Phillips / The Change Maker Group

---

## CURRENT BUILD STATUS

**Railway billing: Hobby plan ($5/month). Stable. See RAILWAY BILLING section below.**

### Working and live
- Full assessment conversation flow (AI-conducted, 6–8 exchanges, six scoring dimensions in system prompt)
- Four energy scores generated from conversation
- Results screen: redesigned — bespoke observation at top ("only you", always shown in full), four energy cards each with position-specific celebratory framing (Instinctive/Fluent/Intentional/Developing) plus sub-labels ("This is where you go first" / "You move here easily when it helps" / "You reach for this when the situation calls for it" / "There's more here for you when you're ready"), flex and surprise cards, extended observations. Long observations truncated at ~200 chars at sentence boundary (180–220 range, always at full sentence end) with "Read more" / "Read less" inline toggle. Learn-more prompt uses accessible language (no framework vocabulary in navigation). Card 1 (Instinctive) expanded by default, cards 2-4 collapsed with prominent "More" / "Less" toggle in energy colour (not accordion — cards toggle independently). Nav bar pinned at top (sticky) so Home icon is always reachable. Extended/additional cards (flex, surprise, misread, profile shape, etc.) use four-colour gradient border (Spark→Glow→Tend→Flow) with ink headings and cream background — not instinctive energy colour
- Bespoke observation: second API call generates one unrepeatable observation from the specific conversation
- One sentence: identity-distillation sentence, shareable, with canvas download
- Observation library: all 16 primary observations live (4 energies × 4 reach positions), plus 12 pairings, 8 misread, 4 under pressure, 4 leadership, 4 conflict, 4 relationships, 8 flex crossings, 7 near-equal, 6 profile shapes — all in companion and results
- Score-gap logic: profile shape observations triggered by wide gap, near-zero, all-high, all-low, all-equal patterns
- Consent conversation: three-exchange conversational flow before first assessment (ConsentScreen component, stored in localStorage)
- `<EnergyWord>` component: renders Spark, Glow, Tend, Flow in their energy colours throughout the app
- `colorize()` helper: auto-wraps energy names in EnergyWord within any text string
- Voice input: browser-native Speech Recognition (Web Speech API) on both assessment and companion chat. Microphone button next to send, pulses red while listening, input field shows "Listening..." placeholder. No backend, no API keys, no cost. Falls back gracefully if unsupported. Works in Chrome and Safari.
- Companion chat: profile-aware, coaching register, colour energy in coaching, conversation memory (summaries), anniversary sentence, pre/post situation practice. Response length rules enforced in system prompt: max 2 sentences of observation before a question, one question per response, no affirmation openers ("That's a really interesting reflection..."), match the person's energy/length. Fixed-position fullscreen layout with pinned header (Home icon always visible), 680px centred card on desktop, full width on mobile. Input row uses flex layout with `minWidth: 0` on text input, `flexShrink: 0` on buttons, `overflow: hidden` on container — submit button always visible on mobile.
- Assessment chat: same fixed-position layout as companion — pinned header with Home icon, centred card on desktop, full width on mobile
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
- Invite email: language-guide-compliant, explains what MyHue is, states data ownership, links to `/register-org`. Uses proper email HTML template.
- Returning user flow: shows last result, offers retake after 90 days. `registered_at` stored at registration. `retest_available_at` stored at assessment completion (in `/api/complete`) — precisely 90 days after the assessment, not registration. Updated on every retake. Never recomputed at render time.
- Beta user state: `beta-user` — full access, no trial clock, no Stripe, suppressed from trial emails, beta welcome email only. `BETA_EMAILS` env var in Railway controls who gets beta status on registration. Beta users skip the payment/plan screen entirely on registration (frontend checks userState and calls onRegistered directly).
- Account settings screen: accessible from welcome screen, shows current email/name/account type, email change flow
- Email change flow: authenticated session initiates, confirmation via new email only (24h token), old email gets notification (informational, bounce harmless), MailerLite atomic sync on change. Account settings accessible regardless of subscription state.
- Returning user branch on `/register-org`: recognises existing accounts, attaches team membership without creating duplicate, handles state transitions (subscription pause, email sequence switching), sends welcome-back email instead of 4-email onboarding for users with existing profiles
- Stripe customer creation on-demand: users without Stripe records (beta, org members) get customer created at point of first subscription, not at registration
- Subscription pause/resume: org join pauses active individual subscription (billing stops, record preserved), org lapse auto-resumes paused subscription seamlessly. `subscription_paused_at` and `subscription_paused_reason` tracked per user.
- Welcome-back email: single email for returning users joining new org — acknowledges they know MyHue, names the team, reminds of data ownership. Suppresses standard 4-email sequence.
- Maintenance mode: `MAINTENANCE_MODE` env var closes site instantly (Stripe webhook still passes through)
- Tend rename: complete throughout codebase (tokens, variables, stored data, migration for old profiles)
- Marketing page at `/about`: standalone HTML file (`public/about.html`), fully isolated from app — no session logic, no React component tree overlap. Served via dedicated route in server.js. Sections: hero (88vh with animated SpinMark and scroll chevron), WIIFM section (ink background, EnergyIcon + statement rows with staggered scroll-reveal), companion conversation (typewriter animation triggered by IntersectionObserver — types in sequentially, plays once), how it works (three steps with EnergyIcon accents and italic scenario hooks), social proof (three placeholder testimonials in Fraunces — ready for real beta quotes), trial reassurance (decorative EnergyIcon row above four statements), final CTA (ink background, Spark-red button), minimal footer. All animations respect `prefers-reduced-motion`. WCAG AA contrast throughout — uses `#73685A` for secondary text instead of app's `#9B8E7E` stone.
- Subscription management in account settings: "End trial early" (one-tap cancel with inline confirm) for trial-active users; interval-aware "Manage subscription" (Stripe billing portal redirect) for subscribers — shows monthly/annual plan and renewal date, displays remaining access clearly if already cancelled. Not shown to org members or beta users.
- API endpoints: POST /api/account/cancel-trial, POST /api/account/billing-portal, GET /api/account/subscription
- Privacy & Terms page at `/privacy`: standalone HTML file (`public/privacy.html`), same styling as about.html. Three sections: Your conversations (full privacy explanation), Your profile (ownership statement), The legal version (placeholder for formal T&C pre-launch). Footer link present in both `about.html` and `hue.html`. Consent conversation includes "By continuing you're agreeing to our Privacy & Terms" link below the Continue button. Companion system prompt includes privacy Q&A guidance so Hue can answer privacy questions accurately in conversation.
- Daily email: personalised AI-generated email sent at 8am UK to all subscribers/org members/beta users. Four-colour top bar (Spark/Glow/Tend/Flow stripes), cream background, two energy badges (focus energy + instinctive), energy names in body copy rendered in energy colours via `formatEmailCopy()`. CTA button ink black. Footer: "MyHue · myhue.co — Your profile belongs to you." Email header: static spin logo (H with four colour dots in quadrant positions — Spark TL, Glow TR, Tend BR, Flow BL) plus MyHue wordmark in Georgia serif. The red-u 'hue' text mark is retired. Animated logo not possible in email — static only. Content generated by Claude Sonnet 4.5 with full profile context. `stripMarkdown()` safety net strips residual formatting. Context block marked internal-only to prevent profile data leaking into email body.
- Daily email energy rotation: weekly focus mode cycle across all four energy positions — instinctive (Sun/Thu), fluent (Mon/Fri), intentional (Tue/Sat), developing (Wed). Each mode has a distinct content instruction: instinctive (what it makes possible), fluent (what it adds alongside instinctive — name the combination), intentional (precision when reached for — not a gap), developing (where practice has most visible impact — never a weakness). Rotation invisible to recipient — no energy name in body copy, badges only. Subject line includes energy name on intentional/developing days only.
- Two-facts technique: occasional overlay (~1 in 7 emails, fires every other Wednesday on developing day) — exactly two standalone sentences, both observable behaviours, no connective, no question, no follow-up. The reader closes the gap. Never on fluent days. Content type label stays as "A thought for today" on two-facts days.
- Companion language fixes: no outcome-forecasting, no readiness/preparation language, no direct instructions ("pause and ask yourself"), both forms of banned rhetorical construction listed ("This isn't X. It's Y." / "That's not X. That's Y."), additional banned phrases added (see WHAT NOT TO DO section)
- Static SVG favicon, PWA manifest
- Deployed on Railway, auto-deploys on GitHub push

### Team dashboard — UI built
- Team dashboard overview at `/team/:teamId`: four energy band bars (all full colour — visual weight from bar length, not opacity), member count, member list with initials in instinctive energy colour, subtle tinted card backgrounds per member. Band labels have hover tooltips ("The team reaches for this without thinking" / "The team brings this deliberately when it's needed" / "This energy is available — the team is still building its reach here")
- Member list: shows all four energy band dots per person (not just instinctive colour) — reinforces that everyone has access to all four energies. Legend in its own visually separated row above the member list (not inline with heading), 14px circle dots (solid = Naturally present, partial fill = Intentionally present, hollow = Developing), subtle background, 12px label text. Status indicators: green tick for profile complete, sand "Not yet started" pill for pending members. Names dimmed when incomplete.
- 32-dimension functional panel: four quadrants (Spark/Glow/Tend/Flow), each showing 8 confirmed dimensions as dots. Qualifying text per quadrant based on relative ranking — energies ranked against each other so the team always sees contrast (strongest, present-but-deliberate, growth frontier). Legend in header row. Spark: Purpose/Vision/Decision/Transformation/Momentum/Courage/Ambition/Challenge. Glow: Collaboration/Communication/Environment/Team Meetings/Celebration/Inclusion/Belonging/Energy. Tend: Trust/Accountability/Commitment/Diversity/Wellbeing/Consistency/Loyalty/Memory. Flow: Planning/Processes/Roles & Skills/Reflection/Clarity/Evidence/Learning/Systems.
- Team constellation view: SVG spatial layout using consistent X/Y axis mapping — X: Spark (right) vs Tend (left), Y: Flow (top) vs Glow (bottom). Same energy bands = same position. Overlap nudging prevents stacking. No connection lines (removed — "shared energy affinity" was undefined and meaningless). Ambient float animation, quadrant glow, Fraunces labels at edges. Initials on nodes (disambiguated to first 4 chars of first name when two members share the same initials), full name on hover. List/table alternative for teams of 10+.
- Cultural prompt inline above visibility toggle — exact copy from strategy doc. Toggle only for team-lead/org-admin. Green when full_team, sand when leader_only.
- Restricted view for members when leader_only visibility is set
- Dashboard reveal gate: dashboard hidden from members until team lead reveals it. Team lead sees the full live dashboard with a reveal banner at top (progress bar, "X of Y profiles complete", reveal button). Members see only a progress screen ("Your team's energy picture is being built"). When all profiles are in, prompt changes to "Everyone's in. Ready to share the team picture?" Once revealed, permanently visible — future team changes reflected organically. `dashboard_revealed` column on teams table, PUT `/api/team/:teamId/reveal` endpoint.
- Observations threshold notice: below 8 members, shows progress message

### Team data model and architecture
- DB tables: `organisations`, `teams`, `team_members`, `team_energy_bands`
- Band calculation: 33%+ Naturally present, 22–32% Intentionally present, <22% Developing (percentage-of-total model — 4 energies sum to 100%, baseline 25%)
- Two strict data pipelines enforced at DB level — team layer stores bands only, never raw scores
- Sub-team support: user can belong to multiple teams, profile contributes independently to each
- Roles: org-admin (all teams), team-lead (their teams), member
- Aggregate function: band counts per energy, observations suppressed below 8 members
- Auto-sync: assessment completion pushes bands to all teams user belongs to. Team dashboard endpoint also auto-syncs missing bands on load (handles case where user completed assessment before being added to a team)

### Org admin — UI built
- Org admin screen at `/org/:orgId`: create teams, invite members by email (sends invite via MailerSend with data ownership message), view all members with status (Profile complete / Joined, not started / Invited), remove members, assign team leads. Member status reads from canonical `assessment_completed_at` on users table. Filter controls: filter by team (dropdown) and filter by status (All / Profile complete / Pending)
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
- Invite URL bug fixed: trailing slash on APP_URL no longer produces double-slash (`//register-org`) in invite links
- Invitations table: tracks pending invitations, visible on both org admin and team dashboard. Invited-but-not-registered members show as "Invited" with pending styling
- Temp admin delete endpoint: `DELETE /api/admin/delete-user/:email` (authenticated via SESSION_SECRET header) — used for beta testing cleanup, to be removed post-beta
- Beta tester flow tested: simon@simesco.co.uk registered as beta-user, skipped payment screen, received welcome email, completed assessment

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

### Admin architecture — not yet built (decisions made 8 April 2026)
- Platform super-admin role and UI (`/admin` route, env-gated, separate credential from user roles)
- Facilitator role and portfolio dashboard
- Facilitator org creation flow (facilitators create client orgs directly)
- Seat overflow detection and notification system
- Research data layer (anonymised aggregate pipeline, opt-in consent, 30-day lag)
- See full spec below under ADMIN ARCHITECTURE

### Internal notifications — not yet built (decisions made 8 April 2026)
- Team lead threshold emails (50% complete, all complete / reveal prompt)
- Org admin weekly in-app digest (aggregate completion rates, no email)
- Member reminder emails (org-admin controlled toggle, Hue sends direct to member)
- See full spec below under INTERNAL NOTIFICATIONS

---

## FILE LOCATIONS

| File | Purpose |
|------|---------|
| `public/hue.html` | Entire frontend — single HTML file, React via CDN |
| `public/about.html` | Marketing page at `/about` — standalone, no shared state with app |
| `public/privacy.html` | Privacy & Terms page at `/privacy` — standalone, same style as about.html |
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

**Colour-coded energy words:** Wherever the words Spark, Glow, Tend, and Flow appear in the web app, emails, or any digital output, they must be rendered in their energy colour. This is a non-negotiable design standard. An `<EnergyWord>` component handles this. Plain text contexts are exempt.

**Energy icons (`<EnergyIcon>` component):**
Each energy has a dedicated SVG line icon rendered in its energy colour, inside a rounded-square container with the energy's light background colour. Usage: `<EnergyIcon energy="spark" size={28} />`. Pass `noContainer` for the raw SVG without the background pill.

| Energy | Icon | SVG description |
|--------|------|-----------------|
| Spark | Lightning bolt | Single path: zigzag bolt (`M13 2L5 13h7l-1 9 9-12h-7z`) |
| Glow | Concentric circles | Two circles: outer r=9, inner r=4 — reads as a radiating sun/warmth |
| Tend | Leaf | Two paths forming a leaf shape with a central vein, plus a short stem line |
| Flow | Double wave | Two horizontal sine-wave paths stacked — reads as flowing water/current |

Icons scale with `size` prop (default 28px). Stroke weight scales inversely — thinner at larger sizes (1.8 at 64px+, 2.2 at 28px) for visual consistency. Container has `borderRadius: size * 0.28`.

**Glow — two rendering contexts (finalised 9 April 2026):**
`#F5D000` (`colors.glow`) — all fills: bars, dot fills, circle fills, avatar borders, card backgrounds, canvas result card. Always full opacity, never faded.
`#C8960C` (`colors.glowOnLight`) — all Glow text on light backgrounds: EnergyWord, colorize(), constellation label, companion header, results card title, functional dimensions header, any Glow text on cream/white/glowLight. Avatar borders always use `colors.glow`, never `glowOnLight`. This is non-negotiable and applies system-wide.

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

### Reserved words — spark, glow, tend, flow
These four words are the names of the Hue energies. They must not appear as plain English verbs, nouns, or adjectives anywhere in Hue-authored text. Using them in any other sense risks confusing users who will read them as energy names.

**Never write:**
- "you tend to reach for…" (use: you often / you naturally / you frequently)
- "that could spark something interesting" (use: ignite / trigger / open up)
- "the conversation has a natural flow" (use: rhythm / momentum / ease)
- "there's a warm glow to how you show up" (rewrite the sentence)
- "you tend toward your Tend energy" (same word in two senses — never)
- "things flow well when you reach for Flow" (plain and energy-name in one sentence — never)

**Exception:** If a user uses one of these words in their own message, the companion may echo it back once within that response as natural conversation. The companion must not then build further sentences that continue using the word in its plain sense.

Full rules and alternatives table: `hue-language-guide-v1.md` section 1a.

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
- Pipeline 1 (team layer): receives energy band per member plus the user's stored `dominant_energy` label (both are band-level labels, never raw scores). Produces aggregate picture, 32-dimension panel, gap radar, constellation, new hire modeller. Never contains individual scores, behavioural patterns, or longitudinal data. `dominant_energy` is the canonical source for each member's instinctive energy colour on the dashboard — avatar rings, constellation nodes, member list initials. This matches what the user sees on their own results screen, and works for every profile shape including those whose top energy doesn't reach the "Naturally present" band threshold.
- Pipeline 2 (personal companion): receives full individual profile and history. Never crosses into the team layer. Ever.
Individual behavioural patterns (overstretch, check-ins, longitudinal observations) go only to the individual via their companion — never to the team layer or the team lead.

**Team dashboard — default visibility is full team.** Every member sees the same dashboard. Aligned with lovingworkplace.org OD principles — the dashboard is a shared team resource, not a management report. Team leads can switch to leader-only visibility, but only after encountering a deliberate prompt that asks them to consider the cultural implications of that choice. The friction before the toggle is intentional — it is itself an OD intervention.

**Team dashboard — reveal gate:** Dashboard is hidden from members until the team lead explicitly reveals it. The team lead sees the full live dashboard as it builds (with a reveal banner at the top showing progress). Members see only a progress screen until reveal. This turns the dashboard into a team moment — an exciting reveal once everyone has their profile. Once revealed, permanently visible. Future team changes (new members, retakes) are reflected organically with no second gate. The team lead can reveal early if they choose.

**Team dashboard — minimum threshold:** Below 8 members, behavioural observations are suppressed. Banding alone protects anonymity at small team sizes.

**Team dashboard — sub-teams:** Fully supported. One person can belong to multiple teams; their profile contributes independently to each aggregate. Org admins see all teams; team leads see only their team; members see the team dashboard (by default) but no individual data beyond their own.

**Team dashboard — band bar styling:** All bars rendered in full energy colour. Visual weight comes from bar length (how many members fall in that band), not from opacity or fill style. Pale/hollow bars were rejected — not impactful enough.

**Team dashboard — band thresholds (percentage-of-total model):** Since four energies sum to 100% (baseline 25% each), the thresholds are: 33%+ = Naturally present, 22–32% = Intentionally present, <22% = Developing. The original 65%/40% thresholds were unreachable in this model.

**Team dashboard — functional dimensions use capped relative ranking:** The 32-dimension panel ranks the four energies against each other by "Naturally present" count across the team, but the label is capped by the best actual band for that energy. If nobody on the team scores "Naturally present" in an energy, the panel never labels it "Naturally present" — it caps at "Intentionally present" or "Developing" based on what actually exists. This prevents false "strongest" labels when a team is small or developing across the board. The qualifying text adapts: "Naturally present" = strongest/well covered; "Intentionally present" with nat > 0 = present but deliberate; "Intentionally present" with nat = 0 = reaches deliberately; "Developing" = growth frontier.

**Team dashboard — member list shows all four energies:** Each member row displays four band dots (Spark/Glow/Tend/Flow) below their name, not just their instinctive energy colour. This reinforces that every person has access to all four energies. The initials avatar still uses the instinctive energy colour, but the full picture is always visible.

**Team constellation — axis logic:** X axis maps Spark (right) vs Tend (left). Y axis maps Flow (top) vs Glow (bottom). Same energy band profile = same position on the canvas. Overlap nudging prevents stacking but keeps similar profiles clustered. No connection lines — "shared energy affinity" was an undefined concept and added visual noise without meaning. Positioning alone shows who shares energy tendencies. Position formula uses relative ratios: `xNorm = Spark% / (Spark% + Tend%)`, `yNorm = Flow% / (Flow% + Glow%)` — documented in code comment block (confirmed 7 April 2026). The dominant energy (`instinctiveEnergy`) receives a 0.25 weight boost so it pulls harder than other energies sharing the same band — this prevents a member with Glow instinctive + Tend "Naturally present" from appearing equidistant between both quadrants.

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
| Individual paid | £9.99/month or £79/year | Auto-converts at trial end. Multi-currency — see table below. |
| Organisational | £8/seat/month | Annual contract, min 10 seats. Team dashboard included. Team members register free. |
| Not-for-profit / charity | £6/seat/month | Applied in conversation, not advertised |
| Facilitator | £49/month (up to 20 active clients) | |
| Training partner seats | £5/seat/month | |

### Multi-currency individual pricing (live — 12 April 2026)

Explicit prices per currency, fixed (not floating with exchange rates). UK GBP is the anchor. International prices set at fair purchasing-power-adjusted equivalents, rounded to psychologically clean price points. **Review annually** to adjust for exchange rate changes.

**Monthly:**

| Currency | Price | Market |
|----------|-------|--------|
| GBP | £9.99 | UK |
| USD | $12.99 | US |
| AUD | A$14.99 | Australia |
| CAD | C$14.99 | Canada |
| EUR | €11.99 | Europe |
| NZD | NZ$16.99 | New Zealand |
| SGD | S$16.99 | Singapore |
| AED | AED 47.00 | UAE |

**Annual:**

| Currency | Price | Market |
|----------|-------|--------|
| GBP | £79 | UK |
| USD | $99 | US |
| AUD | A$119 | Australia |
| CAD | C$119 | Canada |
| EUR | €95 | Europe |
| NZD | NZ$129 | New Zealand |
| SGD | S$129 | Singapore |
| AED | AED 369 | UAE |

Any currency not in the above list falls back to GBP. No auto-conversion or estimation.

**How it works:** Cloudflare's `CF-IPCountry` header detects the visitor's country. `getCurrencyForRequest()` in server.js maps country → currency. `GET /api/pricing` returns local currency/symbol/prices to the frontend. `POST /api/create-checkout` selects the correct Stripe Price ID from env vars (`STRIPE_PRICE_MONTHLY_{CURRENCY}`, `STRIPE_PRICE_ANNUAL_{CURRENCY}`). Falls back to GBP if a currency-specific env var is missing.

**Stripe:** 16 Price objects on the Hue product (8 currencies × 2 intervals). Price IDs stored as Railway env vars. Org/facilitator/training pricing is not multi-currency — individual subscription only.

**Country → currency mapping:** US→USD, CA→CAD, AU→AUD, NZ→NZD, SG→SGD, AE→AED, Eurozone (AT/BE/CY/EE/FI/FR/DE/GR/IE/IT/LV/LT/LU/MT/NL/PT/SK/SI/ES)→EUR, everything else→GBP.

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
37. ✅ Dashboard reveal gate — hidden from members until team lead reveals, team lead sees live dashboard with banner, permanent once revealed
38. Write `hue-launch-checklist.md`
39. Engage Nigel Evans — share `hue-psychology-foundations-v1.md` as starting brief for joint paper

**UI/UX fixes — completed 11 April 2026:**

69. ✅ Org admin member status fix — reads from canonical `assessment_completed_at`, added team + status filter controls
70. ✅ Multi-team profile association fix — auto-syncs missing energy bands on dashboard load
71. ✅ Mobile submit button clipping fix — flex layout with `minWidth: 0`, no horizontal overflow
72. ✅ Results screen nav pinned (sticky) — Home icon always reachable
73. ✅ Constellation positioning formula verified — ratio formula with code comment block
74. ✅ Results energy cards collapse/expand — card 1 open, cards 2-4 collapsed, independent More/Less toggle
75. ✅ Registration date stored at registration. Retest date (`retest_available_at`) stored at assessment completion in `/api/complete` — 90 days after assessment, not registration. Updated on every retake. Never recomputed at render time.
76. ✅ Legend dots fixed (14px circles, not ovals) — own visually separated row, larger text, subtle background
77. ✅ Additional result cards four-colour gradient border — ink headings, cream background, EnergyWord unchanged

**Marketing page — live:**

67. ✅ `/about` marketing page built and deployed — hero, WIIFM, companion chat, how it works, social proof, trial reassurance, final CTA, footer
68. ⬜ Replace placeholder testimonials in `/about` social proof section with real beta feedback (three slots, marked with PLACEHOLDER comments in `public/about.html`)

**Multi-currency pricing — live:**

78. ✅ Multi-currency individual pricing — 8 currencies (GBP, USD, AUD, CAD, EUR, NZD, SGD, AED), Cloudflare geo-detection, dynamic frontend pricing, Stripe Price IDs in Railway env vars, test script (`test-currency.js`). Prices to be reviewed annually for exchange rate adjustment.

**Admin architecture — not started:**

40. ⬜ Platform super-admin: `/admin` route, env-gated, separate credential, audit log table (`platform_admin_log`)
41. ⬜ Facilitator role: `facilitators` table, portfolio dashboard, org creation flow
42. ⬜ Data model: add `facilitator_id` and `contracted_seats` / `active_seats` to `organisations` table
43. ⬜ Seat overflow: detection logic, facilitator email notification, org-admin in-app notice, overflow flag in platform admin view
44. ⬜ Research data layer: third pipeline, opt-in consent checkbox in onboarding, 30-day lag, anonymised aggregate only — required for Nigel Evans validation study

**Internal notifications — not started:**

45. ⬜ Team lead threshold emails: 50% profiles complete (informational) + all profiles complete ("Everyone's in — ready to reveal?") — no individual attribution in either
46. ⬜ Org admin weekly digest: in-app only (not email) — aggregate completion rates per team, no individual names
47. ⬜ Member reminder emails: opt-in per org, controlled by org admin — org admin sets deadline, toggles Hue-sent reminders on/off, Hue sends direct to member (not via org admin), no individual data shared with org admin

**Beta launch + account continuity — COMPLETE:**

48. ✅ Beta user state: `beta-user` in permitted access states, trial email suppression, daily email whitelist
49. ✅ BETA_EMAILS env var: matching email sets state to `beta-user` on registration
50. ✅ Beta welcome email: `sendBetaWelcomeEmail()` — warm, honest, no clock, feedback invite
51. ✅ Team Hue Demo: second team in TCMG org (`hue-demo-team-001`), Simon auto-added as org-admin
52. ✅ Email change flow: AccountSettingsScreen, POST `/api/account/change-email`, GET `/api/account/confirm-email/:token`, 24h token expiry, MailerLite atomic sync (delete old + create new), old email notification
53. ✅ Returning user branch on `/register-org`: existing users get team membership attached, state transitions handled, welcome-back email if profile exists, standard onboarding if new
54. ✅ Stripe customer creation: `/api/create-checkout` creates Stripe customer on-demand for users without one (beta users, etc.)
55. ✅ Subscription pause/resume: org join pauses active sub via Stripe API (`pause_collection`), org lapse auto-resumes. `subscription_paused_at` and `subscription_paused_reason` columns added. `/api/account/lapse-org` endpoint
56. ✅ Email sequence logic: state transitions suppress/redirect emails correctly — trial suppressed on org join, subscriber sequence pauses while org-covered, nurture sequence for lapsed with no sub
57. ✅ Welcome-back email: single email for returning users joining org, suppresses 4-email sequence when `assessment_completed_at` exists

**Polish and voice pass (9 April morning):**

58. ✅ Member list mobile fix: Admin/Lead pill wrapped with name row instead of end-of-row, energy band dots allowed to wrap, no more overlap on narrow screens
59. ✅ Daily email copy: "your profile is right here whenever you want to explore this further" → "whenever you want to pick this up, I'm here" (voice-aligned, not misleading about destination)
60. ✅ Companion opener: "Your full colour profile is here. You tend to reach for X first — your Instinctive energy. What would you like to explore?" → "I've got your colours. What's on your mind?" (chattier, no reserved-word collision, no overpromise about what the companion shows)
61. ✅ Copy invite link button: org admin can grab the team invite link and send it manually via any channel (Slack, WhatsApp, direct email) — fallback for when automated invites go to spam
62. ✅ Reserved words rule enforced in all three AI system prompts in server.js (assessment, companion, daily email generation): spark / glow / tend / flow are energy names only, with replacement table
63. ✅ Dashboard reveal gate verified on production: TCMG team confirmed `dashboardRevealed: false`, visibility toggle correctly hidden from org admin until reveal (by design — reveal is the gate, visibility is the post-reveal cultural choice)
64. ✅ Glow two-context rendering: `#F5D000` for fills/borders, `#C8960C` (glowOnLight) for text on light backgrounds — system-wide
65. ✅ Team dashboard instinctive energy: uses stored `dominant_energy` (band-level label) with band-rank fallback — fixes faint/missing avatar colour for members whose top energy isn't "Naturally present"
66. ✅ Daily email: context block marked internal-only to prevent profile data leaking into email body; explicit no-markdown rule added to system prompt; `stripMarkdown()` safety net strips any residual markdown before template injection

**Privacy + PII — completed 15 April 2026:**

81. ✅ PII stripped from all Anthropic API payloads — `user.name` removed from daily email generation call, PRIVACY COMMITMENT comment block above all 5 API call sites
82. ✅ Privacy & Terms page at `/privacy` — standalone HTML, three sections (conversations, profile, legal placeholder), served via dedicated route in server.js
83. ✅ Privacy section added to `/about` marketing page — full explanation between trial reassurance and final CTA
84. ✅ Companion system prompt privacy guidance — accurate Q&A block so Hue can answer privacy questions in conversation
85. ✅ Consent screen privacy link — "By continuing you're agreeing to our Privacy & Terms" below Continue button
86. ✅ Persistent "Privacy & Terms" footer link in hue.html on all non-chat screens

**Constellation fixes — completed 15 April 2026:**

87. ✅ Constellation positioning rewrite — dominant energy determines quadrant (55% from centre), other three energies adjust position within it. Replaces axis-ratio formula that placed nodes by balance between opposing pairs
88. ✅ Constellation initials disambiguation — when two members share the same initials, uses first 4 chars of first name (e.g. "Jacq" vs "Jill")
89. ✅ Constellation overlap nudging — increased nudge distance (46-58px) and threshold (50px) so overlapping nodes are always readable

**Daily email + companion language — completed 15 April 2026:**

79. ✅ Daily email redesign: four-colour top bar (Spark/Glow/Tend/Flow stripes) replaces single-energy background block. Cream background throughout. Two energy badges (instinctive + second-ranked). Energy names in body copy rendered in their energy colours via `formatEmailCopy()`. `{{PRIMARY_COLOR}}` placeholder removed. CTA button ink black. Footer: "Your profile belongs to you."
80. ✅ Companion language fixes: no outcome-forecasting, no readiness/preparation language, no direct instructions ("pause and ask yourself"), both forms of banned rhetorical construction listed, additional banned phrases added

**Daily email energy rotation — completed 16 April 2026:**

90. ✅ Daily email energy rotation: weekly focus mode cycle (instinctive Sun/Thu, fluent Mon/Fri, intentional Tue/Sat, developing Wed) with four distinct content instructions per mode. `EMAIL_FOCUS_MODE` map in server.js. Badges show focus energy + instinctive (or focus + fluent on instinctive days). Subject line includes energy name on intentional/developing days only.
91. ✅ Two-facts technique: occasional overlay on alternate Wednesdays (developing day). Two standalone observable-behaviour sentences, no connective, no question. `useTwoFacts` flag, `twoFactsInstruction` content instruction, overrides content type entirely. Content type label stays "A thought for today".
92. ✅ System prompt updated: focus energy context line added, energy-name-in-body-copy rule added ("Do not include the energy name in the body of the email. Energy names appear only in the template badges, not in your generated text.")

**MyHue rebrand — completed 16 April 2026:**

93. ✅ Email header: old red-u `hue` text replaced with static spin logo SVG (H with four colour dots: Spark TL, Glow TR, Tend BR, Flow BL) + MyHue wordmark in Georgia serif 22px
94. ✅ Email footer: `Hue · myhue.co` → `MyHue · myhue.co`
95. ✅ Maintenance page: logo text updated to `MyHue`, body copy updated, `.u` CSS rule removed
96. ✅ about.html title tag: `Hue` → `MyHue`. Body copy references to Hue as companion unchanged (correct per naming rules)
97. ✅ Home screen: large "Hue" display heading and stone tagline replaced with MyHue wordmark in Fraunces (no static spin logo — animated SpinMark above is sufficient), tagline promoted to hero weight (Fraunces 28px italic bold, ink colour). Animated SpinMark, date line, energy dots, buttons all unchanged
98. ✅ Project documents updated: CLAUDE.md, hue-voice-v1.md, hue-email-strategy-v1.md — all reflect MyHue naming throughout

---

## DATABASE MIGRATION — TODO (before significant user growth)

Postgres is already provisioned in the humorous-sparkle Railway project alongside hue-server.
Not yet connected. Migration required before onboarding paying users at volume.

Steps when ready:
1. Rewrite db.js — swap SQLite driver for Postgres (pg), update all placeholders from ? to $1/$2 syntax
2. Export existing SQLite data and import into Railway Postgres
3. Add DATABASE_URL env var to hue-server Variables tab in Railway (value from Postgres service → Variables tab)
4. Test all flows: registration, assessment, org join, team dashboard, Stripe webhook, email triggers
Estimated time: one focused session, 2–3 hours.

## RAILWAY BILLING — RESOLVED

Account is on Hobby plan ($5/month minimum usage). Billing is stable.
artistic-reverence project deleted (was an empty stray project, no data lost).
humorous-sparkle contains two services: hue-server (live, myhue.co) + Postgres (provisioned, empty, not yet connected).

## BACKUP STATUS

Code: safe — GitHub repo (github.com/SimonTCMG/hue-server) is the backup.
User data: currently in SQLite file on Railway volume (hue-server-volume).
At risk if Railway server is deleted. Resolved by completing Postgres migration above.
Payments: Stripe holds independently — safe.
Email list: MailerLite holds independently — safe.
Email sending: MailerSend holds independently — safe.
Domain/DNS: Cloudflare holds independently — safe.

---

## ADMIN ARCHITECTURE (decisions made 8 April 2026 — not yet built)

### Role hierarchy

```
Hue Platform Admin (us)
    │
    ├── Facilitator (reseller — owns one or more client orgs)
    │       │
    │       └── Org Admin (owns one org — assigned by facilitator or self-registers)
    │               │
    │               └── Team Lead
    │                       │
    │                       └── Member
    │
    └── Individual subscriber (no org)
```

### Platform super-admin

- Route: `/admin` — env-gated (separate credential, not just a role flag on the users table)
- Set up by us only. Facilitators are never elevated to platform admin.
- **What it can do:** View all organisations (name, seat count, billing status, creation date, facilitator attribution), create orgs and set org codes, manually assign org-admins, trigger system actions (resend invites, reset trial clocks, fix broken onboarding), update `contracted_seats` on any org to resolve seat overflow
- **What it can never do:** Access individual profile data, access companion conversation history, impersonate a user without their knowledge, view team dashboard data for orgs without explicit access
- Every platform admin action writes to an immutable audit log: who, what, when, why (free-text reason field — required, not optional)

### Facilitator role

- Facilitators are set up by us (platform admin grants facilitator role — no self-serve registration path at this stage)
- A facilitator account is distinct from any individual subscriber account — a facilitator who also uses Hue personally has two separate accounts
- **What a facilitator can do:** Create client organisations, create teams within those orgs, invite members into those teams, assign org-admins within client orgs (handing control to the client), view all their client orgs in a portfolio dashboard (status, seat count, overflow flags), view team dashboards for their client orgs
- **What a facilitator cannot do:** Access individual profile data (share link consent model applies — clients initiate), access other facilitators' client portfolios, modify billing directly

### Facilitator creates client orgs

- Facilitators have the information first-hand and create client orgs themselves via their portfolio dashboard
- On org creation: facilitator sets org name, contracted seat count, and the email of the org-admin contact (who then gets auto-promoted on registration)
- Billing attribution: org records carry a `facilitator_id` (nullable) — null = direct Hue client, populated = facilitator-owned. Partner seat rate (£5/seat/month) applied automatically for facilitator-owned orgs. Facilitator earns 20% ongoing commission.
- Facilitator always retains portfolio visibility of their client orgs unless explicitly removed

### Seat overflow — soft overflow model (decided)

- **Hard stops are rejected.** Inviting beyond contracted seats is allowed — Hue does not block the action.
- When active members exceed `contracted_seats`:
  - **Immediate:** Facilitator receives an email — "[Org Name] has added a member beyond their current contract (X contracted, X+1 active). You may want to get in touch."
  - **In-app:** Org-admin sees a soft notice — "Your team is growing — your facilitator may be in touch about your subscription." Non-alarming, not a blocker.
  - **Platform admin view:** Overflow flag visible on any org where active members exceed contracted seats, with overflow count
- New user's access is unrestricted during overflow — the commercial conversation is between Hue, facilitator, and org-admin, not with the end user
- Resolution: platform admin updates `contracted_seats` on the org record once the commercial conversation is complete

### Data model changes required

- `organisations` table: add `facilitator_id` (nullable FK), `contracted_seats` (integer), `active_seats` (derived or maintained counter)
- New `facilitators` table: `id`, `user_id`, `company_name`, `billing_rate`, `commission_pct`, `created_at`
- New `platform_admin_log` table: `id`, `admin_user_id`, `action`, `target_type`, `target_id`, `reason`, `created_at` — immutable, append-only
- User roles: add `platform-admin` and `facilitator` to existing `org-admin` / `team-lead` / `member` set

### Research data layer (third pipeline — not yet built)

- Sits alongside the existing team and personal companion pipelines — architecturally separate from both
- **What it contains:** Anonymised aggregate patterns only — no individual identifiable data, no conversation content, no companion history
- **Governed by:** Explicit opt-in consent at onboarding ("Help us improve Hue — your anonymised data may contribute to our research into how people grow") — opt-in, not opt-out
- **30-day lag** before any data enters the research pool
- **Access:** Purpose-built research dashboard, separate from operational admin. Not part of the `/admin` route.
- **What it enables:** The eight research data points defined in `hue-psychology-foundations-v1.md` Section 4 — required for the Nigel Evans validation study
- Research layer consent checkbox to be added to the onboarding consent conversation (existing `hue-consent-conversation-v1.md` flow)

### What platform admin can never do (non-negotiable)

- Access individual assessment scores or raw profile data
- Access companion conversation history
- View team dashboard data for orgs not explicitly assigned
- Impersonate a user without their knowledge
- These are architectural barriers, not policy — build them that way


---

## INTERNAL NOTIFICATIONS (decisions made 8 April 2026 — not yet built)

### Principles

- Notifications about profile completion must never attribute individual completion status to anyone other than the individual themselves
- Team leads and org admins receive aggregate state only — never "Alex has completed their profile"
- Hue acts as the intermediary for member reminders — the org admin never sends chasers on Hue's behalf
- No notification is ever triggered by companion activity — companion pipeline is private, always

### Team lead notifications

**Trigger: 50% of team profiles complete**
- Channel: email
- Recipient: team lead only
- Content: aggregate only — "Half your team's profiles are in. The picture is starting to take shape." No individual names, no list of who has or hasn't completed.
- Timing: fires once, at the moment the 50% threshold is crossed
- Pre-reveal only: once the dashboard is revealed, this trigger is retired for that team

**Trigger: all team profiles complete**
- Channel: email
- Recipient: team lead only (not org admin — this is an action prompt, not an FYI)
- Content: reveal prompt — "Everyone's in. Your team's energy picture is ready to share whenever you are." CTA links directly to the team dashboard reveal banner.
- Timing: fires once, at the moment the final profile completes
- Framing: the reveal is the team lead's choice — the email prompts, never pressures. No countdown, no urgency language.
- If the team lead has already revealed (early reveal): this email is suppressed — no point prompting a reveal that's already happened

**Post-reveal: new member completes**
- Channel: in-app notification only (not email)
- Recipient: team lead
- Content: "Your team picture has updated." No individual name.
- Rationale: lightweight signal that the dashboard has changed; team lead can visit when ready

### Org admin notifications

- **No profile completion emails.** The in-app org admin dashboard already shows per-member status (Profile complete / Joined, not started / Invited). That is sufficient.
- **Weekly in-app digest** (not email): shown on the org admin dashboard — aggregate completion rates per team. Format: "Team A: 8 of 10 profiles complete. Team B: 3 of 8 profiles complete." No individual names in the digest.
- Org admin can see individual status by visiting the dashboard — that data is available in-app in context, but Hue never pushes it to them via email where it could be forwarded or misread.

### Member reminder emails (org admin controlled)

- Org admin sets a completion deadline when setting up a team (optional field — not required)
- Org admin toggles "Send Hue reminders to members who haven't completed" on/off per team
- When toggled on: Hue sends a reminder email directly to the non-completing member — not via the org admin, not cc'd to the org admin
- Reminder email is sent from Hue (hello@myhue.co), not from the org admin. Framing is warm and member-focused: "Your team's energy picture is almost complete — your profile would make it richer." No urgency, no mention of the org admin or deadline.
- Reminder cadence: one email at 3 days before deadline, one on deadline day. Maximum two reminders per member per team. No further reminders after that.
- Org admin sees completion status update in their dashboard when a member completes — they do not receive a notification that the reminder was sent or that it worked.

### What notifications never contain

- An individual's name linked to completion or non-completion (in any email to team lead or org admin)
- Any content about what someone's profile contains
- Anything triggered by companion conversation activity
- A list of non-completers pushed to the org admin via email

### Data model additions required

- `teams` table: add `reminder_enabled` (boolean), `completion_deadline` (date, nullable)
- `team_notification_log` table: `id`, `team_id`, `notification_type` (enum: fifty_percent, all_complete, post_reveal_update, member_reminder), `sent_at`, `suppressed` (boolean + reason) — prevents duplicate sends
- New cron job: daily check for deadline-proximate member reminders (runs at 9am UK alongside existing email cron)
- 50% and all-complete triggers fire from the auto-sync function that runs when assessment completion pushes bands to teams


---

## BETA LAUNCH + ACCOUNT CONTINUITY (decisions made 8 April 2026 — DO THIS NEXT)

---

### Message to Code

The next build session has two jobs that are tightly connected: getting beta testers into the product today, and laying the foundations for account continuity that every future user will depend on. Read this section in full before starting. The beta setup is fast. The account continuity work takes longer but must be designed correctly from the start — it cannot be retrofitted cleanly later.

Items 48–51 get beta live. Items 52–57 are the continuity model — build them in order, do not skip ahead.

---

### Core principle — One person. One profile. One account. Forever.

This is not a product feature. It is the foundational identity commitment that everything else is built on.

A Hue profile is the person. Not the company they work for. Not the subscription they currently hold. Not the email address they registered with three jobs ago. The profile travels with them through every employment change, every subscription lapse, every org join and leave. It accumulates over a lifetime. It is never lost, never reassigned, never fragmented across duplicate accounts.

Everything in this section exists to make that principle technically real.

**What this means in practice:**
- One email address = one account = one profile. Always.
- Organisations attach to the person's account — the person does not attach to the organisation
- Subscriptions are the current payment arrangement — they do not define the account
- Email addresses are changeable — the account and profile are not
- A user who has been on Hue for five years, worked at three companies, lapsed twice, and rejoined twice still has one profile with a continuous history

---

### Beta setup — what to build (items 48–51)

**Beta user state (`beta-user`)**

New state in the users table alongside existing states. Access logic: wherever the code checks `individual-trial-active` or `individual-subscriber` to permit AI calls, add `beta-user` and confirm `org-member-active` is also in the permitted set.

`beta-user` accounts:
- Full access — all AI calls permitted
- No trial clock — no expiry cron touches them
- No Stripe record created at registration
- Suppressed from all trial email sequences (days 1–14)
- Receive beta welcome email only (see below)
- MailerLite tag: `beta-user`

**BETA_EMAILS env var**

Add `BETA_EMAILS=email@domain.com,email2@domain.com` to Railway env vars. On registration, if the submitted email matches any address in this list (case-insensitive), set state to `beta-user` automatically. No new registration route, no separate flow — existing registration screen, same UX, different state on completion.

Simon manages this list directly in Railway. To invite a new beta tester, add their email to the env var and send them the standard myhue.co registration link.

**Beta welcome email**

Single email via MailerSend, triggered on registration when state = `beta-user`. No subsequent automated sequence — any follow-up with beta testers is manual from Simon.

Content guidelines (follow `hue-voice-v1.md`):
- Warm, personal, direct
- Honest that this is an early version — trust is built by naming it, not hiding it
- States clearly: no clock on their access, it's theirs to explore at their pace
- Invites candid feedback — what works, what surprises them, what feels off
- Single CTA: start your first conversation
- No mention of pricing, no trial language, no conversion pressure

**Team Hue Demo**

Create as a second team within the existing TCMG org (ID: `tcmg-org-001`). Simon is already org-admin. Invite inner circle members via the existing org invite flow at `/org/tcmg-org-001`. They register via `/register-org` as normal org members — no new flow needed.

Team Hue Demo exists to:
- Generate real team dashboard data from a trusted inner circle
- Serve as a live demo asset alongside TCMG
- Let Simon show the team experience (constellation, 32-dimension panel, band bars) during sales conversations and facilitator pitches
- The dashboard reveal gate applies — Simon never hits reveal unless actively demoing. Members see the progress screen. The dashboard is Simon's to show, not theirs to discover unsupervised.

**What beta testers are NOT:**
- Beta individuals (Hue You) are not in any org or team — they are standalone individual accounts. No org structure, no team dashboard for this cohort.
- TCMG is the primary demo org. Team Hue Demo is the secondary demo asset within TCMG. There is no "Hue You Demo" team — this was considered and rejected as adding complexity without value.

---

### Account continuity — what to build (items 52–57)

**Email change flow (item 52)**

Email is the account identifier but must be changeable at any time, by the user, from account settings.

Rules:
- Change is initiated from within an authenticated session — the login session is the proof of identity, not the old email
- New email receives a confirmation link — confirms ownership of the new address
- Old email receives a notification only — "your Hue email address has been updated." This is informational. If the old address is dead (e.g. former work email), the notification bounces harmlessly. The change is not blocked or reversed by a bounce.
- Change completes on new email confirmation alone. No dependency on the old email at any point.
- Account settings screen is accessible regardless of subscription state — a lapsed or expired user can still update their email. The product is gated. The account is not.
- On email change: update users table, then atomically update MailerLite subscriber record (old email out, new email in, all tags and custom fields preserved) and MailerSend contact record. If either external call fails, retry with exponential backoff. Log failures. Do not leave a partial state.
- Team memberships are stored against `user_id` — confirm this is the case. If any membership logic references email directly, fix it. Memberships must follow the account, not the address.

**Returning user branch on `/register-org` (item 53)**

Currently the org registration flow assumes a new user. It must handle returning users cleanly.

When an org invite link is clicked:
- If the user is not logged in: show login option prominently alongside registration. "Already have a Hue account? Log in to connect this invitation to your existing profile."
- If the user logs in: attach the team membership to their existing account. Do not create a new account. Do not prompt re-assessment.
- If the user registers as new: standard flow, new account created.
- The invite token is the membership grant — it is claimed by whoever authenticates, regardless of which email the invite was originally sent to. This handles the case where someone's work email has changed since the invite was issued.
- On returning user joining org: if they have an existing profile, suppress the full 4-email onboarding sequence. Send a single welcome-back email instead: warm, acknowledges they already know Hue, frames the team context briefly.
- Profile immediately contributes to the new team's dashboard on join — no settling period for returning users. The 30-day settling period applies only to users new to Hue.

**Stripe customer creation for existing users (item 54)**

Beta users and any future users who enter via a non-payment route have no Stripe customer record. When they choose to subscribe individually, the system must handle "create Stripe customer for existing user" as a distinct case from "create Stripe customer on registration."

- On subscription initiation for a user with no Stripe customer ID: create Stripe customer, attach to user record, then proceed to checkout session as normal
- This must be checked before any Stripe call that assumes a customer ID exists

**Subscription pause/resume (item 55)**

When a user with an active individual subscription joins an org:
- Call Stripe pause on their subscription — billing stops, subscription record preserved, no cancellation
- Update user state to `org-member-active`
- Log the pause in user record: `subscription_paused_at`, `subscription_paused_reason: org_join`

When a user's org membership lapses (`org-member-lapsed`):
- Check for paused individual subscription — `subscription_paused_reason: org_join`
- If found: call Stripe resume automatically — billing restarts, access continues without interruption, no user action required
- If not found: notify user that org access has ended, offer individual subscription
- Update user state accordingly

The user should experience this as seamless. They are never asked to re-enter card details. They are never shown a payment screen they've already been through. Their access continues or resumes without a gap where possible.

**Email sequence logic on org join (item 56)**

When state transitions to `org-member-active`:
- If previously `individual-trial-active`: suppress remaining trial emails, send org welcome (or welcome-back if returning user)
- If previously `individual-subscriber`: pause subscriber email sequence while org-covered. Resume on reactivation.
- If previously `individual-trial-expired`: suppress nurture sequence. Send org onboarding (or welcome-back if returning user). Full access restored.
- If previously `beta-user`: no active sequence to suppress. Send org welcome-back.

On reversion from `org-member-lapsed` to individual:
- If subscription resumes (paused → active): resume subscriber email sequence. Never restart trial sequence.
- If no subscription: move to `individual-trial-expired` nurture sequence (they have seen the product — treat them as lapsed, not new)

**Welcome-back email for returning org members (item 57)**

A user with an existing MyHue profile joining a new org should not receive the standard 4-email onboarding sequence — it is written for people new to MyHue and will feel wrong to someone who already knows the product.

Trigger: org member registration where `profile_complete = true` on the user record.

Content:
- Acknowledges they already know MyHue
- Briefly names the team context — "you're now part of [team name]'s energy picture"
- Reminds them their profile is theirs — unchanged, still private, still portable
- Single CTA: visit your profile or continue a companion conversation
- No explanation of what MyHue is, no assessment prompt if profile already exists

---

### The full user journey — state map

| Situation | State | Access | Emails | Stripe |
|-----------|-------|--------|--------|--------|
| Beta tester | `beta-user` | Full | Beta welcome only | None |
| Individual trial | `individual-trial-active` | Full | Trial sequence days 1–14 | Customer + subscription |
| Individual subscriber | `individual-subscriber` | Full | Subscriber sequence | Active subscription |
| Trial expired | `individual-trial-expired` | Gated | Nurture sequence | Cancelled/failed |
| Org member (new to MyHue) | `org-member-active` | Full | Org onboarding 4-email | None |
| Org member (returning) | `org-member-active` | Full | Welcome-back single email | Paused if previously subscriber |
| Org member lapsed, sub resumes | `individual-subscriber` | Full | Subscriber sequence resumes | Resumed from pause |
| Org member lapsed, no sub | `individual-trial-expired` | Gated | Nurture sequence | None |

Access priority rule (checked in this order):
1. Active org membership → full access
2. Active individual subscription → full access
3. Paused subscription + no org → gated, one-click reactivation
4. Expired trial + no org + no sub → gated, full subscription flow
5. No account → registration


---

## WHAT NOT TO DO

**All user-facing copy rules are in `hue-voice-v1.md`.** Read that document before writing any text a user will see. The banned phrasing list, autonomy voice rules, energy description rules, and accessibility test all live there.

**Banned companion phrases (added April 2026):** "sit with", "sit with you", "sit with that", "what feels most alive", "most alive for you", "what feels most alive to talk about". Also banned: offering a topic menu (listing options and asking which the person wants to discuss). The companion picks one thread and asks about it specifically.

**Additional banned phrases (added 15 April 2026):** "when you're ready", "bring something to the companion", "when you bring it deliberately", "people will notice" / "others will notice" (any outcome-forecasting), "that's not a tension", "two engines running in parallel", "each one ready when you need it", "That's not X. That's Y." (same as "This isn't X. It's Y." — both forms banned). Also banned: telling the user to pause, reflect, or consider anything ("Pause and ask yourself..." is a direct instruction — offer the observation and stop). No readiness language, no preparation framing, no outcome forecasting.

**Architecture and code rules (not covered by voice doc):**
- Do not call the energy Tend "Root" — Root is retired as an energy name
- Do not surface raw percentages anywhere in the team dashboard UI — bands only
- Do not allow any individual behavioural data to cross from the personal companion pipeline into the team layer — these pipelines are architecturally separate and must stay that way
- **PII in API payloads — never permitted:** No personally identifying information (name, email, user ID, org name, team name) may be included in any payload sent to the Anthropic API. User identity is resolved server-side only. Only anonymised profile data (energy scores, reach positions) and conversation content are sent. Each API call site in server.js carries a PRIVACY COMMITMENT comment block enforcing this. This is a published user promise — see /privacy. Do not reopen this decision.
- **Product name — MyHue everywhere except the companion:** All UI labels, marketing copy, email headers, footers, page titles, and external references use MyHue. The companion speaks as Hue and introduces itself as Hue. Never refer to the companion as MyHue. Never use the old red-u 'hue' text mark anywhere.
- **Email header — static spin logo + MyHue wordmark:** The `trialEmailHtml()` function in `server.js` must use the static SVG spin logo (H with four colour dots: Spark TL `#D92010`, Glow TR `#F5D000`, Tend BR `#1A8C4E`, Flow BL `#1755B8`) plus MyHue in Georgia serif. Footer reads 'MyHue · myhue.co'. Animated logo is not possible in email — static only. All email templates use this header.
- Do not reopen any decision in this document without explicit instruction from Simon

---

*Part of The Change Maker Group ecosystem. IP belongs to Simon Phillips.*
