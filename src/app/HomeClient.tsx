"use client";
import React, { useState, useEffect } from "react"; 
import { createClient } from '@supabase/supabase-js';
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";
import Hero from "@/components/hero/Hero";
import Vision from "@/components/vision/Vision";
import Capabilities from "@/components/capabilities/Capabilities";
import HowItWorks from "@/components/howitworks/HowItWorks";
import JoinWaitlist from "@/components/joinwaitlist/JoinWaitlist";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function HomeClient() {
  const [activeUser, setActiveUser] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [clientHash, setClientHash] = useState("0X7B2E1A9C");
  const [isGenesisUser, setIsGenesisUser] = useState(false);
  const [genesisStatus, setGenesisStatus] = useState("ACTIVE");

  const maskIdentifier = (id: string) => {
    if (!id) return "RODDOG03";
    const name = id.includes('@') ? id.split('@')[0] : id;
    if (name.length <= 4) return name.toUpperCase();
    return `${name.substring(0, 2)}****${name.slice(-2)}`.toUpperCase();
  };

  useEffect(() => {
    // 优先检查本地 Genesis 状态
    if (typeof window !== "undefined" && sessionStorage.getItem("genesis_completed") === "1") {
      const email = sessionStorage.getItem("genesis_email") || "";
      const st = sessionStorage.getItem("genesis_status") || "ACTIVE";
      setActiveUser(email);
      setIsGenesisUser(true);
      setGenesisStatus(st);
    }
  }, []);

  useEffect(() => {
    if (!supabase || isGenesisUser) return;

    const fetchLastNode = async () => {
      const { data } = await supabase
        .from("protocol_nodes")
        .select("email")
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) setActiveUser(data[0].email);
    };

    fetchLastNode();

    const channel = supabase
      .channel("realtime_nodes")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "protocol_nodes" },
        (payload) => { setActiveUser(payload.new.email); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isGenesisUser]);

  useEffect(() => {
    let i = 0;
    const targetID = activeUser ? maskIdentifier(activeUser) : "RODDOG03";
    setDisplayText("");
    setIsTyping(true);
    const timer = setInterval(() => {
      setDisplayText(targetID.slice(0, i));
      i++;
      if (i > targetID.length) { setIsTyping(false); clearInterval(timer); }
    }, 100);
    return () => clearInterval(timer);
  }, [activeUser]);

  useEffect(() => {
    const hashInterval = setInterval(() => {
      setClientHash(`0X${Math.random().toString(16).substring(2, 10).toUpperCase()}`);
    }, 3000); 
    return () => clearInterval(hashInterval);
  }, []);

  return (
    <>
      <ProtocolHeader />
      
      {/* 🔹 悬浮 HUD 监控层 🔹 */}
      <div className="fixed inset-0 z-[999] pointer-events-none">
        <div className="absolute top-10 right-10 pointer-events-auto">
          <div className="flex items-center gap-2">
             <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_cyan]" />
             <span className="font-mono text-[9px] tracking-[0.3em] text-white/60 uppercase">LIVE_FEED</span>
          </div>
        </div>
        
        <div className="absolute bottom-10 right-10 text-right">
          <div className="flex flex-col items-end">
            {isGenesisUser ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[7px] tracking-[0.3em] text-cyan-400/70 uppercase font-light">YOUR_IDENTITY</span>
                  <div className="w-1 h-1 bg-cyan-300 rounded-full shadow-[0_0_8px_rgba(144,200,255,0.9)]" />
                </div>
                <div className="text-[12px] font-extralight text-cyan-200/90 tracking-[0.4em] uppercase leading-none mb-2 font-mono"
                  style={{ textShadow: "0 0 10px rgba(144,200,255,0.3)" }}>
                  {displayText}
                </div>
                <div className="pr-3 border-r border-cyan-400/40 text-[7px] text-cyan-300/50 space-y-1 tracking-[0.1em] font-mono">
                  <p>STATUS: {genesisStatus}</p>
                  <p className="opacity-50">HASH: {clientHash}</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[7px] tracking-[0.3em] text-cyan-500/50 uppercase font-light">LAST_NODE_INBOUND</span>
                  <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_cyan]" />
                </div>
                <div className="text-[12px] font-extralight text-white/90 tracking-[0.4em] uppercase leading-none mb-2 font-mono">
                  {displayText}
                  {isTyping && <span className="inline-block w-1.5 h-3 bg-cyan-400 ml-1 animate-pulse" />}
                </div>
                <div className="pr-3 border-r border-cyan-500/30 text-[7px] text-cyan-400/40 space-y-1 tracking-[0.1em] font-mono">
                  <p className="animate-pulse">HASH: {clientHash}</p>
                  <p>STATUS: STREAMING</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 主内容区 🔹 */}
      <main className="relative z-0 w-full overflow-x-hidden bg-black">
        <Hero />
        <Vision />
        {/* 注意：Capabilities 或 HowItWorks 组件内应包含指向 /protocol-core 的链接 */}
        <Capabilities />
        <HowItWorks />

        {/* ── Protocol Stack ── */}
        <section className="relative py-24 md:py-32 border-y border-white/5">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="text-cyan-500/50 text-[10px] tracking-[0.5em] uppercase mb-4">Protocol_Stack</div>
              <h2 className="text-2xl md:text-3xl font-light tracking-[0.15em] text-white uppercase">
                Human Presence Protocol
              </h2>
              <p className="text-white/40 text-[12px] leading-relaxed max-w-xl mx-auto">
                Five-layer reference implementation. Open specification. Developer-ready.
              </p>
            </div>

            {/* Five Layers */}
            <div className="space-y-1 mb-14">
              {[
                { l: "L5", name: "Agent Identity", desc: "AI-native identity declaration & verification", color: "cyan" },
                { l: "L4", name: "Proof Layer", desc: "ZK-Presence: PoP + MP + EP → composite proof", color: "cyan" },
                { l: "L3", name: "Identity Vector", desc: "Motion Vector → SST 18-pt → Feature Pipeline", color: "cyan" },
                { l: "L2", name: "Behavior Encoding", desc: "PES engine — 4-dimensional entropy scoring", color: "cyan" },
                { l: "L1", name: "Motion Capture", desc: "Real-time capture → MediaPipe → on-device processing", color: "cyan" },
              ].map((layer) => (
                <div key={layer.l} className="flex items-center gap-4 px-5 py-3 border border-white/5 bg-black/30 group hover:border-cyan-500/20 transition-all">
                  <span className="w-8 h-8 flex items-center justify-center border border-cyan-500/30 text-cyan-400/60 font-mono text-[10px] shrink-0">{layer.l}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-white/60 text-[11px] tracking-[0.2em] uppercase">{layer.name}</span>
                  </div>
                  <span className="text-white/20 text-[10px] tracking-[0.1em] hidden md:block">{layer.desc}</span>
                </div>
              ))}
            </div>

            {/* Entry Points */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/papers/technical-spec"
                onMouseEnter={e => { playTick(800, "sine", 0.10, 0.025); e.currentTarget.style.boxShadow = "0 0 30px rgba(34,211,238,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 0px rgba(34,211,238,0)"; }}
                className="group p-6 border border-cyan-400/20 bg-cyan-400/[0.03] hover:bg-cyan-400/[0.08] hover:border-cyan-400/50 hover:-translate-y-1 transition-all duration-500 text-center"
                style={{ boxShadow: "0 0 0px rgba(34,211,238,0)" }}
              >
                <div className="text-cyan-400/60 text-[11px] tracking-[0.3em] uppercase mb-2 group-hover:text-cyan-300/80 transition-colors duration-500">Read</div>
                <div className="text-white/70 text-[11px] tracking-[0.2em] uppercase mb-1 group-hover:text-white transition-colors duration-500">Technical Spec</div>
                <div className="text-white/20 text-[9px] tracking-[0.1em] group-hover:text-white/35 transition-colors duration-500">Motion Vector · PES · Proof System</div>
                <div className="mt-4 text-cyan-400/40 group-hover:text-cyan-300 group-hover:translate-x-1.5 transition-all duration-500 inline-block">→</div>
              </a>
              <a href="/papers/threat-model"
                onMouseEnter={e => { playTick(900, "sine", 0.10, 0.025); e.currentTarget.style.boxShadow = "0 0 30px rgba(34,211,238,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 0px rgba(34,211,238,0)"; }}
                className="group p-6 border border-cyan-400/20 bg-cyan-400/[0.03] hover:bg-cyan-400/[0.08] hover:border-cyan-400/50 hover:-translate-y-1 transition-all duration-500 text-center"
                style={{ boxShadow: "0 0 0px rgba(34,211,238,0)" }}
              >
                <div className="text-cyan-400/60 text-[11px] tracking-[0.3em] uppercase mb-2 group-hover:text-cyan-300/80 transition-colors duration-500">Review</div>
                <div className="text-white/70 text-[11px] tracking-[0.2em] uppercase mb-1 group-hover:text-white transition-colors duration-500">Threat Model</div>
                <div className="text-white/20 text-[9px] tracking-[0.1em] group-hover:text-white/35 transition-colors duration-500">8 Attack Signatures · Entropy Gap Theorem</div>
                <div className="mt-4 text-cyan-400/40 group-hover:text-cyan-300 group-hover:translate-x-1.5 transition-all duration-500 inline-block">→</div>
              </a>
              <a href="/developers"
                onMouseEnter={e => { playTick(1000, "sine", 0.10, 0.025); e.currentTarget.style.boxShadow = "0 0 30px rgba(34,211,238,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 0px rgba(34,211,238,0)"; }}
                className="group p-6 border border-cyan-400/20 bg-cyan-400/[0.03] hover:bg-cyan-400/[0.08] hover:border-cyan-400/50 hover:-translate-y-1 transition-all duration-500 text-center"
                style={{ boxShadow: "0 0 0px rgba(34,211,238,0)" }}
              >
                <div className="text-cyan-400/60 text-[11px] tracking-[0.3em] uppercase mb-2 group-hover:text-cyan-300/80 transition-colors duration-500">Build</div>
                <div className="text-white/70 text-[11px] tracking-[0.2em] uppercase mb-1 group-hover:text-white transition-colors duration-500">Developer SDK</div>
                <div className="text-white/20 text-[9px] tracking-[0.1em] group-hover:text-white/35 transition-colors duration-500">5 Lines to Integrate · TypeScript · Zero Deps</div>
                <div className="mt-4 text-cyan-400/40 group-hover:text-cyan-300 group-hover:translate-x-1.5 transition-all duration-500 inline-block">→</div>
              </a>
            </div>
          </div>
        </section>

        <JoinWaitlist id="genesis" />
      </main>

      <ProtocolFooter />
    </>
  );
}