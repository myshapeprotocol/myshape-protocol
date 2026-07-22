# Continuity Dataset Specification

**Status: Active · 576 runs across 4 engines · Consumer hardware**

---

## What This Is

The Continuity Dataset is a collection of experimental runs measuring whether continuity — the unbroken chain of physical presence — can be detected from sensor data. Each run contains IMU (accelerometer + gyroscope) data captured at ~60Hz during an 8-second observation window, plus engine verdicts and diagnostics.

This is the **first open dataset for continuity verification research**.

## Why It Matters

Continuity verification needs a benchmark. Without a shared dataset, every team invents their own evaluation — making it impossible to compare approaches. This dataset provides:

1. **Reproducible comparisons** between evidence engines
2. **Ground truth** for continuity/non-continuity scenarios
3. **Real-world variability** — different devices, lighting conditions, motion patterns

## Dataset Composition

| Engine | Runs | Pass Rate | What It Measures |
|:---|:---|:---|:---|
| EE-001 Presence Detection | All runs | 100% floor | 4D entropy scoring from IMU |
| EE-002 Causal Coupling | 316 | 58% | IMU + camera event matching ±500ms |
| EE-003 Gyroscope Challenge | 200 | 59% | Randomized directional challenge, anti-replay |
| VS-001 Dual-Engine Pipeline | 60 | 93% | Passive presence + active challenge escalation |
| **Total** | **576** | — | Consumer hardware, real human subjects |

## Key Experimental Findings

| Finding | Data | Significance |
|:---|:---|:---|
| Temporal alignment across independent devices | 276/276 = 100% | Causal coupling works |
| CFC-005 (Causal Inversion) | 13/266 independent vs 0/50 single-device | Genuine security primitive |
| PE-001 moving-blob tracker | 62% overall, 87% daytime | Lighting-dependent |
| VS-001 escalation pipeline | 93% pass rate | Dual-engine architecture validated |

## Data Structure

Each experimental run is a CPS-0001 EngineEvidence block:

```typescript
{
  engineId: "EE-001",
  engineVersion: "1.2.0",
  confidence: 0.85,
  payload: {
    cv: 0.12,          // Timing coefficient of variation
    mvv: 0.45,         // Motion variance
    n: 480,            // Sample count (~60Hz × 8s)
    meanInterval: 16.67 // Mean inter-sample interval (ms)
  },
  payloadDigest: "sha256:a1b2c3..."
}
```

Raw IMU data (acceleration x/y/z, timestamp) is available for all 576 runs via the HuggingFace dataset.

## Limitations

We publish this openly:

1. **Sample size:** 576 runs from ~81 subjects is a research dataset, not a production benchmark. Statistical power is moderate.
2. **Demographic diversity:** Unknown. No demographic data was collected (privacy-preserving design).
3. **Hardware:** All runs use consumer smartphone IMUs. Industrial-grade sensors may differ.
4. **Attack coverage:** Only CFC-005 is experimentally validated. Other CFCs (001-004, 006-008) are theoretical.
5. **Lighting sensitivity:** Optical trackers degrade in artificial light. IMU-only engines are unaffected.

## Access

- **HuggingFace:** [ContinuityLab-Org/myshape-576](https://huggingface.co/ContinuityLab-Org/myshape-576)
- **Files:** engine_summary.csv, ee003_runs.csv, tracker_comparison.csv, dataset card
- **License:** Apache 2.0

## Extending the Dataset

We are actively collecting new runs. Contributions welcome:

1. Run `myshape.com/verify` on any smartphone
2. The data is anonymized and stored in the research database
3. Periodically, new runs are added to the HuggingFace dataset

**Target: 1,000 runs by 2026 Q4.**

## Citation

```
The Continuity Lab (2026). Continuity Dataset v0.2. 576 experimental runs
across 4 evidence engines. huggingface.co/ContinuityLab-Org/myshape-576
```

## Relationship to CPS-0001

All runs are compatible with CPS-0001. Engine evidence from any run can be wrapped in a Continuity Receipt using:

```typescript
import { engineEvidenceToBlock } from "@thecontinuitylab/myshape";
import { buildReceipt } from "continuity-protocol/reference-verifier/verifier";

const block = await engineEvidenceToBlock(engineEvidence);
const receipt = buildReceipt({ evidence: [block], interval, subject, issuer });
```

This makes the dataset not just a research artifact — it's a **test suite for protocol conformance**. Any verifier that processes these receipts correctly demonstrates CPS-0001 compatibility.
