"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";

const sections = [
  { 
    id: '01', 
    title: 'Identity as a Local Construct', 
    subtitle: 'PROTOCOL_MANIFESTO // DATA_SEQUENCE_01', 
    content: [
      "Identity in the AI era cannot be something that platforms store or systems reconstruct. It must originate from the individual as a local construct—generated on the device, shaped by behavior, and expressed only when necessary. This principle reverses the logic of the platform age, where identity was assembled from data extracted across environments and held in databases beyond the individual’s control.",
      "A local identity is not a record but a process. It exists only when invoked, adapts to context, and disappears when no longer needed. It does not persist as a static profile vulnerable to inference or replication. Instead, it is regenerated from the individual’s own signals, ensuring that identity remains inseparable from the person it represents.",
      "This shift establishes a foundational truth: identity belongs to the human because it is created by the human, not stored by the system."
    ]
  },
  { 
    id: '02', 
    title: 'The Boundary of the Data‑Body', 
    subtitle: 'PROTOCOL_MANIFESTO // DATA_SEQUENCE_02', 
    content: [
      "The integrity of identity does not come from the data it contains, but from the boundary that defines what belongs to the individual and what does not. In the platform era, this boundary was dissolved: data flowed outward, was copied across systems, and accumulated in places the individual could neither see nor control. The human became a source, not a sovereign.",
      "A data‑body restores this boundary. It is not a repository of information but a structure that determines how identity can be expressed without being extracted. It holds no centralized record, no persistent profile, and no transferable core. Instead, it defines the limits within which identity can operate—what can be revealed, what must remain private, and what can be proven without exposure.",
      "This boundary is the essence of sovereignty. It ensures that identity cannot be reconstructed from fragments, replicated by systems, or absorbed into platforms. It allows the individual to exist digitally without dissolving into the environments that observe them.",
      "A data‑body is not defined by what it contains, but by what it protects."
    ]
  },
  { 
    id: '03', 
    title: 'Proof Without Exposure', 
    subtitle: 'PROTOCOL_MANIFESTO // DATA_SEQUENCE_03', 
    content: [
      "In a world where intelligence can infer a person from the smallest trace, exposure becomes a structural risk. Every piece of data revealed—no matter how trivial—can be expanded, modeled, and reconstructed by systems operating at a scale no human can perceive. The traditional assumption that identity must be verified through disclosure is no longer compatible with the conditions of the AI era.",
      "Proof must replace exposure. Verification must occur without revealing the underlying information. Presence must be established without surrendering the self.",
      "This principle transforms identity from a collection of data into a system of selective truths. Instead of revealing who a person is, the identity layer reveals only what is necessary for a specific interaction: that they are human, that they meet a requirement, that they possess a trait—nothing more. The individual remains intact behind the proof, protected by a boundary that cannot be reverse‑engineered.",
      "This shift is not a technical optimization; it is a philosophical correction. It restores the idea that identity is something a human expresses, not something a system extracts. It ensures that the self can participate in intelligent environments without dissolving into them.",
      "Proof becomes the language of sovereignty."
    ]
  },
  { 
    id: '04', 
    title: 'Selective Presence', 
    subtitle: 'PROTOCOL_MANIFESTO // DATA_SEQUENCE_04', 
    content: [
      "In intelligent environments, presence is no longer a binary state. A person is not simply “logged in” or “logged out.” They exist across multiple contexts simultaneously—observed by systems, interpreted by agents, and represented through models that operate independently of their awareness. In such a world, full exposure is not participation; it is vulnerability.",
      "Selective presence becomes the foundation of digital sovereignty. It allows an individual to reveal only the dimension of themselves that a specific interaction requires—nothing more. A system may need to know that a person is real, but not who they are. An agent may need to confirm a capability, but not access the underlying data. A service may need to verify eligibility, but not identity.",
      "This principle transforms identity from a static profile into a dynamic field of controlled expression. The individual becomes the source of truth, deciding which layer, which signal, and which proof is appropriate for each moment. The data‑body adapts without fragmenting, expresses without exposing, and participates without dissolving into the systems that observe it.",
      "Selective presence is not a privacy feature. It is the structural requirement for existing as a sovereign entity in a world where intelligence is ambient, continuous, and capable of inference at scale."
    ]
  },
  { 
    id: '05', 
    title: 'The 3D Identity Structure', 
    subtitle: 'PROTOCOL_MANIFESTO // DATA_SEQUENCE_05', 
    content: [
      "A sovereign identity cannot exist as a flat record. A two‑dimensional profile collapses the complexity of a human into a static snapshot—easy to store, easy to copy, and easy to reconstruct. In the AI era, such a structure is not merely insufficient; it is unsafe. Intelligence operates in layers, contexts, and states. Identity must do the same.",
      "A 3D identity is not a visual model of the person. It is a protocol structure composed of layers that represent different dimensions of the self—behavioral, contextual, relational, and temporal. Each layer can be invoked independently, expressed selectively, and proven without exposing the others. This creates a dynamic boundary that adapts to the environment while preserving the integrity of the individual.",
      "In three dimensions, identity becomes a field rather than a file. It can hold continuity without revealing totality. It can express presence without exposing essence. It can evolve without losing coherence.",
      "The 3D structure also introduces states—modes of existence that reflect how a person interacts with intelligent systems. A human may be verifying, observing, participating, or remaining silent. Each state determines which layer of the data‑body is active and what can be proven. This prevents overexposure and ensures that identity remains sovereign even in environments capable of inference at scale.",
      "A 3D identity is not a representation of the human. It is the minimum structure required for a human to exist safely and coherently in a world of distributed intelligence."
    ]
  },
  { 
    id: '06', 
    title: 'The Principles of MyShape', 
    subtitle: 'PROTOCOL_MANIFESTO // DATA_SEQUENCE_06', 
    content: [
      "A sovereign identity layer cannot rely on trust, storage, or institutional guarantees. It must be grounded in principles that hold regardless of who implements it, who interacts with it, or how intelligence evolves. These principles define the constitutional structure of MyShape—the rules that ensure identity remains human, even in a world where intelligence is pervasive and autonomous.",
      "· Local Generation — Identity must originate from the individual. It cannot be issued, stored, or reconstructed by external systems. A person exists digitally because they generate their own data‑body, not because a platform grants them an account.",
      "· Sovereign Boundaries — The data‑body must have a boundary that cannot be crossed, copied, or dissolved. This boundary defines what belongs to the individual and prevents systems from reconstructing or absorbing the self.",
      "· Proof Over Exposure — Verification must occur through proofs, not disclosure. Systems may confirm a truth, but they may not access the underlying data.",
      "· Selective Expression — Identity must be capable of appearing in layers, states, and contexts. A person reveals only the dimension required for an interaction, preserving the integrity of the whole.",
      "· Non‑Replicability — A data‑body is designed to resist duplication. Even with full access to signals, recreating the individual is computationally infeasible. Identity must remain singular, inseparable, and untransferable.",
      "· Composability Without Surrender — Identity must integrate with systems, agents, and environments without being absorbed by them. It must participate without being owned, and interact without being extracted."
    ]
  }
];

export default function ProtocolManifesto() {
  const [activeIndex, setActiveIndex] = useState('01');
  const [tocShow, setTocShow] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveIndex(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0% -70% 0%', threshold: 0 }
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const check = () => { const f = document.querySelector("footer"); if (f) setTocShow(f.getBoundingClientRect().top > window.innerHeight * 0.5); };
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">

      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]"
           style={{ zIndex: 0, backgroundImage: `linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)`, backgroundSize: '45px 45px' }} />

      {/* BackgroundParticles */}
      <BackgroundParticles />

      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-black/80 backdrop-blur-md px-10 py-5 flex justify-between items-center text-[10px] tracking-[0.4em]">
        <Link href="/protocol" className="text-[#90c8ff]/70 hover:text-[#90c8ff] transition-colors uppercase">← EXIT_ARCHIVE</Link>
        <div className="text-white/20 uppercase font-bold tracking-[0.5em]">PROTOCOL_MANIFESTO // DATA_SEQUENCE</div>
      </nav>

      <main className="relative z-10 pt-56 px-10 max-w-7xl mx-auto flex flex-col md:flex-row gap-24">

        {/* Sidebar Nav */}
        <div className="md:w-64 shrink-0 hidden md:block" />
        <aside className="hidden md:block" style={{
          position: "fixed", top: "224px", width: "256px",
          left: "calc((100vw - 1280px) / 2 + 40px)",
          opacity: tocShow ? 1 : 0, pointerEvents: tocShow ? "auto" : "none",
          transition: "opacity 0.3s", zIndex: 10,
        }}>
          <div className="text-[10px] text-[#90c8ff]/40 mb-12 tracking-[0.5em] uppercase font-bold">ARCHIVE_INDEX</div>
          <ul className="space-y-10 border-l border-white/5 pl-6">
            {sections.map(s => {
              const isActive = s.id === activeIndex;
              return (
                <li key={s.id} className="group cursor-pointer">
                  <a href={'#' + s.id} className="block"
                     style={isActive ? { borderLeft: '2px solid #90c8ff', paddingLeft: '22px', marginLeft: '-24px' } : {}}>
                    <div
                      className={isActive ? 'text-[#90c8ff] font-bold text-[13px] transition-all duration-300 mb-1' : 'text-white/10 text-[10px] transition-all duration-300 mb-1'}
                      style={isActive ? { textShadow: '0 0 12px rgba(144,200,255,0.7)' } : {}}>
                      {s.id}
                    </div>
                    <div
                      className={(isActive ? 'text-[#90c8ff] font-bold opacity-100' : 'text-white/20 group-hover:text-[#90c8ff]/80') + ' text-[12px] uppercase tracking-[0.2em] transition-all duration-300'}>
                      {s.title}
                    </div>
                    {isActive && (
                      <div className="text-[8px] tracking-[0.3em] text-[#90c8ff]/60 mt-1.5 animate-pulse">
                        [ READING_SYNC ]
                      </div>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-56 pb-48">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="group max-w-[750px] scroll-mt-56">
              
              {/* Decoration Line */}
              <div className="flex items-center gap-6 mb-12">
                <span className="text-[#90c8ff]/50 text-[10px] tracking-[0.6em] font-bold">{s.subtitle}</span>
                <div className="h-[1px] flex-1 bg-white/10 group-hover:bg-[#90c8ff]/30 transition-colors duration-700" />
              </div>

              {/* Title with Hover Effect */}
              <h2 className="text-5xl font-bold tracking-tighter text-white mb-16 uppercase cursor-default
                           transition-all duration-700 ease-out
                           group-hover:text-[#4fd1ed] group-hover:drop-shadow-[0_0_25px_rgba(79,209,237,0.8)]">
                {s.title}
              </h2>

              {/* Paragraphs with Justified Text */}
              <div className="space-y-12 text-white/50 text-[18px] leading-[1.85] font-light 
                            text-justify tracking-normal font-mono opacity-80 group-hover:opacity-100 transition-all duration-700">
                {s.content.map((para, i) => (
                  <p key={i}>
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}

          {/* Footer */}
          <div className="mt-40 border-t border-white/5 pt-24">
            <ProtocolFooter />
          </div>
        </div>
      </main>
    </div>
  );
}