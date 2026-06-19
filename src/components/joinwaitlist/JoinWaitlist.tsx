"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import "./joinwaitlist.css";

export default function JoinWaitlist({ id }: { id?: string }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRitual, setIsRitual] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [ritualText, setRitualText] = useState("");

  // 全局 AudioContext 单例 — 避免每次调用创建新实例（浏览器限制 ~6 个）
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playSound = useCallback(
    (
      freq: number,
      type: OscillatorType = "sine",
      duration: number = 0.1,
      vol: number = 0.02
    ) => {
      if (typeof window === "undefined") return;
      try {
        const audioCtx = getAudioContext();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.00001,
          audioCtx.currentTime + duration
        );
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    },
    [getAudioContext]
  );

  const handleCommence = async (e: React.FormEvent) => {
    e.preventDefault();
    // 进入仪式态：UI 渐隐 + 粒子开始坍塌
    setIsRitual(true);
    setRitualText("INITIALIZING_GENESIS_SEQUENCE...");
    playSound(60, "sawtooth", 0.8, 0.1);

    // 让坍塌动画完整演完（与你 Identity 粒子坍塌时长对齐：3200ms 左右）
    await new Promise((r) => setTimeout(r, 3200));

    // 跳转到 Genesis 流程（与首页 ENTER_GENESIS 统一）
    window.dispatchEvent(new CustomEvent("pt:navigate", { detail: { href: "/genesis" } }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationFrameId: number;
    let particles: any[] = [];

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = 800;
      const count = window.innerWidth < 768 ? 60 : 180;
      particles = Array.from({ length: count }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius:
          Math.random() *
            (window.innerWidth < 768 ? window.innerWidth * 0.35 : 320) +
          20,
        speed: 0.005 + Math.random() * 0.005,
        size: Math.random() * 1.5,
      }));
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        let currentSpeed = p.speed;

        if (isRitual) {
          p.radius *= 0.95; // 向中心收缩
          currentSpeed *= 20; // 旋转加速
        } else if (isHovering) {
          currentSpeed *= 5;
        }

        p.angle += currentSpeed;
        const x = canvas.width / 2 + Math.cos(p.angle) * p.radius;
        const y = canvas.height / 2 + Math.sin(p.angle) * p.radius;

        ctx.fillStyle = isRitual
          ? `rgba(255, 255, 255, ${p.radius / 150})`
          : "rgba(144, 200, 255, 0.4)";

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(render);
    };

    init();
    render();
    window.addEventListener("resize", init);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", init);
    };
  }, [isRitual, isHovering]);

  return (
    <section
      id={id}
      className="waitlist-section"
      style={{
        padding: "100px 24px",
        position: "relative",
        overflow: "hidden",
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 仪式态：文字浮在坍塌粒子上方 */}
      {isRitual && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            className="ritual-text"
            style={{
              color: "#fff",
              fontFamily: "monospace",
              fontSize: "11px",
              letterSpacing: "0.8em",
              textShadow: "0 0 10px #fff",
            }}
          >
            {ritualText}
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* 原有 UI：在仪式态时整体淡出 */}
      <div
        style={{
          maxWidth: "800px",
          width: "100%",
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          opacity: isRitual ? 0 : 1,
          transition: "opacity 0.8s ease",
        }}
      >
        <div className="waitlist-header" style={{ marginBottom: "50px" }}>
          <h2
            style={{
              fontWeight: 200,
              color: "#f8feff",
              letterSpacing: "-0.02em",
              marginBottom: "1.2rem",
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
            }}
          >
            Initialize Genesis.
          </h2>
          <div className="typing-container">
            <p className="typing-text">ESTABLISHING_IDENTITY_LAYER_PROTOCOL</p>
          </div>
        </div>

        <form
          onSubmit={handleCommence}
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <button
            type="submit"
            className="genesis-btn"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* 边框流光 */}
            <span className="btn-border-glow" />
            {/* 表面扫光 */}
            <span className="btn-sweep" />
            {/* 四角呼吸点 */}
            <span className="btn-corner-tl" />
            <span className="btn-corner-tr" />
            <span className="btn-corner-bl" />
            <span className="btn-corner-br" />
            {/* hover 光环 */}
            <span className="halo-scan" />
            <span className="halo-ring" />
            <span className="btn-text">[ INITIALIZE_IDENTITY_LAYER ]</span>
          </button>
        </form>
      </div>

    </section>
  );
}
