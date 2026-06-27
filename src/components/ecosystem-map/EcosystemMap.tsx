"use client";
import React from "react";
import { playTick } from "@/utils/useAudioTick";

const LAYERS = [
  {
    name: "APPLICATION_LAYER",
    color: "rgba(34,211,238,0.5)",
    items: ["myshape.com", "Dashboard", "Genesis Ritual", "Motion Demo", "Motion Geometry", "Papers"],
  },
  {
    name: "INTELLIGENCE_LAYER",
    color: "rgba(34,211,238,0.35)",
    items: ["Hermes Agent", "Matrix Bot", "Agent Workflow", "Social Matrix (HN/X/LI/BS)"],
    annotation: "AI agents operate at application level — never possess cryptographic material",
  },
  {
    name: "DEVELOPER_LAYER",
    color: "rgba(34,211,238,0.25)",
    items: ["TypeScript SDK", "REST API (8 endpoints)", "Rust WASM Engine", "// INCENTIVE_BRIDGE: [TOKEN_ECONOMICS_PENDING]"],
  },
  {
    name: "PROTOCOL_LAYER",
    color: "rgba(34,211,238,0.22)",
    items: ["Camera → SST → PES → ZK → Mesh", "JSON-LD + Microdata", "SIWE Wallet Auth", "5-Layer Defense-in-Depth"],
  },
  {
    name: "ROOT_ENTROPY_SOURCE",
    color: "rgba(144,200,255,0.35)",
    items: ["◈ Genesis Cohort (100 nodes)", "protocol_nodes (PostgreSQL)", "Sentry + Vercel Analytics"],
    highlight: true,
  },
];

export default function EcosystemMap() {
  return (
    <div className="relative max-w-2xl mx-auto py-8"
      onMouseEnter={() => playTick(500, "sine", 0.03, 0.01)}>
      {/* 左侧流向箭头 */}
      <div className="absolute left-3 md:left-6 top-0 bottom-0 flex flex-col items-center gap-1">
        <div className="flex-1 w-[1px] bg-gradient-to-b from-cyan-400/5 via-cyan-400/20 to-cyan-400/40" />
        <div className="text-cyan-400/25 text-[7px] tracking-[0.3em] uppercase -rotate-90 origin-center whitespace-nowrap absolute top-1/2 -translate-y-1/2"
          style={{ left: "-28px" }}>
          DATA_FLOW: RAW_ENTROPY → VERIFIED_IDENTITY
        </div>
      </div>

      {/* 层叠卡片 */}
      <div className="ml-10 md:ml-14 space-y-2">
        {LAYERS.map((layer, i) => (
          <div
            key={layer.name}
            className={`relative border p-4 transition-all duration-500 group ${
              layer.highlight ? "bg-cyan-400/[0.04]" : "bg-transparent"
            }`}
            style={{
              borderColor: layer.highlight ? "rgba(144,200,255,0.2)" : "rgba(144,200,255,0.08)",
              boxShadow: layer.highlight ? "0 0 30px rgba(144,200,255,0.04)" : "none",
              zIndex: LAYERS.length - i,
            }}
            onMouseEnter={e => {
              playTick(400 + i * 80, "sine", 0.05, 0.012);
              e.currentTarget.style.borderColor = layer.color;
              if (layer.highlight) e.currentTarget.style.boxShadow = "0 0 40px rgba(144,200,255,0.1)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = layer.highlight ? "rgba(144,200,255,0.2)" : "rgba(144,200,255,0.08)";
              if (layer.highlight) e.currentTarget.style.boxShadow = "0 0 30px rgba(144,200,255,0.04)";
            }}
          >
            {/* 层标签 */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[9px] tracking-[0.3em] uppercase font-mono font-bold transition-colors group-hover:text-white/80"
                style={{ color: layer.color }}>
                {layer.name}
              </span>
              {layer.highlight && (
                <span className="text-cyan-400/30 text-[7px] tracking-[0.2em] border border-cyan-400/15 px-2 py-0.5">
                  ◈ GENESIS_ROOT
                </span>
              )}
              {i === 2 && (
                <span className="text-white/[0.08] text-[7px] tracking-[0.15em] italic">
                  // INCENTIVE_BRIDGE: PENDING
                </span>
              )}
            </div>

            {/* 层内项目 */}
            <div className="flex flex-wrap gap-2">
              {layer.items.map(item => (
                <span
                  key={item}
                  className="text-[8px] tracking-[0.15em] font-mono px-2 py-1 transition-all duration-300"
                  style={{
                    color: layer.highlight ? "rgba(144,200,255,0.5)" : "rgba(255,255,255,0.2)",
                    border: `1px solid ${layer.highlight ? "rgba(144,200,255,0.15)" : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>

            {/* 注释 */}
            {layer.annotation && (
              <p className="text-white/[0.05] text-[7px] tracking-[0.1em] mt-2 italic text-right">
                {layer.annotation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
