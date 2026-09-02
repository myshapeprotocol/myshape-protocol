# CPS-0002 — Human Signal Assertion (Conceptual Foundation)

**Status**: PROTOTYPE PHASE COMPLETE — CONCEPT NOT FROZEN. The Minimum Viable Prototype (BATCH-0002-0) is implemented and passing conformance. This document defines the *problem boundary* for CPS-0002 and establishes what must NOT change in CPS-0001. It is **not** frozen and **not** final.

---

## 1. Why CPS-0001 Must Freeze First

CPS-0001 v1.0-RC1 has successfully proven:

- ✅ Cryptographic integrity of structured temporal assertions
- ✅ Cross-implementation independence (toy engine ↔ MyShape ↔ reference verifier)
- ✅ Engine-agnostic evidence binding

But it has an explicit, documented boundary:

> **CPS-0001 does not prove evidence truth, human authenticity, or liveness.**

> "signed attestation of continuity over an interval." CPS-0002 must answer the next question that naturally arises:

> **If anyone can generate a valid CPS-0001 receipt — including a robot — what additional protocol layer can bind a receipt to human presence, and do so in a way that is composable with the existing engine-agnostic model?**

---

## 2. The Problem CPS-0002 Must Solve

| Dimension | CPS-0001 Answer | CPS-0002 Question |
|---|---|---|
| Signal source | Any engine, any sensor | How do we know the signal came from a human, not a script? |
| Assertion truth | Self-asserted, signed | Who or what attests to the assertion's correspondence with reality? |
| Identity binding | Ed25519 keypair (permissionless) | How do we bind a keypair to a human without centralized identity providers? |
| Trust composition | Consumer layers trust above | Can a higher-protocol reference be standardized across engines/consumers? |

CPS-0001 is the **integrity substrate**. CPS-0002 must be the **human-binding substrate**. These must remain *orthogonal*:

- CPS-0002 references a CPS-0001 receipt by hash
- CPS-0002 does **not** redefine V₁–V₇
- CPS-0002 does **not** change the canonical signing payload
- CPS-0002 is **additive**, not **replacement**

---

## 3. Design Constraints

### Hard Constraints (inherited from CPS-0001 freeze)

1. **Protocol orthogonality**: Any change to V₁–V₇, signing payload, or temporal semantics is forbidden.
2. **Engine agnosticism**: CPS-0002 must not re-introduce hard dependencies on MyShape engine, IMU, camera, or any specific sensor.
3. **Composability**: A CPS-0002 attestation must be embeddable in or referenceable from a CPS-0001 receipt without breaking existing verifiers.
4. **Backward compatibility**: All existing CPS-0001 receipts must remain verifiable.

### Soft Constraints (design space)

1. **On-chain anchoring** (Stellar/Soroban) is allowed but not required — must remain optional.
2. **Trusted attester model** is permitted, but the trust model (who is trusted, how they're identified) must be parameterized, not hardcoded.
3. **Client-side key management** follows the same non-extractable CryptoKey pattern established in CPS-0001 Batch-2D.
4. **Liveness mechanism** (challenge-response, physiological-signal proof, device attestation) must be pluggable, not prescriptive.

---

## 4. CPS-0002 Problem Spaces (Non-Exhaustive)

### 4.1 Human-Presence Attestation
**Problem**: Bind a keypair to a real human-in-the-loop at a point in time.
**Open questions**:
- Is challenge-response (server issues nonce, client proves human solved it) sufficient?
- Does on-device physiological-signal proof (Face ID, Touch ID) compose with the engine-agnostic model?
- How to handle device attestation (SafetyNet, Apple DeviceCheck) without excluding all platforms?

### 4.2 Trusted Issuer Registry
**Problem**: Who is allowed to issue human-presence attestations?
**Model**: A registry of trusted attester keys, similar to the Stellar anchor list.
**Open questions**:
- Is the registry on-chain (transparent, globally consistent) or off-chain (fast, updatable)?
- How to handle attester revocation / rotation?
- Does this re-introduce centralization concerns?

### 4.3 Evidence Quality Scoring
**Problem**: CPS-0001 evidence is agnostic — any payload validates. How to signal "this evidence is higher quality"?
**Approach**: A **verifier-side scoring** model, not an issuer-side commitment. The issuer attaches metadata; the verifier assigns quality weights.
**Open questions**:
- Does this belong in CPS-0002 or in application-layer consumer policy?
- How to standardize scoring without re-coupling to evidence types?

### 4.4 Identity Graph Binding
**Problem**: Link multiple CPS-0001 receipts to a single human subject across devices/sessions.
**Model**: Decentralized identifiers (DIDs) or a similar self-sovereign identity primitive.
**Open questions**:
- Does CPS-0002 inherit DIDs or define its own linking protocol?
- How to handle correlation privacy (preventing a verifier from linking all of a human's activity)?

---

## 5. What CPS-0002 Is NOT

| Claim | Why Not |
|---|---|
| A replacement for CPS-0001 | CPS-0001's integrity layer is proven and frozen |
| A proof-of-human protocol by itself | "Human" is not binary; CPS-0002 provides binding signals, not universal truth |
| A universal anti-Sybil | Even with human-binding, multi-account per person is possible |
| Engine-coupled | Must preserve engine-agnosticism |
| Centralized | The registry model must support decentralization |

---

## 6. Bridging to Ecosystem (Season 2 Alignment)

This document is the **first external input** for Season 2's "Independent Implementation Challenge."

The Season 2 North Star (`first independent receipt / first valid external receipt`) now has a follow-on:

> **North Star 2: `first CPS-0002-compatible human-signal attestation / first cross-engine proof-of-presence`**

CPS-0002 will follow the same "Implement in One Hour" pattern as CPS-0001's `IMPLEMENT.md`:
- Publish a **standalone schema** (`cps-0002-assertion.schema.json`)
- Ship a **toy attester** (`continuity-protocol/cps-0002-toy-attester/`)
- Provide a **reference verifier** for the assertion (independent of MyShape)
- Offer a **conformance suite** with deterministic challenge vectors

---

## 7. Relationship to Stellar Integration

The Stellar anchor integration mentioned in Season 2 planning is **one realization** of CPS-0002's Trusted Issuer Registry — but it is not the definition. CPS-0002 must support:

- On-chain anchoring (Stellar)
- Off-chain attestation (any signed JSON)
- Hybrid models (anchored hash referencing off-chain full assertion)

This keeps the door open for alternative blockchains, centralized attesters, or peer-to-peer trust networks.

---

## 8. Next Steps (Conceptual)

1. **CPS-0001 v1.0-RC1** — release candidate, 30-day review
2. **Community discovery** — gather friction reports from independent implementers
3. **CPS-0002 problem definition** — refine sections 4.1–4.4 above based on field feedback
4. **CPS-0002 prototype** — ✅ DONE (BATCH-0002-0): toy attester + reference verifier + schema + conformance suite implemented and passing. See `cps-0002-toy-attester/`, `test-vectors/cps0002/`, `conformance/cps0002-conformance.test.ts`, `CPS-0002-THREAT-MODEL.md`, `IMPLEMENT-CPS-0002.md`
5. **Season 2 execution** — run the "first human-signal attestation" challenge

---

## 9. Explicit Non-Modification Clause

Any CPS-0002 development **MUST NOT** under any circumstance:

- Modify `canonicalSigningPayload` in `cps0001.ts`
- Modify the V₁–V₇ verifier chain
- Change the `continuity-receipt.schema.json` versioning
- Alter or remove any CPS-0001 conformance test vector

CPS-0002 is, by definition, a **layer above** and **orthogonal to** the frozen CPS-0001 protocol.