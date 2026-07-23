# 04 — Write Your Own Producer

The most valuable test of CPS-0001: implement a producer **without reading any MyShape engine code**.

A producer is any software that:

1. Collects evidence (any sensor, any algorithm)
2. Builds a Continuity Receipt
3. Signs it (or marks it as unsigned for demo)
4. Outputs valid JSON

---

## Challenge: 30-minute Producer

Can you generate a valid CPS-0001 receipt in 30 minutes using only:

- This onboarding guide
- The JSON Schema (`../continuity-protocol/schemas/continuity-receipt.schema.json`)
- The test vectors (`../continuity-protocol/test-vectors/`)
- The verifier (`../continuity-protocol/reference-verifier/verifier.ts`)

**Rules:**

- You may read the verifier source — it is protocol code, not engine code
- You may NOT read MyShape-specific engine code under `src/lib/evidence/`
- You may NOT read MyShape-specific API routes under `src/app/api/`
- You may NOT read MyShape-specific pages under `src/app/`

**Goal:**

```bash
# Your receipt passes the verifier
node verify-receipt.mjs    # → { status: "VALID" }

# Or via HTTP
curl -X POST https://myshape.org/api/verify-receipt -d @my-receipt.json
# → { "status": "VALID" }
```

---

## What counts as a valid producer?

### Level 1: Static receipt generator

A script that outputs a valid receipt JSON. No sensors needed. This proves you understand the schema.

**Example:** [examples/minimal-producer/generate.mjs](examples/minimal-producer/generate.mjs)

### Level 2: Sensor-backed producer

A script that reads real sensor data (webcam, microphone, accelerometer, gyroscope, network latency, keyboard timing — anything) and uses it as evidence payload.

This proves you can bind real-world observation to the protocol format.

### Level 3: Chained producer

A producer that accepts a previous receipt hash and links its output, forming a chronological chain.

---

## Where to start

```
examples/minimal-producer/
├── generate.mjs           # ← start here: your first producer
└── README.md              # walkthrough
```

---

## When you succeed

Open a PR, an issue, or just tag us:

```
https://github.com/myshapeprotocol/myshape-protocol
```

We will:

- List your implementation in the CPS-0001 README
- Cross-check your receipts against the conformance suite
- Add you as a reference implementation

**The first independent implementation is worth more to this project than any feature we could build.**

---

→ Next: [checklist.md](checklist.md)
