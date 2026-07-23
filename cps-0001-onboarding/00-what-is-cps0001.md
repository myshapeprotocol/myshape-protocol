# CPS-0001 — Protocol Model

A Continuity Receipt has four layers:

```
┌─────────────────────────────────────────┐
│ ① Assertion — what is claimed           │
├─────────────────────────────────────────┤
│ ② Evidence — why it can be claimed      │
├─────────────────────────────────────────┤
│ ③ Context — when and under what terms   │
├─────────────────────────────────────────┤
│ ④ Signature — who issued it             │
└─────────────────────────────────────────┘
```

---

## ① Assertion

Three boolean claims, each with a confidence score:

| Assertion | Meaning |
|-----------|---------|
| `observationOccurred` | Evidence was collected from a physical source |
| `continuityMaintained` | The subject remained present throughout the interval |
| `receiptIntegrity` | The receipt has not been tampered with |

Assertions are the **what**. A consumer decides whether the confidence levels are sufficient for its use case.

## ② Evidence

One or more `EvidenceBlock` objects. Each block records:

- **engineId** — which engine produced it (e.g. `com.example.motion-detector`)
- **engineVersion** — semver of that engine
- **confidence** — engine's own confidence score [0, 1]
- **payload** — engine-specific data (opaque to the protocol)
- **payloadDigest** — SHA-256 of `JSON.stringify(payload)`

The protocol does NOT inspect payload content. It only verifies that the digest matches. This is the engine-independence guarantee.

## ③ Context

| Field | Meaning |
|-------|---------|
| `interval.start` | When evidence collection began |
| `interval.end` | When evidence collection ended |
| `interval.coverageMs` | Duration in milliseconds |
| `subject.id` | Opaque pseudonym for the observed entity |
| `expiresAt` | After this time, V₆ rejects the receipt |

## ④ Signature

| Field | Meaning |
|-------|---------|
| `issuer.id` | Who claims this receipt |
| `issuer.publicKey` | Public key for signature verification |
| `signature.algorithm` | Algorithm (e.g. Ed25519) |
| `signature.value` | Signature bytes (base64url) |
| `signature.signedAt` | When the signature was produced |

---

## Verification (V₁–V₇)

| Check | What it verifies |
|-------|------------------|
| V₁ | Schema validity — all required fields present and correct types |
| V₂ | Signature — cryptographic verification against issuer public key |
| V₃ | Assertion consistency — continuity implies observation |
| V₄ | Temporal consistency — timeline is coherent |
| V₅ | Evidence integrity — payloadDigest matches payload |
| V₆ | Freshness — receipt has not expired |
| V₇ | Predecessor chain — hash links to previous receipt |

V₂ requires external key material. V₇ requires a predecessor receipt.

All other checks are self-contained: they operate on the receipt alone.

---

## Key Design Properties

1. **Engine-independent.** The verifier never inspects payload content. Any engine that produces a valid receipt is compatible.
2. **Portable.** A receipt is a JSON object. It can be saved, transmitted, verified offline, or submitted to an HTTP gateway.
3. **Composable.** Receipts chain via `previousReceiptHash`, forming a chronological sequence.
4. **Transparent.** The verifier logic is ~200 lines of TypeScript with zero dependencies.

---

→ Next: [01-understand-receipt.md](01-understand-receipt.md)
