# Implement CPS-0001 in One Hour

**You don't need MyShape. You don't need IMU sensors. You don't need a camera.**

You need a hash function, a JSON parser, and this document.

---

## What You're Building

```
Your Engine (any sensor, any algorithm)
        ↓
Continuity Receipt (CPS-0001 JSON object)
        ↓
Verifier (V₁–V₆ checks)
        ↓
PASS ✓
```

At the end, you will have produced a receipt from your own engine and verified it against the CPS-0001 specification — without reading a single line of MyShape source code.

---

## Step 0 — Prerequisites (5 min)

You need:

| Tool | Why |
|:---|:---|
| A programming language | Any language with JSON + SHA-256 |
| A text editor | To write your receipt producer |
| This document | The only specification you need |

**Optional but helpful:**

```bash
npm install ajv          # JSON Schema validator (any language works)
npm install vitest       # To run the conformance suite (optional)
```

---

## Step 1 — Understand the Receipt Structure (10 min)

A Continuity Receipt has **12 top-level groups/fields** organized into **4 groups** (signing input is a separate 13-slot canonical payload — see CPS0001 Annex N-1):

```
ContinuityReceipt
├── Assertion   — what is claimed
│   ├── protocolVersion    "1.0"
│   ├── assertions         { observationOccurred, continuityMaintained, receiptIntegrity }
│   └── verdict?           PASS | FAIL | INSUFFICIENT_EVIDENCE (optional)
│
├── Evidence    — why it is believed
│   └── evidence[]         Array of { engineId, engineVersion, confidence, payload, payloadDigest }
│
├── Context     — when / where / subject
│   ├── receiptId          UUIDv7 string
│   ├── interval           { start, end, coverageMs }
│   ├── subject            { id, type? }
│   └── expiresAt?         ISO 8601 (optional)
│
├── Composability — links to other receipts
│   ├── previousReceiptHash  string | null
│   └── references           string[]
│
└── Signature   — who claims it
    ├── issuer             { id, publicKey }
    └── signature          { algorithm, value, signedAt }
```

**Key principle:** `evidence.payload` is YOUR business. The protocol does not interpret it. Put anything you want in there — IMU data, mouse movements, keystroke timing, robot encoder readings. The verifier only checks that `payloadDigest` matches `SHA-256(UTF-8(JSON.stringify(payload)))` (V5 track, ECMAScript enumeration order — see CPS0001 Annex N-2; NOT JCS).

> Normative oracle scope: this pseudocode covers V1,V3–V6. V2 (Ed25519 over the 13-slot payload, CPS0001 Annex N-1) and V7 (store-backed, Model 3) are enforced by the normative oracles: main (`src/lib/evidence/cps0001.ts`) + trusted ChainStore = full V1–V7; CLI (`continuity-protocol/cli/bin/cps-verify.mjs`) = V1–V6. The reference-verifier file is a V1,V3–V6 helper only.

---

## Step 2 — Create Your First Receipt (15 min)

We'll use TypeScript for the example. Adapt to your language.

### 2.1 Build an Evidence Block

```typescript
// YOUR evidence. Any data. Any sensor.
const myPayload = {
  source: "my-first-engine",
  confidence: 0.85,
  note: "This could be IMU data, keystroke timing, mouse movement — anything.",
  timestamp: new Date().toISOString(),
};

// Compute the payload digest — SHA-256 of the JSON payload
const payloadJson = JSON.stringify(myPayload);
const payloadDigest = await sha256(payloadJson); // → 64-char hex string
```

### 2.2 Build the Interval

```typescript
const end = new Date();
const start = new Date(end.getTime() - 8000); // 8 seconds ago

const interval = {
  start: start.toISOString(),
  end: end.toISOString(),
  coverageMs: 8000, // MUST equal end - start
};
```

### 2.3 Build the Assertions

```typescript
const assertions = {
  observationOccurred:  { value: true, confidence: 0.95 },
  continuityMaintained: { value: true, confidence: 0.85 },
  receiptIntegrity:     { value: true, confidence: 1.0  },
};
```

### 2.4 Build the Subject Reference

```typescript
const subject = {
  id: "sha256:" + await sha256("my-device-stable-identifier"),
  type: "embodied", // optional hint
};
```

### 2.5 Assemble the Receipt

```typescript
const unsignedReceipt = {
  protocolVersion: "1.0",
  receiptId: generateUUIDv7(),       // any UUIDv7 implementation
  interval,
  subject,
  evidence: [{
    engineId: "com.example.myengine",
    engineVersion: "1.0.0",
    confidence: 0.85,
    payload: myPayload,
    payloadDigest,
  }],
  assertions,
  verdict: "PASS",                    // your engine's decision
  previousReceiptHash: null,          // null = genesis receipt
  references: [],
  issuer: {
    id: "sha256:" + await sha256("my-issuer-public-key"),
    publicKey: "MCowBQYDK2VwAyEA...",  // your public key (base64url)
  },
};
```

### 2.6 Sign It

```typescript
// Real implementations use Ed25519. For this exercise, we'll self-sign.
const receipt = {
  ...unsignedReceipt,
  signature: {
    algorithm: "Ed25519",
    value: "<your-ed25519-signature-of-unsignedReceipt>",
    signedAt: new Date().toISOString(), // MUST be >= interval.end
  },
};
```

**✅ Checkpoint:** You have a complete Continuity Receipt JSON object. Save it as `my-first-receipt.json`.

---

## Step 3 — Verify Your Receipt (15 min)

Now run the verification. You only need the receipt — not your engine, not your sensor data.

### 3.1 The Seven Verification Steps

The verifier checks these, in order. The first failure terminates verification.

| Step | Check | What It Catches |
|:---|:---|:---|
| **V₁** | Schema validity | Missing fields, wrong types, invalid protocol version |
| **V₂** | Signature validity | Forged or missing signature (requires issuer public key) |
| **V₃** | Assertion consistency | "Continuity=true" without "observation=true" |
| **V₄** | Temporal consistency | start ≥ end, coverageMs mismatch, signed before end |
| **V₅** | Evidence integrity | payloadDigest ≠ SHA-256(payload) — evidence tampered |
| **V₆** | Freshness | Current time > expiresAt |
| **V₇** | Predecessor reference | previousReceiptHash ≠ SHA-256(actual predecessor) |

### 3.2 Implement the Verifier (pseudocode)

```typescript
async function verifyReceipt(receipt): Promise<"VALID" | Error> {

  // V₁ — Schema
  if (receipt.protocolVersion !== "1.0")          return "INVALID_SCHEMA";
  if (!receipt.receiptId)                          return "INVALID_SCHEMA";
  if (!receipt.interval?.start || !receipt.interval?.end) return "INVALID_SCHEMA";
  if (receipt.interval.coverageMs <= 0)            return "INVALID_SCHEMA";
  if (!receipt.subject?.id)                        return "INVALID_SCHEMA";
  if (!Array.isArray(receipt.evidence))            return "INVALID_SCHEMA";
  if (!receipt.assertions)                         return "INVALID_SCHEMA";
  if (!receipt.issuer?.id || !receipt.issuer?.publicKey) return "INVALID_SCHEMA";

  // V₂ — Signature (deferred: requires crypto.subtle.verify)
  // Implement this with your language's Ed25519 library

  // V₃ — Assertion consistency
  if (receipt.assertions.continuityMaintained.value &&
      !receipt.assertions.observationOccurred.value) {
    return "INCONSISTENT_ASSERTIONS";
  }

  // V₄ — Temporal consistency
  const start = new Date(receipt.interval.start).getTime();
  const end   = new Date(receipt.interval.end).getTime();
  if (start >= end)                                return "TEMPORAL_INCONSISTENCY";
  if (receipt.interval.coverageMs !== end - start) return "TEMPORAL_INCONSISTENCY";
  const signedAt = new Date(receipt.signature.signedAt).getTime();
  if (signedAt < end)                              return "TEMPORAL_INCONSISTENCY";

  // V₅ — Evidence integrity
  for (const block of receipt.evidence) {
    const computed = await sha256(JSON.stringify(block.payload));
    if (computed !== block.payloadDigest)           return "EVIDENCE_TAMPERED";
  }

  // V₆ — Freshness
  if (receipt.expiresAt) {
    if (Date.now() >= new Date(receipt.expiresAt).getTime()) return "EXPIRED";
  }

  // V₇ — Predecessor reference (requires predecessor receipt)
  // Implement when chaining receipts

  return "VALID";
}
```

### 3.3 Run It

```typescript
const result = await verifyReceipt(receipt);
console.log(result); // → "VALID" ✓
```

**✅ Checkpoint:** Your self-produced receipt passes V₁–V₆ verification. You have implemented CPS-0001.

---

## Step 4 — Validate Against the Official Schema (5 min)

```bash
# Download the schema (or copy from continuity-protocol/schemas/)
curl -O https://raw.githubusercontent.com/myshapeprotocol/myshape-protocol/master/continuity-protocol/schemas/continuity-receipt.schema.json

# Validate your receipt
npx ajv validate -s continuity-receipt.schema.json -d my-first-receipt.json
# → "my-first-receipt.json is valid" ✓
```

---

## Step 5 — Run the Conformance Suite (5 min)

```bash
git clone https://github.com/myshapeprotocol/myshape-protocol.git
cd myshape-protocol
npm install
npx vitest run continuity-protocol/conformance/
```

Your verifier should pass the same 23 assertions. If it does, you are CPS-0001 conformant.

---

## Step 6 — Share Your Receipt (5 min)

Serialize it to a base64url-encoded HTTP header:

```typescript
const header = Buffer.from(JSON.stringify(receipt)).toString("base64url");
// → "eyJwcm90b2NvbFZlcnNpb24iOiIxLjAi..."

// Send it with any HTTP request:
fetch("https://your-api.example.com/sensitive", {
  headers: { "X-Continuity-Receipt": header },
});
```

The receiving API gateway runs the same verifier. It doesn't know what engine you used. It doesn't need to. It just checks V₁–V₆ and says allow/deny.

---

## You Did It

You produced a CPS-0001 receipt from your own engine and verified it — without reading MyShape source code.

| What proved what | |
|:---|:---|
| Your engine produced a receipt | Producer independence |
| The verifier accepted it | Engine independence |
| You never imported MyShape SDK | Protocol ≠ implementation |
| The conformance suite passed | CPS-0001 compatibility |

**This is the protocol working.** Not because MyShape says so. Because you implemented it.

---

## What Now

- [ ] Share your receipt with another developer and ask them to verify it
- [ ] Implement the HTTP plugin (continuity-protocol/verifier-plugin/) in your language
- [ ] Build a receipt that chains to a previous one (set `previousReceiptHash`)
- [ ] Tell us you did it: `github.com/myshapeprotocol/myshape-protocol/issues`

---

## Files You Never Needed

- ❌ `src/engine/` — MyShape engine code
- ❌ `src/sdk/` — MyShape SDK
- ❌ `src/lib/evidence/` — MyShape evidence types
- ❌ IMU, camera, PES, MediaPipe, EE-001 — any sensor or algorithm

## Files You Actually Needed

- ✅ This document
- ✅ `continuity-receipt.schema.json`
- ✅ A SHA-256 implementation
- ✅ A JSON parser
