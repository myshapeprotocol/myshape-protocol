"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ProtocolHeader from "@/components/header/header";
import HandshakeVisual from "./HandshakeVisual";
import type { VisualParams } from "./HandshakeVisual";
import MatrixGrid from "./MatrixGrid";
import { playTick } from "@/utils/useAudioTick";
import "./HandshakeRitual.css";

/* ──────────────────────────────────────────────
   HandshakeRitual — 协议节点注册仪式

   状态机: idle → connecting → sovereign
   驱动 MetaCore + DataStreams + DataCorona
   + MatrixGrid + HaloScan 五个视觉层
   ────────────────────────────────────────────── */

type Stage = "idle" | "connecting" | "sovereign" | "error";

interface NodeResult {
  node_token: string;
  node_handle: string;
  stage: string;
}

/* ═══════════════════════════════════════════════
   视觉参数映射表 — 三阶段规范
   ═══════════════════════════════════════════════ */
const VISUAL_PRESETS: Record<Exclude<Stage, "error">, VisualParams> = {
  idle: {
    outerOpacity: 0.2,
    innerOpacity: 0,
    outerSpeed: 0.3,
    innerSpeed: 0,
    nodeGlow: 0.1,
    streamIntensity: 0,
    coronaIntensity: 0,
    wireframeColor: "#90c8ff",
    coreColor: "#90c8ff",
    streamColor: "#90c8ff",
    nodeToken: null,
  },
  connecting: {
    outerOpacity: 0.5,
    innerOpacity: 0.3,
    outerSpeed: 1.5,
    innerSpeed: 0.8,
    nodeGlow: 0.4,
    streamIntensity: 0.25,
    coronaIntensity: 0.2,
    wireframeColor: "#90c8ff",
    coreColor: "#b8dcff",
    streamColor: "#90c8ff",
    nodeToken: null,
  },
  sovereign: {
    outerOpacity: 0.85,
    innerOpacity: 1.0,
    outerSpeed: 3.0,
    innerSpeed: 2.2,
    nodeGlow: 1.0,
    streamIntensity: 0.7,
    coronaIntensity: 1.0,
    wireframeColor: "#c0e0ff",
    coreColor: "#e8f4ff",
    streamColor: "#e0f0ff",
    nodeToken: null, // 运行时注入
  },
};

const HandshakeRitual: React.FC = () => {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [nodeResult, setNodeResult] = useState<NodeResult | null>(null);
  const [envChecked, setEnvChecked] = useState(false);

  /* ── 挂载时检查全局会话：已有活跃节点 → 直接展示 sovereign 状态 ── */
  useEffect(() => {
    const existingToken = sessionStorage.getItem("node_token");
    const existingHandle = sessionStorage.getItem("node_handle");
    const existingEmail = sessionStorage.getItem("node_email");
    if (existingToken && existingHandle && existingEmail) {
      // 节点已活跃，跳过握手表单，直接进入 sovereign 展示
      setNodeResult({
        node_token: existingToken,
        node_handle: existingHandle,
        stage: "GENESIS_NODE_INITIALIZED",
      });
      setEmail(existingEmail);
      setStage("sovereign");
    }
    setEnvChecked(true);
  }, [router]);

  /* ── Sovereign 6s 后自动导航至 Dashboard ── */
  useEffect(() => {
    if (stage !== "sovereign") return;
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 6000);
    return () => clearTimeout(timer);
  }, [stage, router]);

  /* ── 视觉参数：当前值 → 目标值平滑过渡 ── */
  const [visualParams, setVisualParams] = useState<VisualParams>(VISUAL_PRESETS.idle);

  useEffect(() => {
    if (stage === "error") return; // error 时保持当前视觉但不更新

    const target =
      stage === "sovereign"
        ? { ...VISUAL_PRESETS.sovereign, nodeToken: nodeResult?.node_token ?? null }
        : VISUAL_PRESETS[stage];

    // 分步过渡（每帧更新一个字段，视觉上平滑）
    const steps = Object.keys(target) as (keyof VisualParams)[];
    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx >= steps.length) {
        clearInterval(interval);
        return;
      }
      setVisualParams((prev) => {
        const next = { ...prev };
        const key = steps[stepIdx];
        (next as unknown as Record<string, unknown>)[key] =
          (target as unknown as Record<string, unknown>)[key];
        return next;
      });
      stepIdx++;
    }, 60);

    return () => clearInterval(interval);
  }, [stage, nodeResult]);

  /* ── 调用 handshake API ── */
  const handleInitiate = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.includes("@")) {
        setStage("error");
        setErrorMsg("INVALID_EMAIL_FORMAT");
        return;
      }

      setStage("connecting");
      setErrorMsg("");

      try {
        const res = await fetch("/api/nodes/handshake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            origin_domain: window.location.hostname,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStage("error");
          setErrorMsg(data.error || "HANDSHAKE_FAILED");
          return;
        }

        // 持久化到 session
        sessionStorage.setItem("node_token", data.node_token);
        sessionStorage.setItem("node_handle", data.node_handle);
        sessionStorage.setItem("node_email", cleanEmail);
        window.dispatchEvent(new CustomEvent("node:connected"));

        setNodeResult(data);
        setStage("sovereign");
      } catch (err: unknown) {
        setStage("error");
        setErrorMsg(
          (err as Error).message?.slice(0, 120) || "PROTOCOL_CORE_INTERRUPT"
        );
      }
    },
    [email]
  );

  const handleReset = () => {
    setStage("idle");
    setEmail("");
    setErrorMsg("");
    setNodeResult(null);
  };

  /* ── 派生视觉状态 ── */
  const matrixIntensity = stage === "sovereign" ? 0.8 : stage === "connecting" ? 0.4 : 0.1;
  const haloRings = stage === "connecting" ? 6 : stage === "sovereign" ? 8 : 3;
  const haloIntensity = stage === "sovereign" ? 1.0 : stage === "connecting" ? 0.5 : 0.08;
  const uiFaded = stage === "connecting";

  /* ── 会话检查中：不渲染任何内容，避免闪烁 ── */
  if (!envChecked) return null;

  return (
    <>
      <ProtocolHeader />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <h1 className="sr-only">
        MyShape Protocol — Node Handshake — Sovereign Identity Initialization
      </h1>

      {/* ═══════════════════════════════════════════
          Layer 0: 全息矩阵网格背景
          ═══════════════════════════════════════════ */}
      <MatrixGrid intensity={matrixIntensity} />

      {/* ═══════════════════════════════════════════
          Layer 1–3: Three.js 核心 + 数据流 + 星芒
          ═══════════════════════════════════════════ */}
      <HandshakeVisual params={visualParams} />

      {/* ═══════════════════════════════════════════
          Layer 4: CSS 深感光环扫描
          ═══════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2 }}>
      </div>

      {/* ═══════════════════════════════════════════
          Layer 5a: 标题 — fixed 顶部，导航栏下方
          ═══════════════════════════════════════════ */}
      <div
        className="fixed left-0 right-0 flex flex-col items-center text-center pointer-events-none transition-all duration-1000"
        style={{
          top: "115px",
          zIndex: 10,
          opacity: uiFaded ? 0.25 : 1,
          filter: uiFaded ? "blur(2px)" : "none",
        }}
      >
        {/* 环境标签 — 仅 idle 时可见，提示开发者当前 API 目标 */}
        {stage === "idle" && (
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="text-[#90c8ff]/55 font-mono text-[11px] tracking-[0.25em] uppercase border border-[#90c8ff]/30 px-2 py-0.5">
              ENV: SUPABASE_PRODUCTION
            </span>
            <span className="text-white/30 font-mono text-[11px] tracking-[0.15em]">
              — node registration is permanent —
            </span>
          </div>
        )}
        <h2
          className="text-white text-lg md:text-2xl font-light tracking-tight mb-3"
          style={{
            textShadow: "0 0 40px rgba(144,200,255,0.3), 0 0 60px rgba(144,200,255,0.1)",
          }}
        >
          {stage === "sovereign"
            ? "Sovereign Node Active."
            : stage === "error"
              ? "Handshake Interrupted."
              : "Initialize Node Handshake."}
        </h2>
        <p className="text-[#90c8ff]/50 font-mono text-[11px] md:text-[11px] tracking-[0.25em] md:tracking-[0.4em] uppercase">
          {stage === "sovereign"
            ? "SOVEREIGN_IDENTITY_CORE_ONLINE"
            : "ESTABLISHING_PROTOCOL_NODE_PRESENCE"}
        </p>
      </div>

      {/* ═══════════════════════════════════════════
          Layer 5b: 表单/卡片 — fixed 底部
          ═══════════════════════════════════════════ */}
      <div
        className="fixed left-0 right-0 bottom-0 flex flex-col items-center pb-6 md:pb-8 pointer-events-none transition-all duration-1000"
        style={{
          zIndex: 10,
          opacity: uiFaded ? 0.25 : 1,
          filter: uiFaded ? "blur(2px)" : "none",
        }}
      >
        <div className="pointer-events-auto">
        <AnimatePresence mode="wait">
            {/* ── IDLE ── */}
            {stage === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              >
                <form onSubmit={handleInitiate} className="flex flex-col items-center space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#90c8ff]/30" />
                    <span className="text-[#90c8ff]/40 font-mono text-[11px] tracking-[0.4em] uppercase">
                      Node_Registration
                    </span>
                    <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#90c8ff]/30" />
                  </div>

                  <div
                    className="relative group"
                    onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
                  >
                    <div
                      className="absolute -inset-[1px] rounded-sm opacity-30 group-focus-within:opacity-65 transition-opacity duration-700"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(144,200,255,0.2), transparent 40%, transparent 60%, rgba(144,200,255,0.2))",
                        filter: "blur(5px)",
                      }}
                    />
                    <div
                      className="relative px-5 py-3 overflow-hidden"
                      style={{
                        border: "1px solid rgba(144,200,255,0.2)",
                        background: "rgba(2,10,20,0.85)",
                      }}
                    >
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#90c8ff]/50 handshake-corner" />
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#90c8ff]/50 handshake-corner" />
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#90c8ff]/50 handshake-corner" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#90c8ff]/50 handshake-corner" />
                      <div className="absolute inset-0 pointer-events-none handshake-scan-overlay" />
                      <input
                        type="email"
                        placeholder="ENTITY@PROTOCOL.IO"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleInitiate();
                        }}
                        className="relative z-10 w-56 max-w-[55vw] bg-transparent py-3 text-center text-[11px] tracking-[0.2em] text-white/85 focus:outline-none placeholder:text-white/15"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    onMouseEnter={() => playTick(800, "sine", 0.1, 0.025)}
                    className="relative group px-10 py-3 transition-all duration-500 overflow-hidden font-mono text-[11px] tracking-[0.3em] uppercase border border-[#90c8ff]/35 text-[#90c8ff]/75 hover:text-white hover:border-[#90c8ff] hover:shadow-[0_0_24px_rgba(144,200,255,0.2)]"
                    style={{ background: "rgba(144,200,255,0.05)" }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 handshake-btn-bg" />
                    <span className="relative z-10">Initiate_Handshake →</span>
                  </button>
                </form>
                <a href="/genesis"
                  className="text-[#90c8ff]/30 hover:text-[#90c8ff]/60 text-[11px] tracking-[0.12em] uppercase transition-colors no-underline mt-3">
                  Genesis Cohort? Initialize_Genesis →
                </a>
              </motion.div>
            )}

            {/* ── CONNECTING ── */}
            {stage === "connecting" && (
              <motion.div
                key="connecting"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center space-y-6"
              >
                <div className="relative w-10 h-10">
                  <div
                    className="absolute inset-0 rounded-full border border-[#90c8ff]/30 animate-spin"
                    style={{ borderTopColor: "rgba(144,200,255,0.85)" }}
                  />
                </div>
                <span className="text-[#90c8ff]/70 font-mono text-[11px] tracking-[0.4em] uppercase">
                  Injecting_Ethereal_Data_Energy...
                </span>
                <div className="w-40 h-[1px] bg-[#90c8ff]/8 relative overflow-hidden">
                  <div className="absolute inset-0 handshake-progress-bar" />
                </div>
              </motion.div>
            )}

            {/* ── SOVEREIGN ── */}
            {stage === "sovereign" && nodeResult && (
              <motion.div
                key="sovereign"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col items-center space-y-5"
              >
                {/* 激活光环 */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6, ease: [0, 0.6, 0.3, 1] }}
                  className="relative w-14 h-14 flex items-center justify-center"
                >
                  <div className="absolute inset-0 rounded-full handshake-success-outer" />
                  <div className="absolute inset-2 rounded-full handshake-success-mid" />
                  <div className="absolute inset-4 rounded-full handshake-success-inner" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-3 h-3 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle at 35% 35%, #fff, rgba(160,220,255,0.9))",
                      boxShadow: "0 0 14px rgba(180,220,255,0.8)",
                    }}
                  />
                </motion.div>

                {/* 节点身份卡 */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="relative handshake-card-glow"
                  style={{
                    border: "1px solid rgba(144,200,255,0.25)",
                    background: "rgba(4,12,24,0.9)",
                    boxShadow:
                      "0 0 40px rgba(144,200,255,0.08), inset 0 0 20px rgba(144,200,255,0.03)",
                  }}
                >
                  <div className="flex items-center justify-between px-5 py-2 border-b border-[#90c8ff]/10">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#c0e0ff] shadow-[0_0_8px_rgba(180,220,255,0.8)] animate-[nodePulse_2s_ease-in-out_infinite]" />
                      <span className="text-[#90c8ff]/55 font-mono text-[11px] tracking-[0.35em] uppercase">
                        Sovereign_Node_Identity
                      </span>
                    </div>
                    <span className="text-white/25 font-mono text-[11px] tracking-[0.2em]">
                      {nodeResult.stage}
                    </span>
                  </div>

                  <div className="px-4 py-3 space-y-3">
                    <div>
                      <div className="text-white/25 font-mono text-[11px] tracking-[0.2em] uppercase mb-0.5">
                        Node_Handle
                      </div>
                      <div
                        className="text-[#b0dcff] font-mono text-xs tracking-[0.12em] handshake-token-reveal"
                        style={{ textShadow: "0 0 14px rgba(160,210,255,0.4)" }}
                      >
                        {nodeResult.node_handle}
                      </div>
                    </div>
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-[#90c8ff]/12 to-transparent" />
                    <div>
                      <div className="text-white/25 font-mono text-[11px] tracking-[0.2em] uppercase mb-0.5">
                        Node_Token
                      </div>
                      <div
                        className="text-[#90c0e8]/60 font-mono text-[11px] tracking-[0.06em] break-all handshake-token-reveal"
                        style={{ animationDelay: "0.4s" }}
                      >
                        {nodeResult.node_token}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.4 }}
                  onClick={handleReset}
                  onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                  className="relative group px-10 py-3 font-mono text-[11px] tracking-[0.3em] uppercase transition-all duration-500 border border-[#90c8ff]/25 text-[#90c8ff]/60 hover:text-white hover:border-[#90c8ff]/60"
                  style={{ background: "rgba(144,200,255,0.03)" }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 handshake-btn-bg" />
                  <span className="relative z-10">Initialize_Another_Node</span>
                </motion.button>

                {/* 自动跳转提示 */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.4 }}
                  className="text-white/15 font-mono text-[11px] tracking-[0.15em]"
                >
                  Auto-redirecting to Dashboard in 6s...
                </motion.p>
              </motion.div>
            )}

            {/* ── ERROR ── */}
            {stage === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center space-y-5"
              >
                <div className="text-red-300/75 font-mono text-[11px] tracking-[0.25em] uppercase animate-pulse">
                  {`> ${errorMsg}`}
                </div>
                <button
                  onClick={handleReset}
                  onMouseEnter={() => playTick(600, "sine", 0.08, 0.02)}
                  className="px-8 py-3 border border-white/20 text-white/55 font-mono text-[11px] tracking-[0.3em] uppercase hover:border-white/50 hover:text-white transition-all"
                >
                  Retry_Handshake
                </button>
              </motion.div>
            )}
        </AnimatePresence>
        </div>
      </div>

      {/* ── 协议参考信息 ── */}
      <div
        className={`fixed bottom-8 left-2 md:bottom-14 md:left-4 transition-opacity duration-1000 hidden md:block ${
          stage !== "idle" ? "opacity-0" : "opacity-20"
        }`}
        style={{ zIndex: 10 }}
      >
        <div className="text-[11px] font-mono text-white/30 tracking-[0.5em] leading-relaxed uppercase text-left">
          Protocol_Ref: 007_HANDSHAKE <br />
          Core: MetaCore_Ω <br />
          Status: {stage === "idle" ? "STANDBY" : stage.toUpperCase()}
        </div>
      </div>
      </div>
    </>
  );
};

export default HandshakeRitual;
