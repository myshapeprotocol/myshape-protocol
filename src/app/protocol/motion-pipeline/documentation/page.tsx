"use client";
import React from 'react';
import Link from 'next/link';
import ProtocolFooter from "@/components/footer/footer"; 

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
    isProtocol: true, // 特殊標記，渲染為代碼塊
    content: [
      "GENESIS_VISUAL_PROTOCOL_V1.0",
      "TYPE: DATA-BODY_PRIMITIVE | STATUS: ACTIVE",
      "------------------------------------------",
      "2.1 // PARTICLE_LAYER: 800–1500 count | #A8E4FF | Perlin float 0.8s",
      "2.2 // ENERGY_LAYER: Kinematic Signature | Direction: Foot → Head",
      "2.3 // GEOMETRY_LAYER: CIRCLE(chest), TRIANGLE(pelvis), SPIRAL(spine)",
      "2.4 // HALO_SCAN: 8–12px width | 1.2s cycle | Decay 0.3s",
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
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30 antialiased">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: `linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-black/80 backdrop-blur-md px-10 py-5 flex justify-between items-center text-[10px] tracking-[0.4em]">
        <Link href="/protocol/motion-pipeline" className="text-cyan-400/40 hover:text-cyan-400 transition-colors uppercase">← EXIT_TECH_STACK</Link>
        <div className="text-white/20 uppercase font-bold tracking-[0.5em]">TECHNICAL_SPECIFICATION // V0.8.1_CORE</div>
      </nav>

      <main className="relative z-10 pt-56 px-6 md:px-10 max-w-7xl mx-auto flex flex-col md:flex-row gap-24">
        <aside className="md:w-64 shrink-0 h-fit md:sticky md:top-56 hidden md:block">
          <div className="text-[9px] text-cyan-500/40 mb-12 tracking-[0.5em] uppercase font-bold italic">// SYSTEM_DOCS_INDEX</div>
          <ul className="space-y-10 border-l border-white/5 pl-6">
            {techSections.map(s => (
              <li key={s.id} className="group">
                <a href={`#${s.id}`} className="block">
                  <div className="text-[10px] text-white/10 group-hover:text-cyan-400 transition-colors duration-300 mb-1 font-bold">{s.id}</div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-white/20 group-hover:text-cyan-400 transition-all duration-300">{s.title}</div>
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex-1 space-y-56 pb-48">
          {techSections.map((s) => (
            <section key={s.id} id={s.id} className="group max-w-[750px] scroll-mt-56">
              <div className="flex items-center gap-6 mb-12">
                <span className="text-cyan-500/50 text-[10px] tracking-[0.6em] font-bold uppercase">{s.subtitle}</span>
                <div className="h-[1px] flex-1 bg-white/10 group-hover:bg-cyan-500/30 transition-all duration-700" />
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-16 uppercase transition-all duration-700 group-hover:text-[#4fd1ed]">
                {s.title}
              </h2>

              {/* 判斷是否為協議代碼塊 */}
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

          <div className="mt-40 border-t border-white/5 pt-24">
            <ProtocolFooter />
          </div>
        </div>
      </main>
    </div>
  );
}