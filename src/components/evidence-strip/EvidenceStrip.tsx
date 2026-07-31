"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

const SURFACE = "rgba(5,16,37,0.45)";

const FIELDS = [
  { field: "protocol", value: "CPS-0001" },
  { field: "evidence", value: "4 engines" },
  { field: "benchmark", value: "281 samples" },
  { field: "verification", value: "PASS", green: true },
  { field: "integrity", value: "SHA-256" },
  { field: "signature", value: "Ed25519" },
];

export default function EvidenceStrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [declassified, setDeclassified] = useState(false);
  const [revealed, setRevealed] = useState<boolean[]>(Array(FIELDS.length).fill(false));
  const [stamped, setStamped] = useState(false);
  const [footer, setFooter] = useState(false);
  const [scanY, setScanY] = useState(0);
  const [receiptDigits, setReceiptDigits] = useState("7a3f9c1e");

  /* ── trigger on scroll — wait until mostly in view ─── */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        // only start when >50% visible — user is actually looking
        if (entry.intersectionRatio > 0.5 && !visible) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: [0, 0.3, 0.5, 0.7] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible]);

  /* ── animation sequence ───────────────────────────── */
  useEffect(() => {
    if (!visible) return;
    const ids: ReturnType<typeof setTimeout>[] = [];

    ids.push(setTimeout(() => setDeclassified(true), 400));

    FIELDS.forEach((_, i) => {
      ids.push(setTimeout(() => {
        setRevealed((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 800 + i * 300));
    });

    ids.push(setTimeout(() => setStamped(true), 800 + FIELDS.length * 300 + 300));
    ids.push(setTimeout(() => setFooter(true), 800 + FIELDS.length * 300 + 800));

    return () => ids.forEach(clearTimeout);
  }, [visible]);

  /* ── scan line ────────────────────────────────────── */
  useEffect(() => {
    if (!visible) return;
    let pos = 0;
    let raf = 0;
    const loop = () => {
      pos = (pos + 0.25) % 100;
      setScanY(pos);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  /* ── live receipt id — real timestamp in hex ──────── */
  useEffect(() => {
    if (!visible) return;
    const update = () => {
      // Unix timestamp in hex — real, verifiable, always changing
      const ts = Math.floor(Date.now() / 1000).toString(16);
      setReceiptDigits(ts.padStart(8, "0").slice(-8));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  /* ── render ───────────────────────────────────────── */
  const isClassified = visible && !declassified;
  const isDeclass = visible && declassified;

  return (
    <section ref={sectionRef} style={{
      padding: "clamp(4rem, 6vw, 6rem) clamp(1rem, 4vw, 2rem)",
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      borderTop: "1px solid rgba(0,229,255,0.06)",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes classFlash {
          0%,100% { border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.04); }
          50%     { border-color: rgba(239,68,68,0.45); background: rgba(239,68,68,0.12); }
        }
        @keyframes declassGo {
          0%   { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.08); }
          30%  { border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.04); }
          100% { border-color: rgba(52,211,153,0.12); background: rgba(52,211,153,0.03); }
        }
        @keyframes dotDeclass {
          0%   { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
          30%  { background: #fff; box-shadow: 0 0 14px #fff; }
          100% { background: #34D399; box-shadow: 0 0 8px #34D399; }
        }
        @keyframes txtDeclass {
          0%   { color: rgba(239,68,68,0.6); }
          40%  { color: rgba(255,255,255,0.8); }
          70%  { color: rgba(255,255,255,0.5); }
          100% { color: rgba(52,211,153,0.65); }
        }
        @keyframes redactBurn {
          0%   { transform: scaleX(1); opacity: 1; }
          40%  { transform: scaleX(0.5); opacity: 0.8; filter: brightness(1.5); }
          100% { transform: scaleX(0); opacity: 0; filter: brightness(3); }
        }
        @keyframes valReveal {
          0%   { color: rgba(255,255,255,0.05); text-shadow: none; }
          50%  { color: rgba(0,229,255,0.9); text-shadow: 0 0 12px rgba(0,229,255,0.5); }
          100% { color: #00E5FF; text-shadow: none; }
        }
        @keyframes valRevealGreen {
          0%   { color: rgba(255,255,255,0.05); text-shadow: none; }
          50%  { color: rgba(52,211,153,0.9); text-shadow: 0 0 14px rgba(52,211,153,0.5); }
          100% { color: #34D399; text-shadow: 0 0 4px rgba(52,211,153,0.2); }
        }
        @keyframes stampDown {
          0%   { transform: rotate(-14deg) scale(1.6); opacity: 0; }
          55%  { transform: rotate(2deg) scale(0.94); opacity: 1; }
          75%  { transform: rotate(-1deg) scale(1.03); }
          100% { transform: rotate(-3deg) scale(1); opacity: 1; }
        }
        @keyframes footerIn {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* scan line */}
      {visible && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: `${scanY}%`, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.18), transparent)",
          pointerEvents: "none", zIndex: 5,
        }} />
      )}

      <div style={{ maxWidth: "46rem", margin: "0 auto", position: "relative", zIndex: 2 }}>

        {/* ══ classification strip ══════════════════ */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "0.5rem 1rem",
          marginBottom: "clamp(1.5rem, 2.5vw, 2rem)",
          border: "1px solid rgba(239,68,68,0.15)",
          background: "rgba(239,68,68,0.04)",
          animation: !visible
            ? "none"
            : isClassified
              ? "classFlash 0.7s ease-in-out infinite"
              : "declassGo 0.7s ease-out forwards",
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 10,
          letterSpacing: "0.2em",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: isDeclass ? "#34D399" : "#ef4444",
            boxShadow: isDeclass ? "0 0 8px #34D399" : "0 0 8px #ef4444",
            animation: isDeclass ? "dotDeclass 0.7s ease-out forwards" : "none",
          }} />
          <span style={{
            textTransform: "uppercase",
            color: isDeclass ? "rgba(52,211,153,0.65)" : "rgba(239,68,68,0.55)",
            animation: isDeclass ? "txtDeclass 0.7s ease-out forwards" : "none",
          }}>
            {isDeclass ? "DECLASSIFIED" : "CLASSIFIED"}
          </span>
          <span style={{ color: "rgba(255,255,255,0.12)", marginLeft: "auto", fontSize: 9 }}>
            REF: CPS-0001-2026-07
          </span>
        </div>

        {/* ══ dossier ══════════════════════════════ */}
        <div style={{
          position: "relative",
          border: "1px solid rgba(0,229,255,0.1)",
          background: SURFACE,
          padding: "clamp(1.5rem, 3vw, 2.5rem)",
        }}>
          {/* tabs */}
          <div style={{ position: "absolute", right: -1, top: 30, display: "flex", flexDirection: "column", gap: 2, zIndex: 3 }}>
            {["001","002","003"].map((t,i) => (
              <div key={t} style={{ width:28, height:8, border:"1px solid rgba(0,229,255,0.08)", borderLeft:"none", background: SURFACE, opacity:0.25+i*0.15 }} />
            ))}
          </div>

          {/* dot grid */}
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.02, zIndex:0,
            backgroundImage:"radial-gradient(circle, #00E5FF 1px, transparent 1px)", backgroundSize:"8px 8px" }} />

          {/* header */}
          <div style={{
            display:"flex", justifyContent:"space-between", alignItems:"flex-end",
            marginBottom:"clamp(1.5rem, 2.5vw, 2rem)", paddingBottom:"clamp(0.8rem, 1.5vw, 1.2rem)",
            borderBottom:"1px solid rgba(0,229,255,0.06)", position:"relative", zIndex:1,
          }}>
            <div>
              <div style={{ fontSize:"clamp(1.2rem, 2vw, 1.7rem)", fontWeight:200, color:"rgba(255,255,255,0.8)", lineHeight:1.2, marginBottom:4 }}>
                Not a whitepaper. <span style={{ color:"rgba(0,229,255,0.7)" }}>Not a promise.</span>
              </div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", fontFamily:"var(--font-geist-mono), monospace" }}>
                Built from open research. No black box.
              </div>
            </div>
            <div style={{ fontFamily:"var(--font-geist-mono), monospace", fontSize:9, color:"rgba(0,229,255,0.25)", textAlign:"right", lineHeight:1.6 }}>
              timestamp<br />0x{receiptDigits}
            </div>
          </div>

          {/* ══ fields ═════════════════════════════ */}
          <div style={{ display:"flex", flexDirection:"column", gap:1, position:"relative", zIndex:1 }}>
            {FIELDS.map(({ field, value, green }, i) => {
              const show = revealed[i];
              return (
                <div key={field} style={{
                  display:"flex", padding:"clamp(0.5rem, 1vw, 0.7rem) 0",
                  borderBottom:"1px solid rgba(0,229,255,0.04)", position:"relative",
                }}>
                  <span style={{
                    fontFamily:"var(--font-geist-mono), monospace", fontSize:10,
                    color: show ? "rgba(0,229,255,0.35)" : "rgba(255,255,255,0.12)",
                    textTransform:"uppercase", letterSpacing:"0.1em", minWidth:110,
                    transition: "color 0.35s ease",
                  }}>
                    {field}
                  </span>
                  <span style={{
                    fontFamily:"var(--font-geist-mono), monospace",
                    fontSize:"clamp(0.85rem, 1.2vw, 1rem)", fontWeight:500,
                    color: show ? (green ? "#34D399" : "#00E5FF") : "rgba(255,255,255,0.08)",
                    position:"relative",
                    animation: show
                      ? (green ? "valRevealGreen 0.5s ease-out forwards" : "valReveal 0.5s ease-out forwards")
                      : "none",
                  }}>
                    {value}
                    {/* redaction bar — always present, animated out */}
                    <span style={{
                      position:"absolute", top:-3, bottom:-3, left:-6, right:-6,
                      background:"rgba(8,12,24,0.94)", borderRadius:3,
                      transformOrigin:"left center",
                      animation: show ? "redactBurn 0.55s ease-in forwards" : "none",
                      pointerEvents:"none",
                    }} />
                  </span>
                </div>
              );
            })}
          </div>

          {/* ══ stamp ═══════════════════════════════ */}
          {stamped && (
            <div style={{
              position:"absolute", bottom:"clamp(1rem, 2vw, 1.5rem)",
              right:"clamp(1.5rem, 3vw, 2.5rem)", zIndex:2,
              animation:"stampDown 0.55s cubic-bezier(0.16,1,0.3,1) forwards",
            }}>
              <div style={{
                padding:"0.55rem 1.1rem 0.45rem", border:"2px solid rgba(52,211,153,0.35)",
                borderRadius:6, transform:"rotate(-3deg)",
                background:"rgba(52,211,153,0.04)", textAlign:"center",
              }}>
                <div style={{ fontSize:9, color:"#34D399", fontFamily:"var(--font-geist-mono), monospace", letterSpacing:"0.15em", marginBottom:2 }}>
                  ✓ AUTHENTICATED
                </div>
                <div style={{ fontSize:7, color:"rgba(52,211,153,0.4)", fontFamily:"var(--font-geist-mono), monospace", letterSpacing:"0.1em" }}>
                  THE CONTINUITY LAB
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══ footer ═══════════════════════════════ */}
        <div style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          flexWrap:"wrap", gap:12, marginTop:"clamp(1rem, 2vw, 1.5rem)",
          animation: footer ? "footerIn 0.5s ease-out forwards" : "none",
          opacity: footer ? 1 : 0,
        }}>
          <span style={{ fontSize:11, color:"rgba(0,229,255,0.25)", fontFamily:"var(--font-geist-mono), monospace" }}>
            All research, benchmarks, and protocols are public at{" "}
            <Link href="https://thecontinuitylab.org" style={{ color:"rgba(0,229,255,0.45)", textDecoration:"none" }}
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.02)}>
              The Continuity Lab →
            </Link>
          </span>
          <Link href="/research/challenge" style={{
            fontSize:10, color:"rgba(0,229,255,0.25)", fontFamily:"var(--font-geist-mono), monospace",
            textDecoration:"none", letterSpacing:"0.05em", borderBottom:"1px solid rgba(0,229,255,0.08)",
          }}
            onMouseEnter={() => playTick(600, "sine", 0.06, 0.02)}>
            Challenge CPS-0001 →
          </Link>
        </div>

      </div>
    </section>
  );
}
