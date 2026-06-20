"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";

const sections = [
  { 
    id: '01', 
    title: 'The Breakpoint', 
    subtitle: 'GENESIS // SEQUENCE_01', 
    content: [
      "The world crossed an invisible threshold long before anyone noticed. Identity, once a simple credential for logging into platforms, became the most extracted, replicated, and exploited resource of the digital age. What began as convenience evolved into a structural dependency: every interaction required surrender, every presence required exposure, and every expression was fragmented across systems that never belonged to the individual.",
      "The legacy identity stack was built for a world of screens and platforms, not for a world of autonomous agents and pervasive intelligence. It assumed that identity could remain static while the environment around it accelerated. It assumed that a two‑dimensional profile could represent a human being. It assumed that ownership of data could be negotiated after extraction.",
      "These assumptions no longer hold. AI has collapsed the distance between action and inference. A single trace can reveal an entire behavioral model. A single interaction can reconstruct a person. In this new environment, the old identity structure is not merely outdated — it is fundamentally incompatible with the conditions of the age.",
      "The breakpoint is simple: Human identity can no longer be something that platforms store. It must become something that humans are."
    ]
  },
  { 
    id: '02', 
    title: 'The Shift in Human Existence', 
    subtitle: 'GENESIS // SEQUENCE_02', 
    content: [
      "Human existence has quietly expanded beyond the physical body. We now inhabit a continuous digital field—one where actions, preferences, and expressions generate more presence than our physical form ever could. In this environment, identity is no longer a static record but a living construct shaped by behavior, context, and interaction.",
      "AI accelerated this shift. It dissolved the boundary between what we do and what can be inferred about us. Every gesture becomes a signal. Every signal becomes a model. Every model becomes a version of ourselves that operates independently across systems we do not control. The self has multiplied, but ownership has not.",
      "The legacy assumption—that identity can remain fixed while intelligence becomes ambient—has collapsed. A static profile cannot represent a dynamic human. A password cannot authenticate a multidimensional existence. A platform-owned account cannot anchor a life lived across agents, environments, and autonomous systems.",
      "In the AI era, identity must evolve from a representation to a protocol. It must become something that adapts, verifies, and expresses—without being extracted."
    ]
  },
  { 
    id: '03', 
    title: 'The Emergence of the Sovereign Data‑Body', 
    subtitle: 'GENESIS // SEQUENCE_03', 
    content: [
      "A new form of identity is beginning to surface—one that does not originate from platforms, accounts, or credentials. It emerges from the individual as a coherent, self-contained data‑body: transparent, dynamic, and sovereign by design. Unlike the legacy profile, it is not assembled from fragments scattered across systems. It is generated locally, expressed selectively, and never surrendered.",
      "The sovereign data‑body does not rely on storage to exist. It does not require extraction to function. It does not depend on trust in institutions that were never built to protect the individual. Instead, it operates through proofs—mathematical expressions of truth that reveal nothing beyond what is necessary. Presence becomes verifiable without exposure. Interaction becomes possible without disclosure.",
      "This shift is not cosmetic. It is structural. It redefines identity as something that belongs to the human, not the platform. It transforms the self from a resource to be managed into an entity that stands on its own.",
      "For the first time, identity becomes a living construct that cannot be owned, copied, or extracted. It becomes a sovereign form."
    ]
  },
  { 
    id: '04', 
    title: 'Why 3D Matters', 
    subtitle: 'GENESIS // SEQUENCE_04', 
    content: [
      "The shift to three dimensions is not an aesthetic choice. It is a structural necessity. A human identity in the AI era cannot be compressed into a flat record or a static profile. It must reflect the depth, variability, and continuity of a life lived across digital and physical environments. A 3D identity is not a model of the body—it is a model of existence.",
      "In three dimensions, identity becomes a field rather than a file. It can express context, adapt to interaction, and reveal only the layers required for a given moment. It can hold continuity without exposing totality. It can evolve without losing coherence. This is the minimum structure required for an entity that must operate across agents, protocols, and autonomous systems.",
      "AI does not interact with images or profiles; it interacts with patterns, behaviors, and multidimensional signals. A 2D identity cannot survive in such an environment. It cannot represent the complexity of a human, nor can it protect the individual from inference, reconstruction, or replication. Only a 3D construct—dynamic, layered, and sovereign—can anchor a person in a world where intelligence is ambient and ubiquitous.",
      "Three dimensions restore something the digital world had lost: the ability for a human to exist as a whole, without being exposed as a whole."
    ]
  },
  { 
    id: '05', 
    title: 'Why MyShape Exists', 
    subtitle: 'GENESIS // SEQUENCE_05', 
    content: [
      "Every era produces a structure that defines how humans exist within it. The industrial age produced the corporation. The internet age produced the platform. The AI age demands something different—an identity layer that is native to intelligence, not inherited from the logic of accounts and databases. MyShape exists because nothing in the current digital architecture is capable of supporting a sovereign human in a world where intelligence is ambient and autonomous.",
      "The existing systems were never designed to protect the individual. They were designed to extract, categorize, and optimize. They treat identity as a resource to be managed, not as an entity with its own integrity. As AI systems begin to act on behalf of humans, negotiate on their behalf, and infer their inner states from minimal signals, the absence of a sovereign identity layer becomes a structural risk, not an inconvenience.",
      "MyShape emerges as a response to this structural vacuum. It is not a product competing for attention; it is an attempt to rebuild the foundation on which digital existence stands. It introduces a form of identity that is generated locally, expressed selectively, and owned inherently. It restores the boundary between the human and the systems that surround them—without isolating the individual from the capabilities of AI.",
      "This is not a matter of innovation. It is a matter of necessity. The world has changed, but the structure of identity has not. MyShape exists to correct that imbalance."
    ]
  },
  { 
    id: '06', 
    title: 'The Mission', 
    subtitle: 'GENESIS // SEQUENCE_06', 
    content: [
      "The mission of MyShape is to restore sovereignty to human identity in an age where intelligence is everywhere and ownership has collapsed. It establishes a structure in which a person can exist digitally without being replicated, verified without being exposed, and recognized without being reduced to data held by others. It offers a foundation where identity is not a commodity but a constitutional right embedded into the architecture of interaction.",
      "This mission is not about creating a new platform or competing within the existing ecosystem. It is about redefining the layer beneath all ecosystems—the layer that determines who a human is when systems, agents, and environments all operate autonomously. MyShape introduces a protocol where identity is generated locally, expressed selectively, and evolves with the individual. It ensures that the human remains the primary locus of agency, even as intelligence becomes distributed and pervasive.",
      "The future will not be built by systems that extract from people, but by systems that recognize them as sovereign entities. MyShape’s mission is to make that future possible. To give every human a shape that belongs only to them. To anchor existence in a form that cannot be taken."
    ]
  }
];

export default function GenesisManifestoPage() {
  const [activeIndex, setActiveIndex] = useState('01');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveIndex(entry.target.id);
        }
      },
      { rootMargin: '-20% 0% -70% 0%', threshold: 0 }
    );
    const els = document.querySelectorAll('section[id]');
    els.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      {/* 細微落星背景 */}
      <BackgroundParticles />

      {/* 1. 固定導航欄 (Fixed Top Nav) */}
      <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-black/80 backdrop-blur-md px-10 py-5 flex justify-between items-center text-[10px] tracking-[0.4em]">
        <Link href="/civ-layer/genesis" className="text-cyan-400/70 hover:text-cyan-300 transition-colors uppercase">← EXIT_ARCHIVE</Link>
        <div className="text-white/20 uppercase font-bold tracking-[0.5em]">GENESIS_MANIFESTO // DATA_SEQUENCE</div>
      </nav>

      <main className="relative z-10 pt-56 px-10 max-w-7xl mx-auto flex flex-col md:flex-row gap-24 ">

        {/* 2. 固定側邊導航 (Sticky Sidebar Index) */}
        <aside className="md:w-64 shrink-0 h-fit md:sticky md:top-56 hidden md:block">
          <div className="text-[9px] text-cyan-500/40 mb-12 tracking-[0.5em] uppercase font-bold">ARCHIVE_INDEX</div>
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

        {/* 3. 內容區域 (Content Area) */}
        <div className="flex-1 space-y-56 pb-48">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="group max-w-[750px] scroll-mt-56">
              
              {/* 段落裝飾線條 - 滑鼠移動會變色 */}
              <div className="flex items-center gap-6 mb-12">
                <span className="text-cyan-500/50 text-[10px] tracking-[0.6em] font-bold">{s.subtitle}</span>
                <div className="h-[1px] flex-1 bg-white/10 group-hover:bg-cyan-500/30 transition-colors duration-700" />
              </div>

              {/* 段落大標題 - 滑鼠移動會變色且發光 */}
              <h2 className="text-5xl font-bold tracking-tighter text-white mb-16 uppercase cursor-default
                             transition-all duration-700 ease-out
                             group-hover:text-[#4fd1ed] group-hover:drop-shadow-[0_0_25px_rgba(79,209,237,0.8)]">
                {s.title}
              </h2>

              {/* 段落正文 - 兩端對齊 & 現代間距 */}
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

          {/* 底部組件 */}
          <div className="mt-40 border-t border-white/5 pt-24">
            <ProtocolFooter />
          </div>
        </div>
      </main>
    </div>
  );
}