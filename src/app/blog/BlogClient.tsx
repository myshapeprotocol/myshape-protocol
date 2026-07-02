"use client";

import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import { playTick } from "@/utils/useAudioTick";
import Link from "next/link";

interface PostEntry {
  slug: string;
  series?: string;
  title: string;
  subtitle: string;
  date: string;
  tags: string[];
}

const POSTS: PostEntry[] = [
  {
    slug: "/blog/genesis-001-why-identity-is-not-enough",
    series: "GENESIS 001",
    title: "Why Identity Is Not Enough",
    subtitle: "Identity proves existence. Continuity proves evolution. In the age of autonomous agents, we need protocols that verify the trajectory of a subject — not just its snapshot.",
    date: "2026.07.02",
    tags: ["identity", "continuity", "agents", "protocol"],
  },
  {
    slug: "/blog/stored-identity-vs-generated-presence",
    title: "Stored Identity vs. Generated Presence",
    subtitle: "Every identity system today stores a snapshot. Snapshots can be copied. Presence cannot — because presence is not data. It is physics.",
    date: "2026.06.27",
    tags: ["identity", "presence", "AI", "architecture"],
  },
  {
    slug: "/blog/continuity-layer-for-the-simulation-age",
    title: "The Continuity Layer for the Simulation Age",
    subtitle: "A technical exploration of presence receipts, ZK-presence proofs, and the protocol architecture for verifiable digital continuity.",
    date: "2026.06.21",
    tags: ["continuity", "ZK", "protocol", "architecture"],
  },
];

export default function BlogClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{ paddingTop: "8rem", paddingBottom: "6rem" }}>
        {/* Header */}
        <div className="space-y-4 mb-20">
          <div className="text-[#90c8ff]/40 text-[10px] tracking-[0.5em] uppercase">Protocol Log</div>
          <h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white">
            GENESIS<span className="text-[#90c8ff]">_ARCHIVE</span>
          </h1>
          <p className="text-white/25 text-[11px] tracking-[0.1em] leading-relaxed max-w-lg">
            Technical essays on sovereign identity, presence verification,
            and the protocol layer for verifiable digital continuity.
          </p>
        </div>

        {/* Post List */}
        <div className="space-y-16">
          {POSTS.map((post, i) => (
            <Link
              key={post.slug}
              href={post.slug}
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
              className="block group"
            >
              <article className="space-y-3">
                {/* Meta line */}
                <div className="flex items-center gap-3 text-[9px] tracking-[0.2em] uppercase">
                  {post.series && (
                    <>
                      <span className="text-[#90c8ff]/60">{post.series}</span>
                      <span className="w-4 h-[1px] bg-[#90c8ff]/20" />
                    </>
                  )}
                  <span className="text-white/20">{post.date}</span>
                  <span className="w-4 h-[1px] bg-white/10" />
                  <span className="text-white/15">
                    {post.tags.map((t) => `#${t}`).join("  ")}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-lg md:text-xl font-light tracking-[0.06em] text-white/80 group-hover:text-white transition-colors leading-snug">
                  {post.title}
                </h2>

                {/* Subtitle */}
                <p className="text-white/25 text-[10px] tracking-[0.08em] leading-relaxed max-w-xl">
                  {post.subtitle}
                </p>

                {/* Read link */}
                <div className="text-[#90c8ff]/30 text-[9px] tracking-[0.15em] uppercase group-hover:text-[#90c8ff]/60 transition-colors pt-1">
                  Read Protocol →
                </div>
              </article>

              {/* Divider */}
              {i < POSTS.length - 1 && (
                <div className="mt-12 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              )}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-24 p-8 border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02] text-center space-y-3">
          <p className="text-white/20 text-[9px] tracking-[0.2em] uppercase">
            Subscribe to Protocol Updates
          </p>
          <p className="text-white/15 text-[9px]">
            <a
              href="https://open.substack.com/pub/myshape"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#90c8ff]/40 hover:text-[#90c8ff]/70 transition-colors underline underline-offset-4"
            >
              Substack →
            </a>
            <span className="mx-3 text-white/10">|</span>
            <a
              href="https://github.com/RaymondHWu/myshape-protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#90c8ff]/40 hover:text-[#90c8ff]/70 transition-colors underline underline-offset-4"
            >
              GitHub →
            </a>
          </p>
        </div>
      </div>

      <ProtocolFooter />
    </div>
  );
}
