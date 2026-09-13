"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ResearchMeta from "@/components/research/ResearchMeta";
import RelatedResearch from "@/components/research/RelatedResearch";
import { playTick } from "@/utils/useAudioTick";
import "@/app/research/research.css";

export default function DatasetClient() {
  return (
    <div className="min-h-screen bg-[#051025] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-28 pb-16">
        <article className="note-article">

          <div className="note-meta">
            <ResearchMeta
              artifactId="DS-001"
              type="Dataset"
              status="Active"
              published="2026.07.04"
              updated="2026.07.10"
            />
          </div>

          <h1 className="note-title" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>
            Human Continuity Dataset
          </h1>
          <p className="note-subtitle">
            The primary research asset of The Continuity Lab. Growing monthly.
          </p>

          {/* ── Current Snapshot ── */}
          <section className="note-section">
            <h2>Current Snapshot</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Total Runs", value: "576" },
                { label: "Human Subjects", value: "~81" },
                { label: "AI Strategies", value: "4" },
                { label: "Countries", value: "3" },
              ].map((stat) => (
                <div key={stat.label} className="p-4 text-center"
                  style={{ border: "1px solid rgba(144,200,255,0.08)", background: "rgba(2,6,14,0.6)" }}>
                  <div className="text-[clamp(1.5rem,3vw,2.5rem)] font-light tracking-[-0.02em] text-[#90c8ff]/80">{stat.value}</div>
                  <div className="text-[11px] tracking-[0.15em] uppercase text-white/25 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Composition ── */}
          <section className="note-section">
            <h2>Composition</h2>

            <p><strong>Human motion (576 Experimental Runs).</strong> 30-second unstructured motion sequences from ~81 subjects. Standard webcam at 30 fps. MediaPipe Pose (33 landmarks). No choreography, no controlled environment. Ecological variability is intentional.</p>

            <p><strong>Synthetic motion (200 samples, 50 per strategy).</strong></p>
            <p>1. Random walk — Gaussian per-joint walk calibrated to human joint range.</p>
            <p>2. Spline interpolation — Human pose keyframes connected via Catmull-Rom splines.</p>
            <p>3. GAN-generated — Conditional GAN trained on human pose sequences.</p>
            <p>4. Near-static — Minimal displacement with escalating Gaussian noise.</p>

            <p><strong>All samples are anonymized.</strong> Joint coordinates only. No face data, no identity-linked templates, no PII. The dataset collects geometry, not identity.</p>
          </section>

          {/* ── Growth ── */}
          <section className="note-section">
            <h2>Growth Timeline</h2>

            <div className="space-y-3">
              {[
                { date: "2026.07.10", milestone: "DS-001 established as first-class Research Object. 576 Experimental Runs." },
                { date: "2026.07.04", milestone: "PES v0.2 recalibration across ~81 human subjects." },
                { date: "2026 Q3 (target)", milestone: "300+ human samples. Explicit coverage of age, mobility, and hardware diversity." },
                { date: "2026 Q4 (target)", milestone: "Longitudinal samples — same subjects across multiple sessions, days apart." },
              ].map((entry, i) => (
                <div key={i} className="flex gap-4 py-2"
                  style={{ borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                  <span className="font-mono text-[11px] text-white/25 shrink-0 mt-0.5">{entry.date}</span>
                  <span className="text-white/40 text-[12px] leading-relaxed"
                    style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
                    {entry.milestone}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Access ── */}
          <section className="note-section">
            <h2>Access</h2>
            <p>The dataset is currently used internally for benchmark development. We plan to release a public subset for peer review and independent verification. If you are a researcher interested in access before the public release, contact us via <a href="https://github.com/myshapeprotocol" className="underline decoration-[#90c8ff]/20 hover:decoration-[#90c8ff]/50 transition-colors">GitHub</a>.</p>

            <div className="note-blockquote">
              This dataset is not for sale. It is a research asset — built to be measured, challenged, and extended. Its value is not in its size, but in the continuity of its growth over years.
            </div>
          </section>

          <RelatedResearch
            supportedBy={[
              { id: "BM-001", label: "PES Benchmark v0.2", href: "/research/benchmarks" },
            ]}
            relatedNotes={[
              { id: "RN-002", label: "PES Benchmark v0.2", href: "/research/notes/002-pes-benchmark" },
            ]}
            referencedDecisions={[
              { id: "DL-001", label: "PES threshold set at 0.40", href: "/research" },
            ]}
          />

          <div className="note-footer">
            <p className="note-footer-text">
              The Continuity Lab · July 2026{" · "}
              <Link href="/research" onMouseEnter={() => playTick(420, "sine", 0.03, 0.018)}>← Research Hub</Link>
            </p>
            <p className="text-white/10 text-[11px] tracking-[0.1em] italic mt-4" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
              Every benchmark is temporary. Every question is permanent.
            </p>
          </div>
        </article>
      </div>
      <ProtocolFooter />
    </div>
  );
}
