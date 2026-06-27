"use client";
import Link from 'next/link';
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import ZKFlow from "@/components/zk-flow/ZKFlow";
import { playTick } from "@/utils/useAudioTick";

export default function MotionPipeline() {

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
      desc: "Projecting the motion-presence into the cross-platform protocol layer." 
    }
  ];

  return (
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
                <div key={item.step} className="group flex flex-col items-center text-center"
                  onMouseEnter={() => playTick(800, "sine", 0.08, 0.02)}>
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

          {/* --- 2.5 ZK Flow 可视化 ── */}
          <section className="py-8">
            <h3 className="text-white/15 text-[8px] tracking-[0.4em] uppercase text-center mb-8">From Geometry → Proof: Visual Pipeline</h3>
            <ZKFlow />
          </section>

          {/* --- 3. SDK 技術聲明 --- */}
          <section className="bg-white/[0.01] border border-white/5 p-12 relative overflow-hidden group"
            onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
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

          {/* --- 4. Protocol Notes ── */}
          <section className="py-10 space-y-4 max-w-2xl mx-auto">
            <div className="border border-cyan-400/15 bg-cyan-400/[0.02] p-6 group cursor-default transition-all duration-500"
              onMouseEnter={e => { playTick(500, "sine", 0.04, 0.01); e.currentTarget.style.borderColor = "rgba(34,211,238,0.5)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(34,211,238,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(34,211,238,0.15)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div className="text-cyan-400/40 group-hover:text-cyan-300/70 text-[8px] tracking-[0.3em] uppercase mb-3 font-mono transition-colors">◈ Protocol Note: Replay Defense</div>
              <p className="text-white/35 group-hover:text-white/60 text-[11px] leading-[1.8] font-light transition-colors">
                The motion engine utilizes non-deterministic continuous entropy sampling. Any replay of fixed-length recordings fails the temporal-coherence check, converging to zero entropy within the sampling window.
              </p>
            </div>
            <div className="border border-cyan-400/10 bg-cyan-400/[0.01] p-5 group cursor-default transition-all duration-500"
              onMouseEnter={e => { playTick(450, "sine", 0.03, 0.01); e.currentTarget.style.borderColor = "rgba(34,211,238,0.35)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(34,211,238,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(34,211,238,0.1)"; e.currentTarget.style.boxShadow = "none"; }}>
              <p className="text-white/25 group-hover:text-white/50 text-[10px] tracking-[0.1em] uppercase italic text-center transition-colors">
                Phase 1: Local proof generation &amp; cryptographic signing. On-chain ZK-verification is scheduled for Genesis-v2 integration.
              </p>
            </div>
          </section>

          {/* --- 6. 儀式觸發按鈕 --- */}
          <section className="py-20 border-y border-white/5 text-center space-y-12">
              <p className="text-white/50 text-[11px] tracking-[0.3em] uppercase italic max-w-xl mx-auto">
                "To build on MyShape is to build on the mathematics of human sovereignty."
              </p>
              
              <Link
                href="/papers/technical-spec"
                className="inline-block group cursor-pointer"
                onMouseEnter={() => playTick(700, "sine", 0.10, 0.025)}
              >
                 <div className="px-16 py-6 border border-cyan-500/30 bg-cyan-500/5 group-hover:bg-cyan-400 group-hover:text-black transition-all duration-500 text-cyan-400 text-[11px] tracking-[0.6em] uppercase font-bold shadow-[0_0_30px_rgba(6,182,212,0.05)]">
                   View Technical Specification →
                 </div>
              </Link>
          </section>
        </div>
      </ProtocolLayout>
  );
}