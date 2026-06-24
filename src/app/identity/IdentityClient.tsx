"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import HeroVisual from "@/components/hero/HeroVisual";
import ParticleEngine from "@/components/animations/ParticleEngine";
import GenesisBadge from "@/components/genesis-badge/GenesisBadge";
import { playTick } from "@/utils/useAudioTick";
import "./identity.css";

/* -----------------------------------------
   Utility: Genesis ID Generator
------------------------------------------ */
function makeGenesisId() {
  const t = Date.now().toString(16).toUpperCase();
  const r = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `GNS_${t.slice(-6)}_${r}`;
}

export default function IdentityClient() {
  const [clientReady, setClientReady] = useState(false);
  const [isFormed, setIsFormed] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorHint, setErrorHint] = useState("");
  const [genesisId, setGenesisId] = useState<string>("—");

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

    // 粒子序列：收缩 → 换色(品牌冰蓝白) → 膨胀加速
    window.dispatchEvent(new Event("particle-contract"));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("particle-recolor", { detail: { color: "160, 225, 255" } }));
    }, 400);
    setTimeout(() => {
      window.dispatchEvent(new Event("particle-expand"));
      window.dispatchEvent(new Event("speed-up"));
    }, 700);

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
      // 粒子慢慢降回正常速度，新颜色保持
      window.dispatchEvent(new Event("speed-down"));
    } catch (err: unknown) {
      window.dispatchEvent(new Event("speed-down"));
      window.dispatchEvent(new Event("particle-expand"));
      window.dispatchEvent(new CustomEvent("particle-recolor", { detail: { color: "128, 191, 255" } }));
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

      {/* 粒子系统 — 收缩后永久停留在最终轨道，不替换 */}
      {clientReady && (
        <div className="absolute inset-0 z-[1] pointer-events-none" style={{ transform: "translateY(-10%)" }}>
          <ParticleEngine
            onComplete={handleCollapseComplete}
            centerYOffset={0}
            durationMs={3200}
            colorRgb="128, 191, 255"
          />
        </div>
      )}

      {/* 身份徽章 — 粒子形成后浮现 */}
      {isFormed && (
        <div className="absolute top-6 right-6 md:top-10 md:right-10 z-20">
          <GenesisBadge />
        </div>
      )}

      {/* 底部渐变遮罩 — 匹配面板位置 */}
      <div className="absolute inset-x-0 bottom-0 z-[5] pointer-events-none"
        style={{ height: "min(380px, 60vh)", background: "linear-gradient(to top, rgba(2,4,10,0.97) 0%, rgba(2,4,10,0.7) 35%, rgba(2,4,10,0.25) 70%, transparent 100%)" }} />

      {/* 底部身份面板 */}
      <section className="absolute inset-x-0 bottom-6 md:bottom-8 z-10 px-3">
        <div
          className={`mx-auto w-full max-w-sm transition-all duration-700 ${
            isFormed
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6 pointer-events-none"
          }`}
        >
          <div className="relative overflow-hidden rounded-md font-mono">
            <div className={`pointer-events-none absolute -inset-[1px] rounded-md border transition-all duration-500 ${
              status === "submitting"
                ? "border-cyan-300/60 shadow-[0_0_20px_rgba(144,200,255,0.3)] animate-pulse"
                : status === "success"
                ? "border-cyan-300/40 shadow-[0_0_12px_rgba(144,200,255,0.2)]"
                : "border-cyan-200/20"
            }`} />
            <div className="relative rounded-md border border-cyan-200/20 bg-transparent p-2.5 md:p-3">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-cyan-200/60 shadow-[0_0_18px_rgba(144,200,255,0.55)] identity-scan" />

              {/* Telemetry Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="text-[9px] tracking-[0.7em] uppercase text-white/55">
                  GENESIS_TELEMETRY
                </div>
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
              </div>

              {/* Telemetry Data */}
              <div className="mt-2 grid grid-cols-1 gap-1.5 text-[10px] tracking-[0.28em] uppercase">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/40">GENESIS_SECTOR</span>
                  <span className="text-cyan-200/90">IDENTITY_LAYER</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/40">SECTOR_KEY</span>
                  <span className="text-cyan-200/90">{genesisId}</span>
                </div>
              </div>

              <div className="mt-2.5 h-px w-full bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />

              {/* Email Form */}
              <form onSubmit={submitEmail} className="mt-3">
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
                  <div className="mt-2 flex flex-col items-center gap-2">
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
                      className="group relative inline-flex items-center gap-3 px-8 py-2.5 border border-cyan-400/30 text-cyan-400/60 font-mono text-[9px] tracking-[0.35em] uppercase hover:border-cyan-300/60 hover:text-cyan-100 transition-all duration-500"
                      style={{ textShadow: "0 0 6px rgba(34,211,238,0.2)" }}
                    >
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        style={{ background: "radial-gradient(ellipse at center, rgba(144,200,255,0.08) 0%, transparent 70%)" }} />
                      <span className="relative z-10">◈&nbsp;RETURN_TO_ORIGIN</span>
                      <span className="relative z-10 text-cyan-400/40 group-hover:text-cyan-200 group-hover:translate-x-0.5 transition-all duration-500">→</span>
                    </a>
                    <a href="/motion-demo"
                      className="text-cyan-400/20 hover:text-cyan-300/50 text-[8px] tracking-[0.2em] uppercase font-mono transition-colors mt-1">
                      Verify_Presence → Motion_Demo
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
