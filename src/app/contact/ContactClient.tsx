"use client";

import React from 'react';
import ProtocolLayout from "@/components/layout/ProtocolLayout";

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
      status: "GATEWAY_LOCKED",
      url: "#", 
      active: false 
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
              FOR PARTNERSHIPS, RESEARCH COLLABORATION, OR <span className="text-cyan-400">PROTOCOL INTEGRATION</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10">
            {/* 隐私声明块 */}
            <div className="bg-[#02040a] p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                <span className="text-cyan-400 text-[10px] tracking-[0.4em] font-bold uppercase">PRIVACY_PROTOCOL_ACTIVE</span>
              </div>
              <p className="text-white/40 text-[10px] tracking-[0.2em] leading-loose uppercase italic">
                "MYSHAPE MAINTAINS A STRICT PRIVACY-FIRST COMMUNICATION POLICY."
              </p>
            </div>
            {/* 邮箱入口块 */}
            <div className="bg-[#02040a] p-12 flex flex-col justify-center space-y-8">
              <div className="group">
                <span className="block text-white/20 text-[8px] tracking-[0.4em] uppercase mb-2">Core_Inquiries</span>
                <a href="mailto:hello@myshape.com" className="text-white text-lg tracking-[0.2em] font-light hover:text-cyan-400 transition-colors">HELLO@MYSHAPE.COM</a>
              </div>
              <div className="group">
                <span className="block text-white/20 text-[8px] tracking-[0.4em] uppercase mb-2">Technical_Uplink</span>
                <a href="mailto:dev@myshape.com" className="text-white text-lg tracking-[0.2em] font-light hover:text-cyan-400 transition-colors">DEV@MYSHAPE.COM</a>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION B: CONNECT_NODES (网格区) --- */}
        <section id="nodes" className="space-y-12 pt-16 border-t border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-white/20 text-[9px] tracking-[0.6em] uppercase">// CONNECT_NODES_DETECTION</h3>
            <span className="text-[8px] text-cyan-500/50 font-mono animate-pulse uppercase">Scanning_External_Links...</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10">
            {connectNodes.map((node) => (
              node.active ? (
                // 活跃节点 (X & LinkedIn): 鼠标滑过会亮
                <a 
                  key={node.id} 
                  href={node.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-[#02040a] p-10 group hover:bg-cyan-500/[0.08] transition-all relative overflow-hidden block"
                >
                  <div className="text-cyan-400 text-[9px] font-mono mb-8 font-bold tracking-widest animate-pulse uppercase">● Uplink_Live</div>
                  <h4 className="text-white text-[13px] tracking-[0.3em] font-bold uppercase mb-6 group-hover:text-cyan-400 transition-colors">{node.name}</h4>
                  <p className="text-white/30 text-[9px] tracking-[0.2em] leading-relaxed uppercase mb-12 h-16">{node.desc}</p>
                  <div className="flex justify-between items-center border-t border-white/10 pt-6">
                    <span className="text-[8px] text-cyan-400 tracking-widest font-bold uppercase">{node.status}</span>
                    <span className="text-white/20 group-hover:text-cyan-400 transition-all transform group-hover:translate-x-1">↗</span>
                  </div>
                  <div className="absolute -bottom-4 -right-2 text-[60px] font-bold text-white/[0.02] select-none pointer-events-none group-hover:text-cyan-500/[0.05]">{node.id}</div>
                </a>
              ) : (
                // 锁定节点 (Discord & GitHub): 彻底灰掉，鼠标过去不亮
                <div 
                  key={node.id} 
                  className="bg-[#02040a] p-10 opacity-30 grayscale relative overflow-hidden pointer-events-none select-none"
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
        <div className="py-12 text-center border-b border-white/5">
          <p className="text-white/20 text-[9px] tracking-[0.4em] uppercase leading-loose font-light italic">
            DECENTRALIZED NODES ACTIVE // NO PHYSICAL HEADQUARTERS // ZERO_POINT_FAILURE_PROTOCOL
          </p>
        </div>
      </div>
    </ProtocolLayout>
  );
}