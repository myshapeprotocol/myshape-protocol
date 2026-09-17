# @thecontinuitylab/myshape

> **Motion-signature verification for continuity proofs. CPS-0001 compatible.**

[![CPS-0001](https://img.shields.io/badge/CPS-0001-v1.0--RC-gold)](https://github.com/myshapeprotocol/myshape-protocol)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)
[![npm](https://img.shields.io/badge/npm-@thecontinuitylab/myshape-red)](https://www.npmjs.com/package/@thecontinuitylab/myshape)

Reference implementation of the MyShape motion-signature engine. Sensor data in → verification result out. Research by [The Continuity Lab](https://thecontinuitylab.org).
> **SDK 0.3.0 predates Batch-2D hardening — evaluation only. For hardened verification, use the repository reference verifier / cps-verify.**

## Install

```bash
npm install @thecontinuitylab/myshape
```

## Quick Test

```ts
import { verifyContinuity } from "@thecontinuitylab/myshape";

const result = await verifyContinuity({
  imuSamples: [],       // required — IMU sensor samples (EE-002)
  cameraSamples: [],    // optional — camera motion (EE-002 cross-modal)
  frames: [],           // optional — pose frames (EE-001 PES)
  timestamps: [],       // optional — pose frame timestamps (EE-001)
  challengeResults: [], // optional — challenge rounds (EE-003)
});

// → { verdict, confidence, evidence, threatReport }
```

`verifyContinuity` implements CPS-0001 v0.2 two-stage verification: Stage 1 = EE-001 ≥ 0.50 (Presence Entropy Score); Stage 2 = EE-003 = 1.0 (all 3 challenge rounds pass); both must pass. Confidence is the weaker stage (min). EE-002 (Cross-Modal Causal Coupling) is informational only and does not affect the verdict.

## CPS-0001 Receipts

For engine-independent continuity receipts, the package also exports the CPS-0001 layer — `buildReceipt`, `signReceipt`, `verifyReceipt`, `generateKeyPair`, plus full schema checks (`verifySchema`, `verifyAssertions`, `verifyTemporal`, `verifyFreshness`). Receipts are Ed25519-signed and interoperable across implementations.


