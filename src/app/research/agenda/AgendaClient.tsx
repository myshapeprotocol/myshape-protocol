"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import { playTick } from "@/utils/useAudioTick";
import "./agenda.css";

const STATUS_DOT: Record<string, string> = {
  "Active Research": "#4ade80",
  Investigating: "#facc15",
  Conceptual: "#60a5fa",
};

const QUESTIONS = [
  {
    num: "Q1",
    question: "Can biological continuity be measured?",
    status: "Investigating",
    detail:
      "Is there a statistically separable signal in human motion that persists across sessions, hardware, and environments — and can it be quantified as a continuity score?",
    note: "Dependent on PES Benchmark stability validation. Current evidence: Cohen's d = 2.1, AUC = 0.94 (54 samples).",
    link: { href: "/research/notes/001-the-continuity-problem", label: "RN #001 — The Continuity Problem" },
  },
  {
    num: "Q2",
    question: "Can continuity survive replay attacks?",
    status: "Investigating",
    detail:
      "Under what conditions can a continuity proof be replayed, simulated, or adversarially synthesized? What is the minimum signal dimension that resists attack?",
    note: "Requires quantification of anti-replay thresholds in a controlled Replay Benchmark.",
  },
  {
    num: "Q3",
    question: "Can continuity transfer to autonomous agents?",
    status: "Conceptual",
    detail:
      "If a human delegates agency to an AI, does continuity transfer? How do we define 'entropy of presence' for an agent with no biological substrate?",
    note: "Core challenge: defining existence entropy for non-biological entities. This may become the defining question of the post-agent era.",
  },
  {
    num: "Q4",
    question: "Can continuity become a protocol primitive?",
    status: "Active Research",
    detail:
      "If continuity is measurable and verifiable, can it be encoded as a cryptographic primitive — alongside identity, encryption, and consensus — in decentralized protocols?",
    note: "Active prototype: Continuity Receipt format. Exploring ZK-friendly encoding of motion-derived continuity proofs.",
    link: { href: "/research/notes/001-the-continuity-problem", label: "RN #001 — The Continuity Problem" },
  },
];

export default function AgendaClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 pt-28 pb-16">
        {/* ── Hero ── */}
        <section className="agenda-hero">
          <div className="flex items-center gap-3 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3fb950]/20 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3fb950] shadow-[0_0_8px_rgba(63,185,80,0.5)]" />
            </span>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#90c8ff]/55">
              &gt; research_agenda <span className="text-white/20">--live</span>
            </span>
            <span className="font-mono text-[8px] tracking-[0.2em] text-white/15 ml-auto">Q1–Q4</span>
          </div>
          <h1 className="agenda-tagline">
            Researching <span>verifiable continuity</span> in the digital world.
          </h1>
        </section>

        {/* ── Three Numbers ── */}
        <section className="agenda-numbers">
          <div
            className="agenda-number-card"
            onMouseEnter={() => playTick(660, "sine", 0.05, 0.025)}
          >
            <div className="agenda-number">1</div>
            <div className="agenda-number-label">Research Note</div>
          </div>
          <div className="agenda-number-divider" />
          <div
            className="agenda-number-card"
            onMouseEnter={() => playTick(660, "sine", 0.05, 0.025)}
          >
            <div className="agenda-number">1</div>
            <div className="agenda-number-label">Benchmark</div>
          </div>
          <div className="agenda-number-divider" />
          <div
            className="agenda-number-card"
            onMouseEnter={() => playTick(880, "triangle", 0.05, 0.025)}
          >
            <div className="agenda-number agenda-number-gold">4</div>
            <div className="agenda-number-label">Core Questions</div>
          </div>
        </section>

        {/* ── What this is ── */}
        <section className="agenda-section">
          <p className="agenda-primer">
            This is not a product roadmap. It is a{" "}
            <strong>research agenda</strong> — a living document that defines
            the questions we are investigating, the status of each
            investigation, and the experiments that could falsify our current
            hypotheses.
          </p>
        </section>

        {/* ── Manifesto ── */}
        <section className="agenda-manifesto">
          <blockquote className="agenda-blockquote">
            <p className="agenda-blockquote-text">
              We do not defend hypotheses.
              <br />
              We design experiments that can falsify them.
            </p>
            <cite className="agenda-blockquote-cite">
              — The Continuity Lab Manifesto, Article I
            </cite>
          </blockquote>
        </section>

        {/* ── Research Questions ── */}
        <section className="agenda-section">
          <h2 className="agenda-section-heading">The Research Agenda</h2>

          <div className="agenda-questions">
            {QUESTIONS.map((q, i) => (
              <div
                key={q.num}
                className="agenda-question-card"
                onMouseEnter={() => playTick(460 + i * 40, "sine", 0.045, 0.022)}
              >
                <div className="agenda-question-header">
                  <span className="agenda-question-num">{q.num}</span>
                  <span className="agenda-question-status" data-status={q.status}>
                    <span
                      className="agenda-status-dot"
                      style={{ backgroundColor: STATUS_DOT[q.status] }}
                    />
                    {q.status}
                  </span>
                </div>
                <h3 className="agenda-question-title">{q.question}</h3>
                <p className="agenda-question-detail">{q.detail}</p>
                <p className="agenda-question-note">{q.note}</p>
                {q.link && (
                  <Link
                    href={q.link.href}
                    className="agenda-question-link"
                    onMouseEnter={() => playTick(540, "sine", 0.04, 0.02)}
                  >
                    <span className="agenda-question-link-arrow">→</span>{" "}
                    {q.link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Methodology ── */}
        <section className="agenda-section">
          <h2 className="agenda-section-heading">How We Work</h2>
          <div className="agenda-methods">
            {[
              { n: "01", t: "State the hypothesis", d: "Every Research Note begins with a falsifiable claim — not a position we are committed to defending." },
              { n: "02", t: "Design the experiment", d: "What evidence would prove the hypothesis wrong? We build the benchmark before we write the conclusion." },
              { n: "03", t: "Publish the evidence", d: "Results, data, and threats to validity are published together. Negative results are results." },
              { n: "04", t: "Update the agenda", d: "Every experiment closes some questions and opens others. This page reflects our current best understanding — not our final answers." },
            ].map((m, i) => (
              <div
                key={m.n}
                className="agenda-method-card"
                onMouseEnter={() => playTick(380 + i * 50, "triangle", 0.04, 0.02)}
              >
                <div className="agenda-method-num">{m.n}</div>
                <div className="agenda-method-title">{m.t}</div>
                <div className="agenda-method-desc">{m.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <div className="agenda-footer">
          <p className="agenda-footer-text">
            Last updated: 2026-07-08 ·{" "}
            <Link href="/research">← Research Hub</Link>
            {" · "}
            <Link href="/">Home</Link>
          </p>
          <p className="agenda-footer-credits">
            The Continuity Lab is a research program investigating whether
            continuity can become a verifiable property of the digital world.
            We are not building a product. We are investigating a question.
          </p>
        </div>
      </div>

      <ProtocolFooter />
    </div>
  );
}
