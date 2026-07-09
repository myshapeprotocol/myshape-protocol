"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { playTick } from "@/utils/useAudioTick";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import "./header.css";

/* ============================================================
   ProtocolHeader — 全局导航 + 钱包面板

   职责：
   - 顶部导航栏（系统状态 / Logo / 时间 / 节点）
   - 晶体全息协议面板（身份、信号、同步、断开）
   - 触发全局粒子事件

   样式：header.css
   动画：@/styles/animations.css
   ============================================================ */

const ProtocolHeader = () => {
  const pathname = usePathname();
  const [utcTime, setUtcTime] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [signalStrength, setSignalStrength] = useState(98.4);
  const [disconnectPhase, setDisconnectPhase] = useState<
    "IDLE" | "CONFIRM" | "SIGNAL_LOSS"
  >("IDLE");
  const [isShimmering, setIsShimmering] = useState(false);
  const [rippleActive, setRippleActive] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [genesisDone, setGenesisDone] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [genesisCount, setGenesisCount] = useState<number | null>(null);

  /* ── 创世节点计数器 — 30s 轮询 ── */
  useEffect(() => {
    const poll = () => {
      fetch("/api/nodes/status")
        .then((r) => r.json())
        .then((d) => { if (typeof d.genesis_nodes === "number") setGenesisCount(d.genesis_nodes); })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, []);

  /* ── 钱包连接状态 — shared hook ── */
  const { address: walletAddress, status: walletStatus, error: walletError, connect: connectWallet, disconnect: disconnectWallet } = useWalletAuth();

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("genesis_completed") === "1") {
      setGenesisDone(true);
      const email = sessionStorage.getItem("genesis_email") || "";
      if (email) {
        const [name, domain] = email.split("@");
        setMaskedEmail(`${name.slice(0, 2)}****@${domain || ""}`);
      }
    }
  }, []);
  // Also listen for genesis:updated in case genesis completes while header is visible
  useEffect(() => {
    const update = () => {
      if (sessionStorage.getItem("genesis_completed") === "1") {
        setGenesisDone(true);
        const email = sessionStorage.getItem("genesis_email") || "";
        if (email) {
          const [name, domain] = email.split("@");
          setMaskedEmail(`${name.slice(0, 2)}****@${domain || ""}`);
        }
      }
    };
    window.addEventListener("genesis:updated", update);
    return () => window.removeEventListener("genesis:updated", update);
  }, []);

  /* ── UTC 时钟 ── */
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setUtcTime(
        `${now.getUTCHours().toString().padStart(2, "0")}:${now
          .getUTCMinutes()
          .toString()
          .padStart(2, "0")}:${now
          .getUTCSeconds()
          .toString()
          .padStart(2, "0")} UTC`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /* ── 点击面板外部关闭 ── */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsPanelOpen(false);
      }
    };
    if (isPanelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPanelOpen]);

  /* ── 动态信号强度 ── */
  useEffect(() => {
    const update = () => setSignalStrength(97.5 + Math.random() * 2.3);
    update();
    const timer = setInterval(update, 2000 + Math.random() * 1000);
    return () => clearInterval(timer);
  }, []);

  /* ── 关闭面板时重置 disconnect 状态 ── */
  useEffect(() => {
    if (!isPanelOpen) {
      setDisconnectPhase("IDLE");
    }
  }, [isPanelOpen]);

  /* ═══ 事件处理 ═══ */

  const handleWalletClick = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handleConnectWallet = () => {
    const genesisEmail = typeof window !== "undefined" ? sessionStorage.getItem("genesis_email") : null;
    connectWallet(genesisEmail ? { email: genesisEmail } : undefined);
  };

  const handleSync = () => {
    setRippleActive(true);
    setTimeout(() => setRippleActive(false), 1000);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("protocol:particle-resonance"));
    }
    setIsShimmering(true);
    setTimeout(() => setIsShimmering(false), 1000);
  };

  const handleDisconnect = () => {
    if (walletAddress) {
      disconnectWallet();
      setIsPanelOpen(false);
      return;
    }
    if (disconnectPhase === "IDLE") {
      setDisconnectPhase("CONFIRM");
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(
        () => setDisconnectPhase("IDLE"),
        4000
      );
    } else if (disconnectPhase === "CONFIRM") {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      setDisconnectPhase("SIGNAL_LOSS");
      setTimeout(() => {
        setDisconnectPhase("IDLE");
        setIsPanelOpen(false);
      }, 400);
    }
  };

  /* ═══ 渲染 ═══ */
  return (
    <>
    <nav style={styles.headerNav}>
      <div style={styles.gradientOverlay} />

      {/* ── 左侧：系统状态 ── */}
      <div style={styles.leftSection}>
        <div className="status-pulse" />
        <span style={styles.versionText} className="hide-mobile">
          MYSHAPE_CORE_V2.0
        </span>
        <span style={styles.divider} className="hide-mobile">
          //
        </span>
        <span style={styles.statusText}>E&C: ACTIVE</span>
      </div>

      {/* ── 中间：Logo ── */}
      <Link href="/" style={styles.centerSection} className="brand-logo-link">
        M Y S H A P E
      </Link>

      {/* ── 右侧：时间、节点与钱包 ── */}
      <div style={styles.rightSection} ref={panelRef}>
        <span style={styles.timeDisplay} className="hide-mobile">
          {utcTime}
        </span>

        <Link href="/protocol" style={{ textDecoration: "none" }} className="hide-mobile">
          <div style={styles.nodeBadge} className="node-link-hover">
            KFK_SPC_DC{new Date().getDate()}
          </div>
        </Link>

        {/* GitHub DEV 入口 */}
        <a href="https://github.com/myshapeprotocol" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }} className="hide-mobile">
          <div style={styles.nodeBadge} className="node-link-hover">
            DEV_HUB
          </div>
        </a>

        {/* 创世节点计数器 */}
        {genesisCount !== null && (
          <span className="hide-mobile" style={{ fontSize: "9px", letterSpacing: "0.1em", color: "rgba(212,175,55,0.6)", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "3px" }}>
            <span style={{ fontSize: "7px" }}>◈</span>
            {genesisCount}/100
          </span>
        )}

        {/* 钱包按钮 — 全局身份入口 */}
        <button
          onClick={handleWalletClick}
          onMouseEnter={() => playTick(650, "sine", 0.07, 0.02)}
          style={styles.walletBtn}
          className={`wallet-btn-optimized ${isPanelOpen ? "is-active" : ""}`}
        >
          {walletStatus === "connecting" || walletStatus === "signing" || walletStatus === "verifying" ? (
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#90c8ff] animate-pulse" />
              {walletStatus === "connecting" ? "CONNECTING" : walletStatus === "signing" ? "SIGNING" : "VERIFYING"}
            </span>
          ) : walletAddress ? (
            <span className="font-mono text-[8px] tracking-[0.05em]">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
          ) : (
            "MYSHAPE.BASE.ETH"
          )}
        </button>

        {/* ── 晶体玻璃/全息协议面板 ── */}
        {isPanelOpen && (
          <div className="protocol-crystal-panel animate-panel-in">
            <div className="corner-deco-tl" />
            <div className="corner-deco-br" />

            <div className="panel-content">
              <div className="panel-header">
                {genesisDone ? "IDENTITY_SESSION_ACTIVE" : walletAddress ? "WALLET_CONNECTED — INITIALIZE BELOW" : "PROTOCOL_ACCESS_SESSION"}
              </div>

              <div className="panel-section">
                {walletAddress ? (
                  <>
                    <div className="panel-row">
                      <span className="label">WALLET</span>
                      <span className="value font-mono text-[9px]">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
                    </div>
                    <div className="panel-row">
                      <span className="label">NETWORK</span>
                      <span className="value-cyan">BASE_MAINNET</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="panel-row">
                      <span className="label">WALLET</span>
                      <span className="value" style={{ color: "rgba(255,255,255,0.3)" }}>NOT_CONNECTED</span>
                    </div>
                    <div className="panel-row">
                      <span className="label">NETWORK</span>
                      <span className="value">BASE_MAINNET</span>
                    </div>
                  </>
                )}
                {genesisDone && (
                  <div className="panel-row">
                    <span className="label">IDENTITY</span>
                    <span className="value">{maskedEmail || "MYSHAPE.BASE.ETH"}</span>
                  </div>
                )}
                <div className="panel-row">
                  <span className="label">STATUS</span>
                  <div className="value-group">
                    <div className="status-pulse-cyan-small" />
                    <span className="value-cyan">
                      {genesisDone ? "GENESIS_VERIFIED" : walletAddress ? "WALLET_LINKED" : "AWAITING_GENESIS"}
                    </span>
                  </div>
                </div>
                <div className="panel-row">
                  <span className="label">SIGNAL</span>
                  <div className="value-group">
                    <div className="status-pulse-cyan-small" />
                    <span className="value-cyan">ENCRYPTED</span>
                  </div>
                </div>
              </div>

              {walletError && (
                <div className="text-red-300/50 text-[8px] tracking-[0.1em] uppercase text-center mb-3">{walletError}</div>
              )}

              <div className="panel-divider" />

              <div className="panel-actions">
                {!walletAddress && walletStatus === "idle" && (
                  <button
                    onClick={handleConnectWallet}
                    onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                    className="panel-link w-full text-center"
                    style={{ border: "1px solid rgba(144,200,255,0.25)", padding: "6px 0", justifyContent: "center" }}>
                    <span className="link-icon">◈</span> CONNECT_WALLET
                  </button>
                )}
                {walletStatus !== "idle" && walletStatus !== "done" && (
                  <div className="text-[#90c8ff]/50 text-[9px] tracking-[0.2em] uppercase text-center py-2">
                    {walletStatus === "connecting" ? "CONNECTING..." : walletStatus === "signing" ? "SIGNING..." : "VERIFYING..."}
                  </div>
                )}
                {genesisDone ? (
                  <a href="/dashboard" className="panel-link" onMouseEnter={() => playTick(700, "sine", 0.06, 0.015)}>
                    <span className="link-icon">›</span> EVOLUTIONARY_DASHBOARD
                  </a>
                ) : (
                  <a href="/genesis" className="panel-link" onMouseEnter={() => playTick(700, "sine", 0.06, 0.015)}>
                    <span className="link-icon">›</span> INITIALIZE_GENESIS
                  </a>
                )}
                <a href="/continuity" className="panel-link" onMouseEnter={() => playTick(700, "sine", 0.06, 0.015)}>
                  <span className="link-icon">›</span> CONTINUITY_NETWORK
                </a>
                <a href="/protocol" className="panel-link" onMouseEnter={() => playTick(700, "sine", 0.06, 0.015)}>
                  <span className="link-icon">›</span> PROTOCOL_ARCHITECTURE
                </a>
                <a href="/roadmap" className="panel-link" onMouseEnter={() => playTick(700, "sine", 0.06, 0.015)}>
                  <span className="link-icon">›</span> DEVELOPMENT_ROADMAP
                </a>
                <div className="panel-divider" style={{ opacity: 0.3 }} />
                <a href="/handshake" className="panel-link" onMouseEnter={() => playTick(700, "sine", 0.06, 0.015)}
                  style={{ opacity: 0.55, filter: "grayscale(0.3)" }}>
                  <span className="link-icon" style={{ opacity: 0.5 }}>◇</span> DEV: NODE_HANDSHAKE
                </a>
                <button
                  onClick={handleDisconnect}
                  className={`panel-btn-disconnect ${
                    disconnectPhase === "CONFIRM" ? "phase-confirm" : ""
                  } ${disconnectPhase === "SIGNAL_LOSS" ? "phase-signal-loss" : ""}`}
                >
                  <span className="btn-icon">×</span>
                  <span
                    className={`disconnect-text ${
                      disconnectPhase === "SIGNAL_LOSS" ? "text-fade-out" : ""
                    }`}
                  >
                    {walletAddress
                      ? "DISCONNECT_WALLET"
                      : disconnectPhase === "CONFIRM"
                      ? "[ !! RECONFIRM_DISCONNECT !! ]"
                      : "DISCONNECT_SESSION"}
                  </span>
                </button>
              </div>
            </div>

            {/* 底部能量呼吸条 */}
            <div className="panel-footer-glow" />
          </div>
        )}
      </div>

      {/* 全屏粒子微颤动效 */}
      {isShimmering && <div className="shimmer-overlay" />}
    </nav>

    {/* ── 二级导航条 ──
         桌面：居中 6 项完整协议导航
         移动：左对齐 3 项 + 横向滚动 */}
    <div className="sub-nav-bar" style={{
      position: "fixed", top: "60px", left: 0, width: "100%", height: "32px",
      display: "flex", alignItems: "center", gap: "32px",
      background: "rgba(2,4,10,0.85)", backdropFilter: "blur(4px)",
      borderBottom: "1px solid rgba(255,255,255,0.05)", zIndex: 9998,
      fontFamily: "monospace",
      overflowX: "auto", overflowY: "hidden", whiteSpace: "nowrap",
      paddingLeft: "12px", paddingRight: "12px",
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "none",
    }}>
      {[
        { label: "Protocol", href: "/protocol" },
        { label: "Blog",     href: "/blog" },
        { label: "Genesis",  href: "/genesis" },
      ].map(link =>
          <Link key={link.href} href={link.href}
            onMouseEnter={e => {
              playTick(600, "sine", 0.08, 0.02);
              e.currentTarget.style.color = "rgb(34, 211, 238)";
              e.currentTarget.style.textShadow = "0 0 8px rgba(144,200,255,0.3)";
            }}
            onMouseLeave={e => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              e.currentTarget.style.color = active ? "rgb(34, 211, 238)" : "rgba(255,255,255,0.45)";
              e.currentTarget.style.textShadow = active ? "0 0 8px rgba(144,200,255,0.2)" : "none";
            }}
            style={{
              fontSize: "10px", letterSpacing: "0.15em", padding: "6px 4px",
              color: (pathname === link.href || pathname.startsWith(link.href + "/")) ? "rgb(34, 211, 238)" : "rgba(255,255,255,0.45)",
              textShadow: (pathname === link.href || pathname.startsWith(link.href + "/")) ? "0 0 10px rgba(144,200,255,0.5)" : "none",
              textDecoration: "none", textTransform: "uppercase", transition: "all 0.3s ease",
              borderBottom: (pathname === link.href || pathname.startsWith(link.href + "/")) ? "1px solid rgba(144,200,255,0.5)" : "1px solid transparent",
              paddingBottom: "2px",
            }}>
            {link.label}
          </Link>
      )}
    </div>
  </>
);
};

/* ═══ 布局样式（保留为 JS 对象 — 动态值少、无需 CSS 文件） ═══ */

const styles: { [key: string]: React.CSSProperties } = {
  headerNav: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px",
    background:
      "linear-gradient(to bottom, rgba(2, 4, 10, 0.95) 0%, rgba(2, 4, 10, 0) 100%)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    zIndex: 99999,
    fontFamily: "monospace",
    color: "#90c8ff",
    isolation: "isolate" as React.CSSProperties["isolation"],
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "1px",
    background:
      "linear-gradient(to right, transparent, rgba(144, 200, 255, 0.2), transparent)",
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    fontSize: "9px",
    letterSpacing: "0.15em",
  },
  versionText: { fontWeight: "bold", opacity: 0.8 },
  divider: { opacity: 0.2 },
  statusText: { opacity: 0.5 },
  centerSection: {
    color: "#fff",
    fontSize: "14px",
    letterSpacing: "0.25em",
    fontWeight: 300,
    whiteSpace: "nowrap",
    textIndent: "0.25em",
    opacity: 0.9,
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "9px",
    position: "relative",
  },
  timeDisplay: { opacity: 0.4, letterSpacing: "0.05em" },
  nodeBadge: {
    border: "1px solid rgba(144, 200, 255, 0.15)",
    padding: "3px 8px",
    fontSize: "8px",
    background: "rgba(144, 200, 255, 0.02)",
    borderRadius: "2px",
    opacity: 0.6,
  },
  walletBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid rgba(144, 200, 255, 0.2)",
    padding: "4px 12px",
    borderRadius: "2px",
    color: "#90c8ff",
    fontSize: "9px",
    cursor: "pointer",
    fontFamily: "monospace",
    letterSpacing: "0.1em",
    fontWeight: "bold",
    outline: "none",
    marginLeft: "16px",
  },
};

export default ProtocolHeader;
