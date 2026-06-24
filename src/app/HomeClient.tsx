"use client";
import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";
import Typewriter from "@/components/ui/Typewriter";
import HeroDemo from "@/components/hero-demo/HeroDemo";
import Vision from "@/components/vision/Vision";
import Capabilities from "@/components/capabilities/Capabilities";
import HowItWorks from "@/components/howitworks/HowItWorks";
import JoinWaitlist from "@/components/joinwaitlist/JoinWaitlist";
import GenesisProgress from "@/components/genesis-progress/GenesisProgress";
import ParadigmShift from "@/components/paradigm-shift/ParadigmShift";

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
    if (!id) return "";
    const name = id.includes('@') ? id.split('@')[0] : id;
    if (name.length <= 4) return name.toUpperCase();
    return `${name.substring(0, 2)}****${name.slice(-2)}`.toUpperCase();
  };

  useEffect(() => {
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
            ) : activeUser ? (
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
            ) : null}
          </div>
        </div>
      </div>

      <main className="relative z-0 w-full overflow-x-hidden">
        <HeroDemo />

        {/* ── Genesis Cohort Progress ── */}
        <section className="relative z-10 -mt-6 mb-8">
          <div className="max-w-3xl mx-auto px-6">
            <GenesisProgress />
          </div>
        </section>

        {/* ── Paradigm Shift — Legacy vs MyShape ── */}
        <ParadigmShift />

        {/* ── Protocol Stack — engineering first ── */}
        <section className="relative py-24 md:py-32">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="text-white/35 text-[9px] tracking-[0.6em] uppercase mb-4">Protocol_Stack</div>
              <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff", margin: 0 }}>
                Human <span style={{ color: "rgba(144, 200, 255, 0.8)" }}>Presence</span> Protocol
              </h2>
              <p style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)", fontWeight: 300, color: "rgba(255,255,255,0.7)", marginTop: "1.8rem", maxWidth: "550px", lineHeight: 1.7, marginLeft: "auto", marginRight: "auto" }}>
                Reference implementation. Open specification. Developer-ready.
              </p>
            </div>

            {/* ── Cryptographic Sovereign Spine ── */}
            <div className="relative max-w-3xl mx-auto">
              {/* Mobile: simplified stack */}
              <div className="md:hidden space-y-2">
                {[
                  { l: "L5", name: "AGENT IDENTITY", desc: "Cross-species verification. Human and AI identities coexist in one protocol.", meta: "PROOF_STATE: ACTIVE_COEXISTENCE // 0x2A19F", delay: "0s" },
                  { l: "L4", name: "PROOF LAYER", desc: "Zero-knowledge proofs. Verify presence without exposing raw motion data.", meta: "VERIFIER: ZK_SNARK_PASS // SIG_OK", delay: "0.3s" },
                  { l: "L3", name: "IDENTITY VECTOR", desc: "Motion geometry distilled into a compact, non-replicable signature.", meta: "GEOMETRY: VECTOR_3D_DISTILLED // SIG_SECURE", delay: "0.6s" },
                  { l: "L2", name: "BEHAVIOR ENCODING", desc: "4-dimensional entropy scoring detects and flags AI-generated synthetic motion.", meta: "ENTROPY: 4D_SCORING_VERIFIED // 0.992_REAL", delay: "0.9s" },
                  { l: "L1", name: "MOTION CAPTURE", desc: "Real-time local camera input. All processing on-device. Zero data upload.", meta: "HARDWARE: LOCAL_SANDBOX // ENCLAVE_SECURE", delay: "1.2s" },
                ].map(layer => (
                  <div key={layer.l} className="group p-6 transition-all duration-500"
                    style={{ border: "1px solid rgba(144,200,255,0.1)", borderRadius: "12px", background: "transparent" }}
                    onMouseEnter={e => { playTick(600, "sine", 0.08, 0.02); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-[11px] shrink-0" style={{ color: "rgba(144,200,255,0.4)", textShadow: "0 0 6px rgba(144,200,255,0.15)", animation: `nodePulse 2.5s ease-in-out ${layer.delay} infinite` }}>{layer.l}</span>
                      <span className="text-white/80 text-[15px] font-light tracking-[0.02em] group-hover:text-white transition-colors duration-500">{layer.name}</span>
                    </div>
                    <p className="text-white/30 text-[13px] font-light leading-relaxed mb-2 group-hover:text-white/55 transition-colors duration-500">{layer.desc}</p>
                    <div className="inline-block px-2 py-0.5 font-mono text-[8px] tracking-[0.1em] rounded border border-cyan-400/10 text-cyan-400/40 bg-cyan-400/[0.02] group-hover:border-cyan-400/30 group-hover:text-cyan-300/70 transition-all duration-500">{layer.meta}</div>
                  </div>
                ))}
              </div>

              {/* Desktop: Quantum Spine */}
              <div className="hidden md:block">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px]"
                style={{ background: "linear-gradient(to bottom, transparent, rgba(144,200,255,0.3), rgba(144,200,255,0.2), rgba(144,200,255,0.1), transparent)" }} />
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[3px] opacity-20"
                style={{ background: "linear-gradient(to bottom, transparent, rgba(144,200,255,0.4), rgba(144,200,255,0.2), transparent)", filter: "blur(4px)" }} />
              <div className="absolute left-1/2 -translate-x-1/2 z-20"
                style={{ animation: "dropletScroll 6s ease-in-out infinite" }}>
                <div className="relative w-3 h-4 rounded-full"
                  style={{
                    background: "radial-gradient(ellipse at 35% 25%, rgba(220,240,255,0.6) 0%, rgba(140,200,240,0.2) 40%, transparent 70%)",
                    boxShadow: "0 0 10px rgba(160,210,240,0.25), inset 0 -1px 2px rgba(100,160,210,0.2)",
                  }}>
                  <div className="absolute top-[20%] left-[30%] w-1 h-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.5)" }} />
                </div>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 w-[2px] h-16"
                style={{
                  background: "linear-gradient(to bottom, transparent, rgba(200,230,255,0.3), transparent)",
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
                <div key={layer.l} className={`relative flex items-center mb-4 ${layer.side === "left" ? "flex-row" : "flex-row-reverse"}`}>
                  <div className="absolute top-1/2 z-10"
                    style={{
                      left: layer.side === "left" ? "calc(50% - 14px)" : "50%",
                      width: "14px",
                      height: "1px",
                      background: "rgba(144,200,255,0.15)",
                    }} />

                  <div className={`w-[calc(50%-20px)] group`}>
                    <div className="relative overflow-hidden transition-all duration-500 hover:-translate-y-1"
                      style={{ background: "transparent", border: "1px solid rgba(144,200,255,0.1)", borderRadius: "12px" }}
                      onMouseEnter={e => {
                        playTick([400, 550, 700, 850, 1000][5 - parseInt(layer.l.slice(1))] || 600, "sine", 0.10, 0.02);
                        e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)";
                        e.currentTarget.style.background = "radial-gradient(circle at top left, rgba(144,200,255,0.06) 0%, transparent 70%)";
                        e.currentTarget.style.boxShadow = "0 12px 32px -8px rgba(144,200,255,0.12)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)";
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.boxShadow = "none";
                      }}>
                      <span className="absolute top-0 bottom-0 w-[8px] opacity-20 group-hover:opacity-80 transition-opacity duration-500"
                        style={{
                          [layer.side === "left" ? "left" : "right"]: 0,
                          borderLeft: layer.side === "left" ? "1px solid rgba(144,200,255,0.35)" : "none",
                          borderRight: layer.side === "right" ? "1px solid rgba(144,200,255,0.35)" : "none",
                          borderTop: "none",
                          borderBottom: "none",
                        }} />
                      <span className={`absolute top-0 h-[1px] w-6 opacity-20 group-hover:opacity-80 transition-opacity duration-500 ${layer.side === "left" ? "left-0" : "right-0"}`}
                        style={{ background: "rgba(144,200,255,0.35)" }} />
                      <span className={`absolute bottom-0 h-[1px] w-6 opacity-20 group-hover:opacity-80 transition-opacity duration-500 ${layer.side === "left" ? "left-0" : "right-0"}`}
                        style={{ background: "rgba(144,200,255,0.35)" }} />

                      <div className={`${layer.side === "left" ? "pl-5 pr-4" : "pr-5 pl-4"} py-4`}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-[11px] tracking-[0.3em] shrink-0 group-hover:text-cyan-300/80 transition-all duration-500"
                            style={{
                              color: "rgba(144, 200, 255, 0.4)",
                              textShadow: "0 0 6px rgba(144,200,255,0.15)",
                              animation: `nodePulse 2.5s ease-in-out ${layer.delay} infinite`,
                            }}>
                            {layer.l}
                          </span>
                          <span className="text-white text-[15px] font-light tracking-[0.02em] group-hover:text-white transition-colors duration-500">
                            {layer.name}
                          </span>
                        </div>
                        <p className="text-white/35 text-[13px] font-light leading-relaxed mb-2 group-hover:text-white/55 transition-colors duration-500">
                          {layer.desc}
                        </p>
                        <div className="inline-block px-2 py-0.5 font-mono text-[8px] tracking-[0.1em] rounded group-hover:border-cyan-400/30 group-hover:text-cyan-300/70 transition-all duration-500"
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

                  <div className="w-[calc(50%-20px)]" />
                </div>
              ))}
            </div>
            </div>

            {/* Protocol Artifacts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-10">
              {[
                { label: "Read", title: "Technical Spec v1", desc: "Motion Vector · PES · Proof System · SST Topology", href: "/papers/technical-spec", freq: 800 as const },
                { label: "Review", title: "Threat Model", desc: "8 Attack Signatures · Entropy Gap Theorem · Cost Model", href: "/papers/threat-model", freq: 900 as const },
                { label: "Build", title: "Developer SDK", desc: "5 Lines · TypeScript · Zero Dependencies · MIT License", href: "/developers", freq: 1000 as const },
              ].map(card => (
                <a key={card.href} href={card.href}
                  onMouseEnter={e => { playTick(card.freq, "sine", 0.10, 0.025); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.background = "radial-gradient(circle at top left, rgba(144,200,255,0.06) 0%, transparent 70%)"; e.currentTarget.style.boxShadow = "0 12px 32px -8px rgba(144,200,255,0.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
                  className="group block p-6 overflow-hidden transition-all duration-500"
                  style={{ border: "1px solid rgba(144,200,255,0.1)", borderRadius: "12px", background: "transparent" }}>
                  <div className="text-cyan-400/40 text-[11px] tracking-[0.2em] uppercase mb-3 font-mono group-hover:text-cyan-400/70 transition-colors duration-500">{card.label}</div>
                  <div className="text-white text-[19px] font-light tracking-[0.02em] mb-2 group-hover:text-white transition-colors duration-500">{card.title}</div>
                  <div className="text-white/35 text-[14px] font-light leading-relaxed group-hover:text-white/55 transition-colors duration-500">{card.desc}</div>
                  <div className="mt-4 text-cyan-400/25 group-hover:text-cyan-400/60 group-hover:translate-x-1 transition-all duration-500 inline-block text-[10px]">→</div>
                </a>
              ))}
            </div>

            {/* Bottom Dashboard — Status + Metrics in one compact row */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-10 text-[10px] tracking-[0.15em] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)] animate-pulse shrink-0" />
                <Typewriter text="PROTOCOL_ENCLAVE: ACTIVE" className="text-cyan-400/50 uppercase" />
                <span className="text-white/10">|</span>
                <span className="text-white/30">ENGINES</span>
                <span className="text-white/50">15</span>
                <span className="text-white/10">|</span>
                <span className="text-white/30">SPEC</span>
                <span className="text-white/50">§1–40</span>
                <span className="text-white/10">|</span>
                <span className="text-white/30">ATTACK_SIGS</span>
                <span className="text-white/50">8</span>
                <span className="text-white/10">|</span>
                <span className="text-white/30">INTEGRATION</span>
                <span className="text-white/50">5L</span>
                <span className="text-white/10">|</span>
                <span className="text-white/30">CORE</span>
                <span className="text-white/50">25/25_PASS</span>
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
