"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function JoinWaitlist({ id }: { id?: string }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRitual, setIsRitual] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [ritualText, setRitualText] = useState("");

  const playSound = useCallback(
    (
      freq: number,
      type: OscillatorType = "sine",
      duration: number = 0.1,
      vol: number = 0.02
    ) => {
      if (typeof window === "undefined") return;
      try {
        const audioCtx = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
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
    []
  );

  const handleCommence = async (e: React.FormEvent) => {
    e.preventDefault();
    // 进入仪式态：UI 渐隐 + 粒子开始坍塌
    setIsRitual(true);
    setRitualText("INITIALIZING_GENESIS_SEQUENCE...");
    playSound(60, "sawtooth", 0.8, 0.1);

    // 让坍塌动画完整演完（与你 Identity 粒子坍塌时长对齐：3200ms 左右）
    await new Promise((r) => setTimeout(r, 3200));

    // 再跳转到 Identity（那边直接呈现已成形的 Data-Body）
    router.push("/genesis/lab/identity");
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
              fontSize: "3.2rem",
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
            <span className="halo-scan" />
            <span className="halo-ring" />
            <span className="btn-text">[ INITIALIZE_IDENTITY_LAYER ]</span>
          </button>
        </form>
      </div>

      <style>{`
        .typing-container {
          display: inline-block;
          position: relative;
        }
        .typing-text {
          color: rgba(144, 200, 255, 0.7);
          font-size: 10px;
          letter-spacing: 0.6em;
          font-weight: 300;
          text-transform: uppercase;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          border-right: 2px solid #90c8ff;
          width: 0;
          animation: typing 3.5s steps(40) infinite,
            blink-cursor 0.75s step-end infinite;
        }
        @keyframes typing {
          0% {
            width: 0;
          }
          70% {
            width: 100%;
          }
          90% {
            width: 100%;
          }
          100% {
            width: 0;
          }
        }
        @keyframes blink-cursor {
          from,
          to {
            border-color: transparent;
          }
          50% {
            border-color: #90c8ff;
          }
        }

        .genesis-btn {
          padding: 22px 60px;
          letter-spacing: 0.4em;
          font-size: 10px;
          cursor: pointer;
          border: 1px solid #80bfff;
          background: transparent;
          color: #80bfff;
          transition: all 0.6s;
          position: relative;
          overflow: hidden;
        }

        /* Circular Deep-Sense Halo Scan */
        .halo-scan {
          position: absolute;
          top: 50%; left: 50%;
          width: 0; height: 0;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(144, 200, 255, 0.2) 0%, transparent 60%);
          transform: translate(-50%, -50%);
          transition: all 0.8s cubic-bezier(0.2, 1, 0.3, 1);
          pointer-events: none;
          z-index: 0;
        }

        .halo-ring {
          position: absolute;
          top: 50%; left: 50%;
          width: 0; height: 0;
          border-radius: 50%;
          border: 1px solid rgba(144, 200, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: all 0.9s cubic-bezier(0.2, 1, 0.3, 1);
          pointer-events: none;
          z-index: 0;
          opacity: 0;
        }

        .genesis-btn:hover .halo-scan {
          width: 350%;
          height: 350%;
        }

        .genesis-btn:hover .halo-ring {
          width: 300%;
          height: 300%;
          opacity: 1;
          border-color: transparent;
          box-shadow: 0 0 40px rgba(144, 200, 255, 0.15), 0 0 80px rgba(144, 200, 255, 0.05);
        }

        .genesis-btn:hover {
          background: rgba(144, 200, 255, 0.1);
          color: #fff;
          box-shadow: 0 0 30px rgba(144, 200, 255, 0.2);
        }

        .genesis-btn .btn-text {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </section>
  );
}
