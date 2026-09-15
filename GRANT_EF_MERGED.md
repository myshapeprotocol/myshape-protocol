# Continuity Protocol

## Open Research & Grant Proposal

**The Continuity Lab · July 2026**  
**github.com/myshapeprotocol · thecontinuitylab.org**

---

## Executive Summary

Smart contracts can verify signatures, balances, and state transitions. They cannot verify that the entity signing a transaction at T₂ is the same physically embodied entity that signed at T₁.

We propose to build this missing verification primitive as open infrastructure for the Ethereum ecosystem.

**Request: $50,000 for 6 months of open protocol research.**

| Deliverable | Type |
|-------------|------|
| RFC-0003 (Verification API) | Ethereum-native continuity verification API |
| Open Dataset v1 (576 runs) | HuggingFace — reproducible by any researcher |
| Reproducible Benchmark Suite | CI pipeline — anyone can verify our claims |
| Reference Implementation | npm + Rust — two independent implementations |
| Ethereum Integration Guide | How DAOs, DeFi, and identity protocols can use continuity proofs |

All outputs under MIT or CC0 license.

**576 experiments. 2 RFCs. Reference implementation. All open-source.**

---

## 1. The Problem Ethereum Can't Solve Yet

| Scenario | Ethereum Can Verify | Ethereum Cannot Verify |
|----------|--------------------|-----------------------|
| DAO vote passes | ✓ Signature is valid | ✗ Same entity voted at T₁ and T₂ |
| DeFi vault withdraws | ✓ Key has permission | ✗ Entity holding key is the entity that deposited |
| AI agent executes trade | ✓ Agent's key signed | ✗ Agent hasn't been hijacked mid-session |
| Sybil-resistant airdrop | ✓ Unique address per claim | ✗ 100 addresses aren't one entity with 100 keys |

Ethereum has world-class cryptography for identity. It has no primitive for **continuity** — the temporal integrity of presence.

---

## 2. Architecture

### The Verification Pipeline

```
┌─────────────────────────────────────────────────────────┐
│                    SENSOR LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐      │
│  │   IMU    │  │  Camera  │  │   Gyroscope      │      │
│  │ 60Hz     │  │  7Hz     │  │  (Challenge)     │      │
│  └────┬─────┘  └────┬─────┘  └───────┬──────────┘      │
└───────┼─────────────┼────────────────┼─────────────────┘
        │             │                │
        ▼             ▼                ▼
┌─────────────────────────────────────────────────────────┐
│                 EVIDENCE ENGINES                         │
│  EE-001 (PES)      EE-002 (Causal)    EE-003 (Gyro)     │
│  · Micro-timing    · Jerk peaks      · 3 rounds         │
│  · Noise residual  · Direction Δ     · Jittered timing  │
│  · Freq entropy    · Match ±500ms    · CFC checks       │
│                                                          │
│  Output: EngineEvidence { components[], diagnostics[] }  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 VERIFICATION POLICY                      │
│  evaluatePolicy → Verdict                                │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │ REJECT   │   │  ESCALATE    │   │    ACCEPT       │  │
│  │ < 0.35   │   │ 0.35 – 0.70 │   │    ≥ 0.70       │  │
│  └──────────┘   └──────┬───────┘   └─────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 EVIDENCE RECEIPT                         │
│  { sessionId, verdict, confidence,                       │
│    engineEvidence[], evidenceDigest (SHA-256),           │
│    previousReceiptHash, cfcResults[] }                   │
│  ─── H(R₁) ─── H(R₂) ─── H(R₃) ───  (hash chain)       │
└─────────────────────────────────────────────────────────┘
```

### Evidence Engines

| Engine | Name | Type | Function |
|--------|------|------|----------|
| EE-001 | Presence Entropy Score | Passive | Quantifies biological entropy in IMU data |
| EE-002 | Event-Level Causal Coupling | Passive | Matches IMU jerk peaks to camera direction changes |
| EE-003 | Gyroscope Challenge | Active | Randomized directional challenges defeat replay |
| EE-004 | TEE Attestation | Future | Hardware-backed execution environment verification |
| EE-005 | Execution Trace | Future | Software execution integrity |

### Continuity Failure Conditions (CFC)

| ID | Name | Severity | Detection |
|----|------|----------|-----------|
| CFC-001 | Entropy Drop | HIGH | PES drops >50% between sessions |
| CFC-002 | Sensor Profile Change | HIGH | IMU noise profile changes beyond calibrated variance |
| CFC-005 | Causal Inversion | HIGH | Camera direction change precedes IMU jerk by >250ms |
| CFC-006 | Challenge Non-Response | HIGH | Entity fails to respond to gyroscope challenge |
| CFC-007 | Challenge Mismatch | HIGH | 0/3 rounds match challenge direction |
| CFC-008 | Predictability | MEDIUM | Motion too consistent — may be mechanical |

**CFC-005 validation:** Activated 13 times in independent-device runs, **0 times** in single-device runs — confirming genuine temporal causality detection.

---

## 3. RFC System

All specifications published under an open artifact versioning scheme:

| Prefix | Type | Current |
|--------|------|---------|
| RN | Research Note | 001–003 |
| RFC | Specification | 0001–0002 |
| BM | Benchmark | 001 |
| FD | Foundation (failure/hypothesis) | 001 |
| DL | Decision Log | 001 |

**RFC-0001: Motion Signature Format.** Defines PES computation, jerk peak detection (MAD-based dynamic threshold), cross-modal temporal matching (±500ms window, 90° tolerance), and challenge-response protocol.

**RFC-0002: Continuity Proof Format.** Defines Evidence Receipts (hash-chained), CFC catalog, Verification Policy framework, and Cross-Device Binding metrics.

Both RFCs are **Drafts** — external contributions invited.

---

## 4. Experimental Evidence

| Engine | N | Pass Rate | Key Finding |
|--------|---|-----------|-------------|
| Presence detection | — | 100% floor | Living entities distinguishable from synthetic |
| Cross-modal coupling | 316 | 58% | **Temporal alignment 100%** across independent devices |
| Challenge-response | 200 | 59% | Randomized challenges defeat simple replay |
| Dual-engine pipeline | 60 | 93% | Escalation architecture reliable |

**Total: 576 experimental runs.** Temporal alignment 276/276 = 100% across independent device deployments.

### Negative Results (Published)

- **FD-001:** Higher frame rate decreased accuracy — more data ≠ better data
- **DL-001:** Direction asymmetry in gyroscope challenges — recorded, not acted upon
- **Tracker iteration:** 3 generations → 3× gain, temporal alignment 100% throughout

---

## 5. Team

The Continuity Lab is a research entity dedicated to open-source continuity infrastructure. We bring together expertise in motion-tracking pipelines, real-time sensor signal processing, and decentralized identity standards. All research is conducted in the open — RFCs, datasets, test suites, and failure reports are published under permissive licenses.

---

## 6. Reference Implementation

```typescript
import { verifyContinuity } from "myshape";
// One function. Sensor data in → verification result out.
// npm install @thecontinuitylab/myshape · 140 tests · Apache 2.0 license
```

---

**Full dataset, failure reports, and interactive prototypes available at huggingface.co/TheContinuityLab and myshape.com/research.**
