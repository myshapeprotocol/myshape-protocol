"use client";

import { useState, useRef } from "react";

export default function Page() {
  const [phase, setPhase] = useState<"idle" | "go" | "done">("idle");
  const [msg, setMsg] = useState("");
  const [samples, setSamples] = useState(0);
  const [verdict, setVerdict] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [details, setDetails] = useState<string[]>([]);
  const [error, setError] = useState("");
  const ref = useRef<Array<{ t: number; ax: number; ay: number; az: number }>>([]);
  const capRef = useRef(false);

  async function go() {
    setError(""); setVerdict(""); setConfidence(0); setDetails([]);

    // iOS: must call requestPermission BEFORE any await — user gesture required
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const p = await (DeviceMotionEvent as any).requestPermission();
        if (p !== "granted") { setError("Motion access needed."); return; }
      } catch { setError("Permission error."); return; }
    }
    if (!("DeviceMotionEvent" in window)) { setError("No motion sensor."); return; }

    setPhase("go");
    setMsg("3");
    await new Promise(r => setTimeout(r, 1000)); setMsg("2");
    await new Promise(r => setTimeout(r, 1000)); setMsg("1");
    await new Promise(r => setTimeout(r, 1000));

    // Capture
    ref.current = [];
    capRef.current = true;
    const t0 = performance.now();

    const handler = (e: DeviceMotionEvent) => {
      if (!capRef.current) return;
      ref.current.push({ t: performance.now() - t0, ax: e.acceleration?.x ?? e.accelerationIncludingGravity?.x ?? 0, ay: e.acceleration?.y ?? e.accelerationIncludingGravity?.y ?? 0, az: e.acceleration?.z ?? e.accelerationIncludingGravity?.z ?? 0 });
    };
    window.addEventListener("devicemotion", handler);

    setMsg("Recording...");
    await wait(8000);

    capRef.current = false;
    window.removeEventListener("devicemotion", handler);
    setSamples(ref.current.length);

    // Analyze
    const data = ref.current;
    if (data.length < 10) { setVerdict("Not enough data"); setPhase("done"); return; }
    const n = data.length;

    let si = 0; for (let i = 1; i < n; i++) si += data[i].t - data[i - 1].t;
    const mi = si / (n - 1);
    let sv = 0; for (let i = 1; i < n; i++) { const d = data[i].t - data[i - 1].t; sv += (d - mi) * (d - mi); }
    const cv = Math.sqrt(sv / (n - 1)) / Math.max(mi, 1);

    let sm = 0; for (const d of data) sm += Math.sqrt(d.ax * d.ax + d.ay * d.ay + d.az * d.az);
    const mm = sm / n;
    let mv = 0; for (const d of data) { const m = Math.sqrt(d.ax * d.ax + d.ay * d.ay + d.az * d.az); mv += (m - mm) * (m - mm); }
    const mvv = mv / n;

    const sc = Math.min(cv / 0.25, 1) * 0.5 + Math.min(mvv / 1.5, 1) * 0.5;
    const ok = sc > 0.25;

    setVerdict(ok ? "It's you" : "Uncertain");
    setConfidence(Math.round(sc * 100));
    setDetails([cv > 0.08 ? "✓ Natural timing" : "✗ Too regular", mvv > 0.25 ? "✓ Good intensity" : "✗ Too weak"]);
    setPhase("done");
  }

  function wait(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

  return (
    <div style={{ minHeight: "100dvh", background: "#060B14", color: "#E6EDF7", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div style={{ maxWidth: 360, width: "100%" }}>

        {phase === "idle" && (
          <>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "radial-gradient(circle, rgba(96,165,250,0.2) 0%, transparent 70%)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#60A5FA", boxShadow: "0 0 10px rgba(96,165,250,0.6)" }} />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 300, margin: "0 0 8px" }}>Are you you?</h1>
            <p style={{ fontSize: 14, color: "#94A3B8", margin: "0 0 32px", lineHeight: 1.6 }}>Move your phone naturally for 8 seconds.</p>
            {error && <div style={{ fontSize: 12, color: "#f85149", marginBottom: 16, padding: 10, background: "rgba(248,81,73,0.06)", border: "1px solid rgba(248,81,73,0.2)", borderRadius: 6 }}>{error}</div>}
            <button onClick={go} style={{ width: "100%", padding: "16px 0", fontSize: 17, color: "#060B14", background: "#60A5FA", border: "none", borderRadius: 8, cursor: "pointer" }}>
              Start
            </button>
          </>
        )}

        {phase === "go" && (
          <div style={{ fontSize: msg === "Recording..." ? 18 : 64, fontWeight: 200, color: "#60A5FA", padding: msg === "Recording..." ? 32 : 48 }}>
            {msg === "Recording..." ? "Move naturally..." : msg}
          </div>
        )}

        {phase === "done" && (
          <>
            <div style={{ fontSize: 48, width: 72, height: 72, borderRadius: "50%", background: verdict === "It's you" ? "rgba(52,211,153,0.1)" : "rgba(210,153,34,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: `2px solid ${verdict === "It's you" ? "rgba(52,211,153,0.3)" : "rgba(210,153,34,0.2)"}` }}>
              {verdict === "It's you" ? "✓" : "?"}
            </div>
            <div style={{ fontSize: 22, fontWeight: 300, color: verdict === "It's you" ? "#34D399" : "#d29922", marginBottom: 8 }}>{verdict}</div>
            <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 20 }}>{confidence}% confidence</div>
            <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.8, marginBottom: 24, padding: "12px 14px", background: "#0B1220", border: "1px solid #1E293B", borderRadius: 8, textAlign: "left" }}>
              {details.map((d, i) => <div key={i} style={{ color: d.startsWith("✓") ? "#34D399" : "#f85149" }}>{d}</div>)}
              <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.12)" }}>{samples} samples · anonymized for research</div>
            </div>
            <button onClick={() => setPhase("idle")} style={{ width: "100%", padding: "14px 0", fontSize: 15, color: "#60A5FA", background: "transparent", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 8, cursor: "pointer" }}>Try again</button>
          </>
        )}
      </div>
    </div>
  );
}
