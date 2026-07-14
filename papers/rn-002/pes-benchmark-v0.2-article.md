# Your Face Doesn't Matter: What Biological Motion Reveals That Biometrics Cannot

> The Continuity Lab — RN-002 · PES Benchmark v0.2
> July 2026

---

**The identity verification industry has a problem it hasn't fully confronted.**

Every biometric system you've ever used — face recognition, fingerprint scanning, voice matching — operates on the same principle: capture a biometric signal, hash it, compare it to a stored template. If the patterns match, you're in. If they don't, you're out.

This architecture assumes something that has become increasingly difficult to defend: that biometric signals are hard to fabricate.

They aren't. A single photograph, a 15-second voice recording, a short video clip — enough to generate convincing synthetic media in any biometric modality. The marginal cost of producing synthetic biometric data that passes visual inspection continues to decline rapidly. It has not reached zero. But the curve points in one direction.

There is, however, a deeper structural problem. **Biometric systems ask the wrong question.**

They ask: "Does this sample match the enrolled template?"

The question they should ask is: "Is there a living, breathing biological entity present right now — the *same* entity that was present moments ago?"

These are fundamentally different questions. The first is about pattern matching. The second is about *biological continuity*. And pattern matching, no matter how sophisticated, cannot prove continuity. A photograph passes a face match. A replay passes a voice match. A synthetic fingerprint passes a capacitive sensor. Each clears the pattern-matching bar while failing the continuity bar — silently.

---

## What We Observed

The Presence Entropy Score began with an observation, not a hypothesis.

We noticed that when we measured human motion — real, unscripted, natural movement — the data contained a kind of irregularity that synthetic motion, across the generators we evaluated, consistently lacked. This irregularity wasn't noise in the conventional sense. It was *structured* — consistent across subjects, present across conditions, and measurable with standard tools.

We call this property **presence entropy**: the statistical depth of biological irregularity in a motion sample.

It manifests across four dimensions, each independently measurable:

**Micro-timing variance.** Human motor control introduces irreducible frame-to-frame jitter. Muscles do not fire at perfectly regular intervals. Across the synthetic generators we evaluated — random walk, spline interpolation, GAN-based, and near-static — motion timing was measurably more regular. Not because the generators were poorly designed, but because they had no reason to model involuntary motor noise.

**Noise residual.** Subtract a smoothed trajectory from the raw signal. For human motion, the residual is substantial and stochastically distributed. For synthetic motion, it is close to zero — a natural consequence of interpolation and smoothing in generation pipelines. Smoothness is aesthetically desirable. It is also, from a detection standpoint, a signature.

**Frequency entropy.** Human motion distributes energy broadly across the frequency spectrum. Gesturing, fidgeting, postural sway — each operates at a different frequency band. Synthetic motion, in the generators evaluated, concentrates energy in narrower bands, a consequence of keyframe interpolation.

**Biological perturbation.** Low-amplitude, high-frequency oscillations characteristic of living tissue. These micro-tremors are involuntary and present in all human motion, including deliberate stillness. Across the synthetic generators evaluated, no strategy reproduced this signature. Current generation models do not model involuntary physiological oscillation — not because it is impossible, but because it has not yet been a target.

We evaluated all four dimensions experimentally. The current production classifier uses a subset. Future engines may incorporate additional dimensions as benchmark coverage expands.

---

## How We Measured It

The v0.2 benchmark dataset consists of **281 motion samples** across two classes.

**Human motion: 81 samples from 54 subjects.** Each subject performed 30 seconds of unstructured, unscripted motion captured via standard webcam at 30 fps using MediaPipe Pose (33-point landmark model). No choreography, no calibration, no controlled environment. Lighting, background, camera angle, and clothing were deliberately unstandardized — the benchmark must reflect real-world conditions, not laboratory ones. Multiple recordings were collected from a subset of participants; the sampling distribution was intentionally uneven to capture within-subject variance where available. 81 samples from 54 subjects reflects practical data-collection constraints, not a claim of population coverage.

**Synthetic motion: 200 samples** from four generation strategies (50 each): Gaussian random walk, Catmull-Rom spline interpolation between human-like keyframes, conditional GAN trained on human pose sequences, and near-static poses with increasing noise injection.

All samples were anonymized: 33 joint coordinates per frame, 3 spatial coordinates per landmark, at 30 fps. Pure geometry. No identities, no faces.

---

## What We Found

The aggregate PES separates human from synthetic motion with a large effect size.

| Metric | Value | Interpretation |
|--------|-------|---------------|
| Cohen's d | **2.1** | Large effect (>2σ separation between distributions) |
| AUC | **0.94** | Random human scores higher than random synthetic 94% of the time |
| Precision | **1.00** | No human sample misclassified as synthetic at current threshold |
| Recall | **0.96** | 4% of human samples fall below the classification threshold |

The **entropy margin** — the gap between the lowest-scoring human subject and the highest-scoring synthetic strategy — is 0.03 (human floor: 0.41, synthetic ceiling: 0.38). No overlap in the current sample. Small margin, clean separation.

Each dimension independently contributes to the separation:

| Dimension | Human Mean | Synthetic Mean | Gap |
|-----------|-----------|---------------|-----|
| Micro-timing variance | 0.72 | 0.18 | 0.54 |
| Noise residual | 0.68 | 0.22 | 0.46 |
| Frequency entropy | 0.74 | 0.25 | 0.49 |
| Biological perturbation | 0.61 | 0.12 | 0.49 |

The largest gap — micro-timing variance — is also the most intuitive to explain. Human motion is measurably irregular at the frame level. Synthetic motion, across the generators evaluated, is not.

---

## Boundary Conditions

We state explicitly what this benchmark does *not* establish.

**It does not prove continuity.** The PES detects biological tissue in motion at a single point in time. It does not, by itself, establish that the same biological entity has been continuously present. Closing this gap — from presence-at-a-moment to continuity-over-time — is the central research question of the Continuity Lab.

**It does not identify individuals.** The PES measures a population-level statistical property, not an individual signature. Two different humans with similar motor characteristics may produce indistinguishable PES scores. This separation between presence verification and identity attribution is intentional.

**It does not provide a security guarantee.** The current entropy margin (0.03) is an empirical observation from the generators evaluated, not a theoretical lower bound. A motivated attacker with knowledge of the PES architecture could potentially design generation strategies that narrow this gap. Replay attacks — capturing genuine human motion and replaying it — remain an explicit open question rather than a solved security property. A dedicated replay benchmark is scheduled for Q4 2026.

**It does not claim that AI cannot reproduce biological entropy.** Current synthetic motion generation does not reproduce the statistical entropy observed in biological motion under our benchmark conditions. This is a statement about what has been demonstrated, not a claim about what is possible. Future generators may close this gap. The benchmark's purpose is to measure whether and when they do.

**The sample is not yet representative.** 54 subjects is sufficient to detect a large effect with statistical significance, but does not capture the full distribution of human motion entropy across age, mobility, neurological conditions, and cultural movement patterns. The benchmark may overestimate discriminability for populations not represented in the current sample.

---

## Why This Matters

Three reasons.

**First, it moves the verification problem from pattern space to biological dynamics.** Pattern matching is a contest AI will continue to improve at. The statistical structure of biological motion — the irreducible irregularity of living tissue — is a measurement target, not a pattern to be matched. Its existence is independent of AI capability. Its detectability may not be.

**Second, it separates presence from identity at the architectural level.** Most identity systems conflate these. The PES demonstrates that you can verify "a biological entity is present" without knowing which entity — and without storing an identity template. Presence first. Identity second, if needed.

**Third, it defines a research program, not a product.** The PES is not finished. The benchmark is not final. The entropy margin is not guaranteed. What exists is a measurement framework, a baseline dataset, and a clear articulation of what we do and do not yet know. This is more valuable than a polished claim.

---

## Research Program

Three priorities for the remainder of 2026:

**v0.3 (Q3 2026).** Scale to 300+ human subjects with explicit coverage of age, mobility, and hardware diversity. Publish per-subgroup analysis. If Cohen's d remains above 1.5 across all subgroups, the signal is robust. If any subgroup shows d < 1.0, the benchmark has identified a boundary condition — and boundary conditions are more valuable than confirmation.

**Replay benchmark (Q4 2026).** Capture genuine human motion and replay it through a virtual camera. Measure whether the PES detects the replay. This is a harder problem: the motion itself is genuine biological data, but it is not continuously present. Replay remains an explicit open question.

**Longitudinal stability (Q4 2026).** Measure the same subjects across multiple sessions, days apart. If intra-subject PES variance exceeds inter-subject variance, continuity verification requires session-to-session signal stability that the current benchmark does not assess.

---

*We do not defend our results. We design the next experiment that could falsify them.*

*[Research note: RN-002](https://myshape.com/research/notes/002-pes-benchmark) · [Active prototypes](https://myshape.com/research) · [Continuity Lab](https://myshape.com/research/agenda)*
