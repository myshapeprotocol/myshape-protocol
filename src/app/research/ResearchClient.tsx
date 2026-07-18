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
  {
    num: "002",
    title: "PES Benchmark v0.2",
    subtitle:
      "Dataset, Cohen's d, precision/recall, and threats to validity for the Presence Entropy Score.",
    date: "2026.07.10",
    slug: "/research/notes/002-pes-benchmark",
  },
  {
    num: "003",
    title: "Cross-Modal Binding",
    subtitle:
      "Proving that independent sensor streams originate from the same physical event — a new verification primitive.",
    date: "2026.07.13",
    slug: "/research/notes/003-cross-modal-binding",
  },
  {
    num: "004",
    title: "RFC-0001 — Motion Signature Format",
    subtitle:
      "A formal, implementable specification. Any team should be able to build a compatible verifier from this document alone.",
    date: "2026.07.18",
    slug: "/research/notes/004-motion-signature-rfc",
    isRFC: true,
  },
  {
    num: "005",
    title: "FD-001 — Frame Rate Hypothesis",
    subtitle:
      "We tested whether higher sampling improves cross-modal verification. It made things worse. Here's why.",
    date: "2026.07.18",
    slug: "/research/notes/005-failure-report-10fps",
    isFD: true,
  },
  {
    num: "007",
    title: "DL-001 — Direction Asymmetry in EE-003",
    subtitle:
      "Why up/down passes more than left/right. An operator observation, recorded for future calibration.",
    date: "2026.07.18",
    slug: "/research/notes/007-ee003-direction-asymmetry",
    isDL: true,
  },
  {
    num: "006",
    title: "RFC-0002 — Continuity Proof Format",
    subtitle:
      "How to prove that two temporally separated observations describe the same entity. Evidence receipts, hash chains, and CFC detection.",
    date: "2026.07.18",
    slug: "/research/notes/006-continuity-proof-rfc",
    isRFC: true,
  },
];

const OPEN_QUESTIONS = [
  {
    id: "OQ-001",
    title: "Can continuity exist independently of identity?",
    subtitle:
      "If continuity can be verified without persistent identifiers, humans, AI agents, and hybrid entities may share a common verification substrate.",
    date: "2026.07.10",
    slug: "/research/open-questions/001",
    status: "Active",
  },
];

const DATASET = {
  id: "DS-001",
  name: "Human Continuity Dataset",
  status: "281 samples · 54 subjects · Growing",
  meta: "Foundation of all continuity benchmarks",
  slug: "/research/dataset",
  date: "2026.07.10",
};

const ACTIVE_BENCHMARKS = [
  {
    name: "PES Benchmark",
    status: "v0.2 — 54 samples",
    meta: "Cohen's d: 2.1 · AUC: 0.94",
    slug: "/research/benchmarks",
  },
  {
    name: "PES Multi-Source",
    status: "v0.2 — 4 AI strategies",
    meta: "All AI sources below human floor (0.40)",
    slug: "/research/benchmarks",
  },
  {
    name: "Motion Pipeline E2E",
    status: "v0.2 — 128-dim signature",
    meta: "Human: 100% pass · AI: 0% pass",
    slug: "/research/benchmarks",
  },
];

const PIPELINE_RN = [
  { num: "004", title: "Replay Attack Analysis", subtitle: "Under what conditions can continuity proofs be replayed? Experimental evaluation." },
  { num: "005", title: "Challenge-Response", subtitle: "Interactive continuity verification without storing motion data." },
  { num: "006", title: "The Continuity Receipt", subtitle: "A proposed format for portable, verifiable continuity proofs." },
  { num: "007", title: "Agent Continuity", subtitle: "Can continuity be transferred between a human and their AI agent?" },
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

        {/* ── Mission ── */}
        <section className="mb-14 mt-10 max-w-2xl mx-auto text-center">
          <p className="text-white/50 text-[clamp(0.9rem,2vw,1.15rem)] font-light tracking-[0.03em] leading-relaxed"
            style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
            The Continuity Lab exists to transform <span style={{ color: "rgba(144,200,255,0.7)" }}>continuity</span> from a
            philosophical intuition into a <span style={{ color: "rgba(212,175,55,0.6)" }}>scientifically testable property</span> of the digital world.
          </p>
        </section>

        {/* ── Research Philosophy ── */}
        <section className="mb-16 mt-12 max-w-2xl mx-auto">
          <div className="p-6 md:p-8" style={{ border: "1px solid rgba(212,175,55,0.1)", background: "rgba(212,175,55,0.015)" }}>
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#d4af37]/40 mb-6">Lab Principles</div>
            <div className="space-y-3">
              {[
                "We test hypotheses. We do not defend them.",
                "We publish limitations before we publish claims.",
                "We measure before we assert.",
                "Evidence precedes belief.",
                "Continuity is not only what we study. It is how we work.",
              ].map((p, i) => (
                <p key={i} className="text-white/55 text-[13px] font-light tracking-[0.03em] leading-relaxed flex items-start gap-3"
                  style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
                  <span className="text-[#d4af37]/30 text-[10px] mt-0.5 shrink-0">0{i + 1}</span>
                  {p}
                </p>
              ))}
            </div>
          </div>
          <p className="mt-4 text-white/15 text-[10px] tracking-[0.1em] italic text-center">
            Every benchmark is temporary. Every question is permanent.
          </p>
        </section>

        {/* ── Lab Log ── */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3fb950]/40 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3fb950] shadow-[0_0_6px_rgba(63,185,80,0.5)]" />
            </span>
            <h2 className="text-white/70 text-[12px] tracking-[0.25em] uppercase font-bold">Lab Log</h2>
            <span className="text-white/15 text-[9px] tracking-[0.15em] ml-2">live</span>
          </div>

          <div className="space-y-0">
            {[
              {
                date: "2026.07.13",
                entry: "Published <a href='/research/notes/003-cross-modal-binding' class='underline decoration-[#90c8ff]/20 hover:decoration-[#90c8ff]/50 transition-colors'>RN #003 — Cross-Modal Binding</a>. Formalized the binding problem: proving two independent sensor streams originate from the same physical event. Introduced Event-Level Causal Coupling (EE-002), CFC-005 Causal Inversion, and the Evidence Object v1 data model.",
              },
              {
                date: "2026.07.10",
                entry: "Published <a href='/research/notes/002-pes-benchmark' class='underline decoration-[#90c8ff]/20 hover:decoration-[#90c8ff]/50 transition-colors'>RN #002 — PES Benchmark v0.2</a>. 281 samples, Cohen's d: 2.1, AUC: 0.94. Five threats to validity documented. The PES signal is real and measurable across four independent dimensions.",
              },
              {
                date: "2026.07.10",
                entry: "PES v0.2 recalibration complete. 309 tests across 100 suites — 100% passing. Published <a href='/research/benchmarks' class='underline decoration-[#90c8ff]/20 hover:decoration-[#90c8ff]/50 transition-colors'>Benchmarks</a> dashboard.",
              },
              {
                date: "2026.07.09",
                entry: "Published <a href='/research/notes/001-the-continuity-problem' class='underline decoration-[#90c8ff]/20 hover:decoration-[#90c8ff]/50 transition-colors'>RN #001 — The Continuity Problem</a>. Four attack scenarios where identity succeeds and continuity fails. The Continuity Lab launched.",
              },
              {
                date: "2026.07.08",
                entry: "Established <a href='/research/agenda' class='underline decoration-[#90c8ff]/20 hover:decoration-[#90c8ff]/50 transition-colors'>Research Agenda</a> with four core questions. Published the Continuity Lab Manifesto — first principle: test hypotheses, don't defend them.",
              },
              {
                date: "2026.07.04",
                entry: "PES v0.2 recalibration run across 54 human motion samples. Cohen's d: 2.1, AUC: 0.94. Entropy gap between human and AI motion holds at 0.40 threshold.",
              },
            ].map((log, i) => (
              <div
                key={log.date}
                className="flex gap-4 py-3 transition-colors duration-300 hover:bg-white/[0.02]"
                style={{ borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.03)" : "none" }}
              >
                <span className="font-mono text-[10px] tracking-[0.1em] text-white/30 shrink-0 mt-0.5">{log.date}</span>
                <p
                  className="text-white/45 text-[11px] leading-relaxed"
                  style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
                  dangerouslySetInnerHTML={{ __html: log.entry }}
                />
              </div>
            ))}
          </div>

          <p className="mt-4 text-white/15 text-[10px] tracking-[0.1em] italic text-center">
            Experimental log. Updated as work happens.
          </p>
        </section>

        {/* ── Decision Log ── */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <span className="font-mono text-[11px] tracking-[0.15em] text-[#a382dd]/40">DL</span>
            <h2 className="text-white/70 text-[12px] tracking-[0.25em] uppercase font-bold">Decision Log</h2>
            <span className="text-white/15 text-[9px] tracking-[0.15em] ml-2">institutional memory</span>
          </div>

          <div className="space-y-4">
            {[
              {
                id: "DL-003",
                date: "2026.07.10",
                decision: "Adopt artifact ID system across all research outputs.",
                reason: "Consistent citation identity (RN-001, BM-001, DL-001, OQ-001) transforms a collection of pages into a research ontology. Future collaborators should be able to reference outputs without ambiguity.",
                status: "Active",
              },
              {
                id: "DL-002",
                date: "2026.07.08",
                decision: "Establish The Continuity Lab as MyShape's research entity.",
                reason: "A protocol without a research arm is a product. A research arm without a protocol is a think tank. Together they form a lab — self-critical, evidence-driven, publish-first.",
                status: "Active",
              },
              {
                id: "DL-001",
                date: "2026.07.04",
                decision: "Set PES human-vs-AI classification threshold at 0.40.",
                reason: "Empirical finding: all 54 human samples scored ≥ 0.41 across 4D entropy dimensions. All synthetic strategies scored ≤ 0.38. The 0.03 gap is the entropy margin — irreducible under current AI generation models. Threshold will be recalibrated if new AI strategies narrow the gap.",
                status: "Active",
              },
            ].map((d) => (
              <div
                key={d.id}
                className="p-5 transition-all duration-300"
                style={{ border: "1px solid rgba(160,130,220,0.08)", background: "rgba(160,130,220,0.015)" }}
                onMouseEnter={(e) => {
                  playTick(420, "triangle", 0.03, 0.018);
                  e.currentTarget.style.borderColor = "rgba(160,130,220,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(160,130,220,0.08)";
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-[10px] tracking-[0.12em] text-[#a382dd]/50">{d.id}</span>
                  <span className="text-white/75 text-[12px] font-light tracking-[0.03em]"
                    style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
                    {d.decision}
                  </span>
                </div>
                <p className="text-white/35 text-[11px] leading-relaxed mb-2 ml-[68px]"
                  style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
                  <span className="text-white/20 text-[9px] tracking-[0.15em] uppercase">Reason: </span>
                  {d.reason}
                </p>
                <div className="flex items-center gap-3 ml-[68px]">
                  <span className="font-mono text-[9px] text-white/25">{d.date}</span>
                  <span className="font-mono text-[9px] tracking-[0.1em] text-[#3fb950]/40">{d.status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-white/15 text-[10px] tracking-[0.1em] italic text-center">
            Why we made the choices we made — so future collaborators can understand, challenge, or overturn them.
          </p>
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
                  <span className="rn-card-dot" style={(rn as any).isFD ? { background: "#f85149", boxShadow: "0 0 6px rgba(248,81,73,0.6)" } : (rn as any).isRFC ? { background: "#d29922", boxShadow: "0 0 6px rgba(210,153,34,0.4)" } : (rn as any).isDL ? { background: "#90c8ff", boxShadow: "0 0 6px rgba(144,200,255,0.5)" } : undefined} />
                  {(rn as any).isRFC ? `RFC-${rn.num}` : (rn as any).isFD ? `FD-${rn.num}` : (rn as any).isDL ? `DL-${rn.num}` : `RN #${rn.num}`}
                </div>
                <div className="rn-card-title">{rn.title}</div>
                <div className="rn-card-subtitle">{rn.subtitle}</div>
                <div className="rn-card-date">{rn.date}</div>
              </Link>
            ))}

            {ACTIVE_BENCHMARKS.map((bm) => (
              <Link
                key={bm.name}
                href={bm.slug}
                className="bm-card block"
                onMouseEnter={() => playTick(440, "triangle", 0.045, 0.025)}
              >
                <div className="bm-card-name">{bm.name}</div>
                <div className="bm-card-status">{bm.status}</div>
                <div className="bm-card-meta">{bm.meta}</div>
              </Link>
            ))}

            <div className="pipeline-section-label" style={{ color: "rgba(163,113,247,0.4)" }}>Dataset</div>
            <Link
              href={DATASET.slug}
              className="bm-card block"
              onMouseEnter={() => playTick(440, "triangle", 0.045, 0.025)}
            >
              <div className="bm-card-name">
                <span style={{ color: "rgba(163,113,247,0.6)", fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.15em" }}>{DATASET.id}</span>
                {" "}{DATASET.name}
              </div>
              <div className="bm-card-status">{DATASET.status}</div>
              <div className="bm-card-meta">{DATASET.meta}</div>
            </Link>

            <div className="pipeline-section-label" style={{ color: "rgba(212,175,55,0.4)" }}>Open Questions</div>
            {OPEN_QUESTIONS.map((oq) => (
              <Link
                key={oq.id}
                href={oq.slug}
                className="rn-card block"
                onMouseEnter={() => playTick(560, "sine", 0.05, 0.022)}
              >
                <div className="rn-card-num" style={{ color: "rgba(212,175,55,0.6)" }}>
                  <span className="rn-card-dot" style={{ background: "rgba(212,175,55,0.6)", boxShadow: "0 0 6px rgba(212,175,55,0.3)" }} />
                  {oq.id}
                  <span className="ml-2 font-mono text-[9px] tracking-[0.1em] text-[#d4af37]/40">{oq.status.toUpperCase()}</span>
                </div>
                <div className="rn-card-title">{oq.title}</div>
                <div className="rn-card-subtitle">{oq.subtitle}</div>
                <div className="rn-card-date">{oq.date}</div>
              </Link>
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

            <div className="pipeline-section-label" style={{ color: "rgba(144,200,255,0.4)" }}>Active Prototypes</div>
            <Link
              href="/research/protocol-verify"
              className="pipeline-item"
              onMouseEnter={() => playTick(530, "sine", 0.04, 0.022)}
            >
              <span className="pipeline-item-num" style={{ color: "rgba(212,153,34,0.6)" }}>VS-001</span>
              <span className="pipeline-item-title">Verification Session <span style={{color:"rgba(212,153,34,0.5)",fontSize:"9px",border:"1px solid rgba(212,153,34,0.3)",padding:"1px 6px",borderRadius:"3px",marginLeft:"6px"}}>Alpha</span></span>
              <span className="pipeline-item-subtitle">Dual-engine: Passive Evidence → Confidence Decision → Additional Evidence → Receipt</span>
            </Link>
            <Link
              href="/research/causal-coupling"
              className="pipeline-item"
              onMouseEnter={() => playTick(520, "sine", 0.04, 0.022)}
            >
              <span className="pipeline-item-num" style={{ color: "rgba(144,200,255,0.6)" }}>PE-001</span>
              <span className="pipeline-item-title">Event-Level Causal Coupling</span>
              <span className="pipeline-item-subtitle">Cross-modal causal verification — do IMU and Camera describe the same physical event?</span>
            </Link>

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

            <div className="pipeline-section-label" style={{ color: "rgba(212,153,34,0.4)" }}>Publications</div>
            <a
              href="https://myshape.substack.com/p/your-face-doesnt-matter"
              target="_blank"
              rel="noopener"
              className="pipeline-item"
              onMouseEnter={() => playTick(540, "sine", 0.04, 0.022)}
            >
              <span className="pipeline-item-num" style={{ color: "rgba(212,153,34,0.4)" }}>2026.07.14</span>
              <span className="pipeline-item-title">Your Face Doesn't Matter ↗</span>
              <span className="pipeline-item-subtitle">How biological entropy replaces identity verification — RN-002 on Substack</span>
            </a>
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
          <p className="text-white/20 text-[10px] tracking-[0.08em] leading-relaxed">
            <span className="text-[#d4af37]/30">The Continuity Lab</span> is the research and engineering arm of MyShape Protocol.
          </p>
          <a
            href="https://github.com/myshapeprotocol"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-1.5 text-[#90c8ff]/30 text-[9px] tracking-[0.2em] uppercase hover:text-[#90c8ff]/50 transition-colors"
            onMouseEnter={() => playTick(440, "sine", 0.025, 0.012)}
          >
            Explore Contributions →
          </a>
        </div>

        {/* ── Footer ── */}
        <div className="mt-12 pt-8 border-t border-white/[0.04] text-center">
          <Link
            href="/"
            className="text-white/35 text-[10px] tracking-[0.2em] uppercase hover:text-white/55 transition-colors"
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
