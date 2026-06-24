"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import VortexScan from "@/components/ritual/VortexScan";
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
    console.log("[STEP 1] handleCommence triggered", { email, inviteCode });

    try {
      // 邮箱校验
      const cleanEmail = (email || "").trim();
      if (!cleanEmail.includes("@")) {
        console.warn("[STEP 2 - BLOCKED] Invalid email:", cleanEmail);
        setStage("error");
        setErrorMsg("INVALID_EMAIL: A valid email address is required");
        return;
      }
      console.log("[STEP 2] Email valid:", cleanEmail);

      // 邀请码格式校验（仅当用户填写时）
      const normalizedCode = (inviteCode || "").trim().toUpperCase();
      if (normalizedCode && !/^MYSHAPE-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizedCode)) {
        console.warn("[STEP 3 - BLOCKED] Invalid invite code format:", normalizedCode);
        setStage("error");
        setErrorMsg("INVITE_CODE_FORMAT_INVALID: Expected MYSHAPE-XXXX-XXXX");
        return;
      }
      console.log("[STEP 3] Invite code:", normalizedCode || "(empty — backend will route)");

      // 请求体
      const requestBody = {
        email: cleanEmail,
        invite_code: normalizedCode || undefined,
      };
      console.log("[STEP 4] Request payload:", requestBody);

      // 扫描动画
      console.log("[STEP 5] Starting scan animation...");
      setStage("scanning");
      await new Promise((r) => setTimeout(r, 8000));
      console.log("[STEP 6] Scan complete, sending OTP...");

      // 发送 API 请求
      setStage("sending_otp");
      console.log("[STEP 7] Fetching /api/send-otp...");
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("[STEP 8] Response status:", res.status);
      const data = await res.json();
      console.log("[STEP 9] Response data:", data);

      if (!res.ok) {
        console.warn("[STEP 10 - FAILED] Backend rejected:", data.error);
        setStage("error");
        setErrorMsg(data.error || "OTP_SEND_FAILED");
        return;
      }

      console.log("[STEP 11 - SUCCESS] OTP sent, switching to verify stage");
      setStage("verifying");
    } catch (err: unknown) {
      console.error("[CRITICAL] handleCommence crashed:", err);
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
              <form onSubmit={handleCommence} className="flex flex-col items-center space-y-10">
                {/* Genesis Cohort 标签 — 滚动数据流 */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-cyan-400/30" />
                  <div className="cohort-marquee">
                    <span className="cohort-marquee-inner text-cyan-400/70 font-mono text-[8px] tracking-[0.25em] uppercase">
                      ◈ Genesis_Cohort — First 100 only&nbsp;&nbsp;&nbsp;◈ Genesis_Cohort — First 100 only&nbsp;&nbsp;&nbsp;
                    </span>
                  </div>
                  <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-cyan-400/30" />
                </div>

                {/* ── 邀请码输入终端 ── */}
                <div className="relative group">
                  <div className="absolute -inset-[1px] rounded-sm opacity-40 group-focus-within:opacity-90 transition-opacity duration-700"
                    style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.25), transparent 40%, transparent 60%, rgba(168,85,247,0.25))", filter: "blur(8px)" }} />
                  <div className="relative px-8 py-2 overflow-hidden"
                    style={{ border: "1px solid rgba(168,85,247,0.25)", background: "rgba(8,4,20,0.85)", boxShadow: "0 0 40px rgba(168,85,247,0.04), inset 0 0 60px rgba(168,85,247,0.02)" }}>
                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-purple-400/70 genesis-corner-tl" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-purple-400/70 genesis-corner-tr" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-purple-400/70 genesis-corner-bl" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-purple-400/70 genesis-corner-br" />
                    <div className="absolute inset-0 pointer-events-none genesis-scan-line" />
                    <div className="absolute left-0 top-[15%] bottom-[15%] w-[1px] genesis-data-stream-l" style={{ background: "rgba(168,85,247,0.3)" }} />
                    <div className="absolute right-0 top-[15%] bottom-[15%] w-[1px] genesis-data-stream-r" style={{ background: "rgba(168,85,247,0.3)" }} />
                    <div className="flex items-center gap-2 mb-1 relative z-10">
                      <span className="text-purple-400/40 font-mono text-[7px] tracking-[0.3em] uppercase">BETA_ACCESS</span>
                    </div>
                    <input type="text" placeholder="INVITE_CODE_XXXX-XXXX-XXXX" value={inviteCode}
                      onChange={(e) => handleInviteCodeChange(e.target.value)}
                      maxLength={19}
                      className="relative z-10 w-80 max-w-[75vw] bg-transparent py-4 text-center text-xs tracking-[0.3em] text-purple-200/80 focus:outline-none placeholder:text-white/10" />
                    {inviteCode.length > 0 && (
                      <div className="relative z-10 text-center">
                        {inviteCodeValid === true && (
                          <span className="text-green-400/60 font-mono text-[7px] tracking-[0.2em]">◈ CODE_FORMAT_VALID</span>
                        )}
                        {inviteCodeValid === false && (
                          <span className="text-red-400/50 font-mono text-[7px] tracking-[0.2em]">FORMAT: MYSHAPE-XXXX-XXXX</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 邮箱输入终端 ── */}
                <div className="relative group">
                  {/* 外层辉光 */}
                  <div className="absolute -inset-[1px] rounded-sm opacity-50 group-focus-within:opacity-100 transition-opacity duration-700"
                    style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.3), transparent 40%, transparent 60%, rgba(34,211,238,0.3))", filter: "blur(8px)" }} />
                  {/* 主体 */}
                  <div className="relative px-8 py-2 overflow-hidden"
                    style={{ border: "1px solid rgba(34,211,238,0.25)", background: "rgba(2,10,20,0.85)", boxShadow: "0 0 40px rgba(34,211,238,0.04), inset 0 0 60px rgba(34,211,238,0.02)" }}>
                    {/* 四角装饰 */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400/70 genesis-corner-tl" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-400/70 genesis-corner-tr" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-400/70 genesis-corner-bl" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400/70 genesis-corner-br" />
                    {/* 扫描线 */}
                    <div className="absolute inset-0 pointer-events-none genesis-scan-line" />
                    {/* 侧边数据流 */}
                    <div className="absolute left-0 top-[15%] bottom-[15%] w-[1px] genesis-data-stream-l" />
                    <div className="absolute right-0 top-[15%] bottom-[15%] w-[1px] genesis-data-stream-r" />
                    <input type="text" placeholder="GENESIS_EMAIL@ADDRESS.IO" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="relative z-10 w-80 max-w-[75vw] bg-transparent py-5 text-center text-xs tracking-[0.3em] text-white/90 focus:outline-none placeholder:text-white/15" />
                  </div>
                </div>
                {/* ── 启动按钮 ── */}
                <button type="button"
                  onClick={(e) => handleCommence(e)}
                  onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                  className="group relative px-20 py-4 transition-all duration-500 overflow-hidden"
                  style={{ border: "1px solid rgba(34,211,238,0.35)", background: "rgba(34,211,238,0.03)" }}>
                  {/* 按钮顶部扫描线 */}
                  <div className="absolute top-0 left-0 w-full h-[1px] genesis-btn-scan" />
                  {/* hover 辉光 */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ boxShadow: "0 0 40px rgba(34,211,238,0.35), 0 0 80px rgba(34,211,238,0.12)" }} />
                  <span className="relative z-10 text-cyan-400 font-mono text-[10px] tracking-[0.8em] uppercase group-hover:text-white transition-all duration-500"
                    style={{ textShadow: "0 0 10px rgba(34,211,238,0.3)" }}>
                    Commence_Connection
                  </span>
                </button>
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
                href="https://tally.so/r/placeholder"
                target="_blank" rel="noopener noreferrer"
                onMouseEnter={() => playTick(750, "sine", 0.07, 0.02)}
                className="text-purple-400/30 hover:text-purple-300/70 text-[8px] tracking-[0.25em] uppercase font-mono transition-colors">
                ◈ Beta_Feedback → Report_Experience
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
