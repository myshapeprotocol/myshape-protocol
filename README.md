# The Continuity Lab

> **Researching continuity as a verifiable property of the digital world.**

[![RFC-0001](https://img.shields.io/badge/RFC-0001-Motion_Signature-blue)](https://www.myshape.com/research/notes/004-motion-signature-rfc)
[![npm](https://img.shields.io/badge/npm-myshape-red)](https://www.npmjs.com/package/myshape)
[![Experiments](https://img.shields.io/badge/experiments-576-green)](https://www.myshape.com/research/notes/003-cross-modal-binding)
[![Tests](https://img.shields.io/badge/tests-121%20passed-brightgreen)](https://github.com/myshapeprotocol/myshape-protocol)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## What is this?

We study whether **continuity** — the unbroken chain of sovereign existence — can be made a verifiable cryptographic property.

The **MyShape Protocol** is our first publication: a motion-signature system that verifies that two sensor observations describe the same physically embodied entity, across time and across devices.

- **Not biometrics.** Not identity. It doesn't answer "who are you?"
- It answers: **"Are you still you, continuously?"**

---

## Continuity vs. Traditional Verification

| | Traditional | Continuity Protocol |
|---|-------------|---------------------|
| **Question** | Who are you? | Are you still you? |
| **Data** | Static credentials (keys, tokens, hashes) | Real-time sensor streams (IMU 60Hz, camera 7Hz) |
| **Attack surface** | Credential theft, replay, deepfake | Requires physical presence + causal consistency |
| **Time model** | Snapshot — verified at login | Trajectory — verified continuously |
| **Enrollment** | Required (password, scan, template) | None — extracts entropy from motion alone |
| **Output** | Token / session | EvidenceReceipt — hash-chained, verifiable |

---

## Quick Start

```bash
npm install @thecontinuitylab/myshape
```

```ts
import { verifyContinuity } from "myshape";

const result = await verifyContinuity({
  imuSamples: deviceMotionEvents,      // required: IMU data
  cameraSamples: videoMotionFrames,     // optional: camera data
});

// { verdict: "PASS", confidence: 0.87, evidence: {...} }
```

[→ RFC-0001: Motion Signature Format](https://www.myshape.com/research/notes/004-motion-signature-rfc)

---

## What We've Built

| Layer | Engine | N | Pass Rate | Status |
|-------|--------|---|-----------|--------|
| Presence Detection | EE-001 (PES) | — | 100% floor | Active |
| Causal Coupling | EE-002 / PE-001 | 316 | 58% | Active |
| Challenge-Response | EE-003 | 200 | 59% | Active |
| Dual-Engine Pipeline | VS-001 | 60 | 93% | Active |

**576 experimental runs** on consumer iPhone hardware. All data, diagnostics, and failure analysis are public.

[→ RN-003: Cross-Modal Binding (full data)](https://www.myshape.com/research/notes/003-cross-modal-binding)

---

## Research

| Document | Type | Description |
|----------|------|-------------|
| [RFC-0001](https://www.myshape.com/research/notes/004-motion-signature-rfc) | Specification | Motion Signature Format — implementable by any team |
| [RN-003](https://www.myshape.com/research/notes/003-cross-modal-binding) | Research Note | Cross-Modal Binding — 576-run validation |
| [FD-001](https://www.myshape.com/research/notes/005-failure-report-10fps) | Failure Report | Frame Rate Hypothesis — what we tried, what failed |
| [RN-002](https://www.myshape.com/research/notes/002-pes-benchmark) | Research Note | PES Benchmark v0.2 |
| [RN-001](https://www.myshape.com/research/notes/001-the-continuity-problem) | Research Note | The Continuity Problem |

[→ Research Hub](https://www.myshape.com/research) · [Research Agenda](https://www.myshape.com/research/agenda)

---

## Roadmap & Status

| Component | Status | Notes |
|-----------|--------|-------|
| TypeScript Reference Implementation | **Stable** | npm package · 84 tests |
| Rust Port | **In Development** | Core logic written, not yet in public repo |
| Benchmark Dataset (576 runs) | **Stable** | HuggingFace: `ContinuityLab-Org/myshape-576` |
| CI Benchmark Pipeline | **Pending** | GitHub Actions — funded by active grant application |
| RFC-0003 (Verification API) | **Pending** | Specification — funded by active grant application |

---

## Repository Structure

```
myshape-protocol/
├── packages/myshape/        # npm package: verifyContinuity()
├── src/
│   ├── lib/evidence/        # Core evidence engines + tests
│   ├── app/research/        # Research Hub + interactive prototypes
│   └── app/api/             # API routes
├── papers/                  # Research papers + benchmarks
└── docs/                    # Documentation
```

---

## Development

```bash
git clone https://github.com/myshapeprotocol/myshape-protocol.git
cd myshape-protocol
npm install
npm run dev          # → https://localhost:3443
npm test             # → 121 tests
npm run benchmark    # → 2 benchmark suites
```

---

## Transparency

The Continuity Lab is committed to radical transparency in research and protocol development. All technical specifications (RFCs), research notes (RN), experimental data, and reference implementations are published openly on GitHub under MIT license.

Operational, institutional, and strategic planning remains strictly internal.

---

## The Continuity Lab

We are a research group studying continuity as a verifiable property.

1. **We test hypotheses. We do not defend them.**
2. **We publish limitations before we publish claims.**
3. **We publish failures alongside successes.**
4. **Evidence precedes belief.**

[thecontinuitylab.org](https://thecontinuitylab.org) (forthcoming) · [myshape.com](https://www.myshape.com)

---

## Roadmap

[Research Roadmap](ROADMAP.md) — what we've built, what we're building, what we aim to prove.

> **Current phase: Build → Validate.** The protocol has enough substance to be scrutinized. We are inviting external feedback.

## License

MIT
