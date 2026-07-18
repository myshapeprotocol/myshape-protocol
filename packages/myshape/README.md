# MyShape Protocol

> **Researching continuity as a verifiable property of the digital world.**

[![RFC-0001](https://img.shields.io/badge/RFC-0001-blue)](https://www.myshape.com/research/notes/004-motion-signature-rfc)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

`myshape` is the reference implementation of the [MyShape Motion Signature Format (RFC-0001)](https://www.myshape.com/research/notes/004-motion-signature-rfc).  
One function. Sensor data in → verification result out.

## Install

```bash
npm install myshape
```

## Usage

```ts
import { verifyContinuity } from "myshape";

const result = await verifyContinuity({
  imuSamples: [
    { t: 0, ax: 0.1, ay: -0.3, az: 9.8, rx: 15, ry: -5, rz: 2, interval: 16 },
    { t: 16, ax: 0.5, ay: -0.8, az: 9.7, rx: 22, ry: -8, rz: 5, interval: 16 },
    // ... 8 seconds of IMU data at ~60Hz
  ],
  cameraSamples: [
    { t: 120, x: 45.2, y: 78.1, z: 0 },
    { t: 320, x: 48.7, y: 82.3, z: 0 },
    // ... optional: camera motion frames at ~7Hz
  ],
});

console.log(result.verdict);    // "PASS" | "FAIL" | "INSUFFICIENT_EVIDENCE"
console.log(result.confidence); // 0.0 – 1.0
console.log(result.evidence);   // per-component scores + diagnostics
```

## What It Checks

| Layer | What | How |
|-------|------|-----|
| **Presence** | Is there a living entity? | Presence Entropy Score (PES): 4D feature extraction |
| **Events** | Are there force onsets? | Jerk peak detection with dynamic MAD threshold |
| **Binding** | Do camera and IMU see the same event? | Cross-modal temporal matching ±500ms |
| **Continuity** | Is the entity the same across time? | Verification session with hash-chained receipts |

## Reference

- **[RFC-0001: Motion Signature Format](https://www.myshape.com/research/notes/004-motion-signature-rfc)** — formal specification
- **[RN-003: Cross-Modal Binding](https://www.myshape.com/research/notes/003-cross-modal-binding)** — experimental validation (477 runs)
- **[FD-001: Frame Rate Hypothesis](https://www.myshape.com/research/notes/005-failure-report-10fps)** — what we tried, what failed

## The Continuity Lab

This package is maintained by [The Continuity Lab](https://www.myshape.com/research), a research group studying continuity as a verifiable property of the digital world.

- **Research Notes** → [myshape.com/research](https://www.myshape.com/research)
- **GitHub** → [github.com/myshapeprotocol](https://github.com/myshapeprotocol)

## License

MIT
