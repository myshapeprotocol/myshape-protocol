"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import ProtocolLayout from "@/components/layout/ProtocolLayout";
// 假設你將儀式組件放在此路徑，若尚未創建請見下方步驟 2
import GenesisRitual from "@/components/ritual/GenesisRitual"; 

export default function MotionPipelinePage() {
  const router = useRouter();
  const [isRitualActive, setIsRitualActive] = useState(false);

  const pipelineSteps = [
    { 
      step: "01", 
      title: "CAPTURE", 
      label: "LOCAL_DEVICE", 
      desc: "Raw kinetic energy captured via local visual sensors. No cloud streaming." 
    },
    { 
      step: "02", 
      title: "EXTRACT", 
      label: "GEOMETRY_ENGINE", 
      desc: "Anonymizing skeletal data into pure motion geometry vectors." 
    },
    { 
      step: "03", 
      title: "ENCRYPT", 
      label: "ZK_PROOF_GEN", 
      desc: "Generating Zero-Knowledge proofs of movement without revealing the source." 
    },
    { 
      step: "04", 
      title: "MINT", 
      label: "IDENTITY_NODE", 
      desc: "Projecting the motion-body into the cross-platform protocol layer." 
    }
  ];

  const handleRitualComplete = () => {
    // 儀式結束後執行真正的跳轉
    router.push('/protocol/motion-pipeline/documentation');
  };

  return (
    <>
      {/* 儀式遮罩層：當點擊按鈕時觸發 */}
      <AnimatePresence>
        {isRitualActive && (
          <GenesisRitual onComplete={handleRitualComplete} />
        )}
      </AnimatePresence>

      <ProtocolLayout 
        refId="003" 
        category="PROTOCOL_CORE" 
        title="MOTION_PIPELINE" 
        secLevel="CLASS_A" 
        systemStatus="DATA_FLOWING"
      >
        <div className="space-y-32 pb-32 antialiased">
          {/* --- 1. 核心流程簡述 --- */}
          <section className="max-w-3xl pt-10">
            <h2 className="text-white/30 text-[10px] tracking-[0.6em] uppercase mb-8 flex items-center gap-4">
              <span className="w-8 h-[1px] bg-cyan-500/50" />
              Processing_Architecture
            </h2>
            <p className="text-xl md:text-3xl font-light tracking-[0.15em] text-white leading-tight uppercase">
              The Motion-to-ZK pipeline is the <span className="text-cyan-400 font-bold">computational spine</span> of the MyShape Protocol.
            </p>
            <p className="mt-8 text-white/40 text-[13px] tracking-widest leading-loose font-light max-w-2xl">
              It ensures that biological motion is never stored or surveilled, but instead distilled into a 
              verifiable mathematical signature. Private by design, sovereign by execution.
            </p>
          </section>

          {/* --- NEW: 戰略橋接模塊 WHY_NOW --- */}
          <section className="max-w-2xl relative py-12 px-8 border-l border-cyan-500/30 bg-gradient-to-r from-cyan-500/[0.03] to-transparent">
            <h3 className="text-cyan-500/50 text-[10px] tracking-[0.6em] uppercase mb-6 font-bold flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500/40 rounded-full animate-pulse" />
              Strategic_Context // WHY_NOW
            </h3>
            <div className="space-y-4 font-mono">
              <p className="text-white/70 text-[12px] tracking-[0.2em] leading-relaxed uppercase">
                AI agents are proliferating. Identity is fragmenting.
              </p>
              <p className="text-cyan-400 text-[14px] tracking-[0.3em] leading-relaxed uppercase font-bold">
                Motion is the last sovereign signal.
              </p>
              <p className="text-white/40 text-[11px] tracking-[0.2em] leading-relaxed uppercase italic">
                Zero-Knowledge is the only viable privacy layer for the biological age.
              </p>
            </div>
          </section>

          {/* --- 2. 流水線步驟 --- */}
          <section className="relative px-4">
            <div className="hidden md:block absolute top-[32px] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-8 relative z-10">
              {pipelineSteps.map((item) => (
                <div key={item.step} className="group flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full border border-white/10 bg-[#02040a] flex items-center justify-center mb-8 group-hover:border-cyan-500 transition-all duration-700 relative">
                    <span className="text-[11px] text-white/30 group-hover:text-cyan-400 font-bold tracking-widest transition-colors">
                      {item.step}
                    </span>
                    <div className="absolute inset-[-4px] border-[1px] border-cyan-500/0 border-t-cyan-500/40 rounded-full opacity-0 group-hover:opacity-100 group-hover:rotate-[360deg] transition-all duration-[1500ms] ease-in-out" />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-white text-[13px] tracking-[0.4em] font-bold uppercase group-hover:text-cyan-400 transition-colors">
                      {item.title}
                    </h4>
                    <div className="text-cyan-500/40 text-[9px] tracking-[0.3em] font-mono">
                      [{item.label}]
                    </div>
                    <p className="text-white/30 text-[10px] tracking-[0.2em] leading-relaxed uppercase max-w-[220px] mx-auto group-hover:text-white/60 transition-colors">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* --- 3. SDK 技術聲明 --- */}
          <section className="bg-white/[0.01] border border-white/5 p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
              <div className="space-y-4 text-center md:text-left">
                <h3 className="text-white/80 text-[11px] tracking-[0.4em] uppercase font-bold">SDK_Integration_Layer</h3>
                <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase leading-relaxed max-w-md">
                  A high-performance SDK enabling developers to plug biological motion into any 3D engine while maintaining Zero-Knowledge integrity.
                </p>
              </div>
              <div className="flex flex-col items-center md:items-end gap-3 text-center md:text-right">
                <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] tracking-[0.3em] font-bold">
                  STATUS: STABLE_BUILD_V0.8
                </span>
                <span className="text-white/20 text-[8px] tracking-[0.2em]">
                  COMPATIBILITY: UNREAL / UNITY / WEBGL
                </span>
              </div>
            </div>
          </section>

          {/* --- 4. 儀式觸發按鈕 --- */}
          <section className="py-20 border-y border-white/5 text-center space-y-12">
              <p className="text-white/50 text-[11px] tracking-[0.3em] uppercase italic max-w-xl mx-auto">
                "To build on MyShape is to build on the mathematics of human sovereignty."
              </p>
              
              {/* 改為 button 並觸發儀式狀態 */}
              <button 
                onClick={() => setIsRitualActive(true)}
                className="inline-block group cursor-pointer"
              >
                 <div className="px-16 py-6 border border-cyan-500/30 bg-cyan-500/5 group-hover:bg-cyan-400 group-hover:text-black transition-all duration-500 text-cyan-400 text-[11px] tracking-[0.6em] uppercase font-bold shadow-[0_0_30px_rgba(6,182,212,0.05)]">
                   Initialize Genesis Ritual →
                 </div>
              </button>
          </section>
        </div>
      </ProtocolLayout>
    </>
  );
}