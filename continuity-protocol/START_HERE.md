# CPS-0001: Build Your Own Producer

**Goal: write code in any language that produces a valid CPS-0001 Continuity Receipt.**

Time estimate: 30–90 minutes. You only need SHA-256 and Ed25519 (available in every language's standard library or one install away).

---

## What You're Building

```
Your Code → EvidenceBlock → Receipt → cps-verify → ✅ VALID
```

## What You Need

1. This directory (`continuity-protocol/`)
2. SHA-256 implementation
3. Ed25519 implementation

No MyShape code. No sensor hardware. No special knowledge.

---

## Step 1: Read the Spec (5–15 min)

**The canonical normative specification is [`../CPS0001.md`](../CPS0001.md)** — the
repository-root file. Read it top to bottom; the key object is `ContinuityReceipt`.

Do **not** look for a spec inside this directory: there is no
`continuity-protocol/CPS0001.md`. The verification contract (V₁–V₇ with its
conditions and failure codes) is in the root file's
*Normative Rules and Failure Codes (V₁–V₇)* section, and the canonical signing
payload is in its Annex N-1.

## Step 2: Understand the Interface (5 min)

Read `ENGINE_AUTHORING_GUIDE.md`. The only thing YOUR code must produce is:

```json
{
  "engineId": "your-engine-id",
  "engineVersion": "1.0.0",
  "confidence": 0.8,
  "payload": { ... },
  "payloadDigest": "<SHA-256 of JSON.stringify(payload)>"
}
```

That's an EvidenceBlock. Everything else (Receipt assembly, signing, verification) is protocol plumbing — you can use the test script below as a template.

## Step 3: Look at an Example (10 min)

Three examples exist, deliberately different:

| | PES Engine | Agent Trace Engine | Toy Engine |
|:---|:---|:---|:---|
| File | `src/engine/presence-entropy.ts` | `second-producer/agent-trace-engine.ts` | `second-producer/toy-engine.ts` |
| Domain | Human motion | Software execution | Arbitrary text |
| Sensor | Camera/IMU | Log file | None |
| Data | 33-point skeleton | System snapshots | Text string |
| Meaningful? | ✅ | ✅ | ❌ |
| Lines | ~300 | ~100 | ~30 |

**Start with the Toy Engine.** It's 30 lines and proves the protocol doesn't care what evidence is. Then look at Agent Trace for a second real example — no hardware needed.

## Step 4: Build Your Engine (30 min)

Pick any idea. Examples:
- Keyboard typing rhythm
- Mouse movement pattern
- Microphone audio entropy
- System uptime + load average
- Weather station readings
- SQL query to a public dataset
- Random number generator with a seed

Your Engine must:
1. Accept some input
2. Compute a confidence score [0, 1]
3. Output an EvidenceBlock

## Step 5: Generate a Receipt (15 min)

Use `onboarding-test.mjs` as a template. It shows the complete pipeline:
- Generate keypair (Ed25519)
- Build unsigned receipt from your EvidenceBlock
- Sign it
- Verify locally

```bash
node continuity-protocol/onboarding-test.mjs
```

## Step 6: Verify (30 sec)

```bash
cd continuity-protocol/cli && npm install
node bin/cps-verify.mjs your-receipt.json
```

Expected output — this CLI is **receipt-local (V₁–V₆ only; it does not evaluate V₇)**:
```
✅ V₁ Schema Validity
✅ V₂ Cryptographic Signature
✅ V₃ Assertion Consistency
✅ V₄ Temporal Consistency
✅ V₅ Evidence Integrity
✅ V₆ Freshness
  [V₇] Predecessor reference: NOT EVALUATED (no predecessor context)
VERDICT: ✅ VALID          ← exit 0
```

For a chained receipt (`previousReceiptHash !== null`) the CLI prints
`VERDICT: ⚠️  INCOMPLETE` and exits `3`, because CPS-0001 V₇ applies but this tool has
no predecessor context. `INCOMPLETE` is a tool status, not a protocol verdict and not
a CPS-0001 failureCode. For the normative contract and the V₇ rules, read
[`../CPS0001.md`](../CPS0001.md) — the CLI is not a conformance oracle.

---

## If You Get Stuck

Test vectors for debugging:
```
test-vectors/valid/single-engine.json   ← known-good
test-vectors/valid/multi-engine.json    ← 2 engines
test-vectors/invalid/tampered-evidence.json ← payload modified
test-vectors/invalid/expired.json       ← past expiration
```

Run `cps-verify` against the valid ones first to confirm the tool works, then test your own.

---

## What This Proves

When your receipt passes verification, it proves:

- Your Engine can produce evidence in a standard format
- Your receipt is structurally valid
- Your cryptographic signature is correct
- Your evidence integrity is verified

**It does not prove your evidence is "true."** The protocol validates form, not content. Whether the evidence is sufficient for any real-world decision is the consumer's responsibility.

---

*Part of the Continuity Protocol Project · 2026-07-24*
