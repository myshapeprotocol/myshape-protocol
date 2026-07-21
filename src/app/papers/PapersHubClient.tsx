"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";
import Typewriter from "@/components/ui/Typewriter";
import "./papers.css";

const PAPERS = [
  { title: "Technical Specification v1", path: "/papers/technical-spec", desc: "Motion Vector format, PES engine, SST topology, proof system, and reference implementation.", tags: ["Technical Spec", "V1.0"], author: "MyShape Protocol · June 2026" },
  { title: "Threat Model", path: "/papers/threat-model", desc: "8 attack signatures, entropy gap theorem, cost model, and defense-in-depth architecture.", tags: ["Security Analysis", "V1.0"], author: "MyShape Protocol · June 2026" },
  { title: "Core Protocol", path: "/research/notes/008-continuity-protocol-core", desc: "Motion-Based Identity, Continuity, manifold projection, and the cryptographic foundations of geometric identity.", tags: ["Whitepaper", "V2.1"], author: "MyShape Protocol · 2026" },
  { title: "Protocol Architecture", path: "/protocol", desc: "Five-layer architecture: Capture → Geometry → Integrity → Proof → Identity. Security boundaries and data flow.", tags: ["Architecture", "V1.0"], author: "MyShape Protocol · 2026" },
  { title: "Civilization Roadmap", path: "/roadmap", desc: "Four-epoch roadmap spanning 20+ years. From geometry to civilization.", tags: ["Vision", "V1.0"], author: "MyShape Protocol · 2026" },
  { title: "Papers Manifesto", path: "/protocol/manifesto", desc: "The philosophical foundations: why motion, why geometry, why zero-knowledge.", tags: ["Philosophy", "V1.0"], author: "MyShape Protocol · 2026" },
];

export default function PapersHubClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16">
        <div className="space-y-4 mb-14">
          <div className="text-[#90c8ff]/50 text-[11px] tracking-[0.5em] uppercase">RESEARCH_&_DOCUMENTATION</div>
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.15em] text-white uppercase">Papers</h1>
          <p className="text-white/40 text-[12px] leading-relaxed max-w-xl">Technical documentation, security analysis, and architectural specifications for the MyShape Protocol.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PAPERS.map((p) => (
            <a key={p.path} href={p.path} className="pp-card" onMouseEnter={() => playTick(600, "sine", 0.10, 0.02)}>
              <div className="flex flex-wrap gap-1.5 mb-3">{p.tags.map((t) => (<span key={t} className="pp-tag">{t}</span>))}</div>
              <h3 className="pp-title">{p.title}</h3>
              <p className="pp-desc">{p.desc}</p>
              <p className="pp-author">{p.author}</p>
              <span className="pp-arrow">→</span>
            </a>
          ))}
        </div>
        <div className="mt-14 text-center">
          <Typewriter text="All papers are living documents. Updated as the protocol evolves." className="text-white/40 text-[11px] tracking-[0.15em]" />
        </div>
      </div>
      <ProtocolFooter />
    </div>
  );
}
