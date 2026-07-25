# FD-002: Why Single Evidence Engines Plateau

> **The bounded reliability of individual evidence sources — and why this validates CPS-0001's composability design.**
>
> Published: 2026-07-25 · The Continuity Lab
>
> Status: Active · [FD-001](https://myshape.com/research/notes/005-failure-report-10fps) ← **FD-002** → TBD

---

## Abstract

Individual evidence engines exhibit plateau behavior: EE-002 stabilizes at ~58% pass rate, EE-003 at ~60%. Further optimization of either engine in isolation shows diminishing returns. This is not a failure — it is a structural property of single-source evidence. The same limitation, however, validates the core design principle of CPS-0001: that evidence composability, not engine perfection, is the path to reliable continuity assertions.

---

## 1. The Data

### EE-002: Event-Level Causal Coupling

| Metric | Value |
|:---|:---|
| Runs | 316 |
| Pass Rate | 58% |
| Method | Cross-modal temporal matching of IMU jerk peaks and camera direction changes |
| Primary Failure Mode | Missing camera events when subject is outside frame or occluded |

EE-002 requires both IMU and camera to detect corresponding events within ±500ms. When the camera loses the subject — which happens naturally during movement — the binding fails. This is not an algorithmic defect. It is a sensor coverage limitation.

### EE-003: Gyroscope Challenge

| Metric | Value |
|:---|:---|
| Runs | 150 |
| Pass Rate | 60% |
| Method | Active challenge-response: subject responds to directional prompts |
| Primary Failure Mode | User compliance variability; some subjects misinterpret or delay responses |

EE-003 introduces active participation, which trades reliability for adversarial resistance. A subject who misunderstands the prompt fails — even though they are genuinely present. The engine correctly identifies non-compliance, but non-compliance ≠ non-human.

### Combined: VS-001 Dual-Engine Pipeline

| Metric | Value |
|:---|:---|
| Runs | 60 |
| Pass Rate | **93%** |
| Method | EE-001 (PES) + EE-002 (Causal) + EE-003 (Challenge) → combined evidence |

When three engines feed evidence into a single receipt, the combined pass rate jumps to 93%. Each engine covers failure modes the others miss.

---

## 2. The Plateau Pattern

Both EE-002 and EE-003 exhibit a recognizable plateau:

```
Pass Rate
 100% │
      │     ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
  80% │    █
      │   █
  60% │ ▄▄█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄  ← EE-002 plateau
      │ █
  40% │█
      │
      └──────────────────────────
         Optimization Effort →
```

Early improvements produce meaningful gains. But beyond a certain point, each additional optimization round yields marginal returns. The plateau is not a function of effort — it is a function of the inherent information limit of a single sensor modality.

---

## 3. Why This Validates CPS-0001

The CPS-0001 protocol does not require any single engine to be perfect. The protocol requires that:

1. **Evidence is structured** — each engine identifies itself and its evidence payload
2. **Evidence is composable** — multiple engines can contribute to a single receipt
3. **Verification is independent** — the verifier evaluates structure, not evidence quality

The plateau data validates all three requirements.

If a single engine could achieve 99%, composability would be optional optimization. The fact that engines plateau at 58-60% makes composability **structurally necessary**.

This is the design principle encoded in §5 of [RN-004](RN-004-cps-0001-evolution.md):

> Protocol ≠ Engine. Evidence composability is not a feature — it is the core defense against single-source bounded reliability.

---

## 4. What We Know

1. **Single evidence engines have bounded reliability.** EE-002 and EE-003 demonstrate that sensor-specific failure modes create hard ceilings independent of algorithm quality.

2. **Combined engines exceed the ceiling.** VS-001 at 93% (N=60) shows that composability works — three engines covering each other's failure modes produce a significant reliability gain.

3. **The protocol is correct to be engine-independent.** No engine is universally reliable. The protocol must accommodate engine diversity, not mandate a single engine.

---

## 5. What We Don't Know

| # | Question |
|:---|:---|
| Q₁ | What is the formal relationship between N independent engines and combined reliability? Is it additive or sub-additive? |
| Q₂ | At what N does composability reach diminishing returns? |
| Q₃ | Can an adversarial subject selectively fail one engine while passing others? What is the combinatorial attack surface? |
| Q₄ | Are there evidence types we haven't discovered that would raise single-engine ceilings? |
| Q₅ | Does the plateau change with subject demographics, environmental conditions, or hardware? |

---

## 6. Recommendation

**Do not optimize EE-002 or EE-003 beyond their current state.** The plateau data is more valuable as a documented boundary than a marginal 3-5% pass rate gain.

Instead:

1. **Freeze EE-002 and EE-003 at current versions.** Document their ceilings as known limits.
2. **Publish this failure report.** The honesty increases protocol credibility.
3. **Recruit additional evidence engines.** An external engine — built without reading MyShape source — would be the strongest validation of CPS-0001's engine-independence claim.
4. **Run more VS-001 sessions.** Increase N from 60 to 200+ to get a tighter confidence interval on the 93% combined pass rate.

---

## 7. The Principle

> Individual evidence sources exhibit bounded reliability. CPS-0001 therefore treats evidence composition as a first-class design principle, not an optimization strategy.

This is not a bug. It is the protocol's central insight.

---

## References

- [RN-004: CPS-0001 Evolution](RN-004-cps-0001-evolution.md)
- [CPS0001.md](../CPS0001.md) — Protocol specification §V₁–V₇
- [IMPLEMENT.md](../continuity-protocol/IMPLEMENT.md) — Build a CPS-0001 engine
- [ROADMAP.md](../ROADMAP.md) — Current research status

---

*"We publish limitations before we publish claims."*
