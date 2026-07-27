# Data Licensing — The Continuity Lab / CPS-0001

## Dataset Availability

| Component | Access | License | Notes |
|:---|:---|:---|:---|
| PES Benchmark (human motion samples) | **Restricted** | — | Raw motion data contains identifiable kinematic patterns. Available upon request with data use agreement. |
| CPS-0001 test vectors (valid) | **Open** | CC0-1.0 | Synthetic receipts for conformance testing. |
| CPS-0001 test vectors (invalid) | **Open** | CC0-1.0 | Tampered / expired / broken-chain receipts. |
| Engine status metadata | **Open** | CC0-1.0 | Aggregate pass rates, N counts, configuration. |
| Evaluation scripts | **Open** | MIT | Benchmark harness, analysis notebooks. |
| Synthetic motion benchmarks | **Open** | CC0-1.0 | GAN, spline, random-walk, near-static strategies. |

## Rationale

Restricted access for human motion samples follows the principle of data sovereignty:
raw motion data can be used to infer identity traits. We publish extracted features,
aggregate statistics, and synthetic benchmarks — enough for third-party replication
without exposing subject-level raw data.

## Citation

If you use any component of this dataset, please cite:

```
@misc{continuitylab2026cps0001,
  title = {CPS-0001: Continuity Protocol Standard — Benchmarks and Test Vectors},
  author = {{The Continuity Lab}},
  year = {2026},
  url = {https://huggingface.co/ContinuityLab-Org}
}
```
