# MyShape Protocol

> **The Sovereign 3D Identity Layer for the Decentralized Human.**
>
> An AI-native identity protocol built on ethereal data energy, wireframe anatomy, and non-binary aesthetic — enabling zero-knowledge, cross-platform identity through motion-signature verification.

---

## Tech Stack

| Layer | Technology |
|:---|:---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| 3D / Canvas | Three.js, @react-three/fiber, @react-three/drei, Canvas 2D particle engine |
| Motion | MediaPipe Pose, Framer Motion |
| Backend | Supabase (PostgreSQL + Realtime) |
| Email | Resend |
| Type Safety | TypeScript 5 (strict mode) |

---

## Getting Started

```bash
npm install
npm run dev        # → http://localhost:3000
npm run build      # production build
npm run lint       # ESLint (Next.js core-web-vitals + TypeScript rules)
```

### Required Environment Variables

Copy `.env.local` and fill in your keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
RESEND_API_KEY=re_...
```

> **Security**: Source code contains zero hardcoded credentials. All keys are injected via `process.env` and validated at runtime. See `src/app/api/` routes.

---

## Project Structure

```
src/
├── app/                         # Next.js App Router pages
│   ├── layout.tsx                # Root layout (metadata, JSON-LD, background)
│   ├── page.tsx                  # Homepage
│   ├── loading.tsx               # Route loading state
│   ├── error.tsx                 # Error boundary
│   ├── not-found.tsx             # Custom 404
│   ├── sitemap.ts                # → /sitemap.xml
│   ├── robots.ts                 # → /robots.txt (GEO-optimized)
│   ├── globals.css               # Global resets + CSS variables
│   ├── api/                      # API routes (send-otp, verify-otp, uplink)
│   ├── genesis/                  # Genesis ritual page
│   ├── identity/                 # Identity layer page
│   ├── vision/                   # Vision page
│   ├── protocol/                 # Protocol architecture pages
│   └── civ-layer/                # Mirror routes → canonical to primary
├── components/
│   ├── header/                   # ProtocolHeader + header.css
│   ├── footer/                   # ProtocolFooter
│   ├── hero/                     # Hero, HeroVisual, Starfield, etc.
│   ├── vision/                   # Vision section
│   ├── capabilities/             # Capabilities section
│   ├── howitworks/               # How It Works section
│   ├── joinwaitlist/             # JoinWaitlist + particle canvas
│   ├── layout/                   # ProtocolLayout (shared page shell)
│   ├── identity/                 # IdentitySigil, IdentityScan, etc.
│   ├── ritual/                   # GenesisRitual, LiveCapture
│   ├── animations/               # ParticleEngine, SceneContainer
│   ├── particles/                # BackgroundParticles
│   └── seo/                      # CanonicalLink for client components
├── styles/
│   └── animations.css            # ALL shared @keyframes (single source of truth)
└── hooks/
    └── useSound.ts               # Shared audio hook (not yet adopted globally)
```

---

## SEO & GEO Strategy

### Search Engines
- Dynamic `sitemap.xml` with 4-tier priority hierarchy
- `robots.txt` denies `/api/` and `/civ-layer/` (duplicate content)
- Canonical URLs on all mirror routes

### Generative Engine Optimization
- **10 AI crawlers explicitly allowed**: GPTBot, ClaudeBot, anthropic-ai, PerplexityBot, Applebot-Extended, Google-Extended, Meta-ExternalAgent, CCBot, and traditional crawlers
- **JSON-LD structured data**: Organization entity + WebSite + 7 DefinedTerms linked to brand graph — enabling AI knowledge graph construction
- **Semantic HTML hierarchy**: H1→H4 nesting, definition lists, timeline tables
- **Brand-safe metadata**: all descriptions follow de-corporealized, non-binary aesthetic vocabulary

### Key SEO Keywords
*AI-Native Identity, Zero-Knowledge Presence, Motion-Signature Authentication, Sovereign 3D Identity Layer, Ethereal Data Energy, Decentralized Identity Mesh, Non-Biometric Kinetic Verification*

---

## Brand Guidelines

**All code, copy, alt-text, and comments MUST follow these rules:**

| ✅ Use | ❌ Never Use |
|:---|:---|
| entity, agent, silhouette (abstract) | man, woman, male, female |
| wireframe anatomy, data-outline | skin, muscle, body, strength |
| ethereal data energy | handsome, pretty, brawny |
| non-binary aesthetic | chest, breasts, genital |
| abstract-sigil | male-avatar, muscular-frame |

See `MyShape_Documentation/AI_Agent_Guidelines.md` for the complete specification.

---

## Deployment

Deployed on Vercel. The `.vercel/` directory is git-ignored.

---

## License

Proprietary. All rights reserved.
