# Hue — Share My Profile Feature Spec v1
*Drafted 31 March 2026. For facilitator/coach use case.*

---

## What it is

A link generated from the results screen that lets a coach or facilitator view a client's Hue profile within a session — without the client needing to share a screenshot or describe their results verbally.

This is the entry point for the facilitator channel. Build it early.

---

## How it works

### For the user (client)
1. On the results screen, a **"Share with my coach"** button (or similar — copy TBD)
2. Tapping generates a unique, time-limited link
3. User shares the link with their coach — via message, email, or showing the QR code/link in-session
4. Link is revocable — user can turn it off at any time from their profile

### For the coach/facilitator
1. Opens the link — no Hue account required to view
2. Sees the client's full profile: energy rankings, reach labels, and the primary observation
3. Cannot see the conversation transcript — only the profile output
4. Link expires after 7 days (or immediately if revoked by the user)

---

## What the coach sees

- Four energy bars with reach labels (Natural / Ready / Considered / Deliberate reach)
- Percentages
- Primary observation text (the full mirror paragraph)
- No chat history. No personal information beyond what the profile shows.

---

## What the coach does not see

- Assessment conversation transcript
- Name or email (unless the user has chosen to display their name)
- Any data beyond the profile output

---

## Key design decisions

**No coach account required to view.** Friction kills this use case. A coach in a session with a client cannot pause to create an account. View must be immediate, zero-login.

**User controls the link.** Profile belongs to the individual — they share it, they can revoke it. This is consistent with the data ownership principle.

**Time-limited by default.** 7 days. Prevents links being shared indefinitely without the user's ongoing awareness. Renewable if the user chooses.

**QR code option.** In a face-to-face coaching session, showing a QR code is faster than texting a link. Worth including from the start.

---

## Why build this early

Each facilitator using Hue with 15 clients creates 15 people who mention it at work. Some of those workplaces become organisational clients. The facilitator channel has a multiplier effect that retail and direct B2B don't. This feature is what makes Hue usable in an actual coaching session — without it, the facilitator has to describe the tool rather than demonstrate it.

---

## Open questions for Simon

1. **Copy:** "Share with my coach" vs "Share my profile" vs "Show a facilitator" — what language fits the brand?
2. **Expiry:** 7 days is a guess. What feels right for the coaching use case?
3. **Name display:** Should the shared view show the user's name? Probably yes if they've entered one — coaches need to confirm they're looking at the right client.
4. **Facilitator account (future):** Once there's a facilitator tier, the link could connect to a coach's account — giving them a dashboard of shared client profiles. Not for MRP, but the data model should support it from the start.
