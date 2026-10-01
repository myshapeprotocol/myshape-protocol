"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import { playTick } from "@/utils/useAudioTick";
import "@/app/research/research.css";

/**
 * Navigation-layer index for every page that exists under /research/notes.
 *
 * This file adds no research content and asserts no new claims. Each entry
 * mirrors the identifier and title already published by that note's own page
 * and by the Research Hub cards, and links to the real route.
 *
 * Note that the directory mixes artifact families: the hub groups RN entries
 * under "Research Notes" and RFC/FD/DL/CPS entries under "Specifications" and
 * "Research Records", but all of them are served from /research/notes/*. The
 * identifiers below are therefore the true per-page identifiers, not a
 * sequential RN-001..RN-009 run.
 */
const NOTES = [
  {
    id: "RN-001",
    title: "The Continuity Problem",
    kind: "Research Note",
    desc: "Why proving 'I am still me' may be the missing primitive.",
    slug: "/research/notes/001-the-continuity-problem",
  },
  {
    id: "RN-002",
    title: "PES Benchmark v0.2",
    kind: "Research Note",
    desc: "Presence Entropy Score benchmark. Human vs. synthetic.",
    slug: "/research/notes/002-pes-benchmark",
  },
  {
    id: "RN-003",
    title: "Cross-Modal Binding",
    kind: "Research Note",
    desc: "576-run validation. Temporal alignment 100% across independent devices.",
    slug: "/research/notes/003-cross-modal-binding",
  },
  {
    id: "RFC-0001",
    title: "Motion Signature Format",
    kind: "Specification",
    desc: "PES, jerk detection, cross-modal matching, challenge-response.",
    slug: "/research/notes/004-motion-signature-rfc",
  },
  {
    id: "FD-001",
    title: "Frame Rate Hypothesis",
    kind: "Research Record",
    desc: "Failed experiment. More data ≠ better data.",
    slug: "/research/notes/005-failure-report-10fps",
  },
  {
    id: "RFC-0002",
    title: "Continuity Proof Format",
    kind: "Specification",
    desc: "Evidence receipts, CFC catalog, predecessor chaining.",
    slug: "/research/notes/006-continuity-proof-rfc",
  },
  {
    id: "DL-001",
    title: "Direction Asymmetry in EE-003",
    kind: "Research Record",
    desc: "Operator observation. Pitch passes more than yaw.",
    slug: "/research/notes/007-ee003-direction-asymmetry",
  },
  {
    id: "CPS-0001",
    title: "Continuity Protocol Core",
    kind: "Specification",
    desc: "Protocol object, semantics, trust model, verification contract. Engine-independent.",
    slug: "/research/notes/008-continuity-protocol-core",
  },
  {
    id: "RN-005",
    title: "Two-Stage Continuity Verification",
    kind: "Research Note",
    desc: "",
    slug: "/research/notes/009-two-stage-continuity-verification",
  },
];

export default function NotesIndexClient() {
  return (
    <div className="min-h-screen bg-[#051025] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-28 pb-16">

        <section className="research-hero">
          <div className="flex items-center gap-3 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#60A5FA]/20 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#60A5FA] shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
            </span>
            <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-[#90c8ff]/55">
              &gt; research_notes<span className="text-white/20">--index</span>
            </span>
          </div>
          <h1 className="research-tagline">Every published artifact, in one index.</h1>
          <p className="research-subtitle">
            Navigation only. Each entry links to the artifact&rsquo;s own page,
            where the full text and its cross-references live.
          </p>
        </section>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-1 rounded-full bg-[#60A5FA] shadow-[0_0_6px_rgba(96,165,250,0.5)]" />
            <span className="text-[11px] tracking-[0.4em] uppercase text-[#60A5FA]/70">
              {NOTES.length} entries
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {NOTES.map((n) => (
              <Link
                key={n.id}
                href={n.slug}
                className="rn-card"
                onMouseEnter={() => playTick(520, "sine", 0.05, 0.02)}
              >
                <div className="rn-card-num">
                  <span className="rn-card-dot" />
                  {n.id}
                </div>
                <div className="rn-card-title">{n.title}</div>
                {n.desc ? <div className="rn-card-subtitle">{n.desc}</div> : null}
                <div className="rn-card-date">{n.kind}</div>
              </Link>
            ))}
          </div>
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
