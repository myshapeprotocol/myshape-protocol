"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import { playTick } from "@/utils/useAudioTick";
import "./research.css";

const PUBLISHED_NOTES = [
  {
    num: "001",
    title: "The Continuity Problem",
    subtitle:
      "Why proving 'I am still me' may become the missing cryptographic primitive of the AI era.",
    date: "2026.07.09",
    slug: "/research/notes/001-the-continuity-problem",
  },
];

const ACTIVE_BENCHMARKS = [
  {
    name: "PES Benchmark",
    status: "v0.2 — 54 samples",
    meta: "Cohen's d: 2.1 · AUC: 0.94",
  },
];

const PIPELINE_RN = [
  { num: "002", title: "PES Benchmark", subtitle: "Dataset, Cohen's d, precision/recall, and threats to validity for the Presence Entropy Score." },
  { num: "003", title: "Replay Attack Analysis", subtitle: "Under what conditions can continuity proofs be replayed? Experimental evaluation." },
  { num: "004", title: "Challenge-Response", subtitle: "Interactive continuity verification without storing motion data." },
  { num: "005", title: "The Continuity Receipt", subtitle: "A proposed format for portable, verifiable continuity proofs." },
];

const PIPELINE_BENCHMARKS = [
  { name: "Replay Resistance", meta: "Cross-session replay attempts" },
  { name: "Cross-Device", meta: "Same subject, different hardware" },
  { name: "Longitudinal Stability", meta: "Same subject, days apart" },
];

export default function ResearchClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-28 pb-16">

        {/* ── Hero ── */}
        <section className="research-hero">
          <div className="flex items-center gap-3 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3fb950]/20 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3fb950] shadow-[0_0_8px_rgba(63,185,80,0.5)]" />
            </span>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#90c8ff]/55">
              &gt; research_hub <span className="text-white/20">--index</span>
            </span>
            <span className="font-mono text-[8px] tracking-[0.2em] text-white/15 ml-auto">stream_01</span>
          </div>
          <h1 className="research-tagline">
            Investigating whether <span>continuity</span> can become a verifiable
            property of digital existence.
          </h1>
          <p className="research-subtitle">
            We are not building a product. We are investigating a question. If the
            answer is yes, continuity becomes a new cryptographic primitive —
            alongside identity, encryption, and consensus.
          </p>
          <Link
            href="/research/agenda"
            className="research-agenda-cta"
            onMouseEnter={() => playTick(720, "sine", 0.06, 0.025)}
          >
            <span className="research-agenda-cta-arrow">→</span>{" "}
            Research Agenda — four core questions driving our investigation
          </Link>
        </section>

        {/* ── Two-Column Grid ── */}
        <div className="research-grid-v2">
          {/* Left: Published */}
          <div className="research-column">
            <div className="research-column-title" onMouseEnter={() => playTick(360, "triangle", 0.035, 0.022)}>Published</div>

            {PUBLISHED_NOTES.map((rn) => (
              <Link
                key={rn.num}
                href={rn.slug}
                className="rn-card"
                onMouseEnter={() => playTick(520, "sine", 0.05, 0.02)}
              >
                <div className="rn-card-num">
                  <span className="rn-card-dot" />
                  RN #{rn.num}
                </div>
                <div className="rn-card-title">{rn.title}</div>
                <div className="rn-card-subtitle">{rn.subtitle}</div>
                <div className="rn-card-date">{rn.date}</div>
              </Link>
            ))}

            {ACTIVE_BENCHMARKS.map((bm) => (
              <div
                key={bm.name}
                className="bm-card"
                onMouseEnter={() => playTick(440, "triangle", 0.045, 0.025)}
              >
                <div className="bm-card-name">{bm.name}</div>
                <div className="bm-card-status">{bm.status}</div>
                <div className="bm-card-meta">{bm.meta}</div>
              </div>
            ))}
          </div>

          {/* Right: Pipeline */}
          <div className="research-column">
            <div className="research-column-title" onMouseEnter={() => playTick(360, "triangle", 0.035, 0.022)}>In the Pipeline</div>

            <div className="pipeline-section-label">Research Notes</div>
            {PIPELINE_RN.map((rn, i) => (
              <div
                key={rn.num}
                className="pipeline-item"
                onMouseEnter={() => playTick(480 - i * 15, "sine", 0.04, 0.022)}
              >
                <span className="pipeline-item-num">RN #{rn.num}</span>
                <span className="pipeline-item-title">{rn.title}</span>
                <span className="pipeline-item-subtitle">{rn.subtitle}</span>
              </div>
            ))}

            <div className="pipeline-section-label">Benchmarks</div>
            {PIPELINE_BENCHMARKS.map((bm, i) => (
              <div
                key={bm.name}
                className="pipeline-item"
                onMouseEnter={() => playTick(400 - i * 10, "triangle", 0.04, 0.022)}
              >
                <span className="pipeline-item-title">{bm.name}</span>
                <span className="pipeline-item-meta">{bm.meta}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Agenda CTA Card ── */}
        <Link
          href="/research/agenda"
          className="research-agenda-card"
          onMouseEnter={() => playTick(660, "sine", 0.05, 0.022)}
        >
          <div className="research-agenda-card-label">Living Document</div>
          <div className="research-agenda-card-title">
            The Research Agenda
            <span className="research-agenda-card-arrow">→</span>
          </div>
          <div className="research-agenda-card-desc">
            Four open questions. One research program. We do not defend
            hypotheses — we design experiments that can falsify them.
          </div>
        </Link>

        {/* ── Due Diligence ── */}
        <div className="mt-20 text-center">
          <p className="text-white/15 text-[10px] tracking-[0.08em] leading-relaxed">
            Continuity Lab is the research and engineering arm of MyShape Protocol.
          </p>
          <a
            href="https://github.com/myshapeprotocol"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-1.5 text-[#90c8ff]/20 text-[9px] tracking-[0.2em] uppercase hover:text-[#90c8ff]/40 transition-colors"
            onMouseEnter={() => playTick(440, "sine", 0.025, 0.012)}
          >
            Explore Contributions →
          </a>
        </div>

        {/* ── Footer ── */}
        <div className="mt-12 pt-8 border-t border-white/[0.04] text-center">
          <Link
            href="/"
            className="text-white/25 text-[10px] tracking-[0.2em] uppercase hover:text-white/45 transition-colors"
            onMouseEnter={() => playTick(400, "sine", 0.03, 0.018)}
          >
            ← Home
          </Link>
        </div>
      </div>
      <ProtocolFooter />
    </div>
  );
}
