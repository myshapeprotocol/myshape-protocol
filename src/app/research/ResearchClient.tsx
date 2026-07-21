"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import { playTick } from "@/utils/useAudioTick";
import "./research.css";

const SPECS = [
  { id: "CPS-0001", title: "Continuity Protocol Core", desc: "Protocol object, semantics, trust model, verification contract. Engine-independent.", slug: "/research/notes/008-continuity-protocol-core", status: "v1.0-RC" },
  { id: "RFC-0001", title: "Motion Signature Format", desc: "PES, jerk detection, cross-modal matching, challenge-response.", slug: "/research/notes/004-motion-signature-rfc", status: "Draft" },
  { id: "RFC-0002", title: "Continuity Proof Format", desc: "Evidence receipts, CFC catalog, predecessor chaining.", slug: "/research/notes/006-continuity-proof-rfc", status: "Draft" },
];

const NOTES = [
  { id: "RN-003", title: "Cross-Modal Binding", desc: "576-run validation. Temporal alignment 100% across independent devices.", slug: "/research/notes/003-cross-modal-binding" },
  { id: "RN-002", title: "PES Benchmark v0.2", desc: "Presence Entropy Score benchmark. Human vs. synthetic.", slug: "/research/notes/002-pes-benchmark" },
  { id: "RN-001", title: "The Continuity Problem", desc: "Why proving 'I am still me' may be the missing primitive.", slug: "/research/notes/001-the-continuity-problem" },
];

const RECORDS = [
  { id: "FD-001", title: "Frame Rate Hypothesis", desc: "Failed experiment. More data ≠ better data.", slug: "/research/notes/005-failure-report-10fps" },
  { id: "DL-001", title: "Direction Asymmetry in EE-003", desc: "Operator observation. Pitch passes more than yaw.", slug: "/research/notes/007-ee003-direction-asymmetry" },
];

const ENGINES = [
  { engine: "EE-001", name: "Presence Detection", rate: "100% floor", slug: "/research/fusion" },
  { engine: "EE-002", name: "Causal Coupling", rate: "58% · N=316", slug: "/research/causal-coupling" },
  { engine: "EE-003", name: "Gyroscope Challenge", rate: "59% · N=200", slug: "/research/challenge-response" },
  { engine: "VS-001", name: "Dual-Engine Pipeline", rate: "93% · N=60", slug: "/research/protocol-verify" },
];

const DATASET = { id: "DS-001", name: "Continuity Dataset", status: "576 runs · 4 engines · HuggingFace", slug: "https://huggingface.co/ContinuityLab-Org/myshape-576" };

export default function ResearchClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-28 pb-16">

        {/* Hero */}
        <section className="research-hero">
          <div className="flex items-center gap-3 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3fb950]/20 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3fb950] shadow-[0_0_8px_rgba(63,185,80,0.5)]" />
            </span>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#90c8ff]/55">&gt; research_hub <span className="text-white/20">--index</span></span>
          </div>
          <h1 className="research-tagline">Investigating whether <span>continuity</span> can become a verifiable property of digital existence.</h1>
          <p className="research-subtitle">We are not building a product. We are investigating a question.</p>
        </section>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-3 mb-16">
          {[{ label: "Playground", href: "https://thecontinuitylab.org/lab/playground" },{ label: "GitHub", href: "https://github.com/myshapeprotocol" },{ label: "npm", href: "https://www.npmjs.com/package/@thecontinuitylab/myshape" },{ label: "HuggingFace", href: "https://huggingface.co/ContinuityLab-Org" }].map((l) => (
            <a key={l.label} href={l.href} className="px-4 py-2 border border-[#1E293B] text-[#60A5FA]/50 text-[10px] tracking-[0.12em] uppercase hover:border-[#60A5FA]/30 hover:text-[#60A5FA]/80 transition-all" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>{l.label}</a>
          ))}
        </div>

        {/* Specifications */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-1 rounded-full bg-[#d29922] shadow-[0_0_6px_rgba(210,153,34,0.5)]" />
            <h2 className="text-[10px] tracking-[0.4em] uppercase text-[#d29922]/70">Specifications</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SPECS.map((s) => (
              <Link key={s.id} href={s.slug} className="rn-card" onMouseEnter={() => playTick(520, "sine", 0.05, 0.02)}>
                <div className="rn-card-num"><span className="rn-card-dot" style={{background:"#d29922",boxShadow:"0 0 6px rgba(210,153,34,0.4)"}} />{s.id}</div>
                <div className="rn-card-title">{s.title}</div>
                <div className="rn-card-subtitle">{s.desc}</div>
                <div className="rn-card-date">{s.status}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Research Notes */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-1 rounded-full bg-[#60A5FA] shadow-[0_0_6px_rgba(96,165,250,0.5)]" />
            <h2 className="text-[10px] tracking-[0.4em] uppercase text-[#60A5FA]/70">Research Notes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {NOTES.map((n) => (
              <Link key={n.id} href={n.slug} className="rn-card" onMouseEnter={() => playTick(520, "sine", 0.05, 0.02)}>
                <div className="rn-card-num"><span className="rn-card-dot" />{n.id}</div>
                <div className="rn-card-title">{n.title}</div>
                <div className="rn-card-subtitle">{n.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Research Records */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-1 rounded-full bg-[#64748B] shadow-[0_0_4px_rgba(100,116,139,0.3)]" />
            <h2 className="text-[10px] tracking-[0.4em] uppercase text-[#64748B]/70">Research Records</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {RECORDS.map((r) => (
              <Link key={r.id} href={r.slug} className="rn-card" onMouseEnter={() => playTick(520, "sine", 0.05, 0.02)} style={{borderColor:"rgba(100,116,139,0.15)"}}>
                <div className="rn-card-num" style={{color:"rgba(100,116,139,0.6)"}}><span className="rn-card-dot" style={{background:"#64748B",boxShadow:"0 0 4px rgba(100,116,139,0.3)"}} />{r.id}</div>
                <div className="rn-card-title">{r.title}</div>
                <div className="rn-card-subtitle">{r.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Evidence Engines */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-1 rounded-full bg-[#34D399] shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
            <h2 className="text-[10px] tracking-[0.4em] uppercase text-[#34D399]/70">Evidence Engines</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ENGINES.map((e) => (
              <Link key={e.engine} href={e.slug} className="bm-card" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>
                <div className="bm-card-name">{e.name}</div>
                <div className="bm-card-status">{e.engine}</div>
                <div className="bm-card-meta">{e.rate}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Dataset */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-1 rounded-full bg-[#a371f7] shadow-[0_0_6px_rgba(163,113,247,0.5)]" />
            <h2 className="text-[10px] tracking-[0.4em] uppercase text-[#a371f7]/70">Dataset</h2>
          </div>
          <a href={DATASET.slug} className="rn-card block max-w-md" target="_blank" rel="noopener noreferrer" onMouseEnter={() => playTick(520, "sine", 0.05, 0.02)}>
            <div className="rn-card-num"><span className="rn-card-dot" style={{background:"#a371f7",boxShadow:"0 0 6px rgba(163,113,247,0.5)"}} />{DATASET.id}</div>
            <div className="rn-card-title">{DATASET.name}</div>
            <div className="rn-card-subtitle">{DATASET.status}</div>
          </a>
        </div>

        {/* Open Questions */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-1 rounded-full bg-[#d4af37] shadow-[0_0_6px_rgba(212,175,55,0.4)]" />
            <h2 className="text-[10px] tracking-[0.4em] uppercase text-[#d4af37]/70">Open Questions</h2>
          </div>
          <Link href="/research/open-questions/001" className="research-agenda-card" onMouseEnter={() => playTick(720, "sine", 0.06, 0.025)}>
            <div className="research-agenda-card-label">OQ-001</div>
            <div className="research-agenda-card-title">Can continuity exist independently of identity?<span className="research-agenda-card-arrow">→</span></div>
            <div className="research-agenda-card-desc">If continuity can be verified without persistent identifiers, humans, AI agents, and hybrid entities may share a common verification substrate.</div>
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.04] text-center">
          <Link href="/" className="text-white/35 text-[10px] tracking-[0.2em] uppercase hover:text-white/55 transition-colors">← Home</Link>
        </div>
      </div>
      <ProtocolFooter />
    </div>
  );
}
