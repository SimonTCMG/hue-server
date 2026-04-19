# Changelog — MyHue / myhue.co

All notable changes to the MyHue product. Ordered by date, most recent first. Each entry references the numbered item in CLAUDE.md where the full specification lives.

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
