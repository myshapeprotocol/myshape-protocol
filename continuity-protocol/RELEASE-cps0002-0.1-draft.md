# CPS-0002 0.1-Draft Release Notes

**Release candidate for CPS-0002 Human Signal Assertion — prototype phase.**

## Status

- **Protocol spec**: CONCEPT → PROTOTYPE PHASE COMPLETE. **NOT FROZEN — 0.1-draft is a prototype freeze candidate under review.**
- **Protocol version**: `cps-hsa-0.1-draft`
- **Schema**: `cps-0002-assertion.schema.json` (draft-07/2020-12, version `0.1-draft`)
- **Signing payload**: 12 fields (separate from CPS-0001's frozen 13-field canonical signing payload)
- **Vectors**: 4 valid/invalid test vectors (deterministic)
- **Conformance suite**: 45 tests
- **Interoperability suite**: 39 tests (reference verifier ↔ independent second verifier)
- **Third-party review**: R8–R12 → **GO**

## Relationship to CPS-0001

CPS-0001 v1.0-RC1 is **FROZEN** at `89c0c4c` (tag `v1.0-RC1`).

CPS-0002 is an **additive Human Signal Assertion layer** that:
- References a CPS-0001 receipt by hash
- Does **NOT** redefine V₁–V₇
- Does **NOT** modify the CPS-0001 canonical signing payload
- Does **NOT** modify any CPS-0001 frozen file

CPS-0001 remains byte-for-byte unchanged throughout this release.

## Changes since Prototype (BATCH-0002-0)

| Category | Change | Rationale |
|---|---|---|
| Payload digest | `evidence.payloadDigest` now `SHA-256(UTF8(JCS(payload)))` (RFC 8785), not `JSON.stringify` | F7 fix: verifier-side digest integrity; cross-language determinism (F8-H1/F8-M2) |
| Verification | Added V2.5 payload-digest verification (after V2 signature, before V3 receipt ref) | Closes "payload tampering with stale digest → VALID" gap |
| Reason code | Added `INVALID_PAYLOAD_DIGEST` | Distinct from signature/schema/receipt failures |
| Malformed digest | Rejected at V0 with `INVALID_SCHEMA` | P5 divergence closed (both verifiers agree) |
| Hex format | `publicKey`/`signature.value` strictly lowercase hex | F8-M1: consistent with schema/reference verifier |
| Interop proof | Added independent second verifier (`cps-0002-second-verifier/`) | Cross-implementation proof, mirroring CPS-0001 |
| V0 strictness | Second verifier now enforces `confidence` ∈ [0,1] and `receiptHash` 64 lowercase hex, matching the reference verifier | B1: removes VALID-vs-INVALID_SCHEMA and INVALID_RECEIPT_HASH-vs-INVALID_SCHEMA divergences on identical inputs |
| Receipt check order | `VERIFIER-CONTRACT` §4 aligned to the implementation (`receiptId` → `subject.id` → `receiptHash`) | B2: double-fault inputs now yield an agreed `reason` across implementations |

## What CPS-0002 Does NOT Claim

- Does **NOT** prove proof-of-human
- Does **NOT** prove biological truth
- Does **NOT** prove universal liveness
- Does **NOT** provide anti-Sybil resistance
- Does **NOT** replace or modify CPS-0001

The Toy Attester is explicitly labeled `TOY / PROTOTYPE / NOT PROOF OF HUMAN`, with `confidence: 0.0` by design.

## Security Boundary

- Payload digest is now an independently enforced integrity commitment (V2.5).
- Signature validity (Ed25519) covers the 12-field canonical payload.
- Receipt reference (hash + receiptId + subject) binds the assertion to a CPS-0001 receipt.
- Freshness (expiry) is validated against `validity.expiresAt`.

## Known Limitations (Non-blocking)

- **IA-3**: `attester.id` is a producer-side key-derived convention (`SHA-256(publicKey)[:16]`); not cryptographically bound by the verifier. `publicKey` is the cryptographic identity anchor.

## Previously Listed Limitations — Now Resolved

- **IA-2** — **CLOSED.** Both reference verifiers now reject unknown root-level properties at V0 with `INVALID_SCHEMA`; the schema's root-level `additionalProperties: false` is normative AND verifier-enforced (see `CPS-0002-TRUST-POLICY.md` §12-A). Regression-tested in `conformance/cps0002-interop.test.ts` ("Strictness closure — unknown root property").
- **F8-L1** — **CLOSED.** `scripts/gen-cps0002-test-vector.mjs` is now tracked in version control.
- **B1** — **CLOSED.** Second verifier V0 aligned with the reference verifier: `evidence.confidence` ∈ [0,1] and `reference.receiptHash` as 64 lowercase hex chars. Regression-tested in "B1: V0 schema strictness — both verifiers agree".
- **B2** — **CLOSED.** `CPS-0002-VERIFIER-CONTRACT.md` §4 step order aligned to the implementation (`receiptId` → `subject.id` → `receiptHash`), with an explicit note that the order determines the `reason` code on double-fault inputs. Regression-tested in "B2: double-fault receipt mismatch — ordering".

## Freeze Boundary

This is a **0.1-draft freeze candidate**, not a final protocol freeze. The exact file manifest is provided in `FREEZE-MANIFEST-cps0002-0.1-draft.md`.

## Files Included

See `FREEZE-MANIFEST-cps0002-0.1-draft.md` for the complete, exact manifest.

## References

- Protocol concept: `continuity-protocol/CPS-0002_CONCEPT.md`
- Verifier contract: `continuity-protocol/CPS-0002-VERIFIER-CONTRACT.md`
- Trust policy: `continuity-protocol/CPS-0002-TRUST-POLICY.md`
- Threat model: `continuity-protocol/CPS-0002-THREAT-MODEL.md`
- Implementation guide: `continuity-protocol/IMPLEMENT-CPS-0002.md`
- Schema: `continuity-protocol/cps-0002-assertion.schema.json`
- Vectors: `continuity-protocol/test-vectors/cps0002/`
- Conformance: `continuity-protocol/conformance/cps0002-conformance.test.ts`
- Interop: `continuity-protocol/conformance/cps0002-interop.test.ts`