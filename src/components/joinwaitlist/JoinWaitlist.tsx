"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { playTick } from "@/utils/useAudioTick";
import "./joinwaitlist.css";

export default function JoinWaitlist({ id }: { id?: string }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRitual, setIsRitual] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [ritualText, setRitualText] = useState("");

  const handleCommence = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRitual(true);
    setRitualText("INITIALIZING_GENESIS_SEQUENCE...");
    playTick(60, "sawtooth", 0.8, 0.03);
    await new Promise((r) => setTimeout(r, 3200));
    window.dispatchEvent(new CustomEvent("pt:navigate", { detail: { href: "/genesis" } }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationFrameId: number;
    let particles: { angle: number; radius: number; speed: number; size: number }[] = [];

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
          p.radius *= 0.95;
          currentSpeed *= 20;
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
            onMouseEnter={() => { setIsHovering(true); playTick(800, "triangle", 0.04, 0.012); }}
            onMouseLeave={() => setIsHovering(false)}
          >
            <span className="btn-border-glow" />
            <span className="btn-sweep" />
            <span className="btn-corner-tl" />
            <span className="btn-corner-tr" />
            <span className="btn-corner-bl" />
            <span className="btn-corner-br" />
            <span className="halo-scan" />
            <span className="halo-ring" />
            <span className="btn-text">[ INITIALIZE_IDENTITY_LAYER ]</span>
          </button>
        </form>
      </div>

    </section>
  );
}
