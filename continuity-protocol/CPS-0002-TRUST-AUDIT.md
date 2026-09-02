# CPS-0002 — Trust Model & Interoperability Audit

**Status**: AUDIT — accompanies BATCH-0002-1.
**Scope**: Rigorous audit of the BATCH-0002-0 prototype. No implementation changes unless objectively necessary. Documentation-only.
**CPS-0002 status at time of audit**: PROTOTYPE PHASE COMPLETE — CONCEPT NOT FROZEN.

---

## 1. Executive Summary

CPS-0002 is currently a **cryptographic container for a human-signal assertion**:
an Ed25519-signed statement that references a specific CPS-0001 receipt by hash,
with a bounded validity window, produced by a self-declared attester identity.

The prototype is **interoperable and reproducible** by an independent
implementer without MyShape. The verifier performs only deterministic,
cryptographic checks and ignores `confidence` entirely.

**The single most important finding**: CPS-0002, as designed, establishes
**WHO signed** (attester key), **WHAT receipt** (hash), **ABOUT WHOM** (subject),
and **WHEN** (validity). It does **NOT** establish **WHETHER the attester is
authorized** or **WHETHER the evidence reflects a human**. Both are correctly
outside the protocol core.

Every unresolved capability (attester authorization, key rotation/revocation,
replay policy, multi-attester aggregation, privacy primitives) is either
**deployment infrastructure**, **application policy**, or a **future extension** —
NOT required for the protocol's cryptographic core.

**Result**: NO implementation changes made. One documentation artifact
(`CPS-0002-TRUST-AUDIT.md`) created. The audit identified documentation
clarifications only, none of which are blockers for interoperability or
security of the prototype.

---

## 2. Current Trust Model

```
Human Subject (outside all cryptographic trust)
      |
      | presence evidence — opaque to protocol
      v
CPS-0001 Receipt (signed continuity assertion; V1–V7 verified independently)
      |
      | receiptHash = SHA-256( JCS( receipt ) )
      v
CPS-0002 Assertion (12-field canonical payload, Ed25519 signed)
      |
      | V0 schema · V2 signature · V3 receipt binding · V4 freshness
      v
CPS-0002 Verifier → VALID / INVALID
      |
      | decision policy (confidence thresholds, attester allowlist, …)
      v
Relying Application → authorization decision
```

### What `VALID` means

`VALID` = the assertion is structurally conformant, its Ed25519 signature is
valid for the reconstructed 12-field canonical payload, the referenced receipt
hash/id/subject match the presented receipt, and the assertion is within its
validity window.

### What `VALID` does NOT mean

- The attester is authorized or trusted
- The attester observed a real human
- The evidence is true, fresh, or meaningful
- Liveness, anti-Sybil, or proof-of-human

### Trust anchors

| Anchor | Established by | Trusted from |
|--------|----------------|--------------|
| Signature integrity | Ed25519 over 12-field payload | Cryptographically embedded |
| Receipt content binding | SHA-256(JCS(receipt)) | Cryptographically embedded |
| Subject binding | subject.id == receipt.subject.id | Cryptographically embedded |
| Freshness window | validity.issuedAt / expiresAt | Cryptographically embedded (signed) |
| Attester identity | attester.publicKey | Self-declared — NOT trusted |
| Attester authorization | — | **Missing** (deployment) |
| Receipt authenticity | CPS-0001 V1–V7 | Must be re-verified by the app |

---

## 3. Attester Trust

### What an attester claims

An attester claims, by signing the 12-field payload:

> "I, the holder of `attester.publicKey`, assert that the CPS-0001 receipt
> identified by `reference.receiptHash` / `reference.receiptId` pertains to
> subject `subject.id`, and I attach evidence `evidence.engineId` /
> `evidence.payloadDigest` with my stated `confidence`."

### What an attester does NOT claim

- That the attester is a human
- That the evidence is truthful, measured, or from a biological source
- That the receipt's issuer was honest
- That no robot produced the evidence

### Who may operate an attester

**Anyone with an Ed25519 keypair.** Attestation is permissionless.

### Identity: self-declared, not registry-backed

- `attester.id` = first 16 hex chars of `SHA-256(attester.publicKey)` (derived, not registered)
- `attester.publicKey` is self-asserted inside the signed payload

### What `attester.publicKey` establishes

It is the **verification key**. A valid signature proves the signer held the
corresponding private key. It binds the assertion to a stable pseudonymous
identity across all assertions from that key.

### What it does NOT establish

- That the key is on any approved list
- That the key maps to a real-world entity (human, org, device)
- That the key is currently valid (not rotated/revoked)

### How an external verifier knows a key is authorized

**It cannot, from the protocol alone.** Authorization requires external trust:

- An allowlist / registry of approved attester public keys
- On-chain anchoring / attestation of attester keys
- Application-policy key pinning

### Is a Trusted Issuer Registry required?

| Layer | Required? |
|-------|-----------|
| Cryptographic core (sign/verify/reference) | **NO** — the protocol works permissionlessly |
| Meaningful deployment (trust an assertion) | **YES** — an app must decide which attesters it trusts |
| Protocol specification | **NOT CORE** — it is **deployment infrastructure** |

Classification: **B. deployment infrastructure**. The audit proves the current
design CAN be evaluated without a registry: the toy attester + reference
verifier + conformance suite fully exercise the protocol mechanics.

---

## 4. Key Lifecycle

| Lifecycle stage | Current support | Notes |
|-----------------|-----------------|-------|
| Generation | ✅ permissionless Ed25519; id derived from pubkey | No CSR, no KYC |
| Distribution | ✅ key embedded in assertion (`attester.publicKey`) | No key-discovery channel |
| Rotation | ❌ not defined | New key = new identity; no prior-key linkage or rotation proof field |
| Revocation | ❌ not defined | No revocation list, no status field, no key expiration |
| Compromised keys | ❌ not addressed | Threat model marks "NOT YET DEFINED"; old assertions still verify |
| Historical verification | ⚠️ signatures remain valid forever | `validity.expiresAt` bounds assertion freshness, NOT key validity |
| Expiration semantics | ✅ `validity.expiresAt` (assertion-level) | Does not express key-level validity |

**Format capability**: The assertion format can express key rotation by signing
with a new key (new self-declared identity), but it has **no field for a
rotation certificate, a revocation indicator, or a key-validity window**. The
format cannot express revocation. Revocation requires external infrastructure.

Classification: rotation/revocation = **B. deployment infrastructure** +
**D. future extension**. Not required to evaluate the prototype.

---

## 5. Replay Model

| Replay class | Prevented cryptographically? | By what / what's needed |
|--------------|------------------------------|-------------------------|
| Unchanged assertion replayed | ❌ NO (within validity window) | Requires application single-use policy / nonce |
| After receipt expiration | ⚠️ PARTIAL | CPS-0002 verifier checks assertion freshness only, NOT receipt freshness; app must run CPS-0001 `verifyReceipt` (incl. V6) on the receipt |
| Across applications | ❌ NO | No audience/scope field; application policy must bind |
| Across verifiers | ❌ NO | Deterministic verifiers all return VALID for an unexpired assertion — expected |
| With modified receipt | ✅ YES | hash mismatch → `INVALID_RECEIPT_HASH` |
| With modified subject | ✅ YES | signature invalid + subject binding mismatch |
| With modified assertion | ✅ YES | signature invalid (`INVALID_SIGNATURE`) |
| Valid historical assertion | ⚠️ VALID until `expiresAt` | After expiry → `EXPIRED`; before expiry it replays |

**Conclusion**: Cryptographic prevention covers *tampering* classes fully.
*Replay* classes are only bounded by the signed validity window and must be
further constrained by application policy. None of this requires a schema
change for the prototype.

---

## 6. Receipt Binding

| Field | Role | Assessment |
|-------|------|-----------|
| `reference.receiptHash` | **Cryptographic integrity** — SHA-256(JCS(receipt)) | **Necessary, sufficient** for content binding |
| `reference.receiptId` | **Object identity / lookup convenience** | **Redundant cryptographically** (hash covers receiptId), **necessary for UX/lookup** — not a defect |
| `subject.id` | **Subject binding** | **Necessary semantically**; redundant cryptographically but carries normative meaning |

**No concrete defect identified.** The triple is sound: hash = what receipt
(integrity), receiptId = which receipt (lookup), subject = about whom
(semantic). **Do not change the schema.**

---

## 7. Cross-Implementation Interoperability

| Surface | Specified? | Where | Ambiguity |
|---------|-----------|-------|-----------|
| Canonical payload ordering | ✅ | IMPLEMENT-CPS-0002.md §5 + code | Clear: 12 fields |
| Exact serialization rule | ⚠️ | Only code comment (`join(":")`) | **MEDIUM**: not stated normatively in a spec doc |
| Timestamp serialization | ⚠️ | `toISOString()` → UTC `Z` | **MEDIUM**: sign EXACT string; `Z` vs `+00:00` = different signed payloads |
| UUID requirement | ✅ | schema UUIDv7 regex | Clear |
| Public-key encoding | ✅ | 64 lowercase hex | Clear |
| Signature encoding | ✅ | 128 lowercase hex | Clear |
| Hash/digest encoding | ✅ | 64 lowercase hex | Clear |
| Algorithm identifier | ✅ | `"Ed25519"` const | Clear |
| Schema semantics | ✅ | draft 2020-12, `additionalProperties:false` | Clear |
| Failure semantics | ✅ | VALID / INVALID + code + detail | Clear |
| **Which fields are signed** | ⚠️ | Implicit | **MEDIUM**: `subject.type`, `evidence.payload`, `evidence.confidence` are NOT signed |

### Severity of ambiguities

| Ambiguity | Severity | Minimum clarification (documentation only) |
|-----------|----------|---------------------------------------------|
| Signing input = exactly 12 listed fields, joined by ":" | MEDIUM | "The signature covers only the 12 listed fields; `subject.type`, `evidence.payload`, `evidence.confidence` are excluded by design." |
| Timestamp exact-string reproduction | MEDIUM | "Sign the timestamp strings exactly as they appear; reconstruct from the same object, never re-serialize timestamps." |
| Colon-joining vs splitting | MEDIUM | "Fields contain colons (ISO timestamps, `sha256:` ids). Reconstruct field-by-field; never split the joined string on ':'." |
| No single normative SPEC doc | LOW | Future: extract canonical-payload rules into IMPLEMENT-CPS-0002.md §5 |

No ambiguity is a BLOCKER: the test vector + conformance suite provide a
byte-exact oracle, and the reference verifier is the normative behavior.

---

## 8. Cryptographic Domain Separation

### Current state

- CPS-0002 signs a **12-field** colon-joined string whose **first field** is
  `protocolType = "cps-hsa-0.1-draft"`.
- CPS-0001 signs a **13-field** colon-joined string whose **first field** is
  `receiptId` (UUIDv7), NOT a protocolType tag.

### Assessment

| Concern | Status |
|---------|--------|
| CPS-0002 vs CPS-0001 collision | **No collision**: different field counts (12 vs 13), different first-field semantics, different field sets |
| Unrelated Ed25519 signatures | De facto separated by the leading `protocolType` constant unique to CPS-0002 |
| Other CPS-0002 assertion types (future) | Would need a distinct `protocolType` value — mechanism exists |

### Recommendation

The `protocolType` field **is** the domain separator. **Do not introduce a new
crypto construction** (no prefixing scheme, no domain-separation hash). Risk is
negligible because the payload shapes are structurally distinct.

Severity: **LOW**. Documentation-only (state `protocolType` is the de facto
domain tag).

---

## 9. Multi-Attester Model

| Capability | Defined? |
|------------|----------|
| Aggregation of multiple attesters' assertions on one receipt | ❌ NO |
| Precedence (which attester's assertion wins) | ❌ NO |
| Conflict resolution (A says human-present, B says not) | ❌ NO |
| Quorum (k-of-n attestations) | ❌ NO |
| Trust ranking (attester weight) | ❌ NO |

Multiple attesters producing assertions over the same receipt currently produce
**independent, unconnected assertions**. A verifier or application MAY combine
them by application policy, but the protocol defines no semantics for doing so.

**Explicitly UNRESOLVED** — classified **D. future extension**. Not required to
evaluate the prototype. (Scenarios A+A, A+B, same/different engines, different
confidence, different windows all reduce to "two independent VALID/INVALID
assertions" today.)

---

## 10. Confidence Semantics

| Question | Answer |
|----------|--------|
| Is confidence comparable across attesters? | **NO** — not standardized |
| Is 0–1 numeric or semantically standardized? | **Numeric only** (schema range check); no shared semantic scale |
| Can a verifier interpret 0.8 consistently? | **NO** — the reference verifier does not read confidence at all |
| Does confidence represent probability? | **Not defined** — do not assume |
| Does confidence represent a model score? | **Not defined** — engine-specific at best |
| Does confidence represent attester certainty? | **Informally** (schema description) — not normative |

### Safety assessment

The prototype is **safe** only because the verifier **ignores** `confidence`
entirely (schema-validated but never interpreted). Any relying application that
maps 0.8 → "80% chance of human presence" is doing so WITHOUT protocol support.

**Documentation limitation**: confidence is an opaque, non-comparable
attester-declared value. Cross-attester comparability and calibration are
**NOT YET DEFINED** (classified **C. application policy / E. intentionally
undefined**). No implementation change.

---

## 11. Privacy / Linkability

| Identifier | Reuse profile | Linkability |
|------------|---------------|-------------|
| `subject.id` | Reused across CPS-0001 receipts and across assertions | High — stable pseudonym (inherited from CPS-0001) |
| `receiptHash` | Deterministic; same receipt referenced by many assertions | High — groups all assertions about one receipt |
| `receiptId` | Stable per receipt | High — lookup correlator |
| `assertionId` | Unique UUIDv7 per assertion | Low individually |
| `attester.publicKey` | Stable across all assertions by one attester | High — links all of an attester's output |
| Cross-application correlation | No audience/scope separation | **YES** — apps sharing assertions can correlate by subject.id / receiptHash / attester.publicKey |

**Assessment**: CPS-0002 **inherits and amplifies** CPS-0001's linkability.
The receipt hash + subject + attester triple creates a correlation set. No
privacy primitive (ZK, blind signatures, anonymous credentials) exists or is
intended for this batch.

**This batch identifies the problem only.** Mitigations (domain-scoped
subjects, unlinkable attestation, DIDs) are **D. future extension**. Do not
introduce privacy primitives now.

---

## 12. External Verifier Model

Minimum information an external verifier needs, and its source:

| Input | Category | Present? |
|-------|----------|----------|
| The CPS-0002 assertion | Cryptographically embedded | ✅ in-protocol |
| The referenced CPS-0001 receipt | **Externally trusted** (must be fetched / re-verified V1–V7 by the app) | ⚠️ presented alongside; not self-contained |
| The trusted attester public key | **Externally trusted** (allowlist / registry / pinning) | ❌ **Missing** — deployment decides |
| Policy (which attesters, confidence threshold, max age) | **Deployment-specific** | ⚠️ application layer only |
| Current time | Verifier local clock | ✅ runtime input |
| Revocation state | **Externally trusted** | ❌ **Missing entirely** — no mechanism |

### What an external verifier must do beyond the CPS-0002 verifier

1. Re-run CPS-0001 `verifyReceipt` on the referenced receipt (V1–V7 **including
   receipt freshness/expiry**).
2. Decide whether `attester.publicKey` is in its trusted set.
3. Apply its own policy (age, confidence, single-use).

This is expected architecture — the CPS-0002 verifier stays small and
deterministic; the app composes trust.

---

## 13. Protocol vs Deployment Boundary

Classification key: A = protocol core · B = deployment infrastructure ·
C = application policy · D = future extension · E = intentionally undefined.

| Feature | Classification | Rationale |
|---------|----------------|-----------|
| 12-field canonical payload + Ed25519 | **A** | Normative signing contract |
| receiptHash / receiptId / subject binding | **A** | Normative binding contract |
| freshness (validity window) | **A** | Normative time contract |
| domain separation (protocolType) | **A** (already achieved) | First-field constant |
| Attester authorization / registry | **B** | Which keys are trusted is deployment's choice |
| Key rotation / revocation | **B + D** | Requires external status channel |
| Receipt resolution / re-verification | **B** | App supplies and verifies receipt V1–V7 |
| Replay policy (single-use, audience) | **C** | Application decides freshness/single-use |
| Confidence interpretation | **C / E** | Opaque; app-layer semantics, intentionally undefined |
| Multi-attester aggregation / quorum | **D** | Future protocol extension |
| Privacy / unlinkability primitives | **D** | Future; out of scope |
| Trusted Issuer Registry (on-chain) | **B / D** | Deployment infra today, possible future protocol anchor |

**Conclusion**: No unresolved capability is forced into protocol core. The
protocol core is minimal and stable.

---

## 14. Cold Reader Audit

Cold reader: an engineer who has NEVER seen the TypeScript implementation,
using only the concept doc, threat model, schema, test vector, conformance
tests, and IMPLEMENT-CPS-0002.md.

| Reproducible item | Can they? | Evidence | Ambiguity |
|-------------------|-----------|----------|-----------|
| Canonical payload (12 fields, order) | ✅ | IMPLEMENT-CPS-0002.md §5 table | Field list + order clear |
| Exact serialization (join with ":") | ⚠️ | Only in code comment; §5 says "joined by ':'" | **MEDIUM** — worth stating normatively |
| Signature verification (Ed25519 over payload) | ✅ | IMPLEMENT-CPS-0002.md §5–6; schema | Clear |
| Receipt hash verification (SHA-256(JCS)) | ✅ | IMPLEMENT-CPS-0002.md §4; schema | Clear |
| Freshness verification (expiresAt) | ✅ | IMPLEMENT-CPS-0002.md §6 | Clear |
| Payload digest (SHA-256 of JSON.stringify(payload)) | ⚠️ | schema description; engine guide | **MEDIUM** — JSON.stringify key-order dependence; the attester must match the exact serialization |
| **Which fields are NOT signed** | ⚠️ | Implicit only | **MEDIUM** — `subject.type`, `evidence.payload`, `evidence.confidence` excluded |

### Cold reader verdict

A competent cold reader CAN reproduce all four required primitives
(canonical payload, signature verification, receipt hash verification,
freshness verification). The remaining ambiguities are **clarification-level**,
not blockers — the test vector (`human-signal-01.json`) provides a byte-exact
oracle that catches any misinterpretation.

---

## 15. Minimal Required Changes

| # | Issue | Severity | Protocol-core? | Evidence | Minimum required action | Implementation required? | Documentation only? |
|---|-------|----------|----------------|----------|-------------------------|--------------------------|---------------------|
| 1 | Attester authorization not defined | NONE (by design) | No (B) | §3 | None — trust of attester keys is deployment's job | NO | YES |
| 2 | Key rotation/revocation not defined | NONE (by design) | No (B/D) | §4 | None — record as future extension | NO | YES |
| 3 | Replay (unchanged / cross-app) not prevented | NONE (by design) | No (C) | §5 | None — record application-policy requirement | NO | YES |
| 4 | Receipt freshness not checked by CPS-0002 verifier | LOW | No (B) | §5, §12 | Document: app must run CPS-0001 verifyReceipt incl. V6 | NO | YES |
| 5 | Signing input (12 fields only) not stated normatively | MEDIUM | Yes (A) | §7, §14 | Add normative note in IMPLEMENT-CPS-0002.md §5 | NO | YES |
| 6 | Timestamp exact-string rule | MEDIUM | Yes (A) | §7, §14 | Document: sign exact strings; never re-serialize | NO | YES |
| 7 | Colon-joining vs splitting | MEDIUM | Yes (A) | §7, §14 | Document: reconstruct field-by-field, never split on ':' | NO | YES |
| 8 | Domain separation rationale | LOW | Yes (A) | §8 | Document: protocolType is the de facto domain tag | NO | YES |
| 9 | Confidence non-comparability | NONE (by design) | No (C/E) | §10 | Document: confidence is opaque, not probability | NO | YES |
| 10 | Multi-attester / privacy unresolved | NONE (by design) | No (D) | §9, §11 | Record as future extension | NO | YES |

**No BLOCKER and no HIGH finding.** All actions are **documentation-only**. Per
the batch directive, no implementation change is made in this batch.

**Deferred documentation work** (not part of this batch's required output, for
a future batch): fold items 5–8 into IMPLEMENT-CPS-0002.md §5 as a normative
note. The required output of BATCH-0002-1 is the audit document itself.

---

## 16. Explicitly Unresolved Questions

1. **Attester authorization**: How does a verifier decide which attester
   public keys are trusted? (No protocol answer; deployment decision.)
2. **Key rotation/revocation**: How are rotated/revoked keys discovered and
   invalidated? (External status channel; NOT defined.)
3. **Replay policy**: How is single-use / audience / cross-app replay
   constrained? (Application policy; NOT defined.)
4. **Receipt freshness composition**: Should the CPS-0002 verifier itself check
   the referenced receipt's expiry, or remain receipt-agnostic? (Currently the
   app must do it.)
5. **Confidence semantics**: What does confidence mean across attesters?
   Probability / model score / certainty? (Intentionally undefined.)
6. **Multi-attester aggregation**: How are multiple assertions combined —
   aggregation, precedence, conflict resolution, quorum, trust ranking?
   (Future extension.)
7. **Privacy / unlinkability**: How to reduce cross-application correlation
   without centralization? (Future extension; problem identified only.)
8. **Domain separation formalization**: Should separation move beyond the
   protocolType-first-field convention into an explicit mechanism? (Risk
   negligible; LOW.)
9. **Historical verification under compromise**: If an attester key is
   compromised, how should historical assertions be treated? (No mechanism;
   deployment policy.)

None blocks the prototype. None requires a schema change. All are recorded,
not answered, per the directive.

---

## 17. CPS-0001 Isolation Confirmation

- HEAD = `89c0c4ce02f49851c51e81198f1a44274d5ada7b`
- Tag = `v1.0-RC1`
- `git diff` on the frozen surface is **EMPTY**:
  - `src/lib/evidence/cps0001.ts`
  - `packages/myshape/src/cps0001.ts`
  - `continuity-protocol/reference-verifier/verifier.ts`
  - `continuity-protocol/second-producer/noble-verifier.ts`
  - `continuity-protocol/cli/bin/cps-verify.mjs`
  - `continuity-protocol/PROTOCOL_BOUNDARY.md`
  - `continuity-protocol/RELEASE-v1.0-RC1.md`
  - `continuity-protocol/schemas/continuity-receipt.schema.json`
  - `continuity-protocol/test-vectors/valid/*`
  - `continuity-protocol/conformance/*`
  - `continuity-protocol/shared/jcs.ts`
- **CPS-0001 remains byte-for-byte unchanged.**
- CPS-0002 remains **PROTOTYPE PHASE COMPLETE — CONCEPT NOT FROZEN**. NOT a
  release, NOT frozen, NOT production. No human-truth / proof-of-human /
  liveness / anti-Sybil claims added anywhere.

---

*Document: `continuity-protocol/CPS-0002-TRUST-AUDIT.md` — accompanies
BATCH-0002-1 — Part of the Continuity Protocol Project — 2026-08-29*
