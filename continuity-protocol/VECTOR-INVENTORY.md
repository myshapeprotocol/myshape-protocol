# CPS-0001 VECTOR-INVENTORY (frozen v1.0-RC1)

File bytes are normative. Hashes below were recorded read-only; vector contents MUST NOT change.

**This file is a provenance and integrity inventory. It is not a conformance oracle.**
Expected outcomes are stated normatively in [`EXPECTED-RESULTS.md`](EXPECTED-RESULTS.md)
and `expected-results.json`, which are derived from the canonical specification
([`../CPS0001.md`](../CPS0001.md)) and contain no implementation references. Where
this file's historical observation columns disagree with those artefacts, the
artefacts govern.

| path | file_sha256 | source_commit | era | normative_status | expected (canonical, spec-derived) | historical observations (non-normative) |
|---|---|---|---|---|---|---|
| continuity-protocol/test-vectors/valid/single-engine.json | 65F528E08B7F4471C39CE088ED675F26EBD9D12A8FA9DB589C9C6FF5AECA66F8 | unknown | 13-field/JCS era (assumed, provenance not recorded) | normative | VALID (genesis; V7 N/A) | — |
| continuity-protocol/test-vectors/valid/multi-engine.json | 0693D58449603EE3D5F69BBBD529AE57179BF7E1C309EAAB75E055904076EF26 | unknown | 13-field/JCS era (assumed) | normative | VALID (V1-V7 pass, predecessor = single-engine) | formerly labelled `known-divergence`; see GAP-2 |
| continuity-protocol/test-vectors/valid/agent-trace.json | 5F715CD458970213C0EC0BB0E943D607E9448BB3E740E4D486212171CB4B3788 | unknown | unknown | normative (time-sensitive) | INVALID — `EXPIRED` at evaluationTime (V7 N/A — genesis: `previousReceiptHash` is `null`) | directory name is packaging metadata, not a verdict |
| continuity-protocol/test-vectors/generated/agent-trace.json | DF013BE344B397C97C58D1A3BE70650AAB611E7D1453298BA34C6A11B3F902DF | unknown | unknown | not published — gitignored (`.gitignore:182`); hash unverified here; duplicate of valid/agent-trace unexplained, do not merge/delete | — | signature mismatch plus expiry (unverified) |
| continuity-protocol/test-vectors/invalid/expired.json | 2374D75A73809C7D93F482277B519B1C0EEF8AA4C6A9783346A43944ABC07672 | unknown | 13-field era (assumed) | normative | INVALID — `EXPIRED` (V1-V5 pass) | — |
| continuity-protocol/test-vectors/invalid/tampered-evidence.json | 4A6367340E54841394C8D1D15B57F4C56095885198D6CCD629AFADBBA95F3C1B | unknown | 13-field era (assumed) | normative | INVALID — `EVIDENCE_TAMPERED` (V1-V4, V6 pass) | — |
| continuity-protocol/test-vectors/invalid/broken-chain.json | 8BB675D2192B49D2AD14C9BA93F4BE5EA86E54464874F15478E47B063210AF26 | unknown | 13-field era (assumed) | normative | INVALID — `CHAIN_BROKEN` (V7 FAIL, fail-closed: placeholder pointer unresolvable); V6 also fails (`EXPIRED`) but V7 precedes V6 in the normative order | — |
| continuity-protocol/test-vectors/valid/n2-predecessor.json | 1C3EB7EBE02728FB60258478A8AD9359A92B0981E5F01D091E79ACF766D770FF | N-2 batch | 13-slot/13-field era (N-2 generated) | normative (N-2) | VALID (genesis; V7 N/A) — dedicated predecessor for the three N-2 V7 child vectors; JCS receiptHash `9742df6972f96075772eb90af94adb638fb9a618634f6f7c764fb2777840fead` | — |
| continuity-protocol/test-vectors/invalid/inconsistent-assertions.json | B1CABCFDD094D0B3750AE11F547C79BBEB2CB6596ECE9AE695E5DEAD701A6441 | N-2 batch | 13-slot/13-field era (N-2 generated) | normative (N-2) | INVALID — `INCONSISTENT_ASSERTIONS` (V3 FAIL; genesis so V7 N/A) | — |
| continuity-protocol/test-vectors/invalid/subject-mismatch.json | 2A4D79D8CF435FC4B062226A5B7864F40AD4D47F2496F1182534788D4DB9F4BC | N-2 batch | 13-slot/13-field era (N-2 generated) | normative (N-2) | INVALID — `SUBJECT_MISMATCH` (V7 check 2; predecessor = valid/n2-predecessor.json) | — |
| continuity-protocol/test-vectors/invalid/issuer-mismatch.json | B294CF99447FD24C0B01E9FF694F77ADC282954C6497F7BC2AF0D450232B6D26 | N-2 batch | 13-slot/13-field era (N-2 generated) | normative (N-2) | INVALID — `ISSUER_MISMATCH` (V7 check 3; same public key as predecessor, different issuer.id) | — |
| continuity-protocol/test-vectors/invalid/chain-temporal-violation.json | 7D1CE03A891F22815E00136A3F22A79EE7A2FEEC1A48E336E76AEFFC13B275FF | N-2 batch | 13-slot/13-field era (N-2 generated) | normative (N-2) | INVALID — `TEMPORAL_VIOLATION` (V7 check 4; predecessor = valid/n2-predecessor.json) | — |
| bad-signature.json (referenced by cli/README.md:34-42) | — (no file) | — | — | doc-only-missing | — | — |

## GAP-2 — historical implementation divergence (resolved, non-normative)

Earlier revisions of this file recorded that `valid/multi-engine.json` produced
different results on different MyShape implementations, and resolved the dispute by
declaring one internal implementation the tie-breaker. That resolution is **retired**.

`valid/multi-engine.json` is conformant: its `previousReceiptHash` is the correct
JCS digest of `valid/single-engine.json`, and all four protocol-core V₇ checks pass
when that receipt is the resolved predecessor. Any differing historical result came
from oracle scope or vector era, not from a defect in the vector. Expected outcomes
now come from the specification alone, via `EXPECTED-RESULTS.md`.

## Coverage gaps

No negative-coverage gap remains. The V₃ rule and all four protocol-core V₇
failure codes are exercised by published fixtures: `INCONSISTENT_ASSERTIONS` by
`invalid/inconsistent-assertions.json`; `CHAIN_BROKEN` by
`invalid/broken-chain.json` via the fail-closed unresolvable-predecessor path;
`SUBJECT_MISMATCH`, `ISSUER_MISMATCH` and `TEMPORAL_VIOLATION` by the three N-2
child vectors resolved against `valid/n2-predecessor.json`. V₇ check 1 also
exercises a PASS via `valid/multi-engine.json` and the three N-2 child vectors.
`PREDECESSOR_MISSING` is deliberately
absent: it is a store/integration-layer outcome, not a CPS-0001 core conformance
result. A V₇ check-1 failure with a resolvable-but-mismatched predecessor is not
constructible as a receipt fixture and is retained as P2. See `EXPECTED-RESULTS.md`.

## Regression gate

Before/after: `Get-FileHash` of all published rows above MUST be identical;
`signature.value` + `issuer.publicKey` bytes MUST be identical; test results
MUST match the before snapshot except added documentation.
