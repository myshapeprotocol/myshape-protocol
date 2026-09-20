# CPS-0001 VECTOR-INVENTORY (frozen v1.0-RC1)

File bytes are normative. Hashes below were recorded read-only; vector contents MUST NOT change.

| path | file_sha256 | source_commit | era | normative_status | expected_main+store | expected_CLI | expected_ref-helper |
|---|---|---|---|---|---|---|---|
| continuity-protocol/test-vectors/valid/single-engine.json | 65F528E08B7F4471C39CE088ED675F26EBD9D12A8FA9DB589C9C6FF5AECA66F8 | unknown | 13-field/JCS era (assumed, provenance not recorded) | normative | VALID (genesis) | VALID (V1-V6) | VALID (V1,V3-V6) |
| continuity-protocol/test-vectors/valid/multi-engine.json | 0693D58449603EE3D5F69BBBD529AE57179BF7E1C309EAAB75E055904076EF26 | unknown | 13-field/JCS era (assumed) | known-divergence | INVALID (CHAIN_BROKEN or INVALID_SIGNATURE or PREDECESSOR_MISSING — see GAP-2) | VALID V1-V6 (verified 2026-09-20, exit 0) | VALID (helper scope) |
| continuity-protocol/test-vectors/valid/agent-trace.json | 5F715CD458970213C0EC0BB0E943D607E9448BB3E740E4D486212171CB4B3788 | unknown | unknown | normative (time-sensitive) | TBD (record actual) | INVALID V6 EXPIRED (verified 2026-09-20, expiresAt 2026-07-24T17:43:16.742Z; V1-V5 pass) | TBD |
| continuity-protocol/test-vectors/generated/agent-trace.json | DF013BE344B397C97C58D1A3BE70650AAB611E7D1453298BA34C6A11B3F902DF | unknown | unknown | normative (duplicate of valid/agent-trace unexplained — do not merge/delete; time-sensitive plus signature mismatch) | TBD | INVALID V2 plus V6 (verified 2026-09-20: signature mismatch plus expired 2026-07-24T17:57:44.920Z) | TBD |
| continuity-protocol/test-vectors/invalid/expired.json | 8BB675D2192B49D2AD14C9BA93F4BE5EA86E54464874F15478E47B063210AF26 | unknown | 13-field era (assumed) | normative | INVALID EXPIRED | INVALID | INVALID EXPIRED |
| continuity-protocol/test-vectors/invalid/tampered-evidence.json | 2374D75A73809C7D93F482277B519B1C0EEF8AA4C6A9783346A43944ABC07672 | unknown | 13-field era (assumed) | normative | INVALID EVIDENCE_TAMPERED or INVALID_SIGNATURE (record actual) | INVALID | INVALID |
| continuity-protocol/test-vectors/invalid/broken-chain.json | 4A6367340E54841394C8D1D15B57F4C56095885198D6CCD629AFADBBA95F3C1B | unknown | 13-field era (assumed) | normative | INVALID CHAIN_BROKEN (with store) | VALID-or-INVALID by V1-V6 only (CLI has no V7 — record actual) | CHAIN_BROKEN via verifyPredecessor |
| bad-signature.json (referenced by cli/README.md:34-42) | — (no file) | — | — | doc-only-missing | — | — | — |

## GAP-2 — implementation divergence vs normative resolution

Implementation divergence (FACT): `valid/multi-engine.json` is INVALID on
`src/__tests__/cross-impl-golden.test.ts:53-61` (expects CHAIN_BROKEN /
INVALID_SIGNATURE / PREDECESSOR_MISSING) but VALID on the reference helper.
Cause: oracle scope difference + vector era, not random failure.

Normative resolution (no code change): main+store is the tie-breaker. The
reference helper VALID is expected helper-scope behavior, not a bug. Do NOT
modify either verifier to eliminate the divergence.

## Regression gate

Before/after: `Get-FileHash` of all rows above MUST be identical;
`signature.value` + `issuer.publicKey` bytes MUST be identical; test results
MUST match the before snapshot except added documentation.
