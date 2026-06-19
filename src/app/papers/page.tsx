"use client";
import React from 'react';
import ProtocolLayout from "@/components/layout/ProtocolLayout";

export default function PapersPage() {
  const academicPapers = [
    { 
      id: "PAPER_01", 
      tag: "CORE_PROTOCOL", 
      title: "MyShape: A Geometric Approach to Decoupled Digital Identity", 
      version: "V2.1",
      abstract: "The foundational whitepaper defining the motion-to-geometry pipeline and ZK-verification architecture." 
    },
    { 
      id: "PAPER_02", 
      tag: "ZK_SNARKs", 
      title: "Succinct Proofs of Biological Motion: Efficiency and Security", 
      version: "V1.0-STABLE",
      abstract: "Analyzing the computational overhead of generating ZK-SNARKs on local edge devices for motion capture." 
    },
    { 
      id: "PAPER_03", 
      tag: "CIV_SOCIOLOGY", 
      title: "The Post-Account Civilization: Identity in the Age of Total Simulation", 
      version: "DRAFT_B",
      abstract: "An exploration of social trust models when human and AI behaviors become indistinguishable." 
    }
  ];

  return (
    <ProtocolLayout 
      refId="007" 
      category="CIV_LAYER" 
      title="PAPERS" 
      secLevel="CLASS_B" 
      systemStatus="STABLE_RECON"
    >
      <div className="space-y-32">
        {/* --- 1. 顶部引言：研究驱动的本质 --- */}
        <section className="max-w-3xl">
          <h2 className="text-white/30 text-[10px] tracking-[0.6em] uppercase mb-8 flex items-center gap-4">
            <span className="w-8 h-[1px] bg-cyan-500/50" />
            Research_Repository
          </h2>
          <p className="text-xl md:text-2xl font-light tracking-widest text-white leading-relaxed">
            The MyShape protocol is built upon <span className="text-cyan-400">peer-reviewed foundations</span>.
          </p>
          <p className="mt-8 text-white/50 text-sm tracking-widest leading-loose font-light">
            Our research spans computer vision, zero-knowledge cryptography, and digital sociology. 
            All documentation is open-access for the purpose of global protocol verification.
          </p>
        </section>

        {/* --- 2. 论文列表 (Academic Archive) --- */}
        <section className="space-y-8">
          <h3 className="text-white/20 text-[9px] tracking-[0.5em] uppercase mb-10 italic">// ARCHIVE_INDEX_RECON</h3>
          
          <div className="space-y-6">
            {academicPapers.map((paper) => (
              <div key={paper.id} className="group relative border border-white/5 bg-white/[0.02] p-8 hover:border-cyan-500/30 transition-all duration-500">
                {/* 装饰边角 */}
                <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-500/5 clip-path-slant group-hover:bg-cyan-500/20 transition-all" />
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-4">
                      <span className="text-cyan-500 text-[10px] tracking-[0.2em] font-bold">[{paper.id}]</span>
                      <span className="text-white/20 text-[9px] tracking-[0.3em] font-mono">#{paper.tag}</span>
                    </div>
                    <h4 className="text-white text-base md:text-lg tracking-[0.2em] font-light group-hover:text-cyan-400 transition-colors uppercase">
                      {paper.title}
                    </h4>
                    <p className="text-white/30 text-[10px] tracking-widest leading-relaxed uppercase max-w-2xl">
                      {paper.abstract}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-6 min-w-[120px]">
                    <span className="text-[9px] text-white/40 border border-white/10 px-3 py-1 bg-white/5">
                      REV_{paper.version}
                    </span>
                    <a href="/protocol" className="text-cyan-500 hover:text-white text-[10px] tracking-[0.4em] uppercase font-bold transition-all flex items-center gap-2 group/btn">
                      <span>READ_FILE</span>
                      <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- 3. 贡献声明 (Open Research) --- */}
        <section className="bg-cyan-500/[0.03] border-l-2 border-cyan-500 p-10">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            <p className="text-white/60 text-[10px] tracking-[0.3em] uppercase leading-relaxed max-w-xl">
              Are you an academic researcher? We provide grants for independent verification 
              of the motion-geometry pipeline and privacy benchmarks.
            </p>
            <div className="text-right">
              <span className="block text-white text-[10px] tracking-[0.4em] font-bold mb-2">JOIN_RESEARCH_NETWORK</span>
              <span className="block text-cyan-500/40 text-[9px] tracking-[0.2em]">CONTACT@MYSHAPE.COM</span>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .clip-path-slant {
          clip-path: polygon(100% 0, 0 0, 100% 100%);
        }
      `}</style>
    </ProtocolLayout>
  );
}