"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import { playTick } from "@/utils/useAudioTick";
import "@/app/research/research.css";

/**
 * Navigation-layer index for open questions.
 *
 * Adds no research claim of its own. The single entry mirrors the identifier,
 * title and framing already published by OQ-001 and by the Research Hub card,
 * and links to the real route.
 */
const OPEN_QUESTIONS = [
  {
    id: "OQ-001",
    title: "Can continuity exist independently of identity?",
    desc: "If continuity can be verified without persistent identifiers, humans, AI agents, and hybrid entities may share a common verification substrate.",
    slug: "/research/open-questions/001",
  },
];

export default function OpenQuestionsIndexClient() {
  return (
    <div className="min-h-screen bg-[#051025] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-28 pb-16">

        <section className="research-hero">
          <div className="flex items-center gap-3 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37]/20 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
            </span>
            <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-[#90c8ff]/55">
              &gt; open_questions<span className="text-white/20">--index</span>
            </span>
          </div>
          <h1 className="research-tagline">
            Questions we have <span>not</span> answered yet.
          </h1>
          <p className="research-subtitle">
            Navigation only. Each entry links to the question&rsquo;s own page.
          </p>
        </section>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-1 rounded-full bg-[#d4af37] shadow-[0_0_6px_rgba(212,175,55,0.4)]" />
            <span className="text-[11px] tracking-[0.4em] uppercase text-[#d4af37]/70">
              {OPEN_QUESTIONS.length} open{" "}
              {OPEN_QUESTIONS.length === 1 ? "question" : "questions"}
            </span>
          </div>
          {OPEN_QUESTIONS.map((q) => (
            <Link
              key={q.id}
              href={q.slug}
              className="research-agenda-card"
              onMouseEnter={() => playTick(720, "sine", 0.06, 0.025)}
            >
              <div className="research-agenda-card-label">{q.id}</div>
              <div className="research-agenda-card-title">
                {q.title}
                <span className="research-agenda-card-arrow">&rarr;</span>
              </div>
              <div className="research-agenda-card-desc">{q.desc}</div>
            </Link>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.04] text-center">
          <Link
            href="/research"
            onMouseEnter={() => playTick(420, "sine", 0.03, 0.018)}
            className="text-white/35 text-[11px] tracking-[0.2em] uppercase hover:text-white/55 transition-colors"
          >
            &larr; Research Hub
          </Link>
        </div>
      </div>
      <ProtocolFooter />
    </div>
  );
}
