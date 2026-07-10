# The Continuity Lab

> **Investigating whether continuity can become a verifiable property of digital existence.**
>
> We publish the MyShape Protocol — a sovereign continuity layer for the simulation age.
> Motion-signature verification. Zero-knowledge presence. AI-native identity.
>
> 📄 **[Research Note #001 — The Continuity Problem](https://www.myshape.com/research/notes/001-the-continuity-problem)**

[![Protocol Status](https://img.shields.io/badge/Protocol_Activity-v2.0_Genesis-22d3ee?style=flat)](https://www.myshape.com)
[![Spec Version](https://img.shields.io/badge/Spec-v1.0__GENESIS-6e7681?style=flat)](https://www.myshape.com/papers/technical-spec)
[![Genesis Cohort](https://img.shields.io/badge/Genesis_Cohort-0/100-58a6ff?style=flat)](https://www.myshape.com/genesis)
[![Build](https://img.shields.io/badge/build-81_pages_|_309_tests-22d3ee?style=flat)](https://github.com/myshapeprotocol)
[![Research](https://img.shields.io/badge/Research-Open_for_Peer_Review-3fb950?style=flat)](https://www.myshape.com/research)
[![SEO](https://img.shields.io/badge/SEO-7_schema_types_|_21_essays-8957e5?style=flat)](https://www.myshape.com)
[![Substack](https://img.shields.io/badge/Substack-The_Entropy_Gap-ff6600?style=flat)](https://open.substack.com/pub/myshape/p/the-entropy-gap-why-ai-cannot-forge)
[![Paragraph](https://img.shields.io/badge/Paragraph-On--Chain_Post-8b5cf6?style=flat)](https://paragraph.com/@myshape/the-entropy-gap-%E2%80%94-why-ai-cannot-forge-human-motion)

---

## Overview

The Continuity Lab investigates whether continuity — the unbroken chain of sovereign existence — can be made a verifiable cryptographic primitive. The MyShape Protocol is our first publication: a continuity layer for digital identity that verifies not just who you are, but that you are still you, continuously.

In an era where AI can generate faces, clone voices, and forge fingerprints, static identity verification is broken. MyShape introduces **Proof of Continuity**: a cryptographic primitive anchored in the irreducible entropy of human motion.

```
Camera → MediaPipe Pose (33-pt) → SST Topology (18-pt)
       → 4D PES Engine (128-dim Motion Vector)
       → ZK-SNARK Proof (~250 bytes)
       → Continuity Proof verified on-chain
```

**All processing is on-device. Zero raw data leaves your device. ZK-Presence proves you are human without surveillance.**

---

## Quick Links

| Resource | URL |
|:---|:---|
| 🌐 **Website** | [myshape.com](https://www.myshape.com) |
| 📖 **Protocol Log (Blog)** | [myshape.com/blog](https://www.myshape.com/blog) |
| 🔬 **Motion Demo (Live)** | [myshape.com/motion-demo](https://www.myshape.com/motion-demo) |
| 📊 **Protocol Comparison** | [myshape.com/compare](https://www.myshape.com/compare) |
| 📚 **Glossary (30 terms)** | [myshape.com/glossary](https://www.myshape.com/glossary) |
| 📄 **Whitepaper** | [myshape.com/whitepaper](https://www.myshape.com/whitepaper) |
| 🔧 **Developer Docs** | [myshape.com/developers](https://www.myshape.com/developers) |
| 🤖 **AI Agent Registration** | [myshape.com/agent](https://www.myshape.com/agent) |

### Featured Essays

- [**What Is Proof of Continuity?**](https://www.myshape.com/blog/what-is-proof-of-continuity) — The missing primitive for the Agent Economy
- [**What Is Decentralized Identity? (2026 Guide)**](https://www.myshape.com/blog/what-is-decentralized-identity-2026) — DID, SSI, VCs, PoP, PoC explained
- [**Zero-Knowledge Proofs Explained**](https://www.myshape.com/blog/zero-knowledge-proofs-digital-identity-explained) — What ZK means for digital identity
- [**Motion vs Biometrics**](https://www.myshape.com/blog/motion-vs-biometrics-why-your-face-is-not-a-password) — Why your face is not a password
- [**Proof of Personhood vs Proof of Continuity**](https://www.myshape.com/blog/proof-of-personhood-vs-proof-of-continuity) — Two problems, two protocols
- [**AI Agent Identity**](https://www.myshape.com/blog/ai-agent-identity-how-autonomous-agents-prove-who-they-are) — How autonomous agents prove who they are

---

## Core Concepts

### Motion-Signature
A 128-dimensional vector extracted from real-time 3D pose sequences across four independent feature groups (kinematics, acceleration, jerk, jerk spectrum). AI cannot simulate this due to three hard mathematical limits: the Nyquist limit, depth ambiguity, and the entropy gap theorem.

### Presence Entropy Score (PES)
A 0-100 score quantifying the biological entropy in motion across four dimensions: micro-timing variance, noise residual, frequency entropy, and biological perturbation. Human motion consistently scores 70+. AI-generated motion scores below 20.

### Proof of Continuity
A cryptographic attestation that a digital subject has maintained unbroken sovereignty across time. Three primitives: Presence Receipts → Entropy Transformation → State-Chain Evolution.

### ZK-Presence
A zero-knowledge proof (~250 bytes, <10ms verification) that proves "a human is physically generating authentic motion" without revealing identity, appearance, or raw motion data.

### Genesis Cohort
The 100 founding nodes that form the protocol's root entropy source. Permanent tier. Never offered again.

---

## SEO / GEO Infrastructure

The website implements a comprehensive Schema.org semantic layer for both traditional search engines and AI crawlers:

| Schema Type | Pages | Purpose |
|:---|:---|:---|
| Organization + WebSite + DefinedTermSet | Root layout | Brand entity + knowledge graph |
| Article / BlogPosting | 21 essays + 5 papers + whitepaper | Content indexing + AI citation |
| BreadcrumbList | 25+ pages | SERP rich results + crawl hierarchy |
| FAQPage | Homepage, Genesis, Motion Demo, Developers, Compare | Google FAQ rich results + AI Overviews |
| HowTo | Genesis page | Step-by-step rich results |
| SoftwareApplication | Developers page | Developer tool discovery |
| Speakable | Homepage | Voice search eligibility |

**AI Crawler Access**: `robots.txt` explicitly allows GPTBot, Claude-Web, PerplexityBot, and 7 other AI crawlers. `llms.txt` and `llms-full.txt` provide structured data for LLM consumption.

---

## Technical Architecture

### Stack

| Layer | Technology | Version |
|:---|:---|:---|
| Framework | Next.js App Router | 16.x |
| UI | React + Tailwind CSS | 19.x / 4.x |
| 3D | Three.js + @react-three/fiber | 0.182 / 9.x |
| Motion | MediaPipe Pose | latest |
| Backend | Supabase (PostgreSQL + Realtime) | 2.x |
| Email | Resend | 6.x |
| Crypto | @noble/hashes + @noble/curves | 2.x |
| TypeScript | strict mode | 5.x |

### Protocol Data Model

```
protocol_nodes
├── email              TEXT (PK)     — Node identifier
├── node_handle        TEXT          — Genesis handle
├── status             TEXT          — SUBSCRIBED | PENDING_VERIFICATION | ACTIVE | GENESIS_NODE | AGENT_ACTIVE
├── scan_count         INTEGER       — Cumulative verifications
├── created_at         TIMESTAMPTZ   — Registration timestamp

Identity Lifecycle:
  SUBSCRIBED → PENDING_VERIFICATION → ACTIVE (or GENESIS_NODE if < 100)
                                    → AGENT_ACTIVE (AI agents)
```

---

## API Reference

### Identity & Verification
| Endpoint | Method | Description |
|:---|:---|:---|
| `/api/send-otp` | POST | Send 6-digit OTP |
| `/api/verify-otp` | POST | Verify OTP, activate node |
| `/api/auth/siwe` | POST | Sign-In with Ethereum (wallet binding) |
| `/api/subscribe` | POST | Join waitlist |

### Motion & Presence
| `/api/verify` | POST | WASM presence verification |
| `/api/motion/record` | POST | Record successful scan (3/day limit) |
| `/api/research/upload` | POST | Anonymous landmark ingestion |

### Node & Network
| `/api/nodes/count` | GET | Node statistics |
| `/api/nodes/genesis` | GET | Genesis Cohort (anonymized) |
| `/api/presence/network` | GET | Live network visualization data |
| `/api/node/privileges?email=` | GET | Node tier, entropy, PES |

### Agent Identity
| `/api/agent/declare` | POST | AI agent identity declaration |

### Matrix (Cross-Platform Publishing)
| `/api/matrix/publish` | POST | Publish to Bluesky, X/Twitter, LinkedIn, Farcaster, Discord, Telegram, Reddit |

Full OpenAPI 3.0 spec: [myshape.com/openapi.json](https://www.myshape.com/openapi.json)

---

## Development

```bash
npm install
npm run dev        # → http://localhost:3000
npm run build      # production build (81 pages)
npm test           # Vitest (309 tests, 100 suites)
```

### Required Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
RESEND_API_KEY=re_...
```

---

## Brand Compliance

All code, copy, metadata follows de-corporealized identity language:

| ✅ Use | ❌ Never Use |
|:---|:---|
| entity, agent, silhouette | gendered identifiers |
| wireframe anatomy, data-outline | biological signifiers |
| ethereal data energy, particle body | aesthetic judgments |
| motion-signature, kinetic verification | profile images, avatars |
| non-binary aesthetic, non-corporeal | traditional ID verification |

Pre-commit hooks enforce these rules automatically.

---

## Research

**Open for Peer Review & Collaborative Research.**

The Continuity Lab operates on five principles:

1. **We test hypotheses. We do not defend them.**
2. **We publish limitations before we publish claims.**
3. **We measure before we assert.**
4. **Evidence precedes belief.**
5. **Continuity is not only what we study. It is how we work.**

### Active Research Areas

| Area | Status | Output |
|:---|:---|:---|
| Presence Entropy Score (PES) | v0.2 — 54 human samples | [Benchmarks](https://www.myshape.com/research/benchmarks) |
| Continuity Proofs | v0.1 — 4 attack scenarios | [RN #001](https://www.myshape.com/research/notes/001-the-continuity-problem) |
| Replay Attack Analysis | Pipeline | [Research Agenda](https://www.myshape.com/research/agenda) |
| Cross-Device Continuity | Pipeline | [Research Agenda](https://www.myshape.com/research/agenda) |

### Challenge Set

[`entropy-governance.test.ts`](src/app/api/node/__tests__/entropy-governance.test.ts) defines the Genesis minting decision algorithm. We invite the community to propose alternative strategies that improve cohort integrity. Open an issue with your approach — we will benchmark it against the current algorithm and publish results.

→ [Research Hub](https://www.myshape.com/research) · [Benchmarks](https://www.myshape.com/research/benchmarks) · [Research Agenda](https://www.myshape.com/research/agenda)

---

## Authors

Built by **The Continuity Lab** — the research and engineering arm of MyShape Protocol.

[→ View Contributors](https://github.com/myshapeprotocol/myshape-protocol/graphs/contributors)

---

## License

Proprietary. All rights reserved.

---

*The Continuity Layer for the Simulation Age. One Genesis at a time.*
