# Continuity Protocol

## Toward an Open Standard for Persistent Presence

**Research Infrastructure Grant Proposal**  
**Submitted to: Protocol Labs Research**  
**The Continuity Lab · July 2026**

---

> **Request:** Support the next 12 months of open protocol research.  
> **Deliverables:** RFCs, open datasets, reproducible benchmarks, reference implementations — public infrastructure for the entire decentralized ecosystem.

---

## 1. The Missing Internet Layer

The internet has protocols for identity (OAuth, DIDs), data (IPFS, HTTP), and value (Bitcoin, Ethereum).

It has **no protocol for continuity** — the property that a digital subject is the same physically embodied entity across time.

Just as no single company owns TCP/IP, no single company should own the protocol that proves persistent presence — for humans, for AI agents, and for the hybrid entities of the coming decade.

This grant funds exactly that: an open specification, reproducible benchmarks, independent implementations, and public datasets — infrastructure that benefits the entire decentralized ecosystem.

---

## 2. Why Continuity Matters Now

Three converging trends make continuity verification urgent:

1. **AI agents at scale.** When billions of autonomous agents interact, the question is no longer "who deployed this agent?" but "is this the same agent that was running 10 minutes ago?" Agent hijacking is undetectable by current identity protocols.

2. **Deepfakes defeating liveness.** Camera-based verification can be defeated by generated video. Continuity requires multiple sensor streams to converge on the same physical event — a higher bar than any single-channel check.

3. **Decentralized governance.** DAOs, DeFi protocols, and on-chain organizations assume that the entity voting at T₂ is the same entity that voted at T₁. Without continuity verification, this assumption is unenforceable.

The decentralized web has built identity, data, and value layers. It has not yet built the continuity layer. **Someone will. It should be built as open infrastructure.**

---

## 3. What We've Built

### Published Specifications

| RFC | Title | Status |
|-----|-------|--------|
| RFC-0001 | Motion Signature Format | Draft — implementable by any team |
| RFC-0002 | Continuity Proof Format | Draft — evidence receipts, CFC catalog, hash chaining |

### Experimental Evidence

| Engine | N | Pass Rate | Key Finding |
|--------|---|-----------|-------------|
| Presence detection | — | 100% floor | Living entities distinguishable from synthetic |
| Cross-modal causal coupling | 316 | 58% | **Temporal alignment 100%** across independent devices |
| Challenge-response | 200 | 59% | Randomized challenges defeat simple replay |
| Dual-engine pipeline | 60 | 93% | Escalation architecture reliable |
| **Total** | **576** | — | All data, diagnostics, and failures public |

### Negative Results (Published)

- **FD-001:** Higher frame rate decreased accuracy — more data ≠ better data
- **DL-001:** Direction asymmetry in gyroscope challenges — recorded, not acted upon
- **Tracker iteration:** 3 generations → 3× gain, temporal alignment 100% throughout

### Developer Surface

```typescript
import { verifyContinuity } from "myshape";
// One function. Sensor data in → verification result out.
// npm install myshape
```

| Resource | URL |
|----------|-----|
| GitHub | github.com/myshapeprotocol |
| Research Hub | myshape.com/research |
| Lab | thecontinuitylab.org |
| HuggingFace | huggingface.co/TheContinuityLab |

---

## 4. What This Grant Funds (12 Months)

### Public Deliverables

| Deliverable | Type | Timeline |
|-------------|------|----------|
| RFC-0001, RFC-0002 finalized | Internet-Draft | Month 1–3 |
| RFC-0003 (Verification API) | Specification | Month 3–6 |
| RFC-0004 (Cross-Device Binding) | Specification | Month 6–9 |
| Open Dataset v1 (576 runs) | HuggingFace | Month 2 |
| Reproducible Benchmark Suite | GitHub + CI | Month 4 |
| Rust Reference Implementation | Crate | Month 6–9 |
| Browser Reference Verifier | WASM demo | Month 9–12 |
| External Security Review | Audit report | Month 10 |
| Internet-Draft Submission | IETF/IRTF | Month 12 |

### Research Questions

1. Can cross-device continuity be measured with consumer hardware?
2. What is the minimum observation window for reliable presence detection?
3. Can an adversary synthesize causally self-consistent fake sensor streams?
4. Can an EvidenceReceipt be verified in zero-knowledge?

### What We Will NOT Do

- Build a paid product
- Create proprietary SDK features
- Pursue user growth metrics
- Write a business plan

**This is infrastructure research. The output is public goods.**

---

## 5. Why Continuity Should Be Open Infrastructure

**Continuity should not belong to any company.**

If a single company owns the protocol that verifies persistent presence, every entity that relies on it — every DAO, every DeFi protocol, every AI agent network — depends on that company's continued goodwill.

The alternative: an open specification, developed in public, with multiple independent implementations, peer-reviewed by the research community, and adopted as a voluntary standard.

This is how TCP/IP happened. This is how HTTP happened. This is how the decentralized web's next primitive should happen.

---

## 6. Budget

| Category | Year 1 | What It Produces |
|----------|--------|------------------|
| Research engineering | $40,000 | RFCs, test suites, reference implementations |
| Hardware + cloud | $15,000 | Test devices, compute, data storage |
| External security audit | $15,000 | Independent protocol review |
| Dataset curation + hosting | $10,000 | HuggingFace, benchmark CI |
| Community + publications | $10,000 | Workshop, submission fees, documentation |
| Operations | $10,000 | Legal, domains, admin |
| **Total** | **$100,000** | — |

All outputs published under MIT or CC0 license.

---

## 7. Impact on the Decentralized Ecosystem

| Ecosystem | Benefit |
|-----------|---------|
| IPFS / Filecoin | Continuity Proofs are content-addressable; can be stored and witnessed on the PL stack |
| Ethereum / L2s | On-chain verification of persistent presence for DAOs, DeFi, identity protocols |
| AI Agent networks | Agent continuity verification without centralized attestation |
| Research community | Open dataset + reproducible benchmark → anyone can build a compatible verifier |

---

## 8. Why Protocol Labs

Protocol Labs has funded the missing layers of the internet — content addressing, decentralized storage, peer-to-peer networking. Continuity is the next missing layer.

This is not a startup pitch. It is an infrastructure proposal. The Continuity Protocol is an open specification, developed in public, with multiple independent implementations planned, peer-reviewed by the research community, and adopted as a voluntary standard. Just like IPFS. Just like libp2p. Just like the protocols PL has supported from the beginning.

---

*The Continuity Lab · [thecontinuitylab.org](https://thecontinuitylab.org) · [github.com/myshapeprotocol](https://github.com/myshapeprotocol)*
