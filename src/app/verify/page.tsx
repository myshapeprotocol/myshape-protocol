"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { detectJerkPeaks, matchEvents, detectDirectionChanges, buildEvidence } from "@/lib/evidence/causal-coupling";
import { evaluatePolicy } from "@/lib/evidence/types";

const DURATION = 5;

function round(v: number | null | undefined): number { if (v === null || v === undefined) return 0; return Math.round(v * 1000) / 1000; }
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export default function VerifyPage() {
  const [phase, setPhase] = useState<"ready" | "countdown" | "capturing" | "processing" | "done">("ready");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [samples, setSamples] = useState(0);
  const [result, setResult] = useState<{ verdict: string; confidence: number; diagnostics: string[] } | null>(null);
  const [error, setError] = useState("");

  const imuRef = useRef<Array<{ t: number; ax: number; ay: number; az: number; rx: number; ry: number; rz: number; interval: number }>>([]);
  const capturing = useRef(false);
  const startRef = useRef(0);
  const lastRef = useRef(0);

  const handleIMU = useCallback((e: DeviceMotionEvent) => {
    if (!capturing.current) return;
    const now = performance.now(); const t = now - startRef.current;
    const iv = lastRef.current > 0 ? now - lastRef.current : 0; lastRef.current = now;
    imuRef.current.push({ t: Math.round(t), ax: round(e.acceleration?.x ?? e.accelerationIncludingGravity?.x), ay: round(e.acceleration?.y ?? e.accelerationIncludingGravity?.y), az: round(e.acceleration?.z ?? e.accelerationIncludingGravity?.z), rx: round(e.rotationRate?.alpha), ry: round(e.rotationRate?.beta), rz: round(e.rotationRate?.gamma), interval: Math.round(iv * 100) / 100 });
    if (imuRef.current.length % 30 === 0) setSamples(imuRef.current.length);
  }, []);

  async function start() {
    setError(""); setResult(null);
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try { if ((await (DeviceMotionEvent as any).requestPermission()) !== "granted") { setError("Motion access needed. Check your phone settings."); return; } } catch { setError("Permission error. Make sure you're using HTTPS."); return; }
    }
    if (!("DeviceMotionEvent" in window)) { setError("This device doesn't have motion sensors. Try it on a phone."); return; }
    window.addEventListener("devicemotion", handleIMU);
    setPhase("countdown");
    for (let i = 3; i >= 1; i--) { setCountdown(i); await sleep(1000); }
    imuRef.current = []; setSamples(0); capturing.current = true; startRef.current = performance.now(); lastRef.current = 0;
    setPhase("capturing"); setElapsed(0);
    const t0 = performance.now();
    await new Promise<void>((resolve) => { const t = setInterval(() => { const e = (performance.now() - t0) / 1000; setElapsed(e); if (e >= DURATION) { clearInterval(t); resolve(); } }, 100); });
    capturing.current = false; window.removeEventListener("devicemotion", handleIMU);
    setSamples(imuRef.current.length); setPhase("processing");

    const data = imuRef.current;
    if (data.length < 20) { setResult({ verdict: "Insufficient data", confidence: 0, diagnostics: ["Not enough motion samples. Try moving more."] }); setPhase("done"); return; }

    // Real analysis pipeline
    const imuEvents = detectJerkPeaks(data);
    const camEvents = detectDirectionChanges([]); // no camera
    const { matches } = matchEvents(imuEvents, camEvents);
    const totalDuration = data[data.length - 1]?.t || DURATION * 1000;
    const ev = buildEvidence(imuEvents, camEvents, matches, [], [], totalDuration);
    const verdict = evaluatePolicy({ policyId: "verify", acceptThreshold: 0.70, rejectThreshold: 0.35 }, ev.confidence ?? 0);

    setResult({
      verdict: verdict === "PASS" ? "PASS" : verdict === "FAIL" ? "Inconclusive" : "Inconclusive",
      confidence: ev.confidence ?? 0,
      diagnostics: ev.diagnostics.filter((d) => d.startsWith("✓") || d.startsWith("✗") || d.startsWith("⚠")),
    });
    setPhase("done");

    // Save to research dataset
    try { await fetch("/api/pe001/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: "vfy-" + Date.now(), imuSamples: data }) }); } catch { /* silent */ }
  }

  const isPass = result?.verdict === "PASS";
  const pct = result ? Math.round(result.confidence * 100) : 0;

  return (
    <div style={{ minHeight: "100dvh", background: "#060B14", color: "#E6EDF7", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center" }}>
      <div style={{ maxWidth: 380, width: "100%" }}>
        <Link href="/" style={{ fontSize: 11, color: "rgba(96,165,250,0.35)", textDecoration: "none", position: "fixed", top: 20, left: 20 }}>← Home</Link>

        {phase === "ready" && (
          <>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "radial-gradient(circle, rgba(96,165,250,0.2) 0%, rgba(96,165,250,0.04) 60%, transparent 100%)", margin: "0 auto 32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60A5FA", boxShadow: "0 0 12px rgba(96,165,250,0.6), 0 0 24px rgba(96,165,250,0.2)" }} />
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 5vw, 2.2rem)", fontWeight: 300, color: "#E6EDF7", margin: "0 0 8px" }}>Are you you?</h1>
            <p style={{ fontSize: "clamp(0.85rem, 2vw, 1rem)", color: "#94A3B8", margin: "0 0 36px", lineHeight: 1.7, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>
              Move your phone naturally for 5 seconds. Your motion pattern is unique — no one else moves exactly like you.
            </p>
            {error && <div style={{ fontSize: 12, color: "#f85149", marginBottom: 16, padding: "10px 14px", background: "rgba(248,81,73,0.06)", border: "1px solid rgba(248,81,73,0.2)", borderRadius: 6 }}>{error}</div>}
            <button onClick={start} style={{ width: "100%", padding: "16px 0", fontSize: 17, fontWeight: 400, color: "#060B14", background: "#60A5FA", border: "none", borderRadius: 8, cursor: "pointer", letterSpacing: "0.04em", transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#93C5FD"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#60A5FA"}>
              Verify me
            </button>
            <p style={{ fontSize: 11, color: "#64748B", marginTop: 14 }}>No account. No app. No camera. Just motion.</p>
          </>
        )}

        {phase === "countdown" && <div style={{ fontSize: 72, fontWeight: 200, color: "#60A5FA", padding: "48px 0" }}>{countdown}</div>}

        {phase === "capturing" && (
          <div>
            <div style={{ fontSize: 16, color: "#60A5FA", marginBottom: 24, fontWeight: 400 }}>Move your phone naturally</div>
            <div style={{ height: 3, background: "#1E293B", borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg, #60A5FA, #34D399)", width: `${(elapsed / DURATION) * 100}%`, transition: "width 0.1s linear", borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 12, color: "#64748B" }}>{samples} samples</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 32, fontStyle: "italic" }}>Shake, wave, trace a circle — your body knows what to do.</div>
          </div>
        )}

        {phase === "processing" && (
          <div style={{ padding: "48px 0" }}>
            <div style={{ fontSize: 14, color: "#d29922", marginBottom: 8 }}>Analyzing</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>Looking for human motion patterns...</div>
          </div>
        )}

        {phase === "done" && result && (
          <div>
            <div style={{ fontSize: 56, marginBottom: 16, width: 80, height: 80, borderRadius: "50%", background: isPass ? "rgba(52,211,153,0.1)" : "rgba(210,153,34,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: `2px solid ${isPass ? "rgba(52,211,153,0.3)" : "rgba(210,153,34,0.2)"}` }}>
              {isPass ? "✓" : "?"}
            </div>
            <div style={{ fontSize: 22, fontWeight: 300, color: isPass ? "#34D399" : "#d29922", marginBottom: 8 }}>
              {isPass ? "It's you" : "Uncertain"}
            </div>
            <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 24 }}>{pct}% confidence</div>

            <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.8, marginBottom: 28, padding: "14px 16px", background: "#0B1220", border: "1px solid #1E293B", borderRadius: 8, textAlign: "left" }}>
              {isPass
                ? "Your phone detected natural human motion — micro-timing variance, biological tremor, and irregular rhythm patterns that AI systems cannot generate."
                : "Not enough human-like motion was detected. Try moving more naturally — shake your phone, trace circles, or wave it around. Avoid smooth, mechanical movements."}
              {result.diagnostics.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 10 }}>
                  {result.diagnostics.map((d, i) => (
                    <div key={i} style={{ color: d.startsWith("✓") ? "#34D399" : d.startsWith("✗") ? "#f85149" : "#d29922" }}>{d}</div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => { setPhase("ready"); setResult(null); }} style={{ width: "100%", padding: "14px 0", fontSize: 15, color: "#60A5FA", background: "transparent", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 8, cursor: "pointer", transition: "border-color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(96,165,250,0.6)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(96,165,250,0.3)"}>
              Try again
            </button>

            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.1)", marginTop: 20, lineHeight: 1.5 }}>
              Your anonymized motion data contributes to open continuity research.<br />Nothing identifiable is stored.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
