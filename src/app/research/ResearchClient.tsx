"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";
import "./research.css";

const RESEARCH_NOTES = [
  { num: "001", title: "The Continuity Problem", subtitle: "Why proving 'I am still me' may become the missing cryptographic primitive of the AI era.", date: "2026.07.09", slug: "/research/notes/001-the-continuity-problem" },
  { num: "002", title: "PES Benchmark", subtitle: "Dataset, Cohen's d, precision/recall, and threats to validity for the Presence Entropy Score.", date: "Forthcoming", slug: null },
  { num: "003", title: "Replay Attack Analysis", subtitle: "Under what conditions can continuity proofs be replayed? Experimental evaluation.", date: "Forthcoming", slug: null },
  { num: "004", title: "Challenge-Response", subtitle: "Interactive continuity verification without storing motion data.", date: "Forthcoming", slug: null },
  { num: "005", title: "The Continuity Receipt", subtitle: "A proposed format for portable, verifiable continuity proofs.", date: "Forthcoming", slug: null },
];

const BENCHMARKS = [
  { name: "PES Benchmark", status: "v0.2 — 54 samples", meta: "Cohen's d: 2.1 · AUC: 0.94" },
  { name: "Replay Resistance", status: "Planned", meta: "Cross-session replay attempts" },
  { name: "Cross-Device", status: "Planned", meta: "Same subject, different hardware" },
  { name: "Longitudinal Stability", status: "Planned", meta: "Same subject, days apart" },
];

const OPEN_QUESTIONS = [
  { num: "001", q: "Does biological entropy remain distinguishable against next-generation diffusion models?", status: "Investigating" },
  { num: "002", q: "Can continuity be transferred between a human and their AI agent?", status: "Open" },
  { num: "003", q: "What is the minimum viable sampling duration for a statistically reliable continuity proof?", status: "Open" },
  { num: "004", q: "Can environmental noise (lighting, background, camera quality) be separated from biological signal?", status: "Investigating" },
  { num: "005", q: "Does temporal continuity degrade gracefully or collapse catastrophically under adversarial conditions?", status: "Open" },
];

export default function ResearchClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-28 pb-16">
        <div className="research-hero">
          <div className="research-label">The Continuity Lab</div>
          <h1 className="research-tagline">Investigating whether <span>continuity</span> can become a verifiable property of digital existence.</h1>
          <p className="research-subtitle">We are not building a product. We are investigating a question. If the answer is yes, continuity becomes a new cryptographic primitive — alongside identity, encryption, and consensus.</p>
          <Link
            href="/research/agenda"
            className="agenda-entry-link"
            onMouseEnter={() => playTick(700, "sine", 0.05, 0.015)}
          >
            <span className="agenda-entry-arrow">→</span> Research Agenda — four open questions driving our investigation
          </Link>
        </div>

        <div className="research-grid">
          {/* Column 1 — Research Notes */}
          <div className="research-column">
            <div className="research-column-title">Research Notes</div>
            {RESEARCH_NOTES.map((rn) =>
              rn.slug ? (
                <Link key={rn.num} href={rn.slug} className="rn-card" onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
                  <div className="rn-card-num">RN #{rn.num}</div>
                  <div className="rn-card-title">{rn.title}</div>
                  <div className="rn-card-subtitle">{rn.subtitle}</div>
                  <div className="rn-card-date">{rn.date}</div>
                </Link>
              ) : (
                <div key={rn.num} className="rn-card" style={{ opacity: 0.35, cursor: "default" }} onMouseEnter={() => playTick(300, "sine", 0.02, 0.005)}>
                  <div className="rn-card-num">RN #{rn.num}</div>
                  <div className="rn-card-title">{rn.title}</div>
                  <div className="rn-card-subtitle">{rn.subtitle}</div>
                  <div className="rn-card-date">{rn.date}</div>
                </div>
              )
            )}
          </div>

          {/* Column 2 — Benchmarks */}
          <div className="research-column">
            <div className="research-column-title">Benchmarks</div>
            {BENCHMARKS.map((bm) => (
              <div key={bm.name} className="bm-card" onMouseEnter={() => playTick(400, "sine", 0.03, 0.008)}>
                <div className="bm-card-name">{bm.name}</div>
                <div className="bm-card-status">{bm.status}</div>
                <div className="bm-card-meta">{bm.meta}</div>
              </div>
            ))}
          </div>

          {/* Column 3 — Open Questions */}
          <div className="research-column">
            <div className="research-column-title">Open Questions</div>
            {OPEN_QUESTIONS.map((oq) => (
              <div key={oq.num} className="oq-card" onMouseEnter={() => playTick(400, "sine", 0.03, 0.008)}>
                <div className="oq-card-num">Open Question #{oq.num}</div>
                <div className="oq-card-q">{oq.q}</div>
                <div className="oq-card-status">Status: {oq.status}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.04] text-center">
          <Link href="/" className="text-white/15 text-[9px] tracking-[0.2em] uppercase hover:text-white/35 transition-colors">← Home</Link>
        </div>
      </div>
      <ProtocolFooter />
    </div>
  );
}
