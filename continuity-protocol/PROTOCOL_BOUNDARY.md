# CPS-0001 Protocol Boundary

**Applies to**: CPS-0001 v1.0-RC1 and later (frozen spec)

## What the Protocol Proves

When a Continuity Receipt passes V₁–V₇ verification:

| Claim | Proven? | Mechanism |
|---|---|---|
| **Authenticity** | ✅ YES | Receipt was signed by the Ed25519 private key corresponding to the stated `issuer.publicKey` |
| **Signature Integrity** | ✅ YES | All 13 fields in `canonicalSigningPayload` are covered; any mutation invalidates signature |
| **Temporal Validity** | ✅ YES | `interval.start < interval.end`; `signedAt ≥ end`; `end ≤ now`; `coverageMs === end - start`; `now < expiresAt` |
| **Evidence Integrity** | ✅ YES | Each `evidence[i].payloadDigest === SHA-256(evidence[i].payload)` |
| **Assertion Consistency** | ✅ YES | `observationOccurred.value === false` ⟹ `continuityMaintained.value === false` |

## What the Protocol Does NOT Prove

| Claim | Proven? | Why Not |
|---|---|---|
| **Evidence Truth** | ❌ NO | The verifier does not interpret `evidence.payload`. Any data (real sensor readings, synthetic input, no input) can produce a valid receipt. |
| **Biological Signal** | ❌ NO | No liveness detection. A robotic script generating synthetic motion data produces identical receipts. |
| **Human Identity** | ❌ NO | No physiological template, keystroke dynamics, or person-binding proof exists in the protocol. |
| **Proof-of-Human** | ❌ NO | Anyone can generate an Ed25519 keypair. The protocol proves control of a key, not humanity. |
| **Proof-of-Liveness** | ❌ NO | No challenge-response mechanism ties the receipt to real-time human interaction. |
| **Universal Anti-Sybil** | ❌ NO | Key generation is permissionless. Multiple accounts/keys per human are trivial. |
| **Third-Party Attestation** | ❌ NO | Receipts are self-asserted. No CA, no identity provider, no trusted third party. |
| **Continuity of the Person** | ❌ NO | The protocol proves continuity of the *signal collection process*, not continuity of the biological entity behind it. |

## Semantic Classification

> **CPS-0001 = Self-Sovereign Continuity Assertion Protocol (SSCAP)**

It is a **cryptographic integrity + temporal bounding** layer, not a **human authenticity** or **identity proof** system.

### Trust Model

```
Issuer (key holds) → signs → Continuity Receipt → Verifier checks V₁-V₇ → Consumer decision
                                                       ↑
                                          Protocol validates STRUCTURE & TIMELINE
                                          Evidence & Assertion truth = out of scope
```

### What "VALID" means

A receipt returning `VALID` from `verifyReceipt()`:

- The signature covers all signed fields
- The temporal constraints are satisfied
- The evidence digests match their payloads
- The assertions are internally consistent

**It does NOT mean**:
- The evidence represents real human behavior
- The subject is biologically present
- The issuer is who they claim to be to any external authority
- The receipt proves anything about the real world beyond "someone with this key made this assertion"

## Security Boundary

| Scenario | Protocol Handles? | Notes |
|---|---|---|
| Receipt tampering (any signed field) | ✅ YES | INVALID_SIGNATURE |
| Receipt reuse (replay) | ✅ YES | Temporal + freshness window |
| Forged signature | ✅ YES | Ed25519 |
| Malformed timestamp | ✅ YES | TEMPORAL_INCONSISTENCY |
| Future interval | ✅ YES | TEMPORAL_INCONSISTENCY |
| Fake evidence (synthetic data) | ❌ NO | Same as real evidence — protocol is evidence-agnostic |
| Bot-generated motion | ❌ NO | Same as human motion — protocol is engine-agnostic |
| Multiple identities per person | ❌ NO | Each keypair is a separate identity by design |

## Protocol Versioning

- **v1.0**: Frozen. This boundary document applies.
- Future versions (e.g., v2.0 with human-binding proofs) will be **separate protocol versions** with explicit breaking changes.
- Backward-compatible additions must not change the V₁–V₇ semantics or the canonical signing payload.

## Consumer Guidance

Systems consuming CPS-0001 receipts must layer additional trust mechanisms for:

- Human authenticity (e.g., device attestation, physiological-signal attestation)
- Anti-Sybil enforcement (e.g., identity verification, account binding)
- Evidence quality assessment (domain-specific evidence interpretation)

**CPS-0001 alone is insufficient for production security decisions requiring human authenticity.**
