"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { playTick } from "@/utils/useAudioTick";

export default function GlowVortexButton({
  onClick,
  className,
}: {
  onClick?: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const playVortexSound = useCallback((action: 'hover' | 'click') => {
    if (action === 'hover') {
      playTick(600, "sine", 0.08, 0.02);
    } else {
      playTick(800, "triangle", 0.10, 0.03);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animationFrameId: number;

    const W = 72;
    const H = 72;
    canvas.width = W;
    canvas.height = H;

    const centerX = W / 2;
    const centerY = H / 2;
    const particles = Array.from({ length: 180 }, () => ({
      radius: 25 + Math.random() * 5,
      angle: Math.random() * Math.PI * 2,
      size: 0.8 + Math.random() * 1.2,
      drift: Math.random() * Math.PI * 2,
      speed: 0.015 + Math.random() * 0.01,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30);
      glow.addColorStop(0, "rgba(150,200,255,0.10)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      particles.forEach((p) => {
        p.radius -= 0.05;
        if (p.radius < 2) p.radius = 25 + Math.random() * 5;
        p.angle += p.speed;
        const noise = Math.sin(p.drift + p.angle * 3) * 1.2;
        const x = centerX + Math.cos(p.angle + p.radius * 0.05) * (p.radius + noise);
        const y = centerY + Math.sin(p.angle + p.radius * 0.05) * (p.radius + noise);
        const opacity = Math.min(1, (30 - p.radius) / 30) * 0.35;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,220,255,${opacity})`;
        ctx.fill();
      });

      const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 1.4 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#88ccff";
      ctx.fill();
      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseEnter={() => playVortexSound('hover')}
      onClick={(e) => {
        e.stopPropagation();
        playVortexSound('click');
        onClick?.(e);
      }}
      className={`cursor-pointer hover:scale-110 active:scale-95 transition-transform ${className}`}
      width={60}
      height={60}
    />
  );
}