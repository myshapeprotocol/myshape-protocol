'use client';
import React, { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

// --- 1. 背景墙：Starfield (保持你的逻辑，优化视觉厚度) ---
function Starfield() {
  const ref = useRef<THREE.Points>(null!);
  const count = 4000;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 100;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 100;
      arr[i * 3 + 2] = -20 - Math.random() * 130;
    }
    return arr;
  }, []);

  const sizes = useMemo(() => {
    const arr = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      arr[i] = Math.random() > 0.9 ? 0.02 : 0.008;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    const geo = ref.current.geometry;
    const pos = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const isBig = sizes[i] > 0.01;
      const speed = isBig ? delta * 6 : delta * 4;
      pos[i * 3 + 2] += speed;
      if (pos[i * 3 + 2] > 0) pos[i * 3 + 2] = -150;
    }
    geo.attributes.position.needsUpdate = true;
    ref.current.rotation.y += delta * 0.002;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        color="#88ccff" 
        transparent 
        opacity={0.8} 
        size={0.05} // 从 0.015 提升到 0.05，找回视觉重量
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending} // 关键：产生原图那种发光感
      />
    </points>
  );
}

// --- 2. 聚拢引擎：ParticleEngine (适配高分屏) ---
function ParticleEngine({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    
    // 强制适配屏幕像素比
    const dpr = window.devicePixelRatio || 1;
    const updateSize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    updateSize();

    const particles = Array.from({ length: 1500 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * 90,
      y: (Math.random() - 0.5) * 180,
      speed: 0.015 + Math.random() * 0.02,
      offX: (Math.random() - 0.5) * 2500, // 初始位置更开阔
      offY: (Math.random() - 0.5) * 2500
    }));

    let startTime = Date.now();
    let isStabilized = false;
    let completed = false;

    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.save();
      ctx.translate(window.innerWidth / 2, window.innerHeight / 2 - 50);

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 3000, 1);
      const invProgress = Math.pow(1 - progress, 2); // 平滑汇聚曲线

      particles.forEach(p => {
        p.angle += p.speed;
        let tx = Math.cos(p.angle) * p.radius;
        let x = tx + p.offX * invProgress;
        let y = p.y + p.offY * invProgress;
        
        const scale = 300 / (300 + Math.sin(p.angle) * p.radius);
        
        // 颜色与 Starfield 严格对齐
        ctx.fillStyle = `rgba(136, 204, 255, ${0.4 + (1 - invProgress) * 0.4})`;
        ctx.beginPath();
        // 核心粒子的半径略大于背景，突出聚合感
        ctx.arc(x * scale, y * scale, 1.4 * scale, 0, Math.PI * 2); 
        ctx.fill();
      });
      ctx.restore();

      if (progress >= 1 && !isStabilized) {
        isStabilized = true;
        if(!completed) { onComplete(); completed = true; }
      }
      animationRef.current = requestAnimationFrame(render);
    };

    render();
    window.addEventListener('resize', updateSize);
    return () => {
      cancelAnimationFrame(animationRef.current!);
      window.removeEventListener('resize', updateSize);
    };
  }, [onComplete]);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }} />;
}

// --- 3. 页面主入口 ---
export default function GenesisIdentity() {
  const [isFormed, setIsFormed] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000205', overflow: 'hidden' }}>
      
      {/* 背景层 */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <Suspense fallback={null}>
            <Starfield />
          </Suspense>
        </Canvas>
      </div>

      {/* 粒子聚合层 */}
      <ParticleEngine onComplete={() => setIsFormed(true)} />

      {/* UI 交互层 */}
      <AnimatePresence>
        {isFormed && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ 
              position: 'absolute', top: '65%', width: '100%', 
              textAlign: 'center', zIndex: 10, color: '#90c8ff', fontFamily: 'monospace' 
            }}
          >
            <div style={{ fontSize: '10px', letterSpacing: '4px', marginBottom: '25px', opacity: 0.8 }}>
              {">>> GENESIS_PROTOCOL_ESTABLISHED"}
            </div>
            
            <div style={{ position: 'relative', width: '300px', margin: '0 auto' }}>
              <input className="protocol-input" placeholder="ASSIGN_SHAPE_ID..." />
              <div className="input-glow" />
            </div>

            <button className="genesis-btn">
              INITIALIZE SOVEREIGNTY
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .protocol-input {
          background: rgba(0,0,0,0.3); border: none; border-bottom: 1px solid rgba(144, 200, 255, 0.4);
          padding: 12px; color: #fff; width: 100%; text-align: center; 
          outline: none; font-family: monospace; letter-spacing: 4px; font-size: 14px;
        }
        .input-glow {
          position: absolute; bottom: 0; left: 0; height: 1px; width: 100%;
          background: #fff; box-shadow: 0 0 10px #90c8ff;
        }
        .genesis-btn {
          margin-top: 35px; background: #fff; border: none; padding: 12px 60px;
          color: #000; font-family: monospace; font-weight: bold; font-size: 10px;
          letter-spacing: 2px; cursor: pointer; transition: 0.4s;
        }
        .genesis-btn:hover {
          box-shadow: 0 0 30px rgba(144, 200, 255, 0.6); transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}