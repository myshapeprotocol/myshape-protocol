# MyShape Protocol

> **CPS-0001 v1.0-RC** — An engine-independent protocol object for continuity assertions.

[![CPS-0001](https://img.shields.io/badge/CPS-0001-v1.0--RC-gold)](https://myshape.com/research/notes/008-continuity-protocol-core)
[![npm](https://img.shields.io/badge/npm-@thecontinuitylab/myshape-red)](https://www.npmjs.com/package/@thecontinuitylab/myshape)
[![Tests](https://img.shields.io/badge/tests-192%20passed-brightgreen)](https://github.com/myshapeprotocol/myshape-protocol)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

Research by [The Continuity Lab](https://thecontinuitylab.org). MyShape is the first protocol implementation, maintained separately.

---

## What Is CPS-0001?

CPS-0001 defines the **Continuity Receipt** — a cryptographically verifiable statement that an observer collected sufficient evidence supporting the continuity of a subject over a bounded interval of time.

It is **engine-independent**. No sensor type, algorithm, or hardware requirement appears in the specification. A third party can build a completely different evidence engine and produce a valid receipt.

**The protocol standardizes the object, not the engine.**

## Implement It Yourself

→ **[IMPLEMENT.md](continuity-protocol/IMPLEMENT.md)** — Create a receipt in 1 hour. No MyShape. No IMU. No camera.

→ **[QUICKSTART.md](continuity-protocol/QUICKSTART.md)** — 10-minute getting started.

## The Closed Loop

```
Producer (any engine) → Continuity Receipt → Verifier (V₁-V₇) → Consumer Decision
```

| Component | What | File |
|:---|:---|:---|
| Reference Verifier | V₁-V₇, zero MyShape deps | [`reference-verifier/verifier.ts`](continuity-protocol/reference-verifier/verifier.ts) |
| HTTP Verifier Plugin | Express middleware, allow/deny + risk | [`verifier-plugin/`](continuity-protocol/verifier-plugin/) |
| Second Producer | Dummy engine — proves independence | [`second-producer/`](continuity-protocol/second-producer/) |
| JSON Schema | Schema-first validation | [`schemas/`](continuity-protocol/schemas/) |
| Test Vectors | 5 reference receipts | [`test-vectors/`](continuity-protocol/test-vectors/) |
| Conformance Suite | 23 assertions, 10 scenarios | [`conformance/`](continuity-protocol/conformance/) |

## We Don't Know If Anyone Needs This

CPS-0001 was published **before adoption evidence was available**. We are running structured discovery interviews to find out whether teams in robotics, XR, security, and AI agent frameworks encounter a real continuity problem.

→ **[Research Note: Why We Published Before Adoption](continuity-protocol/research/why-we-published-before-adoption.md)**

→ **[Discovery Survey](https://thecontinuitylab.org/lab/discovery-survey)** — 5 minutes. Pure research.

## Quick Install

```bash
npm install @thecontinuitylab/myshape
```

```typescript
import { verifyReceipt, buildReceipt } from "@thecontinuitylab/myshape";

const receipt = buildReceipt({ /* your evidence */ });
const result = await verifyReceipt(receipt);
// { status: "VALID" }
```

## Full Specification

[myshape.com/research/notes/008-continuity-protocol-core](https://myshape.com/research/notes/008-continuity-protocol-core)

## License

Apache 2.0. MyShape is the first implementation. The protocol is public.
