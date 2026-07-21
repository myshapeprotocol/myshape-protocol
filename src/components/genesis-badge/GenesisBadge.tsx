"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import "./genesis-badge.css";

interface Spark {
  id: number;
  x: number; // 0-100% along badge perimeter
  y: number;
  angle: number;
  distance: number;
  size: number;
  alpha: number;
  life: number;
}

let sparkId = 0;

export default function GenesisBadge() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState("");
  const [scanCount, setScanCount] = useState(0);
  const [dataContrib, setDataContrib] = useState(0);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const badgeRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  const fetchStats = (email: string) => {
    fetch(`/api/node/privileges?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.scan_count !== undefined) {
          setScanCount(data.scan_count);
          sessionStorage.setItem("sovereign_scan_count", String(data.scan_count));
        }
        if (data.data_contribution !== undefined) setDataContrib(data.data_contribution);
      })
      .catch(() => {});
  };

  const tryShow = () => {
    const storedEmail = sessionStorage.getItem("sovereign_email") || "";
    const walletAddr = sessionStorage.getItem("wallet_address") || "";
    const isCompleted = sessionStorage.getItem("sovereign_enrolled") === "1";
    const storedStatus = sessionStorage.getItem("sovereign_status") || "";

    if (isCompleted) {
      const identityKey = storedEmail || walletAddr;
      if (identityKey) {
        setStatus(storedStatus || "ACTIVE");
        setVisible(true);
        if (storedEmail) fetchStats(storedEmail);
        return;
      }
    } else if (walletAddr) {
      setStatus("WALLET_LINKED");
      setVisible(true);
      return;
    }
    // Neither genesis nor wallet — hide
    setVisible(false);
  };

  // Stable refs to avoid effect re-registration on state changes
  const tryShowRef = useRef(tryShow);
  tryShowRef.current = tryShow;
  const handleDisconnect = useCallback(() => {
    const hasGenesis = sessionStorage.getItem("sovereign_enrolled") === "1";
    const hasWallet = !!sessionStorage.getItem("wallet_address");
    if (!hasGenesis && !hasWallet) {
      setVisible(false);
    } else {
      tryShowRef.current();
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    tryShowRef.current();
    const onUpdate = () => tryShowRef.current();
    const interval = setInterval(() => {
      // Re-check visibility every 30s — handles stale scan_count
      tryShowRef.current();
    }, 30000);
    window.addEventListener("sovereign:updated", onUpdate);
    window.addEventListener("wallet:connected", onUpdate);
    window.addEventListener("wallet:disconnected", handleDisconnect);
    return () => {
      clearInterval(interval);
      window.removeEventListener("sovereign:updated", onUpdate);
      window.removeEventListener("wallet:connected", onUpdate);
      window.removeEventListener("wallet:disconnected", handleDisconnect);
    };
  }, [handleDisconnect]); // Only re-run if handleDisconnect ref changes (never, due to [])

  // 鼠标视差倾斜
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!badgeRef.current) return;
      const { clientX, clientY } = e;
      const { left, top, width, height } = badgeRef.current.getBoundingClientRect();
      const x = (clientX - (left + width / 2)) / 25;
      const y = (clientY - (top + height / 2)) / 25;
      badgeRef.current.style.transform = `perspective(800px) rotateY(${x}deg) rotateX(${-y}deg)`;
    };
    const reset = () => {
      if (badgeRef.current) badgeRef.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg)";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", reset);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", reset);
    };
  }, []);

  // 粒子散溢发射器
  const emitSpark = useCallback(() => {
    const angle = Math.random() * Math.PI * 2;
    const side = Math.floor(Math.random() * 4); // 0:top 1:right 2:bottom 3:left
    let x: number, y: number;
    const edgeRand = Math.random();

    switch (side) {
      case 0: x = edgeRand; y = 0; break;
      case 1: x = 1; y = edgeRand; break;
      case 2: x = edgeRand; y = 1; break;
      default: x = 0; y = edgeRand; break;
    }

    const id = ++sparkId;
    const spark: Spark = {
      id,
      x, y,
      angle: angle,
      distance: 0,
      size: 1 + Math.random() * 2.5,
      alpha: 0.7 + Math.random() * 0.3,
      life: 1,
    };
    setSparks(prev => [...prev.slice(-20), spark]);
  }, []);

  useEffect(() => {
    if (!visible) return;

    // 粒子散溢频率随 scanCount 动态增长
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      // 基础 1~3 个，scanCount 越高越多（最多 +5）
      const bonus = Math.min(Math.floor(scanCount / 5), 5);
      const count = 1 + Math.floor(Math.random() * (2 + bonus));
      for (let i = 0; i < count; i++) setTimeout(emitSpark, i * 50);
      // 间隔：基础 2~4s，活跃节点更频繁（最低 0.8s）
      const interval = Math.max(800, 2000 + Math.random() * 2000 - scanCount * 80);
      timer = setTimeout(schedule, interval);
    };
    schedule();

    // 粒子动画循环
    const animate = () => {
      setSparks(prev =>
        prev
          .map(s => ({ ...s, distance: s.distance + 0.8, life: s.life - 0.015 }))
          .filter(s => s.life > 0)
      );
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animRef.current);
    };
  }, [visible, emitSpark, scanCount]);

  if (!visible) return null;

  const isGenesis = status === "GENESIS_NODE";
  const isWalletOnly = status === "WALLET_LINKED";

  return (
    <div className="genesis-badge-wrapper">
      <div
        ref={badgeRef}
        className={`genesis-badge ${isGenesis ? "tier-genesis" : "tier-active"} ${expanded ? "is-expanded" : "is-collapsed"}`}
        onClick={() => {
          if (isWalletOnly) return; // use explicit Link below instead
          setExpanded(!expanded);
        }}
        style={{ cursor: isWalletOnly ? "default" : "pointer" }}
        title={isWalletOnly ? "Complete Genesis to unlock full badge" : expanded ? "Collapse" : "Expand stats"}
      >
        {/* Microdata — Genesis Cohort */}
        <meta itemProp="hasDefinedTerm" itemScope itemType="https://schema.org/DefinedTerm" />
        <meta itemProp="name" content="Genesis Cohort" />
        <meta itemProp="description" content="The inaugural group of sovereign identity nodes initialized during the MyShape Protocol launch phase. Limited to the first 100 human entities. Permanent tier. Never offered again." />
        <meta itemProp="url" content="https://www.myshape.com/genesis" />
        {/* 粒子散溢 — 仅 genesis 节点 */}
        {!isWalletOnly && sparks.map(s => {
          const dx = Math.cos(s.angle) * s.distance;
          const dy = Math.sin(s.angle) * s.distance;
          return (
            <div
              key={s.id}
              className="badge-spark"
              style={{
                left: `${s.x * 100}%`,
                top: `${s.y * 100}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                opacity: s.alpha * s.life,
                transform: `translate(${dx}px, ${dy}px)`,
              }}
            />
          );
        })}

        {/* 粒子辉光背景 */}
        <div className="badge-bg-glow" />
        <div className="badge-corner badge-corner-tl" />
        <div className="badge-corner badge-corner-tr" />
        <div className="badge-corner badge-corner-bl" />
        <div className="badge-corner badge-corner-br" />
        <div className="badge-scan" />

        {/* 折叠态 */}
        {isWalletOnly ? (
          <Link href="/genesis" className="badge-collapsed-view" style={{ textDecoration: "none" }}>
            <span className="badge-dot" />
            <span className="badge-tier-label-collapsed">WALLET</span>
          </Link>
        ) : (
          <div className="badge-collapsed-view">
            <span className="badge-dot" />
            <span className="badge-tier-label-collapsed">GENESIS</span>
          </div>
        )}

        {/* 展开态 */}
        <div className="badge-content">
          <div className="badge-topbar">
            <span className="badge-code">
              {isWalletOnly ? "LINKED" : "SIG_006_OMEGA"}
            </span>
            <span className="badge-dots">
              <span className="badge-dot" />
              <span className="badge-dot" />
            </span>
          </div>

          <div className="badge-title-main" data-text={isWalletOnly ? "WALLET_LINKED" : "GENESIS_COHORT"}>
            {isWalletOnly ? "WALLET_LINKED" : "GENESIS_COHORT"}
          </div>
          <div className="badge-title-sub">
            {isWalletOnly ? (
              <Link href="/genesis" style={{ color: "rgba(144,200,255,0.7)", textDecoration: "none" }}
                onClick={(e) => e.stopPropagation()}>
                INITIALIZE_GENESIS →
              </Link>
            ) : (
              "FOUNDING_ENTITY"
            )}
          </div>

          {isWalletOnly ? (
            <Link
              href="/genesis"
              className="badge-data-row"
              style={{ justifyContent: "center", textDecoration: "none", display: "flex" }}
              onClick={(e) => e.stopPropagation()}
            >
              <span style={{ color: "rgba(144,200,255,0.7)" }}>
                Complete Genesis to unlock →
              </span>
            </Link>
          ) : (
            <div className="badge-data-row">
              <span>SCANS: <strong>{scanCount}</strong></span>
              <span>DATA: <strong>{dataContrib}</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
