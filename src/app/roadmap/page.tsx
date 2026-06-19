"use client";
import React from 'react';
import ProtocolLayout from "@/components/layout/ProtocolLayout";

type Status = "COMPLETED" | "CURRENT" | "PENDING";

interface Phase {
  phase: string;
  name: string;
  status: Status;
  details: string[];
}

const statusConfig: Record<Status, { dot: string; badge: string; border: string; glow: string; label: string }> = {
  COMPLETED: {
    dot: "bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]",
    badge: "border-cyan-400/40 text-cyan-300 bg-cyan-400/5",
    border: "border-cyan-400/15",
    glow: "shadow-[0_0_30px_rgba(34,211,238,0.06)]",
    label: "● COMPLETED",
  },
  CURRENT: {
    dot: "bg-cyan-400 animate-pulse shadow-[0_0_12px_rgba(34,211,238,0.6)]",
    badge: "border-cyan-400/60 text-cyan-300 bg-cyan-400/8 animate-pulse",
    border: "border-cyan-400/25",
    glow: "shadow-[0_0_40px_rgba(34,211,238,0.1)]",
    label: "◉ IN_PROGRESS",
  },
  PENDING: {
    dot: "bg-white/10",
    badge: "border-white/10 text-white/20 bg-transparent",
    border: "border-white/5",
    glow: "",
    label: "○ PENDING",
  },
};

export default function RoadmapPage() {
  const roadmaps: Phase[] = [
    {
      phase: "PHASE_01",
      name: "GEOMETRY_AWAKENING",
      status: "COMPLETED",
      details: [
        "FORMALIZATION OF THE MOTION-TO-GEOMETRY MATHEMATICAL MODEL.",
        "SUCCESSFUL PROTOTYPING OF LOCAL ZK-SNARK GENERATION ON MOBILE EDGE DEVICES.",
        "ESTABLISHMENT OF THE 'HALO' VISUALIZATION FRAMEWORK."
      ]
    },
    {
      phase: "PHASE_02",
      name: "SYNAPTIC_UPLINK",
      status: "CURRENT",
      details: [
        "CORE PROTOCOL SDK RELEASE FOR UNREAL ENGINE AND UNITY INTEGRATION.",
        "DECENTRALIZED IDENTITY MESH TESTNET LAUNCH.",
        "CROSS-PLATFORM MOTION PASSPORT INITIAL TRIALS."
      ]
    },
    {
      phase: "PHASE_03",
      name: "CIVILIZATION_OVERLAY",
      status: "PENDING",
      details: [
        "AUTONOMOUS IDENTITY AGENTS FOR AI-NATIVE ENVIRONMENTS.",
        "GLOBAL KINETIC CONSENSUS LAYER ACTIVATION.",
        "PERMANENT DATA-BODY SOVEREIGNTY LEGAL FRAMEWORK INTEGRATION."
      ]
    }
  ];

  return (
    <ProtocolLayout
      refId="010"
      category="SYS_COMP"
      title="ROADMAP"
      secLevel="CLASS_GAMMA"
      systemStatus="EVOLVING"
    >
      <div className="space-y-24 md:space-y-32">
        {/* ── 引言 ── */}
        <section className="max-w-4xl">
          <h2 className="text-cyan-500/60 text-[10px] tracking-[0.6em] font-bold uppercase mb-8">// TEMPORAL_SEQUENCE</h2>
          <p className="text-xl md:text-2xl font-light tracking-widest text-white leading-relaxed">
            The evolution of MyShape is not a linear path, but a{" "}
            <span className="text-cyan-300" style={{ textShadow: "0 0 12px rgba(34,211,238,0.4)" }}>
              recursive expansion
            </span>{" "}
            of human sovereignty.
          </p>
          <p className="mt-6 text-white/40 text-sm tracking-[0.2em] leading-loose font-light">
            Three critical phases — each a leap in the protocol&apos;s ability to verify, protect,
            and express the kinetic identity of the human race.
          </p>
        </section>

        {/* ── 时间线 ── */}
        <section className="relative">
          {/* 垂直连接线 */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-[1px] bg-gradient-to-b from-cyan-400/20 via-cyan-400/10 to-transparent" />

          <div className="space-y-16 md:space-y-20">
            {roadmaps.map((item, i) => {
              const cfg = statusConfig[item.status];
              return (
                <div key={item.phase} className="relative pl-16 md:pl-20">
                  {/* 时间线节点 */}
                  <div className="absolute left-[22px] md:left-[30px] top-1.5 z-10">
                    <div className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                    {item.status === "CURRENT" && (
                      <div className="absolute -inset-1 rounded-full border border-cyan-400/30 animate-ping" />
                    )}
                  </div>

                  {/* 卡片 */}
                  <div
                    className={`border ${cfg.border} ${cfg.glow} bg-[#02040a]/80 backdrop-blur-sm transition-all duration-500 hover:bg-cyan-400/[0.03]`}
                  >
                    <div className="p-6 md:p-10">
                      {/* 头部 */}
                      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mb-6">
                        <span className="text-cyan-500/50 text-[10px] tracking-[0.4em] font-mono shrink-0">
                          {item.phase}
                        </span>
                        <h3 className={`text-lg md:text-xl tracking-[0.3em] font-light uppercase ${item.status === "COMPLETED" ? "text-white" : item.status === "CURRENT" ? "text-white/90" : "text-white/40"}`}>
                          {item.name.replace(/_/g, " ")}
                        </h3>
                      </div>

                      {/* 任务列表 */}
                      <div className="space-y-4 mb-8">
                        {item.details.map((detail, idx) => (
                          <div key={idx} className="flex gap-3 items-start group/item">
                            <span className={`text-[9px] mt-0.5 shrink-0 transition-colors ${item.status === "COMPLETED" ? "text-cyan-400/60" : item.status === "CURRENT" ? "text-cyan-400/40 group-hover/item:text-cyan-400" : "text-white/10"}`}>
                              {item.status === "COMPLETED" ? "✓" : "▶"}
                            </span>
                            <p className={`text-[10px] md:text-[11px] tracking-widest leading-relaxed uppercase transition-colors ${item.status === "COMPLETED" ? "text-white/60" : item.status === "CURRENT" ? "text-white/45 group-hover/item:text-white/70" : "text-white/20"}`}>
                              {detail}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* 底部状态标签 */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <div className={`h-[1px] w-8 ${item.status === "COMPLETED" ? "bg-gradient-to-r from-cyan-400/60 to-transparent" : item.status === "CURRENT" ? "bg-gradient-to-r from-cyan-400/40 to-transparent" : "bg-white/5"}`} />
                          <span className={`text-[8px] tracking-[0.3em] uppercase font-mono ${item.status === "COMPLETED" ? "text-cyan-300/70" : item.status === "CURRENT" ? "text-cyan-400/60" : "text-white/15"}`}>
                            {item.status === "COMPLETED" ? "EST_Q1_2026" : item.status === "CURRENT" ? "EST_Q3_2026" : "EST_Q1_2027"}
                          </span>
                        </div>
                        <div className={`px-3 py-1 border text-[8px] tracking-[0.25em] uppercase font-mono ${cfg.badge}`}>
                          {cfg.label}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 结尾 ── */}
        <section className="flex flex-col items-center text-center py-8">
          <p className="text-white/15 text-[9px] tracking-[0.6em] uppercase mb-8">End_Of_Document_Temporal_Projection</p>
          <p className="text-white/50 text-sm tracking-[0.2em] uppercase leading-loose max-w-2xl italic">
            &ldquo;The roadmap is a living protocol. As the AI landscape shifts, MyShape adapts,
            ensuring the human geometry remains the final authority.&rdquo;
          </p>
          <div className="mt-10 h-px w-24 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        </section>
      </div>
    </ProtocolLayout>
  );
}