# 01 — Understand the Receipt

Walk through a real `ContinuityReceipt` JSON.

## Minimal Receipt

```json
{
  "protocolVersion": "1.0",
  "receiptId": "0193a62e-7b11-74a8-9c3d-f1e2a3b4c5d6",
  "interval": {
    "start": "2026-12-01T10:00:00.000Z",
    "end": "2026-12-01T10:00:08.000Z",
    "coverageMs": 8000
  },
  "subject": {
    "id": "sha256:abcd1234efgh5678",
    "type": "embodied"
  },
  "evidence": [
    {
      "engineId": "com.example.simulation",
      "engineVersion": "1.0.0",
      "confidence": 0.85,
      "payload": { "score": 0.85 },
      "payloadDigest": "b53905ceb79fbeb9397fdbb2bba81b5ff224c65b2668bf6103e955a54dcae6d9"
    }
  ],
  "assertions": {
    "observationOccurred": { "value": true, "confidence": 0.95 },
    "continuityMaintained": { "value": true, "confidence": 0.85 },
    "receiptIntegrity": { "value": true, "confidence": 1.0 }
  },
  "expiresAt": "2026-12-01T10:05:08.000Z",
  "previousReceiptHash": null,
  "references": [],
  "issuer": {
    "id": "sha256:issuer001",
    "publicKey": "MCowBQYDK2VwAyEAabc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
  },
  "signature": {
    "algorithm": "Ed25519",
    "value": "iGy9Pq3KlxAbCdEfGhIjKlMnOpQrStUvWxYz0123456789...",
    "signedAt": "2026-12-01T10:00:08.000Z"
  }
}
```

## Walkthrough

### 1. What happened?
An observation occurred over 8 seconds (`coverageMs: 8000`). The engine `com.example.simulation` reported confidence `0.85`. The issuer signed it at the end of the interval.

### 2. What is claimed?
- `observationOccurred: true` — evidence was collected
- `continuityMaintained: true` — the subject stayed present
- `receiptIntegrity: true` — the receipt has integrity

### 3. What is opaque?
The `payload` field (`{ "score": 0.85 }`) is engine-specific. The verifier only checks that `payloadDigest` matches `SHA-256(JSON.stringify(payload))`. It never inspects the contents.

### 4. What is the chain?
`previousReceiptHash: null` means this is a **genesis receipt** — the first in its chain. A subsequent receipt would reference this one's hash.

### 5. What is the expiry?
`expiresAt` is 5 minutes after the interval end (standard policy). After this time, V₆ (freshness) rejects the receipt.

---

## Key Insight

The receipt is **not a record of what happened**. It is a **portable object** that a consumer can verify and make decisions about — regardless of which engine produced it.

Every field has a purpose in the verification pipeline. Nothing is decorative.

---

## See the real examples

```bash
# View the test vectors used by the conformance suite
cat ../continuity-protocol/test-vectors/valid-receipt-01.json
```

→ Next: [02-build-a-receipt.md](02-build-a-receipt.md)
