---
license: cc0-1.0
task_categories:
  - tabular-classification
language:
  - en
tags:
  - continuity-protocol
  - presence-detection
  - behavioral-biometrics
  - benchmark
  - cps-0001
pretty_name: CPS-0001 Benchmark Dataset
size_categories:
  - n<1K
---

# CPS-0001 Benchmark Dataset

**The Continuity Lab · v1.0-RC · CC0**

Benchmark data, test vectors, and engine performance metrics for CPS-0001 (Continuity Protocol Standard).

## Contents

| File | Description |
|:---|:---|
| `data/engine-status.json` | Evidence engine pass rates and run counts |
| `data/test-vectors-valid/` | 3 valid Continuity Receipts (single-engine, multi-engine, agent-trace) |
| `data/test-vectors-invalid/` | 3 invalid receipts (expired, tampered-evidence, broken-chain) |

## Engine Performance

| Engine | Pass Rate | N |
|:---|:---|:---|
| EE-001 Presence Entropy Score | 100% floor | — |
| EE-002 Event-Level Causal Coupling | 58% | 316 |
| EE-003 Gyroscope Challenge | 60% | 150 |
| VS-001 Dual-Engine Verification Session | 93% | 60 |

## Known Limitations

Documented in [FD-002](https://github.com/myshapeprotocol/myshape-protocol/blob/master/docs/FD-002-single-engine-plateau.md): individual evidence engines exhibit bounded reliability. CPS-0001 treats evidence composition as a first-class design principle.

## Citation

```bibtex
@misc{cps-0001-benchmark-v1,
  title = {{CPS-0001 Benchmark Dataset v1.0-RC}},
  author = {{The Continuity Lab}},
  year = {2026},
  url = {https://github.com/myshapeprotocol/myshape-protocol/tree/master/datasets/cps-0001-benchmark}
}
```

## License

CC0 1.0 Universal — public domain dedication.
