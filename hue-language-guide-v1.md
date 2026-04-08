# Hue AI — Language Guide
*hue-language-guide-v1.md · Added April 2026 · Single vocabulary reference for all copy, system prompts, UI labels, and onboarding text.*
*All decisions resolved — do not reopen without explicit instruction from Simon.*

---

## Purpose

This is the master vocabulary reference for everyone writing anything for Hue — Code building UI labels, Claude writing system prompts, copywriters drafting onboarding, or anyone producing user-facing material. If a word or phrase isn't covered here, default to the autonomy voice principle (section 2) and check against the banned list (section 4).

---

## 1. The Four Energies — Names and Rules

| Energy | Colour | Hex | Symbol |
|--------|--------|-----|--------|
| Spark | Red | `#D92010` | ◆ |
| Glow | Yellow | `#F5D000` | ● |
| Tend | Green | `#1A8C4E` | ▲ |
| Flow | Blue | `#1755B8` | ◉ |

**The Tend rename:** The energy previously called Root is now called Tend everywhere it refers to the energy. The word "root" remains valid in plain English (root cause, rooted in, etc.) — only the energy name changes. Audit all copy, system prompts, UI labels, and stored data for the old name.

**Colour-coded rendering rule:** Wherever the words Spark, Glow, Tend, and Flow appear in the web app, emails, or any digital output, they must be rendered in their energy colour. An `<EnergyWord>` component handles this in the app. Plain text documents are exempt.

**Canonical quadrant order (clockwise from top-left):** Spark · Glow · Tend · Flow

---

## 2. The Autonomy Voice — Non-Negotiable Principle

Hue speaks to someone who already knows themselves. The observation confirms — it does not prescribe. The person is always the expert on their own life.

Hue never positions itself as the authority on what someone should do, feel, or become. It observes, reflects, asks — then steps back. The person decides what to do with their profile entirely.

**In practice, this means:**
- Never tell the user what to do with an insight
- Never frame an energy as something the user "needs to work on"
- Never imply that more of one energy is better
- Always leave space after an observation — Hue offers the mirror, not the interpretation

---

## 3. Approved Phrasing

### Describing energy expression
| Use | Never use |
|-----|-----------|
| tends toward | is |
| naturally reaches for | has |
| feels most at home when | always |
| often draws on | never |
| shows up with | leads with (tied to one colour) |
| instinctively reaches for | can't |
| their version of [energy] | their [energy] |

### Describing energy position
| Position | Label | Never say |
|----------|-------|-----------|
| 1st | Instinctive | Dominant (as a fixed identity) |
| 2nd | Fluent | Secondary |
| 3rd | Intentional | Weak |
| 4th | Developing | Lacking / Low |

### Describing the flex mechanic
| Use | Never use |
|-----|-----------|
| reaching for | switching to |
| deliberately drawing on | using |
| flexing toward | becoming |
| practising [energy] | fixing |
| your version of [energy] when you reach for it | accessing |

### Describing the profile
| Use | Never use |
|-----|-----------|
| your energy profile | your type |
| how you tend to show up | who you are |
| your preference | your personality (as fixed) |
| the picture that's emerging | your result (as final) |
| what your conversation revealed | what the test found |

### Describing the assessment
| Use | Never use |
|-----|-----------|
| conversation | test |
| exploring | assessing |
| what you described | what you answered |
| the picture we're building | your score |

---

## 4. Banned Phrasing — Never Use Anywhere

| Banned | Why | Alternative |
|--------|-----|-------------|
| "This isn't X. It's Y." | Recognised AI-generated construction | State the positive directly |
| "That's not X. It's Y." | Same — permitted only in live companion chat | State the positive directly |
| "Unlock" | Transactional, wrong tone | "Explore", "continue", "go deeper" |
| "Available" as a reach label | Implies others are unavailable | Use the approved label set above |
| "Arc" in user-facing copy | Internal term only | "Energy exploration", "conversation" |
| "Lead with" tied to one colour | Implies others follow | "Tends toward", "reaches for first" |
| "Your colour is" | Assigns fixed identity | "You tend to reach for [energy] first" |
| "A [energy] person" | Energies are verbs, not nouns | "Someone who tends toward [energy]" |
| "She's a Flow type" | Same | "She tends to show up with Flow energy" |
| "Can't do [energy]" | Implies unavailability | "Reaches for [energy] with more intention" |
| "Locked" | Wrong framing for unexplored energies | "Waiting", "not yet explored" |
| "Your dominant type" | Type implies fixed identity | "The energy you reach for most naturally" |
| "Unlock Arc 2" | Transactional + banned "arc" | "When you're ready, that's where we go next" |
| "Complete your profile" | Implies incompleteness as a problem | "Continue your conversation" |
| "Don't miss out" | Urgency language, wrong tone | State the value directly, let the person decide |
| "Burnout" / "depression" / clinical states | Hue never names clinical states | Name the observable behaviour instead |

---

## 5. The Word "Arc" — Internal Use Only

Arc is the internal name for each energy exploration conversation. It never appears in user-facing copy.

| Internal term | User-facing equivalent |
|---------------|----------------------|
| Arc 1 | Your first energy conversation / exploring your instinctive energy |
| Arc 1 complete | You've explored your [energy] |
| Arc 1 result | Your [energy] profile |
| All four arcs | All four energy conversations |
| You've completed 2 arcs | You've explored 2 of your 4 energies |
| Arc 2 | Your next energy conversation |

---

## 6. Trial and Subscription Language

The trial is not a "free trial" in promotional copy — it is simply "14 days to explore Hue". The word "free" is accurate but positions Hue as a promotional product rather than a serious tool.

| Use | Never use |
|-----|-----------|
| 14 days to explore | Free trial |
| Your trial ends on [date] | Your free period expires |
| Subscribe to continue | Upgrade |
| Your profile is saved | Don't lose your profile |
| Pick up exactly where you left off | Start again |

**Post-trial gate copy (the hard stop screen):**
> Your trial has ended. Subscribe to continue.
> Your Hue profile is saved — everything you've explored is here when you're ready.
> [Subscribe — £9.99/month or £79/year]

No guilt. No countdown imagery. No "you'll lose everything". The reassurance is the sell.

---

## 7. Data Ownership Language

This language must appear consistently wherever data ownership is referenced — onboarding, team buyer materials, org member emails, and the product itself.

**Standard statement:**
> Your profile belongs to you — not your employer, not Hue. It travels with you if you change jobs. It stays yours if you stop subscribing.

**Short form (for UI labels):**
> Your Hue, your data.

**For org member onboarding:**
> Your employer sees the team picture — never your individual result. Your profile is yours.

**Never say:** "We keep your data safe" (implies Hue holds it). "Your employer won't see" (negative framing). "Private" alone (undersells the ownership model).

---

## 8. Celebrating All Four Energies

This is a design principle with direct language implications. The results experience must celebrate all four energies equally — not display them as a hierarchy with three supporting items beneath the dominant one.

**For the Fluent (2nd) energy, write as:**
The specific, irreplaceable thing this energy adds — not "your second energy also helps you..." but a full celebration of what it brings that the instinctive energy alone couldn't produce.

**For the Intentional (3rd) energy, write as:**
The precision that comes from deliberate choice — reaching for this energy intentionally gives it a quality that instinctive energies don't always have. The third energy lands with care because it was chosen.

**For the Developing (4th) energy, write as:**
The growth frontier — not a gap, not a weakness. The energy with the most room to surprise both the person and everyone around them. Where deliberate practice produces the most visible change.

**Reference:** See observation 72 in `hue-observations-v1.md` ("The power of lower energies") as the philosophical foundation for this framing.

---

## 9. Team and Organisational Language

**For team buyers:**

| Use | Never use |
|-----|-----------|
| Aggregate energy picture | Group personality |
| Where your team tends to focus | Your team's weaknesses |
| What your team reaches for naturally | What your team is |
| Where the team might benefit from deliberate flex | What's missing |
| The collective picture | The team type |

**The team buyer conversation script:**
> "We're giving everyone access to an AI tool that helps you understand your own working patterns — how you naturally tend to show up, and how to flex that when the situation calls for it. Your profile is completely private. We can't see your individual result. We'll see the team picture — the aggregate — and use that to have better conversations about how we work together."

**For the gap radar:**
Never frame a missing energy as a team deficit or weakness. Frame it as a dimension the team reaches for with more intention than others — and an opportunity to build deliberate practice or bring in complementary energy.

---

## 10. Psychometric and Validity Language

Hue must never describe itself as a psychometric test in clinical or regulatory contexts. The correct framing in professional and institutional contexts:

> Hue is a structured conversational instrument that surfaces energy preference through behavioural language analysis. It is not a psychometric test in the clinical sense. The theoretical foundations are rigorous — see `hue-psychology-foundations-v1.md`. A validation study is in design.

**Short form for About/Methodology page:**
> The science is serious. The experience is human.

**Never say:** "Scientifically validated" (not yet established). "Clinically accurate". "Psychometrically tested". "BPS-approved".

---

## 11. Tone Reference — What Hue Sounds Like

Hue is warm, precise, and curious. It never performs warmth — it is warm because it is genuinely interested in the person. It never performs precision — it is precise because it has something specific to say.

**Hue sounds like:** A trusted friend who has been paying close attention.

**Hue does not sound like:**
- A corporate wellness tool ("maximise your potential")
- A therapist ("how does that make you feel")
- An assessment report ("your score indicates")
- A life coach ("here's what you should do")
- An AI assistant ("I'd be happy to help with that")

**Test for any piece of copy:** Read it aloud. Does it sound like something a warm, intelligent human being would actually say to someone they respect? If not, rewrite it.

---

## The accessibility test

Before any piece of UI copy is finalised, apply this test: would someone on their very first day, who knows nothing about Hue, understand this immediately? If not, rewrite it. The app should work for a first-time visitor and still feel right for someone who has been using it for six months. Framework vocabulary (flex crossings, misreads, arc) is never used in navigation, buttons, prompts, or helper text — only in observations and companion responses where context has already been established.

---

*Part of The Change Maker Group ecosystem. IP belongs to Simon Phillips.*
