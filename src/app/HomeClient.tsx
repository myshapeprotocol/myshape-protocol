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
        <section className="relative py-24 md:py-32">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4">Protocol_Stack</div>
              <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff", margin: 0 }}>
                Human <span style={{ color: "rgba(144, 200, 255, 0.8)" }}>Presence</span> Protocol
              </h2>
              <p style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)", fontWeight: 300, color: "rgba(255,255,255,0.7)", marginTop: "1.8rem", maxWidth: "550px", lineHeight: 1.7, marginLeft: "auto", marginRight: "auto" }}>
                Five-layer reference implementation. Open specification. Developer-ready.
              </p>
            </div>

            {/* Five Layers — staggered floating cards */}
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent"
                style={{ maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)" }} />
              {[
                { l: "L5", name: "Agent Identity", desc: "Cross-species verification. Human and AI identities coexist in one protocol.", hue: 210, ml: "ml-0 md:ml-16", mr: "mr-0 md:mr-16" },
                { l: "L4", name: "Proof Layer", desc: "Zero-knowledge proofs. Verify presence without exposing motion data.", hue: 205, ml: "ml-0 md:ml-4", mr: "mr-0 md:mr-4" },
                { l: "L3", name: "Identity Vector", desc: "Motion geometry distilled into a compact, non-replicable signature.", hue: 200, ml: "ml-0 md:ml-12", mr: "mr-0 md:mr-12" },
                { l: "L2", name: "Behavior Encoding", desc: "4-dimensional entropy scoring detects AI-generated motion.", hue: 195, ml: "ml-0 md:ml-2", mr: "mr-0 md:mr-2" },
                { l: "L1", name: "Motion Capture", desc: "Real-time camera input. All processing on-device. Nothing uploaded.", hue: 190, ml: "ml-0 md:ml-20", mr: "mr-0 md:mr-20" },
              ].map((layer, i) => (
                <div key={layer.l} className={`${i % 2 === 0 ? layer.ml : layer.mr} mb-3 group`}>
                  <div className="relative border border-cyan-400/10 bg-black/40 hover:border-cyan-400/25 transition-all duration-700 overflow-hidden"
                    style={{
                      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                      backdropFilter: "blur(4px)",
                    }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                      style={{ background: `radial-gradient(ellipse at 20% 50%, rgba(144,200,255,0.06) 0%, transparent 60%)` }} />
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="flex items-center gap-4 px-5 py-4">
                      <span className="w-10 h-10 flex items-center justify-center font-mono text-[11px] shrink-0 rounded-sm"
                        style={{
                          border: `1px solid rgba(144,200,255,0.2)`,
                          color: `hsla(${layer.hue}, 70%, 75%, 0.7)`,
                          background: `hsla(${layer.hue}, 50%, 50%, 0.08)`,
                          boxShadow: `0 0 12px hsla(${layer.hue}, 70%, 60%, 0.15), inset 0 1px 0 hsla(${layer.hue}, 70%, 80%, 0.1)`,
                        }}>
                        {layer.l}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-white/70 text-[12px] tracking-[0.2em] uppercase mb-1">{layer.name}</div>
                        <div className="text-white/25 text-[10px] tracking-[0.06em] leading-relaxed">{layer.desc}</div>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full shrink-0 opacity-30 group-hover:opacity-80 transition-opacity duration-700"
                        style={{ background: `hsla(${layer.hue}, 70%, 70%, 0.8)`, boxShadow: `0 0 6px hsla(${layer.hue}, 70%, 60%, 0.4)` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Light CTA row */}
            <div className="flex flex-wrap justify-center gap-6 mt-12">
              <a href="/papers/technical-spec" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                className="text-cyan-400/35 hover:text-cyan-300/80 text-[10px] tracking-[0.2em] uppercase font-mono transition-all duration-500 border-b border-transparent hover:border-cyan-400/30 pb-0.5">
                Technical Spec →
              </a>
              <a href="/papers/threat-model" onMouseEnter={() => playTick(900, "sine", 0.10, 0.025)}
                className="text-cyan-400/35 hover:text-cyan-300/80 text-[10px] tracking-[0.2em] uppercase font-mono transition-all duration-500 border-b border-transparent hover:border-cyan-400/30 pb-0.5">
                Threat Model →
              </a>
              <a href="/developers" onMouseEnter={() => playTick(1000, "sine", 0.10, 0.025)}
                className="text-cyan-400/35 hover:text-cyan-300/80 text-[10px] tracking-[0.2em] uppercase font-mono transition-all duration-500 border-b border-transparent hover:border-cyan-400/30 pb-0.5">
                Developer SDK →
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