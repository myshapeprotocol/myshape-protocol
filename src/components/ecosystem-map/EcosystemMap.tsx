"use client";
import React from "react";
import { playTick } from "@/utils/useAudioTick";

const LAYERS = [
  {
    name: "SPECIFICATION LAYER",
    tag: "OPEN_STANDARDS",
    color: "rgba(144,200,255,0.9)",
    bg: "rgba(144,200,255,0.04)",
    border: "rgba(144,200,255,0.2)",
    items: [
      { label: "RFC-0001", desc: "Motion Signature Format" },
      { label: "RFC-0002", desc: "Continuity Proof Format" },
    ],
  },
  {
    name: "EVIDENCE ENGINES",
    tag: "VERIFICATION",
    color: "rgba(144,200,255,0.75)",
    bg: "rgba(144,200,255,0.03)",
    border: "rgba(144,200,255,0.18)",
    items: [
      { label: "EE-001", desc: "Presence Detection · 100% floor" },
      { label: "EE-002", desc: "Causal Coupling · N=316" },
      { label: "EE-003", desc: "Gyroscope Challenge · N=200" },
      { label: "VS-001", desc: "Dual-Engine Pipeline · 93%" },
    ],
  },
  {
    name: "DEVELOPER SURFACE",
    tag: "SDK_AND_TOOLS",
    color: "rgba(144,200,255,0.6)",
    bg: "rgba(144,200,255,0.03)",
    border: "rgba(144,200,255,0.15)",
    items: [
      { label: "npm SDK", desc: "verifyContinuity() · v0.1.2" },
      { label: "Playground", desc: "Interactive sandbox" },
      { label: "GitHub", desc: "Open source · MIT license" },
    ],
  },
  {
    name: "EXPERIMENTAL DATA",
    tag: "REPRODUCIBLE",
    color: "rgba(144,200,255,0.45)",
    bg: "rgba(144,200,255,0.02)",
    border: "rgba(144,200,255,0.12)",
    items: [
      { label: "576 Runs", desc: "4 engines · consumer hardware" },
      { label: "HuggingFace", desc: "Dataset · open access" },
      { label: "121 Tests", desc: "Automated verification" },
    ],
  },
  {
    name: "RESEARCH FOUNDATION",
    tag: "OPEN_RESEARCH",
    color: "rgba(200,230,255,0.9)",
    bg: "rgba(144,200,255,0.05)",
    border: "rgba(144,200,255,0.25)",
    items: [
      { label: "The Continuity Lab", desc: "Research organization" },
      { label: "Research Notes", desc: "RN-001 through RN-003" },
      { label: "Failure Reports", desc: "FD-001 · DL-001" },
    ],
    highlight: true,
  },
];

export default function EcosystemMap() {
  return (
    <div className="relative max-w-2xl mx-auto py-6">
      <div className="absolute left-2 md:left-5 top-0 bottom-0 flex flex-col items-center z-10">
        <div className="flex-1 w-[1px] bg-gradient-to-b from-[#90c8ff]/10 via-[#90c8ff]/40 to-[#90c8ff]/60" />
        <div className="absolute inset-0 w-[2px] left-[-0.5px]"
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(144,200,255,0.3), transparent)",
            animation: "spineScan 4s ease-in-out infinite",
            filter: "blur(1px)",
          }} />
        <div className="absolute left-[-4px] w-[10px] h-[14px] rounded-full z-20"
          style={{
            background: "radial-gradient(ellipse at 35% 25%, rgba(220,240,255,0.7) 0%, rgba(140,200,240,0.3) 40%, transparent 70%)",
            boxShadow: "0 0 10px rgba(160,210,240,0.3), inset 0 -1px 2px rgba(100,160,210,0.2)",
            animation: "dropletScroll 5s ease-in-out infinite",
          }}>
          <div className="absolute top-[20%] left-[30%] w-[3px] h-[3px] rounded-full"
            style={{ background: "rgba(255,255,255,0.6)" }} />
        </div>
        {LAYERS.map((_, i) => (
          <div key={i} className="absolute w-2 h-2 rounded-full bg-[#02040a] border border-[#90c8ff]/40 z-10"
            style={{
              top: `${(i + 0.5) * (100 / LAYERS.length)}%`,
              left: "-4px",
              boxShadow: "0 0 6px rgba(144,200,255,0.3)",
              animation: `nodePulse 2.5s ease-in-out ${i * 0.4}s infinite`,
            }} />
        ))}
        <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: "-24px", width: "52px" }}>
          {["D","A","T","A","_","F","L","O","W"].map((c, i) => (
            <span key={i} className="text-[10px] font-mono tracking-[0.15em]"
              style={{ color: "rgba(144,200,255,0.25)", lineHeight: 1.4 }}>{c}</span>
          ))}
        </div>
      </div>
      <div className="space-y-4 ml-12 md:ml-16">
        {LAYERS.map((layer) => (
          <div key={layer.name}
            onMouseEnter={() => playTick(600, "sine", 0.06, 0.02)}
            className="relative p-4 rounded-lg transition-all duration-400 group cursor-default"
            style={{
              background: layer.bg,
              border: `1px solid ${layer.border}`,
              ...(layer.highlight ? { borderColor: "rgba(144,200,255,0.3)", boxShadow: "0 0 20px rgba(144,200,255,0.06)" } : {})
            }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-[0.15em] uppercase"
                style={{ color: layer.color }}>{layer.name}</span>
              <span className="text-[8px] font-mono px-2 py-0.5 rounded"
                style={{ color: layer.color, border: `1px solid ${layer.border}`, opacity: 0.7 }}>
                {layer.tag}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {layer.items.map((item) => (
                <span key={item.label}
                  className="text-[9px] px-2.5 py-1 rounded font-mono tracking-[0.05em] transition-all duration-300"
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    border: `1px solid ${layer.border}`,
                    background: "rgba(255,255,255,0.01)",
                  }}>
                  <span style={{ color: "rgba(255,255,255,0.65)" }}>{item.label}</span>
                  <span style={{ color: "rgba(255,255,255,0.2)", marginLeft: 4 }}>{item.desc}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
