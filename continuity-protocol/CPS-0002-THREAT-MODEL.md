# CPS-0002 — Prototype Threat Model

**Status**: PROTOTYPE — BATCH-0002-3-F8 (F7 payload digest integrity fix applied).

This document defines the threat model for the CPS-0002 Toy Attester and
Reference Verifier prototype. It is NOT a final protocol security specification.

---

## 0. Scope

This threat model covers the BATCH-0002-0 prototype:

- `cps-0002-assertion.schema.json`
- `cps-0002-toy-attester/src/index.ts` (Toy Attester)
- `cps-0002-toy-attester/verifier.ts` (Reference Verifier)
- `continuity-protocol/test-vectors/cps0002/human-signal-01.json`
- `continuity-protocol/conformance/cps0002-conformance.test.ts`

It does NOT cover:

- Production human-presence detectors
- Trusted attester registries
- On-chain anchoring
- Identity graph linking
- Multi-attester consensus
- Any future CPS-0002 extension beyond the prototype

---

## 1. System Model

```
  Human Subject
       |
       | (presence evidence — opaque to protocol)
       v
  CPS-0001 Receipt Issuer (any engine)
       |
       |  computeReceiptHash(receipt) -> SHA-256(JCS(receipt))
       v
  CPS-0001 Receipt Hash  <- referenced by CPS-0002
       |
       |  Toy Attester:
       |    1. Takes receipt hash as input
       |    2. Constructs CPS-0002 Assertion
       |    3. Canonicalizes -> 12-field payload
       |    4. Signs with Ed25519
       v
  CPS-0002 Human Signal Assertion (signed)
       |
              |  Reference Verifier:
       |    1. Validates schema (V1)
       |    2. Reconstructs canonical payload
       |    3. Verifies Ed25519 signature (V2)
       |    3.5 Verifies payload digest (V2.5)
       |    4. Verifies referenced receipt hash (V3)
       v
  Relying Application
```

### Entities

| Entity | Role | Trust Assumption |
|--------|------|-----------------|
| Human Subject | The biological entity whose presence is being attested | None — CPS-0002 does not verify humanity directly |
| CPS-0001 Receipt | Signed continuity assertion (frozen protocol) | Verified by V1-V7; NOT trusted for human truth |
| Receipt Hash | `SHA-256(JCS(receipt))` | Cryptographically binding to the receipt |
| CPS-0001 Issuer | Any entity holding an Ed25519 keypair | Proven by V2 signature check; NOT proven to be human |
| CPS-0002 Attester | Entity signing the Human Signal Assertion | Identified by `attester.publicKey`; NOT pre-trusted |
| CPS-0002 Verifier | Validates assertion structure + signature + receipt reference | MUST be deterministic and engine-independent |
| Relying Application | Consumes verification result for authorization | Makes final trust decision |
| Attacker | Adversarial entity seeking to bypass CPS-0002 checks | Unlimited computational resources unless bounded |

### Trust Boundaries

1. **Human Boundary**: Human subject is outside all cryptographic trust. CPS-0002 provides signals about human presence; it does not prove it.

2. **Receipt Boundary**: The CPS-0001 receipt is cryptographically self-contained. The verifier checks V1-V7 independently. The `previousReceiptHash` pointer is unsigned in v1.0.

3. **Attestation Boundary**: The CPS-0002 assertion is signed by the attester's Ed25519 key. The signature is deterministic: tampering any signed field invalidates it. The attester is NOT necessarily the human.

4. **Verifier Boundary**: The verifier validates structure, signature, and receipt-hash binding. It does NOT evaluate evidence quality, human authenticity, or liveness.

5. **Application Boundary**: The relying application makes the final authorization decision. Additional checks (biometric, device attestation, reputation) are OUTSIDE prototype scope.

---

## 2. Attacker Model

### Capabilities

The attacker can:

- Generate arbitrary Ed25519 keypairs
- Produce valid CPS-0001 receipts (with their own keypair)
- Produce valid CPS-0002 assertions (with their own keypair)
- Observe and replay previously-seen receipts and assertions
- Submit arbitrary JSON to the verifier
- Control timing of submissions

### Cannot do (protocol-bounded)

- Cannot forge a valid Ed25519 signature without the private key
- Cannot alter a signed field without invalidating the signature
- Cannot produce a valid receipt hash without the exact receipt bytes (JCS canonicalization)

### Attack Vectors

| Attack | Vector | Mitigated By | Status |
|--------|--------|-------------|--------|
| **Assertion replay** | Capture valid assertion, replay later | `validity.expiresAt` is signed; verifier checks freshness | Prototype-level |
| **Assertion payload tampering** | Modify `evidence.payload` after signing | V2.5 recomputes `SHA-256(UTF8(JCS(payload)))` and compares to signed `payloadDigest`; mismatch → `INVALID_PAYLOAD_DIGEST` | **RESOLVED by BATCH-0002-3-F8** |
| **Assertion tampering** | Modify an assertion field after signing | Ed25519 signature over 12-field canonical payload | Prototype-level |
| **Receipt substitution** | Swap the referenced CPS-0001 receipt | `reference.receiptHash` is signed; verifier recomputes hash | Partial |
| **Receipt-hash substitution** | Provide a different receipt that hashes to the claimed hash | SHA-256 pre-image resistance | Cryptographic |
| **Attester key compromise** | Attacker obtains attester's Ed25511 private key | Out of scope — requires key rotation policy | NOT YET DEFINED |
| **Attester impersonation** | Create an assertion with a different `attester.publicKey` | Signature verification fails | Cryptographic |
| **Stale assertion** | Use a valid but old assertion | `validity.expiresAt` check | Prototype-level |
| **Malicious verifier input** | Submit malformed JSON | Schema validation (V1) rejects malformed input | Prototype-level |
| **Forged CPS-0001 reference** | Reference a non-existent receipt | Hash mismatch — verifier cannot find matching receipt | Partial |
| **Evidence tampering** | Modify evidence inside a CPS-0001 receipt | CPS-0001 V5 checks `payloadDigest` | Via CPS-0001 |

---

## 3. Security Properties

### What the prototype establishes

1. **Structural integrity**: The assertion conforms to the CPS-0002 schema. All required fields are present and correctly typed, including a well-formed `payloadDigest` (64 lowercase hex).
2. **Signature validity**: The assertion was signed by the Ed25519 private key corresponding to `attester.publicKey`. Any modification to the 12 signed fields invalidates the signature.
3. **Payload digest integrity (V2.5)**: The verifier independently recomputes `SHA-256(UTF8(JCS(evidence.payload)))` and requires an exact match with the signed `evidence.payloadDigest` (field #9). An attacker cannot modify `evidence.payload` without causing `INVALID_PAYLOAD_DIGEST` — unless they recompute the digest and re-sign, which invalidates the original signature (`INVALID_SIGNATURE`).
4. **Receipt reference binding**: The assertion references a specific CPS-0001 receipt by its canonical hash (`SHA-256(JCS(receipt))`). The verifier can confirm that the referenced receipt hash matches a presented CPS-0001 receipt.
5. **Freshness**: The assertion includes `validity.issuedAt` and `validity.expiresAt`, both covered by the signature. Expired assertions are rejected.
6. **Independent verifiability**: The verifier relies on no hidden state. Given the assertion JSON and the referenced receipt, any independent implementation can reproduce the canonical payload and verify the signature.

### What the prototype does NOT establish

1. **NOT**: Human authenticity. The attester may have observed a human, a robot, or nothing at all.

2. **NOT**: Universal liveness. No challenge-response binds the assertion to a real-time human interaction.

3. **NOT**: Proof-of-human. Anyone can generate an Ed25519 keypair and act as an attester.

4. **NOT**: Universal anti-Sybil. No identity provider or biometric binding is enforced.

5. **NOT**: Evidence truth. The `evidence.payload` is opaque. The verifier checks `payloadDigest` integrity (F7 fix: V2.5 recomputation via `SHA-256(UTF8(JCS(payload)))`) but does NOT interpret payload content, evidence quality, or human authenticity.

6. **NOT**: Trusted attester. No registry of approved attesters exists. Any keypair can attest.

7. **NOT**: Receipt authenticity beyond CPS-0001. If the referenced CPS-0001 receipt passes V1-V7, that proves its signature is valid — not that the underlying evidence represents a human.

8. **NOT**: Causal ordering between receipt issuance and assertion issuance.

---

## 4. Semantic Boundary

```
CPS-0001 Receipt VALID
  └- Proves: signed attestation of continuity over an interval
  └- Does NOT prove: human authenticity, liveness, identity binding

CPS-0002 Assertion VALID (prototype)
  └- Proves: assertion was signed by the stated attester
  └- Proves: assertion references a specific CPS-0001 receipt hash
  └- Proves: assertion is within its validity window
  └- Proves: evidence.payload integrity (V2.5, F7 fix — SHA-256(UTF8(JCS(payload)))
    bound to signed payloadDigest; tampering detected as INVALID_PAYLOAD_DIGEST)
  └- Does NOT prove: human authenticity, liveness, identity binding
  └- Does NOT prove: the attester observed a real human
  └- Does NOT prove: the referenced CPS-0001 receipt represents real sensor data
```

The prototype's `VALID` means: "this assertion is structurally conformant and cryptographically signed by someone holding the stated attester key." It does NOT mean: "a human was present."

---

## 5. Open Questions (Prototype → Future)

| # | Question | Prototype Answer |
|---|----------|-----------------|
| Q1 | Who is allowed to attest? | Anyone with an Ed25519 keypair. Trusted Issuer Registry NOT defined. |
| Q2 | How to verify the referenced receipt exists? | Verifier requires receipt JSON alongside assertion. Trusted store NOT implemented. |
| Q3 | How to prevent replay across applications? | `validity.expiresAt` provides a time window. Cross-app nonce NOT implemented. |
| Q4 | How to handle attester key rotation/revocation? | Not addressed. Requires Trusted Issuer Registry (FUTURE). |
| Q5 | How to prevent the attester from lying about human presence? | Not addressed. Toy attester labels itself as TOY/PROTOTYPE. |
| Q6 | Can the assertion be embedded in a CPS-0001 receipt? | Technically possible via `references[]`, but not defined as embeddable. |
| Q7 | Should assertions be chained (like V7 predecessor)? | Not in prototype. Considered for future CPS-0002 revision. |

---

## 6. Assumptions

1. The CPS-0001 receipt hash function (`SHA-256(JCS(receipt))`) is frozen and correct (v1.0-RC1).
2. The Ed25519 signature scheme is secure (no quantum attacks assumed).
3. The canonical assertion payload (12 fields) is deterministic and reproducible by any implementation.
4. The payload digest rule `SHA-256(UTF8(JCS(evidence.payload)))` (RFC 8785) is deterministic and reproducible by any implementation (cross-language verified).
4. The relying application will NOT treat a VALID CPS-0002 assertion as proof of human presence for high-stakes decisions.
5. The toy attester's evidence payload (`TOY-HSA-999`, confidence = 0.0) signals non-human evidence.

---

## 7. Residual Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Attester key compromise | Medium | High | Key rotation policy (FUTURE) |
| Assertion replay within validity window | High | Low | Short validity window (1 hour default) |
| Receipt not found / not presented | Medium | Medium | Verifier requires receipt presentation |
| Misinterpretation of "VALID" | High | High | Explicit labeling in schema, docs, verifier output |
| Hash collision | Negligible | Critical | SHA-256 pre-image resistance |

---

*Document: `continuity-protocol/CPS-0002-THREAT-MODEL.md` — Part of the Continuity Protocol Project — 2026-08-29*