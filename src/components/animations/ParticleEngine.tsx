'use client';
import React, { useEffect, useRef } from 'react';

type ParticleEngineProps = {
  onComplete: () => void;
  centerYOffset?: number;
  durationMs?: number;
  colorRgb?: string; // "128, 191, 255"
};

export default function ParticleEngine({
  onComplete,
  centerYOffset = -50,
  durationMs = 3000,
  colorRgb = "128, 191, 255",
}: ParticleEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(1);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // 对齐首页 `HeroVisual` 的核心参数：1500 粒子 / 150 半径 / 300 垂直跨度
    // 并叠加“外→内收缩”的初始偏移与初始半径放大，确保收束过程肉眼可见
    const particles = Array.from({ length: 1500 }, () => {
      const baseRadius = Math.random() * 150;
      return {
        angle: Math.random() * Math.PI * 2,
        baseRadius,
        y: (Math.random() - 0.5) * 300,
        speed: 0.02 + Math.random() * 0.02,
        offX: (Math.random() - 0.5) * 2600,
        offY: (Math.random() - 0.5) * 2600,
      };
    });

    let startTime = Date.now();
    let isStabilized = false;
    let frameId: number;

    const onSpeedUp = () => { speedRef.current = 2.5; };
    const onSpeedDown = () => { speedRef.current = 1; };
    window.addEventListener('speed-up', onSpeedUp);
    window.addEventListener('speed-down', onSpeedDown);

    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.save();
      ctx.translate(window.innerWidth / 2, window.innerHeight / 2 + centerYOffset);

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // 缓动：更明显的外→内收束（平方曲线）
      const inv = Math.pow(1 - progress, 2);

      particles.forEach(p => {
        p.angle += p.speed * speedRef.current;
        // 关键：半径保持在首页安全范围内，避免 tz < -300 导致 scale 变负数
        const r = p.baseRadius;
        const tx = Math.cos(p.angle) * r;
        const ty = p.y;
        const tz = Math.sin(p.angle) * r;
        
        const x = isStabilized ? tx : tx + (p.offX * inv);
        const y = isStabilized ? ty : ty + (p.offY * inv);
        
        const denom = 300 + tz;
        const scale = denom <= 1 ? 0.001 : 300 / denom;
        // 对齐首页 `HeroVisual` 的亮度感：0.5 + scale * 0.5
        const alpha = Math.min(0.95, 0.5 + scale * 0.5);
        ctx.fillStyle = `rgba(${colorRgb}, ${alpha})`;
        ctx.beginPath();
        // 对齐首页粒子尺寸：1.5 * scale
        const pr = Math.max(0.05, 1.5 * scale);
        ctx.arc(x * scale, y * scale, pr, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      if (progress >= 1 && !isStabilized) isStabilized = true;
      if (progress >= 1 && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
      frameId = requestAnimationFrame(render);
    };
    render();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('speed-up', onSpeedUp);
      window.removeEventListener('speed-down', onSpeedDown);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameId);
    };
  }, [centerYOffset, durationMs, colorRgb]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        imageRendering: 'pixelated',
      }}
    />
  );
}