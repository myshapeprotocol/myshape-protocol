"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import VortexScan from "@/components/ritual/VortexScan";
import ConnectWallet from "@/components/auth/ConnectWallet";
import { playTick } from "@/utils/useAudioTick";
import "./genesis.css";

type Stage = "input" | "scanning" | "sending_otp" | "verifying" | "success" | "error";

export default function GenesisClient() {
  const [stage, setStage] = useState<Stage>("input");
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteCodeValid, setInviteCodeValid] = useState<boolean | null>(null);
  const [otp, setOtp] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 实时校验邀请码格式
  const handleInviteCodeChange = (value: string) => {
    const upper = value.toUpperCase();
    setInviteCode(upper);
    if (upper.length >= 19) {
      setInviteCodeValid(/^MYSHAPE-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(upper));
    } else if (upper.length === 0) {
      setInviteCodeValid(null);
    } else {
      setInviteCodeValid(false);
    }
  };

  const handleCommence = async (e?: React.FormEvent<HTMLFormElement> | React.MouseEvent) => {
    if (e && "preventDefault" in e) e.preventDefault();

    try {
      const cleanEmail = (email || "").trim().toLowerCase();
      if (!cleanEmail.includes("@")) {
        setStage("error");
        setErrorMsg("INVALID_EMAIL: A valid email address is required");
        return;
      }

      const normalizedCode = (inviteCode || "").trim().toUpperCase();
      if (normalizedCode && !/^MYSHAPE-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizedCode)) {
        setStage("error");
        setErrorMsg("INVITE_CODE_FORMAT_INVALID: Expected MYSHAPE-XXXX-XXXX");
        return;
      }

      const requestBody = {
        email: cleanEmail,
        invite_code: normalizedCode || undefined,
      };

      setStage("scanning");
      await new Promise((r) => setTimeout(r, 8000));

      setStage("sending_otp");
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        setStage("error");
        setErrorMsg(data.error || "OTP_SEND_FAILED");
        return;
      }

      setStage("verifying");
    } catch (err: unknown) {
      setStage("error");
      setErrorMsg((err as Error).message?.slice(0, 120) || "OTP_FAILED");
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setStage("sending_otp");
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "SIGNATURE_INVALID");
      sessionStorage.setItem("genesis_completed", "1");
      sessionStorage.setItem("genesis_email", email.trim());
      if (data.status) sessionStorage.setItem("genesis_status", data.status);
      setStage("success");
    } catch (err: unknown) {
      setStage("error");
      setErrorMsg((err as Error).message?.slice(0, 60) || "VERIFY_FAILED");
    }
  };

  const isActive = stage === "scanning" || stage === "sending_otp";

  return (
    <ProtocolLayout
      refId="005" category="CIV_LAYER" title="GENESIS_PROTOCOL"
      secLevel="CLASS_OMEGA"
      systemStatus={
        stage === "scanning" ? "KINETIC_SCAN_ACTIVE"
        : stage === "sending_otp" ? "TRANSMITTING_CHALLENGE"
        : stage === "verifying" ? "AWAITING_SIGNATURE"
        : stage === "success" ? "IDENTITY_LAYER_INITIALIZED"
        : stage === "error" ? "UPLINK_INTERRUPTED"
        : "AWAITING_INITIALIZATION"
      }
    >
      <h1 className="sr-only">MyShape Genesis — Identity Initialization Ritual</h1>

      {/* 扫描阶段：纯 CSS 扫描线背景，不加载摄像头/MediaPipe — 避免卡顿 */}
      {stage === "scanning" && (
        <div className="fixed inset-0 z-0 pointer-events-none genesis-scan-bg" />
      )}

      <div className="relative z-10 min-h-[60vh] flex flex-col items-center justify-center text-center mt-4 md:mt-8 pb-16">
        <div className={`transition-all duration-1000 shrink-0 ${isActive ? "opacity-20 blur-sm scale-90" : "opacity-100"}`}>
          <h2 className="text-white text-2xl md:text-4xl font-light tracking-tight mb-3">
            {stage === "success" ? "Genesis Confirmed." : stage === "error" ? "Uplink Interrupted." : "Initialize Genesis."}
          </h2>
          <p className="text-cyan-500/50 font-mono text-[10px] tracking-[0.6em] uppercase mb-6 md:mb-8">
            ESTABLISHING_IDENTITY_LAYER_PROTOCOL
          </p>
        </div>

        <AnimatePresence mode="wait">
          {stage === "input" && (
            <motion.div key="input"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}>
              <div className="mb-8 flex items-center gap-3 justify-center">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-cyan-400/30" />
                <span className="text-cyan-400/20 font-mono text-[7px] tracking-[0.5em] uppercase">Genesis_Protocol</span>
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-cyan-400/30" />
              </div>
              <form onSubmit={handleCommence} className="flex flex-col items-center space-y-5">
                {/* Genesis Cohort 标签 — 滚动数据流 */}
                <div className="flex items-center justify-center gap-2">
                  <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-cyan-400/30" />
                  <div className="cohort-marquee">
                    <span className="cohort-marquee-inner text-cyan-400/70 font-mono text-[8px] tracking-[0.25em] uppercase">
                      ◈ Genesis_Cohort — First 100 only&nbsp;&nbsp;&nbsp;◈ Genesis_Cohort — First 100 only&nbsp;&nbsp;&nbsp;
                    </span>
                  </div>
                  <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-cyan-400/30" />
                </div>

                {/* ── 主路径：Wallet-First ── */}
                <div className="flex flex-col items-center space-y-2 relative">
                  {/* 浮动粒子 */}
                  <div className="absolute -top-3 -right-2 w-1 h-1 rounded-full bg-cyan-400/40 genesis-float-dot" />
                  <div className="absolute top-0 -left-3 w-1 h-1 rounded-full bg-cyan-400/30 genesis-float-dot" />
                  <div className="absolute -bottom-1 right-0 w-1 h-1 rounded-full bg-cyan-400/35 genesis-float-dot" />
                  <ConnectWallet
                    email={email}
                    onSuccess={(walletData) => {
                      if (walletData.skip_otp) {
                        sessionStorage.setItem("genesis_completed", "1");
                        sessionStorage.setItem("genesis_email", email.trim().toLowerCase());
                        sessionStorage.setItem("genesis_status", walletData.is_genesis ? "GENESIS_NODE" : "ACTIVE");
                        setStage("success");
                      }
                    }}
                  />
                  <span className="text-cyan-400/40 text-[9px] tracking-[0.18em] uppercase font-light">Recommended: Trustless on-chain binding</span>
                </div>

                {/* ── 分隔 ── */}
                <div className="flex items-center gap-3 w-full max-w-[260px]">
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  <span className="text-white/25 text-[10px] tracking-[0.3em] uppercase font-light">or</span>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                </div>

                {/* ── 邀请码 — 可折叠 ── */}
                {inviteCode || inviteCodeValid !== null ? (
                  <div className="w-52 max-w-[58vw] mt-1">
                    <div className="relative group">
                      <div className="absolute -inset-[1px] rounded-sm opacity-35 group-focus-within:opacity-70 transition-opacity duration-700"
                        style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.25), transparent 40%, transparent 60%, rgba(168,85,247,0.25))", filter: "blur(5px)" }} />
                      <div className="relative px-4 py-0.5 overflow-hidden"
                        style={{ border: "1px solid rgba(168,85,247,0.3)", background: "rgba(8,4,20,0.85)", boxShadow: "0 0 28px rgba(168,85,247,0.06)" }}>
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-purple-400/70 genesis-invite-corner-tl" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-purple-400/70 genesis-invite-corner-tr" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-purple-400/70 genesis-invite-corner-bl" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-purple-400/70 genesis-invite-corner-br" />
                        <div className="absolute inset-0 pointer-events-none genesis-invite-scan" />
                        {/* 侧边数据流 */}
                        <div className="absolute left-0 top-[15%] bottom-[15%] w-[1px]" style={{ background: "linear-gradient(to bottom, transparent, rgba(168,85,247,0.25), transparent)", animation: "dataFlow 2.5s ease-in-out infinite" }} />
                        <div className="absolute right-0 top-[15%] bottom-[15%] w-[1px]" style={{ background: "linear-gradient(to bottom, transparent, rgba(168,85,247,0.2), transparent)", animation: "dataFlow 2.5s ease-in-out 0.8s infinite" }} />
                        <input type="text" placeholder="INVITE_CODE_XXXX-XXXX-XXXX" value={inviteCode}
                          onChange={(e) => handleInviteCodeChange(e.target.value)}
                          maxLength={19}
                          className="relative z-10 w-full bg-transparent py-3 text-center text-[11px] tracking-[0.2em] text-purple-200/70 focus:outline-none placeholder:text-white/14 transition-all" />
                      </div>
                    </div>
                    {inviteCode.length > 0 && (
                      <div className="text-center mt-1.5">
                        {inviteCodeValid === true ? (
                          <span className="text-green-400/50 font-mono text-[8px] tracking-[0.18em]">◈ CODE_VALID</span>
                        ) : (
                          <span className="text-red-400/45 font-mono text-[8px] tracking-[0.15em]">FORMAT: MYSHAPE-XXXX-XXXX</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <button type="button" onClick={() => setInviteCodeValid(false)}
                    className="text-purple-400/35 hover:text-purple-300/60 text-[10px] tracking-[0.22em] uppercase transition-colors border-b border-dashed border-purple-400/20 pb-0.5">
                    + Enter invite code
                  </button>
                )}
              {/* ── 备选路径：Legacy Email ── */}
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-white/35 text-[10px] tracking-[0.15em] uppercase">Legacy Access (Email)</span>
                  <div className="relative flex items-center gap-2">
                    <div className="relative group genesis-terminal-glow flex-1">
                      <div className="absolute -inset-[1px] rounded-sm opacity-35 group-focus-within:opacity-70 transition-opacity duration-700"
                        style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.2), transparent 40%, transparent 60%, rgba(34,211,238,0.2))", filter: "blur(5px)" }} />
                      <div className="relative pl-5 pr-12 py-0.5 overflow-hidden"
                        style={{ border: "1px solid rgba(34,211,238,0.18)", background: "rgba(2,10,20,0.85)" }}>
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400/60 genesis-corner-tl" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400/60 genesis-corner-tr" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400/60 genesis-corner-bl" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400/60 genesis-corner-br" />
                        <div className="absolute inset-0 pointer-events-none genesis-scan-line" />
                        <div className="absolute left-0 top-[15%] bottom-[15%] w-[1px] genesis-data-stream-l" />
                        <div className="absolute right-0 top-[15%] bottom-[15%] w-[1px] genesis-data-stream-r" />
                        <input type="text" placeholder="GENESIS_EMAIL@ADDRESS.IO" value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleCommence(); }}
                          className="relative z-10 w-52 max-w-[50vw] bg-transparent py-3 pr-2 text-center text-[11px] tracking-[0.25em] text-white/85 focus:outline-none placeholder:text-white/18" />
                        {/* 提交箭头 */}
                        <button type="button" onClick={() => handleCommence()}
                          onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 transition-all duration-300 group/arrow"
                          style={{ color: "rgba(34,211,238,0.4)" }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover/arrow:translate-x-0.5 transition-transform">
                            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <span className="text-white/12 text-[7px] tracking-[0.1em]">                  <span className="text-white/18 text-[8px] tracking-[0.1em]">For restricted environments only</span></span>
                </div>

                </form>
            </motion.div>
          )}

          {stage === "scanning" && (
            <motion.div key="scanning"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center space-y-8">
              <VortexScan />
              <span className="text-cyan-400 font-mono text-[10px] tracking-[1em] uppercase">Extracting_Kinetic_Hash...</span>
              <div className="w-48 h-[1px] bg-cyan-500/10 relative overflow-hidden">
                <div className="absolute inset-0 genesis-progress" />
              </div>
            </motion.div>
          )}

          {stage === "sending_otp" && (
            <motion.div key="sending_otp"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center space-y-6">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-spin" style={{ borderTopColor: "rgba(34,211,238,0.8)" }} />
              </div>
              <span className="text-cyan-400/60 font-mono text-[9px] tracking-[0.5em] uppercase">Transmitting_Challenge...</span>
            </motion.div>
          )}

          {stage === "verifying" && (
            <motion.div key="verifying"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-md w-full">
              <div className="relative"
                style={{ border: "1px solid rgba(34,211,238,0.18)", background: "rgba(2,10,20,0.8)", boxShadow: "0 0 50px rgba(34,211,238,0.04)" }}>
                {/* 顶部状态条 */}
                <div className="flex items-center justify-between px-5 py-2 border-b border-cyan-400/10">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                    <span className="text-cyan-400/50 font-mono text-[7px] tracking-[0.4em] uppercase">IDENTITY_CHALLENGE</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/15 font-mono text-[7px] tracking-[0.2em]">SIG_006</span>
                  </div>
                </div>
                {/* 内容区 */}
                <div className="px-5 md:px-8 py-6 md:py-8">
                  <div className="text-white/25 font-mono text-[8px] tracking-[0.2em] mb-1 text-center uppercase">VERIFICATION CODE SENT TO</div>
                  <div className="text-white/45 font-mono text-[9px] tracking-[0.15em] mb-8 text-center truncate">{email}</div>
                  <form onSubmit={handleVerifyOTP}>
                    <div className="flex justify-center gap-2 md:gap-3 mb-8">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <input key={i} type="text" maxLength={1} value={otp[i] || ""}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            const arr = otp.split("");
                            arr[i] = val.slice(-1);
                            const joined = arr.join("").slice(0, 6);
                            setOtp(joined);
                            if (val && i < 5) otpRefs.current[i + 1]?.focus();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !otp[i] && i > 0) {
                              otpRefs.current[i - 1]?.focus();
                            }
                          }}
                          className="w-10 h-14 md:w-11 md:h-16 bg-transparent text-center text-white font-mono text-xl md:text-2xl outline-none transition-all"
                          style={{
                            borderBottom: otp[i] ? "2px solid rgba(34,211,238,0.8)" : "1px solid rgba(255,255,255,0.1)",
                            textShadow: otp[i] ? "0 0 8px rgba(34,211,238,0.5)" : "none",
                            boxShadow: otp[i] ? "0 4px 12px -4px rgba(34,211,238,0.2)" : "none",
                          }} />
                      ))}
                    </div>
                    <button type="submit" disabled={otp.length !== 6}
                      onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                      className="w-full py-3 border text-[9px] tracking-[0.4em] uppercase font-mono transition-all duration-500"
                      style={{
                        borderColor: otp.length === 6 ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.08)",
                        color: otp.length === 6 ? "rgba(34,211,238,0.8)" : "rgba(255,255,255,0.15)",
                        background: otp.length === 6 ? "rgba(34,211,238,0.05)" : "transparent",
                        textShadow: otp.length === 6 ? "0 0 8px rgba(34,211,238,0.4)" : "none",
                        boxShadow: otp.length === 6 ? "0 0 20px rgba(34,211,238,0.1)" : "none",
                        cursor: otp.length === 6 ? "pointer" : "not-allowed",
                      }}>
                      Verify_Signature
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {stage === "success" && (
            <motion.div key="success"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center space-y-4 md:space-y-5">

              {/* ── 核心确认视觉：光环 + 亮点 ── */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.7, ease: [0, 0.6, 0.3, 1] }}
                className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                {/* 外光环 1 — 慢速大圈 */}
                <div className="absolute inset-0 rounded-full genesis-halo-outer" />
                {/* 外光环 2 — 中速中圈 */}
                <div className="absolute inset-3 rounded-full genesis-halo-mid" />
                {/* 内光环 — 快速小圈 */}
                <div className="absolute inset-6 rounded-full genesis-halo-inner" />
                {/* 中央辉点 */}
                <motion.div
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="relative w-4 h-4 rounded-full genesis-success-core"
                  style={{ background: "radial-gradient(circle at 35% 35%, #fff, rgba(120,200,255,0.9))" }} />
              </motion.div>

              {/* ── Genesis Cohort 身份卡 ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="relative w-full max-w-sm genesis-success-card">
                <div className="absolute -inset-[1px] rounded-sm genesis-card-glow" />
                <div className="relative px-5 py-3 md:px-7 md:py-4 text-center"
                  style={{ border: "1px solid rgba(144,200,255,0.2)", background: "rgba(4,14,28,0.9)" }}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-1 h-1 rounded-full bg-cyan-300 genesis-success-dot-small" />
                    <span className="text-cyan-400/50 font-mono text-[7px] tracking-[0.5em] uppercase">SIGNATURE_ACCEPTED</span>
                  </div>
                  <div className="text-cyan-200/85 font-mono text-[11px] tracking-[0.35em] uppercase mb-2"
                    style={{ textShadow: "0 0 14px rgba(144,200,255,0.5)" }}>
                    GENESIS_COHORT<br />IDENTITY_INITIALIZED
                  </div>
                  <div className="w-12 h-[1px] mx-auto mb-2 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                  <p className="text-white/50 text-[9px] tracking-[0.2em] uppercase leading-relaxed mb-2">
                    You are now a <span className="text-cyan-300/80">Genesis Founding Entity</span>.
                  </p>
                  <p className="text-white/35 text-[9px] tracking-[0.15em] uppercase leading-relaxed">
                    Permanent tier. Never offered again.
                  </p>
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <span className="text-white/30 text-[9px] tracking-[0.15em] font-mono">
                      SIG_KEY: {email.slice(0, 3)}****{email.slice(-4)}
                    </span>
                  </div>
                </div>
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-300/60 genesis-card-corner" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-300/60 genesis-card-corner-tr" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-300/60 genesis-card-corner-bl" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-300/60 genesis-card-corner" />
              </motion.div>

              {/* ── Genesis Cohort 专属徽标 ── */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="flex items-center gap-3 px-5 py-2 border border-cyan-400/15 bg-cyan-400/[0.02]">
                <span className="text-[9px] tracking-[0.3em] uppercase text-cyan-300/60"
                  style={{ textShadow: "0 0 8px rgba(144,200,255,0.3)" }}>
                  ◈ GENESIS_COHORT — FOUNDING_ENTITY
                </span>
              </motion.div>

              {/* ── 行动按钮 ── */}
              <motion.a
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                href="/identity"
                onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                className="relative group px-14 py-3.5 font-mono text-[9px] tracking-[0.35em] uppercase transition-all duration-500 overflow-hidden"
                style={{ border: "1px solid rgba(144,200,255,0.3)", color: "rgba(180,220,255,0.8)", textShadow: "0 0 8px rgba(144,200,255,0.3)" }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "rgba(144,200,255,0.06)", boxShadow: "inset 0 0 30px rgba(144,200,255,0.1)" }} />
                <span className="relative z-10 group-hover:text-white transition-colors duration-500">
                  Enter_Identity_Layer →
                </span>
              </motion.a>

              <motion.a
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.5 }}
                href="/motion-demo"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="text-cyan-400/25 hover:text-cyan-300/60 text-[8px] tracking-[0.25em] uppercase font-mono transition-colors">
                See_How_It_Works → Motion_Demo
              </motion.a>

              {/* Beta tester feedback */}
              <motion.a
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.5 }}
                href="https://tally.so/r/7Rj6z0"
                target="_blank" rel="noopener noreferrer"
                onMouseEnter={() => playTick(750, "sine", 0.07, 0.02)}
                className="text-purple-400/30 hover:text-purple-300/70 text-[8px] tracking-[0.25em] uppercase font-mono transition-colors">
                ◈ Beta_Feedback → Report_Experience
              </motion.a>

              {/* Whitepaper deep dive */}
              <motion.a
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.9, duration: 0.5 }}
                href="/whitepaper#genesis-protocol"
                onMouseEnter={() => playTick(700, "sine", 0.07, 0.02)}
                className="text-cyan-400/20 hover:text-cyan-300/60 text-[8px] tracking-[0.25em] uppercase font-mono transition-colors">
                Deep_Dive → Read §7 of the Whitepaper
              </motion.a>
            </motion.div>
          )}

          {stage === "error" && (
            <motion.div key="error"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center space-y-6">
              <div className="text-red-300/80 font-mono text-[10px] tracking-[0.3em] uppercase animate-pulse">{`> ${errorMsg}`}</div>
              <button onClick={() => { setStage("input"); setErrorMsg(""); setOtp(""); setInviteCode(""); setInviteCodeValid(null); }}
                onMouseEnter={() => playTick(600, "sine", 0.08, 0.02)}
                className="px-8 py-3 border border-white/20 text-white/60 font-mono text-[9px] tracking-[0.3em] uppercase hover:border-white/50 hover:text-white transition-all">
                Retry_Initialization
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`fixed bottom-6 left-4 md:bottom-12 md:left-12 transition-opacity duration-1000 ${stage !== "input" ? "opacity-0" : "opacity-20"}`}>
        <div className="text-[7px] font-mono text-white tracking-[0.6em] leading-relaxed uppercase text-left">
          Protocol_Ref: 005_GEN <br />
          Node: Origin_Verified <br />
          Status: {stage === "input" ? "STANDBY" : stage.toUpperCase()}
        </div>
      </div>

      {/* genesis.css provides component-level animations; shared @keyframes genesisScan / progressSlide live in animations.css */}
    </ProtocolLayout>
  );
}
