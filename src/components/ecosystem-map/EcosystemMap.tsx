"use client";
import React from "react";
import { playTick } from "@/utils/useAudioTick";

const LAYERS = [
  {
    name: "APPLICATION LAYER",
    tag: "USER_INTERFACE",
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.04)",
    border: "rgba(34,211,238,0.2)",
    items: [
      { label: "myshape.com", desc: "Protocol homepage" },
      { label: "Dashboard", desc: "Identity hub" },
      { label: "Genesis Ritual", desc: "Node initialization" },
      { label: "Motion Demo", desc: "Live PES engine" },
      { label: "Motion Geometry", desc: "Visual pipeline" },
      { label: "Papers", desc: "Technical specs" },
    ],
  },
  {
    name: "INTELLIGENCE LAYER",
    tag: "AI_AGENTS",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.03)",
    border: "rgba(167,139,250,0.18)",
    items: [
      { label: "Hermes Agent", desc: "Social matrix cruiser" },
      { label: "Matrix Bot", desc: "HN/X/LinkedIn/Bluesky" },
      { label: "Agent Workflow", desc: "Inbox → Drafts → Publish" },
    ]},
  {
    name: "DEVELOPER LAYER",
    tag: "BUILD_AND_INTEGRATE",
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.03)",
    border: "rgba(34,211,238,0.15)",
    items: [
      { label: "TypeScript SDK", desc: "5 lines to integrate" },
      { label: "REST API", desc: "8 endpoints, read-only" },
      { label: "Rust WASM Engine", desc: "128-dim PES extraction" },
    ],
    annotation: "// INCENTIVE_BRIDGE: TOKEN_ECONOMICS_PENDING",
  },
  {
    name: "PROTOCOL LAYER",
    tag: "CORE_PRIMITIVES",
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.02)",
    border: "rgba(34,211,238,0.12)",
    items: [
      { label: "Camera → SST → PES → ZK → Mesh", desc: "5-step pipeline" },
      { label: "JSON-LD + Microdata", desc: "Semantic identity layer" },
      { label: "SIWE Wallet Auth", desc: "EIP-4361 verification" },
      { label: "5-Layer Defense", desc: "Attack surface mitigation" },
    ],
  },
  {
    name: "ROOT ENTROPY SOURCE",
    tag: "GENESIS_FOUNDATION",
    color: "#e2e8f0",
    bg: "rgba(144,200,255,0.05)",
    border: "rgba(144,200,255,0.25)",
    items: [
      { label: "◈ Genesis Cohort", desc: "First 100 nodes · Permanent" },
      { label: "protocol_nodes", desc: "PostgreSQL · Supabase" },
      { label: "Sentry + Analytics", desc: "Monitoring · Vercel" },
    ],
    highlight: true,
  },
];

export default function EcosystemMap() {
  return (
    <div className="relative max-w-2xl mx-auto py-6">
      {/* 左侧 DATA_FLOW 箭头 */}
      <div className="absolute left-2 md:left-5 top-0 bottom-0 flex flex-col items-center z-10">
        <div className="flex-1 w-[1px] bg-gradient-to-b from-cyan-400/10 via-cyan-400/35 to-cyan-400/50" />
        <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
          style={{ left: "-26px", width: "60px" }}>
          <span className="text-cyan-400/35 text-[7px] tracking-[0.3em] uppercase -rotate-90 origin-center whitespace-nowrap leading-none">
            DATA_FLOW
          </span>
        </div>
      </div>

      {/* 层叠卡片 */}
      <div className="ml-10 md:ml-14 space-y-2.5">
        {LAYERS.map((layer, i) => (
          <div
            key={layer.name}
            className={`relative border p-4 md:p-5 transition-all duration-500 group cursor-default ${
              layer.highlight ? "scale-[1.01]" : ""
            }`}
            style={{
              borderColor: layer.border,
              background: layer.bg,
              boxShadow: layer.highlight ? "0 0 35px rgba(144,200,255,0.05)" : "none",
              zIndex: LAYERS.length - i,
            }}
            onMouseEnter={e => {
              playTick(400 + i * 80, "sine", 0.06, 0.015);
              e.currentTarget.style.borderColor = layer.color;
              e.currentTarget.style.boxShadow = layer.highlight
                ? "0 0 50px rgba(144,200,255,0.1)"
                : "0 0 25px rgba(34,211,238,0.06)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = layer.border;
              e.currentTarget.style.boxShadow = layer.highlight ? "0 0 35px rgba(144,200,255,0.05)" : "none";
            }}
          >
            {/* 层头部 */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] tracking-[0.3em] uppercase font-bold transition-colors"
                style={{ color: layer.color }}>
                {layer.name}
              </span>
              <span className="text-[7px] tracking-[0.2em] px-2 py-0.5 border transition-colors"
                style={{
                  color: layer.color,
                  borderColor: layer.color,
                  opacity: 0.5,
                }}>
                {layer.tag}
              </span>
              {layer.annotation && (
                <span className="text-white/15 text-[7px] tracking-[0.12em] italic hidden md:inline">
                  {layer.annotation}
                </span>
              )}
            </div>

            {/* 层内项目 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {layer.items.map(item => (
                <div
                  key={item.label}
                  className="flex flex-col px-3 py-2 transition-all duration-300 group/item cursor-default"
                  style={{
                    border: `1px solid ${layer.highlight ? "rgba(144,200,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                    background: "transparent",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = layer.color;
                    e.currentTarget.style.background = layer.bg;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = layer.highlight ? "rgba(144,200,255,0.12)" : "rgba(255,255,255,0.04)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span className="text-[9px] tracking-[0.12em] font-mono mb-0.5 transition-colors"
                    style={{ color: layer.highlight ? "rgba(220,235,255,0.6)" : "rgba(255,255,255,0.3)" }}>
                    {item.label}
                  </span>
                  <span className="text-[7px] tracking-[0.08em] transition-colors"
                    style={{ color: "rgba(255,255,255,0.1)" }}>
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>

            {/* 移动端注释 */}
            {layer.annotation && (
              <p className="text-white/15 text-[7px] tracking-[0.12em] italic mt-3 md:hidden">
                {layer.annotation}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* 底部标注 */}
      <div className="mt-8 text-center ml-10 md:ml-14">
        <span className="text-cyan-400/20 text-[8px] tracking-[0.25em] uppercase hover:text-cyan-400/40 transition-colors cursor-default"
          onMouseEnter={() => playTick(400, "sine", 0.03, 0.01)}>
          DATA_FLOW: RAW_ENTROPY → VERIFIED_IDENTITY
        </span>
      </div>
    </div>
  );
}
