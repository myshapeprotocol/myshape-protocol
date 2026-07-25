# MyShape Protocol — Pitch v1

**The Continuity Lab · 2026-07-25**

---

## Slide 1: The Question

> What is continuity — and can it be made a verifiable property of digital existence?

Not "can we detect humans." Not "can we identify people."
A deeper question: **can we prove that a digital entity is the same entity across time?**

If this question has an answer, everything downstream changes — identity, security, trust, autonomy.
If it doesn't, we're building on sand.

---

## Slide 2: The Category

**Continuity Science** — a new category of cryptographic infrastructure.

| Category | Question | Era |
|----------|----------|-----|
| Search | What information exists? | 1998– |
| Social | Who do you know? | 2004– |
| Cloud | Where does your code run? | 2006– |
| Crypto | What value can you transfer? | 2009– |
| Foundation Models | What can AI generate? | 2020– |
| **Continuity** | **Are you still you?** | **2026–** |

Google defined Search. OpenAI is defining Foundation Models.
No one has defined Continuity. Yet.

---

## Slide 3: Why Now

Three converging trends:

1. **AI Agents are proliferating.** By 2027, autonomous agents will outnumber human users on most platforms. No protocol exists to verify that agent X at time T₂ is the same agent that was authorized at T₁.

2. **Deepfakes make static identity obsolete.** Faces, voices, fingerprints — all forgeable. Static biometrics are dying. Temporal evidence is the only defensible position.

3. **Zero-knowledge infrastructure is ready.** On-device processing + ZK proofs + Ed25519 = you can prove continuity without revealing identity. This was impossible five years ago.

---

## Slide 4: What We Built

**CPS-0001 — the first Continuity Protocol Standard.**

Not a product. Not a company. An open protocol.

| Layer | What | Status |
|-------|------|--------|
| Core Protocol | ContinuityReceipt object, V₁–V₇ verification, Ed25519 | ✅ v1.0-RC |
| Reference Verifier | Zero MyShape deps, 273 lines | ✅ |
| Test Vectors | 6 receipts (valid + invalid) | ✅ |
| Conformance Suite | 23 assertions, 10 scenarios | ✅ |
| npm SDK | `@thecontinuitylab/myshape` | ✅ Published |
| Benchmark Dataset | HuggingFace, CC0 | ✅ |
| External Implementers | Blind test recruiting | ⏳ In progress |

**The protocol is engine-independent.** No sensor requirement. No hardware requirement. Any team can implement.

---

## Slide 5: The Architecture

```
Layer 2: Application Profiles
  CPS-0001-H (Human) · CPS-0001-A (Agent) · CPS-0001-D (Device)

Layer 1: Domain Extensions
  AgentModelHash · DeviceState · FirmwareVersion · SessionContext

Layer 0: Core Protocol
  Receipt object · V₁–V₇ · Ed25519 · engine-independent
```

CPS-0001 does **not** define:
- What an entity is (human, agent, robot, device)
- How evidence is collected
- Whether a subject is alive or unique

It defines **how continuity evidence is represented and verified.** Nothing more.

---

## Slide 6: First Application Priority

| # | Application | Why |
|---|-------------|-----|
| 1 | **AI Agent Continuity** ⭐ | Fastest-growing entity type. Proving an agent model + config hasn't changed is unsolved. |
| 2 | Enterprise Session | IAM complement. Continuity drift = session hijack. |
| 3 | Robotics | Long-lived autonomous systems. Firmware integrity over time. |
| 4 | Human Presence | Original direction. Valid, but narrower than protocol scope. |

---

## Slide 7: The Moat

**CPS-0001's defensibility does not come from code. It comes from three properties:**

1. **Engine-independence.** Anyone can build a compatible engine. The protocol is the standard, not the implementation. Like TCP/IP — many stacks, one spec.

2. **Entity-type-agnostic design.** The protocol works for humans, agents, robots, and devices. Narrow protocols die when their industry shifts. CPS-0001 is designed to absorb new entity types without breaking.

3. **The question, not the answer.** The Continuity Lab doesn't claim to have solved continuity. It claims to have made it a falsifiable research question. If PES is wrong tomorrow, the question remains. The protocol remains.

---

## Slide 8: What We Need

| Need | Amount | For |
|------|--------|-----|
| Research grant | $30K–50K | 6–12 months of protocol development |
| External implementers | 3–5 | Validate engine-independence claim |
| First adopter | 1 | Prove real-world demand |
| Ethereum verifier contract | Build | Bridge to on-chain consumption |

---

## Slide 9: The Legacy

> The Continuity Lab helped the world ask a new scientific question.

If CPS-0001 succeeds, the internet gets a new trust primitive — a temporal layer between identity and execution.

Even if CPS-0001 fails as a specific implementation, the question it raised — *is continuity a verifiable property?* — will outlast any single project, company, or protocol.

The best outcome: ten years from now, researchers are still exploring the boundaries of this question — and they cite RN-001 as the paper that made it impossible to ignore.
