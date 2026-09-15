# What Continuity Is — and Is Not

**Audience**: Protocol engineers, security researchers, AI-agent infrastructure researchers.
**Purpose**: Make the Continuity hypothesis precise without overstating what the current protocol proves.
**Status**: Draft for external review — based on frozen CPS-0001 v1.0-RC1 and CPS-0002 `cps-hsa-0.1-draft`.
**Test counts (live-verified)**: 52 conformance + 39 interoperability = 91 passing.

---

## 1. Concepts — Questions, What MyShape Does, What It Does Not Prove

| Concept | Question it answers | What current MyShape protocol does | What it does NOT prove |
|---|---|---|---|
| **Identity** | Who is this entity? | Nothing. Protocol is engine- and identity-agnostic. | No identity binding, no person-binding, no organizational identity. Each keypair is a distinct identity by design. |
| **Integrity** | Has this data been tampered with? | CPS-0001: Ed25519 signature covers all 13 receipt fields. Any mutation invalidates signature. | Does not prove the *content* of evidence is true — only that the signed bytes are unchanged. |
| **Provenance** | Where did this data come from? | Nothing. Protocol is deliberately engine-agnostic. | No origin proof, no supply-chain tracing, no sensor attestation. |
| **Attestation** | Did a specific attester sign this assertion? | CPS-0002: Ed25519 signature from independent attester key, bound to CPS-0001 receipt hash, with 12-field canonical payload. | Does not prove attester is authorized, trustworthy, or human. |
| **Temporal validity** | Is this assertion within its validity window? | Both: bounded interval (CPS-0001) and assertion expiry (CPS-0002). Verifier checks `now` against window. | Does not prove *unbroken presence* — gaps between intervals are unprotected. |
| **Continuity** | Did the entity remain continuous across time/sessions/devices? | CPS-0001 produces a signed receipt from an observation process over a bounded interval. `previousReceiptHash` is **unsigned** in v1.0. | Does NOT prove causal continuity, entity continuity, or unbroken presence. Each receipt covers one bounded interval; there is no cryptographic chain. |
| **State integrity** | Was execution state preserved across migration? | Nothing. | No state integrity proof. Critical gap for AI agent use case. |
| **Authorization** | Is this entity allowed to perform this action? | Nothing. | Authorization is entirely outside protocol scope. |
| **Trust** | Should I trust this entity/assertion? | Nothing. `VALID ≠ TRUSTED` is explicit and enforced. | Trust is a decision made by the relying application, after cryptographic verification. |

## 2. Continuity as a Research Hypothesis

> **Continuity may represent an independent, verifiable trust primitive — distinct from identity, authentication, authorization, provenance, and attestation.**

This is a **hypothesis**, not an established fact. Continuity is **not** merely continuous data collection or a bounded observation interval. The question is not "was data collected without interruption?" but rather: **"Can observation B be legitimately related to observation A across time, despite gaps, device changes, or state transitions?"**

The claim is that "did this observation process produce a consistent signal over a bounded interval, as attested by a key?" captures something structurally different from "who is this?" or "is this caller allowed?". Continuity asks whether the *relationship between observations* across time is meaningful — not merely whether a single observation occurred.

The hypothesis remains open. It requires external scrutiny to determine whether the observed property is genuinely novel or decomposable into existing primitives.

---

## 3. What CPS-0001 Currently Contributes

CPS-0001 (frozen v1.0-RC1) is a **Self-Sovereign Continuity Assertion Protocol (SSCAP)**:

1. **Engine-agnostic receipt format**: Any sensor, algorithm, or hardware can produce a valid receipt. The protocol does not privilege any evidence engine.
2. **Cryptographic integrity**: 13-field canonical signing payload. Ed25519 signature covers all fields.
3. **Temporal bounding**: `interval.start < interval.end`; `signedAt ≥ end`; `end ≤ now`; `now < expiresAt`.
4. **Evidence digest binding**: `evidence[i].payloadDigest === SHA-256(evidence[i].payload)` — but the payload itself is opaque to the verifier.
5. **Independent verifiability**: Any party can verify without trusting the issuer.

**What CPS-0001 deliberately does NOT include**: entity-device binding, identity continuity across key rotation, state integrity, hardware attestation, or a cryptographic chain between receipts (`previousReceiptHash` is unsigned).

---

## 4. What CPS-0002 Currently Contributes

CPS-0002 (frozen core `cps-hsa-0.1-draft`, Trust Policy NOT frozen) adds a **receipt-bound attestation layer**:

1. **Additive layer**: References a CPS-0001 receipt by canonical hash (`SHA-256(JCS(receipt))`). Does not modify CPS-0001.
2. **Independent attester**: Separate attester key signs the assertion. Attester ≠ issuer in general.
3. **12-field canonical payload**: Schema-enforced with `additionalProperties: false`.
4. **Payload digest integrity**: `evidence.payloadDigest` independently recomputable (F7 fix, BATCH-0002-3-F8).
5. **Bounded validity window**: `issuedAt / expiresAt` checked at verify time (default 1 hour).
6. **Explicit trust separation**: `VALID` means structural + cryptographic validity only. Trust decisions are out of scope.

**What CPS-0002 deliberately does NOT include**: trusted attester registry, key rotation/revocation, audience field, multi-attester aggregation, privacy primitives, or any claim about biological humanity.

---

## 5. What Remains Unresolved

1. **No cryptographic chain**: `previousReceiptHash` is unsigned in CPS-0001 v1.0. Receipts are isolated observations, not a linked trajectory. Without a chain, "continuity" between receipts is a claim by the issuer, not a property verified by the protocol.

2. **Key rotation breaks continuity model**: A new key produces a new `attester.id`. There is no rotation-binding field. The most basic security operation produces a new "identity" and breaks the continuity assumption.

3. **No state integrity for AI agents**: The primary claimed use case (AI agent continuity) requires proof that execution state was preserved across runtime migrations. Neither CPS-0001 nor CPS-0002 provides this.

4. **Entity continuity ≠ key continuity**: The protocol proves key control over an interval. It does not prove that the same biological or organizational entity controlled the key throughout.

5. **Replay protection is incomplete**: Temporal bounds limit but do not eliminate replay within the validity window. "Single-use" and "universal replay protection" are NOT established.

---

## 6. Strongest Argument That Continuity Is NOT a Distinct Primitive

"Continuity" as implemented reduces to: **signed timestamp + key control + bounded observation interval**.

An equivalent system can be constructed with:
- Ed25519 signatures (for integrity)
- RFC 3161 timestamps (for temporal proof)
- A registry of attester public keys (for attestation)

If the protocol collapses to these existing primitives, the "continuity" framing may be a naming choice, not a novel contribution. The unsigned `previousReceiptHash` means there is no cryptographic continuity — only isolated signed observations.

---

## 7. Strongest Argument That Continuity MAY Be a Distinct Primitive

The **separation of cryptographic validity from trust decisions** (`VALID ≠ TRUSTED`) is genuine and enforceable. Most attestation systems conflate verification success with trust, leading to implicit trust escalation. MyShape forces the relying application to make an explicit, conscious trust decision.

Additionally, the **engine-agnostic attestation container** enables interoperability across heterogeneous evidence sources. Any sensor or algorithm can produce a verifiable assertion without the verifier understanding the evidence domain. This is a real interoperability contribution, even if the underlying primitives are not novel.

Whether these properties constitute a *distinct primitive* — or merely a well-designed combination of existing ones — is the open question.

---

## External-Review Question

> **Does Continuity represent a genuinely distinct, independently verifiable property, or can existing identity, attestation, provenance, integrity, state-integrity, and authorization mechanisms already provide the same property?**

---

*Sources: CPS-0001 v1.0-RC1 (frozen), CPS-0002 `cps-hsa-0.1-draft` (frozen core), `PROTOCOL_BOUNDARY.md`, `CPS-0002-VERIFIER-CONTRACT.md`, `CPS-0002-TRUST-POLICY.md`, `CPS-0002-THREAT-MODEL.md`.*

