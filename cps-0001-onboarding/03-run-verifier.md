# 03 — Run the Verifier

Verify your receipt against the CPS-0001 Reference Verifier.

**The verifier is engine-independent.** It does not inspect payload content. It only checks that the receipt conforms to the protocol.

---

## Option A: Use the reference implementation (Node.js)

Clone the repo:

```bash
git clone https://github.com/myshapeprotocol/myshape-protocol.git
cd myshape-protocol
npm install
```

Copy your receipt into the project root, then run the verifier:

```javascript
// verify-receipt.mjs
import { readFileSync } from "node:fs";

// Import the verifier (TypeScript source, works via tsx or compile first)
// For a quick test, use the built conformance suite:

// 1. Place your receipt as continuity-protocol/test-vectors/valid-receipt-01.json
// 2. Run conformance tests:
//    npx vitest run continuity-protocol/conformance/
```

Or run the existing conformance suite to confirm the verifier works:

```bash
npx vitest run continuity-protocol/conformance/
```

Expected output:

```
✓ CONFORMANCE-01: valid receipt (single engine)
✓ CONFORMANCE-02: valid receipt (chained, multi-engine)
✓ CONFORMANCE-03: expired receipt
✓ CONFORMANCE-04: tampered evidence
✓ CONFORMANCE-05: broken predecessor chain
✓ CONFORMANCE-06: inconsistent assertions
✓ CONFORMANCE-07: invalid schema
✓ CONFORMANCE-08: opaque evidence payload
✓ CONFORMANCE-09: genesis receipt
✓ CONFORMANCE-10: multi-engine evidence

 Test Files  1 passed (1)
      Tests  23 passed (23)
```

## Option B: Implement V₁ yourself (~20 lines)

The simplest verification check is V₁ (schema validity). Here it is in any language:

```python
# verify_v1.py — minimal schema check
import json

receipt = json.load(open("my-receipt.json"))

errors = []
if receipt.get("protocolVersion") != "1.0":
    errors.append("protocolVersion must be '1.0'")
if not receipt.get("receiptId"):
    errors.append("receiptId is required")
if not receipt.get("interval", {}).get("start"):
    errors.append("interval.start is required")
if not receipt.get("interval", {}).get("end"):
    errors.append("interval.end is required")
if not receipt.get("evidence"):
    errors.append("at least one evidence block required")
if not receipt.get("assertions", {}).get("observationOccurred"):
    errors.append("assertions.observationOccurred is required")
if not receipt.get("issuer", {}).get("id"):
    errors.append("issuer.id is required")
if not receipt.get("signature", {}).get("algorithm"):
    errors.append("signature.algorithm is required")

if errors:
    print("V₁ FAIL:")
    for e in errors:
        print(f"  ✗ {e}")
else:
    print("V₁ PASS")
```

Run it:

```bash
python verify_v1.py
```

This is the protocol's design: the verifier is simple enough to implement in any language.

## Option C: HTTP API

If the demo server is running, you can also verify via the HTTP gateway:

```bash
curl -X POST https://myshape.org/api/verify-receipt \
  -H "Content-Type: application/json" \
  -d @my-receipt.json
```

Response:

```json
{
  "status": "VALID",
  "risk": 0.05,
  "receiptId": "0193a62e-7b11-74a8-a1b2-c3d4e5f6a7b8",
  "verifiedAt": "2026-12-01T10:00:10.000Z"
}
```

---

## What did you just prove?

You generated a receipt **without MyShape engine code** and verified it with an **independent verifier**. This is the core CPS-0001 claim: the protocol object is separable from any implementation.

```
Your Code → Receipt → Reference Verifier → VALID
                ↑                          ↑
         engine-independent          engine-independent
```

→ Next: [04-write-your-own-producer.md](04-write-your-own-producer.md)
