"use client";
import React from "react";
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import { playTick } from "@/utils/useAudioTick";
import "./contact.css";

const CONNECT_NODES = [
  { id: "12", name: "X_PROTOCOL", desc: "UPDATES, PROTOCOL ANNOUNCEMENTS, AND CIVILIZATION SIGNALS.", status: "SIGNAL_ACTIVE", url: "https://x.com/myshapeprotocol", active: true },
  { id: "13", name: "LINKEDIN", desc: "ORGANIZATION PROFILE, HIRING, AND INSTITUTIONAL PRESENCE.", status: "STABLE_LINK", url: "https://www.linkedin.com/company/111557251/", active: true },
  { id: "14", name: "DISCORD", desc: "DEVELOPER COMMUNITY, PROTOCOL DISCUSSIONS, AND INTEGRATION SUPPORT.", status: "GATEWAY_OPEN", url: "https://discord.gg/zr8Tczard", active: true },
  { id: "15", name: "GITHUB", desc: "OPEN‑SOURCE REPOSITORIES, SDKS, AND PROTOCOL REFERENCE IMPLEMENTATIONS.", status: "REPO_ACTIVE", url: "https://github.com/myshapeprotocol", active: true },
];

export default function ContactClient() {
  return (
    <ProtocolLayout refId="011" category="SYS_CONNECT" title="CONTACT & NODES" secLevel="CLASS_GAMMA" systemStatus="GATEWAY_OPEN">
      <BackgroundParticles />
      <div className="relative z-10 space-y-32">
        <section className="space-y-16">
          <div className="max-w-4xl">
            <h2 className="text-white/30 text-[10px] tracking-[0.5em] uppercase mb-4">// ESTABLISHING_CONNECTION</h2>
            <p className="text-xl md:text-2xl font-light tracking-[0.15em] text-white leading-tight uppercase">FOR PARTNERSHIPS, RESEARCH COLLABORATION, OR <span className="text-[#90c8ff]">PROTOCOL INTEGRATION</span>.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="ct-card" onMouseEnter={() => playTick(500, "sine", 0.04, 0.02)}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-1.5 bg-[#90c8ff] rounded-full animate-pulse shadow-[0_0_8px_rgba(144,200,255,0.5)]" />
                <span className="text-[#90c8ff] text-[11px] tracking-[0.3em] font-bold uppercase">PRIVACY_PROTOCOL_ACTIVE</span>
              </div>
              <p className="text-white/50 text-[12px] tracking-[0.15em] leading-loose uppercase italic">"MYSHAPE MAINTAINS A STRICT PRIVACY-FIRST COMMUNICATION POLICY."</p>
            </div>
            <div className="ct-card flex flex-col justify-center" onMouseEnter={() => playTick(500, "sine", 0.04, 0.02)}>
              <span className="block text-white/30 text-[10px] tracking-[0.3em] uppercase mb-3">Contact</span>
              <a href="mailto:protocol@myshape.com" className="ct-email" onMouseEnter={() => playTick(600, "sine", 0.06, 0.022)}>PROTOCOL@MYSHAPE.COM</a>
            </div>
          </div>
        </section>

        <section id="nodes" className="space-y-12 pt-16 border-t" style={{ borderColor: "rgba(144,200,255,0.1)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-white/30 text-[10px] tracking-[0.5em] uppercase">// CONNECT_NODES_DETECTION</h3>
            <span className="text-[10px] text-[#90c8ff]/50 font-mono animate-pulse uppercase">Scanning_External_Links...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {CONNECT_NODES.map((node) => (
              <a key={node.id} href={node.url} target="_blank" rel="noopener noreferrer" className="ct-node-card" onMouseEnter={() => playTick(700, "sine", 0.08, 0.022)}>
                <div className="ct-node-dot">● Uplink_Live</div>
                <h4 className="ct-node-name">{node.name}</h4>
                <p className="ct-node-desc">{node.desc}</p>
                <div className="ct-node-footer">
                  <span className="ct-node-status">{node.status}</span>
                  <span className="ct-node-arrow">↗</span>
                </div>
                <div className="ct-node-bg-num">{node.id}</div>
              </a>
            ))}
          </div>
        </section>

        <div className="py-12 text-center border-b" style={{ borderColor: "rgba(144,200,255,0.08)" }}>
          <p className="text-white/30 text-[10px] tracking-[0.3em] uppercase leading-loose font-light italic">DECENTRALIZED NODES ACTIVE // NO PHYSICAL HEADQUARTERS // ZERO_POINT_FAILURE_PROTOCOL</p>
        </div>
      </div>
    </ProtocolLayout>
  );
}
