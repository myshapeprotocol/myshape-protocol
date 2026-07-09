"use client";

import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import { playTick } from "@/utils/useAudioTick";
import Link from "next/link";
import { POSTS, type PostEntry } from "./posts";
import { useState } from "react";
import "./blog.css";


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
          <div className="flex items-center gap-4 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase"><span>Protocol Log</span><span className="w-8 h-[1px] bg-[#90c8ff]/25" /><span>{POSTS.length} ESSAYS</span></div>
          <h1 className="text-2xl md:text-4xl font-light tracking-[0.06em] text-white leading-tight" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>Protocol<br /><span className="text-[#90c8ff]">Log</span></h1>
          <p className="text-white/40 text-[12px] tracking-[0.08em] leading-relaxed max-w-2xl">Technical essays on sovereign identity, presence verification, zero-knowledge proofs, and the protocol layer for verifiable digital continuity.</p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-12">
          {CATEGORIES.map(cat => (
            <button key={cat.key}
              onClick={() => { setActiveCategory(cat.key); playTick(500, "sine", 0.06, 0.022); }}
              onMouseEnter={() => playTick(440, "sine", 0.035, 0.02)}
              className={activeCategory === cat.key ? "blog-filter-btn blog-filter-btn-active" : "blog-filter-btn"}>
              {cat.label}
            </button>
          ))}
        </div>

        {activeCategory !== "featured" && (
          <p className="text-white/25 text-[10px] tracking-[0.08em] mb-8">{CATEGORIES.find(c => c.key === activeCategory)?.desc}</p>
        )}

        {/* Post list */}
        <div className="space-y-3">
          {filtered.map(post => (
            <Link key={post.slug} href={post.slug}
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.022)}
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
          <p className="text-white/22 text-[11px] text-center py-16">No posts in this category yet.</p>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/[0.04] text-center space-y-2">
          <p className="text-white/40 text-[12px] tracking-[0.08em]">
            <Link href="/blog/feed.xml" className="hover:text-[#90c8ff]/60 transition-colors" onMouseEnter={() => playTick(420, "sine", 0.035, 0.022)}>RSS Feed</Link>
            <span className="mx-3 text-white/12">|</span>
            <Link href="/glossary" className="hover:text-[#90c8ff]/60 transition-colors" onMouseEnter={() => playTick(420, "sine", 0.035, 0.022)}>Glossary</Link>
            <span className="mx-3 text-white/12">|</span>
            <Link href="/newsletter" className="hover:text-[#90c8ff]/60 transition-colors" onMouseEnter={() => playTick(420, "sine", 0.035, 0.022)}>Newsletter</Link>
          </p>
        </div>
      </div>

      <ProtocolFooter />
    </div>
  );
}
