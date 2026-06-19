"use client";
import { useRef, useEffect, memo } from "react";

interface Particle {
  x: number;
  y: number;
  speed: number;
  opacity: number;
}

const BackgroundParticles = memo(function BackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: Particle[] = [];

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles.length = 0;
      for (let i = 0; i < 500; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 0.15 + Math.random() * 0.5,
          opacity: 0.15 + Math.random() * 0.35,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y += p.speed;
        if (p.y > canvas.height) {
          p.y = -2;
          p.x = Math.random() * canvas.width;
        }
        const flicker = Math.random() > 0.96 ? p.opacity * 6 : p.opacity;
        ctx.fillStyle = `rgba(34, 211, 238, ${flicker})`;
        const size = Math.random() > 0.92 ? 2 : 1;
        ctx.fillRect(p.x, p.y, size, size);
      }
      animId = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener("resize", init);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", init);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
});

export default BackgroundParticles;