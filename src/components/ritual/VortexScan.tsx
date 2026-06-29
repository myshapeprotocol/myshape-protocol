"use client";
import React, { useEffect, useRef } from "react";

/**
 * VortexScan — 漩涡扫描仪
 * 替代 Genesis 页面原有的 3 个静态 CSS 圆圈
 *
 * 视觉效果：
 * - 3 个 3D 倾斜椭圆环（漩涡漏斗透视）
 * - 环上发光粒子高速绕行
 * - 螺旋粒子从外向内流动
 * - 雷达式旋转扫描线 + 拖尾
 * - 水平扫描束（保留原有感觉）
 * - 核心脉冲光晕 + 旋转能量射线
 */
export default function VortexScan() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── 环配置：半径(相对值)、垂直压缩比(越小越扁=3D感越强)、转速、轨道粒子数 ──
    const rings = [
      { r: 120, squash: 0.28, speed: 0.007, dots: 8, opacity: 0.22 },
      { r: 88,  squash: 0.32, speed: 0.011, dots: 6, opacity: 0.28 },
      { r: 56,  squash: 0.38, speed: 0.016, dots: 5, opacity: 0.35 },
    ];

    // ── 轨道发光点 ──
    const orbitDots: { ringIdx: number; angle: number }[] = [];
    rings.forEach((ring, i) => {
      for (let j = 0; j < ring.dots; j++) {
        orbitDots.push({
          ringIdx: i,
          angle: (Math.PI * 2 / ring.dots) * j + Math.random() * 0.3,
        });
      }
    });

    // ── 螺旋流入粒子 ──
    const spiralParticles = Array.from({ length: 80 }, () => {
      const startR = 100 + Math.random() * 50;
      return {
        angle: Math.random() * Math.PI * 2,
        radius: startR,
        life: Math.random(),       // 0..1 生命周期进度
        maxLife: 0.6 + Math.random() * 0.8,
        speed: 0.004 + Math.random() * 0.01,
      };
    });

    let scanAngle = 0;
    let time = 0;

    const resize = () => {
      const size = Math.min(340, window.innerWidth * 0.72);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = size + "px";
      canvas.style.height = size + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      time += 0.016;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      const cx = w / 2;
      const cy = h / 2;
      const base = w / 2; // 基准半径

      ctx.clearRect(0, 0, w, h);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 1. 3D 倾斜椭圆环
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      rings.forEach((ring) => {
        const rx = (ring.r / 150) * base;
        const ry = rx * ring.squash;

        // 主环
        ctx.strokeStyle = `rgba(34, 211, 238, ${ring.opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 次环（微偏移，增加深度感）
        ctx.strokeStyle = `rgba(34, 211, 238, ${ring.opacity * 0.35})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy,
          rx,
          ry,
          ring.speed * time * 15,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      });

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 2. 轨道发光粒子
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      orbitDots.forEach((dot) => {
        const ring = rings[dot.ringIdx];
        // 内环反向旋转，增强漩涡感
        const dir = dot.ringIdx === 2 ? -1 : 1;
        dot.angle += ring.speed * dir;

        const rx = (ring.r / 150) * base;
        const ry = rx * ring.squash;
        const x = cx + Math.cos(dot.angle) * rx;
        const y = cy + Math.sin(dot.angle) * ry;

        // 两层光晕：外层柔光 + 内层亮点
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 5);
        glow.addColorStop(0, "rgba(180, 240, 255, 1)");
        glow.addColorStop(0.25, "rgba(34, 211, 238, 0.7)");
        glow.addColorStop(0.6, "rgba(34, 211, 238, 0.15)");
        glow.addColorStop(1, "rgba(34, 211, 238, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 3. 螺旋流入粒子
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      spiralParticles.forEach((p) => {
        p.life += p.speed;
        if (p.life >= p.maxLife) {
          p.life = 0;
          p.angle = Math.random() * Math.PI * 2;
          p.radius = 100 + Math.random() * 50;
          p.maxLife = 0.6 + Math.random() * 0.8;
        }
        const progress = p.life / p.maxLife;
        // 向内螺旋
        const currentR = (p.radius / 150) * base * (1 - progress * 0.65);
        p.angle += p.speed * 0.6;
        const tilt = 0.26 + progress * 0.1;
        const px = cx + Math.cos(p.angle) * currentR;
        const py = cy + Math.sin(p.angle) * currentR * tilt;

        const alpha = 1 - progress;
        ctx.fillStyle = `rgba(144, 210, 255, ${alpha * 0.55})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.0 + (1 - progress) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      });

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 4. 雷达式旋转扫描线 + 拖尾
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      scanAngle += 0.018;
      const scanR = base * 0.88;

      // 拖尾（多条渐淡线）
      for (let i = 0; i < 10; i++) {
        const ta = scanAngle - (i + 1) * 0.035;
        const alpha = 0.14 - i * 0.013;
        if (alpha <= 0) continue;
        ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ta) * scanR, cy + Math.sin(ta) * scanR);
        ctx.stroke();
      }

      // 主扫描线
      const scanGrad = ctx.createLinearGradient(
        cx,
        cy,
        cx + Math.cos(scanAngle) * scanR,
        cy + Math.sin(scanAngle) * scanR
      );
      scanGrad.addColorStop(0, "rgba(34, 211, 238, 0.7)");
      scanGrad.addColorStop(0.5, "rgba(34, 211, 238, 0.25)");
      scanGrad.addColorStop(1, "rgba(34, 211, 238, 0)");
      ctx.strokeStyle = scanGrad;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + Math.cos(scanAngle) * scanR,
        cy + Math.sin(scanAngle) * scanR
      );
      ctx.stroke();

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 5. 水平扫描束（保留经典感觉）
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const beamY = cy + Math.sin(time * 0.75) * (base * 0.72);
      const beamGrad = ctx.createLinearGradient(0, beamY, 0, beamY + 2);
      beamGrad.addColorStop(0, "rgba(34, 211, 238, 0)");
      beamGrad.addColorStop(0.4, "rgba(34, 211, 238, 0.18)");
      beamGrad.addColorStop(0.5, "rgba(34, 211, 238, 0.35)");
      beamGrad.addColorStop(0.6, "rgba(34, 211, 238, 0.18)");
      beamGrad.addColorStop(1, "rgba(34, 211, 238, 0)");
      ctx.fillStyle = beamGrad;
      ctx.fillRect(cx - base * 0.78, beamY - 0.5, base * 1.56, 2);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 6. 核心脉冲光晕
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
      coreGlow.addColorStop(0, "rgba(210, 245, 255, 1)");
      coreGlow.addColorStop(0.15, "rgba(34, 211, 238, 0.85)");
      coreGlow.addColorStop(0.4, "rgba(34, 211, 238, 0.25)");
      coreGlow.addColorStop(0.7, "rgba(34, 211, 238, 0.05)");
      coreGlow.addColorStop(1, "rgba(34, 211, 238, 0)");
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fill();

      // 核心脉冲点
      const pulseR = 3.5 + Math.sin(time * 3.5) * 2;
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.fill();
      // 脉冲外晕
      const pulseOuter = ctx.createRadialGradient(cx, cy, pulseR, cx, cy, pulseR * 2.5);
      pulseOuter.addColorStop(0, "rgba(180, 230, 255, 0.5)");
      pulseOuter.addColorStop(1, "rgba(34, 211, 238, 0)");
      ctx.fillStyle = pulseOuter;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 7. 能量射线
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const rayCount = 8;
      for (let i = 0; i < rayCount; i++) {
        const rayAngle =
          (Math.PI * 2 / rayCount) * i + time * 0.25;
        const rayLen = 15 + Math.sin(time * 4.5 + i * 1.2) * 8;
        ctx.strokeStyle = `rgba(34, 211, 238, ${0.12 + Math.sin(time * 4.5 + i) * 0.08})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(
          cx + Math.cos(rayAngle) * 3,
          cy + Math.sin(rayAngle) * 3
        );
        ctx.lineTo(
          cx + Math.cos(rayAngle) * rayLen,
          cy + Math.sin(rayAngle) * rayLen
        );
        ctx.stroke();
      }

      animFrame = requestAnimationFrame(draw);
    };

    let animFrame = 0;
    resize();
    animFrame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block mx-auto"
      style={{ filter: "drop-shadow(0 0 20px rgba(34,211,238,0.12))" }}
    />
  );
}
