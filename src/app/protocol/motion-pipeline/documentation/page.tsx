"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";

const techSections = [
  {
    id: '01',
    title: 'Kinetic Ingestion',
    subtitle: 'CORE_API // SENSOR_LAYER',
    content: [
      "The pipeline begins with high-frequency kinetic capture. Local visual sensors stream raw skeletal frames at 60-120Hz. Image data exists only in volatile memory for the duration of vector extraction.",
      "The ingestion layer utilizes a lightweight pose estimation model identifying 24 key skeletal joints, converting visual pixels into a raw coordinate matrix."
    ]
  },
  {
    id: '02',
    title: 'Vector Anonymization',
    subtitle: 'ENGINE // GEOMETRIC_REDUCTION',
    content: [
      "To ensure sovereignty, raw coordinates are stripped of absolute spatial markers. The Geometry Engine calculates relative joint angles and micro-acceleration vectors.",
      "This creates an 'Identity Seed'—a normalized geometric signature that retains the rhythm of motion while discarding biological markers. The output is a pure behavior vector."
    ]
  },
  {
    id: '03',
    title: 'Visual Protocol V1.0',
    subtitle: 'SPECIFICATION // DATA_BODY_PRIMITIVE',
    isProtocol: true,
    content: [
      "GENESIS_VISUAL_PROTOCOL_V1.0",
      "TYPE: DATA-BODY_PRIMITIVE | STATUS: ACTIVE",
      "------------------------------------------",
      "2.1 // PARTICLE_LAYER: 800-1500 count | #A8E4FF | Perlin float 0.8s",
      "2.2 // ENERGY_LAYER: Kinematic Signature | Direction: Foot -> Head",
      "2.3 // GEOMETRY_LAYER: CIRCLE(chest), TRIANGLE(pelvis), SPIRAL(spine)",
      "2.4 // HALO_SCAN: 8-12px width | 1.2s cycle | Decay 0.3s",
      "------------------------------------------",
      "STATE_MACHINE: IDLE / SCAN / BINDING / ACTIVATION"
    ]
  },
  {
    id: '04',
    title: 'ZK-SNARK Integration',
    subtitle: 'SECURITY // PROOF_GEN',
    content: [
      "The behavior vector is fed into a Zero-Knowledge circuit. It proves the signal originates from a living human and matches a registered template without revealing raw data.",
      "The system generates a succinct proof (<1KB), allowing verification without surveillance. Privacy is mathematically guaranteed."
    ]
  }
];

export default function TechDocPage() {
  const [activeIndex, setActiveIndex] = useState('01');
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

    const sectionEls = document.querySelectorAll('section[id]');
    sectionEls.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30 antialiased">

      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
           style={{ zIndex: 0, backgroundImage: `linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      {/* BackgroundParticles */}
      <BackgroundParticles />

      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-black/80 backdrop-blur-md px-10 py-5 flex justify-between items-center text-[10px] tracking-[0.4em]">
        <Link href="/protocol/motion-pipeline" className="text-cyan-400/70 hover:text-cyan-300 transition-colors uppercase">← EXIT_TECH_STACK</Link>
        <div className="text-white/20 uppercase font-bold tracking-[0.5em]">TECHNICAL_SPECIFICATION // V0.8.1_CORE</div>
      </nav>

      <main className="relative z-10 pt-56 px-6 md:px-10 max-w-7xl mx-auto flex flex-col md:flex-row gap-24">

        {/* Sidebar Nav */}
        <aside className="md:w-64 shrink-0 h-fit md:sticky md:top-56 hidden md:block">
          <div className="text-[9px] text-cyan-500/40 mb-12 tracking-[0.5em] uppercase font-bold italic">// SYSTEM_DOCS_INDEX</div>
          <ul className="space-y-10 border-l border-white/5 pl-6">
            {techSections.map(s => {
              const isActive = s.id === activeIndex;
              return (
                <li key={s.id} className="group cursor-pointer">
                  <a href={'#' + s.id} className="block"
                     style={isActive ? { borderLeft: '2px solid #22d3ee', paddingLeft: '22px', marginLeft: '-24px' } : {}}>
                    <div
                      className={isActive ? 'text-[#22d3ee] font-bold text-[13px] transition-all duration-300 mb-1' : 'text-white/10 text-[10px] transition-all duration-300 mb-1'}
                      style={isActive ? { textShadow: '0 0 12px rgba(34,211,238,0.7)' } : {}}>
                      {s.id}
                    </div>
                    <div
                      className={(isActive ? 'text-[#22d3ee] font-bold opacity-100' : 'text-white/20 group-hover:text-cyan-400/80') + ' text-[11px] uppercase tracking-[0.2em] transition-all duration-300'}>
                      {s.title}
                    </div>
                    {isActive && (
                      <div className="text-[8px] tracking-[0.3em] text-cyan-400/60 mt-1.5 animate-pulse">
                        [ SYSTEM_LINK_ACTIVE ]
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
          {techSections.map((s) => (
            <section key={s.id} id={s.id} className="group max-w-[750px] scroll-mt-56">

              {/* Decoration Line */}
              <div className="flex items-center gap-6 mb-12">
                <span className="text-cyan-500/50 text-[10px] tracking-[0.6em] font-bold uppercase">{s.subtitle}</span>
                <div className="h-[1px] flex-1 bg-white/10 group-hover:bg-cyan-500/30 transition-all duration-700" />
              </div>

              {/* Title with Hover Effect */}
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-16 uppercase transition-all duration-700 group-hover:text-[#4fd1ed]">
                {s.title}
              </h2>

              {/* Protocol Code Block or Regular Paragraphs */}
              {s.isProtocol ? (
                <div className="bg-cyan-500/[0.03] border border-cyan-500/20 p-8 font-mono text-[13px] leading-loose text-cyan-400/80 space-y-2 relative overflow-hidden shadow-[inset_0_0_40px_rgba(6,182,212,0.05)]">
                   <div className="absolute top-0 right-0 p-4 opacity-20 text-[8px]">SPEC_V1.0</div>
                   {s.content.map((line, i) => (
                     <div key={i} className="whitespace-pre-wrap">{line}</div>
                   ))}
                </div>
              ) : (
                <div className="space-y-12 text-white/50 text-[17px] leading-[1.85] font-light text-justify">
                  {s.content.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}
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
