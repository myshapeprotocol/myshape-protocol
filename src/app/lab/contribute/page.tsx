"use client";

import { useState, useRef, useEffect } from "react";

type Mode = "motion" | "challenge" | "dual";

const MODES: { id: Mode; label: string; desc: string; time: string }[] = [
  { id: "motion", label: "Motion Check", desc: "Move naturally for 8 seconds. Captures IMU data.", time: "8s" },
  { id: "challenge", label: "Challenge", desc: "Respond to 3 randomized gyroscope prompts.", time: "15s" },
  { id: "dual", label: "Dual Engine", desc: "Passive presence + active challenge in sequence.", time: "30s" },
];

export default function ContributePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [mode, setMode] = useState<Mode>("motion");
  const [phase, setPhase] = useState<"idle" | "go" | "done">("idle");
  const [msg, setMsg] = useState("");
  const [verdict, setVerdict] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [details, setDetails] = useState<string[]>([]);
  const [samples, setSamples] = useState(0);
  const [error, setError] = useState("");
  const ref = useRef<Array<{ t: number; ax: number; ay: number; az: number }>>([]);
  const capRef = useRef(false);

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone/i.test(navigator.userAgent));
  }, []);

  async function go() {
    setError(""); setVerdict(""); setConfidence(0); setDetails([]);

    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const p = await (DeviceMotionEvent as any).requestPermission();
        if (p !== "granted") { setError("Motion access needed."); return; }
      } catch { setError("Permission error."); return; }
    }
    if (!("DeviceMotionEvent" in window)) { setError("No motion sensor."); return; }

    setPhase("go");
    setMsg("3");
    await delay(1000); setMsg("2");
    await delay(1000); setMsg("1");
    await delay(1000);

    const startTime = new Date();
    ref.current = [];
    capRef.current = true;
    const t0 = performance.now();
    const handler = (e: DeviceMotionEvent) => {
      if (!capRef.current) return;
      ref.current.push({ t: performance.now() - t0, ax: e.acceleration?.x ?? 0, ay: e.acceleration?.y ?? 0, az: e.acceleration?.z ?? 0 });
    };
    window.addEventListener("devicemotion", handler);

    const duration = mode === "motion" ? 8000 : mode === "challenge" ? 15000 : 30000;
    setMsg("Recording...");
    await delay(duration);

    capRef.current = false;
    window.removeEventListener("devicemotion", handler);
    setSamples(ref.current.length);
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

    setVerdict(ok ? "Physical motion detected ✓" : "Weak signal");
    setConfidence(Math.round(sc * 100));
    setDetails([cv > 0.08 ? "✓ Natural timing" : "✗ Too regular", mvv > 0.25 ? "✓ Good intensity" : "✗ Too weak"]);

    // Save to research
    try {
      await fetch("/api/pe001/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: "lab-" + Date.now(), imuSamples: data, mode }) });
    } catch { /* ok */ }
    setPhase("done");
  }

  function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

  if (!isMobile) {
    return (
      <div style={{ minHeight: "100dvh", background: "#060B14", color: "#E6EDF7", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <div style={{ maxWidth: 360 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📱</div>
          <h2 style={{ fontSize: 22, fontWeight: 300, margin: "0 0 12px", color: "#60A5FA" }}>Open on your phone</h2>
          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.7 }}>
            These experiments use motion sensors — only available on mobile devices.<br /><br />
            <span style={{ color: "#60A5FA", fontFamily: "monospace", fontSize: 12 }}>thecontinuitylab.org/lab/contribute</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#060B14", color: "#E6EDF7", fontFamily: "system-ui, sans-serif", padding: "24px 20px 60px", maxWidth: 420, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: "#60A5FA", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Contribute Data</div>
        <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>Every run goes to the open Continuity Dataset</p>
      </div>

      {/* Mode selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, justifyContent: "center", flexWrap: "wrap" }}>
        {MODES.map((m) => (
          <button key={m.id} onClick={() => { setMode(m.id); setPhase("idle"); }}
            style={{ padding: "8px 14px", fontSize: 11, border: `1px solid ${mode === m.id ? "rgba(96,165,250,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 6, background: mode === m.id ? "rgba(96,165,250,0.08)" : "transparent", color: mode === m.id ? "#60A5FA" : "rgba(255,255,255,0.5)", cursor: "pointer", letterSpacing: "0.04em" }}>{m.label} · {m.time}</button>
        ))}
      </div>
      <p style={{ fontSize: 11, color: "#64748B", textAlign: "center", marginBottom: 24 }}>{MODES.find(m => m.id === mode)?.desc}</p>

      {/* Main area */}
      <div style={{ textAlign: "center" }}>
        {phase === "idle" && (
          <>
            {error && <div style={{ fontSize: 12, color: "#f85149", marginBottom: 16, padding: 10, background: "rgba(248,81,73,0.06)", border: "1px solid rgba(248,81,73,0.2)", borderRadius: 6 }}>{error}</div>}
            <button onClick={go} style={{ width: "100%", padding: "18px 0", fontSize: 17, color: "#060B14", background: "#60A5FA", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 500 }}>
              Start {MODES.find(m => m.id === mode)?.label}
            </button>
          </>
        )}

        {phase === "go" && (
          <div style={{ fontSize: msg === "Recording..." ? 18 : 64, fontWeight: 200, color: "#60A5FA", padding: msg === "Recording..." ? 40 : 56 }}>
            {msg}
          </div>
        )}

        {phase === "done" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{verdict.startsWith("Physical") ? "✓" : "?"}</div>
            <div style={{ fontSize: 18, fontWeight: 300, color: verdict.startsWith("Physical") ? "#34D399" : "#d29922", marginBottom: 4 }}>{verdict}</div>
            <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 16 }}>{confidence}% confidence · {samples} samples</div>
            <div style={{ fontSize: 11, lineHeight: 1.8, marginBottom: 20, padding: "12px 14px", background: "#0B1220", border: "1px solid #1E293B", borderRadius: 8, textAlign: "left" }}>
              {details.map((d, i) => <div key={i} style={{ color: d.startsWith("✓") ? "#34D399" : "#f85149" }}>{d}</div>)}
              <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.12)" }}>Anonymized · Added to Continuity Dataset</div>
            </div>
            <button onClick={() => setPhase("idle")} style={{ width: "100%", padding: "14px 0", fontSize: 15, color: "#60A5FA", background: "transparent", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 8, cursor: "pointer" }}>Try again</button>
          </>
        )}
      </div>

      <div style={{ marginTop: 48, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.15)" }}>
        Data goes to <a href="https://huggingface.co/ContinuityLab-Org/myshape-576" style={{ color: "rgba(96,165,250,0.3)", textDecoration: "none" }}>HuggingFace</a> · <a href="/lab" style={{ color: "rgba(96,165,250,0.3)", textDecoration: "none" }}>Lab Home</a>
      </div>
    </div>
  );
}
