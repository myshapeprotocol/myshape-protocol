# CPS-0002 — External Review Brief

**Status**
- CPS-0002 Protocol Core: **PROTOTYPE FREEZE CANDIDATE — NOT YET FROZEN** — `cps-hsa-0.1-draft`
- Frozen commit: `d06b907` (tag `cps-hsa-0.1-draft`)
- Companion tag `cps-0002-0.1-draft` at `1008e8f`
- Trust Framework: **NOT FROZEN / OUT OF SCOPE**
- External review: **OPEN**

---

## 1. Purpose

This brief is the entry point for an external technical review of CPS-0002 by
NIST, academic security/identity researchers, and the AI Agent Infrastructure
community. It summarizes the frozen core, the trust boundary, the evidence
surface, and the open questions that lie *outside* the frozen core. It is not a
marketing document and makes no adoption, deployment, or product claims.

The CPS-0002 frozen core is a cryptographic *container* for a human-signal
assertion. It is intentionally neutral about whether any particular attestation
represents a human, is trustworthy, or should be trusted. Those questions are
delegated — by design — to the Trust Framework, deployment policy, and the
relying application.

## 2. Problem

Identity, authentication, and authorization systems answer the question
*“who is this?”* or *“is this caller allowed?”*. CPS-0002 does not sit in that
chain. CPS-0002 addresses a different question that arises once a **continuity
assertion** already exists:

> “Someone signed a continuity receipt with key K about subject S over
> interval T. What additional structure is needed so that another party can
> independently verify an attestation that references that receipt — without
> the verifier needing to trust the issuer, the attester, or the sensor
> stack?”

CPS-0001 solves proof of an *engine observing something continuously*. Any
keypair holder — including an automated script — can legally produce a valid
CPS-0001 receipt. CPS-0002 adds an **additive attestation layer** that
references a CPS-0001 receipt by hash, is signed by an independent attester key,
carries an evidence digest, and has a bounded validity window. The problem is
not “prove a human”; it is “standardize the *shape* of a receipt-bound,
independently-verifiable attestation” and leave “who to trust” explicitly out
of the protocol core.

## 3. Protocol Relationship

```
CPS-0001  ->  Continuity Receipt
              (frozen v1.0-RC1, commit 89c0c4c)
                |
                |  computeReceiptHash = SHA-256( JCS(receipt) )
                v
CPS-0002  ->  Human Signal Assertion
              (12-field canonical payload, Ed25519 signed)
                |
                |  reference.receiptHash binds assertion to receipt
                v
            Independent Verifier
                |
                |  structural + cryptographic checks only
                v
            VALID / INVALID
                |
                |  trust decision (out of core)
                v
            Relying Application -> TRUSTED / TRUSTED-WITH-POLICY / NOT TRUSTED
```

- **CPS-0001** defines the Continuity Receipt and the V1–V7 verification chain.
- **CPS-0002** defines an attestation that references a CPS-0001 receipt by
  canonical hash.
- **CPS-0002 verification** establishes `VALID` / `INVALID` for the assertion.
  This is a cryptographic/structural verdict only.
- **Trust** is decided *after* `VALID`, by Trust Policy / deployment /
  application layers. It is not part of the frozen core.

CPS-0002 is **additive** and does **not** modify CPS-0001. The frozen CPS-0001
surface (verifier, schema, signing payload, test vectors, conformance suite,
`PROTOCOL_BOUNDARY.md`) is byte-for-byte unchanged at the `v1.0-RC1` tag.

## 4. What CPS-0002 Proves (Frozen Core)

A `VALID` CPS-0002 result means the verifier confirmed all of the following:

1. **Schema conformance** (V0): the assertion matches
   `cps-0002-assertion.schema.json` (root-level `additionalProperties: false`
   is normative and verifier-enforced).
2. **Signature validity** (V2): the Ed25519 signature over the 12-field
   canonical signing input is valid under `attester.publicKey`.
3. **Payload digest integrity** (V2.5): the recomputed
   `evidence.payloadDigest` — `SHA-256(UTF8(canonicalJSON(evidence.payload)))`
   — matches the digest committed in the signed payload.
4. **Receipt reference binding** (V3): `reference.receiptId` and
   `subject.id` match the presented CPS-0001 receipt, and the recomputed
   `SHA-256(JCS(receipt))` equals `reference.receiptHash`.
5. **Freshness** (V4): `current_time` is within the assertion’s
   `issuedAt` / `expiresAt` window (default expiry: 1 hour).

Canonical signing input (frozen, 12 fields, joined by `:`):
`protocolType`, `assertionId`, `attester.id`, `attester.publicKey`,
`subject.id`, `reference.receiptHash`, `reference.receiptId`,
`evidence.engineId`, `evidence.payloadDigest`, `validity.issuedAt`,
`validity.expiresAt`, `signature.signedAt`.

Canonicalization: **MyShape canonical JSON** — defined in
`CPS-0002-VERIFIER-CONTRACT.md` §5.0. It is a *serializer, not a validator*:
byte-compatible with RFC 8785 (JCS) on I-JSON-conformant input, but it does not
reject non-finite numbers or lone surrogates as RFC 8785 requires.

Failure reason codes (interop contract — `detail` is informational and may
vary): `INVALID_PROTOCOL_TYPE`, `INVALID_SCHEMA`, `INVALID_SIGNATURE`,
`INVALID_PAYLOAD_DIGEST`, `INVALID_RECEIPT_REFERENCE`, `INVALID_RECEIPT_HASH`,
`EXPIRED`, `MALFORMED_TIMESTAMP`.

## 5. What CPS-0002 Does NOT Prove

**VALID ≠ TRUSTED**
**VALID ≠ AUTHORIZED**
**VALID ≠ HUMAN**
**VALID ≠ ACCEPTED**

A `VALID` assertion proves only: *“someone holding the stated attester key
signed this assertion, and it is internally consistent and bound to the stated
receipt.”*

`VALID` does **not** establish: attester authorization, attester trust, evidence
truth, human presence, biological humanity, liveness, single-use, universal
replay protection, or application acceptance. Trust Policy, deployment
configuration, and application semantics are outside the frozen core.

The toy reference attester emits `engineId = "TOY-HSA-999"` and
`confidence = 0.0` by design, and is labeled `TOY / PROTOTYPE / NOT PROOF OF
HUMAN`. It exists only to make the core reproducible; it carries no human-safety
or production claims.

## 6. Trust Boundary

```
Trust Anchor / deployment (NOT in core)
   |
   v
Attester (Ed25519 key pair; self-declared attester.id)
   |
   |  12-field canonical payload, Ed25519, payloadDigest, receiptHash
   v
CPS-0002 Human Signal Assertion  <- references a CPS-0001 Receipt by hash
   |
   v
Independent Verifier
   |
   |  V0 schema · V2 signature · V2.5 payload digest · V3 receipt binding · V4 freshness
   v
VALID / INVALID   (VERIFIER verdict — cryptographic only)
   |
   v
Relying Application  ->  TRUSTED / UNKNOWN / NOT TRUSTED   (NOT in core)
```

**Inside the frozen core:** schema, 12-field canonical signing input, Ed25519
signing/verification, MyShape canonical JSON, payload-digest rule, receipt
reference binding, validity window, reason codes, test vectors.

**Outside the frozen core (explicitly):** trusted attester key set / Trusted
Issuer Registry, key rotation and revocation, audience/scope and cross-app replay
policy, multi-attester aggregation and quorum, privacy-preserving primitives
(ZK, blind signatures, anonymous credentials), domain separation beyond
`protocolType`, and — critically — any claim that `VALID` implies a human or
implies trustworthiness. Trusted-issuer-registry selection (e.g., on-chain
anchoring via Stellar/Soroban) is one realisation and **not** the definition.

## 7. Threat / Assumption Boundary

The frozen core exposes, but does not resolve, the following:

- **Replay:** time-bounded by `validity.expiresAt`; *cross-application /
  audience-based* replay protection is **not** in core.
- **Expiry:** the verifier checks `expiresAt` against its own clock
  (`current_time`); clock skew handling is a deployment concern.
- **Key compromise / attester compromise:** out of scope for the core.
  Revocation/state is an external deployment input (see TRUST-POLICY.md).
- **Trust anchor:** who is allowed to attest is a **deployment / policy**
  decision, not a protocol-core decision. Anyone can produce a verifiable
  assertion; trust is applied afterwards.
- **Delegation:** explicit delegation of an attester key, and binding that
  delegation to the assertion, is **not** modeled in this draft.
- **Verifier assumptions:** the verifier is deterministic and engine-agnostic
  and ignores `confidence` entirely. It does **not** judge evidence quality,
  sensor provenance, or human presence. It also does **not** re-run CPS-0001
  V1–V7 on the referenced receipt — receipt freshness/validity under
  CPS-0001 is the application’s responsibility.
- **Attester identity convention:** `attester.id = SHA-256(publicKey)[:16]` is a
  producer-side label and is **not** verifier-enforced. `publicKey` is the
  cryptographic identity anchor. This is a documented limitation, not a
  vulnerability, and is recorded as IA-3.

The prototype is **not** a production human-verification mechanism. The threat
model is documented in `CPS-0002-THREAT-MODEL.md`.

## 8. Current Evidence Surface

All of the following are present in the repository at the frozen tag and have
been independently validated:

- Frozen spec files: `CPS-0002_CONCEPT.md`, `CPS-0002-VERIFIER-CONTRACT.md`,
  `CPS-0002-TRUST-POLICY.md`, `CPS-0002-THREAT-MODEL.md`,
  `CPS-0002-TRUST-AUDIT.md`, `CPS-0002-INTEROPERABILITY-AUDIT.md`,
  `IMPLEMENT-CPS-0002.md`.
- Schema: `cps-0002-assertion.schema.json` (version `0.1-draft`).
- Reference implementation + reference verifier:
  `cps-0002-toy-attester/` (producer + canonical payload builder + verifier).
- Independent second verifier: `cps-0002-second-verifier/` (built with
  `node:crypto` and a hand-written RFC 8785 canonicalizer; shares **no** code
  with the reference verifier).
- Test vectors: 4 deterministic vectors
  (`test-vectors/cps0002/`), produced by `scripts/gen-cps0002-test-vector.mjs`.
- Conformance suite: 52 tests
  (`conformance/cps0002-conformance.test.ts`).
- Interoperability suite: 39 tests
  (`conformance/cps0002-interop.test.ts`) — reference verifier vs independent
  second verifier, byte-for-byte.
- Combined CPS-0002 suite: 91 tests (52 conformance + 39 interoperability).
- Audit artefacts: `CPS-0002-TRUST-AUDIT.md` (BATCH-0002-1,
  documentation-only) and `CPS-0002-INTEROPERABILITY-AUDIT.md`
  (BATCH-0002-3-F8, F7 payload-digest-integrity gap resolved and
  cross-language JCS determinism verified against an independent Python
  implementation).
- CPS-0001 isolation confirmed: `git diff` over the frozen CPS-0001 surface is
    empty; CPS-0001 remains byte-for-byte unchanged at `v1.0-RC1` (commit
  `89c0c4c`).

No claim is made here about deployment, adoption, or real-world performance.

## 9. Questions for External Review

1. **Is continuity a distinct trust primitive?** Does framing the attestation
   container separately from identity/authentication (Proof-of-Human, liveness,
   anti-Sybil) as a composable layer have a coherent place in existing
   standards?
2. **Is the VALID vs Trust-Policy boundary correct?** Is the division between
   “structural + cryptographic validity” and “attester authorization,
   revocation, and acceptance policy” drawn in the right place for
   interoperable, engine-agnostic verification?
3. **Are the attestation and verifier assumptions explicit enough?** Are the
   MyShape-canonical-JSON compatibility boundary (serializer, not validator),
   the attester-id convention (producer-only label), and the
   receipt-freshness delegation (application-side) adequately surfaced for an
   independent reader?
4. **What is under-modeled?** Which attack, failure mode, or ambiguity relevant
   to autonomous agents / AI infrastructure is *not* captured by the current
   threat model or the open-question list?
5. **Where should CPS-0002 interoperate?** Which existing standards, protocols,
   or architectures (DID, SIOP, KID, Verifiable Credentials, OAuth DPoP,
   challenge-response / WebAuthn, on-/off-chain attestation schemes) should
         the future Trust Framework intentionally compose with?

---

## 10. Status

- **CPS-0002 Protocol Core: FROZEN** — `cps-hsa-0.1-draft`
  (frozen commit `d06b907` / tag `cps-hsa-0.1-draft`; companion
  `cps-0002-0.1-draft` at `1008e8f`).
- **Trust Framework: NOT FROZEN / OUT OF SCOPE.**
- **External review: OPEN.**

This document is a review artefact, not a commitment to any future Trust
Framework design. Reviewers should base their assessment on the frozen spec
files and the open questions above; the answers to those open questions are
deliberately deferred from the frozen core.

---
*Part of the Continuity Protocol Project — review artefact for
`cps-hsa-0.1-draft`.*