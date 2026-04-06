# Hue AI — Email Strategy
*hue-email-strategy-v1.md · Added April 2026 · All decisions resolved — do not reopen without explicit instruction from Simon.*

---

## Purpose of This Document

This document defines everything Code needs to build the mailing list integration and email infrastructure: the four user states, their tagging logic, what each state receives, the full 14-day trial sequence, the post-trial nurture sequence, and the daily email format for active subscribers. All email copy must comply with the language rules in `hue-language-guide-v1.md` and the autonomy voice principle in `CLAUDE.md`.

---

## The Four User States

Every Hue user is always in exactly one of these states. The tag drives everything — suppression, send logic, personalisation, and re-engagement.

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

Trial clock starts at sign-up. All emails are personalised to the individual's energy profile as it develops. Emails reference their energy by name once known. Subject lines must never use "unlock", "exclusive", or urgency language. Tone throughout: warm, curious, autonomy-respecting.

---

### Day 1 — Welcome

**Trigger:** Sign-up confirmed, card captured.
**Subject:** You're in. Here's where to start.
**Purpose:** Orient, reassure, invite first conversation.

Content: Welcome to Hue. Brief what to expect over 14 days. Invite them to start their first energy conversation — not "complete your profile", just "start a conversation". Remind them their profile is theirs — not their employer's, not Hue's. Link directly to the app.

**No energy reference yet** — profile not established.

---

### Day 3 — First energy reflection

**Trigger:** 3 days since sign-up. By now most users have completed at least their first energy conversation.
**Subject:** What we're starting to understand about you
**Purpose:** Reflect back what the conversation has revealed. Make the insight feel real and specific.

Content: Reference their dominant energy by name. One specific observation drawn from what Hue now knows — not generic, pulled from their actual profile. Frame the other three energies as waiting, not locked. "There's more here when you're ready."

**Personalisation required:** Dominant energy name + one profile-specific observation.

---

### Day 5 — The second energy hook

**Trigger:** 5 days since sign-up.
**Subject:** The energy that shapes how your [dominant energy] shows up
**Purpose:** Create genuine curiosity about the second energy without manufactured urgency.

Content: Explain that the dominant energy looks and feels different depending on what sits next to it. The second energy is the one that shapes it most. Reference something specific from their Day 3 assessment conversation that hints at their second energy. "This is worth looking at directly." Link to continue the conversation.

**Personalisation required:** Dominant energy name + conversation-derived hint about second energy.

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

**Note for content team:** Build a testimonial library indexed by dominant energy. Each energy needs at least 3 testimonials before launch. Capture these actively during beta — prompt users at 30 and 90 days with a specific question: "What's one thing you do differently since starting Hue?"

---

### Day 13 — Profile safety reassurance

**Trigger:** 13 days since sign-up. One day remaining.
**Subject:** Tomorrow your trial ends — your profile is safe
**Purpose:** Remove fear of loss. Make the hard stop feel safe. Drive conversion without pressure.

Content: "Tomorrow your trial ends. Your Hue profile — everything you've explored, every observation, your full energy picture — is saved. It isn't going anywhere. If you choose to subscribe, you pick up exactly where you left off. If you don't, your profile waits." Then: clear, simple subscription offer. Price. One button.

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

**Personalisation required:** These users are warm — they know Hue. Emails should reference their energy by name and acknowledge what they've already built. "You've been exploring your [energy] for [X] months. That doesn't disappear."

---

## Subscriber Daily Email Format

Active subscribers (`individual-subscriber`, `org-member-active`) receive a daily companion email. This is not a newsletter — it is an extension of the companion relationship. Each email is:

- Short: 150–250 words maximum
- Personalised: references their energy profile specifically
- Action-oriented: contains one prompt, one question, or one reflection — never three things
- Autonomy-respecting: never tells the person what to do. Offers a perspective and steps back.
- Upsell-aware: in the first 90 days, approximately 1 in 5 emails includes a natural reference to a feature the subscriber hasn't yet used (e.g. flex challenges, team sharing, the companion conversation). Never a hard sell. Always contextual.

**Format:**

```
Subject: [specific to today's content — never generic]

[One observation or prompt — personalised to their energy profile]

[One question or reflection to sit with]

[Optional: one link to continue the conversation in the app]

— Hue
```

**Testimonial cadence:** At least 1 in 7 subscriber emails includes a brief testimonial or case study. These should be real, specific, and attributed (first name + energy profile). Captured actively via in-app feedback prompts at 30 and 90 days.

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
