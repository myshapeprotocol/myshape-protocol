'use client';
import React, { useEffect, useRef } from 'react';

export default function HeroVisual({ showCore = true }: { showCore?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resonanceRef = useRef<{ active: boolean; startTime: number }>({ active: false, startTime: 0 });
  const invertRef = useRef<{ active: boolean; until: number }>({ active: false, until: 0 });
  const pulseRef = useRef<{ active: boolean; startTime: number }>({ active: false, startTime: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars: { x: number; y: number; z: number }[] = [];
    let coreParticles: { angle: number; radius: number; y: number; speed: number }[] = [];

    const handleResonance = () => {
      resonanceRef.current = { active: true, startTime: Date.now() };
    };
    const handleInvertFlash = () => {
      invertRef.current = { active: true, until: Date.now() + 150 };
    };
    const handlePulse = () => {
      pulseRef.current = { active: true, startTime: Date.now() };
    };
    window.addEventListener('protocol:particle-resonance', handleResonance);
    window.addEventListener('protocol:invert-flash', handleInvertFlash);
    window.addEventListener('protocol:particle-pulse', handlePulse);

    const init = () => {
      // 1. 严格使用你给的原始星星参数
      stars = Array.from({ length: 400 }, () => ({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 2
      }));
      
      // 2. 严格使用原始核心参数：1500个, 150半径, 300垂直跨度
      if (showCore) {
        coreParticles = Array.from({ length: 1500 }, () => ({
          angle: Math.random() * Math.PI * 2,
          radius: Math.random() * 150,
          y: (Math.random() - 0.5) * 300,
          speed: 0.02 + Math.random() * 0.02
        }));
      }
    };

    const resize = () => {
      // 这里的宽高设置必须极度精确，防止粒子被拉伸变大
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      if (!showCore) {
        // 背景墙层
        ctx.fillStyle = '#02040a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        stars.forEach(s => {
          s.z -= 0.005; if (s.z <= 0) s.z = 2;
          const x = canvas.width / 2 + (s.x / s.z) * canvas.width * 0.5;
          const y = canvas.height / 2 + (s.y / s.z) * canvas.height * 0.5;
          const size = (1 - s.z / 2) * 2;
          ctx.fillStyle = `rgba(128, 191, 255, ${1 - s.z / 2})`;
          ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
        });
      } else {
        // 核心层：严格按照你的 draw 逻辑
        // 粒子共振：向心收缩再弹回
        let resMod = 1;
        let pulseMod = 1;
        if (pulseRef.current.active) {
          const elapsed = Date.now() - pulseRef.current.startTime;
          if (elapsed < 1200) {
            const t = elapsed / 1200;
            if (t < 0.4) {
              pulseMod = 1 + (t / 0.4) * 0.5; // 前 40%：向外扩散至 150%
            } else {
              pulseMod = 1.5 - ((t - 0.4) / 0.6) * 0.5; // 后 60%：收缩回原状
            }
          } else {
            pulseRef.current.active = false;
          }
        }
        if (resonanceRef.current.active) {
          const elapsed = Date.now() - resonanceRef.current.startTime;
          if (elapsed < 1000) {
            const t = elapsed / 1000;
            if (t < 0.3) {
              resMod = 1 - (t / 0.3) * 0.35; // 前 30% 向心收缩至 65%
            } else {
              resMod = 0.65 + ((t - 0.3) / 0.7) * 0.35; // 后 70% 弹回原状
            }
          } else {
            resonanceRef.current.active = false;
          }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        coreParticles.forEach(p => {
          p.angle += p.speed;
          const modRadius = p.radius * resMod * pulseMod;
          const x = Math.cos(p.angle) * modRadius;
          const z = Math.sin(p.angle) * modRadius;
          const scale = 300 / (300 + z);
          // 这里的 1.5 * scale 是上线版的标准精细度
          ctx.fillStyle = `rgba(128, 191, 255, ${0.5 + scale * 0.5})`;
          ctx.beginPath(); ctx.arc(x * scale, p.y * scale, 1.5 * scale, 0, Math.PI * 2); ctx.fill();
        });
        ctx.restore();
      }

      // Invert flash overlay
      if (invertRef.current.active && Date.now() < invertRef.current.until) {
        ctx.save();
        ctx.globalCompositeOperation = 'difference';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        invertRef.current.active = false;
      }

      requestAnimationFrame(draw);
    };

    resize(); init(); draw();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('protocol:particle-resonance', handleResonance);
      window.removeEventListener('protocol:invert-flash', handleInvertFlash);
      window.removeEventListener('protocol:particle-pulse', handlePulse);
    };
  }, [showCore]);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      <canvas 
        ref={canvasRef} 
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}