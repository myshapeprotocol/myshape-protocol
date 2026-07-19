# The Continuity Protocol

## A Verifiable Continuity Layer for the Decentralized Web

**Version 1.0 · July 2026**  
**The Continuity Lab**

---

> **Abstract:** The internet has protocols for identity, data, and value. It has no protocol for continuity — the property that a digital subject is the same physically embodied entity across time. We propose the Continuity Protocol: an open, sensor-agnostic specification for verifying temporal integrity of digital presence. This whitepaper presents the theoretical framework, experimental evidence (576 runs), formal specifications (2 RFCs), and reference implementation.

---

## 1. The Problem

### 1.1 What Identity Protocols Cannot Do

Every major internet protocol for trust answers the same question:

> *Who are you?*

Passwords. OAuth tokens. DID documents. Verifiable credentials. Static identifier hashes. ZK proofs of personhood. All of them establish **identity at a moment.**

None of them answer:

> *Are you still you, continuously, across time?*

This gap is not academic. It creates real vulnerabilities:

| Attack | Identity Protocol Response | Continuity Protocol Response |
|--------|---------------------------|------------------------------|
| Deepfake bypasses camera liveness | "The face matched." | IMU + camera must converge on same physical event |
| AI agent hijacked mid-session | "The key is still valid." | Temporal hash chain detects session break |
| Replay attack replays valid sensor data | "The pattern is in the database." | Randomized challenge-response breaks determinism |
| Sybil attack with synthetic motion | "Each account has a unique key." | Biological entropy in motion is non-synthesizable |

### 1.2 The Engineering Challenge

Continuity verification is not a UX problem. It is a **signal-processing and causality-verification problem** that operates on high-dimensional, real-time sensor streams:

- IMU accelerometer data at ~60Hz (4 channels: ax, ay, az, rotation rate)
- Camera pose estimates at ~7Hz (2D trajectory with depth ambiguity)
- Gyroscope rotation rates during active challenges

These streams are measured by **different sensors** with **different clocks**, **different sampling rates**, and **different noise characteristics**. Proving they describe the same physical event requires solving three hard sub-problems:

1. **Cross-modal temporal alignment.** Matching events across modalities with unknown clock offsets.
2. **Causal ordering verification.** Ensuring IMU force onsets precede camera trajectory changes (Newton's Second Law).
3. **Sovereign verification without enrollment.** Extracting biological entropy from motion alone — no prior template.

---

## 2. Architecture

### 2.1 Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Sensor-agnostic** | Any IMU + any camera can produce compatible input |
| **Device-independent** | Same entity produces correlating signatures across devices |
| **No enrollment** | No prior template, calibration, or training data required |
| **Non-identifying** | Motion Signature alone cannot re-identify an individual |
| **Falsifiable** | Every detection includes per-component evidence with explicit thresholds and diagnostics |

### 2.2 The Verification Pipeline

```
┌─────────────────────────────────────────────────────────┐
│                    SENSOR LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐      │
│  │   IMU    │  │  Camera  │  │   Gyroscope      │      │
│  │ 60Hz     │  │  7Hz     │  │  (Challenge)     │      │
│  │ ax,ay,az │  │  x,y,z   │  │  rx,ry,rz        │      │
│  └────┬─────┘  └────┬─────┘  └───────┬──────────┘      │
└───────┼─────────────┼────────────────┼─────────────────┘
        │             │                │
        ▼             ▼                ▼
┌─────────────────────────────────────────────────────────┐
│                 EVIDENCE ENGINES                         │
│                                                          │
│  EE-001 (PES)      EE-002 (Causal)    EE-003 (Gyro)     │
│  ────────────      ───────────────    ──────────────     │
│  · Micro-timing    · Jerk peaks      · 3 rounds         │
│  · Noise residual  · Direction Δ     · Jittered timing  │
│  · Freq entropy    · Match ±500ms    · CFC-005 check    │
│  · Bio perturb     · CFC-005         · CFC-008 check    │
│                                                          │
│  Output: EngineEvidence { components[], diagnostics[] }  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 VERIFICATION POLICY                      │
│                                                          │
│  evaluatePolicy(policy, confidence) → Verdict            │
│                                                          │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │ REJECT   │   │  ESCALATE    │   │    ACCEPT       │  │
│  │ < 0.35   │   │ 0.35 – 0.70 │   │    ≥ 0.70       │  │
│  └──────────┘   └──────┬───────┘   └─────────────────┘  │
│                        │                                  │
│                        ▼                                  │
│                  EE-003 (Active)                          │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 EVIDENCE RECEIPT                         │
│                                                          │
│  { sessionId, verdict, confidence,                       │
│    engineEvidence[], evidenceDigest (SHA-256),           │
│    previousReceiptHash, cfcResults[] }                   │
│                                                          │
│  ─── H(R₁) ─── H(R₂) ─── H(R₃) ───  (hash chain)       │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Evidence Engines

| Engine | Name | Type | Function |
|--------|------|------|----------|
| EE-001 | Presence Entropy Score | Passive | Quantifies biological entropy in IMU data |
| EE-002 | Event-Level Causal Coupling | Passive | Matches IMU jerk peaks to camera direction changes |
| EE-003 | Gyroscope Challenge | Active | Randomized directional challenges defeat replay |
| EE-004 | TEE Attestation | Future | Hardware-backed execution environment verification |
| EE-005 | Execution Trace | Future | Software execution integrity |

### 2.4 Continuity Failure Conditions (CFC)

Each CFC is a specific, measurable condition that, if triggered, reduces continuity confidence:

| ID | Name | Severity | Detection |
|----|------|----------|-----------|
| CFC-001 | Entropy Drop | HIGH | PES drops >50% between sessions |
| CFC-002 | Sensor Profile Change | HIGH | IMU noise profile changes beyond calibrated variance |
| CFC-003 | Temporal Gap | MEDIUM | Inter-session interval exceeds configured maximum |
| CFC-005 | Causal Inversion | HIGH | Camera direction change precedes IMU jerk by >250ms |
| CFC-006 | Challenge Non-Response | HIGH | Entity fails to respond to gyroscope challenge |
| CFC-007 | Challenge Mismatch | HIGH | 0/3 rounds match challenge direction |
| CFC-008 | Predictability | MEDIUM | Motion too consistent — may be mechanical |

**CFC-005 validation:** Activated 13 times in independent-device runs, **0 times** in single-device runs. This confirms CFC-005 measures genuine temporal causality, not sensor noise.

---

## 3. Experimental Evidence

### 3.1 Dataset Summary

| Engine | N | Pass Rate | Key Signal |
|--------|---|-----------|------------|
| EE-001 (presence) | — | 100% floor | Living entities are distinguishable |
| PE-001 single-device | 50 | 93% | Temporal alignment 100% |
| PE-001 independent (3 trackers) | 266 | 58% | **Temporal alignment 276/276 = 100%** |
| EE-003 (challenge) | 200 | 59% | 2/3 rounds sufficient in 84% of PASS cases |
| VS-001 (pipeline) | 60 | 93% | Passive stage 100%, escalation reliable |
| **Total** | **576** | — | All data, diagnostics, and failures public |

### 3.2 Independent-Device Validation

The central experimental result: **276 independent-device runs, 100% temporal alignment.** When camera and IMU are on *different* devices — a desktop camera and a phone IMU — jerk peaks and direction changes consistently converge within the ±500ms match window. This is not an artifact of single-device tremor coupling.

### 3.3 Tracker Iteration

Three generations of camera motion tracking were tested:

| Tracker | N | Pass Rate | fps | Lesson |
|---------|---|-----------|-----|--------|
| Pixel differencing | 66 | 27% | 38 | Proved the architecture works |
| Color-blob centroid | 100 | 80% | 49 | Filtering background noise is a 3× gain |
| Moving-blob filter | 100 | 87% daytime | 49 | Temporal + spatial filtering isolates moving hand |

Temporal alignment remained at 100% through all three trackers — confirming that cross-modal binding is a property of the physical event, not the tracking algorithm.

### 3.4 Negative Results (Published Failures)

**FD-001: Frame Rate Hypothesis.** Increasing camera sampling from 6.7fps to 10fps *decreased* pass rate from 87% to 70%. At higher frame rates, the 1.5px movement threshold filtered out more biological signal. **Lesson:** optimal sampling rate is determined by signal amplitude, not sensor capability.

**DL-001: Direction Asymmetry.** Up/down (pitch) challenges pass more reliably than left/right (yaw) in EE-003. Recorded for future calibration — not acted upon without data confirmation. **Lesson:** distinguish "we noticed this" from "we know this."

---

## 4. RFC System

All specifications are published as RFCs under an open artifact versioning system:

| Prefix | Type | Current |
|--------|------|---------|
| RN | Research Note | 001–003 |
| RFC | Specification | 0001–0002 |
| BM | Benchmark | 001 |
| FD | Foundation (failure/hypothesis) | 001 |
| DL | Decision Log | 001 |
| EE | Evidence Engine | 001–003 |
| VS | Verification Session | 001 |

**RFC-0001: Motion Signature Format.** Defines PES computation, jerk peak detection (MAD-based dynamic threshold, τ = median + 2×MAD, floor 0.15 m/s³), cross-modal temporal matching (±500ms window, 90° direction tolerance), and challenge-response protocol (3 rounds, jittered timing). Reference implementation: `npm install myshape`.

**RFC-0002: Continuity Proof Format.** Defines Evidence Receipts (SHA-256 hash-chained, UUIDv4 sessions), CFC catalog (8 conditions with severity levels), Verification Policy framework (accept/reject thresholds, escalation rules), and Cross-Device Binding metrics (Pearson correlation of binned IMU streams).

Both RFCs are **Drafts.** External contributions are invited.

---

## 5. Reference Implementation

```bash
npm install myshape
```

```typescript
import { verifyContinuity } from "myshape";

const result = await verifyContinuity({
  imuSamples: deviceMotionEvents,     // required
  cameraSamples: videoMotionFrames,   // optional
});

// { verdict: "PASS" | "FAIL" | "INSUFFICIENT_EVIDENCE",
//   confidence: 0.0–1.0,
//   evidence: { components[], diagnostics[], evidenceDigest } }
```

**Repository structure:**

| Path | Content |
|------|---------|
| `packages/myshape/` | npm package (84 tests) |
| `src/lib/evidence/` | Core engines (121 tests) |
| `src/app/research/` | Research Hub + interactive prototypes |
| `papers/` | Research papers + benchmarks |

---

## 6. Research Roadmap

### Phase 1 — Complete ✓

- [x] Presence Entropy Score (EE-001)
- [x] Cross-modal causal coupling (EE-002 / PE-001)
- [x] Challenge-response (EE-003)
- [x] Dual-engine pipeline (VS-001)
- [x] 576 experimental runs
- [x] RFC-0001, RFC-0002 (Drafts)
- [x] Reference implementation (npm package)

### Phase 2 — In Progress

- [ ] Cross-device continuity (two-device protocol)
- [ ] Open benchmark dataset (HuggingFace)
- [ ] RFC stabilization (Internet-Draft format)
- [ ] External researcher onboarding

### Phase 3 — Future

- [ ] Longitudinal study (same entity, weeks apart)
- [ ] Multi-entity tracking (N > 1 in camera frame)
- [ ] Privacy-preserving verification (ZK EvidenceReceipt)
- [ ] First external-authored RFC

---

## 7. Call for Collaboration

The Continuity Protocol is an open research program. We invite:

- **Researchers:** Challenge our RFCs. Reproduce our experiments. Publish contradictory findings.
- **Engineers:** Build compatible verifiers from the RFCs. Submit issues and pull requests.
- **Funders:** Support open protocol research that extends the decentralized web at the infrastructure layer.

**The next milestone is not a new engine. It is the first external contributor.**

---

*The Continuity Lab · [thecontinuitylab.org](https://thecontinuitylab.org) · [github.com/ContinuityLab-Org](https://github.com/ContinuityLab-Org) · [huggingface.co/TheContinuityLab](https://huggingface.co/TheContinuityLab)*
