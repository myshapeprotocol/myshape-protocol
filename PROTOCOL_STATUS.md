# CPS-0001 Protocol Status

**v1.0-RC** · Last updated: 2026-07-25

---

## Version

`v1.0-RC` — Research Candidate. Semantic model is stable. Wire formats may receive minor adjustments before v1.0.

---

## What's Complete

| Component | Status |
|:---|:---|
| Specification | ✅ Complete — [CPS0001.md](CPS0001.md) |
| Reference Verifier (V₁–V₇) | ✅ Complete — [`reference-verifier/verifier.ts`](continuity-protocol/reference-verifier/verifier.ts) |
| Test Vectors | ✅ Complete — 5 receipts (valid, chained, expired, tampered, broken-chain) |
| Conformance Suite | ✅ Complete — 23 assertions, 10 scenarios |
| CLI Verifier | ✅ Complete — `npx cps-verify` |
| HTTP Verifier Plugin | ✅ Complete — Express middleware |
| JSON Schema | ✅ Complete |
| SDK (TypeScript) | ✅ Complete — `@thecontinuitylab/myshape` |
| Documentation | ✅ Complete — [IMPLEMENT.md](continuity-protocol/IMPLEMENT.md), [QUICKSTART.md](continuity-protocol/QUICKSTART.md), [ENGINE_AUTHORING_GUIDE.md](continuity-protocol/ENGINE_AUTHORING_GUIDE.md) |

---

## What's Pending

| Milestone | Status |
|:---|:---|
| **External Implementation** | ⏳ Pending — blind implementation test recruiting |
| **Production Consumer** | ⏳ Pending — no application has consumed a CPS-0001 receipt in production |
| **Cross-Engine Interoperability** | ⏳ Pending — two engines have not yet produced mutually verifiable receipts |
| **Longitudinal Continuity (> 1 hour)** | ⏳ Pending — experimental design phase |
| **Formal Adversarial Model** | ⏳ Pending — C0-C3 defined, formal proofs not yet attempted |

---

## Evidence Engine Status

| ID | Engine | Pass Rate | N | Status |
|:---|:---|:---|:---|:---|
| EE-001 | Presence Entropy Score (PES) | 100% floor | — | Active |
| EE-002 | Event-Level Causal Coupling | 58% | 316 | Active · [FD-002](docs/FD-002-single-engine-plateau.md) |
| EE-003 | Gyroscope Challenge | 60% | 150 | Active · [FD-002](docs/FD-002-single-engine-plateau.md) |
| EE-004 | TEE Attestation | — | — | Future |
| EE-005 | Execution Trace | — | — | Future |

---

## Known Limitations

- **Evidence ecosystem is immature.** Three engines exist. All were built by the same team. Diversity of evidence sources has not been demonstrated.
- **No external producers.** The protocol's engine-independence claim has not been independently verified.
- **Single-team bias.** Specification, verifier, test vectors, and engines were all created by one research group.
- **Single-subject testing.** All experiments involve one subject. Demographic, environmental, and hardware variability are unexplored.
- **No longitudinal data.** Continuity has been tested over 8-second intervals. Hour-scale continuity is unmeasured.

---

## What This Means

CPS-0001 is ready for **evaluation**, not production.

- A third party **can** implement a conforming producer or verifier today.
- A third party **should not** rely on it as a sole trust mechanism in a production system.

The protocol semantics are stable. The evidence ecosystem is not.

---

## How to Help

→ [IMPLEMENT.md](continuity-protocol/IMPLEMENT.md) — Build a compatible producer or verifier. One hour. Any language.

→ [Discussions](https://github.com/myshapeprotocol/myshape-protocol/discussions) — Questions, ideas, implementation experience.

→ [Issues](https://github.com/myshapeprotocol/myshape-protocol/issues) — Bugs, spec ambiguities, suggestions.

---

## Research Notes

| ID | Title |
|:---|:---|
| [RN-001](https://myshape.com/research/notes/001-the-continuity-problem) | The Continuity Problem |
| [RN-002](https://myshape.com/research/notes/002-pes-benchmark) | PES Benchmark v0.2 |
| [RN-003](https://myshape.com/research/notes/003-cross-modal-binding) | Cross-Modal Binding (477 runs) |
| [RN-004](docs/RN-004-cps-0001-evolution.md) | From Human Verification to Continuity Infrastructure |
| [FD-001](https://myshape.com/research/notes/005-failure-report-10fps) | Frame Rate Hypothesis |
| [FD-002](docs/FD-002-single-engine-plateau.md) | Why Single Evidence Engines Plateau |

---

*"We publish limitations before we publish claims."*
