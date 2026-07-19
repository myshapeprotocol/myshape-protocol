# Protocol Labs Research Grant — Proposal

## Project: The Continuity Protocol — A Verifiable Continuity Layer for the Decentralized Web

**Submitted by:** The Continuity Lab  
**Date:** July 2026  
**Amount:** $50,000–$100,000 · **Duration:** 6 months  

---

## 1. Summary

The internet has protocols for identity (OAuth, DIDs), data (IPFS, HTTP), and value (Bitcoin, Ethereum). It has **no protocol for continuity** — the property that a digital subject is the same physically embodied entity across time.

We propose the **Continuity Protocol**: an open, sensor-agnostic, implementable specification. This RFC is extended with 2 published drafts (RFC-0001, RFC-0002), 576 experimental runs, and a reference implementation (`npm install myshape`).

**Protocol first, reference implementation provided.** We publish RFCs under permissive license and maintain `npm install myshape` as the canonical implementation — enabling zero-cost developer onboarding.

### 1.1 A Concrete Use Case

Consider a decentralized lending protocol. A user unlocks their vault at 09:00 with a valid key. At 09:10, a transaction requests withdrawal. How does the protocol know the entity at 09:10 is the same physical entity who unlocked the vault at 09:00 — and not a bot that acquired the key?

With the Continuity Protocol: each interaction produces a hash-chained EvidenceReceipt. The withdrawal at 09:10 generates a receipt with `previousReceiptHash` pointing to the 09:00 receipt. The protocol verifies that both receipts were produced by the same physically embodied entity — not by checking an enrollment template, but by verifying that the motion signatures are causally continuous across the 10-minute gap. Bot attacks are blocked at the verification layer, not the key-management layer.

This is not theoretical. It requires exactly the evidence engines, CFC catalog, and receipt chaining defined in RFC-0001 and RFC-0002.

---

## 2. The Hard Problem: Why No One Has Solved This

Current 2D identity layers (passwords, static identifiers, DID documents, ZK credentials) operate on **static data**. They verify that a credential was valid at a moment in time.

Continuity requires operating on **high-dimensional, real-time sensor streams** — IMU accelerometer data at 60Hz, camera pose estimates at 7Hz, gyroscope rotation rates — and proving that two independent streams describe the same physical event. This is a signal-processing and causality-verification problem that existing identity protocols were never designed to solve.

Three engineering barriers make this hard:

1. **Cross-modal temporal alignment.** An IMU jerk peak and a camera direction change are measured by different sensors with different clocks, different sampling rates, and different noise characteristics. Matching them requires MAD-based dynamic thresholding and empirically calibrated time windows (±500ms, determined from 576 live-phone runs).

2. **Causal ordering under device separation.** When camera and IMU are on the same device, hand tremor couples the signals. When they are on different devices, the camera-to-IMU lead time (~300ms) becomes measurable — and Causal Inversion (CFC-005) becomes a real security primitive. We detected this 13 times in independent-device runs and **0 times** in single-device runs.

3. **Sovereign verification without enrollment.** The protocol must verify continuity without a prior enrollment template — no visual scan, no static identifier, no audio template. This requires extracting biological entropy from motion alone, which imposes a hard physical floor: the signal must be above sensor noise but below the threshold where machine-generated motion becomes distinguishable. We calibrated this floor through iterative threshold tuning (v0.2 → v0.3: 33% → 65% pass rate on EE-003).

---

## 3. What We Know (and How We Know It)

### 3.1 Successful Experiments

| Engine | N | Pass Rate | Key Finding |
|--------|---|-----------|-------------|
| EE-001 (presence) | — | 100% floor | Living entities are distinguishable from synthetic |
| PE-001 (cross-modal) | 316 | 58% | **Temporal alignment 100%** across independent devices |
| EE-003 (challenge) | 200 | 59% | Random challenges defeat simple replay |
| VS-001 (pipeline) | 60 | 93% | Dual-engine escalation is reliable |

**Total: 576 experimental runs.** All data, per-run diagnostics, and CFC results are public.

### 3.2 Failed Experiments (More Informative Than Successes)

Research funders know: a lab that only publishes successes is hiding something. We publish failures alongside claims.

**FD-001: Frame Rate Hypothesis.** We hypothesized that increasing camera sampling from 6.7fps to 10fps would improve direction agreement by providing denser data. Result: pass rate *dropped* from 87% to 70%. The 1.5px movement threshold acted as a low-pass filter — at higher frame rates, more true biological motion fell below the noise floor. **Lesson:** more data ≠ better data. The optimal sampling rate is determined by signal amplitude, not sensor capability.

**DL-001: Direction Asymmetry.** An operator empirically observed that up/down (pitch) challenges pass more reliably than left/right (yaw) challenges in EE-003. We recorded this without changing parameters — because changing parameters *before* confirming the observation is how you overfit a research system. The observation is now a decision log awaiting formal analysis. **Lesson:** good research distinguishes between "we know this" and "we noticed this."

**Tracker iteration (unnumbered, but documented in RN-003).** Three generations of camera motion tracking: pixel differencing (27% pass), color-blob centroid (80% pass), moving-blob filter (87% pass). Each generation invalidated the previous approach's assumptions. The 3× gain from v1 to v2 proved that tracking fidelity, not causal decoupling, was the bottleneck. **Lesson:** when you iterate three times and temporal alignment stays at 100%, you've found a signal, not a bug.

These negative results are not failures of the protocol — they are evidence that we are testing hypotheses rather than defending them. A research funder should prefer a lab with a failure report over a lab that only shows demos.

---

## 4. Published RFCs — Invitations to Collaborate

We have published two RFCs. Neither is final. Both are explicitly labeled **Draft** and include open questions at the end. This is intentional.

**RFC-0001: Motion Signature Format.** Defines the PES computation, jerk peak detection algorithm (MAD-based dynamic threshold), cross-modal temporal matching protocol, and challenge-response extension. Target audience: any engineer who wants to build a compatible verifier.

**RFC-0002: Continuity Proof Format.** Defines Evidence Receipts, hash-chained session records, the CFC (Continuity Failure Condition) catalog, and the Verification Policy framework. Target audience: protocol designers and security auditors.

**Why this matters for your grant program:** these RFCs are not marketing documents. They are structured as implementable specifications with test suites. A reviewer can clone the repo, run `npx vitest run src/lib/evidence/`, and see 121 tests pass. The RFCs are a conversation invitation — we want external contributors to challenge, improve, or reject them.

---

## 5. Proposed Work (6 Months)

### Milestone 1: RFC Stabilization (Month 1–2)
- Finalize RFC-0001 and RFC-0002 as **Internet-Drafts**
- Incorporate external reviewer feedback
- Reference implementation passes all tests

### Milestone 2: Open Benchmark Dataset (Month 2–3)
- 576 experimental runs as structured JSON on HuggingFace
- Reproducible benchmark script
- **Key milestone:** an independent researcher can verify our claims without our help

### Milestone 3: Cross-Device Continuity Validation (Month 3–4)
- Two-device experiment with cross-correlation analysis
- Publish RN-004 with full data

### Milestone 4: External Researcher Onboarding (Month 4–6)
- Researcher guide + open workshop
- **Key milestone:** first external contribution (RFC comment, issue, or dataset extension)

---

## 6. Budget

| Category | Amount | Justification |
|----------|--------|---------------|
| Research infrastructure | $25,000 | Cloud, test devices, data storage |
| Engineering | $25,000 | SDK, test coverage, CI/CD |
| Publications | $15,000 | Hosting, submission fees, community |
| Operations | $10,000 | Legal, domains, admin |
| **Total** | **$75,000** | |

No funds for marketing. All work published openly under MIT license.

---

## 7. Risk Assessment & Mitigation

| Risk | Severity | Mitigation |
|------|----------|------------|
| Adversarial deepfake motion synthesis defeats cross-modal binding | HIGH | CFC-005 (Causal Inversion) detects camera-IMU ordering violations; 13 detections in 276 independent runs validate the defense |
| Environmental interference (lighting, sensor drift) degrades tracking | MEDIUM | Moving-blob tracker validated across daylight and artificial light; per-device calibration pipeline planned |
| Protocol complexity prevents external adoption | MEDIUM | Single-entry-point `verifyContinuity()` API; RFCs written as implementable specs, not whitepapers |
| Single-implementer risk (one lab maintains all code) | LOW | MIT license; RFCs are the spec — anyone can build a compatible verifier |

---

## 8. Why Protocol Labs

This project extends the decentralized web at the protocol layer — the same layer IPFS and Filecoin operate on. Our RFCs are content-addressable, our receipts are hash-chained, and our reference implementation is open-source.

**Interoperability with the PL stack:** Continuity Proofs (as defined in RFC-0002) are JSON-serializable, SHA-256 hash-chained objects. They can be stored as IPFS content-addressed objects and witnessed on Filecoin as verifiable data. A DAO governance vote, a DeFi vault unlock, or an AI agent identity declaration could store its continuity receipt on IPFS, making it permanently verifiable without trusting any centralized verifier.

We share the conviction that **open protocols, not centralized platforms, should define digital trust infrastructure.**

A grant from Protocol Labs would:
1. Validate continuity as a problem worth studying
2. Fund the transition from experimental data → published, reproducible benchmark
3. Signal to external researchers that this is a real protocol, not a whitepaper

---

*— The Continuity Lab · [thecontinuitylab.org](https://thecontinuitylab.org) · [github.com/ContinuityLab-Org](https://github.com/ContinuityLab-Org)*
