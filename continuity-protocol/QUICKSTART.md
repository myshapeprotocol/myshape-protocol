# CPS-0001 Quick Start

**Create a Continuity Receipt in 10 minutes. Verify it. No MyShape required.**

---

## 1. Create a Receipt

You don't need MyShape. You don't need IMU. You don't need a camera. You need any evidence engine — even a trivial one.

```typescript
import { buildReceipt, computePayloadDigest } from "./reference-verifier/verifier";

// Your evidence engine produces data — any data
const myEvidence = { score: 0.85, method: "my-sensor" };
const payloadDigest = await computePayloadDigest(myEvidence);

const unsigned = buildReceipt({
  evidence: [{
    engineId: "com.mycompany.myengine",
    engineVersion: "1.0.0",
    confidence: 0.85,
    payload: myEvidence,
    payloadDigest,
  }],
  interval: {
    start: new Date(Date.now() - 8000).toISOString(),
    end: new Date().toISOString(),
    coverageMs: 8000,
  },
  subject: { id: "sha256:abc123...", type: "embodied" },
  issuer: { id: "my-issuer-001", publicKey: "<64 lowercase hex chars: raw 32-byte Ed25519 key>" },
});

// Sign it (real implementations use Ed25519)
const receipt = {
  ...unsigned,
  signature: {
    algorithm: "Ed25519",
    value: "<your-signature-here>",
    signedAt: new Date().toISOString(),
  },
};
```

**That's it.** You've produced a CPS-0001 receipt.

## 2. Verify It

```typescript
import { verifyReceipt } from "./reference-verifier/verifier";

const result = await verifyReceipt(receipt);

if (result.status === "VALID") {
  console.log("Receipt verified. Trust the session.");
} else {
  console.log(`Verification failed: ${result.reason}`);
}
```

## 3. Use the HTTP Plugin

```typescript
import { serializeReceiptHeader } from "./verifier-plugin";

const header = serializeReceiptHeader(receipt);
// → "eyJwcm90b2NvbFZlcnNpb24iOiIxLjAi..."

// Send with any HTTP request:
fetch("https://api.example.com/sensitive", {
  headers: { "X-Continuity-Receipt": header },
});
```

## 4. Validate Against the Schema

```bash
# Install a JSON Schema validator
npm install ajv

# Validate your receipt
npx ajv validate -s schemas/continuity-receipt.schema.json -d your-receipt.json
```

## 5. Run the Conformance Suite

```bash
npx vitest run continuity-protocol/conformance/
```

If your receipt passes the same 23 assertions, you implement CPS-0001.

## 6. Compatibility

| Your Engine | What You Need | What You Don't Need |
|:---|:---|:---|
| Any sensor, any algorithm | CPS-0001 receipt structure + SHA-256 | MyShape, IMU, PES, EE-001 |

## Files You Need

```
continuity-protocol/
├── reference-verifier/verifier.ts   ← Types + V₁,V₃–V₆ helper (V₇ hash-only)
├── schemas/continuity-receipt.schema.json
├── test-vectors/                    ← Reference receipts
└── conformance/                     ← Test suite
```

**No MyShape SDK. No engine code. No npm install beyond vitest.**
