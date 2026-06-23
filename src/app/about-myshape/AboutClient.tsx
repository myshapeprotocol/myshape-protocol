"use client";
import React from 'react';
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import { playTick } from "@/utils/useAudioTick";

export default function About() {
  const organizationalPrinciples = [
    {
      label: "PRINCIPLE_01",
      title: "Sovereign Essence",
      content: "WE BELIEVE THAT IDENTITY IS AN INHERENT HUMAN RIGHT, NOT A GRANTED PRIVILEGE BY CENTRALIZED PLATFORMS. OUR ARCHITECTURE IS DESIGNED TO PROTECT THIS ESSENCE AT ALL COSTS."
    },
    {
      label: "PRINCIPLE_02",
      title: "Algorithmic Integrity",
      content: "EVERY LINE OF CODE IN THE MOTION-PIPELINE IS AUDITABLE AND DETERMINISTIC. WE REPLACE HUMAN INTERMEDIARIES WITH MATHEMATICAL CERTAINTY."
    },
    {
      label: "PRINCIPLE_03",
      title: "Civilizational Scale",
      content: "MYSHAPE IS NOT A PRODUCT; IT IS A UTILITY FOR THE NEXT PHASE OF HUMAN CIVILIZATION. WE BUILD FOR THE CENTURY, NOT THE QUARTER."
    }
  ];

  return (
    <ProtocolLayout 
      refId="009" 
      category="SYS_COMP" 
      title="ABOUT_MYSHAPE" 
      secLevel="CLASS_GAMMA" 
      systemStatus="INTERNAL_REC"
    >
      <div className="space-y-32">
        {/* --- 1. 深度叙事：找回所有被删减的宏大文案 --- */}
        <section className="max-w-4xl">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4 flex items-center gap-4">
            <span className="w-12 h-[1px] bg-cyan-500/30" />
            ORGANIZATION_ETHOS
          </h2>
          <div className="space-y-8">
            <p className="text-xl md:text-3xl font-extralight tracking-widest text-white leading-tight uppercase">
              RECLAIMING THE <span className="text-cyan-400">HUMAN GEOMETRY</span> FROM THE SILICON VOID.
            </p>
            <p className="text-white/60 text-base md:text-lg tracking-[0.2em] leading-relaxed font-light">
              MyShape was founded in 2025 with a singular obsession: to solve the identity crisis of the AI era. 
              As artificial intelligence begins to dominate the digital landscape, the distinction between 
              authentic human presence and synthetic simulation becomes the most critical problem of our time.
            </p>
            <p className="text-white/40 text-sm tracking-[0.15em] leading-loose font-light italic">
              "We observed that while the world was busy digitizing faces and fingerprints—vulnerable, 
              static data—the true signature of life remained untapped: the unique, irreducible rhythm of 
              human movement."
            </p>
          </div>
        </section>

        {/* --- 2. 组织原则矩阵 (完整的丰富文本) --- */}
        <section className="space-y-12">
          <h3 className="text-white/20 text-[9px] tracking-[0.6em] uppercase text-center">// CORE_VALUES_CONSTITUTION</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {organizationalPrinciples.map((principle) => (
              <div key={principle.label} onMouseEnter={e => { playTick(600, "sine", 0.08, 0.015); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }} className="p-8 border transition-all group" style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}>
                <div className="text-cyan-500 text-[9px] tracking-[0.4em] font-mono mb-6 group-hover:text-cyan-400 transition-colors">
                  {principle.label}
                </div>
                <h4 className="text-white/70 text-[11px] tracking-[0.2em] uppercase mb-6">
                  {principle.title}
                </h4>
                <p className="text-white/30 text-[10px] tracking-widest leading-relaxed uppercase group-hover:text-white/50 transition-colors">
                  {principle.content}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* --- 3. 找回之前的团队/实验室声明 --- */}
        <section className="relative group" onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
          <div className="absolute inset-0 border scale-[1.02] group-hover:scale-100 transition-transform duration-700" style={{ borderColor: "rgba(144,200,255,0.1)" }} />
          <div className="p-12 border relative z-10 transition-all duration-500" style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}>
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                <h3 className="text-white text-sm tracking-[0.5em] uppercase font-bold">THE_LABORATORY</h3>
                <p className="text-white/50 text-xs tracking-widest leading-loose uppercase">
                  OPERATING FROM DECENTRALIZED NODES ACROSS THE GLOBE, OUR TEAM CONSISTS OF CRYPTOGRAPHERS, 
                  COMPUTER VISION ENGINEERS, AND SOCIOLOGISTS. WE ARE ANONYMOUS BY DESIGN, SOVEREIGN BY CHOICE, 
                  AND DRIVEN BY THE NECESSITY OF THE PROTOCOL.
                </p>
              </div>
              <div className="w-px h-24 bg-white/10 hidden md:block" />
              <div className="flex flex-col gap-4 text-right min-w-[200px]">
                <span className="text-cyan-500 text-[9px] tracking-[0.4em] font-bold italic">LOCATION: [ENCRYPTED]</span>
                <span className="text-white/20 text-[8px] tracking-[0.2em]">EST. TIMESTAMP: 2024.09.12</span>
                <div className="flex justify-end gap-1">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-1 h-2 bg-cyan-500/20" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ProtocolLayout>
  );
}