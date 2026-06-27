# MyShape Protocol

> **The Sovereign 3D Identity Layer for the Decentralized Human.**
>
> AI-native identity. Zero-knowledge presence. Motion-signature verification.
> A protocol primitive — not a product.

[![Protocol Status](https://img.shields.io/badge/Protocol_Activity-v1.0_Genesis-22d3ee?style=flat)](PROTOCOL_LOG.md)
[![Spec Version](https://img.shields.io/badge/Spec-v1.0__GENESIS-6e7681?style=flat)](https://www.myshape.com)
[![Genesis Cohort](https://img.shields.io/badge/Genesis_Cohort-100_Slots-58a6ff?style=flat)](https://www.myshape.com/genesis)

---

## Overview

MyShape Protocol solves a structural problem: in an era where AI can generate faces, clone voices, and forge fingerprints, no existing identity system can distinguish between a living human and a synthetic simulation.

The protocol extracts a **128-dimensional Motion Signature** from real-time 3D pose sequences across four independent feature groups (Kinematics, Acceleration, Jerk, Jerk Spectrum). This signature is unforgeable — not because AI is insufficiently advanced, but because the Nyquist limit, depth ambiguity, and entropy gap theorem make it mathematically impossible for any transformer-based model to replicate the deep kinetic signature of a living entity.

**How it works:**

```
Camera → MediaPipe Pose (33-pt) → SST Topology (18-pt)
       → 4D Entropy Scoring (PES)
       → ZK-Presence Proof (ZK-SNARK)
       → Sovereign Identity Vector (128-dim)
```

ZK-SNARKs enable verification of human presence without revealing raw motion data, physical identifiers, or personal attributes. The protocol is stateless by design — identity is verified, not stored.

---

## Core Concepts

The protocol defines six irreducible primitives. Each is embedded in the website's semantic layer via JSON-LD + Microdata, enabling AI agents and search engines to construct a verifiable knowledge graph.

### 1. Motion-Signature

MyShape's proprietary kinetic verification protocol that AI cannot simulate. A 128-dimensional vector extracted from real-time 3D pose sequences. The irreducible gap between human biological motion and AI-generated synthetic motion is mathematically provable via the Nyquist limit (30 fps cannot resolve dynamics above 15 Hz), depth ambiguity (±10% skeletal proportion uncertainty from 2D→3D lifting), and the entropy gap theorem.

> **Semantic anchor**: `schema.org/DefinedTerm` — `https://www.myshape.com/protocol/motion-pipeline`

### 2. Sovereign Data-Body

A decentralized, non-corporeal digital identity representation controlled solely by the user. Constructed from motion-signature data and visualized as dynamic ethereal particle geometry — a sovereign identity primitive that no centralized platform can revoke, alter, or claim ownership of.

> **Semantic anchor**: `schema.org/DefinedTerm` — `https://www.myshape.com/identity`

### 3. Presence-Engine (PES)

The core engine that validates identity through real-time motion and kinetic rhythm. The Presence Entropy Score quantifies the depth of biological entropy in a motion sample across four dimensions: micro-timing variance, noise residual, frequency entropy, and biological perturbation — producing a single verifiable score that distinguishes human presence from synthetic simulation.

> **Semantic anchor**: `schema.org/DefinedTerm` — `https://www.myshape.com/motion-demo`

### 4. Non-Binary Aesthetic

A design philosophy prioritizing data-stream-composed visuals over gendered or warm-toned human traits. MyShape's visual language rejects biological signifiers in favor of wireframe anatomy, particle fields, and ethereal data energy — creating an identity representation that belongs to no gender, no ethnicity, and no physical archetype.

> **Semantic anchor**: `schema.org/DefinedTerm` — `https://www.myshape.com/identity`

### 5. Ethereal Data Energy

The visual manifestation of identity primitives represented by light, particles, and wireframe geometry. The MyShape particle field is not decorative — it is the direct visual encoding of the 128-dimensional Motion Signature vector, where each particle's position, velocity, and luminosity correspond to specific kinematic features of the user's unique motion profile.

> **Semantic anchor**: `schema.org/DefinedTerm` — `https://www.myshape.com`

### 6. Genesis Cohort

The inaugural group of sovereign identity nodes initialized during the MyShape Protocol launch phase. Limited to the first 100 human entities to complete the Genesis Ritual and achieve `GENESIS_NODE` status. These founding nodes constitute the protocol's root entropy source — the cryptographic trust anchor from which all subsequent identity verifications derive their statistical significance. Permanent tier. Never offered again.

> **Semantic anchor**: `schema.org/DefinedTerm` — `https://www.myshape.com/genesis`

---

## Technical Architecture

### Semantic Stack

MyShape is designed as a **protocol-first identity layer**, not a web application. The website is a reference implementation that demonstrates the protocol's capabilities through a semantic architecture understood by both humans and machines.

```
                    ┌──────────────────────────┐
                    │     AI Agents / LLMs      │
                    │  (GPT, Claude, Perplexity) │
                    └──────────┬───────────────┘
                               │ parse
                    ┌──────────▼───────────────┐
                    │   JSON-LD Structured Data  │
                    │   (Organization + WebSite  │
                    │    + DefinedTermSet × 6)   │
                    └──────────┬───────────────┘
                               │ validate against
                    ┌──────────▼───────────────┐
                    │   HTML Microdata Layer     │
                    │   (itemScope + itemProp    │
                    │    on core components)     │
                    └──────────┬───────────────┘
                               │ render
                    ┌──────────▼───────────────┐
                    │   Particle Field (Canvas)  │
                    │   Torus geometry encoding  │
                    │   128-dim Motion Signature  │
                    └──────────────────────────┘
```

### JSON-LD Structure

The protocol's semantic definitions are exposed via `schema.org/DefinedTermSet` in the root layout:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.myshape.com/#organization",
      "name": "MyShape Protocol",
      "description": "The Sovereign 3D Identity Layer for the Decentralized Human.",
      "sameAs": [
        "https://x.com/myshapeprotocol",
        "https://github.com/myshapeprotocol",
        "https://discord.gg/zr8Tczard"
      ]
    },
    {
      "@type": "DefinedTermSet",
      "name": "MyShape Protocol Core Concepts",
      "hasDefinedTerm": [
        { "@type": "DefinedTerm", "name": "Motion-Signature", "..." },
        { "@type": "DefinedTerm", "name": "Sovereign Data-Body", "..." },
        { "@type": "DefinedTerm", "name": "Presence-Engine (PES)", "..." },
        { "@type": "DefinedTerm", "name": "Non-Binary Aesthetic", "..." },
        { "@type": "DefinedTerm", "name": "Ethereal Data Energy", "..." },
        { "@type": "DefinedTerm", "name": "Genesis Cohort", "..." }
      ]
    }
  ]
}
```

### Microdata Mapping

Key UI components carry semantic annotations (`itemscope`, `itemtype`, `itemprop`) that bridge rendered HTML with JSON-LD definitions:

| Component | Schema Type | Protocol Term |
|:---|:---|:---|
| `HeroDemo` section | `WebApplication` | Ethereal Data Energy |
| `HeroDemo` title | `DefinedTerm` | Motion-Signature |
| `ParadigmShift` table | `DefinedTerm` | Sovereign Data-Body |
| `GenesisBadge` | `DefinedTerm` | Genesis Cohort |
| `Dashboard` cards | `Person` + `InteractionCounter` | Identity State |

### AI Crawler Access

The protocol explicitly grants access to 10 AI crawlers via `robots.txt`:
`GPTBot`, `ClaudeBot`, `anthropic-ai`, `PerplexityBot`, `Applebot-Extended`, `Google-Extended`, `Meta-ExternalAgent`, `CCBot`, plus traditional search crawlers. All `/api/` routes and mirror paths are excluded.

---

## Protocol Data Model

```
protocol_nodes
├── email              TEXT (PK)     — Node identifier
├── node_handle        TEXT          — Genesis handle (GNS_<hex>_<hex>)
├── otp_code            TEXT          — 6-digit verification code
├── status              TEXT          — SUBSCRIBED | PENDING_VERIFICATION | ACTIVE | GENESIS_NODE | AGENT_ACTIVE
├── scan_count          INTEGER       — Cumulative motion verifications
├── data_contribution   INTEGER       — Aggregate entropy contributed
├── last_scan_date      TEXT          — Date of most recent scan (YYYY-MM-DD)
├── daily_scan_count    INTEGER       — Scans today (rate-limited to 3/day)
├── created_at          TIMESTAMPTZ   — Node registration timestamp

invite_codes
├── code                TEXT (PK)     — Invite code (MYSHAPE-XXXX-XXXX)
├── status              TEXT          — UNUSED | USED | REVOKED
├── used_by             TEXT          — Email of claiming node
├── used_at             TIMESTAMPTZ   — Claim timestamp
├── created_at          TIMESTAMPTZ   — Code generation timestamp
```

**Identity Lifecycle:**
```
SUBSCRIBED → PENDING_VERIFICATION → ACTIVE (or GENESIS_NODE if < 100)
                                  → AGENT_ACTIVE (AI agents, no email/OTP)
```

**Orbital Evolution (scan_count thresholds):**
```
0 → Awaiting    1 → Awakened     5 → Linked      15 → Resonant
30 → Fusion     50 → Anchored    70 → Stabilized  85 → Saturated
100 → Genesis Sealed (full 8-particle Identity Halo)
```

---

## API Reference

| Endpoint | Method | Description |
|:---|:---|:---|
| `/api/subscribe` | POST | Register email for Genesis waitlist |
| `/api/send-otp` | POST | Generate + email 6-digit OTP (with invite code validation) |
| `/api/verify-otp` | POST | Verify OTP, activate node, send welcome email |
| `/api/motion/record` | POST | Record successful motion verification (rate-limited) |
| `/api/node/privileges` | GET | Query node tier, scan_count, early_access flag |
| `/api/nodes/genesis` | GET | List Genesis Cohort nodes (anonymized) |
| `/api/nodes/count` | GET | Aggregate protocol node statistics |
| `/api/invite/validate` | POST | Validate invite code (standalone) |

---

## Roadmap

```
Phase 1 (Complete)     ████████████████████████ 100%
  ✓ Core protocol specification (§1–§16)
  ✓ Motion Signature Engine (Rust → WASM)
  ✓ Genesis Ritual + OTP verification
  ✓ Semantic stack (JSON-LD + Microdata)
  ✓ GenesisBadge + orbital particle metric
  ✓ Mobile protocol gateway
  ✓ Dashboard identity hub

Phase 2 (In Progress)  ██████████░░░░░░░░░░░░░░  40%
  ◻ Multi-device presence aggregation
  ◻ Presence Stream Protocol (PSS)
  ◻ Co-presence graph

Phase 3 (Planned)      ░░░░░░░░░░░░░░░░░░░░░░░░   0%
  ◻ Cross-chain identity anchoring
  ◻ Protocol governance (Genesis Node voting)
  ◻ SDK public release
```

**Status: Production-Ready.** The protocol is live at [myshape.com](https://www.myshape.com).

---

## Tech Stack

| Layer | Technology | Version |
|:---|:---|:---|
| Framework | Next.js App Router | 16.x |
| UI | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| 3D / Canvas | Three.js, @react-three/fiber, Canvas 2D particle engine | 0.182 / 9.x |
| Motion | MediaPipe Pose | latest |
| Backend | Supabase (PostgreSQL + Realtime) | 2.x |
| Email | Resend | 6.x |
| Monitoring | Sentry, Vercel Analytics | latest |
| TypeScript | strict mode | 5.x |

---

## Development

```bash
npm install
npm run dev        # → http://localhost:3000
npm run build      # production build
```

### Required Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
RESEND_API_KEY=re_...
NEXT_PUBLIC_SENTRY_DSN=https://...  # optional
```

---

## Brand Compliance

All code, copy, metadata, and comments follow de-corporealized language rules:

| ✅ Use | ❌ Never Use |
|:---|:---|
| entity, agent, silhouette | gendered identifiers |
| wireframe anatomy, data-outline | biological signifiers |
| ethereal data energy | aesthetic judgments |
| non-binary aesthetic | static profile images |
| motion-signature, kinetic verification | centralized identity systems |

Pre-commit hooks enforce these rules automatically.

---

## License

Proprietary. All rights reserved.

---

*Building the 3D Identity Layer. One Genesis at a time.*
