# Continuity Verification Becomes Programmable

## The Continuity Lab releases @thecontinuitylab/myshape v0.1.2

**July 2026**

---

The internet has protocols for identity, data, and value. It has never had a protocol for **continuity** — the property that a digital subject is the same physically embodied entity across time.

Today, that changes.

```bash
npm install @thecontinuitylab/myshape
```

```typescript
import { verifyContinuity } from "@thecontinuitylab/myshape";

const result = await verifyContinuity({
  imuSamples: deviceMotionEvents,    // required
  cameraSamples: videoMotionFrames,  // optional
});
// → { verdict, confidence, evidence }
```

**One function. Sensor data in → verification result out.**

---

## Why Continuity Matters Now

AI systems can now generate identities, conversations, images, and actions at scale. The next trust problem is no longer *"is this information authentic?"* — it is *"is this entity continuous?"*

This matters for:

- **AI agents** — was the agent at T₂ hijacked from the agent at T₁?
- **Decentralized governance** — is the entity voting now the same entity that voted before?
- **Remote systems** — is the surgeon at the console the same entity throughout the procedure?

---

## What This Is — and What It Is Not

`verifyContinuity()` introduces a new verification primitive: **continuity verification.**

It answers a question no other API asks:

> *Are you still the same entity, continuously, across time?*

| Traditional Identity | MyShape Continuity |
|---------------------|-------------------|
| Who are you? | Are you still the same entity? |
| Identity verification | Continuity verification |
| Static credentials | Temporal evidence chain |
| Snapshot | Trajectory |

It is not identity verification. It is not an authentication protocol. It does not answer "who are you?" — it answers "are you still you?"

---

## How It Works

| Layer | Evidence Engine | What It Checks |
|-------|----------------|----------------|
| Presence | EE-001 · Presence Entropy Engine | Is there an embodied entity? Human-generated motion entropy in IMU data |
| Events | EE-002 · Motion Event Binding Engine | Are there force onsets? Jerk peak detection via dynamic MAD threshold |
| Binding | EE-002 · Cross-Modal | Do camera and IMU see the same event? Matching within ±500ms |
| Continuity | RFC-0002 | Is the entity the same across time? Hash-chained evidence receipts |

---

## Built On

Validated through:

- **576 controlled experimental runs** across 4 independent evidence engines
- **2 open RFC specifications** (Motion Signature Format, Continuity Proof Format)
- **121 automated tests** in the reference implementation
- **MIT License** — use it, build on it, challenge it

---

## Roadmap

| Milestone | Status |
|-----------|--------|
| verifyContinuity() SDK | ✅ v0.1.2 |
| Challenge-response anti-spoof engine | 🔜 v0.2.0 |
| Cross-device continuity verification | 🔜 Design phase |
| External replication study | 🔜 Planned |
| ZK EvidenceReceipt | 🔜 Research |
| Rust implementation | 🔜 Planned |

---

## Call for Feedback

This is not a finished product. It is an open protocol in active development.

We invite:

- **Researchers** — reproduce our experiments. Challenge our RFCs.
- **Engineers** — build compatible verifiers from the RFCs. Submit issues.
- **Security practitioners** — break it. **We publish failures.**

---

*The Continuity Lab · thecontinuitylab.org · github.com/myshapeprotocol*
