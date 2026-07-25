# RN-004: From Human Verification to Continuity Infrastructure

> **The Evolution of CPS-0001**
>
> Published: 2026-07-25 · The Continuity Lab
>
> Status: Active · [RN-003](../RN-003-cross-modal-binding) ← **RN-004** → TBD

---

## Abstract

CPS-0001 did not begin as a protocol. It began as an attempt to verify human motion. This note documents the intellectual path from that original hypothesis — "can physical motion signals provide evidence of continuity?" — through the limitations we encountered, to the abstraction shift that produced a protocol object. The core claim: what was missing in the identity landscape was not better detection, but an object layer capable of carrying continuity evidence across engines, sensors, and time.

---

## 1. The Original Hypothesis

We started with a question:

> Can physical motion signals — captured by commodity sensors, processed on-device — provide falsifiable evidence that the same embodied subject is continuously present across a bounded interval?

The hypothesis was motored by a specific observation: AI can generate faces, voices, and text, but it cannot generate biological motion entropy. Human movement contains micro-timing variance, noise residuals, and frequency spectra that generative models do not reproduce.

This produced the **Presence Entropy Score (PES)** — a 4-dimensional quantification of motion authenticity across kinematics, acceleration, jerk, and jerk spectrum. Human motion consistently scored 70+; simulated motion scored below 20.

Early results were encouraging. But a problem emerged.

---

## 2. The First Limitation

PES answered: *"Is this motion biologically generated?"*

It did not answer: *"Is this the same subject as before?"*

The gap was subtle but fundamental. A high PES score meant a human was present. It did not mean it was the *same* human observed 8 seconds ago.

This is not a PES problem. It is a category problem:

| Question | Domain | Existing Solutions |
|:---|:---|:---|
| Is this a human? | Liveness Detection | CAPTCHA, face liveness (crowded) |
| Who is this? | Identity Verification | Passkeys, biometrics, OIDC (crowded) |
| Is this the *same* subject as before? | **Continuity** | **Nothing** |

The third row was empty. Continuity — the property of being the same subject across a bounded interval — had no verifiable object representation.

This realization reframed the entire project.

---

## 3. The Abstraction Shift: From Detection to Evidence

The critical shift: **stop asking the engine to answer "is this continuous?" and instead ask it to produce structured evidence that a verifier can evaluate independently.**

```
BEFORE (Detection Model):
  Sensor → Engine → "PASS / FAIL"
  The engine IS the authority.

AFTER (Evidence Model):
  Sensor → Engine → Evidence → Receipt → Verifier → Decision
  The engine PRODUCES evidence. The verifier EVALUATES it.
```

This separation — engine as evidence producer, verifier as evidence evaluator — is the core abstraction of CPS-0001.

It means:

- Engines can be replaced without changing verification logic
- Evidence from different engines can be combined
- Verification is auditable: a third party can inspect *why* something passed or failed
- The protocol does not care what sensor produced the evidence

---

## 4. CPS-0001 Emergence

From this abstraction, the protocol object took shape:

```
ContinuityReceipt
├── Assertion   — what is claimed (A₁–A₃: observation, continuity, integrity)
├── Evidence    — why it is believed (opaque engine payloads, engine-identified)
├── Context     — when / where / subject
├── Composability — predecessor reference (chain)
└── Signature   — who claims it (Ed25519)
```

The verification contract (V₁–V₇) separates engine-dependent checks from engine-independent ones:

| Step | Check | Engine-Dependent? |
|:---|:---|:---|
| V₁ | Schema validity | No |
| V₂ | Signature validity | No |
| V₃ | Assertion semantics | No |
| V₄ | Temporal bounds | No |
| V₅ | Evidence integrity | No |
| V₆ | Freshness / expiry | No |
| V₇ | Predecessor reference | No |

**Zero engine-dependent checks.** The verifier does not need to know what sensor, algorithm, or hardware produced the evidence. It only needs to verify the receipt structure, signature, and temporal constraints.

This is the definition of engine-independence.

---

## 5. Design Principles

Five principles emerged from the evolution — not designed upfront, but discovered through building and hitting limitations:

### 5.1 Protocol ≠ Engine

The protocol standardizes the receipt object, not the evidence engine. Any team can implement a compatible producer or verifier without reading MyShape source code. The reference verifier imports nothing from MyShape.

### 5.2 Evidence ≠ Identity

A Continuity Receipt does not assert who the subject is. It asserts that the subject observed at t₀ is the same subject observed at t₁. The distinction is not academic — it is what separates continuity from the crowded identity market.

### 5.3 Continuity ≠ Instantaneous Proof

Continuity is cumulative. A single receipt makes a weak claim; a chain of receipts makes a progressively stronger one. V₇ (predecessor reference) encodes this property at the protocol level.

### 5.4 Verification ≠ Interpretation

The verifier checks structural and cryptographic validity. It does not interpret evidence quality. Evidence evaluation belongs to the consumer — the application making a risk decision. The protocol enforces structure; the consumer enforces policy.

### 5.5 Objects > APIs

A protocol defined as a data object (with JSON Schema, test vectors, and a conformance suite) is more portable than a protocol defined as an API endpoint. Objects can be stored, forwarded, batched, and verified offline. APIs cannot.

---

## 6. Open Questions

We publish limitations before claims. The following are open:

| # | Question | Status |
|:---|:---|:---|
| Q₁ | Can an external team implement a conforming producer without reading MyShape code? | **Pending** — blind implementation test underway |
| Q₂ | What is the minimum number of independent evidence engines needed for a production-grade continuity assertion? | **Open** — VS-001 shows 93% with 2 engines; N > 2 untested |
| Q₃ | How does continuity decay over long intervals (> 1 hour)? | **Open** — longitudinal study planned |
| Q₄ | Can a receipt chain be verified without access to the original evidence payloads? | **Open** — ZK compression research needed |
| Q₅ | What is the formal adversarial model for continuity? | **Open** — C0-C3 defined; formal proofs pending |

---

## 7. What This Means

CPS-0001 is not a better CAPTCHA. It is not a better biometric. It is not a better identity protocol.

It is a **verifiable object layer** between identity and execution — a standardized container for continuity evidence that any engine can produce and any verifier can process.

The research question has shifted from *"can we verify human presence?"* to *"what is the minimum set of evidence engines required to produce a reliable continuity assertion, and can we standardize the object that carries it?"*

The first question was a product.
The second question is a protocol.

---

## References

- [CPS0001.md](../CPS0001.md) — Protocol specification v1.0-RC
- [RN-001: The Continuity Problem](https://myshape.com/research/notes/001-the-continuity-problem)
- [RN-002: PES Benchmark v0.2](https://myshape.com/research/notes/002-pes-benchmark)
- [RN-003: Cross-Modal Binding (477 runs)](https://myshape.com/research/notes/003-cross-modal-binding)
- [FD-001: Frame Rate Hypothesis](https://myshape.com/research/notes/005-failure-report-10fps)
- [FD-002: Why Single Evidence Engines Plateau](FD-002-single-engine-plateau.md) ← companion note
- [IMPLEMENT.md](../continuity-protocol/IMPLEMENT.md) — Build a receipt in 1 hour

---

*"We test hypotheses. We do not defend them. We publish limitations before we publish claims. Evidence precedes belief."*
