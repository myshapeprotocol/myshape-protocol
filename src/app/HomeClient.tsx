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

            {/* Architecture Flow — visual centerpiece */}
            <div className="relative mb-12">
              <div className="hidden md:block absolute top-1/2 left-[5%] right-[5%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                {["Motion", "Behavior", "Identity Vector", "ZK Proof", "Agent Identity"].map((step, i) => (
                  <div key={step} className="flex items-center gap-3 md:gap-4">
                    <div className="group relative px-5 py-2.5 border border-white/10 bg-black/40 hover:border-white/25 hover:bg-black/60 transition-all duration-500 cursor-default"
                      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ background: "radial-gradient(ellipse at center, rgba(144,200,255,0.06) 0%, transparent 70%)" }} />
                      <span className="relative z-10 text-white/50 group-hover:text-white/80 text-[11px] tracking-[0.15em] uppercase transition-colors duration-500">{step}</span>
                    </div>
                    {i < 4 && <span className="text-white/10 text-[12px] font-light">→</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Five Layers — with vertical connecting line */}
            <div className="relative max-w-2xl mx-auto mb-14">
              <div className="absolute left-[19px] top-4 bottom-4 w-[1px] bg-gradient-to-b from-white/10 via-white/5 to-white/10" />
              <div className="space-y-0.5">
                {[
                  { l: "L5", name: "Agent Identity", desc: "Cross-species verification. Human and AI identities coexist in one protocol." },
                  { l: "L4", name: "Proof Layer", desc: "Zero-knowledge proofs. Verify presence without exposing motion data." },
                  { l: "L3", name: "Identity Vector", desc: "Motion geometry distilled into a compact, non-replicable signature." },
                  { l: "L2", name: "Behavior Encoding", desc: "4-dimensional entropy scoring detects AI-generated motion." },
                  { l: "L1", name: "Motion Capture", desc: "Real-time camera input. All processing on-device. Nothing uploaded." },
                ].map((layer) => (
                  <div key={layer.l} className="relative flex items-start gap-4 pl-12 pr-5 py-3 border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-all">
                    <span className="absolute left-0 w-[38px] h-[38px] flex items-center justify-center border border-white/10 bg-black/50 text-white/25 font-mono text-[10px] shrink-0"
                      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                      {layer.l}
                    </span>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="text-white/60 text-[11px] tracking-[0.2em] uppercase mb-0.5">{layer.name}</div>
                      <div className="text-white/20 text-[10px] tracking-[0.08em] leading-relaxed">{layer.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Entry Points — premium cards with top accent line */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: "Read", title: "Technical Spec", desc: "Motion Vector · PES · Proof System", href: "/papers/technical-spec", freq: 800 as const },
                { label: "Review", title: "Threat Model", desc: "8 Attack Signatures · Entropy Gap Theorem", href: "/papers/threat-model", freq: 900 as const },
                { label: "Build", title: "Developer SDK", desc: "5 Lines to Integrate · TypeScript · Zero Deps", href: "/developers", freq: 1000 as const },
              ].map(card => (
                <a key={card.href} href={card.href}
                  onMouseEnter={e => { playTick(card.freq, "sine", 0.10, 0.025); e.currentTarget.style.boxShadow = "0 0 30px rgba(255,255,255,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 0px rgba(255,255,255,0)"; }}
                  className="group relative p-6 border border-white/10 bg-black/40 hover:bg-white/[0.04] hover:border-white/20 hover:-translate-y-1 transition-all duration-500 text-center"
                  style={{ boxShadow: "0 0 0px rgba(255,255,255,0)" }}>
                  <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="text-white/25 text-[10px] tracking-[0.3em] uppercase mb-3 group-hover:text-white/50 transition-colors duration-500">{card.label}</div>
                  <div className="text-white/70 text-[11px] tracking-[0.2em] uppercase mb-2 group-hover:text-white transition-colors duration-500">{card.title}</div>
                  <div className="text-white/15 text-[9px] tracking-[0.1em] group-hover:text-white/30 transition-colors duration-500">{card.desc}</div>
                  <div className="mt-4 text-white/15 group-hover:text-white/50 group-hover:translate-x-1.5 transition-all duration-500 inline-block">→</div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <JoinWaitlist id="genesis" />
      </main>

      <ProtocolFooter />
    </>
  );
}