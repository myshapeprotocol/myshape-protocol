# CPS-0001 Onboarding — Start Here

**Expected time:** 30 minutes
**What you need:** Node.js 18+ (or Python 3.9+) and a text editor.

---

## What is CPS-0001?

CPS-0001 defines a **portable object** — the Continuity Receipt — that allows systems to exchange evidence of continuity across time.

It is:

- **An object model** — not an algorithm, not an SDK, not a service
- **Engine-independent** — any sensor, any device, any team can produce a valid receipt
- **Verifiable** — a receipt passes or fails V₁–V₇ regardless of who produced it

It is not:

- An identity system ("this is who you are")
- A MyShape product — MyShape is the *first implementation*, not the protocol

---

## Today's Goal

```
Generate a valid Continuity Receipt → Verify it → Receive VALID
```

You will:

1. Read what a receipt is (5 min)
2. Build a minimal receipt (10 min)
3. Run the reference verifier (5 min)
4. Optionally write your own producer (10 min)

**No MyShape source code required. No IMU sensors required. No phone required.**

---

## Files in this directory

| File | What it covers |
|------|----------------|
| `00-what-is-cps0001.md` | The protocol model — assertions, evidence, context, signature |
| `01-understand-receipt.md` | Walk through a real receipt JSON |
| `02-build-a-receipt.md` | Generate a receipt with a script |
| `03-run-verifier.md` | Run V₁–V₇ against your receipt |
| `04-write-your-own-producer.md` | Implement a compatible producer from scratch |
| `examples/` | Reference files — minimal receipt, producer, verifier |
| `checklist.md` | Track your progress |

---

## Why does this exist?

We (The Continuity Lab) built CPS-0001 and the first reference implementation. To know whether this is a real protocol or just our own data format, we need **independent implementations**.

If you can implement CPS-0001 without reading our engine code, the protocol works.

If you get stuck, the protocol has a gap.

There is no pitch. No funding ask. Just a protocol object and a verifier.

→ Next: [00-what-is-cps0001.md](00-what-is-cps0001.md)
