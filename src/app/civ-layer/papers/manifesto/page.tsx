"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ProtocolFooter from "@/components/footer/footer";

const sections = [
  { 
    id: '01', 
    title: 'Motion as Identity', 
    subtitle: 'PAPER_01 // BIOMETRIC_EVOLUTION', 
    content: [
      "Motion is the only human signal that cannot be copied, predicted, or reconstructed without the individual. Biometrics can be stored. Faces can be replicated. Voices can be synthesized. But motion—micro‑timing, micro‑force, micro‑variation—is a living geometry.",
      "It is generated in real time, shaped by the nervous system, and inseparable from the body that produces it. Every movement contains a signature: a pattern of acceleration, hesitation, correction, and intention.",
      "These patterns form behavior vectors—irreversible, unrepeatable, and impossible to forge. They are not 'data points' but expressions of the human system in motion. Biometrics extract identity; motion expresses identity. Biometrics freeze a human into a static record; motion reveals a human as a dynamic process.",
      "Because motion is generated locally and cannot be reconstructed externally, it becomes the foundation for a sovereign identity layer. Identity returns to the human because only the human can produce the signal that defines it."
    ]
  },
  { 
    id: '02', 
    title: 'The Data Body', 
    subtitle: 'PAPER_02 // ARCHITECTURAL_BOUNDARY', 
    content: [
      "In the platform era, the human boundary dissolved. Data leaked outward, was copied across systems, and accumulated in places the individual could not see. The human became a source, not a sovereign.",
      "A data body is not a database. It is a boundary. It defines what belongs to the individual and what cannot be extracted. It is a structure, not a storage unit. It holds a perimeter, not a profile.",
      "The data body ensures that identity cannot be reconstructed from fragments, inferred from patterns, or absorbed into platforms. A true data body is non‑replicable. Even with full access to signals, no system can recreate the individual. The data body restores the human boundary that the platform era erased."
    ]
  },
  { 
    id: '03', 
    title: 'Zero‑Knowledge Presence', 
    subtitle: 'PAPER_03 // CRYPTOGRAPHIC_SOVEREIGNTY', 
    content: [
      "In the AI era, every piece of data—no matter how small—can be expanded, modeled, and reconstructed. Exposure is no longer a choice; it is a structural vulnerability. Identity must shift from disclosure to proof.",
      "A person should be able to verify a truth without revealing the underlying information. Proof becomes the mechanism of participation. Zero‑knowledge transforms identity into a system of selective truths.",
      "A system may know that a person is real, that they meet a requirement, or that they possess a trait—but it may not know who they are. Zero‑knowledge presence allows a human to exist in intelligent environments without dissolving into them. It is the minimum requirement for sovereignty in a world of inference."
    ]
  },
  { 
    id: '04', 
    title: 'The 3D Identity Model', 
    subtitle: 'PAPER_04 // MULTIDIMENSIONAL_SIGNAL', 
    content: [
      "A 2D identity—profile, record, database—cannot represent a human in the AI era. It is static, fragile, and easily reconstructed. Intelligence operates in layers, states, and contexts. Identity must do the same.",
      "A 3D identity is not a visual model. It is a structural model composed of Layers (behavioral, contextual, relational, temporal), States (verifying, observing, participating, silent), and Fields (the dynamic boundary of expression).",
      "In three dimensions, identity can maintain continuity without revealing totality. It can express presence without exposing essence. Identity becomes a field rather than a file—a living geometry that adapts to context while preserving the integrity of the individual."
    ]
  },
  { 
    id: '05', 
    title: 'The Sovereign Self', 
    subtitle: 'PAPER_05 // PHILOSOPHICAL_STANCE', 
    content: [
      "In the age of autonomous intelligence, the human must reclaim the right to exist without being absorbed. Sovereignty is not privacy. It is the right to remain intact.",
      "A sovereign self has the right to be partially visible, to reveal only what is necessary, and to remain opaque where exposure would dissolve the boundary of the self. It refuses to be reconstructed, profiled, or predicted.",
      "Sovereignty requires structure: local generation, uncopyable boundaries, proof without exposure, selective presence, and non‑replicability. These principles form the architecture of the sovereign self."
    ]
  },
  { 
    id: '06', 
    title: 'Identity in the Age of Autonomous Intelligence', 
    subtitle: 'PAPER_06 // SYSTEM_NEGOTIATION', 
    content: [
      "Humans now exist inside environments where intelligence is ambient, continuous, and autonomous. Identity is no longer a static label; it is a negotiation between human and system.",
      "In intelligent environments, identity is defined by the signals you generate, the boundaries you maintain, and the proofs you provide. Without a sovereign identity layer, humans dissolve into the systems that observe them.",
      "A sovereign identity layer allows humans to exist as intact entities in a world of distributed intelligence. It ensures that the human remains the source of identity, not the object of extraction."
    ]
  }
];

export default function PapersManifestoPage() {
  const [activeIndex, setActiveIndex] = useState('01');
  const observerRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => { for (const e of entries) { if (e.isIntersecting) setActiveIndex(e.target.id); } },
      { rootMargin: '-20% 0% -70% 0%', threshold: 0 }
    );
    document.querySelectorAll('section[id]').forEach(el => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30 antialiased">
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]"
           style={{ backgroundImage: `linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)`, backgroundSize: '45px 45px' }} />
      <BackgroundParticles />

      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-black/80 backdrop-blur-md px-6 md:px-10 py-5 flex justify-between items-center text-[10px] tracking-[0.4em]">
        <Link href="/civ-layer/papers" className="text-cyan-400/40 hover:text-cyan-400 transition-colors uppercase">← EXIT_RESEARCH</Link>
        <div className="text-white/20 uppercase font-bold tracking-[0.5em] hidden sm:block">RESEARCH_WHITEPAPER // CONSTITUTIONAL_CORE</div>
      </nav>

      <main className="relative z-10 pt-56 px-6 md:px-10 max-w-7xl mx-auto flex flex-col md:flex-row gap-24">
        {/* Sticky Sidebar */}
        <aside className="md:w-64 shrink-0 h-fit md:sticky md:top-56 hidden md:block">
          <div className="text-[9px] text-cyan-500/40 mb-12 tracking-[0.5em] uppercase font-bold">RESEARCH_INDEX</div>
          <ul className="space-y-10 border-l border-white/5 pl-6">
            {sections.map(s => {
              const isActive = s.id === activeIndex;
              return (
              <li key={s.id} className="group cursor-pointer">
                <a href={`#${s.id}`} className="block">
                  <div className={`text-[10px] font-bold mb-1 transition-colors duration-300 ${isActive ? 'text-cyan-400' : 'text-white/10 group-hover:text-cyan-400'}`}>{s.id}</div>
                  <div className={`text-[11px] uppercase tracking-[0.2em] transition-all duration-300 ${isActive ? 'text-cyan-300' : 'text-white/20 group-hover:text-cyan-400'}`}>
                    {s.title}
                  </div>
                </a>
              </li>
            )})}
          </ul>
        </aside>

        {/* Content Section */}
        <div className="flex-1 space-y-56 pb-48">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="group max-w-[750px] scroll-mt-56">
              <div className="flex items-center gap-6 mb-12">
                <span className="text-cyan-500/50 text-[10px] tracking-[0.6em] font-bold">{s.subtitle}</span>
                <div className="h-[1px] flex-1 bg-white/10 group-hover:bg-cyan-500/30 transition-colors duration-700" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-16 uppercase transition-all duration-700 group-hover:text-[#4fd1ed] group-hover:drop-shadow-[0_0_25px_rgba(79,209,237,0.8)]">
                {s.title}
              </h2>
              <div className="space-y-12 text-white/50 text-[18px] leading-[1.85] font-light text-justify font-mono opacity-80 group-hover:opacity-100 transition-all duration-700">
                {s.content.map((para, i) => <p key={i}>{para}</p>)}
              </div>
            </section>
          ))}
          
          {/* Footer Component */}
          <div className="mt-40 border-t border-white/5 pt-24">
            <ProtocolFooter />
          </div>
        </div>
      </main>
    </div>
  );
}