# CPS-0002 External Verifier Contract

**Status:** PROTOTYPE / CONCEPT — NOT FROZEN
**Last updated:** BATCH-0002-3-F8

> This document is the contract an independent implementer should use to build a
> CPS-0002 assertion verifier WITHOUT reading the TypeScript reference implementation.
> It is language-neutral. It defines inputs, the ordered verification algorithm, the
> canonical signing input, and the machine-interpretable result contract.

---

## 1. What CPS-0002 Establishes

A **CPS-0002 Human Signal Assertion** is an Ed25519-signed statement that references a
CPS-0001 Continuity Receipt by hash. A verifier that accepts an assertion establishes:

1. The assertion structurally conforms to the CPS-0002 schema (including
   root-level `additionalProperties: false` — unknown root-level properties
   are rejected at V0 with `INVALID_SCHEMA`).
2. The Ed25519 signature is valid over the canonical signing input of the assertion.
3. The evidence payload digest independently recomputes to the signed `payloadDigest` (F7 fix, BATCH-0002-3-F8).
4. The referenced CPS-0001 receipt hash, receiptId, and subject bindings are consistent.
5. The assertion's own validity window (issuedAt / expiresAt) is honored at verify time.

### Canonical VALID semantics (normative)

> `VALID` means that the CPS-0002 assertion is structurally and cryptographically
> valid, internally consistent, correctly bound to the referenced CPS-0001 receipt,
> and within its assertion validity period.

`VALID` does NOT by itself establish: attester authorization, attester trust,
evidence truth, human presence, biological humanity, liveness, single-use,
universal replay protection, or application acceptance. Whether a
cryptographically `VALID` assertion is trusted / authorized / accepted is a
Trust Policy / deployment / application decision. The relying layer MUST apply
its own trust decision (`TRUSTED / UNKNOWN / NOT TRUSTED`) and MUST NOT treat
`VALID` as `TRUSTED`.

### Canonical Human Signal Assertion definition (prototype, normative)

> **Human Signal Assertion (prototype):** a receipt-bound, attester-signed,
> evidence-digest-committed, expiry-bounded assertion. The name describes the
> intended signal domain and does not constitute proof of human presence,
> biological humanity, liveness, or evidence truth.
>
> ```text
> Human Signal Assertion ≠ Proof of Human
> ```

### CPS-0001 receipt-freshness boundary (normative)

CPS-0002 verification checks the referenced receipt ONLY for: `receiptId`
binding, `subject.id` binding, and `receiptHash` integrity/binding. It does NOT
replace CPS-0001 V1–V7 verification.

> A `VALID` CPS-0002 assertion does not by itself establish that the referenced
> CPS-0001 receipt is currently fresh, issuer-valid, or otherwise valid under
> CPS-0001. For freshness-sensitive decisions, the integration/application layer
> MUST independently verify the referenced CPS-0001 receipt per CPS-0001
> (including its freshness rules). The CPS-0002 verifier MUST NOT be extended to
> execute CPS-0001 V1–V7.

### Non-authoritative fields (normative scope)

`confidence`, `engineId`, and `attester.id` are not independent cryptographic
trust guarantees:

- `confidence` is attester-declared / informational and is NOT authoritative
  proof. It is not comparable across attesters, carries no cross-attester scale,
  and is ignored by the verifier.
- `engineId` identifies the declared evidence engine/context and is NOT itself a
  trust anchor. It is pattern-checked only; it does not establish that the
  declared engine is trustworthy or authorized.
- `attester.id` is an identifier/label and is NOT a substitute for the
  cryptographic `attester.publicKey`. Only the public key anchors signature
  verification; the id MUST NOT be treated as an independent identity proof.

It does **NOT** establish human authenticity, biological truth, universal liveness,
proof-of-human, absence of bots, or absence of Sybil identities.

---

## 2. Inputs

### 2.1 Cryptographic validity inputs

| Input | Type | Required | Notes |
|-------|------|----------|-------|
| `assertion` | CPS-0002 assertion object | YES | Structured per §3 |
| `receipt` | CPS-0001 ContinuityReceipt object | YES | Used to recompute hash and verify binding |
| `canonicalization rules` | static knowledge | YES | See §5 |
| `current_time` | unix epoch ms / ISO instant | YES | Drawn from verifier clock |

### 2.2 Trust / application-policy inputs (NOT required for cryptographic validity)

| Input | Type | Required | Notes |
|-------|------|----------|-------|
| `trusted_key_set` | list of authorized attester public keys | Deployment | Whether the attester.publicKey is trusted = deployment policy |
| `trust_policy` | allowlist / rules | Application | Which keys/attesters the application accepts |
| `revocation_state` | registry / revocation info | Optional | NOT part of protocol core. If present, it is a deployment input |

> **IMPORTANT:** Cryptographic validity does NOT require a registry, a trusted key set,
> or application policy. Those inputs determine whether a *cryptographically valid*
> assertion is *trusted / authorized / accepted* by the application.

---

## 3. Assertion Structure (language-neutral)

```
assertion
├── protocolType: string            // MUST be "cps-hsa-0.1-draft"
├── assertionId: string             // non-empty; typically a UUIDv7 string
├── attester
│   ├── id: string                  // producer-side key-derived label (see §7)
│   └── publicKey: string           // 64 hex chars = 32-byte Ed25519 public key
├── subject
│   ├── id: string                  // MUST equal receipt.subject.id
---

## 4. Verification Algorithm (ordered)

Follow these steps in order. First failure → return `INVALID` with the corresponding reason.

| Step | Check | Reason code | Class |
|------|-------|-------------|-------|
| 1 | `protocolType == "cps-hsa-0.1-draft"` | `INVALID_PROTOCOL_TYPE` | protocol-core |
| 2 | All required fields present, typed correctly, publicKey 64-hex, signature.value 128-hex, **payloadDigest 64-hex (malformed → INVALID_SCHEMA)**; unknown ROOT-level properties rejected (`additionalProperties: false` normative, V0) | `INVALID_SCHEMA` | schema |
| 3 | Reconstruct canonical signing input exactly (§5) | — | protocol-core |
| 4 | Decode publicKey (hex→32 bytes), decode signature (hex→64 bytes) | `INVALID_SCHEMA` | protocol-core |
| 5 | Verify Ed25519 signature over UTF-8 encoding of canonical signing input | `INVALID_SIGNATURE` | protocol-core |
| 5.5 | Recompute `payloadDigest = lowercase_hex(SHA-256(UTF8(JCS(evidence.payload))))`; compare with signed `evidence.payloadDigest` (field #9) | `INVALID_PAYLOAD_DIGEST` | protocol-core |
| 6 | Compare `receipt.receiptId == reference.receiptId`, then `receipt.subject.id == assertion.subject.id` | `INVALID_RECEIPT_REFERENCE` | protocol-core |
| 7 | Recompute `SHA-256(JCS(receipt))`; compare with `reference.receiptHash` | `INVALID_RECEIPT_HASH` | protocol-core |
| 8 | Parse `issuedAt` / `expiresAt` as ISO-8601; if unparseable | `MALFORMED_TIMESTAMP` | schema/freshness |
| 9 | If `current_time >= expiresAt` | `EXPIRED` | protocol-core (freshness) |
| 10 | All checks pass | `VALID` | — |

> **Step 6 precedes step 7 (reference bindings before hash).** Both reference
> verifiers check `receiptId` → `subject.id` → `receiptHash`. When a presented
> receipt has BOTH a wrong `receiptId`/`subject.id` AND mismatched content, the
> reason code is therefore `INVALID_RECEIPT_REFERENCE`, not
> `INVALID_RECEIPT_HASH`. Because `reason` is part of the interoperability
> contract (§6.3), implementations MUST follow this order to agree on the code.
> Regression-tested in `conformance/cps0002-interop.test.ts` ("B2: double-fault
> receipt mismatch — ordering").

> The protocol does NOT require the CPS-0002 verifier to re-run CPS-0001 V1–V7 on the
> receipt. Whether the receipt itself is fresh/valid is an **application-policy** concern
> that belongs to the relying application.

---

## 5. Canonical Signing Input (12 fields, in exact order)

Reconstruct exactly 12 fields, in this order, joined by `":"` with NO escaping:

| # | Field |
|---|-------|
| 1 | `protocolType` |
| 2 | `assertionId` |
| 3 | `attester.id` |
| 4 | `attester.publicKey` |
| 5 | `subject.id` |
| 6 | `reference.receiptHash` |
| 7 | `reference.receiptId` |
| 8 | `evidence.engineId` |
| 9 | `evidence.payloadDigest` |
| 10 | `validity.issuedAt` |
| 11 | `validity.expiresAt` |
| 12 | `signature.signedAt` |

### 5.0 Canonical JSON serialization (normative)

Two CPS-0002 operations hash a **canonical JSON serialization**:

```
reference.receiptHash  = SHA-256( UTF8( canonicalJSON( receipt )        ) )
evidence.payloadDigest = SHA-256( UTF8( canonicalJSON( evidence.payload ) ) )
```

CPS-0002 defines this serialization itself — **MyShape canonical JSON** —
rather than delegating to a third-party RFC 8785 implementation. It is:

1. **Input** — a parsed JSON value satisfying I-JSON (RFC 7493).
2. **Key order** — object members sorted ascending by the UTF-16 code unit
   values of their key strings (not code points).
3. **Whitespace** — none.
4. **Numbers** — ECMAScript `Number::toString` (ES6) semantics: `1e-6` →
   `0.000001`, `1e-7` → `1e-7`, `1e20` → `100000000000000000000`, `1e21` →
   `1e+21`, `-0` → `0`. This is the algorithm RFC 8785 §3.2.2.3 mandates.
5. **Strings** — minimal escaping: `"` and `\` escaped; U+0000–U+001F escaped
   as `\b \f \n \r \t` where defined, otherwise lowercase `\uXXXX`. U+007F,
   U+2028, and U+2029 are **not** escaped.
6. **Arrays** — element order preserved. **`null`** → `null`.
7. The result is encoded as UTF-8 before hashing.

#### Compatibility with RFC 8785 (JCS) — byte-compatible

> For every **I-JSON-conformant** input, MyShape canonical JSON produces bytes
> **identical** to RFC 8785 (JCS). Independent implementations MAY therefore
> use any conformant RFC 8785 library, or implement the rules above directly,
> and obtain identical digests.

#### Compatibility boundary (normative)

MyShape canonical JSON is a **serializer, not a validator**. It does not
reject non-I-JSON input where RFC 8785 requires an error:

| Input | MyShape canonical JSON | RFC 8785 |
|---|---|---|
| `NaN`, `Infinity`, `-Infinity` | serialized as `null` | MUST be rejected |
| Lone surrogate (e.g. `U+D800` unpaired) | serialized as a `\uXXXX` escape | MUST be rejected |
| `undefined` object member | member omitted | not a JSON type |
| `undefined` array element | serialized as `null` | not a JSON type |

**Reachability.** `NaN`, `±Infinity`, and `undefined` cannot be produced by
`JSON.parse` and are therefore unreachable from the wire. A **lone surrogate is
reachable**: a JSON string containing an unpaired `\uD800`-style escape parses
successfully, serializes without error here, and would be rejected by a
strictly validating RFC 8785 implementation.

**Consequence.** Both CPS-0002 reference verifiers use the same serialization,
so digest agreement is unaffected. The difference is observable only across
implementations that differ in strictness — so "cross-language determinism" is
a statement about **I-JSON-conformant payloads**, not a guarantee that every
implementation accepts every payload a CPS-0002 verifier accepts.

### 5.1 Rules

> The 12-field signing input defined in §5 is a `":"`-joined string — it is
> **not** JSON. §5.0 applies only to `receiptHash` and `payloadDigest`.

- **Field extraction:** take the raw string value of each field as it appears in the JSON.
- **String conversion:** every field is a string already; do NOT json-escape, normalize,
  or re-serialize them.
- **Delimiter:** `":"` (0x3A). The JOINED string is NEVER split back into fields.
- **No normalization:** timestamps are signed as their exact literal string. Do NOT
  re-serialize, normalize timezone, or add/remove milliseconds.
- **Domain separation:** field #1 is the constant `protocolType`, which makes the CPS-0002
  signing domain distinct from any other payload starting differently.
- **Empty-string handling:** if any optional field is missing, it contributes the empty
  string; the separator is still emitted. (In practice all 12 fields are required by the
  schema, so this is a safety rule, not the common path.)
│   └── type?: string               // informational; NOT part of signed payload
├── reference
│   ├── receiptHash: string         // 64 hex chars = SHA-256(JCS(receipt))
│   └── receiptId: string           // MUST equal receipt.receiptId
├── evidence
│   ├── engineId: string            // attester engine identifier
│   ├── confidence: number          // opaque metadata; NOT compared, NOT probability
│   ├── payload: object             // attester evidence; NOT part of signed payload
│   └── payloadDigest: string       // 64 hex chars; SHA-256(UTF8(JCS(payload))); recomputed at V2.5 (see §8)
├── validity
│   ├── issuedAt: string            // ISO-8601 timestamp, signed literally
│   └── expiresAt: string           // ISO-8601 timestamp, signed literally
└── signature
    ├── algorithm: string           // MUST be "Ed25519"
    ├── value: string               // 128 hex chars = 64-byte Ed25519 signature
    └── signedAt: string            // ISO-8601 timestamp, signed literally
```
### 5.2 Language-neutral pseudocode

```text
function canonicalInput(assertion):
    fields := [
        assertion.protocolType,
        assertion.assertionId,
        assertion.attester.id,
        assertion.attester.publicKey,
        assertion.subject.id,
        assertion.reference.receiptHash,
        assertion.reference.receiptId,
        assertion.evidence.engineId,
        assertion.evidence.payloadDigest,
        assertion.validity.issuedAt,
        assertion.validity.expiresAt,
        assertion.signature.signedAt,
    ]
    return join(fields, ":")            // NO escaping, NO splitting afterwards

function verify(assertion, receipt, now):
    result := ed25519_verify(
        key = hex_decode(assertion.attester.publicKey),   # 32 bytes
        msg = utf8_encode(canonicalInput(assertion)),
        sig = hex_decode(assertion.signature.value),      # 64 bytes
    )
    if not result:
        return INVALID(reason = "INVALID_SIGNATURE")
    ...
```

---

## 6. Result Contract

### 6.1 `status`

- Machine-interpretable. Value is exactly one of: `VALID`, `INVALID`.

### 6.2 `reason` (present when `status == "INVALID"`)

Stable machine-readable failure classification. The eight defined codes:

| Code | Meaning |
|------|---------|
| `INVALID_PROTOCOL_TYPE` | `protocolType` is not `cps-hsa-0.1-draft` |
| `INVALID_SCHEMA` | Missing/malformed required fields or wrong encodings |
| `INVALID_SIGNATURE` | Ed25519 verification failed |
| `INVALID_PAYLOAD_DIGEST` | Recomputed `SHA-256(UTF8(JCS(evidence.payload)))` ≠ signed `evidence.payloadDigest` (V2.5) |
| `INVALID_RECEIPT_HASH` | Recomputed receipt hash ≠ `reference.receiptHash` |
| `INVALID_RECEIPT_REFERENCE` | `receiptId` or `subject.id` mismatch |
| `EXPIRED` | `current_time >= expiresAt` |
| `MALFORMED_TIMESTAMP` | `issuedAt`/`expiresAt` unparseable |

### 6.3 `detail`

- Informational / free-form debugging context.
- Implementations MUST NOT require identical `detail` strings for interoperability.
- The interop contract is: **`status`** and **`reason`** MUST agree across implementations.

---

## 7. Attester Identity

- `attester.id` is a **producer-side key-derived convention**, currently
  `SHA-256(publicKey)`, truncated to the first 16 hex characters, as a human-readable label.
- The **`publicKey` is the cryptographic identity anchor**.
- The verifier validates `attester.id` as a non-empty string and `publicKey` as 64 hex chars,
  but does NOT recompute/enforce the derivation convention.
- The 16-hex truncated identifier MUST NOT be described as collision-resistant; it is a
  label, not an identity proof.

---

## 8. Payload Digest Integrity (V2.5)**

- `evidence.payloadDigest` exists on every assertion.
- The digest rule is **`SHA-256(UTF8(canonicalJSON(evidence.payload)))`**,
  where `canonicalJSON` is **MyShape canonical JSON** — defined normatively in
  §5.0. It is byte-compatible with RFC 8785 (JCS) for I-JSON-conformant input,
  and is a serializer rather than a validator (§5.0 compatibility boundary).
- The CPS-0002 verifier **recomputes** `payloadDigest` from `evidence.payload`
  at verification step **V2.5** (after signature verification, before receipt
  reference verification) and requires an exact match with the signed
  `evidence.payloadDigest` (field #9).
- If the recomputed digest does not match: `INVALID_PAYLOAD_DIGEST`.
- If `payloadDigest` itself is malformed (not 64 lowercase hex chars):
  `INVALID_SCHEMA` (caught at V0).
- `evidence.payload` is **NOT directly signed** (not part of the 12-field
  canonical signing input). However, it is **integrity-bound** to the signed
  payload through the independently verified `payloadDigest` commitment.
- This closes the F7 gap (BATCH-0002-3-F8): an attacker cannot modify
  `evidence.payload` without invalidating verification, because the verifier
  independently recomputes the digest.

---

## 9. Trust / Authorization Boundary

- Cryptographic validity (steps 1–10 in §4) does NOT depend on trust: any validly-signed
  assertion verifies.
- Whether an assertion is *trusted / authorized / accepted by an application* depends on
  deployment inputs: the trusted key set, application allowlist policy, and optional
  revocation state.
- A registry, revocation infrastructure, and key rotation are **deployment concerns**,
  NOT protocol core. They are not required to implement a CPS-0002 verifier.

---

## 10. Explicitly Out of Scope (for this contract version)

- Production human verification, biometrics, liveness detection, Face/Touch ID
- Trusted Issuer Registry and on-chain/off-chain registry selection
- Key rotation, revocation, and historical-security credential handling
- Audience / scope fields and cross-application replay policy
- Multi-attester aggregation, quorum, weighting, conflict resolution
- Privacy-preserving primitives (ZK, blind signatures, anonymous credentials)
- ~~`evidence.payloadDigest` recomputation~~ — **RESOLVED** (BATCH-0002-3-F8, V2.5)

These are future research/design questions. Implementing them in a verifier is NOT required
for CPS-0002 interoperability at this stage.