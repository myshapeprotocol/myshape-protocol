"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
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
          sessionStorage.setItem("genesis_scan_count", String(data.scan_count));
        }
        if (data.data_contribution !== undefined) setDataContrib(data.data_contribution);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedEmail = sessionStorage.getItem("genesis_email") || "";
    const isCompleted = sessionStorage.getItem("genesis_completed") === "1";
    const storedStatus = sessionStorage.getItem("genesis_status") || "";

    // 有 session 记录：直接显示
    if (isCompleted && storedEmail) {
      setStatus(storedStatus || "ACTIVE");
      setVisible(true);
      fetchStats(storedEmail);
      return;
    }

    // session 丢失：无法恢复，不显示（用户需重新登录）
  }, []);

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

  return (
    <div className="genesis-badge-wrapper">
      <div
        ref={badgeRef}
        className={`genesis-badge ${isGenesis ? "tier-genesis" : "tier-active"} ${expanded ? "is-expanded" : "is-collapsed"}`}
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: "pointer" }}
        title={expanded ? "Collapse" : "Expand stats"}
      >
        {/* 粒子散溢 */}
        {sparks.map(s => {
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

        {/* 折叠态：仅显示核心标识 */}
        <div className="badge-collapsed-view">
          <span className="badge-dot" />
          <span className="badge-tier-label-collapsed">GENESIS</span>
        </div>

        {/* 展开态：完整详情 */}
        <div className="badge-content">
          <div className="badge-topbar">
            <span className="badge-code">SIG_006_OMEGA</span>
            <span className="badge-dots">
              <span className="badge-dot" />
              <span className="badge-dot" />
            </span>
          </div>

          <div className="badge-title-main" data-text="GENESIS_COHORT">
            GENESIS_COHORT
          </div>
          <div className="badge-title-sub">
            FOUNDING_ENTITY
          </div>

          <div className="badge-data-row">
            <span>SCANS: <strong>{scanCount}</strong></span>
            <span>DATA: <strong>{dataContrib}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
