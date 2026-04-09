# Hue AI — Language Guide
*hue-language-guide-v1.md · Added April 2026 · Technical vocabulary reference for energy names, rendering rules, approved phrasing, data ownership, and team/org language.*
*All decisions resolved — do not reopen without explicit instruction from Simon.*

---

## Purpose

This is the technical vocabulary reference — energy names, hex codes, rendering rules, approved phrasing tables, data ownership statements, and team/org language. **For voice, tone, banned phrasing, accessibility rules, companion response style, and email copy rules, see `hue-voice-v1.md`** — that is the master voice document and supersedes the voice/tone sections previously in this file.

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

## 1a. Reserved Words — Spark, Glow, Tend, Flow

The words **spark**, **glow**, **tend**, and **flow** are the names of the four energies. Because they are ordinary English words in common use, they carry a high risk of confusion if used in any other sense within Hue copy, UI text, companion responses, or communications. A user who reads "you tend to spark your instincts" is navigating two energy names and an unintended third meaning simultaneously.

**The rule:** These four words are reserved. They must only appear as energy names — capitalised, colour-rendered where applicable, and referring specifically to the Hue energy. They must never be used as plain English verbs, nouns, or adjectives in any Hue-authored text.

**Code implementation note:** This applies to all user-facing output — UI labels, companion responses, observation text, onboarding copy, emails, and any other text the product generates or displays. The rule does not apply when reflecting the user's own words back to them (see exception below).

### What to avoid

| ✗ Do not write | Why |
|----------------|-----|
| "You tend to reach for Spark energy" | "tend" used as a plain verb while also being an energy name |
| "That idea could spark something" | "spark" used as a plain verb while also being an energy name |
| "The conversation has a natural flow" | "flow" used as a plain noun |
| "There's a warm glow to how you show up" | "glow" used as a descriptive noun |
| "You tend toward your Tend energy" | same word used in two different senses in one phrase |
| "Things flow well when you reach for Flow" | plain and energy-name uses in the same sentence |

### What to use instead

Replace reserved words used as plain English with alternatives that carry no energy-name risk:

| Reserved word (plain use) | Alternatives |
|--------------------------|--------------|
| spark (verb/noun) | ignite, energy, drive, impulse — or rewrite the sentence |
| tend (to) | often, frequently, naturally, usually, typically, characteristically |
| flow (noun/verb) | rhythm, momentum, ease, move, progress, run |
| glow (noun/verb) | warmth, presence, quality, radiance — or rewrite the sentence |

### The one exception — reflecting the user's own words

If a user says "I feel like I flow through conversations easily" or "I tend to overthink," the companion may echo their exact phrasing back to them within the same response. This is natural conversation, not a Hue-authored statement, and the brief repetition is acceptable. The companion must not then build further sentences that continue using the word in its plain sense.

---

## 2. The Autonomy Voice

*Now fully covered in `hue-voice-v1.md` section 2. See that document for the complete autonomy voice rules.*

---

## 3. Approved Phrasing

### Describing energy expression
| Use | Never use |
|-----|-----------|
| naturally reaches for | is |
| often draws on | has |
| feels most at home when | always |
| instinctively goes to | never |

*Note: "tends toward" is banned — "tend" is a reserved word (see section 1a). Use "naturally reaches for" or "often draws on" instead.*
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

## 4. Banned Phrasing

*Now fully covered in `hue-voice-v1.md` section 7 (expanded list with additional entries). See that document for the complete banned list.*

---

## 5. The Word "Arc"

*Covered in `hue-voice-v1.md` section 7. "Arc" is internal only — never in user-facing copy.*

---

## 6. Trial and Subscription Language

*Now covered in `hue-voice-v1.md` sections 4 and 6. Trial expired screen updated to: "Your profile is still here. Pick up exactly where you left off." with "Keep going" CTAs.*

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

## 11. Tone, Voice, and Accessibility

*Now fully covered in `hue-voice-v1.md` sections 1 and 3. That document is the master reference for what Hue sounds like, the accessibility test, and all voice/tone decisions.*

---

*Part of The Change Maker Group ecosystem. IP belongs to Simon Phillips.*
