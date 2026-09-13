# X / Twitter Thread — CPS-0002 0.1-DRAFT

Announcement thread for the CPS-0002 0.1-DRAFT freeze.
Framing: DRAFT / PROTOTYPE. Not proof of human. Not a production identity system.
All facts below come from the frozen artifacts (tag `cps-0002-0.1-draft`).

---

## 1/9

We froze CPS-0002 0.1-DRAFT — an attestation layer for the Continuity Protocol.

Explanatory framing (not a spec definition):

CPS-0001 answers: "What evidence was produced?"
CPS-0002 begins answering: "How can another party attest to that evidence?"

---

## 2/9

First, the base layer. CPS-0001 (frozen at v1.0-RC1) defines continuity
receipts: signed records that commit to evidence with hashes. They protect
what was produced — but a receipt alone gives no one else a standard way to
publish a verifiable statement about that evidence.

---

## 3/9

CPS-0002 adds assertions. An assertion is a small signed JSON object in which
an attester references a receipt, commits to an evidence payload by digest,
and signs a canonical payload with Ed25519.

---

## 4/9

The reference is tamper-evident: receiptHash = SHA-256 over the canonical form
of the receipt, plus the receipt id and subject binding. Change one byte of the
referenced receipt and the hash stops matching.

---

## 5/9

The evidence itself is committed by digest: payloadDigest = lowercase hex of
SHA-256 over a canonical serialization of the evidence payload.

Canonicalization is where cross-language implementations break, so the draft
pins it explicitly as MyShape canonical JSON — a fully specified rule set
(UTF-16 code-unit key sort, ES6 number formatting, minimal escaping) that is
byte-for-byte compatible with RFC 8785 (JCS) on conformant input. The frozen
vectors were cross-checked against an independent Python RFC 8785
implementation.

One honest caveat, stated in the spec: it's a serializer, not a validator. It
matches RFC 8785 exactly on conformant JSON, but it doesn't reject the inputs
RFC 8785 rejects (non-finite numbers, lone surrogates). We'd rather say that out
loud than claim a conformance we don't enforce.

---

## 6/9

Signatures are Ed25519 over a fixed 12-field canonical payload: fixed field
order, ":" separators, no escaping, no normalization. Keys, signatures, and
digests are lowercase hexadecimal throughout.

---

## 7/9

Assertions carry a validity window (issuedAt / expiresAt). A verifier checks
the structure, the digest format and recomputation, the Ed25519 signature,
the receipt reference binding, and expiry — and rejects what fails.

---

## 8/9

Limitations, stated plainly:

- The reference attester is a TOY (engineId TOY-HSA-999, confidence 0.0 by
  design, no biometric or liveness data). It is NOT proof of human.
- Attester trust is an external deployment assumption.
- Known documented gaps (IA-2, IA-3) are disclosed in the frozen audits.

---

## 9/9

Frozen: tag cps-0002-0.1-draft, commit 1008e8f6f56767c52d3cdf45f6fe6318aa4772e8.

45/45 conformance · 27/27 interop · 173/173 across the full
continuity-protocol suite. CPS-0001 v1.0-RC1 remains untouched.

Draft protocol artifact. Independent review welcome.
