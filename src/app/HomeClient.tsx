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

        {/* ── Protocol Stack — engineering first ── */}
        <section className="relative py-24 md:py-32">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4">Protocol_Stack</div>
              <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff", margin: 0 }}>
                Human <span style={{ color: "rgba(144, 200, 255, 0.8)" }}>Presence</span> Protocol
              </h2>
              <p style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)", fontWeight: 300, color: "rgba(255,255,255,0.7)", marginTop: "1.8rem", maxWidth: "550px", lineHeight: 1.7, marginLeft: "auto", marginRight: "auto" }}>
                Reference implementation. Open specification. Developer-ready.
              </p>
            </div>

            {/* ── Cryptographic Sovereign Spine ── */}
            <div className="relative max-w-3xl mx-auto">
              {/* Quantum Spine — central axis */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px]"
                style={{ background: "linear-gradient(to bottom, transparent, rgba(144,200,255,0.3), rgba(144,200,255,0.2), rgba(144,200,255,0.1), transparent)" }} />
              {/* Spine glow pulse */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[3px] opacity-20"
                style={{ background: "linear-gradient(to bottom, transparent, rgba(144,200,255,0.4), rgba(144,200,255,0.2), transparent)", filter: "blur(4px)" }} />
              {/* Scanning beam */}
              <div className="absolute left-1/2 -translate-x-1/2 w-[2px] h-16"
                style={{
                  background: "linear-gradient(to bottom, transparent, rgba(200,230,255,0.5), transparent)",
                  animation: "spineScan 4s ease-in-out infinite",
                  filter: "blur(1px)",
                }} />

              {[
                { l: "L5", name: "AGENT IDENTITY", desc: "Cross-species verification. Human and AI identities coexist in one protocol.", meta: "PROOF_STATE: ACTIVE_COEXISTENCE // 0x2A19F", hue: 270, side: "right" as const, delay: "0s" },
                { l: "L4", name: "PROOF LAYER", desc: "Zero-knowledge proofs. Verify presence without exposing raw motion data.", meta: "VERIFIER: ZK_SNARK_PASS // SIG_OK", hue: 230, side: "left" as const, delay: "0.3s" },
                { l: "L3", name: "IDENTITY VECTOR", desc: "Motion geometry distilled into a compact, non-replicable signature.", meta: "GEOMETRY: VECTOR_3D_DISTILLED // SIG_SECURE", hue: 210, side: "right" as const, delay: "0.6s" },
                { l: "L2", name: "BEHAVIOR ENCODING", desc: "4-dimensional entropy scoring detects and flags AI-generated synthetic motion.", meta: "ENTROPY: 4D_SCORING_VERIFIED // 0.992_REAL", hue: 195, side: "left" as const, delay: "0.9s" },
                { l: "L1", name: "MOTION CAPTURE", desc: "Real-time local camera input. All processing on-device. Zero data upload.", meta: "HARDWARE: LOCAL_SANDBOX // ENCLAVE_SECURE", hue: 180, side: "right" as const, delay: "1.2s" },
              ].map((layer) => (
                <div key={layer.l} className={`relative flex items-center mb-6 ${layer.side === "left" ? "flex-row" : "flex-row-reverse"}`}>
                  {/* Spine connector — pulsing */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-10 border-2"
                    style={{
                      borderColor: "rgba(144,200,255,0.4)",
                      background: "rgba(144,200,255,0.15)",
                      boxShadow: "0 0 8px rgba(144,200,255,0.2)",
                      animation: `nodePulse 2.5s ease-in-out ${layer.delay} infinite`,
                    }} />

                  {/* Bracket Card */}
                  <div className={`w-[calc(50%-20px)] group`}>
                    <div className="relative transition-all duration-500 hover:-translate-y-0.5"
                      style={{
                        background: "rgba(2,4,10,0.85)",
                        border: "none",
                      }}
                      onMouseEnter={e => {
                        playTick([400, 550, 700, 850, 1000][5 - parseInt(layer.l.slice(1))] || 600, "sine", 0.10, 0.02);
                        e.currentTarget.style.background = "rgba(2,4,10,0.95)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4), 0 0 20px rgba(144,200,255,0.06)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "rgba(2,4,10,0.85)";
                        e.currentTarget.style.boxShadow = "none";
                      }}>
                      {/* Opening bracket */}
                      <span className="absolute top-0 bottom-0 w-[8px] opacity-30 group-hover:opacity-70 transition-opacity duration-500"
                        style={{
                          [layer.side === "left" ? "left" : "right"]: 0,
                          borderLeft: layer.side === "left" ? "1px solid rgba(144,200,255,0.35)" : "none",
                          borderRight: layer.side === "right" ? "1px solid rgba(144,200,255,0.35)" : "none",
                          borderTop: "none",
                          borderBottom: "none",
                        }} />
                      <span className={`absolute top-0 h-[1px] w-6 opacity-30 group-hover:opacity-70 transition-opacity duration-500 ${layer.side === "left" ? "left-0" : "right-0"}`}
                        style={{ background: "rgba(144,200,255,0.35)" }} />
                      <span className={`absolute bottom-0 h-[1px] w-6 opacity-30 group-hover:opacity-70 transition-opacity duration-500 ${layer.side === "left" ? "left-0" : "right-0"}`}
                        style={{ background: "rgba(144,200,255,0.35)" }} />

                      <div className={`${layer.side === "left" ? "pl-5 pr-4" : "pr-5 pl-4"} py-4`}>
                        {/* Layer label + name */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-[10px] tracking-[0.3em] shrink-0"
                            style={{ color: "rgba(144, 200, 255, 0.4)" }}>
                            {layer.l}
                          </span>
                          <span className="text-white/70 text-[11px] tracking-[0.2em] uppercase group-hover:text-white transition-colors duration-500">
                            {layer.name}
                          </span>
                        </div>
                        {/* Description */}
                        <p className="text-white/25 text-[10px] tracking-[0.06em] leading-relaxed mb-2 group-hover:text-white/45 transition-colors duration-500">
                          {layer.desc}
                        </p>
                        {/* Metadata chip */}
                        <div className="inline-block px-2 py-0.5 font-mono text-[8px] tracking-[0.1em] group-hover:border-cyan-400/30 group-hover:text-cyan-300/70 transition-all duration-500"
                          style={{
                            border: "1px solid rgba(144, 200, 255, 0.15)",
                            color: "rgba(144, 200, 255, 0.5)",
                            background: "rgba(144, 200, 255, 0.04)",
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

            {/* Protocol Artifacts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-14">
              {[
                { label: "Read", title: "Technical Spec v1", desc: "Motion Vector · PES · Proof System · SST Topology", href: "/papers/technical-spec", freq: 800 as const },
                { label: "Review", title: "Threat Model", desc: "8 Attack Signatures · Entropy Gap Theorem · Cost Model", href: "/papers/threat-model", freq: 900 as const },
                { label: "Build", title: "Developer SDK", desc: "5 Lines · TypeScript · Zero Dependencies · MIT License", href: "/developers", freq: 1000 as const },
              ].map(card => (
                <a key={card.href} href={card.href}
                  onMouseEnter={e => { playTick(card.freq, "sine", 0.10, 0.025); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                  className="group block p-5 transition-all duration-500 text-center"
                  style={{ border: "1px solid rgba(144,200,255,0.1)", background: "rgba(2,4,10,0.85)" }}>
                  <div className="text-cyan-400/30 text-[9px] tracking-[0.3em] uppercase mb-2 group-hover:text-cyan-400/60 transition-colors duration-500">{card.label}</div>
                  <div className="text-white/70 text-[11px] tracking-[0.2em] uppercase mb-1.5 group-hover:text-white transition-colors duration-500">{card.title}</div>
                  <div className="text-white/20 text-[9px] tracking-[0.08em] group-hover:text-white/35 transition-colors duration-500">{card.desc}</div>
                  <div className="mt-3 text-cyan-400/25 group-hover:text-cyan-400/60 group-hover:translate-x-1 transition-all duration-500 inline-block text-[10px]">→</div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Protocol Metrics */}
        <section className="relative py-12">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              {[
                { value: "16", label: "Protocol Engines", sub: "TypeScript · Zero Deps" },
                { value: "§1–40", label: "Spec Sections", sub: "3863-line Technical Spec" },
                { value: "8", label: "Attack Signatures", sub: "4D Entropy Detection" },
                { value: "5", label: "Lines to Integrate", sub: "import MyShape from \"@/sdk\"" },
              ].map(m => (
                <div key={m.label} className="border border-white/5 bg-black/30 p-4">
                  <div className="text-cyan-300/80 text-xl md:text-2xl font-light tracking-wider mb-1">{m.value}</div>
                  <div className="text-white/40 text-[9px] tracking-[0.15em] uppercase mb-0.5">{m.label}</div>
                  <div className="text-white/15 text-[8px] tracking-[0.08em]">{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Vision />
        <Capabilities />
        <HowItWorks />
        <JoinWaitlist id="genesis" />
      </main>

      <ProtocolFooter />
    </>
  );
}