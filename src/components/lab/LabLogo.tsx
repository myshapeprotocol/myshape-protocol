"use client";
import React from "react";

export default function LabLogo() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "clamp(16px, 3vw, 28px)",
    }}>
      {/* Geometric Mark — three vertical bars */}
      <div style={{
        display: "flex", alignItems: "flex-end", gap: "clamp(5px, 1vw, 8px)",
        flexShrink: 0,
      }}>
        {[
          { h: "clamp(36px, 6vw, 56px)", w: "clamp(3px, 0.5vw, 4px)" },
          { h: "clamp(24px, 4vw, 38px)", w: "clamp(3px, 0.5vw, 4px)" },
          { h: "clamp(14px, 2.5vw, 22px)", w: "clamp(3px, 0.5vw, 4px)" },
        ].map((bar, i) => (
          <div key={i} style={{
            width: bar.w, height: bar.h,
            background: "linear-gradient(to top, rgba(0,229,255,0.4), rgba(0,229,255,0.9))",
            borderRadius: "1px 1px 0 0",
            boxShadow: "0 0 10px rgba(0,229,255,0.3)",
          }} />
        ))}
      </div>

      {/* Text */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          fontSize: "clamp(18px, 3.5vw, 28px)",
          fontWeight: 200,
          letterSpacing: "0.15em",
          color: "#fff",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
        }}>
          THE CONTINUITY LAB
        </span>
        <span style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: "clamp(8px, 1.2vw, 10px)",
          fontWeight: 300,
          letterSpacing: "0.25em",
          color: "rgba(0,229,255,0.5)",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}>
          CONTINUITY · EVIDENCE · TRUST
        </span>
      </div>
    </div>
  );
}
