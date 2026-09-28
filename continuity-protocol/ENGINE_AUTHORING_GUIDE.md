# CPS-0001 Engine Authoring Guide

**If you can produce an EvidenceBlock, you already support CPS-0001.**

---

## 1. What CPS-0001 Is

CPS-0001 is an **evidence container protocol**. It does not care:

- What sensor you use
- What algorithm you run
- What data format your payload has
- Whether your evidence is about a human, a machine, or a weather station

It cares about exactly one thing: **can your evidence be independently verified?**

### 1.1 Protocol Boundary (READ THIS)

**The Verifier validates protocol conformance, not evidence quality.**

A valid Receipt may contain weak, meaningless, or experimental evidence. The interpretation of that evidence belongs to the issuing Engine and the consuming application — not to CPS-0001 itself.

| Engine | Meaningful Evidence | Real Sensor | Valid Receipt |
|:---|:---|:---|:---|
| PES (EE-001) | ✅ | ✅ | ✅ |
| Toy (EE-999) | ❌ | ❌ | ✅ |
| Broken (missing field) | N/A | N/A | ❌ |
| Wrong Digest | N/A | N/A | ❌ |
| Wrong Signature | N/A | N/A | ❌ |
| Expired | N/A | N/A | ❌ |

`VALID` does not mean `TRUE`. It means the Receipt conforms to the protocol. The Consumer decides whether the evidence inside is sufficient for authorization.

This is not a bug. This is the core design principle of CPS-0001.

---

## 2. What an Engine Does

An Engine is any piece of code that:

1. **Collects observations** (from sensors, APIs, computations, anything)
2. **Produces a confidence score** (0–1, how confident are you in this evidence?)
3. **Serializes its findings** into an opaque payload
4. **Computes a hash** of that payload (SHA-256)
5. **Outputs an EvidenceBlock**

That's it. Five steps. No more.

---

## 3. What an Engine Does NOT Do

An Engine must NOT:

- **Make authorization decisions.** "Allow" or "Deny" is the Consumer's job.
- **Assign protocol verdicts.** "PASS" or "FAIL" belongs to the Verifier.
- **Know anything about other Engines.** Each Engine is independent.
- **Depend on MyShape.** You can write an Engine in any language, using any library. Zero MyShape imports required.

The Engine is the most replaceable part of the system. That's by design.

---

## 4. The EvidenceBlock (Protocol Object)

This is your output. Everything else is implementation detail.

```typescript
interface EvidenceBlock {
  engineId:      string;                   // e.g. "EE-010"
  engineVersion: string;                   // semver, e.g. "1.0.0"
  confidence:    number;                   // [0, 1]
  payload:       Record<string, unknown>;  // YOUR data — opaque to the protocol
  payloadDigest: string;                   // SHA-256 hex of JSON.stringify(payload)
}
```

**The protocol never inspects `payload`.** It only checks that `payloadDigest` matches.

---

## 5. Step-by-Step: Build Your Engine

### Step 1: Collect Observations

```
Read sensor → rawData
```

This can be anything. A thermometer. An IMU. A random number generator. A database query. The protocol doesn't know and doesn't care.

### Step 2: Produce Confidence

```
rawData → confidence (number 0–1)
```

How you compute this is entirely your business. The protocol only requires that it's a number between 0 and 1. If you can't produce a meaningful confidence score, use `0.5` as a neutral default.

### Step 3: Serialize Payload

```
rawData → payload (Record<string, unknown>)
```

Put whatever you want in here. Structure it however makes sense for your domain. The protocol treats it as opaque bytes.

Example:
```json
{
  "temperature": 23.7,
  "pressure": 1013.2,
  "challenge": "0xdeadbeef",
  "readings": [23.7, 23.8, 23.6, 23.9, 23.7]
}
```

### Step 4: Compute Digest

```
payload → SHA-256 → payloadDigest (64-char hex string)
```

```
payloadDigest = SHA-256(JSON.stringify(payload))
```

Any SHA-256 implementation works. We recommend `@noble/hashes` (JavaScript), Python's `hashlib`, Go's `crypto/sha256`, or your platform's equivalent.

**Important:** Always use the same JSON serialization order. If your JSON library produces different key orderings, sort keys first.

### Step 5: Output EvidenceBlock

```typescript
const evidenceBlock: EvidenceBlock = {
  engineId: "EE-010",
  engineVersion: "1.0.0",
  confidence: 0.81,
  payload,
  payloadDigest: sha256Hex(JSON.stringify(payload)),
};
```

You're done. This EvidenceBlock can now be placed into a CPS-0001 ContinuityReceipt.

---

## 6. Protocol Requirements (What You MUST Do)

| Requirement | Details |
|:---|:---|
| `evidenceBlock` shape | Must match the interface above |
| `payloadDigest` | Must be SHA-256 of `JSON.stringify(payload)` |
| `confidence` | Must be a number in [0, 1] |
| `engineId` | Must be a non-empty string unique to your Engine |
| `engineVersion` | Must be valid semver |

## 7. Protocol Freedoms (What You May Do)

| Freedom | Details |
|:---|:---|
| Any programming language | Python, Rust, Go, JS, C, anything |
| Any sensor | Or no sensor at all |
| Any algorithm | Statistical, ML, heuristic, random |
| Any payload shape | As long as it's JSON-serializable |
| Any confidence model | Continuous, binary, external lookup |
| Zero MyShape dependencies | The protocol is defined by JSON Schema, not by code |

---

## 8. Testing Your Engine

The simplest way to verify your Engine produces valid EvidenceBlocks:

### Option A: Use the Reference Verifier

```bash
# 1. Build a Receipt containing your EvidenceBlock
# 2. POST it to the verification endpoint
curl -X POST http://localhost:3001/api/verify-receipt \
  -H "Content-Type: application/json" \
  -d @your-receipt.json
```

Expected output: `{"status":"VALID",...}` or `{"status":"INVALID","reason":"..."}`.

### Option B: Use the JSON Schema

```bash
# Validate your Receipt against the CPS-0001 schema
npx ajv validate -s continuity-protocol/schemas/continuity-receipt.schema.json \
  -d your-receipt.json
```

### Option C: Cross-Implementation Test

Build a Receipt with your Engine. Verify it against BOTH reference implementations:
- `continuity-protocol/reference-verifier/verifier.ts` (Web Crypto)
- `continuity-protocol/second-producer/noble-verifier.ts` (@noble/hashes)

If both return `VALID`, your Engine is CPS-0001 compatible.

---

## 9. Complete Example: Toy Engine

See `continuity-protocol/second-producer/toy-engine.ts` for a working example.

The Toy Engine:
- Takes a challenge string as input
- Returns a deterministic confidence score
- Has no sensor, no ML, no human data
- Proves that CPS-0001 does not care what evidence looks like

Line count: ~30 lines.

---

## 10. Frequently Asked Questions

**Q: Can my confidence always be 1.0?**
A: Yes, but the Verifier may combine it with other evidence. A fixed 1.0 reduces your Engine's usefulness but doesn't break the protocol.

**Q: Can my payload be empty?**
A: Yes. `payload: {}` is valid. The digest will be `SHA-256("{}")`.

**Q: Do I need to generate receipts myself?**
A: No. The Receipt assembler (`buildReceipt`) is available in the reference implementations. You only need to produce EvidenceBlocks.

**Q: Can I write this in [language]?**
A: Yes. The protocol is defined by JSON Schema. Any language that can produce JSON and SHA-256 can implement it.

**Q: What if I disagree with the confidence scoring?**
A: Your Engine, your rules. The protocol imposes no confidence model. Two different Engines measuring the same thing can report different confidences. The Consumer decides how to weight them.

---

## 11. Next Steps

1. Read the [CPS-0001 Specification](../CPS0001.md) — the canonical normative source
2. Study the [Toy Engine](./second-producer/toy-engine.ts) (~30 lines)
3. Study the [PES Engine](../src/engine/presence-entropy.ts) (real-world example)
4. Build your own Engine
5. Test against the [Reference Verifier](./reference-verifier/verifier.ts)
6. Submit feedback or issues

**If you can produce an EvidenceBlock, you already support CPS-0001.**

---

*Version 1.0 · 2026-07-24 · Part of the Continuity Protocol Project*
