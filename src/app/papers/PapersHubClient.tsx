"use client";
import ProtocolHeader from "@/components/header/header";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ProtocolFooter from "@/components/footer/footer";

const PAPERS = [
  {
    title: "Technical Specification v1",
    path: "/papers/technical-spec",
    desc: "Motion Vector format, PES engine, SST topology, proof system, and reference implementation. The engineering document.",
    tags: ["Core", "Engineers"],
  },
  {
    title: "Threat Model",
    path: "/papers/threat-model",
    desc: "8 attack signatures, entropy gap theorem, cost model, and defense-in-depth architecture across five layers.",
    tags: ["Security", "Researchers"],
  },
  {
    title: "Core Protocol",
    path: "/civ-layer/papers/core-protocol",
    desc: "Motion-Based Identity, ZK-Presence, manifold projection, and the cryptographic foundations of geometric identity.",
    tags: ["Core", "Whitepaper"],
  },
  {
    title: "Protocol Architecture",
    path: "/civ-layer/papers/protocol-architecture",
    desc: "Five-layer architecture: Capture → Geometry → Integrity → Proof → Identity. Security boundaries and data flow.",
    tags: ["Architecture", "Engineers"],
  },
  {
    title: "Civilization Roadmap",
    path: "/civ-layer/papers/civilization-roadmap",
    desc: "Four-epoch roadmap spanning 20+ years. From geometry to civilization. The long-term vision.",
    tags: ["Vision", "Strategy"],
  },
  {
    title: "Papers Manifesto",
    path: "/civ-layer/papers/manifesto",
    desc: "The philosophical foundations: why motion, why geometry, why zero-knowledge. Identity evolution.",
    tags: ["Philosophy", "Foundations"],
  },
];

export default function PapersHubClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-16">
        <div className="space-y-4 mb-14">
          <div className="text-cyan-500/50 text-[10px] tracking-[0.5em] uppercase">RESEARCH_&_DOCUMENTATION</div>
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.15em] text-white uppercase">Papers</h1>
          <p className="text-white/40 text-[12px] leading-relaxed max-w-xl">
            Technical documentation, security analysis, and architectural specifications
            for the MyShape Protocol.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PAPERS.map((p) => (
            <a key={p.path} href={p.path}
              className="group block border border-white/5 bg-black/30 p-6 hover:border-cyan-500/20 transition-all">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.tags.map((t) => (
                  <span key={t} className="text-cyan-400/30 text-[8px] tracking-[0.15em] uppercase px-2 py-0.5 border border-cyan-400/10">{t}</span>
                ))}
              </div>
              <h3 className="text-white/70 text-[11px] tracking-[0.2em] uppercase mb-2 group-hover:text-cyan-300/80 transition-colors">
                {p.title}
              </h3>
              <p className="text-white/25 text-[10px] leading-relaxed mb-3">{p.desc}</p>
              <span className="text-cyan-400/30 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all inline-block text-[10px]">→</span>
            </a>
          ))}
        </div>

        <div className="mt-14 p-6 border border-dashed border-white/8 text-center">
          <p className="text-white/20 text-[10px] tracking-[0.15em]">
            All papers are living documents. Updated as the protocol evolves.
          </p>
        </div>
      </div>

      <ProtocolFooter />
    </div>
  );
}
