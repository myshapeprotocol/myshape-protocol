"use client";

import React from 'react';
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import { playTick } from "@/utils/useAudioTick";

export default function ContactClient() {
  // 1. 变量定义必须在函数内部，return 之前
  const connectNodes = [
    { 
      id: "12", 
      name: "X_PROTOCOL", 
      desc: "UPDATES, PROTOCOL ANNOUNCEMENTS, AND CIVILIZATION SIGNALS.", 
      status: "SIGNAL_ACTIVE",
      url: "https://x.com/myshapeprotocol",
      active: true 
    },
    { 
      id: "13", 
      name: "LINKEDIN", 
      desc: "ORGANIZATION PROFILE, HIRING, AND INSTITUTIONAL PRESENCE.", 
      status: "STABLE_LINK",
      url: "https://www.linkedin.com/company/111557251/",
      active: true 
    },
    {
      id: "14",
      name: "DISCORD",
      desc: "DEVELOPER COMMUNITY, PROTOCOL DISCUSSIONS, AND INTEGRATION SUPPORT.",
      status: "GATEWAY_OPEN",
      url: "https://discord.gg/zr8Tczard",
      active: true
    },
    { 
      id: "15", 
      name: "GITHUB",
      desc: "OPEN‑SOURCE REPOSITORIES, SDKS, AND PROTOCOL REFERENCE IMPLEMENTATIONS.",
      status: "REPO_ACTIVE",
      url: "https://github.com/myshapeprotocol",
      active: true
    }
  ];

  return (
    <ProtocolLayout 
      refId="011" 
      category="SYS_CONNECT" 
      title="CONTACT & NODES" 
      secLevel="CLASS_GAMMA" 
      systemStatus="GATEWAY_OPEN"
    >
      <div className="space-y-32">
        
        {/* --- SECTION A: DIRECT UPLINK (Email 通讯区) --- */}
        <section className="space-y-16">
          <div className="max-w-4xl">
            <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4">// ESTABLISHING_CONNECTION</h2>
            <p className="text-xl md:text-2xl font-light tracking-[0.2em] text-white leading-tight uppercase">
              FOR PARTNERSHIPS, RESEARCH COLLABORATION, OR <span className="text-[#90c8ff]">PROTOCOL INTEGRATION</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 隐私声明块 */}
            <div className="border p-12 transition-all duration-500"
              style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
              onMouseEnter={e => { playTick(500, "sine", 0.04, 0.01); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-1.5 bg-[#90c8ff] rounded-full animate-pulse shadow-[0_0_8px_rgba(144,200,255,0.5)]" />
                <span className="text-[#90c8ff] text-[10px] tracking-[0.4em] font-bold uppercase">PRIVACY_PROTOCOL_ACTIVE</span>
              </div>
              <p className="text-white/40 text-[10px] tracking-[0.2em] leading-loose uppercase italic">
                "MYSHAPE MAINTAINS A STRICT PRIVACY-FIRST COMMUNICATION POLICY."
              </p>
            </div>
            {/* 邮箱入口块 */}
            <div className="border p-12 flex flex-col justify-center transition-all duration-500"
              style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
              onMouseEnter={e => { playTick(500, "sine", 0.04, 0.01); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
              <div className="group">
                <span className="block text-white/20 text-[8px] tracking-[0.4em] uppercase mb-2">Contact</span>
                <a href="mailto:protocol@myshape.com" onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)} className="text-white text-lg tracking-[0.2em] font-light hover:text-[#90c8ff] transition-colors">PROTOCOL@MYSHAPE.COM</a>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION B: CONNECT_NODES (网格区) --- */}
        <section id="nodes" className="space-y-12 pt-16 border-t" style={{ borderColor: "rgba(144,200,255,0.1)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-white/20 text-[9px] tracking-[0.6em] uppercase">// CONNECT_NODES_DETECTION</h3>
            <span className="text-[8px] text-[#90c8ff]/50 font-mono animate-pulse uppercase">Scanning_External_Links...</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {connectNodes.map((node) => (
              node.active ? (
                <a
                  key={node.id}
                  href={node.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={e => { playTick(700, "sine", 0.08, 0.015); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}
                  className="border p-10 group transition-all duration-500 relative overflow-hidden block"
                  style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
                >
                  <div className="text-[#90c8ff] text-[9px] font-mono mb-8 font-bold tracking-widest animate-pulse uppercase">● Uplink_Live</div>
                  <h4 className="text-white text-[13px] tracking-[0.3em] font-bold uppercase mb-6 group-hover:text-[#90c8ff] transition-colors">{node.name}</h4>
                  <p className="text-white/30 text-[9px] tracking-[0.2em] leading-relaxed uppercase mb-12 h-16">{node.desc}</p>
                  <div className="flex justify-between items-center border-t border-white/10 pt-6">
                    <span className="text-[8px] text-[#90c8ff] tracking-widest font-bold uppercase">{node.status}</span>
                    <span className="text-white/20 group-hover:text-[#90c8ff] transition-all transform group-hover:translate-x-1">↗</span>
                  </div>
                  <div className="absolute -bottom-4 -right-2 text-[60px] font-bold text-white/[0.02] select-none pointer-events-none group-hover:text-[#90c8ff]/[0.05]">{node.id}</div>
                </a>
              ) : (
                // 锁定节点 (Discord & GitHub): 彻底灰掉，鼠标过去不亮
                <div 
                  key={node.id} 
                  className="border p-10 opacity-30 grayscale relative overflow-hidden pointer-events-none select-none"
                  style={{ borderColor: "rgba(144,200,255,0.06)", background: "transparent" }}
                >
                  <div className="text-white/20 text-[9px] font-mono mb-8 tracking-widest uppercase">○ {node.status}</div>
                  <h4 className="text-white/20 text-[13px] tracking-[0.3em] font-bold uppercase mb-6">{node.name}</h4>
                  <p className="text-white/10 text-[9px] tracking-[0.2em] leading-relaxed uppercase mb-12 h-16">{node.desc}</p>
                  <div className="flex justify-between items-center border-t border-white/5 pt-6 italic text-[8px] text-white/5 tracking-[0.3em] uppercase">
                    Coming_Soon_...
                  </div>
                  <div className="absolute -bottom-4 -right-2 text-[60px] font-bold text-white/[0.01] select-none">{node.id}</div>
                </div>
              )
            ))}
          </div>
        </section>

        {/* --- 底部节点状态声明 --- */}
        <div className="py-12 text-center border-b" style={{ borderColor: "rgba(144,200,255,0.08)" }}>
          <p className="text-white/20 text-[9px] tracking-[0.4em] uppercase leading-loose font-light italic">
            DECENTRALIZED NODES ACTIVE // NO PHYSICAL HEADQUARTERS // ZERO_POINT_FAILURE_PROTOCOL
          </p>
        </div>
      </div>
    </ProtocolLayout>
  );
}