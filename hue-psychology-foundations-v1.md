# Hue AI — Psychological & Theoretical Foundations
*hue-psychology-foundations-v1.md — Permanent reference for Claude Code and Project Hue*
*Last updated: April 2026*

Every assessment conversation, observation, and language decision in Hue should be traceable to the frameworks and texts in this document. This is not background reading — it is a design constraint.

---

## 1. Overview — The Theoretical Stack

Hue's methodology rests on a coherent stack of psychological theory spanning Jungian analytical psychology, constructive-developmental theory, occupational psychology, and contemporary behavioural science. Each layer of the stack supports a specific aspect of how Hue is built and how it behaves.

The stack is not a collection of borrowed credibility. Each text is cited because it directly explains a design decision — in the assessment conversation, the language philosophy, the flex mechanic, the retest model, or the longitudinal profile.

| Theoretical layer | What it grounds in Hue |
|---|---|
| Jungian analytical psychology | The four energy framework, the flex mechanic, the inferior function as growth frontier |
| Type development theory | The longitudinal profile, the retest model, why profiles shift meaningfully over time |
| Constructive-developmental theory | Why the practice layer is developmentally meaningful, not just habitual |
| Occupational psychology | The behavioural assessment approach, why conversation outperforms questionnaire |
| Motivation theory | The organisational team dashboard, the gap radar, B2B ROI framing |
| Behavioural science | The language philosophy, the flex challenge design, the System 1/2 distinction |

---

## 2. Core Texts — Annotated

### Jungian Foundations

**Carl Jung — Psychological Types (1921)**
The foundational text. Jung's articulation of four psychological functions (Thinking, Feeling, Sensing, Intuition) and two attitude types (Extraversion, Introversion) is the direct ancestor of Hue's four energy model. Critically, Jung defined psychological type as a habitual attitude — a tendency and preference, not a fixed capability. This is the theoretical basis for Hue's language philosophy ("tends toward" not "is"). Jung also introduced the concept of the inferior function — the least preferred energy, not absent but underdeveloped and accessible through deliberate effort. This is the theoretical foundation for the flex mechanic and the daily practice layer.

Key principle: "There is no such thing as a pure extravert or a pure introvert. Such a man would be in the lunatic asylum." — Jung. Energies are tendencies existing on a spectrum, never absolutes.

**Isabel Briggs Myers — Gifts Differing (1980)**
Myers translated Jung's framework into practical application and introduced the concept of type development over time — that people don't have a fixed type but develop their type expression across their lifespan. This is the direct theoretical ancestor of Hue's longitudinal model. The assessment is not capturing a fixed trait but a developmental stage of type expression. Myers also emphasised that each type has characteristic gifts — strengths arising from preference, not superiority. This grounds Hue's philosophy that no energy is better than another.

**John Beebe — Integrity in Depth (1992)**
Beebe's eight-function model and his work on how type expression shifts under stress and through development is directly relevant to two Hue features: the retest mechanic (why profiles shift meaningfully over time, particularly under pressure) and the accountability layer in reassessment (why answers under stress may diverge from the stable profile). Beebe also introduced the concept of type as a moral framework — that developing all functions is an ethical aspiration, not just a developmental one. This gives philosophical depth to Hue's insistence that all four energies are always accessible.

---

### Constructive-Developmental Theory

**Jane Loevinger — Ego Development (1976)**
Loevinger's stages of ego development describe how people's relationship to their own psychological patterns changes as they mature. At earlier stages, type is experienced as fixed identity ("I'm just like this"). At later stages it is experienced as a tendency the individual can observe and deliberately work with. This maps precisely onto Hue's philosophy that energies are preferences not traits, and gives the longitudinal model genuine developmental grounding.

**Robert Kegan — The Evolving Self (1982)**
Kegan's constructive-developmental theory describes how meaning-making structures evolve over time. His concept of subject-object relationships — what you are subject to (cannot observe) at one stage becomes object (something you can see and work with) at the next — is the theoretical underpinning of why Hue's longitudinal profile is developmentally meaningful. People who can observe their energy tendencies as tendencies rather than experiencing them as simply "who I am" are operating at a more developed stage. Hue's practice layer facilitates this shift.

**Robert Kegan — In Over Our Heads (1994)**
Extends the developmental model into adult professional life. Kegan argues that the demands of modern organisational life require a level of self-authorship — the ability to hold one's own values, beliefs, and patterns as objects of reflection rather than being subject to them — that most adults have not yet developed. Hue's companion is designed to support this development explicitly. The energy awareness prompt ("how are you showing up this week?") is a Kegan-grounded developmental intervention, not a mood tracker.

---

### Occupational Psychology — Assessment Methodology

**Walter Mischel — Personality and Assessment (1968)**
The foundational critique of questionnaire-based personality assessment. Mischel argued that behaviour is more reliably predicted by situational and behavioural observation than by self-report questionnaires, because questionnaire responses are subject to social desirability bias, retrospective distortion, and forced-choice artefacts. This is the most important methodological argument for Hue's conversational assessment model. Hue's behavioural questions ("what did you do" not "what would you prefer") are a direct implementation of Mischel's critique.

**Samuel Gosling — Snoop (2008)**
Gosling's research on behavioural observation as a more accurate personality assessment method than self-report directly supports Hue's conversational model. His finding that observable behavioural traces produce more accurate personality judgements than questionnaire responses provides empirical support for the assessment design. Gosling also demonstrated that brief behavioural samples yield surprisingly accurate personality assessments — supporting the validity of Hue's relatively short conversational assessment.

**David McClelland — Human Motivation (1987)**
McClelland's research on motivation and achievement is the empirical grounding for Hue's organisational proposition. His work on how individual motivational profiles predict behaviour in team contexts, and how understanding those profiles improves team performance, provides the theoretical basis for the team dashboard and gap radar. McClelland also argued that behavioural competency assessment produces better predictive validity for real-world performance than traditional psychometric tests — directly relevant to Hue's approach.

---

### Behavioural Science — Contemporary Grounding

**Daniel Kahneman — Thinking, Fast and Slow (2011)**
Kahneman's System 1 (fast, automatic, habitual) and System 2 (slow, effortful, deliberate) distinction maps directly onto Hue's core mechanic. The assessment measures System 1 tendencies — the energy expressions that happen automatically, without conscious deliberation. The practice layer develops System 2 capacity — the ability to pause, notice the habitual response, and deliberately choose a different energy. This framing gives Hue's practice mechanic a clear cognitive science basis and makes the value of the daily companion immediately comprehensible to organisational buyers.

**Carol Dweck — Mindset (2006)**
Dweck's growth mindset research is the empirical backbone of Hue's core philosophy. Her finding that people who believe capabilities can be developed through effort actually develop them — and that people who believe capabilities are fixed do not — is directly relevant to every aspect of how Hue communicates. The language philosophy (never say "can't", always say "tends toward") is a growth mindset implementation. The flex mechanic is grounded in Dweck's finding that deliberate practice in areas of low preference produces real change.

**Albert Bandura — Self-Efficacy: The Exercise of Control (1997)**
Bandura's self-efficacy theory — that belief in one's capacity to perform a behaviour predicts whether one will attempt it, persist at it, and succeed — is the psychological mechanism behind Hue's practice layer design. The flex challenge mechanic is designed to produce small, achievable successes with less preferred energies, building self-efficacy for those energies incrementally. Bandura's finding that mastery experiences are the most powerful source of self-efficacy beliefs grounds the design choice to start with achievable challenges rather than ambitious ones.

---

## 3. Design Implications for Claude Code

The following principles are direct design constraints derived from the theoretical stack above. Every assessment conversation, observation, and system prompt should conform to these principles. They are requirements with theoretical justification.

**Language — energies as tendencies**
Basis: Jung's definition of type as habitual attitude, not fixed trait.
Constraint: Always use "tends toward", "naturally reaches for", "feels most at home when". Never "is", "can't", "leads with" as a fixed descriptor.

**Assessment questions — behavioural not hypothetical**
Basis: Mischel's critique; Gosling's behavioural observation research.
Constraint: Always ask "what did you do" not "what would you prefer". Ask about specific recent situations, not generalised preferences.

**The flex mechanic — inferior function as growth frontier**
Basis: Jung's inferior function theory; Bandura's self-efficacy and mastery experiences.
Constraint: Flex challenges must be specific, achievable, and grounded in something real the user described. Generic tips are not flex challenges. The least preferred energy is always framed as a growth frontier, never a deficit.

**The longitudinal profile — development not drift**
Basis: Myers' type development theory; Loevinger's ego development stages; Kegan's subject-object model.
Constraint: Profile changes over time should be interpreted as developmental movement, not instability. Reassessment conversations should frame shifts as growth evidence, not inconsistency.

**The practice layer — System 2 development**
Basis: Kahneman's System 1/2 distinction; Dweck's growth mindset research.
Constraint: The companion is developing deliberate choice — System 2 capacity — not changing the underlying System 1 profile. Both are valid and both are worth naming. The goal is not to change who someone is but to expand what they can choose.

**No energy is better than another**
Basis: Myers' gifts of each type; Jung's warning against type hierarchy.
Constraint: All four energies must be presented as having equal value in every context. No energy is framed as more desirable, more intelligent, more effective, or more suited to leadership.

---

## 4. What Is Not Yet Established — The Validation Gap

The theoretical stack provides the foundation for why Hue's approach should work. What does not yet exist is empirical evidence that it does work — that the profiles produced by conversational AI assessment correlate meaningfully with established instruments and demonstrate the reliability and validity that psychometric standards require.

This is the validation gap. It is honest, it is expected at this stage, and it should be named directly in any conversation with psychologists, HR professionals, or potential advisory board members.

**The validation study — what it needs to establish:**
- Convergent validity: Do Hue's conversational assessment results correlate meaningfully with established instruments (Insights Discovery, MBTI, Big Five)?
- Test-retest reliability: Do profiles remain stable across repeated assessments when no significant change has occurred?
- Construct validity: Do the four energy dimensions behave as distinct constructs?
- Predictive validity: Do energy profiles predict real-world behavioural patterns as the theoretical framework suggests?

The theoretical stack in this document is the literature review for the validation study. The research question: "Can conversational AI produce psychometrically valid personality assessment, and what does rigorous validation of such an instrument require?"

---

## 5. The Joint Paper — Proposed Structure

Co-authored with Nigel Evans (and potentially Dr Angelina Bennet).

**Proposed title:** Conversational AI as a Psychometric Instrument: Theoretical Foundations, Methodological Considerations, and a Proposed Validation Framework

**Proposed sections:**
1. Abstract: The case for conversational AI as a next-generation psychometric instrument, and the standards required to validate it.
2. Introduction: The limitations of questionnaire-based assessment (Mischel, Gosling) and the theoretical case for conversational alternatives.
3. Theoretical foundations: The Jungian and developmental psychology stack.
4. Methodology: How Hue's conversational assessment is designed, what it measures, and how it differs from existing instruments.
5. Validation framework: What a rigorous validation study for this type of instrument should include.
6. Preliminary findings: Early data from Hue's beta cohort, presented as hypothesis-generating rather than conclusive.
7. Implications: What validation of a conversational AI psychometric instrument would mean for assessment standards, BPS registration criteria, and the future of personality profiling.

---

## 6. Hue Identity Lines — Decided April 2026

Three lines serve three distinct audiences and purposes. All are decided. Do not reopen without instruction from Simon.

| Line | Text | Use |
|---|---|---|
| Product identity | *Four energies. Infinite versions of you.* | Welcome screen, result card, individual marketing |
| Purpose | *Understand how you show up. Reach for who you could be.* | Facilitator/org materials, about page, onboarding |
| Academic | *The science is serious. The experience is human.* | Methodology page, credentialing contexts only |

**The word 'reach' is Hue's own verb.** Use consistently throughout all product copy and marketing. Never substitute 'develop', 'grow', or 'access'.

---

## 7. Neuroscience of Stress — The Grip

### The core mechanism

Jung described the inferior function grip intuitively in 1921. Modern neuroscience now explains the precise biological mechanism.

Under stress, the amygdala activates strongly and overrides the prefrontal cortex, which governs deliberate conscious behaviour: working memory, attention, response inhibition, and cognitive flexibility. Under stress, all of these are impaired.

In Jungian terms: the prefrontal cortex is where the dominant energy lives. When it goes offline under stress, the least conscious part of the personality — the inferior function, the least preferred energy — takes over. The person does not feel like themselves because neurologically, they are not operating from their normal centre.

**Naomi Quenk — In the Grip: Understanding Type, Stress and the Inferior Function (2000)**
The bridge text between Jung's theoretical description of the inferior function and its practical manifestation under stress. Describes what each type looks like in the grip, what triggers it, and how recovery happens. Directly applicable to Hue's stress response design.

### The four energies under stress

- **Spark under stress:** Loses decisive clarity. Becomes paralysed or compulsively over-controlling. The grip pulls toward catastrophising — the opposite of Spark's directness.
- **Glow under stress:** Loses warmth and optimism. Becomes isolated or catastrophically negative about relationships. The grip pulls toward cold detached logic — the opposite of Glow's connection.
- **Root under stress:** Loses steadiness. Becomes rigidly procedural or suddenly impulsive. The grip pulls toward frantic uncharacteristic action — the opposite of Root's patience.
- **Flow under stress:** Loses vision and composure. Becomes emotionally overwhelmed or fixated on irrelevant detail. The grip pulls toward emotional flooding — the opposite of Flow's clarity.

### What Hue does with this

1. **Name it without pathologising:** "The way you're describing this doesn't quite sound like you — it sounds like the version of you that shows up when things get really hard. That's worth noticing."

2. **Restore access to the auxiliary energy:** Recovery from the grip is not about pushing back toward the dominant energy — which is exhausted — but gently activating the auxiliary, the second energy. For a Flow person in the grip: "Before you decide anything, is there one person whose perspective would help?" — a Glow-energy prompt that re-engages the relational auxiliary.

3. **Distinguish grip from genuine profile change:** Prefrontal cortex impairment under stress means a person retesting during high stress will produce grip answers, not stable profile answers. Hue's reassessment accountability layer is neurologically grounded: "Has something changed, or does this feel like a more accurate picture?"

### The novel argument for the paper with Nigel Evans

Neuroscience provides a mechanistic explanation for the Jungian concept of the inferior function grip — a connection neither field has made explicitly in a personality development context. Hue's stress response mechanic is the practical implementation of both theories working together. That is publishable.

---

*This document is a live design constraint. Every assessment conversation, observation, and language decision should be traceable to the frameworks above. All frameworks and citations are requirements, not background reading.*
