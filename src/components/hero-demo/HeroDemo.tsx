"use client";
import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import GlowVortexButton from "@/components/hero/GlowVortexButton";
import NarrativeText from "@/components/hero/NarrativeText";
import { playTick } from "@/utils/useAudioTick";
import "./hero-demo.css";
import { SCENES, SCENE_DURATION, FADE_MS } from "./scenes";
import { getTorusCount, makeBaseParticle, initParticles } from "./particles";

/* ═══════════════════════════════════════════════
   HeroDemo v3
   粒子渲染数学：100% 复制 HeroVisual
   ═══════════════════════════════════════════════ */

/* ── 粒子结构（与 HeroVisual 完全一致）── */
export interface Particle {
  angle: number;
  radius: number;
  y: number;
  speed: number;
  // 场景扩展字段
  baseRadius: number;
  baseY: number;
  baseSpeed: number;
  targetRadius: number;
  targetY: number;
  wavePhase: number;
  clusterIdx: number;
  clusterX: number;
  clusterY: number;
}

export default function HeroDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uiScene, setUiScene] = useState(0);
  const [displayedSubtitle, setDisplayedSubtitle] = useState("");
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [titleGlow, setTitleGlow] = useState(24);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  // 场景 ref（不触发重渲染）
  const sceneIdxRef = useRef(0);
  const sceneNameRef = useRef<"formation" | "motion" | "verification" | "mesh">("formation");
  const sceneStartRef = useRef(0);
  const switchingRef = useRef(false);
  const particlesRef = useRef<Particle[]>([]);
  const dimsRef = useRef({ w: 0, h: 0 });

  /* ── 标题呼吸 ── */
  useEffect(() => {
    const iv = setInterval(() => setTitleGlow(20 + Math.random() * 14), 2800);
    return () => clearInterval(iv);
  }, []);

  /* ── 点击空白关闭漩涡文字 ── */
  useEffect(() => {
    const close = () => {
      setShowLeft(false);
      setShowRight(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  /* ── 字幕 ── */
  useEffect(() => {
    const scene = SCENES[uiScene];
    setSubtitleVisible(false);
    setDisplayedSubtitle("");
    let i = 0;
    const full = scene.subtitle;
    const t = setInterval(() => {
      i++;
      setDisplayedSubtitle(full.slice(0, i));
      if (i >= full.length) clearInterval(t);
    }, 22);
    setSubtitleVisible(true);
    return () => clearInterval(t);
  }, [uiScene]);

  /* ═══════════════════════════════════════════
     核心渲染 — 严格对标 HeroVisual useEffect
     移动端：轻量粒子场（200粒子/50星，零场景切换）
     ═══════════════════════════════════════════ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let dpr = 1;
    let W = 0;
    let H = 0;

    // 检测创世用户 + 贡献指标
    function readOrbCount() {
      if (typeof window === "undefined") return { orbCount: 0, isFullLoad: false, isSovereign: false };
      const isSovereign = sessionStorage.getItem("sovereign_enrolled") === "1";
      const raw = parseInt(sessionStorage.getItem("sovereign_scan_count") || "0", 10);
      const sc = isNaN(raw) ? 0 : raw;
      const orbCount = sc >= 100 ? 8 : sc >= 85 ? 7 : sc >= 70 ? 6 : sc >= 50 ? 5 : sc >= 30 ? 4 : sc >= 15 ? 3 : sc >= 5 ? 2 : sc >= 1 ? 1 : 0;
      return { orbCount, isFullLoad: orbCount >= 8, isSovereign };
    }
    let { orbCount, isFullLoad, isSovereign } = readOrbCount();
    let prevOrbCount = orbCount;
    const orbGrowTimestamp = { current: 0 };
    // 每 5 秒重新读取（检测扫描后的增长）
    const pollInterval = setInterval(() => {
      const next = readOrbCount();
      if (next.orbCount > orbCount) {
        prevOrbCount = orbCount;
        orbCount = next.orbCount;
        isFullLoad = next.isFullLoad;
        orbGrowTimestamp.current = performance.now() * 0.001;
      }
      isSovereign = next.isSovereign;
    }, 5000);

    /* ── 星空背景（移动端减半）── */
    const stars: { x: number; y: number; z: number }[] = [];
    const isMobileLocal = typeof window !== "undefined" && window.innerWidth < 768;
    function initStars() {
      stars.length = 0;
      const count = isMobileLocal ? 120 : 400;
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * 2 - 1,
          y: Math.random() * 2 - 1,
          z: Math.random() * 2,
        });
      }
    }
    initStars();

    /* ── resize（HeroVisual 同款）── */
    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      dimsRef.current = { w: W, h: H };
    }

    function switchScene(idx: number) {
      sceneIdxRef.current = idx;
      sceneNameRef.current = SCENES[idx].name;
      sceneStartRef.current = performance.now();
      switchingRef.current = false;
      initParticles(sceneNameRef.current, particlesRef.current, H);
      setUiScene(idx);
    }

    /* ── draw（HeroVisual 同款结构）── */
    function draw(now: number) {
      if (!ctx || W === 0 || H === 0) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const elapsed = now - sceneStartRef.current;
      const particles = particlesRef.current;
      const name = sceneNameRef.current;

      // 淡出 alpha（去掉了淡入，粒子立即可见）
      let alpha = 1;
      if (elapsed > SCENE_DURATION - FADE_MS)
        alpha = 1 - (elapsed - (SCENE_DURATION - FADE_MS)) / FADE_MS;
      alpha = Math.max(0, Math.min(1, alpha));

      /* ── 绘制 ── */
      ctx.save();
      ctx.scale(dpr, dpr);

      // 星空背景（HeroVisual 同款）
      for (const s of stars) {
        s.z -= 0.005;
        if (s.z <= 0) s.z = 2;
        const sx = W / 2 + (s.x / s.z) * W * 0.5;
        const sy = H / 2 + (s.y / s.z) * H * 0.5;
        const size = (1 - s.z / 2) * 2;
        ctx.fillStyle = `rgba(128,191,255,${1 - s.z / 2})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 半透明深色叠加
      ctx.fillStyle = "rgba(2,4,10,0.45)";
      ctx.fillRect(0, 0, W, H);

      ctx.globalAlpha = alpha;
      ctx.save();
      // 移动端粒子团缩小并居中
      const mobileScale = isMobileLocal ? 0.7 : 1;
      const centerY = H * (isMobileLocal ? 0.48 : 0.52);
      ctx.translate(W / 2, centerY);
      if (isMobileLocal) ctx.scale(mobileScale, mobileScale);

      // ── 场景粒子渲染 ──
      const t = now * 0.001;
      const progress = Math.min(elapsed / SCENE_DURATION, 1);

      if (name === "formation") {
        // S1: 散落 → 聚合
        const formT = easeOutCubic(Math.min(progress / 0.5, 1));
        for (const p of particles) {
          p.radius += (p.targetRadius - p.radius) * 0.045;
          p.y += (p.targetY - p.y) * 0.045;
          p.angle += p.baseSpeed;
          const x = Math.cos(p.angle) * p.radius;
          const z = Math.sin(p.angle) * p.radius;
          const sc = 300 / (300 + z);
          const boost = 1 + (1 - formT) * 0.7;
          ctx.fillStyle = `rgba(128,191,255,${(0.35 + sc * 0.55) * boost})`;
          ctx.beginPath();
          ctx.arc(x * sc, p.y * sc, 1.8 * sc * boost, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (name === "motion") {
        // S2: 强烈呼吸波动 + 垂直涟漪
        for (const p of particles) {
          p.angle += p.baseSpeed;
          const breath = 1 + Math.sin(t * 0.7 + p.wavePhase) * 0.28;
          const ripple = 1 + Math.sin(t * 1.2 - p.baseRadius * 0.02) * 0.15;
          const r = p.baseRadius * breath * ripple;
          const yWave = p.baseY + Math.sin(t * 0.6 + p.wavePhase) * 25;
          const x = Math.cos(p.angle) * r;
          const z = Math.sin(p.angle) * r;
          const sc = 300 / (300 + z);
          ctx.fillStyle = `rgba(128,191,255,${0.35 + sc * 0.55})`;
          ctx.beginPath();
          ctx.arc(x * sc, yWave * sc, 1.5 * sc, 0, Math.PI * 2);
          ctx.fill();
        }
        // 中心强脉冲
        const cp = 1 + Math.sin(t * 2.5) * 0.35;
        const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 30 * cp);
        grd.addColorStop(0, "rgba(180,220,255,0.15)");
        grd.addColorStop(1, "rgba(128,191,255,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(0, 0, 30 * cp, 0, Math.PI * 2);
        ctx.fill();
      } else if (name === "verification") {
        // S3: 标准 torus + 强烈扫描环
        for (const p of particles) {
          p.angle += p.baseSpeed;
          const x = Math.cos(p.angle) * p.baseRadius;
          const z = Math.sin(p.angle) * p.baseRadius;
          const sc = 300 / (300 + z);
          ctx.fillStyle = `rgba(128,191,255,${0.35 + sc * 0.55})`;
          ctx.beginPath();
          ctx.arc(x * sc, p.baseY * sc, 1.5 * sc, 0, Math.PI * 2);
          ctx.fill();
        }
        // 扫描环 — 更亮更多
        for (let r = 0; r < 4; r++) {
          const baseR = 40 + r * 50;
          const expand = (t * 0.3 + r * 0.4) % 1;
          const radius = baseR + expand * 180;
          const ra = 0.2 * (1 - expand);
          ctx.strokeStyle = `rgba(144,200,255,${ra})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.stroke();
          // 环上亮点
          const da = t * 2 + r * 1.8;
          const dx = Math.cos(da) * radius;
          const dy = Math.sin(da) * radius * 0.45;
          const dg = ctx.createRadialGradient(dx, dy, 0, dx, dy, 7);
          dg.addColorStop(0, `rgba(144,200,255,${ra * 3})`);
          dg.addColorStop(1, "rgba(144,200,255,0)");
          ctx.fillStyle = dg;
          ctx.beginPath();
          ctx.arc(dx, dy, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        // 中心闪光
        const cp = 1 + Math.sin(t * 3.5) * 0.4;
        const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 22 * cp);
        cg.addColorStop(0, "rgba(200,230,255,0.25)");
        cg.addColorStop(1, "rgba(128,191,255,0)");
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(0, 0, 22 * cp, 0, Math.PI * 2);
        ctx.fill();
      } else if (name === "mesh") {
        // S4: 4 节点 + 中心枢纽，菱形拓扑
        const nodeMap = new Map<number, { x: number; y: number }>();
        for (const p of particles) {
          if (!nodeMap.has(p.clusterIdx))
            nodeMap.set(p.clusterIdx, { x: p.clusterX, y: p.clusterY });
        }
        const nodes = Array.from(nodeMap.values());

        // 连线：中心 → 每个节点（辐射状）
        for (const n of nodes) {
          const pulse = 0.5 + Math.sin(t * 1.5 + n.x) * 0.5;
          ctx.strokeStyle = `rgba(144,200,255,${0.18 * pulse})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();
        }
        // 外环连线（节点之间形成环）
        for (let i = 0; i < nodes.length; i++) {
          const j = (i + 1) % nodes.length;
          const pulse = 0.3 + Math.sin(t * 1.8 + i) * 0.7;
          ctx.strokeStyle = `rgba(144,200,255,${0.08 * pulse})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }

        // 数据包：中心 → 节点 往返
        for (let i = 0; i < nodes.length; i++) {
          const frac = (t * 0.4 + i * 0.4) % 1;
          const n = nodes[i];
          // 往返：去程用 frac，回程用 1-frac
          const f = frac < 0.5 ? frac * 2 : 2 - frac * 2;
          const px = n.x * f;
          const py = n.y * f;
          const dp = ctx.createRadialGradient(px, py, 0, px, py, 6);
          dp.addColorStop(0, "rgba(180,200,255,0.9)");
          dp.addColorStop(1, "rgba(140,170,240,0)");
          ctx.fillStyle = dp;
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // 中心枢纽
        const hp = 1 + Math.sin(t * 2.5) * 0.4;
        const hg = ctx.createRadialGradient(0, 0, 0, 0, 0, 20 * hp);
        hg.addColorStop(0, "rgba(200,230,255,0.35)");
        hg.addColorStop(0.4, "rgba(144,200,255,0.12)");
        hg.addColorStop(1, "rgba(144,200,255,0)");
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(0, 0, 20 * hp, 0, Math.PI * 2);
        ctx.fill();
        // 枢纽核心
        ctx.fillStyle = "rgba(220,240,255,0.7)";
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // 粒子（各节点 torus）
        for (const p of particles) {
          p.angle += p.baseSpeed;
          const x = Math.cos(p.angle) * p.baseRadius;
          const z = Math.sin(p.angle) * p.baseRadius;
          const sc = 300 / (300 + z);
          const sx = p.clusterX + x * sc;
          const sy = p.clusterY + p.baseY * sc;
          ctx.fillStyle = `rgba(128,191,255,${0.35 + sc * 0.55})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5 * sc, 0, Math.PI * 2);
          ctx.fill();
        }

        // 节点光晕
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const np = 1 + Math.sin(t * 2.5 + i * 1.2) * 0.4;
          const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 18 * np);
          ng.addColorStop(0, "rgba(144,200,255,0.22)");
          ng.addColorStop(1, "rgba(144,200,255,0)");
          ctx.fillStyle = ng;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 18 * np, 0, Math.PI * 2);
          ctx.fill();
          // 节点核心亮点
          ctx.fillStyle = `rgba(200,230,255,${0.45 + np * 0.2})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Genesis Core — 动态贡献指标（嵌入粒子几何体）──
      if (isSovereign || orbCount > 0) {
        const corePulse = 1 + Math.sin(now * 0.003) * 0.3;
        const timeSec = now * 0.001;

        // 粒子增长检测 — 漂移动画计时（使用 ease-out 缓动）
        if (orbCount > prevOrbCount) {
          orbGrowTimestamp.current = timeSec;
          prevOrbCount = orbCount;
        }
        const growRaw = Math.min((timeSec - orbGrowTimestamp.current) / 1.8, 1);
        const growProgress = 1 - Math.pow(1 - growRaw, 3); // ease-out cubic

        // 创世核心（仅 Genesis 节点）
        if (isSovereign) {
          const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 16 * corePulse);
          cg.addColorStop(0, "rgba(220,240,255,0.65)");
          cg.addColorStop(0.3, "rgba(144,200,255,0.25)");
          cg.addColorStop(0.6, "rgba(144,200,255,0.06)");
          cg.addColorStop(1, "rgba(144,200,255,0)");
          ctx.fillStyle = cg;
          ctx.beginPath();
          ctx.arc(0, 0, 16 * corePulse, 0, Math.PI * 2);
          ctx.fill();
        }

        // 满载光环（8 粒子）
        if (isFullLoad) {
          const ha = 0.12 + Math.sin(timeSec * 2) * 0.05;
          const hg = ctx.createRadialGradient(0, 0, 20, 0, 0, 35);
          hg.addColorStop(0, "rgba(144,200,255,0)");
          hg.addColorStop(0.4, `rgba(144,200,255,${ha})`);
          hg.addColorStop(0.7, `rgba(144,200,255,${ha * 0.5})`);
          hg.addColorStop(1, "rgba(144,200,255,0)");
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.arc(0, 0, 35, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = `rgba(144,200,255,${ha * 1.5})`;
          ctx.lineWidth = 0.4;
          ctx.beginPath();
          ctx.arc(0, 0, 28, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 环绕粒子（数量 = orbCount，仅场景 3）
        if (orbCount > 0 && name === "verification") {
          ctx.strokeStyle = `rgba(144,200,255,${0.15 * corePulse})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(0, 0, 22 * corePulse, 0, Math.PI * 2);
          ctx.stroke();
          for (let i = 0; i < orbCount; i++) {
            const ba = (timeSec * 0.8 + i * (Math.PI * 2) / orbCount) % (Math.PI * 2);
            const tr = 15 + Math.sin(timeSec * 3 + i) * 3;
            const r = tr * (0.3 + 0.7 * growProgress); // 漂移
            const px = Math.cos(ba) * r;
            const py = Math.sin(ba) * r;
            const a = (0.5 + Math.sin(timeSec * 4 + i) * 0.3) * growProgress;
            const pg = ctx.createRadialGradient(px, py, 0, px, py, 3.5);
            pg.addColorStop(0, `rgba(220,240,255,${a})`);
            pg.addColorStop(0.5, `rgba(144,200,255,${a * 0.4})`);
            pg.addColorStop(1, "rgba(144,200,255,0)");
            ctx.fillStyle = pg;
            ctx.beginPath();
            ctx.arc(px, py, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(255,255,255,${a})`;
            ctx.beginPath();
            ctx.arc(px, py, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();
      ctx.restore();

      // 场景切换（单次触发）
      if (elapsed >= SCENE_DURATION && !switchingRef.current) {
        switchingRef.current = true;
        const next = (sceneIdxRef.current + 1) % SCENES.length;
        setTimeout(() => switchScene(next), 300);
      }

      raf = requestAnimationFrame(draw);
    }

    /* ── 初始化（对标 HeroVisual: resize → init → draw）── */
    resize();
    initParticles(sceneNameRef.current, particlesRef.current, H);
    sceneStartRef.current = performance.now();
    raf = requestAnimationFrame(draw);

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(pollInterval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="hero-demo-root" itemScope itemType="https://schema.org/WebApplication">
      <meta itemProp="name" content="MyShape Motion-Signature Verification" />
      <meta itemProp="description" content="Real-time ethereal data energy visualization of sovereign identity through non-corporeal particle geometry." />
      <meta itemProp="applicationCategory" content="Identity Verification" />
      <canvas ref={canvasRef} className="hero-demo-canvas"
        itemProp="image" itemScope itemType="https://schema.org/ImageObject"
        aria-label="Ethereal Data Energy — real-time particle field visualization of sovereign identity" />
      <meta itemProp="name" content="Ethereal Data Energy Particle Field" />
      <meta itemProp="description" content="The visual manifestation of identity primitives represented by light, particles, and wireframe geometry. Direct visual encoding of the 128-dimensional Motion Signature vector." />

      {/* 左右小漩涡按钮 */}
      <div className="hero-demo-vortexes">
        <div className="hero-demo-vortex-left">
          <GlowVortexButton
            onClick={(e) => {
              e.stopPropagation();
              setShowRight(false);
              setShowLeft(!showLeft);
            }}
          />
        </div>
        <div className="hero-demo-vortex-right">
          <GlowVortexButton
            onClick={(e) => {
              e.stopPropagation();
              setShowLeft(false);
              setShowRight(!showRight);
            }}
          />
        </div>
      </div>

      {/* 漩涡叙事文字 */}
      <NarrativeText
        lines={[
          "PRESENCE IS A SIGNAL.",
          "THE SELF IS A FIELD.",
          "GEOMETRY HOLDS MEMORY.",
          "FORM CARRIES INTENT.",
          "SOVEREIGNTY BEGINS HERE.",
        ]}
        visible={showLeft}
        side="left"
      />
      <NarrativeText
        lines={[
          "YOU ARE A SHAPE.",
          "A PATTERN IN MOTION.",
          "A FIELD OF MEMORY.",
          "A VECTOR OF INTENT.",
          "MYSHAPE MAKES IT YOURS.",
        ]}
        visible={showRight}
        side="right"
      />

      <div className="hero-demo-content">
        <div className="hero-demo-title-zone"
          onMouseEnter={() => playTick(900, "sine", 0.08, 0.03)}
          itemScope itemType="https://schema.org/DefinedTerm"
          itemProp="hasDefinedTerm">
          <meta itemProp="name" content="Motion-Signature" />
          <meta itemProp="description" content="MyShape's proprietary kinetic verification protocol that AI cannot simulate. A 128-dimensional vector extracted from real-time 3D pose sequences." />
          <meta itemProp="url" content="https://www.myshape.com/protocol/motion-pipeline" />
          <h1
            className="hero-demo-title"
            style={{
              textShadow: `0 0 ${titleGlow}px rgba(144,200,255,0.35), 0 0 ${titleGlow * 1.4}px rgba(144,200,255,0.18)`,
            }}
          >
            THE NEW IDENTITY
          </h1>
          <p className="hero-demo-tagline">
            Presence is the new identity.<br />The identity layer for the simulation age.
          </p>
        </div>

        <div className={`hero-demo-subtitle ${subtitleVisible ? "on" : ""}`}>
          <span className="hero-demo-subtitle-dot" />
          <span className="hero-demo-subtitle-label">{SCENES[uiScene].label}</span>
          <span className="hero-demo-subtitle-sep">//</span>
          <span className="hero-demo-subtitle-text">{displayedSubtitle}</span>
          <span className="hero-demo-subtitle-cursor">|</span>
        </div>

        <div className="hero-demo-dots">
          {SCENES.map((s, i) => (
            <button
              key={s.name}
              className={`hero-demo-dot ${i === uiScene ? "on" : ""}`}
              onMouseEnter={() => playTick(500, "sine", 0.06, 0.015)}
              onClick={() => {
                if (!switchingRef.current && i !== sceneIdxRef.current) {
                  switchingRef.current = true;
                  const sName = SCENES[i].name;
                  sceneIdxRef.current = i;
                  sceneNameRef.current = sName;
                  sceneStartRef.current = performance.now();
                  // 按场景创建粒子（与 initParticles 逻辑一致）
                  const H = dimsRef.current.h;
                  if (sName === "formation") {
                    particlesRef.current = Array.from({ length: getTorusCount() }, () => {
                      const r = Math.random() * 120;
                      const y = (Math.random() - 0.5) * 300;
                      const sp = 0.008 + Math.random() * 0.022;
                      const p: Particle = {
                        angle: Math.random() * Math.PI * 2,
                        radius: 80 + Math.random() * 200, y: (Math.random() - 0.5) * H * 0.8,
                        speed: sp, baseRadius: r, baseY: y, baseSpeed: sp,
                        targetRadius: r, targetY: y,
                        wavePhase: Math.random() * Math.PI * 2,
                        clusterIdx: -1, clusterX: 0, clusterY: 0,
                      };
                      return p;
                    });
                  } else if (sName === "mesh") {
                    const clusters = [
                      { x: 0, y: -120, s: 0.50 },
                      { x: -130, y: 30, s: 0.45 },
                      { x: 130, y: 30, s: 0.45 },
                      { x: 0, y: 130, s: 0.48 },
                    ];
                    particlesRef.current = [];
                    const per = Math.floor(1500 / clusters.length);
                    for (let ci = 0; ci < clusters.length; ci++) {
                      const cl = clusters[ci];
                      for (let k = 0; k < per; k++) {
                        const r = Math.random() * 120 * cl.s;
                        const y = (Math.random() - 0.5) * 300 * cl.s;
                        const sp = (0.008 + Math.random() * 0.022) * (1 + Math.random() * 0.5);
                        particlesRef.current.push({
                          angle: Math.random() * Math.PI * 2,
                          radius: r, y, speed: sp,
                          baseRadius: r, baseY: y, baseSpeed: sp,
                          targetRadius: r, targetY: y,
                          wavePhase: Math.random() * Math.PI * 2,
                          clusterIdx: ci, clusterX: cl.x, clusterY: cl.y,
                        });
                      }
                    }
                  } else {
                    particlesRef.current = Array.from({ length: getTorusCount() }, () => {
                      const r = Math.random() * 120;
                      const y = (Math.random() - 0.5) * 300;
                      const sp = 0.008 + Math.random() * 0.022;
                      return {
                        angle: Math.random() * Math.PI * 2,
                        radius: r, y, speed: sp,
                        baseRadius: r, baseY: y, baseSpeed: sp,
                        targetRadius: r, targetY: y,
                        wavePhase: Math.random() * Math.PI * 2,
                        clusterIdx: -1, clusterX: 0, clusterY: 0,
                      };
                    });
                  }
                  setUiScene(i);
                  setTimeout(() => { switchingRef.current = false; }, 350);
                }
              }}
              aria-label={s.label}
            />
          ))}
        </div>

        <div className="hero-demo-ctas">
          <Link href="/verify" className="hero-demo-cta primary"
            onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
            itemProp="potentialAction" itemScope itemType="https://schema.org/EntryPoint">
            <meta itemProp="name" content="Verify Continuity" />
            <meta itemProp="description" content="Verify your physical continuity — move your phone naturally for 8 seconds and receive a CPS-0001 Continuity Receipt." />
            <meta itemProp="actionApplication" content="MyShape Protocol Continuity Verification" />
            <span className="hero-demo-cta-label">VERIFY_CONTINUITY</span>
          </Link>
          <Link href="/lab/contribute" className="hero-demo-cta secondary"
            onMouseEnter={() => playTick(600, "sine", 0.08, 0.02)}
            itemProp="potentialAction" itemScope itemType="https://schema.org/EntryPoint">
            <meta itemProp="name" content="Contribute Data" />
            <meta itemProp="description" content="Contribute motion data to the open Continuity Dataset. Three experiments, one page, anonymous." />
            <meta itemProp="actionApplication" content="Continuity Dataset Data Collection" />
            <span className="hero-demo-cta-label">CONTRIBUTE_DATA</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
