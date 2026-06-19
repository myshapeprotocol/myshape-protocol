"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ProtocolFooter from "@/components/footer/footer";

const sections = [
  { 
    id: 'V01', 
    title: 'The Age of Distributed Intelligence', 
    subtitle: 'STRATEGY_PERSPECTIVE_01', 
    content: [
      "We are entering an era defined not by devices or platforms, but by the presence of intelligence everywhere. AI is no longer a tool that humans operate. It has become an ambient layer woven into every environment, every interaction, and every system. It observes, interprets, predicts, and acts—often before we are aware of the need for action.",
      "In this new landscape, intelligence is distributed across agents, models, and autonomous processes that operate continuously and invisibly. The boundary between human intention and machine inference has dissolved. We live inside a field of intelligence that surrounds us, responds to us, and increasingly anticipates us.",
      "This shift is not incremental. It is civilizational. It transforms how humans exist, how decisions are made, and how identity must function. A world of distributed intelligence requires a new structure for the self—one that can operate within an environment where everything is capable of understanding and acting."
    ]
  },
  { 
    id: 'V02', 
    title: 'The Collapse of Platform‑Centric Identity', 
    subtitle: 'STRATEGY_PERSPECTIVE_02', 
    content: [
      "For two decades, digital identity has been defined by platforms. A person existed online only through accounts, profiles, and credentials issued by systems they did not control. These structures were convenient in a world of isolated applications, but they were never designed for a reality where intelligence is continuous and autonomous.",
      "As AI systems began to infer, reconstruct, and model individuals from minimal traces, the weaknesses of platform‑centric identity became structural. A profile is no longer a harmless representation; it is a blueprint from which an entire behavioral model can be generated. A login is no longer a simple authentication; it is an entry point into a system that can observe, predict, and replicate.",
      "This architecture cannot survive the conditions of the AI era. A static account cannot anchor a dynamic human. A platform‑owned identity cannot protect a person from inference or replication. A fragmented profile cannot represent a life lived across agents, environments, and autonomous systems."
    ]
  },
  { 
    id: 'V03', 
    title: 'The Rise of the Digital Self', 
    subtitle: 'STRATEGY_PERSPECTIVE_03', 
    content: [
      "Human presence has expanded beyond the physical body into a continuous digital existence. Every interaction, movement, and expression generates a parallel self—one that persists, accumulates, and evolves independently of the physical world. This digital self is no longer a shadow or a record; it has become a primary mode of being, influencing decisions, opportunities, and relationships in ways the physical self cannot match.",
      "As intelligence becomes ambient, the digital self gains agency. It negotiates with systems, interacts with autonomous agents, and participates in environments that operate without human supervision. It carries our preferences, behaviors, and histories into contexts we may never directly encounter.",
      "Yet this self has no body of its own. It exists as fragments scattered across platforms, reconstructed by algorithms, and interpreted through models that do not belong to the individual. It is powerful but unanchored, present but unprotected. The digital self has become real, but it has not become sovereign."
    ]
  },
  { 
    id: 'V04', 
    title: 'The Need for a Sovereign Identity Layer', 
    subtitle: 'STRATEGY_PERSPECTIVE_04', 
    content: [
      "As intelligence becomes distributed and autonomous, the absence of a sovereign identity layer becomes a structural fault in the architecture of the digital world. Every system, agent, and environment now requires a way to recognize a human without possessing them. Yet the legacy model offers only two options: surrender data or be excluded.",
      "A sovereign identity layer is not a feature. It is the missing foundation of the AI era. It must allow a person to exist across systems without being fragmented, to be verified without being exposed, and to interact without being absorbed into the logic of platforms. It must restore the boundary between the human and the systems that surround them—without isolating the individual from the capabilities of AI.",
      "Such a layer cannot be owned by any company, platform, or institution. If identity is to remain human, it must be generated locally, expressed selectively, and anchored in a structure that belongs inherently to the individual. It must function as a constitutional layer beneath all digital environments, enabling presence without extraction and agency without surrender."
    ]
  },
  { 
    id: 'V05', 
    title: 'The Shape of a Human in the AI Era', 
    subtitle: 'STRATEGY_PERSPECTIVE_05', 
    content: [
      "A human in the AI era is no longer defined by a username, a profile picture, or a set of credentials scattered across platforms. These artifacts were sufficient when digital life was secondary—an extension of the physical world rather than a parallel domain. But as intelligence becomes ambient and the digital self gains agency, the structure of a human must evolve beyond the constraints of the platform era.",
      "To exist coherently in such an environment, a person needs a shape—a structure that can hold continuity without exposing totality, that can express selectively without surrendering control, and that can evolve without losing its core integrity. This shape cannot be two‑dimensional or platform‑defined. It must be a living data‑body: layered, adaptive, and inherently sovereign.",
      "In the AI era, the question is no longer “Who are you?” It is “What is the structure that allows you to exist without being consumed?” The answer is a shape that belongs only to the human."
    ]
  },
  { 
    id: 'V06', 
    title: 'The Vision of MyShape', 
    subtitle: 'STRATEGY_PERSPECTIVE_06', 
    content: [
      "The future will not be built on platforms that extract from individuals, nor on systems that reconstruct people from the traces they leave behind. It will be built on an identity structure that recognizes the human as a sovereign entity—one whose presence can be verified without being exposed, and whose agency can extend across intelligent environments without being surrendered.",
      "MyShape envisions a world where every person carries a digital body that belongs only to them: a multidimensional construct generated locally, expressed selectively, and capable of interacting with autonomous systems on their behalf. This body is not a representation but a boundary—one that protects the individual while enabling them to participate fully in a world of distributed intelligence.",
      "MyShape’s vision is simple: to give every human a shape that cannot be taken, copied, or owned— a structure that allows them to stand intact in the age of intelligence."
    ]
  }
];

export default function VisionManifestoPage() {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState('V01');
  const observerRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!mounted) return;
    observerRef.current = new IntersectionObserver(
      (entries) => { for (const e of entries) { if (e.isIntersecting) setActiveIndex(e.target.id); } },
      { rootMargin: '-20% 0% -70% 0%', threshold: 0 }
    );
    document.querySelectorAll('section[id]').forEach(el => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, [mounted]);
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      
      {/* 統一背景網格 - 調淡透明度至 0.05 */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.05]" 
           style={{ 
             backgroundImage: `linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)`, 
             backgroundSize: '45px 45px'
           }} />
      <BackgroundParticles />

      {/* 頂部導航 */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/80 backdrop-blur-md px-10 py-5 flex justify-between items-center text-[10px] tracking-[0.3em]">
        <Link href="/civ-layer/vision" className="text-cyan-400/60 hover:text-cyan-400 transition-colors uppercase">← EXIT_STRATEGY</Link>
        <div className="text-white/20 uppercase tracking-[0.5em] font-bold">Vision_Deep_Archive</div>
      </nav>

      <main className="relative z-10 pt-48 px-10 max-w-7xl mx-auto flex flex-col md:flex-row gap-24">
        
        {/* 左側側邊索引：鼠標懸停變色 */}
        <aside className="md:w-64 shrink-0 h-fit md:sticky md:top-48 hidden md:block border-l border-white/5 pl-6">
          <div className="text-[9px] text-cyan-500/40 mb-10 tracking-[0.4em] uppercase font-bold">Vision_Sequence</div>
          <ul className="space-y-8">
            {sections.map(s => {
              const isActive = s.id === activeIndex;
              return (
              <li key={s.id} className="group cursor-pointer">
                <a href={`#${s.id}`} className="block">
                  <div className={`text-[10px] mb-1 transition-colors duration-300 ${isActive ? 'text-cyan-400' : 'text-white/10 group-hover:text-cyan-400'}`}>{s.id}</div>
                  <div className={`text-[11px] uppercase tracking-[0.2em] transition-all ${isActive ? 'text-cyan-300' : 'text-white/20 group-hover:text-cyan-400'}`}>
                    {s.title}
                  </div>
                </a>
              </li>
            )})}
          </ul>
        </aside>

        {/* 文章主體內容 */}
        <div className="flex-1 space-y-56 pb-48">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="group scroll-mt-48 max-w-[750px]">
              
              {/* 副標題裝飾線 */}
              <div className="flex items-center gap-4 mb-10">
                <span className="text-cyan-500/50 text-[10px] tracking-[0.5em] font-bold uppercase transition-colors group-hover:text-cyan-400">
                  {s.subtitle}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent group-hover:from-cyan-500/30 transition-all duration-700" />
              </div>

              {/* 主標題：核心交互 - 鼠標掃過變淡藍發光 */}
              <h2 className="text-5xl font-extralight tracking-tighter text-white mb-12 uppercase cursor-default
                           transition-all duration-700 ease-out
                           group-hover:text-[#4fd1ed] group-hover:drop-shadow-[0_0_20px_rgba(79,209,237,0.8)]">
                {s.title}
              </h2>

              {/* 正文排版：保持左側邊框，兩端對齊文字磚 */}
              <div className="space-y-10 text-white/50 text-lg leading-[1.8] font-light 
                            text-justify font-mono border-l border-white/5 pl-8 
                            opacity-80 group-hover:opacity-100 group-hover:border-cyan-500/20 transition-all duration-700">
                {s.content.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          ))}
          
          <div className="mt-40 border-t border-white/5 pt-20">
            <ProtocolFooter />
          </div>
        </div>
      </main>
    </div>
  );
}