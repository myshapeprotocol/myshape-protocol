"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MotionPreview from "@/components/motion-preview/MotionPreview";
import { playTick } from "@/utils/useAudioTick";

const SURFACE = "rgba(5,16,37,0.45)";
const A = "rgba(0,229,255,0.8)";

export default function TryIt() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio > 0.3) { setVisible(true); obs.disconnect(); }
      },
      { threshold: [0, 0.3, 0.5] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} style={{
      padding: "clamp(5rem, 8vw, 8rem) 1rem",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
    }}>
      <style>{`
        @keyframes livePulse {
          0%,100% { opacity:0.4; box-shadow:0 0 4px #34D399; }
          50%     { opacity:1; box-shadow:0 0 12px #34D399,0 0 20px rgba(52,211,153,0.4); }
        }
      `}</style>

      <div style={{ maxWidth: "60rem", margin: "0 auto" }}>
        {/* header */}
        <div style={{ marginBottom: "clamp(2.5rem, 4vw, 3.5rem)", textAlign: "center" }}>
          <div style={{
            fontSize: 11, color: "rgba(0,229,255,0.3)", textTransform: "uppercase",
            letterSpacing: "0.5em", marginBottom: 12,
            fontFamily: "var(--font-geist-mono), monospace",
          }}>
            Try It Now
          </div>
          <h2 style={{
            fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 200,
            letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff", margin: 0,
          }}>
            Identity <span style={{ color: A }}>answers</span> who you are.
          </h2>
          <p style={{
            fontSize: "clamp(0.9rem, 2vw, 1.1rem)", fontWeight: 300,
            color: "rgba(255,255,255,0.5)", marginTop: "1rem", lineHeight: 1.7,
            maxWidth: 500, marginLeft: "auto", marginRight: "auto",
          }}>
            Continuity answers whether you remained you.
          </p>

          {/* CTAs — consistent style */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: "1.2rem" }}>
            {[
              { label: "Why Continuity", href: "/continuity", accent: true },
              { label: "The Lab", href: "/lab" },
            ].map(({ label, href, accent }) => (
              <Link key={label} href={href} style={{
                padding: "9px 22px",
                border: accent ? "1px solid rgba(0,229,255,0.2)" : "1px solid rgba(255,255,255,0.08)",
                color: accent ? "rgba(0,229,255,0.55)" : "rgba(255,255,255,0.35)",
                fontSize: 10, fontFamily: "var(--font-geist-mono), monospace",
                letterSpacing: "0.12em", textTransform: "uppercase",
                textDecoration: "none", transition: "all 0.3s",
                background: accent ? "rgba(0,229,255,0.03)" : "transparent",
                borderRadius: 6,
              }}
                onMouseEnter={(e) => {
                  playTick(600, "sine", 0.08, 0.02);
                  e.currentTarget.style.borderColor = accent ? "rgba(0,229,255,0.5)" : "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.background = accent ? "rgba(0,229,255,0.08)" : "rgba(255,255,255,0.04)";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(0,229,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = accent ? "rgba(0,229,255,0.2)" : "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = accent ? "rgba(0,229,255,0.55)" : "rgba(255,255,255,0.35)";
                  e.currentTarget.style.background = accent ? "rgba(0,229,255,0.03)" : "transparent";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {label} →
              </Link>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          {/* divider */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 10, marginBottom: "1.5rem",
          }}>
            <span style={{ height: 1, flex: 1, maxWidth: 60, background: "rgba(0,229,255,0.1)" }} />
            <span style={{
              width: 8, height: 8, borderRadius: "50%", background: "#34D399",
              boxShadow: "0 0 8px #34D399",
              animation: visible ? "livePulse 1.5s ease-in-out infinite" : "none",
            }} />
            <span style={{
              fontSize: 10, color: "rgba(0,229,255,0.3)",
              fontFamily: "var(--font-geist-mono), monospace",
              textTransform: "uppercase", letterSpacing: "0.3em",
            }}>
              SIMULATION
            </span>
            <span style={{ height: 1, flex: 1, maxWidth: 60, background: "rgba(0,229,255,0.1)" }} />
          </div>

          <MotionPreview paused={!visible} />
        </div>
      </div>
    </section>
  );
}
