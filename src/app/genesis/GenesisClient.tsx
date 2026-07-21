"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import VortexScan from "@/components/ritual/VortexScan";
import ConnectWallet from "@/components/auth/ConnectWallet";
import GenesisIdentityCard from "@/components/genesis-identity-card/GenesisIdentityCard";
import GenesisProgress from "@/components/genesis-progress/GenesisProgress";
import GenesisCTA from "@/components/genesis-cta/GenesisCTA";
import { playTick } from "@/utils/useAudioTick";
import { useSovereignSlots } from "@/hooks/useSovereignSlots";
import "./genesis.css";

type Stage = "input" | "scanning" | "sending_otp" | "verifying" | "success" | "error";

/* ── 上升光粒子 — 庆祝背景 ── */
function AscendingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let W = 0;
    let H = 0;

    interface Mote {
      x: number; y: number; r: number; speed: number; alpha: number;
      phase: number; pulseSpeed: number; driftAmp: number; driftFreq: number;
    }

    const motes: Mote[] = [];
    const COUNT = 50;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
    };

    const seed = () => {
      motes.length = 0;
      for (let i = 0; i < COUNT; i++) {
        motes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 1.5 + Math.random() * 3.5,
          speed: 0.15 + Math.random() * 0.55,
          alpha: 0.3 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2,
          pulseSpeed: 1.5 + Math.random() * 3,
          driftAmp: 0.3 + Math.random() * 0.8,
          driftFreq: 0.3 + Math.random() * 0.7,
        });
      }
    };

    resize();
    seed();
    window.addEventListener("resize", () => { resize(); seed(); });

    const draw = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const t = now * 0.001;

      for (const m of motes) {
        m.y -= m.speed;
        m.x += Math.sin(t * m.driftFreq + m.phase) * m.driftAmp;
        if (m.y < -20) { m.y = H + 20; m.x = Math.random() * W; }
        if (m.x < -20) m.x = W + 20;
        if (m.x > W + 20) m.x = -20;

        const pulse = 0.4 + Math.sin(t * m.pulseSpeed + m.phase) * 0.6;
        const a = m.alpha * pulse;

        // Outer glow
        const og = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 4);
        og.addColorStop(0, `rgba(180,220,255,${a})`);
        og.addColorStop(0.3, `rgba(144,200,255,${a * 0.5})`);
        og.addColorStop(1, "rgba(144,200,255,0)");
        ctx.fillStyle = og;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 4, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = `rgba(255,255,255,${a * 0.9})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

export default function GenesisClient() {
  const [stage, setStage] = useState<Stage>("input");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [headerWallet, setHeaderWallet] = useState<string | null>(null);
  const [nodeData, setNodeData] = useState<{
    nodeHandle?: string;
    positionNumber?: number;
    entropyScore?: number;
    particleLevel?: number;
    timestamp?: string;
  } | null>(null);
  const [returningNode, setReturningNode] = useState<{
    nodeHandle: string;
    status: string;
    isGenesis: boolean;
    particleLevel: number;
    entropyScore: number;
    registeredAt: string;
  } | null>(null);
  const [checkingReturning, setCheckingReturning] = useState(false);
  const [bindEmailInput, setBindEmailInput] = useState("");
  const [bindEmailSaving, setBindEmailSaving] = useState(false);
  const [bindEmailDone, setBindEmailDone] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 检测 Header 是否已连接钱包 — mount + live listener
  const walletCheckRef = useRef<() => void>(() => {});
  walletCheckRef.current = () => {
    const saved = sessionStorage.getItem("wallet_address");
    setHeaderWallet(saved || null);
  };

  useEffect(() => {
    walletCheckRef.current();
    const onConnect = () => walletCheckRef.current();
    const onDisconnect = () => setHeaderWallet(null);
    window.addEventListener("wallet:connected", onConnect);
    window.addEventListener("wallet:disconnected", onDisconnect);
    return () => {
      window.removeEventListener("wallet:connected", onConnect);
      window.removeEventListener("wallet:disconnected", onDisconnect);
    };
  }, []);

  // 检测回头节点 — 钱包已连接时查询是否已有协议身份
  useEffect(() => {
    if (!headerWallet || stage !== "input") return;
    let cancelled = false;

    async function check() {
      setCheckingReturning(true);
      try {
        const res = await fetch(`/api/node/privileges?wallet=${encodeURIComponent(headerWallet!)}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setReturningNode({
            nodeHandle: data.node_handle || "UNNAMED",
            status: data.status || "ACTIVE",
            isGenesis: data.is_genesis || false,
            particleLevel: data.particle_level ?? 1,
            entropyScore: data.entropy_score ?? 0,
            registeredAt: data.registered_at || "",
          });
          // 同步 sessionStorage，确保 header/dashboard 也能识别
          sessionStorage.setItem("sovereign_enrolled", "1");
          sessionStorage.setItem("sovereign_status", data.status || "ACTIVE");
          if (data.email) sessionStorage.setItem("sovereign_email", data.email);
          if (data.node_handle) sessionStorage.setItem("sovereign_node_handle", data.node_handle);
          window.dispatchEvent(new CustomEvent("sovereign:updated"));
        }
        // 404 = 新用户，正常留空
      } catch { /* silent — network issues shouldn't block the form */ }
      if (!cancelled) setCheckingReturning(false);
    }

    check();
    return () => { cancelled = true; };
  }, [headerWallet, stage]);

  // Cohort state — auto-detect when Genesis is full
  const { isFull, sovereignNodes } = useSovereignSlots();
  const [liveStats, setLiveStats] = useState<{ totalNodes: number; totalScans: number } | null>(null);

  useEffect(() => {
    if (!isFull) return;
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/nodes/status");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setLiveStats({
          totalNodes: data.total_nodes ?? 0,
          totalScans: data.total_scans ?? 0,
        });
      } catch { /* silent */ }
    }
    poll();
    const id = setInterval(poll, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isFull]);

  // 校验完成 → 拉取节点身份数据
  const finalizeGenesis = async (targetEmail: string) => {
    try {
      const res = await fetch(`/api/node/privileges?email=${encodeURIComponent(targetEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setNodeData({
          nodeHandle: data.node_handle || undefined,
          positionNumber: data.position_number || undefined,
          entropyScore: data.entropy_score ?? 0,
          particleLevel: data.particle_level ?? 1,
          timestamp: data.registered_at || undefined,
        });
      }
    } catch { /* graceful — card shows defaults */ }
    setStage("success");
  };

  const handleCommence = async (e?: React.FormEvent<HTMLFormElement> | React.MouseEvent) => {
    if (e && "preventDefault" in e) e.preventDefault();

    try {
      const cleanEmail = (email || "").trim().toLowerCase();
      const hasWallet = !!headerWallet;

      // 钱包已连接 → 不需要邮箱
      if (!hasWallet && !cleanEmail.includes("@")) {
        setStage("error");
        setErrorMsg("Connect wallet or enter email to proceed");
        return;
      }

      const requestBody: Record<string, string | undefined> = {
        wallet_address: headerWallet || undefined,
        email: cleanEmail || undefined,
      };

      setStage("scanning");
      // Brief initialization — wallet mode skips OTP, email mode transitions to OTP send
      await new Promise((r) => setTimeout(r, 3000));

      // 钱包模式：跳过 OTP，但勋章由 PES 扫描决定（不在此处分发）
      if (hasWallet) {
        const nodeKey = cleanEmail || "wallet:" + headerWallet!.slice(2, 10);
        await fetch("/api/uplink", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: nodeKey,
            node_handle: "SIG_" + headerWallet!.slice(2, 10),
            wallet_address: headerWallet,
          }),
        }).catch(() => {});

        // Wallet connection = identity registration, not Genesis tier assignment
        // Genesis Cohort status is minted by first PES scan (POST /api/node/entropy)
        sessionStorage.setItem("sovereign_enrolled", "1");
        sessionStorage.setItem("sovereign_email", nodeKey);
        sessionStorage.setItem("sovereign_status", "ACTIVE"); // PES scan will upgrade if < 100
        window.dispatchEvent(new CustomEvent("sovereign:updated"));
        finalizeGenesis(nodeKey);
        return;
      }

      // 邮箱模式：发送 OTP
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

      // 钱包已绑定的回头用户：跳过 OTP
      if (data.skip_otp) {
        sessionStorage.setItem("sovereign_enrolled", "1");
        sessionStorage.setItem("sovereign_email", cleanEmail);
        if (data.status) sessionStorage.setItem("sovereign_status", data.status);
        window.dispatchEvent(new CustomEvent("sovereign:updated"));
        finalizeGenesis(cleanEmail);
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
    if (otp.length !== 6 || verifyingOtp) return;
    setVerifyingOtp(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "SIGNATURE_INVALID");
      sessionStorage.setItem("sovereign_enrolled", "1");
      sessionStorage.setItem("sovereign_email", email.trim());
      if (data.status) sessionStorage.setItem("sovereign_status", data.status);
      if (data.node_handle) sessionStorage.setItem("sovereign_node_handle", data.node_handle);
      window.dispatchEvent(new CustomEvent("sovereign:updated"));
      finalizeGenesis(email);
    } catch (err: unknown) {
      setVerifyingOtp(false);
      setStage("error");
      setErrorMsg((err as Error).message?.slice(0, 60) || "VERIFY_FAILED");
    }
  };

  const isActive = stage === "scanning" || stage === "sending_otp";

  // 钱包用户绑定真实邮箱（可选，无 OTP）
  const handleBindEmail = async () => {
    const clean = bindEmailInput.trim().toLowerCase();
    if (!clean.includes("@") || bindEmailSaving) return;
    setBindEmailSaving(true);
    try {
      const currentEmail = sessionStorage.getItem("sovereign_email") || email;
      const res = await fetch("/api/node/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentEmail,
          newEmail: clean,
          walletAddress: headerWallet || undefined,
        }),
      });
      if (res.ok) {
        sessionStorage.setItem("sovereign_email", clean);
        setEmail(clean);
        setBindEmailDone(true);
      }
    } catch { /* silent */ }
    setBindEmailSaving(false);
  };


  // ── Cohort full: Genesis Phase Finalized ──
  if (isFull) {
    return (
      <ProtocolLayout
        refId="005" category="CIV_LAYER" title="GENESIS_PROTOCOL"
        secLevel="SEALED" systemStatus="CONTINUITY_PHASE"
      >
        <div className="min-h-screen bg-[#02040a] flex flex-col items-center justify-center px-6 py-24">
          <VortexScan />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            className="relative z-10 text-center max-w-lg"
          >
            <div className="text-[#d2991d]/60 text-[11px] tracking-[0.4em] uppercase mb-4 font-mono">
              GENESIS_COHORT // SEALED
            </div>
            <h1 className="text-3xl md:text-5xl font-light tracking-[0.08em] text-white mb-4">
              Genesis Phase Finalized
            </h1>
            <p className="text-white/40 text-[13px] leading-relaxed mb-8 font-light">
              The 100 sovereign identity anchors are now in place. Your node remains
              active — motion-signature verification, entropy accumulation, and presence
              proof generation continue for all protocol participants.
            </p>

            {/* Live network counter */}
            {liveStats && (
              <div className="flex items-center justify-center gap-6 mb-8 font-mono">
                <div className="border border-[#d2991d]/15 bg-[#d2991d]/[0.03] px-5 py-3">
                  <div className="text-[#d2991d]/70 text-[20px] font-light">{liveStats.totalNodes}</div>
                  <div className="text-[#d2991d]/40 text-[11px] tracking-[0.2em] uppercase mt-1">Active Nodes</div>
                </div>
                <div className="border border-[#d2991d]/15 bg-[#d2991d]/[0.03] px-5 py-3">
                  <div className="text-[#d2991d]/70 text-[20px] font-light">{liveStats.totalScans.toLocaleString()}</div>
                  <div className="text-[#d2991d]/40 text-[11px] tracking-[0.2em] uppercase mt-1">Total Scans</div>
                </div>
                <div className="border border-[#d2991d]/15 bg-[#d2991d]/[0.03] px-5 py-3">
                  <div className="flex items-center gap-1.5 text-[#3fb950]/70 text-[20px] font-light">
                    <span className="w-2 h-2 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 6px rgba(63,185,80,0.5)" }} />
                  </div>
                  <div className="text-[#d2991d]/40 text-[11px] tracking-[0.2em] uppercase mt-1">Live</div>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center gap-3">
              <a
                href="/specs"
                className="px-8 py-3 border border-[#d2991d]/30 text-[#d2991d]/70 text-[11px] tracking-[0.2em] uppercase hover:bg-[#d2991d]/10 hover:border-[#d2991d]/60 transition-all font-mono"
              >
                ◈ Read Protocol Specs
              </a>
              <a
                href="/dashboard"
                className="text-[#d2991d]/40 text-[11px] tracking-[0.15em] hover:text-[#d2991d]/70 transition-colors"
              >
                View my Node →
              </a>
            </div>
          </motion.div>
        </div>
      </ProtocolLayout>
    );
  }

  return (
    <ProtocolLayout
      refId="005" category="CIV_LAYER" title="GENESIS_PROTOCOL"
      secLevel="v1.0-RC"
      systemStatus={
        stage === "scanning" ? "PROTOCOL_NODE_INITIALIZING"
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

      <div className="relative z-10 flex flex-col items-center justify-center text-center mt-0 md:mt-8 pb-4" style={{ flex: 1, gap: "clamp(1.5rem, 5vh, 3rem)" }}>
        <div className={`transition-all duration-1000 shrink-0 ${isActive ? "opacity-20 blur-sm scale-90" : "opacity-100"}`}>
          <h2 className="text-white text-xl md:text-4xl font-light tracking-tight mb-2 md:mb-3"
            style={{ textShadow: "0 0 40px rgba(144,200,255,0.3), 0 0 80px rgba(144,200,255,0.1)" }}>
            {stage === "success" ? "Genesis Confirmed." : stage === "error" ? "Uplink Interrupted." : "Initialize Genesis."}
          </h2>
          <p className="text-[#90c8ff]/60 font-mono text-[11px] md:text-[11px] tracking-[0.3em] md:tracking-[0.6em] uppercase mb-2 md:mb-4"
            style={{ textShadow: "0 0 16px rgba(144,200,255,0.3)" }}>
            ESTABLISHING_IDENTITY_LAYER_PROTOCOL
          </p>
        </div>

        <AnimatePresence mode="wait">
          {stage === "input" && (
            <motion.div key="input"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}>
              <div className="mb-4 md:mb-8 flex items-center gap-3 justify-center">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#90c8ff]/30" />
                <span className="text-[#90c8ff]/40 font-mono text-[11px] tracking-[0.5em] uppercase">Genesis_Protocol</span>
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#90c8ff]/30" />
              </div>

              {/* Genesis Cohort 进度条 */}
              <div className="w-full max-w-md mx-auto mb-6">
                <GenesisProgress />
              </div>

              {checkingReturning ? (
                /* ── 检测协议身份中 ── */
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 rounded-full border border-[#90c8ff]/30 animate-spin" style={{ borderTopColor: "rgba(144,200,255,0.8)" }} />
                  </div>
                  <span className="text-[#90c8ff]/50 font-mono text-[11px] tracking-[0.3em] uppercase">Detecting_Protocol_Identity...</span>
                </div>
              ) : returningNode ? (
                /* ── 回头节点：Welcome Back 卡片 ── */
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative"
                    style={{ border: "1px solid rgba(144,200,255,0.2)", background: "rgba(2,10,20,0.8)", boxShadow: "0 0 60px rgba(144,200,255,0.06)" }}>
                    {/* 顶部状态条 */}
                    <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#90c8ff]/10">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#3fb950] shadow-[0_0_6px_rgba(63,185,80,0.6)]" />
                        <span className="text-[#90c8ff]/60 font-mono text-[11px] tracking-[0.4em] uppercase">PROTOCOL_IDENTITY_DETECTED</span>
                      </div>
                      <span className="text-white/25 font-mono text-[11px] tracking-[0.2em]">WALLET_BOUND</span>
                    </div>
                    {/* 内容区 */}
                    <div className="px-6 md:px-10 py-5 md:py-7 flex flex-col items-center">
                      {returningNode.isGenesis && (
                        <div className="text-[#d2991d]/70 font-mono text-[11px] tracking-[0.35em] uppercase mb-3 px-3 py-1 border border-[#d2991d]/20 bg-[#d2991d]/[0.04]">
                          ◈ Genesis Cohort — Founding Entity
                        </div>
                      )}
                      <div className="text-white/85 font-light text-2xl md:text-3xl tracking-[0.06em] mb-1"
                        style={{ textShadow: "0 0 20px rgba(144,200,255,0.3)" }}>
                        {returningNode.nodeHandle}
                      </div>
                      <div className="text-[#90c8ff]/40 font-mono text-[11px] tracking-[0.15em] mb-4">
                        {returningNode.status === "GENESIS_NODE" ? "SOVEREIGN_IDENTITY_ANCHOR" : "ACTIVE_PROTOCOL_NODE"}
                        {returningNode.registeredAt && (
                          <> · Since {new Date(returningNode.registeredAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</>
                        )}
                      </div>

                      {/* 迷你状态指标 */}
                      <div className="flex items-center gap-4 mb-6 font-mono">
                        <div className="text-center">
                          <div className="text-[#90c8ff]/70 text-sm font-light">{returningNode.particleLevel}</div>
                          <div className="text-[#90c8ff]/30 text-[11px] tracking-[0.2em] uppercase">Particle Lv.</div>
                        </div>
                        <div className="w-[1px] h-8 bg-[#90c8ff]/10" />
                        <div className="text-center">
                          <div className="text-[#90c8ff]/70 text-sm font-light">{returningNode.entropyScore.toLocaleString()}</div>
                          <div className="text-[#90c8ff]/30 text-[11px] tracking-[0.2em] uppercase">Entropy</div>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="flex flex-col items-center gap-2.5">
                        <a
                          href="/dashboard"
                          onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                          className="relative group px-10 py-3 font-mono text-[11px] tracking-[0.25em] uppercase transition-all duration-500 overflow-hidden"
                          style={{ border: "1px solid rgba(144,200,255,0.35)", color: "rgba(180,220,255,0.85)", textShadow: "0 0 8px rgba(144,200,255,0.3)" }}>
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{ background: "rgba(144,200,255,0.06)", boxShadow: "inset 0 0 30px rgba(144,200,255,0.1)" }} />
                          <span className="relative z-10 group-hover:text-white transition-colors duration-500">
                            Continue to Dashboard →
                          </span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setReturningNode(null);
                            sessionStorage.removeItem("wallet_address");
                            setHeaderWallet(null);
                            window.dispatchEvent(new CustomEvent("wallet:disconnected"));
                          }}
                          onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}
                          className="text-white/15 hover:text-white/30 text-[11px] tracking-[0.2em] uppercase transition-colors font-mono">
                          Not you? Disconnect &amp; start fresh
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
              <form onSubmit={handleCommence} className="flex flex-col items-center space-y-3 md:space-y-5">
                {/* Genesis Cohort 标签 — 滚动数据流 */}
                <div className="flex items-center justify-center gap-2">
                  <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#90c8ff]/30" />
                  <div className="cohort-marquee">
                    <span className="cohort-marquee-inner text-[#90c8ff]/80 font-mono text-[11px] tracking-[0.25em] uppercase">
                      ◈ Genesis_Cohort — First 100 only&nbsp;&nbsp;&nbsp;◈ Genesis_Cohort — First 100 only&nbsp;&nbsp;&nbsp;
                    </span>
                  </div>
                  <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#90c8ff]/30" />
                </div>

                {/* ── 主路径：Wallet-First ── */}
                <div className="flex flex-col items-center space-y-2 relative">
                  {headerWallet ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 border border-[#90c8ff]/40 bg-[#90c8ff]/[0.06]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#90c8ff] shadow-[0_0_8px_rgba(144,200,255,0.8)]" />
                        <span className="text-[#90c8ff]/80 font-mono text-[11px] tracking-[0.2em] uppercase">Wallet Connected</span>
                      </div>
                      <span className="text-[#90c8ff]/50 text-[11px] tracking-[0.15em] uppercase font-mono">
                        {headerWallet.slice(0, 8)}...{headerWallet.slice(-6)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCommence()}
                        onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                        className="relative group px-8 py-3 transition-all duration-500 overflow-hidden font-mono text-[11px] tracking-[0.3em] uppercase border border-[#90c8ff]/40 text-[#90c8ff]/80 hover:text-white hover:border-[#90c8ff] hover:shadow-[0_0_20px_rgba(144,200,255,0.2)]"
                        style={{ background: "rgba(144,200,255,0.06)" }}>
                        Begin Genesis →
                      </button>
                      <span className="text-white/25 text-[11px] tracking-[0.1em] mt-1">
                        No email required — wallet signature is your identity proof
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* 浮动粒子（桌面端专属） */}
                      <div className="absolute -top-3 -right-2 w-1 h-1 rounded-full bg-[#90c8ff]/40 genesis-float-dot hidden md:block" />
                      <div className="absolute top-0 -left-3 w-1 h-1 rounded-full bg-[#90c8ff]/30 genesis-float-dot hidden md:block" />
                      <div className="absolute -bottom-1 right-0 w-1 h-1 rounded-full bg-[#90c8ff]/35 genesis-float-dot hidden md:block" />
                      <ConnectWallet
                        email={email}
                        onSuccess={(walletData) => {
                          sessionStorage.setItem("wallet_address", walletData.address);
                          setHeaderWallet(walletData.address);
                          if (walletData.node_handle) sessionStorage.setItem("sovereign_node_handle", walletData.node_handle);
                          if (walletData.skip_otp) {
                            const nodeEmail = walletData.email || email.trim().toLowerCase() || "wallet:" + walletData.address.slice(2, 10);
                            sessionStorage.setItem("sovereign_enrolled", "1");
                            sessionStorage.setItem("sovereign_email", nodeEmail);
                            sessionStorage.setItem("sovereign_status", walletData.is_genesis ? "GENESIS_NODE" : "ACTIVE");
                            window.dispatchEvent(new CustomEvent("sovereign:updated"));
                            finalizeGenesis(nodeEmail);
                          }
                        }}
                      />
                      <span className="text-[#90c8ff]/55 text-[11px] md:text-[11px] tracking-[0.12em] uppercase font-light">Recommended: Trustless on-chain binding</span>

                      {/* ── 分隔（桌面端专属）── */}
                      <div className="hidden md:flex items-center gap-3 w-full max-w-[260px] mt-2">
                        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                        <span className="text-white/40 text-[12px] tracking-[0.3em] uppercase font-light">or</span>
                        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                      </div>

                      {/* Invite code section removed — admission is now governed by PES threshold */}

                      {/* ── 回头用户引导：已有节点？用钱包免验证码 ── */}
                      <div className="hidden md:flex items-center gap-2">
                        <span className="text-[#90c8ff]/25 text-[11px] tracking-[0.1em] uppercase font-light">
                          ◈ Already a node? Connect wallet ↑ to skip OTP
                        </span>
                      </div>

                      {/* ── 备选路径：Legacy Email（桌面端专属）── */}
                      <div className="hidden md:flex flex-col items-center space-y-2">
                        <span className="text-white/50 text-[11px] tracking-[0.15em] uppercase">Legacy Access (Email)</span>
                        <div className="relative flex items-center gap-2">
                          <div className="relative group genesis-terminal-glow flex-1"
                            onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
                            <div className="absolute -inset-[1px] rounded-sm opacity-35 group-focus-within:opacity-70 transition-opacity duration-700"
                              style={{ background: "linear-gradient(135deg, rgba(144,200,255,0.2), transparent 40%, transparent 60%, rgba(144,200,255,0.2))", filter: "blur(5px)" }} />
                            <div className="relative pl-5 pr-12 py-0.5 overflow-hidden"
                              style={{ border: "1px solid rgba(144,200,255,0.18)", background: "rgba(2,10,20,0.85)" }}>
                              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#90c8ff]/60 genesis-corner-tl" />
                              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#90c8ff]/60 genesis-corner-tr" />
                              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#90c8ff]/60 genesis-corner-bl" />
                              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#90c8ff]/60 genesis-corner-br" />
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
                                style={{ color: "rgba(144,200,255,0.4)" }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover/arrow:translate-x-0.5 transition-transform">
                                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        <span className="text-white/30 text-[11px] tracking-[0.1em]">For restricted environments only</span>
                        <a href="/handshake"
                          onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
                          className="text-[#90c8ff]/30 hover:text-[#90c8ff]/60 text-[11px] tracking-[0.12em] uppercase transition-colors mt-1 no-underline inline-block">
                          Developer? Node_Handshake →
                        </a>
                      </div>
                    </>
                  )}
                </div>

                {/* Genesis Pioneer CTA — Discord + social links */}
                <div className="w-full flex justify-center mt-6">
                  <GenesisCTA />
                </div>

                </form>
              )}
            </motion.div>
          )}

          {stage === "scanning" && (
            <motion.div key="scanning"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center space-y-8">
              <VortexScan />
              <span className="text-[#90c8ff] font-mono text-[12px] tracking-[0.5em] uppercase">Initializing_Protocol_Node...</span>
              <div className="w-48 h-[1px] bg-[#90c8ff]/10 relative overflow-hidden">
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
                <div className="absolute inset-0 rounded-full border border-[#90c8ff]/30 animate-spin" style={{ borderTopColor: "rgba(144,200,255,0.8)" }} />
              </div>
              <span className="text-[#90c8ff]/70 font-mono text-[11px] tracking-[0.5em] uppercase">Transmitting_Challenge...</span>
            </motion.div>
          )}

          {stage === "verifying" && (
            <motion.div key="verifying"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-md w-full">
              <div className="relative"
                style={{ border: "1px solid rgba(144,200,255,0.18)", background: "rgba(2,10,20,0.8)", boxShadow: "0 0 50px rgba(144,200,255,0.04)" }}>
                {/* 顶部状态条 */}
                <div className="flex items-center justify-between px-5 py-2 border-b border-[#90c8ff]/10">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#90c8ff] animate-pulse shadow-[0_0_6px_rgba(144,200,255,0.8)]" />
                    <span className="text-[#90c8ff]/60 font-mono text-[11px] tracking-[0.4em] uppercase">IDENTITY_CHALLENGE</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/30 font-mono text-[11px] tracking-[0.2em]">SIG_006</span>
                  </div>
                </div>
                {/* 内容区 */}
                <div className="px-5 md:px-8 py-6 md:py-8">
                  <div className="text-white/40 font-mono text-[11px] tracking-[0.2em] mb-1 text-center uppercase">VERIFICATION CODE SENT TO</div>
                  <div className="text-white/60 font-mono text-[11px] tracking-[0.15em] mb-8 text-center truncate">{email}</div>
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
                            borderBottom: otp[i] ? "2px solid rgba(144,200,255,0.8)" : "1px solid rgba(255,255,255,0.1)",
                            textShadow: otp[i] ? "0 0 8px rgba(144,200,255,0.5)" : "none",
                            boxShadow: otp[i] ? "0 4px 12px -4px rgba(144,200,255,0.2)" : "none",
                          }} />
                      ))}
                    </div>
                    <button type="submit" disabled={otp.length !== 6 || verifyingOtp}
                      onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                      className="w-full py-3 border text-[11px] tracking-[0.4em] uppercase font-mono transition-all duration-500"
                      style={{
                        borderColor: otp.length === 6 ? "rgba(144,200,255,0.5)" : "rgba(255,255,255,0.08)",
                        color: otp.length === 6 ? "rgba(144,200,255,0.8)" : "rgba(255,255,255,0.15)",
                        background: otp.length === 6 ? "rgba(144,200,255,0.05)" : "transparent",
                        textShadow: otp.length === 6 ? "0 0 8px rgba(144,200,255,0.4)" : "none",
                        boxShadow: otp.length === 6 ? "0 0 20px rgba(144,200,255,0.1)" : "none",
                        cursor: otp.length !== 6 || verifyingOtp ? "not-allowed" : "pointer",
                      }}>
                      {verifyingOtp ? "VERIFYING..." : "Verify_Signature"}
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
              className="relative flex flex-col items-center space-y-3 md:space-y-4">

              {/* ── 上升光粒子背景 ── */}
              <AscendingParticles />

              {/* ── 核心确认视觉：光环 + 亮点 ── */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.7, ease: [0, 0.6, 0.3, 1] }}
                className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full genesis-halo-outer" />
                <div className="absolute inset-3 rounded-full genesis-halo-mid" />
                <div className="absolute inset-6 rounded-full genesis-halo-inner" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  className="relative w-5 h-5 rounded-full genesis-success-core"
                  style={{ background: "radial-gradient(circle at 35% 35%, #fff, rgba(120,200,255,0.9))" }} />
              </motion.div>

              {/* ── Genesis 身份卡 ── */}
              <GenesisIdentityCard
                email={email}
                nodeHandle={nodeData?.nodeHandle || sessionStorage.getItem("sovereign_node_handle")}
                positionNumber={nodeData?.positionNumber}
                entropyScore={nodeData?.entropyScore}
                particleLevel={nodeData?.particleLevel}
                timestamp={nodeData?.timestamp}
              />

              {/* ── 钱包用户：可选绑定真实邮箱（无 OTP）── */}
              {(() => {
                const storedEmail = sessionStorage.getItem("sovereign_email") || email;
                return storedEmail.startsWith("wallet:") && !bindEmailDone;
              })() && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="flex flex-col items-center gap-2 max-w-xs w-full">
                  <span className="text-[#90c8ff]/40 text-[11px] tracking-[0.15em] uppercase font-light">
                    Optionally bind a real email for protocol updates
                  </span>
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="email"
                      placeholder="you@email.io"
                      value={bindEmailInput}
                      onChange={(e) => setBindEmailInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleBindEmail(); }}
                      className="flex-1 bg-transparent border border-[#90c8ff]/15 px-3 py-2 text-center text-[11px] tracking-[0.1em] text-white/70 focus:outline-none focus:border-[#90c8ff]/40 transition-colors placeholder:text-white/12"
                    />
                    <button
                      type="button"
                      onClick={handleBindEmail}
                      disabled={bindEmailSaving || !bindEmailInput.includes("@")}
                      className="px-4 py-2 border border-[#90c8ff]/25 text-[#90c8ff]/50 font-mono text-[11px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/50 hover:text-[#90c8ff]/80 disabled:opacity-20 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                      style={{ background: "rgba(144,200,255,0.03)" }}>
                      {bindEmailSaving ? "Saving..." : "Bind"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── 主 CTA：Identity Layer ── */}
              <motion.a
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                href="/identity"
                onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                className="relative group px-12 py-3 font-mono text-[11px] tracking-[0.25em] uppercase transition-all duration-500 overflow-hidden"
                style={{ border: "1px solid rgba(144,200,255,0.3)", color: "rgba(180,220,255,0.8)", textShadow: "0 0 8px rgba(144,200,255,0.3)" }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "rgba(144,200,255,0.06)", boxShadow: "inset 0 0 30px rgba(144,200,255,0.1)" }} />
                <span className="relative z-10 group-hover:text-white transition-colors duration-500">
                  Enter Identity Layer →
                </span>
              </motion.a>

              {/* ── 二级 CTA：Sovereign Dashboard（视觉对等、叙事互补）── */}
              <motion.a
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                href="/dashboard"
                onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                className="relative group px-12 py-3 font-mono text-[11px] tracking-[0.25em] uppercase transition-all duration-500 overflow-hidden"
                style={{ border: "1px solid rgba(144,200,255,0.15)", color: "rgba(144,200,255,0.5)", background: "rgba(144,200,255,0.015)" }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "rgba(144,200,255,0.04)", boxShadow: "inset 0 0 20px rgba(144,200,255,0.06)" }} />
                <span className="relative z-10 group-hover:text-[#90c8ff]/80 transition-colors duration-500">
                  Enter Sovereign Dashboard →
                </span>
              </motion.a>
            </motion.div>
          )}

          {stage === "error" && (
            <motion.div key="error"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center space-y-6">
              <div className="text-red-300/80 font-mono text-[11px] tracking-[0.3em] uppercase animate-pulse">{`> ${errorMsg}`}</div>
              <button onClick={() => { setStage("input"); setErrorMsg(""); setOtp(""); }}
                onMouseEnter={() => playTick(600, "sine", 0.08, 0.02)}
                className="px-8 py-3 border border-white/20 text-white/60 font-mono text-[11px] tracking-[0.3em] uppercase hover:border-white/50 hover:text-white transition-all">
                Retry_Initialization
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* genesis.css provides component-level animations; shared @keyframes genesisScan / progressSlide live in animations.css */}
    </ProtocolLayout>
  );
}
