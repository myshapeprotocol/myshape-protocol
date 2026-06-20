"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import HeroVisual from "@/components/hero/HeroVisual";
import ParticleEngine from "@/components/animations/ParticleEngine";
import "./identity.css";

/* -----------------------------------------
   Utility: Genesis ID Generator
------------------------------------------ */
function makeGenesisId() {
  const t = Date.now().toString(16).toUpperCase();
  const r = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `GNS_${t.slice(-6)}_${r}`;
}

type RitualPhase =
  | "BOOT"
  | "GENESIS_LOCK"
  | "SYNCHRONIZING"
  | "READY_FOR_UPLINK"
  | "UPLINKING"
  | "ACTIVE";

function getRitualPhase(opts: {
  isFormed: boolean;
  status: "idle" | "submitting" | "success" | "error";
}): RitualPhase {
  if (!opts.isFormed) return "BOOT";
  if (opts.status === "submitting") return "UPLINKING";
  if (opts.status === "success") return "ACTIVE";
  return "READY_FOR_UPLINK";
}

export default function IdentityClient() {
  const [clientReady, setClientReady] = useState(false);
  const [isFormed, setIsFormed] = useState(false);
  const [showCollapse, setShowCollapse] = useState(true);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorHint, setErrorHint] = useState("");
  const [genesisId, setGenesisId] = useState<string>("—");

  const ritualPhase = useMemo(
    () => getRitualPhase({ isFormed, status }),
    [isFormed, status]
  );

  const identityState = useMemo(() => {
    if (!isFormed) return "GENESIS_LOCKING";
    if (status === "submitting") return "GENESIS_WRITING";
    if (status === "success") return "GENESIS_ESTABLISHED";
    if (status === "error") return "UPLINK_INTERRUPTED";
    return "AWAITING_UPLINK";
  }, [isFormed, status]);

  /* -----------------------------------------
     Lifecycle
  ------------------------------------------ */
  useEffect(() => {
    setGenesisId(makeGenesisId());
    setClientReady(true);
    const savedEmail = sessionStorage.getItem("genesis_email");
    if (savedEmail) setEmail(savedEmail);
  }, []);

  useEffect(() => {
    if (!isFormed) return;
    const t = setTimeout(() => setShowCollapse(false), 650);
    return () => clearTimeout(t);
  }, [isFormed]);

  const handleCollapseComplete = useCallback(() => {
    setIsFormed(true);
  }, []);

  /* -----------------------------------------
     Submit Email → /api/uplink
  ------------------------------------------ */
  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorHint("");
    setStatus("submitting");

    try {
      const response = await fetch("/api/uplink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          node_handle: genesisId,
        }),
      });

      const rawResponse = await response.text();
      let result;
      try {
        result = JSON.parse(rawResponse);
      } catch (e) {
        result = { error: rawResponse };
      }

      if (!response.ok) {
        throw new Error(result.error || "UPLINK_REJECTED");
      }

      sessionStorage.setItem("genesis_completed", "1");
      setStatus("success");
    } catch (err: unknown) {
      console.error("Local Uplink Error:", err);
      setStatus("error");
      setErrorHint((err as Error).message.toUpperCase());
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#02040a]">
      {/* 隐藏式 H1（AI / Google 可读） */}
      <h1 className="sr-only">
        MyShape Identity — AI-Native Data-Body Initialization
      </h1>

      {/* 背景视觉 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <HeroVisual showCore={false} />
      </div>

      {/* 粒子坍缩动画 */}
      {clientReady && showCollapse && (
        <ParticleEngine
          onComplete={handleCollapseComplete}
          centerYOffset={0}
          durationMs={3200}
          colorRgb="128, 191, 255"
        />
      )}

      {/* 核心身份视觉 */}
      <div
        className={`absolute inset-0 z-[1] pointer-events-none transition-opacity duration-700 ${
          isFormed ? "opacity-100" : "opacity-0"
        }`}
      >
        <HeroVisual showCore />
      </div>

      {/* 底部身份面板 */}
      <section className="absolute inset-x-0 bottom-0 z-10 px-3 pb-3">
        <div
          className={`mx-auto w-full max-w-sm transition-all duration-700 ${
            isFormed
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6 pointer-events-none"
          }`}
        >
          <div className="relative overflow-hidden rounded-md font-mono">
            <div className="pointer-events-none absolute -inset-[1px] rounded-md border border-cyan-200/20" />
            <div className="relative rounded-md border border-cyan-200/20 bg-transparent p-3 md:p-4">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-cyan-200/60 shadow-[0_0_18px_rgba(144,200,255,0.55)] identity-scan" />

              {/* Telemetry Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="text-[9px] tracking-[0.7em] uppercase text-white/55">
                  GENESIS_TELEMETRY
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        status === "success"
                          ? "bg-cyan-200 shadow-[0_0_12px_rgba(144,200,255,0.9)]"
                          : "bg-cyan-300/70 identity-pulse"
                      }`}
                    />
                    <span className="text-[9px] tracking-[0.5em] uppercase text-white/45"
                      style={status === "success" ? { textShadow: "0 0 8px rgba(144,200,255,0.4)" } : {}}>
                      {identityState}
                    </span>
                  </div>
                  <span className="text-[9px] tracking-[0.5em] uppercase text-cyan-300/50">
                    {ritualPhase === "BOOT" && "LOCKING_GENESIS_FIELD"}
                    {ritualPhase === "READY_FOR_UPLINK" &&
                      "SYNCHRONIZING_GENESIS_CHANNEL"}
                    {ritualPhase === "UPLINKING" &&
                      "WRITING_IDENTITY_LEDGER"}
                    {ritualPhase === "ACTIVE" &&
                      "IDENTITY_LAYER_INITIALIZED"}
                  </span>
                </div>
              </div>

              {/* Telemetry Data */}
              <div className="mt-3 grid grid-cols-1 gap-2 text-[10px] tracking-[0.28em] uppercase">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/40">GENESIS_SECTOR</span>
                  <span className="text-cyan-200/90">IDENTITY_LAYER</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/40">SECTOR_KEY</span>
                  <span className="text-cyan-200/90">{genesisId}</span>
                </div>
              </div>

              <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />

              {/* Email Form */}
              <form onSubmit={submitEmail} className="mt-6">
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status !== "idle") setStatus("idle");
                    }}
                    placeholder="EMAIL@ADDRESS.IO"
                    className="w-full bg-transparent border border-cyan-400/25 text-white/90 text-center md:text-left text-[10px] tracking-[0.25em] py-2 px-4 outline-none focus:border-cyan-200/80"
                    type="email"
                    required
                    disabled={status === "submitting" || status === "success"}
                  />
                  <button
                    type="submit"
                    disabled={status === "submitting" || status === "success"}
                    className="relative overflow-hidden border border-white/50 text-white py-2 px-6 text-[9px] tracking-[0.36em] uppercase hover:bg-white hover:text-black transition-colors"
                  >
                    <span className="relative z-10">
                      {status === "success"
                        ? "GENESIS_COMPLETE"
                        : status === "submitting"
                        ? "UPLINKING..."
                        : "COMMENCE_UPLINK"}
                    </span>
                  </button>
                </div>

                {errorHint && (
                  <p className="mt-4 text-[10px] tracking-[0.35em] uppercase text-red-300/80 text-center animate-pulse">
                    {`> ${errorHint}`}
                  </p>
                )}
                {status === "success" && (
                  <div className="mt-3 flex flex-col items-center gap-3">
                    <p className="text-[10px] tracking-[0.35em] uppercase text-cyan-200/70 text-center">
                      NODE_REGISTERED. AUTH_STATE_UPDATED.
                    </p>
                    {typeof window !== "undefined" && sessionStorage.getItem("genesis_status") === "GENESIS_NODE" && (
                      <p className="text-[8px] tracking-[0.3em] uppercase text-cyan-300/60 text-center animate-pulse"
                        style={{ textShadow: "0 0 8px rgba(144,200,255,0.5)" }}>
                        ◈ GENESIS_NODE — FOUNDING_IDENTITY
                      </p>
                    )}
                    <a
                      href="/"
                      onMouseEnter={() => {
                        window.dispatchEvent(new CustomEvent("protocol:particle-resonance"));
                      }}
                      className="px-6 py-1.5 border border-cyan-400/40 text-cyan-400/70 font-mono text-[8px] tracking-[0.3em] uppercase hover:border-cyan-400 hover:text-cyan-200 hover:bg-cyan-400/10 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300"
                      style={{ textShadow: "0 0 8px rgba(34,211,238,0.3)" }}
                    >
                      RETURN_TO_ORIGIN
                    </a>
                  </div>
                )}
              </form>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
