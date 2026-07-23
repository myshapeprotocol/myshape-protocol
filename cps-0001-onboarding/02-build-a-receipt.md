# 02 — Build a Receipt

Generate a valid CPS-0001 Continuity Receipt using a standalone script.

**Zero MyShape dependencies.** You only need Node.js 18+.

---

## Step 1: Create a script

Create `generate-receipt.mjs`:

```javascript
// generate-receipt.mjs — standalone CPS-0001 receipt generator
import crypto from "node:crypto";

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function createReceiptId() {
  const ts = Date.now().toString(16).padStart(12, "0");
  const rand = Array.from({ length: 20 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
  const hex = (ts + rand).slice(0, 32).padEnd(32, "0");
  return [
    hex.slice(0, 8), hex.slice(8, 12),
    "7" + hex.slice(13, 16),
    "8" + hex.slice(16, 19),
    hex.slice(19, 31),
  ].join("-");
}

// Your evidence payload — engine-specific, opaque to the protocol
const payload = {
  timestamp: new Date().toISOString(),
  motionScore: 0.72,
  sampleCount: 240,
};

const payloadDigest = sha256(JSON.stringify(payload));

const startTime = new Date(Date.now() - 8000);
const endTime = new Date();

const receipt = {
  protocolVersion: "1.0",
  receiptId: createReceiptId(),

  interval: {
    start: startTime.toISOString(),
    end: endTime.toISOString(),
    coverageMs: endTime.getTime() - startTime.getTime(),
  },

  subject: {
    id: "sha256:demo-" + sha256("demo-subject").slice(0, 16),
    type: "embodied",
  },

  evidence: [
    {
      engineId: "com.example.my-producer",
      engineVersion: "1.0.0",
      confidence: 0.72,
      payload,
      payloadDigest,
    },
  ],

  assertions: {
    observationOccurred: { value: true, confidence: 0.95 },
    continuityMaintained: { value: true, confidence: 0.72 },
    receiptIntegrity: { value: true, confidence: 1.0 },
  },

  expiresAt: new Date(endTime.getTime() + 300_000).toISOString(),
  previousReceiptHash: null,
  references: [],

  issuer: {
    id: "sha256:demo-issuer",
    publicKey: "demo-placeholder-unsigned",
  },

  signature: {
    algorithm: "unsigned",
    value: "cps-0001-demonstration",
    signedAt: endTime.toISOString(),
  },
};

// Save to file
import { writeFileSync } from "node:fs";
writeFileSync("my-receipt.json", JSON.stringify(receipt, null, 2));
console.log("Receipt saved to my-receipt.json");
console.log("receiptId:", receipt.receiptId);
console.log("evidence blocks:", receipt.evidence.length);
```

## Step 2: Run it

```bash
node generate-receipt.mjs
```

Output:

```
Receipt saved to my-receipt.json
receiptId: 0193a62e-7b11-74a8-a1b2-c3d4e5f6a7b8
evidence blocks: 1
```

## Step 3: Inspect the output

```bash
cat my-receipt.json
```

You should see a valid CPS-0001 receipt. The fields you filled in:

- `evidence[0].payload` — your engine-specific data (opaque to protocol)
- `evidence[0].payloadDigest` — SHA-256 of that payload
- `assertions` — what you claim based on your evidence
- `interval` — when it happened

Fields the receipt builder handled for you:

- `receiptId` — UUIDv7-like timestamp + random
- `expiresAt` — interval end + 5 minutes

---

## Step 4: Verify it's valid JSON

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('my-receipt.json','utf-8')).protocolVersion)"
```

Should print `1.0`.

---

You now have a CPS-0001 receipt. Next step: verify it.

→ Next: [03-run-verifier.md](03-run-verifier.md)
