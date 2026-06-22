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

            {/* ── Cryptographic Sovereign Spine ── */}
            <div className="relative max-w-3xl mx-auto">
              {/* Quantum Spine — central axis */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px]"
                style={{ background: "linear-gradient(to bottom, hsla(270,60%,70%,0.4), hsla(200,60%,60%,0.3), hsla(180,50%,50%,0.2))" }} />
              {/* Spine glow pulse */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[3px] opacity-20"
                style={{ background: "linear-gradient(to bottom, hsla(270,60%,70%,0.6), hsla(200,60%,60%,0.4), hsla(180,50%,50%,0.2))", filter: "blur(4px)" }} />

              {[
                { l: "L5", name: "AGENT IDENTITY", desc: "Cross-species verification. Human and AI identities coexist in one protocol.", meta: "PROOF_STATE: ACTIVE_COEXISTENCE // 0x2A19F", hue: 270, side: "right" as const },
                { l: "L4", name: "PROOF LAYER", desc: "Zero-knowledge proofs. Verify presence without exposing raw motion data.", meta: "VERIFIER: ZK_SNARK_PASS // SIG_OK", hue: 230, side: "left" as const },
                { l: "L3", name: "IDENTITY VECTOR", desc: "Motion geometry distilled into a compact, non-replicable signature.", meta: "GEOMETRY: VECTOR_3D_DISTILLED // SIG_SECURE", hue: 210, side: "right" as const },
                { l: "L2", name: "BEHAVIOR ENCODING", desc: "4-dimensional entropy scoring detects and flags AI-generated synthetic motion.", meta: "ENTROPY: 4D_SCORING_VERIFIED // 0.992_REAL", hue: 195, side: "left" as const },
                { l: "L1", name: "MOTION CAPTURE", desc: "Real-time local camera input. All processing on-device. Zero data upload.", meta: "HARDWARE: LOCAL_SANDBOX // ENCLAVE_SECURE", hue: 180, side: "right" as const },
              ].map((layer) => (
                <div key={layer.l} className={`relative flex items-center mb-6 ${layer.side === "left" ? "flex-row" : "flex-row-reverse"}`}>
                  {/* Spine connector */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-10 border-2"
                    style={{
                      borderColor: `hsla(${layer.hue}, 60%, 60%, 0.5)`,
                      background: `hsla(${layer.hue}, 50%, 30%, 0.8)`,
                      boxShadow: `0 0 8px hsla(${layer.hue}, 60%, 60%, 0.3)`,
                    }} />

                  {/* Bracket Card */}
                  <div className={`w-[calc(50%-20px)] group`}>
                    <div className="relative"
                      style={{
                        background: "rgba(2,4,10,0.85)",
                        border: "none",
                      }}>
                      {/* Opening bracket */}
                      <span className="absolute top-0 bottom-0 w-[8px] opacity-40 group-hover:opacity-80 transition-opacity duration-500"
                        style={{
                          [layer.side === "left" ? "left" : "right"]: 0,
                          borderLeft: layer.side === "left" ? "1px solid rgba(144,200,255,0.4)" : "none",
                          borderRight: layer.side === "right" ? "1px solid rgba(144,200,255,0.4)" : "none",
                          borderTop: "none",
                          borderBottom: "none",
                        }} />
                      <span className={`absolute top-0 h-[1px] w-6 opacity-40 group-hover:opacity-80 transition-opacity duration-500 ${layer.side === "left" ? "left-0" : "right-0"}`}
                        style={{ background: "rgba(144,200,255,0.4)" }} />
                      <span className={`absolute bottom-0 h-[1px] w-6 opacity-40 group-hover:opacity-80 transition-opacity duration-500 ${layer.side === "left" ? "left-0" : "right-0"}`}
                        style={{ background: "rgba(144,200,255,0.4)" }} />

                      <div className={`${layer.side === "left" ? "pl-5 pr-4" : "pr-5 pl-4"} py-4`}>
                        {/* Layer label + name */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-[9px] tracking-[0.3em] shrink-0"
                            style={{ color: `hsla(${layer.hue}, 70%, 70%, 0.6)` }}>
                            {layer.l}
                          </span>
                          <span className="text-white/60 text-[11px] tracking-[0.25em] uppercase font-light">
                            {layer.name}
                          </span>
                        </div>
                        {/* Description */}
                        <p className="text-white/25 text-[10px] tracking-[0.06em] leading-relaxed mb-2">
                          {layer.desc}
                        </p>
                        {/* Metadata chip */}
                        <div className="inline-block px-2 py-0.5 font-mono text-[8px] tracking-[0.1em]"
                          style={{
                            border: `1px solid hsla(${layer.hue}, 40%, 50%, 0.25)`,
                            color: `hsla(${layer.hue}, 50%, 70%, 0.6)`,
                            background: `hsla(${layer.hue}, 30%, 20%, 0.15)`,
                          }}>
                          {layer.meta}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Empty spacer for the other side */}
                  <div className="w-[calc(50%-20px)]" />
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