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

    let stars: any[] = [];
    let coreParticles: any[] = [];

    // --- 事件监听：保留审美连接（Aesthetic Connection） ---
    const handleResonance = () => { resonanceRef.current = { active: true, startTime: Date.now() }; };
    const handleInvertFlash = () => { invertRef.current = { active: true, until: Date.now() + 150 }; };
    const handlePulse = () => { pulseRef.current = { active: true, startTime: Date.now() }; };
    
    window.addEventListener('protocol:particle-resonance', handleResonance);
    window.addEventListener('protocol:invert-flash', handleInvertFlash);
    window.addEventListener('protocol:particle-pulse', handlePulse);

    const init = () => {
      // 1. 星空初始化：锁定 400 颗
      stars = Array.from({ length: 400 }, () => ({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 2
      }));
      
      // 2. 核心粒子：严格按照 1500/150/300 原始参数
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
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      // 背景色保持深邃
      ctx.fillStyle = '#02040a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      // 严格执行：核心粒子团垂直中心锁定在 height * 0.65，subject in the lower half of frame
      const cy = canvas.height * 0.65; 

      // 1. 星空绘制：锁定速度 0.008，背景星空保持正中（不随粒子团下沉）
      stars.forEach(s => {
        s.z -= 0.008; 
        if (s.z <= 0) s.z = 2;
        const x = cx + (s.x / s.z) * canvas.width * 0.5;
        const y = canvas.height / 2 + (s.y / s.z) * canvas.height * 0.5; // 背景星空保持正中
        const size = (1 - s.z / 2) * 1.8;
        ctx.fillStyle = `rgba(128, 191, 255, ${1 - s.z / 2})`;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
      });

      if (showCore) {
        // 计算物理动效
        let resMod = 1;
        let pulseMod = 1;
        
        if (pulseRef.current.active) {
          const elapsed = Date.now() - pulseRef.current.startTime;
          if (elapsed < 1200) {
            const t = elapsed / 1200;
            pulseMod = t < 0.4 ? 1 + (t / 0.4) * 0.5 : 1.5 - ((t - 0.4) / 0.6) * 0.5;
          } else { pulseRef.current.active = false; }
        }
        
        if (resonanceRef.current.active) {
          const elapsed = Date.now() - resonanceRef.current.startTime;
          if (elapsed < 1000) {
            const t = elapsed / 1000;
            resMod = t < 0.3 ? 1 - (t / 0.3) * 0.35 : 0.65 + ((t - 0.3) / 0.7) * 0.35;
          } else { resonanceRef.current.active = false; }
        }

        ctx.save();
        // 核心粒子团严格锁定在 height * 0.65 位置
        ctx.translate(cx, cy);
        coreParticles.forEach(p => {
          p.angle += p.speed;
          const modRadius = p.radius * resMod * pulseMod;
          const x = Math.cos(p.angle) * modRadius;
          const z = Math.sin(p.angle) * modRadius;
          const scale = 300 / (300 + z);
          ctx.fillStyle = `rgba(128, 191, 255, ${0.5 + scale * 0.5})`;
          ctx.beginPath(); 
          // 锁定 1.5 * scale 的精细度，防止肉感
          ctx.arc(x * scale, p.y * scale, 1.5 * scale, 0, Math.PI * 2); 
          ctx.fill();
        });
        ctx.restore();
      }

      // 反色闪烁逻辑
      if (invertRef.current.active && Date.now() < invertRef.current.until) {
        ctx.save();
        ctx.globalCompositeOperation = 'difference';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      } else { invertRef.current.active = false; }

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
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: 'block', 
          width: '100%', 
          height: '100%', 
          imageRendering: 'pixelated' // 核心：保持像素精细度
        }} 
      />
    </div>
  );
}
