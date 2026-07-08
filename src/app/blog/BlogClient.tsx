"use client";

import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import { playTick } from "@/utils/useAudioTick";
import Link from "next/link";
import { useState } from "react";
import "./blog.css";

interface PostEntry {
  slug: string;
  series?: string;
  title: string;
  subtitle: string;
  date: string;
  tags: string[];
  featured?: boolean;
  category: "Continuity" | "Identity" | "Security" | "Standards" | "Guides";
}

const POSTS: PostEntry[] = [
  // ── Featured ──
  { slug: "/blog/what-is-proof-of-continuity", series: "GENESIS 004", title: "What Is Proof of Continuity?", subtitle: "The missing cryptographic primitive for the Agent Economy. Identity is a snapshot. Continuity is a trajectory.", date: "2026.07.03", tags: ["continuity","agents","protocol"], featured: true, category: "Continuity" },
  { slug: "/blog/what-is-decentralized-identity-2026", series: "GENESIS 006", title: "What Is Decentralized Identity? The 2026 Guide", subtitle: "DID, SSI, verifiable credentials, proof of personhood, and proof of continuity — a complete guide.", date: "2026.07.03", tags: ["identity","SSI","DID"], featured: true, category: "Identity" },
  { slug: "/blog/zero-knowledge-proofs-digital-identity-explained", series: "GENESIS 007", title: "Zero-Knowledge Proofs Explained", subtitle: "What ZK means for digital identity. How zero-knowledge enables verification without surveillance.", date: "2026.07.03", tags: ["ZK","privacy","cryptography"], featured: true, category: "Security" },
  // ── Continuity ──
  { slug: "/blog/why-motion-is-the-only-unforgeable-identity-signal", series: "GENESIS 013", title: "Why Motion Is the Only Unforgeable Identity Signal", subtitle: "The physics of irreducible entropy. Three hard limits that make human motion mathematically impossible to forge.", date: "2026.07.03", tags: ["motion","physics","entropy"], category: "Continuity" },
  { slug: "/blog/what-is-presence-verification", series: "GENESIS 019", title: "What Is Presence Verification?", subtitle: "The 500-year history from wax seals to motion-signature — proving someone is really there.", date: "2026.07.03", tags: ["presence","history","authentication"], category: "Continuity" },
  { slug: "/blog/continuity-layer-for-the-simulation-age", title: "The Continuity Layer for the Simulation Age", subtitle: "Identity tells us who you claim to be. Continuity tells us that you are still you.", date: "2026.06.29", tags: ["continuity","protocol","architecture"], category: "Continuity" },
  // ── Identity ──
  { slug: "/blog/self-sovereign-identity-explained-2026", series: "GENESIS 010", title: "Self-Sovereign Identity Explained", subtitle: "What SSI actually delivers in 2026 — the promise, the reality, the gaps, and the next evolution.", date: "2026.07.03", tags: ["SSI","DID","identity"], category: "Identity" },
  { slug: "/blog/web3-identity-explained-blockchain", series: "GENESIS 015", title: "Web3 Identity Explained", subtitle: "What blockchain changes about who you are online. The 5-layer Web3 identity stack.", date: "2026.07.03", tags: ["Web3","blockchain","sovereign"], category: "Identity" },
  { slug: "/blog/what-is-did-decentralized-identifiers", series: "GENESIS 016", title: "What Is a DID?", subtitle: "Decentralized Identifiers — the foundation of self-sovereign identity. How DIDs work and why they matter.", date: "2026.07.03", tags: ["DID","SSI","standards"], category: "Identity" },
  { slug: "/blog/digital-identity-standards-2026", series: "GENESIS 020", title: "Digital Identity Standards 2026", subtitle: "W3C, ISO, IETF, eIDAS — the complete map of identity standards and how they fit together.", date: "2026.07.03", tags: ["standards","W3C","ISO"], category: "Standards" },
  { slug: "/blog/genesis-001-why-identity-is-not-enough", series: "GENESIS 001", title: "Why Identity Is Not Enough", subtitle: "The crisis of continuity. Why static identity fails in the age of autonomous agents.", date: "2026.07.02", tags: ["identity","continuity","agents"], category: "Identity" },
  { slug: "/blog/stored-identity-vs-generated-presence", title: "Stored Identity vs. Generated Presence", subtitle: "Every identity system stores a snapshot. Snapshots can be copied. Presence cannot.", date: "2026.06.27", tags: ["identity","presence","AI"], category: "Identity" },
  // ── Security ──
  { slug: "/blog/the-post-recognition-era-2026", series: "GENESIS 011", title: "The Post-Recognition Era", subtitle: "Why 2026 is the year we stop scanning faces. Static Recognition created the largest unchangeable password database.", date: "2026.07.03", tags: ["recognition","security","privacy"], category: "Security" },
  { slug: "/blog/motion-vs-recognition-why-your-face-is-not-a-password", series: "GENESIS 005", title: "Motion vs Static Recognition — Why Your Face Is Not a Password", subtitle: "Static recognition are broken. Motion offers a post-recognition alternative that is generative and non-replayable.", date: "2026.07.03", tags: ["motion","recognition","authentication"], category: "Security" },
  { slug: "/blog/proof-of-personhood-vs-proof-of-continuity", series: "GENESIS 008", title: "Proof of Personhood vs Proof of Continuity", subtitle: "Two different problems, two different protocols. Why the Agent Economy needs both.", date: "2026.07.03", tags: ["PoP","PoC","sybil"], category: "Security" },
  { slug: "/blog/kyc-vs-decentralized-identity", series: "GENESIS 017", title: "KYC vs Decentralized Identity", subtitle: "Why document verification fails at scale — and how SSI solves the problem.", date: "2026.07.03", tags: ["KYC","SSI","regulation"], category: "Security" },
  { slug: "/blog/sybil-resistance-explained", series: "GENESIS 018", title: "Sybil Resistance Explained", subtitle: "Why one person one vote is hard online. Every approach ranked from CAPTCHA to Proof of Continuity.", date: "2026.07.03", tags: ["sybil","PoP","voting"], category: "Security" },
  // ── Guides ──
  { slug: "/blog/how-to-verify-human-online-2026", series: "GENESIS 014", title: "How to Verify a Human Online in 2026", subtitle: "The complete guide. Every method ranked by security, privacy, and AI-resistance.", date: "2026.07.03", tags: ["verification","guide","security"], category: "Guides" },
  { slug: "/blog/digital-identity-future-2027", series: "GENESIS 012", title: "Digital Identity Future 2027", subtitle: "Five trends reshaping the identity layer. SSI mainstream, recognition collapse, continuity as primitive.", date: "2026.07.03", tags: ["future","trends","predictions"], category: "Guides" },
  { slug: "/blog/ai-agent-identity-how-autonomous-agents-prove-who-they-are", series: "GENESIS 009", title: "AI Agent Identity", subtitle: "How autonomous agents prove who they are. Agent declaration, continuity binding, human-AI coexistence.", date: "2026.07.03", tags: ["agents","AI","identity"], category: "Guides" },
];

const CATEGORIES = [
  { key: "featured", label: "Featured", desc: "Start here — the three essential essays that define the MyShape thesis." },
  { key: "Continuity", label: "Continuity", desc: "Proof of continuity, motion-signature, presence verification." },
  { key: "Identity", label: "Identity", desc: "DID, SSI, verifiable credentials, Web3 identity infrastructure." },
  { key: "Security", label: "Security", desc: "Post-recognition, Sybil resistance, KYC vs decentralized identity." },
  { key: "Standards", label: "Standards", desc: "W3C, ISO, IETF, eIDAS — the standards landscape." },
  { key: "Guides", label: "Guides", desc: "Practical guides for verification, future trends, and agent identity." },
];

export default function BlogClient() {
  const [activeCategory, setActiveCategory] = useState("featured");

  const featured = POSTS.filter(p => p.featured);
  const filtered = activeCategory === "featured" ? featured : POSTS.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6" style={{ paddingTop: "8rem", paddingBottom: "6rem" }}>
        {/* Header */}
        <div className="space-y-4 mb-12">
          <div className="flex items-center gap-4 text-[#90c8ff]/40 text-[9px] tracking-[0.3em] uppercase"><span>Protocol Log</span><span className="w-8 h-[1px] bg-[#90c8ff]/20" /><span>{POSTS.length} ESSAYS</span></div>
          <h1 className="text-2xl md:text-4xl font-light tracking-[0.06em] text-white leading-tight">Protocol<br /><span className="text-[#90c8ff]">Log</span></h1>
          <p className="text-white/30 text-[11px] tracking-[0.08em] leading-relaxed max-w-2xl">Technical essays on sovereign identity, presence verification, zero-knowledge proofs, and the protocol layer for verifiable digital continuity.</p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-12">
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => { setActiveCategory(cat.key); playTick(500, "sine", 0.06, 0.015); }}
              className={activeCategory === cat.key ? "blog-filter-btn blog-filter-btn-active" : "blog-filter-btn"}>
              {cat.label}
            </button>
          ))}
        </div>

        {activeCategory !== "featured" && (
          <p className="text-white/15 text-[9px] tracking-[0.08em] mb-8">{CATEGORIES.find(c => c.key === activeCategory)?.desc}</p>
        )}

        {/* Post list */}
        <div className="space-y-3">
          {filtered.map(post => (
            <Link key={post.slug} href={post.slug}
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
              className={`blog-post-card ${post.featured && activeCategory === "featured" ? "blog-post-card-featured" : ""}`}>
              <div className="flex items-center gap-3 mb-2">
                {post.series && <span className="blog-post-series">{post.series}</span>}
                <span className="blog-post-date">{post.date}</span>
                {post.featured && <span className="blog-post-featured-badge">FEATURED</span>}
              </div>
              <h2 className="blog-post-title">{post.title}</h2>
              <p className="blog-post-subtitle">{post.subtitle}</p>
              <div className="flex gap-2 mt-2">{post.tags.map(t => (<span key={t} className="blog-post-tag">#{t}</span>))}</div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-white/15 text-[10px] text-center py-16">No posts in this category yet.</p>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/[0.04] text-center space-y-2">
          <p className="text-white/15 text-[8px] tracking-[0.1em]">
            <Link href="/blog/feed.xml" className="hover:text-[#90c8ff]/40 transition-colors">RSS Feed</Link>
            <span className="mx-3">|</span>
            <Link href="/glossary" className="hover:text-[#90c8ff]/40 transition-colors">Glossary</Link>
            <span className="mx-3">|</span>
            <Link href="/newsletter" className="hover:text-[#90c8ff]/40 transition-colors">Newsletter</Link>
          </p>
        </div>
      </div>

      <ProtocolFooter />
    </div>
  );
}
