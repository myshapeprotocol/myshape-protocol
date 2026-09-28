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

No published vector exercises V₃, or the V₇ checks `SUBJECT_MISMATCH`,
`ISSUER_MISMATCH`, and `TEMPORAL_VIOLATION`. `CHAIN_BROKEN` **is** exercised, by
`invalid/broken-chain.json`, via the fail-closed unresolvable-predecessor path.
`PREDECESSOR_MISSING` is deliberately
absent: it is a store/integration-layer outcome, not a CPS-0001 core conformance
result. See `EXPECTED-RESULTS.md`.

## Regression gate

Before/after: `Get-FileHash` of all published rows above MUST be identical;
`signature.value` + `issuer.publicKey` bytes MUST be identical; test results
MUST match the before snapshot except added documentation.
