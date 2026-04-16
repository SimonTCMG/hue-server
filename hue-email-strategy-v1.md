# MyHue — Email Strategy
*hue-email-strategy-v1.md · Added April 2026 · All decisions resolved — do not reopen without explicit instruction from Simon.*

---

## Purpose of This Document

This document defines everything Code needs to build the mailing list integration and email infrastructure: the four user states, their tagging logic, what each state receives, the full 14-day trial sequence, the post-trial nurture sequence, and the daily email format for active subscribers. All email copy must comply with the language rules in `hue-language-guide-v1.md` and the autonomy voice principle in `CLAUDE.md`.

---

## The Four User States

Every MyHue user is always in exactly one of these states. The tag drives everything — suppression, send logic, personalisation, and re-engagement.

| State | Tag | Who | AI calls | Emails |
|-------|-----|-----|----------|--------|
| Trial active | `individual-trial-active` | Individual signed up, card captured, within 14 days | Yes — full access | Trial sequence (days 1–14) |
| Subscriber | `individual-subscriber` | Converted after trial or direct purchase | Yes — full access | Daily companion emails |
| Trial expired | `individual-trial-expired` | Trial ended, no payment | No | Re-engagement nurture sequence |
| Org member active | `org-member-active` | Registered under an org contract | Yes — full access | Onboarding + org-specific sequence |
| Org member lapsed | `org-member-lapsed` | Org contract ended | No | Individual conversion sequence |

**Suppression rule:** `individual-trial-expired` users must be suppressed from all AI-triggered companion emails. They receive nurture emails only — no content that implies active access.

**Personalisation anchor:** Every email for a named user must reference their dominant energy by name (e.g. "your Spark energy"). This is pulled from the profile at the point the trial email sequence is triggered. Never send a generic energy reference. If the energy is not yet known (e.g. Day 1 before assessment), hold the personalised reference until Day 3.

---

## Individual Trial Email Sequence (Days 1–14)

Trial clock starts at sign-up. All emails are personalised to the individual's energy profile as it develops. Emails reference their energy by name once known. **All email copy follows `hue-voice-v1.md`** — see that document for voice, banned phrasing, subject line rules, and email-specific guidance (section 6).

---

### Day 1 — Welcome

**Trigger:** Sign-up confirmed, card captured.
**Subject:** You're in. Here's where to start.
**Purpose:** Orient, reassure, invite first conversation.

Content: Welcome to MyHue. Brief what to expect over 14 days. Invite them to start their first energy conversation — not "complete your profile", just "start a conversation". Remind them their profile is theirs — not their employer's, not MyHue's. Link directly to the app.

**No energy reference yet** — profile not established.

---

### Day 3 — First energy reflection

**Trigger:** 3 days since sign-up. By now most users have completed their assessment and seen all four energies.
**Subject:** Your [dominant energy] energy — and what the other three are telling us
**Purpose:** Reflect the full four-energy picture back to them. Make it feel specific, not generic. Give them something concrete to notice.

Content: Name their dominant energy and acknowledge what the assessment revealed about it — one specific, concrete thing drawn from their actual profile. Then name their Developing (4th) energy and reframe it clearly: not a gap, not something to fix, but the energy where deliberate practice produces the most visible change. Reference the results screen directly — they've already seen all four — so the email lands as a reflection of something they've experienced, not a tease of something ahead.

Tone: Precise and warm. Never vague. If the email could be sent to anyone, rewrite it until it couldn't.

**Personalisation required:** Dominant energy name + Developing energy name. Both must be named specifically — never "your lowest energy" or similar generic phrasing.

---

### Day 5 — The second energy

**Trigger:** 5 days since sign-up.
**Subject:** The [second energy] in your profile — here's what makes it interesting
**Purpose:** Draw attention to the Fluent (2nd) energy specifically. Make the case that this energy is worth looking at directly — not because it's hidden, but because most people underestimate what their second energy actually does.

Content: Name their second energy. Explain what specifically it adds to their profile — not in generic terms, but in terms of the combination. A person whose instinctive energy is Spark and whose second is Tend shows up differently from a Spark whose second is Flow — and that difference is real and worth knowing. The email should name that combination specifically and describe what it tends to produce. One concrete observation about what their second energy makes possible that their instinctive energy alone couldn't.

Tone: Direct and curious. Not "here's something else to explore" — more "here's something specific worth noticing about what you've already seen."

Note for copywriter: do not frame the second energy as something the user needs to go back to the app to discover. They've already seen it. This email is pointing at something in a picture they already have — like someone saying "did you notice this detail?"

**Personalisation required:** Dominant energy name + second (Fluent) energy name. The email should name the specific combination — not just "your second energy".

---

### Day 7 — Midpoint check-in

**Trigger:** 7 days since sign-up.
**Subject:** Halfway. Here's what's taking shape.
**Purpose:** Acknowledge the midpoint naturally. Show progress. Deepen investment.

Content: Summarise what's been explored so far — which energies have been discussed, what's becoming clearer. For users who haven't returned since Day 1, this is the re-engagement moment — frame as "the conversation is waiting for you, no rush." For active users, this is an affirmation of what's been built. Include one observation that could only be written for this person at this point.

**Personalisation required:** Energy exploration progress + profile-specific observation.

---

### Day 10 — Upsell, autonomy-first

**Trigger:** 10 days since sign-up. 4 days remaining.
**Subject:** Four days left — and something worth knowing
**Purpose:** Begin the subscription conversation without pressure. State the value of continuing clearly. Let the person decide.

Content: Name what happens on Day 14 — trial ends, product gates. Be completely direct about this. Then make the case for subscribing: the companion builds a relationship with you over time that gets more specific and more valuable the longer it runs. The insight available at 6 months isn't available at 14 days. Name the price. Name what's included. One clear call to action: subscribe now, or wait until Day 14 — both are fine.

**Tone:** No countdown. No "don't miss out". Just honest clarity about what continuing looks like and what stopping looks like.

**Personalisation required:** Dominant energy name. Progress summary.

---

### Day 12 — Testimonial / case study

**Trigger:** 12 days since sign-up.
**Subject:** What [first name] noticed after three months
**Purpose:** Social proof, specifically from a user with a similar energy profile where possible.

Content: A brief testimonial or case study from a real user — ideally someone whose dominant energy matches the recipient's. Specific, not generic. What changed for them. What they do differently now. How the companion helped. One or two sentences from them directly. Then: "Your trial ends in two days. [Subscribe] to keep going."

**Placeholder testimonials for beta launch:** See Testimonial Library section below. Use the placeholder matching the recipient's dominant energy until real beta testimonials are collected. Replace placeholders as real ones come in — target 3 per energy before full launch.

**Capturing real testimonials:** Prompt users at 30 and 90 days with: "What's one thing you do differently since starting MyHue?" Index responses by dominant energy.

---

### Day 13 — Profile safety reassurance

**Trigger:** 13 days since sign-up. One day remaining.
**Subject:** Tomorrow your trial ends — your profile is safe
**Purpose:** Remove fear of loss. Make the hard stop feel safe. Drive conversion without pressure.

Content: "Tomorrow your trial ends. Your MyHue profile — everything you've explored, every observation, your full energy picture — is saved. It isn't going anywhere. If you choose to subscribe, you pick up exactly where you left off. If you don't, your profile waits." Then: clear, simple subscription offer. Price. One button.

**This email does the most conversion work of the sequence.** It must be warm, specific, and pressure-free. The reassurance is the sell.

---

### Day 14 — Trial end confirmation

**Trigger:** Trial expired. Card not charged (cancelled) or charge failed.
**Subject:** Your trial has ended
**Purpose:** Confirm the hard stop cleanly. Leave the door open. Move to nurture tag.

Content: "Your 14-day trial has ended. The product is now paused — but your profile is here whenever you're ready." One sentence on what subscribing would give them back. One link. No guilt. No urgency. Tag changes to `individual-trial-expired`. Remove from AI-triggered emails.

---

## Post-Trial Nurture Sequence (Trial Expired)

These emails go to `individual-trial-expired` users only. No AI calls are made for these users. All content is static and pre-written. Frequency: weekly for 4 weeks, then monthly.

**Purpose:** Stay warm, stay relevant, make re-subscription feel easy when the moment is right. Never make the person feel chased.

| Week | Focus | Angle |
|------|-------|-------|
| Week 1 | Re-engagement | "Your profile is still here" — simple reminder, no pressure |
| Week 2 | Testimonial | Relevant case study from someone with their dominant energy |
| Week 3 | New content | Something new in the product or observation library worth coming back for |
| Week 4 | Direct offer | Clean subscription offer, price stated, one button |
| Monthly thereafter | Light touch | One insight, one link, no ask |

**Unsubscribe handling:** Anyone who unsubscribes moves to `unsubscribed` and receives nothing. Do not re-add. Do not re-contact.

---

## Org Member Onboarding Sequence

**Trigger:** Org member registers under an org contract.
**Tag:** `org-member-active`

This sequence is shorter and more focused — these users are entering Hue in a professional context and need to understand what it is and that their profile is private.

| Email | Timing | Purpose |
|-------|--------|---------|
| Welcome | Immediately | What Hue is, that their profile is theirs, how to start |
| First insight | Day 3 | Reflection on their first energy conversation |
| Team context | Day 7 | Explain the team layer — what their employer sees (aggregate only), what they don't |
| Companion introduction | Day 14 | What the daily companion does and how to use it |

**Critical:** Every org member email must include the data ownership statement. "Your profile belongs to you, not your employer. They see the team picture — never your individual result."

---

## Org Member Lapsed Sequence

**Trigger:** Org contract ends. User transitions from `org-member-active` to `org-member-lapsed`.
**Grace period:** 30 days before sequence begins (30-day free access window per CLAUDE.md).

| Email | Timing | Purpose |
|-------|--------|---------|
| Transition notice | Day 1 of lapse | "Your employer's licence has ended — your profile is still yours" |
| Individual offer | Day 7 | Personal subscription offer at standard rate |
| Testimonial | Day 14 | Relevant case study |
| Final offer | Day 28 | Clean offer, no guilt, unsubscribe option clear |

**Personalisation required:** These users are warm — they know MyHue. Emails should reference their energy by name and acknowledge what they've already built. "You've been exploring your [energy] for [X] months. That doesn't disappear."

---

## Subscriber Daily Email Format

Active subscribers (`individual-subscriber`, `org-member-active`, `beta-user`) receive a daily companion email at 8am UK. This is not a newsletter — it is an extension of the companion relationship. Each email is:

- Short: 1–3 sentences (generated by Claude Sonnet 4.5 with full profile context)
- Personalised: generated from their specific energy profile — if it could be sent to anyone, it's rewritten
- Varied: two independent rotations run simultaneously — focus mode (which energy) and content type (thought / question / experiment)
- Autonomy-respecting: never tells the person what to do. Offers a perspective and steps back.
- Whole-life: emails should feel as right on a Saturday as a Monday. The person is not just a professional — their energies show up at work, at home, in every conversation they have.

### Energy focus rotation (live — 16 April 2026)

The daily email rotates through four energy focus modes across the week. The rotation determines which energy is the lens for that day's content. The AI generates content specific to that energy and that person's profile.

**Weekly schedule:**

| Day | Focus mode | Energy position |
|-----|-----------|-----------------|
| Sunday | Instinctive | ranked[0] |
| Monday | Fluent | ranked[1] |
| Tuesday | Intentional | ranked[2] |
| Wednesday | Developing | ranked[3] |
| Thursday | Instinctive | ranked[0] |
| Friday | Fluent | ranked[1] |
| Saturday | Intentional | ranked[2] |

Instinctive and fluent appear twice per week; intentional twice; developing once (Wednesday).

**The four modes:**

- **Instinctive** — what this person's instinctive energy makes possible in practice. Specific to their profile. Not a general energy description.
- **Fluent** — what the fluent energy adds alongside the instinctive. Name the combination. Never frame as secondary.
- **Intentional** — how the intentional energy lands with precision when deliberately chosen. Not a gap. Not something to work on. Make the precision visible.
- **Developing** — where practice lands with the most visible impact. Not absence. Never framed as weakness or growth target. Mirror, not prescription.

**The invisible design principle:** The rotation must never be visible to the person receiving the email. The moment someone sees a pattern — Monday is always one energy, Tuesday is always another — it becomes formulaic. Energy names do not appear in the body copy. They appear only in the template badges (structural, not content). Subject line includes the energy name on intentional and developing days only.

### Content type rotation (unchanged)

Three content types cycle independently by day of week:

- **A thought for today** — single observation worth noticing
- **A question to sit with** — single question, no answer needed
- **A small experiment** — one thing to notice today, never advice

### Two-facts technique (live — 16 April 2026)

An occasional overlay (~1 in 7 emails) that sits across the rotation. Not a fifth mode — a way of writing certain emails that adds a deeper layer of insight without feeling like instruction.

**How it works:** Present two true, uncontested facts about the person and stop. No explanation. No link drawn. The reader's brain closes the gap and arrives at the conclusion themselves.

**When it fires:** Every other Wednesday (developing day). Chosen because the developing energy reframe is the highest-value application of this technique.

**Rules:**
- Exactly two sentences. Both must be independently true and specific to this person's profile.
- Both facts must be observable behaviours, not descriptions of the energy.
- Neither fact should contain "but", "however", "and", or any connective. They stand alone.
- No commentary, no framing sentence before or after. Just the two facts.
- The gap between them should produce a clear, singular conclusion.
- Never on fluent days — the fluent energy pairing has its own logic that the two-facts form disrupts.
- Never two days in a row.
- Content type label stays as "A thought for today" on two-facts days — the recipient does not need to know the form has changed.

**Format:**

```
Subject: [content type] — [day name]
  or on intentional/developing days:
Subject: [content type] — your [energy] energy — [day name]

[1–3 sentences of personalised content — generated by AI]

Template provides: four-colour top bar, two energy badges, CTA button, footer
```

**Testimonial cadence:** At least 1 in 7 subscriber emails includes a brief testimonial or case study. These should be real, specific, and attributed (first name + energy profile). Captured actively via in-app feedback prompts at 30 and 90 days.

---

## Testimonial Library

Testimonials are indexed by dominant energy. The Day 12 trial email and the Week 2 post-trial nurture email both draw from this library — use the testimonial matching the recipient's dominant energy. The Day 12 subject line should use the testimonial name: "What [name] noticed."

These are placeholder testimonials for beta launch. Replace with real ones as they come in. Target: 3 per energy before full public launch.

---

### Spark — Rachel

*"I did it because a friend wouldn't stop going on about it. Expected to get told I'm bossy and impatient, which, fair enough. But there was this bit about how I move fastest when I can already see how everything fits together — and that's so specifically true it was a bit irritating. Showed my husband. He just laughed and said 'well yeah.'"*

— Rachel, Spark energy

---

### Glow — Dom

*"I thought it would be a bit woo. It wasn't really. It just had this way of describing stuff I do without making it sound like a flaw or a superpower — just, this is how you are. There was a line about bringing warmth without holding things up that I've thought about quite a bit since. I don't fully know why it landed but it did."*

— Dom, Glow energy

---

### Tend — Priya

*"The conversation took about 20 minutes and I nearly didn't finish it. Glad I did. It said something about commitments I've never walked away from even when it would've been easier — which is true and I'd never really clocked that about myself before. My mum would say I've always been like that. She's probably right."*

— Priya, Tend energy

---

### Flow — Kiran

*"I've spent a lot of my career being told I overthink things. Hue basically said — no, you're checking whether the question is even the right one. Which is different. I don't know if that makes me feel better or just more aware of it, but either way it's more useful than being told to trust my gut."*

— Kiran, Flow energy

---

**Tone guidance for all testimonials:** Conversational, slightly unresolved, specific to the experience — not a marketing quote. Real people don't wrap things up neatly. Avoid anything that sounds like it was written to persuade. The goal is recognition, not enthusiasm.

**What to avoid:** Phrases that imply the full product suite has been used (teams, dashboard, org features). Testimonials should be grounded in the individual conversation and the observation it produced — nothing more than that at this stage.

---

## Technical Requirements for Code

- Email platform must support tagging by user state (4 states minimum)
- Tag must update automatically on: sign-up, trial expiry, subscription activation, org contract lapse
- Suppression list must be maintained: `individual-trial-expired` users suppressed from all AI-triggered emails
- Personalisation fields required: `first_name`, `dominant_energy`, `trial_day`, `days_since_signup`, `energies_explored_count`
- Day-count hooks are calendar-based from sign-up timestamp, not from first login
- All emails must have a clear unsubscribe mechanism
- Testimonial library to be built in parallel with beta — index by dominant energy

---

*Part of The Change Maker Group ecosystem. IP belongs to Simon Phillips.*
