# CPS-0002 — Trust Policy & Attester Model

**Status**: NORMATIVE-DESIGN DRAFT — **NOT FROZEN**.
**Batch**: BATCH-0002-3-F8.
**CPS-0002 status**: PROTOTYPE PHASE COMPLETE — CONCEPT NOT FROZEN.
**CPS-0001 status**: v1.0-RC1 — FROZEN (byte-for-byte unchanged).

---

## 0. Non-Frozen Notice

This document is a **normative-design** artifact that records the trust model,
authorization analysis, and interoperability rules for the CPS-0002 prototype.
It is **NOT a frozen specification** and **NOT a release**. Its recommendations
are proposals for review, expressed as `RECOMMENDED`, `CURRENTLY DEFINED`,
`UNRESOLVED`, or `NOT PROTOCOL CORE`. Nothing here is binding until a future
frozen CPS-0002 specification exists.

---

## 1. Status / Scope

| Item | Value |
|------|-------|
| Protocol | CPS-0002 Human Signal Assertion |
| Status | Prototype phase complete — concept NOT frozen |
| This doc | Trust Policy & Attester Model — analysis + normative design draft |
| Scope | Determine minimum trust model for an external verifier; attribute every capability to protocol core / deployment / policy / future / undefined |
| Non-goals | No registry, no key rotation/revocation infra, no audience field, no multi-attester aggregation, no privacy primitives, no freeze |

---

## 2. Scope of This Document

This document answers:

> "If two independent implementations exist, and neither verifier trusts
> MyShape's software, what external trust information must be supplied before a
> verifier can reasonably accept an attester's assertion?"

It establishes:

- What the CPS-0002 cryptographic core guarantees (independently of MyShape)
- What must be supplied externally (trusted keys, receipt re-verification, policy)
- Which capabilities belong to deployment, application policy, or future
  extension rather than protocol core

It does **not** implement anything.

---

## 3. Attester Identity

### Current model

| Field | Value | Meaning |
|-------|-------|---------|
| `attester.id` | `SHA-256(publicKey)` first 16 hex chars | Key-derived identifier |
| `attester.publicKey` | 64 lowercase hex (Ed25519) | Verification key, self-asserted in the signed payload |

### Answers (CURRENTLY DEFINED)

- **Is `attester.id` merely a key-derived identifier?** ✅ YES. It is a
  deterministic function of the public key. It is not a distinct registered
  identifier.
- **Does it represent organizational identity?** ❌ NO. It carries no
  organizational, legal, or human meaning.
- **Does it represent authorization?** ❌ NO. Merely holding the key does not
  authorize anything; authorization is an external policy decision.
- **Can two operators legitimately have the same attester identity?** ❌ NO —
  unless they share the exact same private key (which is a key-sharing
  arrangement, not two identities). Two different keys → two different ids.
- **Can one operator rotate keys without changing identity?** ❌ NO. A new key
  produces a new `attester.id`. There is no rotation-binding field.
- **Does the schema distinguish identity from key identity?** ⚠️ NO.
  `attester.id` is **derived from** `attester.publicKey`, so identity IS key
  identity. The two fields are present but not independent.
- **Is this distinction necessary for interoperability?** ❌ NO for the
  prototype. Independent implementations derive id the same way. It becomes
  relevant only if identity continuity across key rotation is ever needed
  (future extension).

### Conclusion

> **The current design establishes ONLY key identity.** `attester.id` is a
> key-derived label; it does not express organizational identity, authorization,
> or stable identity independent of the key. This is explicit and intentional
> for the prototype.

Classification: attester identity as key identity = **A. protocol core**
(currently defined). Organizational/stable identity spanning keys =
**D. future extension**.

---

## 4. Attester Authorization Models

### Model A — Self-authenticated attester (current)

- **Trust root**: none. Any key may attest; the verifier validates signature only.
- **Operational complexity**: zero.
- **Revocation model**: none.
- **Interoperability**: highest — any independent implementation works.
- **Privacy**: minimal data; but linkable to the attester key.
- **Cross-application**: same assertion accepted everywhere; no app scoping.
- **Failure mode**: any attacker with their own key can produce a VALID
  assertion about any receipt (they control the subject field) — assertions
  carry no inherent authority.
- **Protocol core?** ✅ The **mechanism** is core; the **lack of authority** is
  by design, not a defect.

### Model B — Registry-backed attester

- **Trust root**: registry operator / registry key / consensus (decentralized).
- **Operational complexity**: high (registry infra, on/off-boarding).
- **Revocation model**: registry-level revocation/suspension list.
- **Interoperability**: conditional — every verifier must consult the registry.
- **Privacy**: registry correlates attester identity.
- **Cross-application**: shared registry unifies trust across apps.
- **Failure mode**: registry compromise/censorship/outage affects all
  verification.
- **Protocol core?** ❌ **B. deployment infrastructure** (a registry is a
  deployment choice; CPS-0002 does not require one to evaluate the prototype).

### Model C — Application allowlist

- **Trust root**: the relying application's configured key list.
- **Operational complexity**: low (static config / pinning).
- **Revocation model**: edit the allowlist; no protocol change.
- **Interoperability**: per-application; no global standard.
- **Privacy**: minimal (app already sees everything).
- **Cross-application**: each app maintains its own trust set.
- **Failure mode**: app must keep the allowlist current; stale lists over-trust.
- **Protocol core?** ❌ **C. application policy**.

### Model D — Web-of-trust / delegated attestation

- **Trust root**: transitive chains of attester-to-attester attestations.
- **Operational complexity**: high (delegation semantics, chain validation).
- **Revocation model**: chain-level revocation; complex.
- **Interoperability**: requires a shared delegation format (not defined).
- **Privacy**: chains reveal attestation graph.
- **Cross-application**: portable only if apps share chain roots.
- **Failure mode**: chain-spoofing / broken trust-path ambiguity.
- **Protocol core?** ❌ **D. future extension** (delegation is not defined and
  not needed for the prototype).

### Model E — Hybrid (allowlist + optional registry)

- **Trust root**: application policy, optionally anchored to a registry.
- **Operational complexity**: medium.
- **Revocation model**: allowlist edit and/or registry status.
- **Interoperability**: the cryptographic core stays registry-free; registries
  plug in as external policy.
- **Privacy**: controllable by app.
- **Cross-application**: per-app trust with optional shared anchors.
- **Failure mode**: depends on the chosen anchors.
- **Protocol core?** ❌ The **pluggability** is core-compatible; the registry
  itself is **B. deployment infrastructure**.

### Which model can CPS-0002 support without changing the schema?

> **All five.** The schema is agnostic: it carries the key, the signature, and
> the assertion. Authorization is purely an external-policy question layered on
> top. Model A is what the prototype exercises; Models B–E require no schema
> change, only external infrastructure/policy.

**Recommendation (RECOMMENDED)**: keep Model A as the protocol-core mechanism;
document Model C (allowlist) as the default deployment posture; defer B/D/E.

---

## 5. Trust Policy

### Formal conceptual model

```
Verify( Assertion, Receipt, AttesterPublicKey, TrustPolicy, CurrentTime, DeploymentState )
```

| Component | Classification | Notes |
|-----------|----------------|-------|
| `Assertion` | **CRYPTOGRAPHIC** | Ed25519 signature over 12-field payload |
| `Receipt` | **CRYPTOGRAPHIC** (content) + **TRUSTED EXTERNALLY** (provenance) | Hash binding is cryptographic; the receipt itself must be fetched and re-verified V1–V7 by the app |
| `AttesterPublicKey` | **TRUSTED EXTERNALLY** | The verifier verifies WITH this key but does not decide it is trusted — the app supplies the trusted key set |
| `TrustPolicy` | **APPLICATION-SPECIFIC** | Which attester keys are accepted, max assertion age, confidence threshold, single-use |
| `CurrentTime` | **DEPLOYMENT-SPECIFIC** | Verifier local clock; used for freshness |
| `DeploymentState` | **APPLICATION-SPECIFIC** | Revocation state, receipt store, nonce/single-use ledger |

### What the cryptographic core provides

Deterministic checks with NO external inputs other than the assertion, the
receipt, the embedded key, and `now`: schema, signature, receipt binding,
freshness.

### What must be supplied externally

1. The trusted attester key set (authorization) — **external**.
2. The referenced receipt (resolution) — **external**, must be re-verified.
3. Revocation state, if any — **external**.
4. Policy (age tolerance, thresholds) — **application**.

> This is the answer to the primary question: an independent verifier that
> trusts neither MyShape's software nor any specific attester needs exactly the
> cryptographic core plus the externally-supplied trusted key set, the receipt,
> and its own policy. No registry is required to run the protocol.

---

## 6. Registry Analysis

| Option | Trust root | Key distribution | Revocation | Rotation | Historical verification | Availability | Censorship/control risk | Implementation complexity | Classification |
|--------|-----------|------------------|-----------|----------|------------------------|--------------|-------------------------|---------------------------|----------------|
| Centralized registry | Registry operator | via registry | registry list | registry | yes (if archived) | single point | HIGH | medium | **USEFUL LATER / DEPLOYMENT CONCERN** |
| Signed registry document | A publisher's signing key | via signed doc | new signed doc | via new doc | yes (docs archived) | moderate | MEDIUM (publisher) | low–medium | **DEPLOYMENT CONCERN** |
| DNS/domain-based | DNS hierarchy / domain owner | via DNS record | DNS updates | via DNS | yes (DNS history) | DNS-dependent | MEDIUM (DNS control) | low | **DEPLOYMENT CONCERN** |
| Application-local registry | The app itself | static config | edit config | edit config | app policy | app-dependent | LOW (app controls) | very low | **C. application policy** |
| Decentralized registry | Network consensus | on-chain | registry + chain | registry | chain history | high | LOW–MEDIUM | high | **USEFUL LATER / D. future extension** |
| **No registry** (current) | None (self-authenticated) | embedded in assertion | none | n/a | signature-forever | n/a | none | zero | **NOT REQUIRED (now)** |

### Conclusion (REQUIRED NOW / USEFUL LATER / DEPLOYMENT CONCERN / NOT REQUIRED)

> **NOT REQUIRED NOW.** The prototype is fully evaluable with no registry.
> A registry is **DEPLOYMENT CONCERN / USEFUL LATER**, never protocol core.
> The schema does not need a registry field.

Do NOT force a registry into protocol core.

---

## 7. Key Lifecycle

### Current (CURRENTLY DEFINED)

| Stage | Support |
|-------|---------|
| Generation | ✅ permissionless |
| Distribution | ✅ embedded in assertion |
| Rotation | ❌ |
| Revocation | ❌ |
| Key expiry | ❌ (only assertion-level expiry exists) |
| Historical verification | ⚠️ signature remains valid forever |

### Two cases

**Case A — Key identity == attester identity (current).**
Rotation means new key = new identity; no continuity. Simple, coherent, and the
only model expressible today. Historical assertions are attributable to the
(now-inactive) key.

**Case B — Attester identity != key identity.**
Requires a stable identity field separate from the key, plus a rotation-binding
mechanism (certificate / pointer from old to new key). **NOT defined**; would be
a schema addition.

### Conclusion

> **Case A is the coherent model for the prototype.** It needs no schema change.
> Case B is **D. future extension** and would require an explicit rotation
> primitive — do not add it now. Key rotation/expiry/compromise are
> **B. deployment + D. future extension**, not core.

---

## 8. Revocation

### Where does revocation belong?

| Layer | Role |
|-------|------|
| Assertion (A) | ❌ No — an already-signed assertion cannot revoke itself; revocation is an external status, not a signed field |
| Registry (B) | ✅ Registry-level revocation list is the natural home (deployment infra) |
| Verifier policy (C) | ✅ Verifier can consult a revocation list supplied by the app |
| Application policy (D) | ✅ App decides which keys/sets are currently acceptable |

### Does an already-signed assertion remain cryptographically valid after the key is revoked?

> **YES — cryptographically.** Ed25519 verification is independent of any
> revocation status; the math does not change. Revocation is a **trust-layer**
> invalidation: the assertion still verifies, but a policy-aware verifier
> rejects it because the attester key is no longer trusted.

This is the standard public-key-revocation position and is **explicitly
recorded** (not silently assumed): signature validity ≠ trust validity.

### Historical verification after revocation

Depends on application policy: archive-and-trust-at-issuance-time vs
revoke-all. Not defined; **C. application policy**.

---

## 9. Replay / Audience Boundary

### Question

Can the same assertion be accepted by multiple applications (App A, App B) and
multiple verifiers (Verifier A, Verifier B)?

> **YES, today.** Nothing in the assertion binds it to a specific audience,
> scope, or application. All verifiers run the same deterministic checks, so all
> return VALID for an unexpired assertion.

### Is that:

| Option | Assessment |
|--------|-----------|
| A protocol feature | ⚠️ Partially — unexpired, unbound assertions are portable by design |
| A privacy issue | ⚠️ YES for correlation (see §15) — reuse across apps links activity |
| An application-policy issue | ✅ Primary — single-use/audience enforcement is app-side |
| A missing audience/context field | ⚠️ True, but adding it is **NOT protocol-core now** |

### Is the problem protocol-core?

> **NO, not now.** The prototype's freshness window bounds reuse in time.
> Audience scoping (a `scope`/`audience` field) would be **D. future
> extension** if ever needed. **Do not add an audience field yet.** The
> application boundary is where replay policy belongs (**C. application
> policy**).

---

## 10. Canonical Signing Input — NORMATIVE

Resolves BATCH-0002-1 MEDIUM finding #1.

> **The signature input is EXACTLY the following 12 fields, in EXACT order,
> joined by a single `:` character. No other field is signed.**

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

**NOT signed by design**: `subject.type`, `evidence.payload`,
`evidence.confidence`, and any future optional fields. They are carried as
metadata only.

> `CURRENTLY DEFINED` — the implementation already signs exactly these 12
> fields. This section makes the rule normative.

---

## 11. Timestamp Rules — NORMATIVE

Resolves BATCH-0002-1 MEDIUM finding #2.

- **Representation**: ISO-8601 UTC, e.g. `2026-08-29T00:00:00.000Z`.
- **Signing input**: the **exact UTF-8 string as it appears** in the assertion
  JSON. The attester signs the literal string; no normalization.
- **Verification**: reconstruct the payload from the assertion object using the
  same literal strings. **Never re-serialize or normalize timestamps during
  verification.**
- **Why**: `2026-08-29T00:00:00Z` and `2026-08-29T00:00:00.000Z` denote the
  same instant but are **different signed payloads**. The signing contract is
  string-identity, not instant-identity.
- **Freshness check (not part of the signed payload reconstruction)**: the
  verifier MAY parse `expiresAt`/`issuedAt` for the V4 time comparison. This
  parsing is for freshness only and does not alter the signed strings.

> `CURRENTLY DEFINED` (toISOString) + `RECOMMENDED` (explicit exact-string
> rule). No implementation change required.

---

## 12. Payload Digest Rules — RESOLVED (BATCH-0002-3-F8)

Resolves BATCH-0002-1 MEDIUM finding #4 and DH-1. Resolved by BATCH-0002-3-F8.

### How `evidence.payload` is bound

- `evidence.payload` is **NOT directly signed** (not part of the 12-field
  canonical signing input).
- It is bound **indirectly** through `evidence.payloadDigest` (field #9),
  which **IS** in the signed payload.
- The digest rule is **`SHA-256( UTF8( JCS( evidence.payload ) ) )`** where
  JCS is RFC 8785 canonical JSON serialization applied to the parsed in-memory
  JSON object (I-JSON constraints apply).

> **F7 fix (BATCH-0002-3-F8):** The verifier now **independently recomputes**
> the digest at V2.5 (after signature verification, before receipt reference
> verification) and requires an exact match with the signed `payloadDigest`.
> Payload tampering can no longer pass verification with a stale digest.
> Mismatches → `INVALID_PAYLOAD_DIGEST`. Malformed digests (non-64 lowercase
> hex) → `INVALID_SCHEMA` at V0.

### Key-order independence

MyShape canonical JSON sorts object keys deterministically by UTF-16 code unit
order (identical to RFC 8785 §3.2.3). Two objects with identical key-value sets
but different key order produce the **same** digest.

### Is this deterministic?

- **Within one attester build**: deterministic (same canonicalization → same
  digest).
- **Across independent implementations**: YES for I-JSON-conformant payloads —
  MyShape canonical JSON is byte-compatible with RFC 8785 (see §12-D and
  `CPS-0002-VERIFIER-CONTRACT.md` §5.0), so any conformant RFC 8785
  implementation produces identical bytes for the same logical JSON object.
  This is a statement about conformant input, **not** a validation guarantee:
  see the compatibility boundary in §12-D.

### The binding semantics (RESOLVED — BATCH-0002-3-F8)

The signed `payloadDigest` is a **self-describing commitment** chosen by the
attester: it claims "my evidence payload hashes to this value." The CPS-0002
verifier **recomputes** the digest from `evidence.payload` at V2.5 and requires
an exact match with the signed value. Therefore:

> **`evidence.payload` IS integrity-protected within CPS-0002 verification.**
> An attacker cannot modify `evidence.payload` without causing a digest
> mismatch (`INVALID_PAYLOAD_DIGEST`) — UNLESS they also recompute the digest
> and re-sign, which invalidates the original signature (`INVALID_SIGNATURE`).
> (Contrast: CPS-0001 V5 also re-checks `payloadDigest` against `payload`.
> CPS-0002 now does the same via JCS — resolved by BATCH-0002-3-F8.)

### Cross-language determinism (I-JSON-conformant input)

MyShape canonical JSON fixes number formatting, key ordering, and Unicode
escaping, and matches RFC 8785 byte-for-byte on I-JSON-conformant input.
Therefore:

> **Cross-language deterministic `payloadDigest` holds for I-JSON-conformant
> payloads.** Two independent implementations (JavaScript + Python) produce
> identical digests for logically identical evidence payloads.

> **This is NOT a validation guarantee.** The serialization is a serializer,
> not a validator: it does not reject non-I-JSON input (non-finite numbers,
> lone surrogates) as RFC 8785 requires. See §12-D.

### Classification & resolution

- Severity: **RESOLVED** (BATCH-0002-3-F8, F7 fix). Previously LOW/documentation.
- Resolution: digest rule changed to `SHA-256(UTF8(JCS(payload)))`; verifier
  now recomputes at V2.5 and enforces exact match; malformed digests rejected
  at V0 as `INVALID_SCHEMA`.
- The F7 gap (payload tampering with stale digest remaining VALID) is closed.

> **RESOLVED** (digest = `SHA-256(UTF8(canonicalJSON(payload)))`, verifier
> re-checks at V2.5, cross-language agreement on I-JSON-conformant input).
> Implementation + test vectors + conformance tests all updated by
> BATCH-0002-3-F8; serialization named and bounded in §12-D.

---

## 12-A. Schema vs Verifier Boundary (additionalProperties) — NORMATIVE

Resolves DH-2.

### Question

Is `additionalProperties: false` in the JSON Schema normative protocol behavior
enforced by the verifier, or schema-level validation behavior not independently
enforced by the verifier?

### Investigation

| Layer | What it checks | What it does NOT check |
|-------|---------------|------------------------|
| **JSON Schema** (`cps-0002-assertion.schema.json`) | `additionalProperties: false` at root level | — |
| **Reference Verifier** (`verifier.ts` `verifySchema`) | Required fields present, correct types, format regexes | Unknown top-level properties |

### Finding

> **`additionalProperties: false` is currently a SCHEMA-LEVEL constraint, NOT a
> verifier-enforced invariant.** The reference verifier's `validateAssertion`
> function checks that required fields exist and conform to format rules; it
> does **not** reject assertions that contain additional top-level properties.

### Consequence

An assertion with an extra top-level field (e.g., `"customField": "value"`) is:
- **Schema-invalid** per the JSON Schema definition.
- **Verifier-valid** per the reference verifier (the field is ignored).

### Classification

- **Schema behavior** = the JSON Schema is the normative definition of
  "well-formed assertion."
- **Verifier behavior** = the verifier enforces structural conformance
  (required fields, formats) but not strict property-set closure.

### Recommendation (documentation only)

> Document that `additionalProperties: false` is the schema's normative
> well-formedness rule. Independent verifiers SHOULD reject unknown properties
> for strict compliance, but the reference verifier does not enforce this today.
> This is a **LOW** divergence — it does not affect cryptographic validity.
> Before any freeze, decide whether the verifier should enforce strict property
> closure (implementation change) or the schema should relax to `true`.

> `CURRENTLY DEFINED` (schema says `false`, verifier does not enforce) +
> `RECOMMENDED` (document the divergence). No implementation change.

---

## 12-B. attester.id Derivation Status — NORMATIVE

Resolves DH-3.

### Current rule

```
attester.id = SHA-256(attester.publicKey)[:16]
```

(first 16 hexadecimal characters of the SHA-256 digest of the public key)

### Status

| Aspect | Status |
|--------|--------|
| **Producer-side convention** | ✅ YES — the attester derives `attester.id` from the public key |
| **Verifier-enforced invariant** | ❌ NO — the verifier checks field format (16 hex chars) but does NOT recompute and compare the derivation |
| **Cryptographic identity anchor** | `attester.publicKey` — the actual Ed25519 key |
| **Collision resistance of `attester.id`** | ❌ NO — 16 hex chars = 64 bits; birthday-bound at ~2^32. The `publicKey` is the collision-resistant anchor |

### Conclusion

> `attester.id` is a **producer-side key-derived convention/rule**, not a
> verifier-enforced invariant. `attester.publicKey` is the actual cryptographic
> identity anchor. The 16-hex-character truncation is a human-readable label,
> not a collision-resistant identifier. Independent implementations MAY derive
> the id differently (or omit it) without affecting cryptographic validity.

> `CURRENTLY DEFINED` (producer convention) + `RECOMMENDED` (document as such).
> No implementation change.

---

## 12-C. Verification Result Contract (status / reason / detail) — NORMATIVE

Resolves DH-4.

### The result type

```typescript
type CPS0002VerificationResult =
  | { status: "VALID" }
  | { status: "INVALID"; reason: CPS0002FailureCode; detail: string };
```

### Field semantics

| Field | Kind | Interoperability role |
|-------|------|----------------------|
| `status` | Machine-interpretable | **REQUIRED** — `VALID` or `INVALID`. The primary decision signal. All independent verifiers MUST agree on this for a given input. |
| `reason` | Stable machine-readable failure classification | **REQUIRED when INVALID** — one of the defined `CPS0002FailureCode` values (`INVALID_PROTOCOL_TYPE`, `INVALID_SCHEMA`, `INVALID_SIGNATURE`, `INVALID_RECEIPT_HASH`, `INVALID_RECEIPT_REFERENCE`, `EXPIRED`, `MALFORMED_TIMESTAMP`). Enables programmatic error handling. |
| `detail` | Human-readable string | **INFORMATIONAL** — context, debugging, field names, expected/got values. Should NOT become an implicit interoperability requirement. Independent verifiers MAY produce different `detail` strings for the same `reason`. |

### Interoperability contract

> **`status` + `reason` are the interoperability contract.** Two independent
> verifiers MUST produce the same `status` and `reason` for the same assertion
> input. `detail` is informational and MAY differ between implementations.

### Failure codes (CURRENTLY DEFINED)

| Code | When returned |
|------|--------------|
| `INVALID_PROTOCOL_TYPE` | `protocolType !== "cps-hsa-0.1-draft"` |
| `INVALID_SCHEMA` | Required field missing or format violation |
| `INVALID_SIGNATURE` | Ed25519 signature does not verify against the reconstructed 12-field payload |
| `INVALID_PAYLOAD_DIGEST` | Recomputed `SHA-256(UTF8(JCS(evidence.payload)))` ≠ signed `evidence.payloadDigest` (V2.5) |
| `INVALID_RECEIPT_HASH` | `reference.receiptHash` does not match `computeReceiptHash(receipt)` |
| `INVALID_RECEIPT_REFERENCE` | `reference.receiptId` or `subject.id` does not match the presented receipt |
| `EXPIRED` | Current time is outside the `validity.issuedAt`–`validity.expiresAt` window |
| `MALFORMED_TIMESTAMP` | Timestamp string cannot be parsed for freshness comparison |

> `CURRENTLY DEFINED` (status + reason = contract, detail = informational) +
> `RECOMMENDED` (document explicitly). No implementation change.

### Question: what should `confidence: 0..1` mean?

| Candidate | Assessment |
|-----------|-----------|
| Probability | ❌ Not defined; MUST NOT assume. No calibration basis. |
| Normalized score | ⚠️ Possible but not standardized |
| Model confidence | ⚠️ Engine-specific at best |
| Attester confidence | ⚠️ Informally described in schema only |
| **Opaque numeric metadata** | ✅ **The only safe interpretation today** |

### Comparability

> `0.8` from Attester A and `0.8` from Attester B are **not comparable**. There
> is no shared scale, no calibration, and no defined semantics. The verifier
> ignores `confidence` entirely.

### Where should confidence be defined?

| Level | Role |
|-------|------|
| Protocol-defined | ❌ NO — would freeze a semantic scale CPS-0002 has not earned |
| Engine-defined | ⚠️ Each engine MAY define its own scale in its opaque payload |
| Attester-defined | ✅ the value is attester-declared |
| Application-defined | ✅ the app decides whether/how to interpret it |

> `CURRENTLY DEFINED`: numeric 0..1, schema-validated, **opaque**.
> `RECOMMENDED`: document "opaque, non-comparable, advisory". Classified
> **C. application policy / E. intentionally undefined**. No aggregation
> implementation.

---

## 12-D. Canonical JSON Serialization — Definition & Boundary (NORMATIVE)

Resolves the Route B canonicalization-naming finding.

### What the serialization is

CPS-0002 hashes two objects through a canonical JSON serialization:

```
receiptHash   = SHA-256( UTF8( canonicalJSON( receipt )        ) )
payloadDigest = SHA-256( UTF8( canonicalJSON( evidence.payload ) ) )
```

The serialization is **MyShape canonical JSON** — a MyShape-defined
deterministic canonical JSON serialization. It is **not** a vendored RFC 8785
implementation and **not** an RFC 8785 conformance claim.

**Normative definition:** `CPS-0002-VERIFIER-CONTRACT.md` §5.0.

### Relationship to RFC 8785 (JCS)

> **Byte-compatible on I-JSON-conformant input.** For every I-JSON-conformant
> value, MyShape canonical JSON and RFC 8785 (JCS) produce identical bytes —
> key sort (UTF-16 code units), ECMAScript `Number::toString` number
> formatting, minimal string escaping, no insignificant whitespace.

This compatibility is **verified**, not assumed: it is pinned by the
cross-language fixture test (`conformance/cps0002-conformance.test.ts`, T8)
against an independently written Python RFC 8785 computation, including the
ES6-sensitive number cases (`1e-7` → `1e-7`, `1.0` → `1`).

### Compatibility boundary (the part that must not be overstated)

> The serialization is a **serializer, not a validator**. It does **not**
> reject non-I-JSON input the way RFC 8785 requires.

| Input | MyShape canonical JSON | RFC 8785 |
|---|---|---|
| `NaN`, `Infinity`, `-Infinity` | serialized as `null` | MUST be rejected |
| Lone surrogate (unpaired `\uD800`-style escape) | serialized as a `\uXXXX` escape | MUST be rejected |
| `undefined` object member | member omitted | not a JSON type |
| `undefined` array element | serialized as `null` | not a JSON type |

**Reachability.** `NaN`, `±Infinity`, and `undefined` cannot be produced by
`JSON.parse`, so they are unreachable from the wire. A **lone surrogate IS
reachable** — a JSON string carrying an unpaired surrogate escape parses
successfully and serializes without error here.

**Consequence.** Both reference verifiers use the same serialization, so digest
agreement between them is unaffected. The divergence is observable only against
an implementation with different strictness. Therefore:

> "Cross-language determinism" (above) is a claim about **I-JSON-conformant
> payloads**. It is **not** a guarantee that every implementation accepts every
> payload a CPS-0002 verifier accepts, and it must not be read as one.

### Terminology

- **"MyShape canonical JSON"** — the precise term; use where the definition,
  compatibility, or boundary matters.
- **"JCS"** — acceptable **shorthand** where the sentence is about
  *I-JSON-conformant* hashing and implies no validation or conformance
  enforcement (e.g. "`SHA-256(JCS(receipt))`"). Do **not** use it to claim
  RFC 8785 conformance, validation, or rejection behavior.

> `CURRENTLY DEFINED` (algorithm) + `NORMATIVE` (term & boundary). No
> serialization change, no hash change, no vector change, no dependency added.

---

## 14. Multi-Attester Model

### Scenarios

| Scenario | Current behavior |
|----------|------------------|
| A → assertion; B → assertion (same receipt) | Two independent VALID/INVALID assertions; no combination semantics |
| A + B → same receipt | Two unconnected assertions |
| A + B → different evidence engines | Two unconnected assertions |
| Conflicting assertions (A present, B not) | Both may be VALID; no conflict resolution |

### Does CPS-0002 define quorum / precedence / weighting / conflict / ranking?

> **NO.** None are defined. Each assertion is self-contained.

### Is multi-attester trust protocol-core?

> **NO — proven by analysis, not assumed.** The protocol's contract is
> per-assertion: sign → verify → bind → freshness. Aggregation is a
> **composition** problem that lives above the per-assertion layer. A
> future multi-attester design would be **D. future extension** (it would need
> its own aggregation semantics and possibly an aggregation object, not a
> change to the assertion schema). Do not implement any aggregation now.

---

## 15. Privacy / Linkability

### Correlation analysis

| Identifier | Cross-application correlation |
|-----------|-------------------------------|
| `subject.id` | YES — stable pseudonym reused across receipts/assertions |
| `receiptId` | YES — stable per receipt |
| `receiptHash` | YES — deterministic; groups all assertions on one receipt |
| `assertionId` | NO — unique per assertion |
| `attester.id` / `attester.publicKey` | YES — stable across all assertions by one attester |

### Conclusion

> The current design **intentionally permits linkability**: the subject +
> receipt-hash + attester triple is fully correlatable across applications that
> share assertions. This is a consequence of the pseudonymous-but-stable
> identity model inherited from CPS-0001. It is not a bug; it is the current
> model.

### Boundaries

- No ZK, blind signatures, anonymous credentials, pairwise identifiers, or
  privacy-preserving primitives are introduced (or intended) in this batch.
- Mitigations (domain-scoped subjects, unlinkable attestation) are
  **D. future extension**. This batch is analysis only.

> `NOT PROTOCOL CORE` today — linkability is an inherent property of the
> current key-derived identity model. Classified **E. intentionally undefined**
> (current) with mitigations deferred to **D. future extension**.

---

## 16. Domain Separation

### Distinction

| Term | Meaning | CPS-0002 status |
|------|---------|-----------------|
| Cryptographically distinct | No known collision between CPS-0002 and CPS-0001/unrelated signatures | ✅ Achieved |
| Formally domain-separated | Specification text explicitly defines a domain tag / context | ⚠️ Partially (protocolType is the de facto tag; not formally specified as such) |

### Is `protocolType` + fixed canonical structure sufficient?

> **YES, practically.** CPS-0002's signed input starts with the constant
> `cps-hsa-0.1-draft` and has a fixed 12-field shape; CPS-0001's starts with a
> UUIDv7 `receiptId` and has 13 fields. No concrete collision path exists.
> Structurally distinct first fields + distinct field counts make a
> cross-protocol signature forgery/confusion impractical.

### Recommendation

- **Documentation only**: state normatively that `protocolType` is the domain
  separator and that the 12-field structure is CPS-0002-specific.
- **Do NOT redesign the signature scheme**; do not add prefixes or
  domain-separation hashes. The negligible risk does not justify a crypto
  change.

> `CURRENTLY DEFINED` (cryptographically distinct) + `RECOMMENDED`
> (documentation of the formal-separation wording). Severity **LOW**.

---

## 17. External Verifier Input Contract

### Conceptual "Verifier Input Contract"

An independent verifier that trusts neither MyShape nor any specific attester
requires the following inputs:

| # | Input | Mandatory? | Kind |
|---|-------|-----------|------|
| 1 | The CPS-0002 assertion | ✅ Mandatory | CRYPTOGRAPHIC (self-contained) |
| 2 | The referenced CPS-0001 receipt | ✅ Mandatory | EXTERNAL (must be fetched/resolved; re-verified V1–V7 by app) |
| 3 | Canonicalization rules (12-field order, timestamp exact-string, digest rule) | ✅ Mandatory | DOCUMENTED CONTRACT (§10–§12) |
| 4 | The attester public key | ✅ Mandatory (verification key) | EMBEDDED in assertion; TRUSTED set supplied externally |
| 5 | Trust policy (which keys, max age, confidence threshold, single-use) | ⚠️ Mandatory for a *decision*, not for cryptographic verification | APPLICATION-SPECIFIC |
| 6 | Current time | ✅ Mandatory (freshness V4) | DEPLOYMENT (verifier clock) |
| 7 | Revocation state, if applicable | ⚠️ Conditional (only if registry/policy exists) | EXTERNAL |

### The contract in one line

```
verify( assertion, receipt, canonicalRules, trustedKeySet, now [, revocationState ] )
   → { VALID } | { INVALID, reason }
```

Inputs 1–3 are enough for **cryptographic validity**. Inputs 4–7 turn that
validity into a **trust decision**. No registry is required to reach
cryptographic validity.

---

## 18. Protocol vs Deployment Boundary

Classification: A = protocol core · B = deployment infrastructure ·
C = application policy · D = future extension · E = intentionally undefined.

| Feature | Class | Rationale |
|---------|-------|-----------|
| Attester identity (key-derived) | **A** | `attester.id` derivation is a protocol rule |
| Public key (encoding/verification) | **A** | 64-hex Ed25519 + verify-with-key is core |
| Trust registry | **B** | Which keys are trusted is deployment's choice |
| Key rotation | **B + D** | New key = new identity (B); continuity needs future primitive (D) |
| Key revocation | **B + D** | Requires external status channel (B); formal mechanism future (D) |
| Replay (single-use) | **C** | App enforces; protocol bounds only by `expiresAt` |
| Audience / scope field | **D** | Not defined; would be future extension |
| Confidence semantics | **C / E** | Opaque; app-layer interpretation; intentionally undefined |
| Multi-attester aggregation | **D** | Future extension (composition above per-assertion) |
| Privacy / linkability | **E** (current) / **D** (mitigations) | Inherent to key-derived model; fixes are future |
| Domain separation | **A** | `protocolType` + 12-field structure is core behavior |
| Receipt freshness composition | **B / C** | App must run CPS-0001 V6; core CPS-0002 verifier stays receipt-agnostic |

**Conclusion**: The protocol core is minimal (identity-as-key, signing,
binding, freshness, domain separation). Everything else is correctly outside it.

---

## 19. Recommended Minimal Model

For the two-independent-implementations scenario (neither trusts MyShape):

1. **Protocol core (A)** — already implemented:
   - 12-field canonical payload, Ed25519, receipt-hash/id/subject binding,
     freshness, `protocolType` domain separation.
2. **Deployment (B)** — supplied by each app:
   - Trusted attester key set (allowlist or registry).
   - Receipt resolution + CPS-0001 re-verification (incl. V6 freshness).
   - Revocation state when a registry exists.
3. **Application policy (C)** — supplied by each app:
   - Max assertion age, confidence threshold, single-use tracking, audience
     enforcement.
4. **Explicitly deferred (D / E)**:
   - Identity continuity across key rotation, revocation infra, audience
     field, multi-attester aggregation, privacy mitigations.

> **The recommended minimal model = Model A (self-authenticated) + Model C
> (allowlist) at the deployment layer.** No registry is required now. This is
> the smallest trust model that lets an external verifier reasonably accept an
> attester's assertion: cryptographic validity from the core, authority from an
> externally-trusted key set, decisions from application policy.

---

## 20. Explicitly Unresolved Questions

1. **Attester authorization**: formal definition of how a verifier's trusted
   key set is established and updated. (Deployment; not core.)
2. **Trusted Issuer Registry**: whether/when a shared registry is needed, and
   its governance. (Deployment/future.)
3. **Key rotation**: whether identity continuity across rotation is ever
   required, and if so the rotation primitive. (Future.)
4. **Key revocation**: the mechanism (list, on-chain status) and whether
   historical assertions are archive-trusted or revoked. (Deployment/policy.)
5. **Compromised attester keys**: the exact response procedure. (Deployment.)
6. **Replay policy**: single-use / audience enforcement mechanics. (Application.)
7. **Receipt freshness composition**: whether the CPS-0002 verifier should
   itself check referenced-receipt expiry. (Currently app-side.)
8. **Confidence semantics**: whether a standardized scale is ever needed, and
   who defines it. (Undefined.)
9. **Multi-attester aggregation**: aggregation object, quorum, precedence,
   conflict resolution, trust ranking. (Future.)
10. **Privacy / linkability**: domain-scoped subjects, unlinkable attestation,
    DIDs. (Future.)
11. **Formal domain-separation wording**: exact normative text for `protocolType`
    as a domain tag. (Documentation; LOW. See §16.)
12. **Payload digest determinism**: RESOLVED BY BATCH-0002-3-F8. Moved from
    `SHA-256(JSON.stringify(payload))` to
    `SHA-256(UTF8(canonicalJSON(payload)))` — MyShape canonical JSON, byte-
    compatible with RFC 8785 on I-JSON-conformant input; verifier now
    recomputes at V2.5 (§12, §12-D).
13. **Schema vs verifier enforcement**: whether the verifier should enforce
    strict property-set closure (`additionalProperties: false`) or the schema
    should relax. (Documentation; LOW. See §12-A.)
14. **attester.id derivation enforcement**: whether the verifier should
    recompute and enforce the `SHA-256(publicKey)[:16]` derivation. (Documentation;
    LOW. See §12-B.)

None blocks the prototype. None requires a schema change. All are recorded, not
answered, per the batch directive.

---

## Annex A — Four Interoperability Resolutions (from BATCH-0002-1)

| BATCH-0002-1 MEDIUM | Resolution (normative section) |
|---------------------|--------------------------------|
| 1. Signing input exactly 12 fields | §10 Canonical Signing Input |
| 2. Timestamp exact-string reproduction | §11 Timestamp Rules |
| 3. Colon joining = field-by-field reconstruction (never split on ":") | §10 (fields listed individually; reconstruction is field-by-field by construction) |
| 4. Payload-digest serialization determinism | §12 Payload Digest Rules |

All four are resolved as **documentation/normative text only** — no
implementation, schema, canonical-payload, test-vector, or conformance change
was required. All four were **not** blockers (no BLOCKER/HIGH findings).

---

## Annex B — Documentation Hardening Resolutions (from DH-1 → DH-4)

| DH | Topic | Resolution (normative section) | Implementation change |
|----|-------|-------------------------------|----------------------|
| DH-1 | payloadDigest cross-language determinism | §12 (Cross-language determinism) | NONE |
| DH-2 | additionalProperties / schema vs verifier | §12-A | NONE |
| DH-3 | attester.id status | §12-B | NONE |
| DH-4 | status / reason / detail contract | §12-C | NONE |

All four are **documentation-only** — no schema, verifier, canonical-payload,
test-vector, or conformance change was required.

---

*Document: `continuity-protocol/CPS-0002-TRUST-POLICY.md` — normative-design
draft, NOT frozen — accompanies BATCH-0002-2 + Documentation Hardening (DH-1→DH-4) — Part of the Continuity Protocol
Project — 2026-08-29*