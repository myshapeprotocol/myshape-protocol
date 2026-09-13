# CPS-0002 — Independent Interoperability Audit

**Status**: AUDIT — RESOLVED (BATCH-0002-3-F8 payload digest integrity fix applied and verified).
**CPS-0002 status**: PROTOTYPE PHASE COMPLETE — CONCEPT NOT FROZEN.
**CPS-0001 status**: v1.0-RC1 — FROZEN (byte-for-byte unchanged; verified this phase).

---

## 1. Executive Verdict

> **`INTEROPERABLE WITH DOCUMENTATION NOTES`**

A completely independent third-party implementation — using only the protocol
documentation, assertion data, receipt data, public key, canonicalization/
signing rules, and test vectors — **can reproduce CPS-0002 verification
byte-for-byte**. This was proven by an independent reconstruction performed
with `node:crypto` and a hand-written RFC 8785 (JCS) canonicalizer, sharing
**zero code** with the project's `@noble`-based helpers.

One protocol-level portability hazard was found and is now **RESOLVED** (BATCH-0002-3-F8): the
payload-digest rule has moved from `SHA-256(JSON.stringify(payload))` to
`SHA-256(UTF8(JCS(payload)))` (RFC 8785), and the verifier now independently
recomputes and enforces the digest at V2.5. Cross-language determinism was
verified via an independent Python JCS implementation (see §10). The previously
non-portable `JSON.stringify` rule is fully replaced.

No BLOCKER. No schema change. No canonical-payload change. The payload-digest
integrity gap (F7/IA-1 — previously a MEDIUM documentation finding) is resolved
by BATCH-0002-3-F8: the digest rule moved to `SHA-256(UTF8(JCS(payload)))`
and the verifier now independently recomputes and enforces it at V2.5.

---

## 2. Findings

| ID | Severity | Evidence | Impact | Classification | Recommended future action |
|----|----------|----------|--------|----------------|---------------------------|
| IA-1 | **MEDIUM** | Cross-language digest comparison: vector payload — JS `1c5f6f4d…` = Python compact `1c5f6f4d…` ✅ but Python **default** `d8be8922…` ❌; synthetic payload (floats+unicode) — JS `b0d010e3…` vs Python no-ASCII compact `0d7c164d…` ❌ (`1e-7` vs `1e-07`) | Producer-side only: two attester implementations may emit different `payloadDigest` for identical logical evidence; **verifier unaffected** (digest is a signed attester commitment, never recomputed) | **RESOLVED BY BATCH-0002-3-F8** — digest rule changed to `SHA-256(UTF8(JCS(payload)))` (RFC 8785); verifier now recomputes at V2.5 and enforces match; cross-language determinism verified via independent Python JCS; IA-1 no longer affects any path | None — was a documentation/optional finding; now fully resolved |
| IA-2 | **LOW** | Hand-rolled `verifySchema` checks required fields only; does **not** reject unknown top-level fields, while the JSON Schema sets `additionalProperties: false` | Schema-invalid (extra field) but verifier-VALID state exists; a strict-schema implementation and the reference verifier can disagree on acceptance of unknown fields (signature verification itself is identical) | Schema/verifier divergence (documented) | Before any freeze: decide which is normative (enforce in verifier OR relax schema) and document |
| IA-3 | **LOW** | `attester.id = SHA-256(publicKey)[:16]` is performed by attester code but never checked by `verifySchema` | Two keys could share a truncated id (~2^-64); cosmetic — `publicKey` is the identity anchor | **B. producer convention** (not verifier-enforced) | Optional future: verifier MAY check derivation; or document explicitly as producer-only convention |
| IA-4 | **LOW** | Single `INVALID` status with reason codes; no distinct `UNSUPPORTED`/`UNKNOWN`/`MALFORMED` class (e.g. wrong `protocolType` → `INVALID_PROTOCOL_TYPE`) | Independent verifiers agree on `status`/`reason` if they follow the doc; `detail` strings may differ (cosmetic) | Acceptable prototype semantics | Future: document that `status`/`reason` are the contract and `detail` is informational |
| IA-5 | **LOW** | Freshness (V4) checks assertion validity only; the referenced receipt's own `expiresAt` is not evaluated by the CPS-0002 verifier | An assertion can be VALID while referencing an expired receipt; app must run CPS-0001 `verifyReceipt` incl. V6 | Documented deployment/app responsibility (Trust Policy §5/§9/§18) | Keep as-is; include in integration guidance |
| IA-6 | **NOTE** | Timestamp contract is string-identity: `Z` and `.000` are NOT mandated by the schema (`format: date-time`); the vector uses `.000Z` | A third party may sign `2026-08-29T00:00:00Z` (no ms) and still verify — valid per contract | Clear (with documentation note) | None required |
| IA-7 | **NOTE** | `:` appears inside signed field values (`subject.id` = `sha256:…`, ISO timestamps) | A naive implementation splitting the payload on `:` breaks | Clear — field-by-field reconstruction is the documented rule (Trust Policy §10 / Annex A) | None required |

---

## 3. Canonical Signing Result

Independently verified (no project helpers):

- **Field count**: exactly **12** (`field_count=12`).
- **Order**: `protocolType, assertionId, attester.id, attester.publicKey,
  subject.id, reference.receiptHash, reference.receiptId, evidence.engineId,
  evidence.payloadDigest, validity.issuedAt, validity.expiresAt,
  signature.signedAt` — matches Trust Policy §10 exactly.
- **Representation**: raw string values as they appear in the JSON assertion;
  **no JSON serialization of the signing payload**; **no normalization**;
  **no whitespace**.
- **Joining**: single `:` between fields (fields themselves may contain `:` —
  payload begins `cps-hsa-0.1-draft:6fdceb85-…` and ends
  `…1T23:59:59.000Z:2026-08-29T00:00:00.000Z`).
- **UTF-8**: payload encoded UTF-8 before signing — byte-identical across
  TextEncoder / `Buffer.from(…,"utf8")` / Python `.encode("utf-8")`.
- **Empty-string behavior**: all 12 fields are required and non-empty by
  schema; the joining rule is order-based, not content-based, so no field-
  boundary ambiguity exists for the defined schema.
- **Third-party reproducibility**: ✅ proven — the signature verified using
  Node's built-in `node:crypto` Ed25519 over the independently reconstructed
  payload (`ed25519_verify(12-field) = true`).

**Result: CLEAR.**

---

## 4. Timestamp Result

| Question | Answer | Classification |
|----------|--------|----------------|
| What exact string is signed? | The literal string in the assertion JSON (e.g. `2026-08-29T00:00:00.000Z`) | CLEAR |
| Expected representation | ISO-8601; schema says `format: date-time`; ms + `Z` not mandated; vector uses `.000Z` | CLEAR (note IA-6) |
| Timezone normalization allowed? | **No** — string-identity contract; `Z` vs `+00:00` = different signed payloads | CLEAR |
| Milliseconds mandatory? | No | CLEAR |
| `Z` mandatory? | No (any valid ISO-8601 string; internal consistency is what matters) | CLEAR |
| Parsing separate from signature reconstruction? | Yes — V4 freshness parses dates; V2 reconstructs literal strings | CLEAR |
| Non-JavaScript reproduction? | Trivial — sign the exact string bytes; no JS-specific semantics involved | CLEAR |

**Result: CLEAR (note IA-6).**

---

## 5. Payload Digest Result

The phase's most important finding (IA-1). Summary against the ten questions:

1. **Identical bytes across implementations?** Only with care — see 3–6.
2. **Key insertion order**: **matters** (JS and Python both preserve it; a
   re-implementation may order keys differently).
3. **JSON escaping differs**: Python default `ensure_ascii=True` escapes
   non-ASCII; JS emits raw UTF-8.
4. **Whitespace**: Python default separators include spaces; JS never does.
5. **Unicode escaping**: JS escapes only control characters / lone surrogates;
   Python default escapes all non-ASCII.
6. **Number formatting**: **JS `1e-7` vs Python `1e-07`** — breaks byte-identity
   even when separators and ASCII settings match (proven with synthetic payload:
   JS `b0d010e3…` vs Python `0d7c164d…`).
7. **`JSON.stringify` outside JavaScript**: reproducible only by reimplementing
   ES6 `Number::toString` plus JS escaping rules — non-trivial but doable.
8. **Protocol interoperability risk**: real but **bounded** — see (9).
9. **Implementation detail or protocol issue**: **implementation detail today**
   — the verifier never recomputes the digest; the signed `payloadDigest` is an
   attester-chosen commitment. It becomes a protocol issue only if verifier-side
   recomputation or deterministic cross-implementation payload generation is
   introduced.
10. **Future protocol version**: **yes** — any change to the digest rule (e.g.
    `SHA-256(JCS(payload))`) or the addition of verifier-side recomputation
    requires a protocol revision; Trust Policy §20-Q12 already reserves this.

**Result: AMBIGUOUS-for-producers / CLEAR-for-verifiers → documented (IA-1).**
**No change made this phase.**

---

## 6. Encoding Result

| Item | Contract | Ambiguity |
|------|----------|-----------|
| Text encoding | UTF-8 everywhere (payload signing, hashing) | None |
| Public keys | Ed25519 raw 32 bytes, lowercase hex, 64 chars (`^[0-9a-f]{64}$`) | None |
| Signatures | Ed25519 64 bytes, lowercase hex, 128 chars | None |
| SHA-256 outputs (receiptHash, payloadDigest) | lowercase hex, 64 chars | None |
| UUID (`assertionId`) | UUIDv7, lowercase hex pattern enforced by schema + verifier | None |
| Timestamps | ISO-8601 strings, signed literally | Covered by §11 / IA-6 |
| base64 / base64url | **Not used anywhere in CPS-0002** | None |
| Byte/string conversions | `TextEncoder` (JS) ≡ `.encode("utf-8")` (Python) ≡ UTF-8 bytes | None — verified by cross-language signature verification |

**Result: CLEAR — every externally observable encoding is hex/UTF-8 and fully
specified. A third party has no reasonable alternative representation to
choose.**

---

## 7. Schema/Verifier Result

Comparison across schema, reference verifier, signer, test vectors,
conformance tests, and Trust Policy:

| State | Schema (ajv) | Reference verifier | Assessment |
|-------|--------------|--------------------|------------|
| Required fields present, well-formed | ✅ | ✅ | Consistent |
| Extra unknown top-level field | ❌ rejected (`additionalProperties: false`) | ✅ **accepted** | **Divergence — IA-2** (LOW, documented) |
| `evidence.confidence` out of 0..1 | ❌ | ❌ `INVALID_SCHEMA` | Consistent |
| Wrong `protocolType` | ❌ (const) | ❌ `INVALID_PROTOCOL_TYPE` | Consistent |
| Malformed hex (key/sig/digest/hash) | ❌ (pattern) | ❌ `INVALID_SCHEMA` | Consistent |
| `subject.type` present/absent/any string | ✅ (optional, free) | ✅ (not signed, not checked) | Consistent |
| `attester.id` ≠ `SHA-256(publicKey)[:16]` | ✅ schema-valid | ✅ verifier-accepted | **Producer convention only — IA-3** (not enforced anywhere; correctly documented) |
| Assertion valid but referenced receipt expired | ✅ | ✅ VALID | By design — receipt freshness is app-side (IA-5) |
| `evidence.payload` modified after signing | ✅ schema-valid | ✅ verifier-VALID (digest not recomputed) | Documented in Trust Policy §12 — known prototype behavior |

**Documented requirements not enforced by the verifier** (producer conventions
or app responsibilities, correctly labeled):
- `attester.id` derivation (IA-3) — producer convention.
- Receipt V1–V7 re-verification incl. V6 freshness — app responsibility.
- Single-use / replay enforcement — application policy.

**Result: two divergences (IA-2, IA-3) + one documented gap (§12) — all LOW,
none blocking, none fixed this phase.**

---

## 8. Error Semantics Result

Failure contract (`INVALID` + `reason` + `detail`):

| Input condition | Verdict | Reason |
|-----------------|---------|--------|
| Missing required field | INVALID | `INVALID_SCHEMA` |
| Wrong `protocolType` | INVALID | `INVALID_PROTOCOL_TYPE` |
| Malformed hex / bad pattern | INVALID | `INVALID_SCHEMA` |
| `confidence` out of range | INVALID | `INVALID_SCHEMA` |
| Unparseable / malformed timestamp | INVALID | `MALFORMED_TIMESTAMP` |
| Expired | INVALID | `EXPIRED` |
| Tampered signed field | INVALID | `INVALID_SIGNATURE` |
| Wrong receiptId / subject.id | INVALID | `INVALID_RECEIPT_REFERENCE` |
| Wrong receipt hash | INVALID | `INVALID_RECEIPT_HASH` |
| null values / empty strings | INVALID | `INVALID_SCHEMA` (falsy/type checks) |
| Unexpected additional fields | **VALID** | *(no check — IA-2)* |
| Unknown assertion type | INVALID | `INVALID_PROTOCOL_TYPE` (no separate UNSUPPORTED class — IA-4) |
| Invalid receipt state (expired receipt) | **VALID** (assertion-level) | receipt state is app-side (IA-5) |

**Can two independent verifiers disagree?** Only on:
- acceptance of unknown extra fields (IA-2), and
- `detail` message wording (informational).

`status`/`reason` are deterministic given the documented rules. The protocol
does **not** currently distinguish `INVALID` from
`UNSUPPORTED`/`UNKNOWN`/`MALFORMED` — wrong type is reported as
`INVALID_PROTOCOL_TYPE`, which is adequate for the prototype and documented as
IA-4. **No redesign this phase.**

---

## 9. Freshness/Replay Result

Boundary mapping (all independently derivable from the implementation):

| Layer | Enforced by | Mechanism |
|-------|-------------|-----------|
| Cryptographic validity | Protocol core (V2, V3) | Ed25519 over 12-field payload + receipt-hash/id/subject binding |
| Assertion timestamp validity | Protocol core (V4) | `now < validity.expiresAt`; malformed → `MALFORMED_TIMESTAMP` |
| Receipt freshness | **Application** | CPS-0001 `verifyReceipt` incl. V6 on the referenced receipt |
| Replay prevention (single-use) | **Application** | No protocol mechanism; assertion is replayable until expiry |
| Audience/scope binding | **Not defined** | Future extension (Trust Policy §9/§18) |
| Application acceptance | **Application** | Trusted key set + policy + deployment state |

An independent implementation **can** clearly distinguish these layers; the
Trust Policy (§5, §9, §12, §17, §18) and the verifier's failure codes make the
split unambiguous. **Result: CLEAR — no replay infrastructure implemented.**

---

## 10. Independent Reconstruction Result

Performed with **zero project code**: `node:crypto` (createHash,
createPublicKey JWK, verify) + a hand-written RFC 8785 JCS canonicalizer.
The project's `@noble/*` helpers and `shared/jcs.ts` were **not** imported.

```
== INDEPENDENT RECONSTRUCTION (node:crypto + hand-written JCS) ==
field_count              : 12
payload_first48          : cps-hsa-0.1-draft:6fdceb85-30c0-7b90-8b2f-5594a4
payload_last40           : 1T23:59:59.000Z:2026-08-29T00:00:00.000Z
payload_sha256           : faf2482f7ac12fb1dd370d4a5b9224512144d24c609b9b40d8506ff759ad0cfa
ed25519_verify(12-field) : true
receipt_hash_indep       : 55c4110f5a8fba68ee944bb49311f77048a358e08bb43d01be3e8ffc9414c5cc
receipt_hash_in_vector   : 55c4110f5a8fba68ee944bb49311f77048a358e08bb43d01be3e8ffc9414c5cc
receipt_hash_match       : true
payload_digest_indep     : 61e3a02b6c71c1268a8fb16c9c670dea4d2640833f8e9f4f016f2ab53539c8c9
payload_digest_in_vector : 61e3a02b6c71c1268a8fb16c9c670dea4d2640833f8e9f4f016f2ab53539c8c9
payload_digest_match     : true
attester_id_indep        : d25fc5f2bba3df7e
attester_id_match        : true
subject_type_in_payload  : false
```

Chain verified end-to-end **independently**:
`assertion → canonical 12-field bytes → Ed25519 verify → VALID`;
`receipt → independent JCS → SHA-256 → receiptHash match`;
`evidence.payload → JCS (RFC 8785) → SHA-256 → payloadDigest match`.

Cross-language JCS digest evidence (Python 3.11.9 vs Node 24, both using RFC 8785):

```
vector payload (JCS):
  JS JCS                    : 61e3a02b…  (matches vector)
  Python JCS (indep)        : 61e3a02b…  (matches)
synthetic payload (floats + unicode):
  JS JCS                    : 5915ae68…
  Python JCS (indep)        : 5915ae68…  (exact byte agreement)
```

**Result: independent reconstruction SUCCEEDS for all verification-critical
operations. IA-1 (cross-language payload digest divergence) is RESOLVED by
BATCH-0002-3-F8 — the digest rule is now `SHA-256(UTF8(JCS(payload)))` (RFC 8785)
and the verifier independently recomputes it at V2.5. Cross-language JCS
determinism verified via independent Python implementation.**

### 10.1 Scope of this result (added — Route B canonicalization clarification)

The reconstruction above used **I-JSON-conformant** inputs only, and the two
canonicalizers compared (the hand-written one here, the Python one, and
`shared/jcs.ts`) agree byte-for-byte on those inputs. That agreement does **not**
extend to non-I-JSON input:

- `NaN` / `±Infinity` are serialized as `null` rather than rejected.
- A lone surrogate is serialized as a `\uXXXX` escape rather than rejected.
- `undefined` members are omitted (object) or become `null` (array).

RFC 8785 requires rejection for the first two. The CPS-0002 serialization is
therefore a **serializer, not a validator**, and is now named and defined
normatively as **MyShape canonical JSON**
(`CPS-0002-VERIFIER-CONTRACT.md` §5.0; `CPS-0002-TRUST-POLICY.md` §12-D).
Read "RESOLVED" above as: *cross-language agreement holds for conformant
payloads*, not *any conformant implementation accepts any payload a CPS-0002
verifier accepts*.

---

## 11. Required Future Changes

Only changes genuinely required before any future freeze:

1. **IA-2** — Decide and document whether `additionalProperties: false` is
   normative (enforce in verifier) or advisory (relax schema). Prevents
   verifier-vs-schema disagreement on unknown fields.
2. **IA-1** — **RESOLVED BY BATCH-0002-3-F8**. Digest rule moved to
   `SHA-256(UTF8(JCS(payload)))` (RFC 8785); verifier recomputes at V2.5;
   cross-language determinism verified via independent Python JCS.
3. **IA-3** — Document `attester.id` derivation as producer convention (or add
   optional verifier enforcement) before freezing.
4. **IA-4** — Document `status`/`reason` as the interop contract with `detail`
   as informational.

**Not required** (explicitly out of scope): registry, key rotation, revocation,
audience/scope, multi-attester aggregation, privacy primitives, signature-
scheme redesign, canonical-payload change, error-semantics redesign.

---

*Document: `continuity-protocol/CPS-0002-INTEROPERABILITY-AUDIT.md` —
accompanies the NEXT PHASE interoperability audit — Part of the Continuity
Protocol Project — 2026-08-29*