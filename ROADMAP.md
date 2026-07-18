# Research Roadmap

> The Continuity Lab is researching whether continuity can become a verifiable property of the digital world. This roadmap documents what we've built, what we're building, and what we aim to prove.

---

## 2026

### Foundations

| ID | Title | Status |
|----|-------|--------|
| FD-001 | Frame Rate Hypothesis | ✓ Published |
| DL-001 | Direction Asymmetry in EE-003 | ✓ Published |

### Research Notes

| ID | Title | Status |
|----|-------|--------|
| RN-001 | The Continuity Problem | ✓ Published |
| RN-002 | PES Benchmark v0.2 | ✓ Published |
| RN-003 | Cross-Modal Binding (477 runs) | ✓ Published |
| RN-004 | TBD | ← Next |

### Specifications (RFC)

| ID | Title | Status |
|----|-------|--------|
| RFC-0001 | Motion Signature Format | ✓ Draft |
| RFC-0002 | Continuity Proof Format | ✓ Draft |
| RFC-0003 | Verification API | ← Planned |

### Evidence Engines

| ID | Name | Status | N | Pass Rate |
|----|------|--------|---|-----------|
| EE-001 | Presence Entropy (PES) | Active | — | 100% floor |
| EE-002 | Event-Level Causal Coupling | Active | 316 | 58% |
| EE-003 | Gyroscope Challenge | Active | 150 | 60% |
| EE-004 | TEE Attestation | Future | — | — |
| EE-005 | Execution Trace | Future | — | — |

### Verification Sessions

| ID | Name | Status | N | Pass Rate |
|----|------|--------|---|-----------|
| VS-001 | Dual-Engine Pipeline | Active | 60 | 93% |

### Benchmarks

| ID | Name | Status |
|----|------|--------|
| BM-001 | PES Benchmark v0.2 | Active |
| BM-002 | Cross-Modal Binding | Planned |

---

## 2027 (Planned)

### Research

- Cross-device continuity (two-phone protocol)
- Longitudinal study (same entity, weeks apart)
- Multi-entity tracking (N > 1 in camera frame)
- Privacy-preserving verification (ZK EvidenceReceipt)

### Specifications

- RFC-0003: Verification API
- RFC-0004: SDK Specification
- RFC-N: First external-authored RFC

### Infrastructure

- Published benchmark suite (reproducible by any lab)
- External researcher onboarding
- `npm install myshape` → 5-minute integration

---

## Artifact Versioning

| Prefix | Type | Example |
|--------|------|---------|
| RN | Research Note | RN-003: Cross-Modal Binding |
| RFC | Request for Comments | RFC-0001: Motion Signature Format |
| BM | Benchmark | BM-001: PES v0.2 |
| FD | Foundations (failure/hypothesis) | FD-001: Frame Rate Hypothesis |
| DL | Decision Log | DL-001: Direction Asymmetry |
| EE | Evidence Engine | EE-003: Gyroscope Challenge |
| VS | Verification Session | VS-001: Dual-Engine Pipeline |
| PE | Prototype Engine | PE-001: Causal Coupling |

---

## Strategic Focus

**Q3 2026: Build → Validate.**

The protocol has enough theoretical and experimental substance to be scrutinized by outsiders. The next phase is not about building more engines — it is about:

1. **Stabilizing the public surface.** Research Hub, Lab site, and demos must be accessible and coherent.
2. **Inviting external feedback.** 5–15 researchers, developers, or security practitioners who can question, test, and challenge the assumptions.
3. **Making `verifyContinuity()` truly runnable.** 5 minutes from npm install to a working result.
4. **Preparing funding materials.** Founder Research Memo and Fundraising Note ready for distribution.

The milestone that matters next is not a new engine.
It is the first third-party citation, issue, or pull request.

---

<sub>The Continuity Lab · [thecontinuitylab.org](https://thecontinuitylab.org) · [github.com/ContinuityLab-Org](https://github.com/ContinuityLab-Org)</sub>
