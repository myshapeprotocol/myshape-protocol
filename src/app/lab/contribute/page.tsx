"use client";

import { useState, useRef, useEffect } from "react";

const STEPS = [
  { id: "motion", title: "Motion Check", desc: "Move your phone naturally for 8 seconds.", seconds: 8 },
  { id: "challenge", title: "Gyroscope Challenge", desc: "Respond to directional prompts. Tests anti-replay.", seconds: 15 },
  { id: "dual", title: "Dual-Engine Verification", desc: "Passive observation + active challenge combined.", seconds: 30 },
];

export default function ContributePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "countdown" | "recording" | "done" | "finished">("idle");
  const [msg, setMsg] = useState("");
  const [verdict, setVerdict] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [details, setDetails] = useState<string[]>([]);
  const [samples, setSamples] = useState(0);
  const [error, setError] = useState("");
  const [collected, setCollected] = useState(0);
  const ref = useRef<Array<{ t: number; ax: number; ay: number; az: number }>>([]);
  const capRef = useRef(false);

  useEffect(() => { setIsMobile(/Mobi|Android|iPhone/i.test(navigator.userAgent)); }, []);

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  async function go() {
    setError(""); setVerdict(""); setConfidence(0); setDetails([]);

    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try { if (await (DeviceMotionEvent as any).requestPermission() !== "granted") { setError("Motion access needed."); return; } }
      catch { setError("Permission error."); return; }
    }
    if (!("DeviceMotionEvent" in window)) { setError("No motion sensor."); return; }

    setPhase("countdown");
    setMsg("3"); await delay(1000);
    setMsg("2"); await delay(1000);
    setMsg("1"); await delay(1000);

    ref.current = [];
    capRef.current = true;
    const t0 = performance.now();
    const handler = (e: DeviceMotionEvent) => {
      if (!capRef.current) return;
      ref.current.push({ t: performance.now() - t0, ax: e.acceleration?.x ?? 0, ay: e.acceleration?.y ?? 0, az: e.acceleration?.z ?? 0 });
    };
    window.addEventListener("devicemotion", handler);

    setPhase("recording");
    setMsg("Move naturally...");
    await delay(step.seconds * 1000);

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

    setVerdict(ok ? "Physical motion detected" : "Weak signal");
    setConfidence(Math.round(sc * 100));
    setDetails([cv > 0.08 ? "✓ Natural timing" : "✗ Too regular", mvv > 0.25 ? "✓ Good intensity" : "✗ Too weak"]);

    try {
      await fetch("/api/pe001/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: `lab-${step.id}-${Date.now()}`, imuSamples: data, mode: step.id }) });
      setCollected(c => c + 1);
    } catch { /* ok */ }
    setPhase("done");
  }

  function next() {
    if (isLast) { setPhase("finished"); return; }
    setStepIdx(i => i + 1);
    setPhase("idle");
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

  if (phase === "finished") {
    return (
      <div style={{ minHeight: "100dvh", background: "#060B14", color: "#E6EDF7", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <div style={{ maxWidth: 380 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 300, color: "#34D399", margin: "0 0 8px" }}>All done — thank you!</h2>
          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.7, marginBottom: 24 }}>
            {collected} experiment{collected > 1 ? "s" : ""} contributed to the open Continuity Dataset.
          </p>
          <button onClick={() => { setStepIdx(0); setPhase("idle"); setCollected(0); }} style={{ padding: "14px 32px", fontSize: 15, color: "#34D399", background: "transparent", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 8, cursor: "pointer" }}>Start over</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#060B14", color: "#E6EDF7", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div style={{ maxWidth: 380, width: "100%" }}>

        {/* Step indicator */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ width: 8, height: 8, borderRadius: "50%", background: i < stepIdx ? "#34D399" : i === stepIdx ? "#60A5FA" : "rgba(255,255,255,0.1)", transition: "background 0.3s" }} />
          ))}
        </div>

        {phase === "idle" && (
          <>
            <div style={{ fontSize: 12, color: "#34D399", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
              Step {stepIdx + 1} of {STEPS.length}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 300, margin: "0 0 8px" }}>{step.title}</h1>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 8px", lineHeight: 1.6 }}>{step.desc}</p>
            <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 24px" }}>{step.seconds} seconds · Anonymous · Added to Dataset</p>
            {error && <div style={{ fontSize: 12, color: "#f85149", marginBottom: 16, padding: 10, background: "rgba(248,81,73,0.06)", border: "1px solid rgba(248,81,73,0.2)", borderRadius: 6 }}>{error}</div>}
            <button onClick={go} style={{ width: "100%", padding: "18px 0", fontSize: 17, color: "#060B14", background: "#34D399", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 500 }}>
              Start
            </button>
            <div style={{ marginTop: 12 }}>
              <button onClick={() => { setPhase("finished"); }} style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer" }}>Skip all & finish</button>
            </div>
          </>
        )}

        {(phase === "countdown" || phase === "recording") && (
          <div style={{ fontSize: phase === "recording" ? 18 : 64, fontWeight: 200, color: "#34D399", padding: phase === "recording" ? 40 : 56 }}>
            {msg}
          </div>
        )}

        {phase === "done" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{verdict === "Physical motion detected" ? "✓" : "?"}</div>
            <div style={{ fontSize: 18, fontWeight: 300, color: verdict === "Physical motion detected" ? "#34D399" : "#d29922", marginBottom: 4 }}>{verdict}</div>
            <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 16 }}>{confidence}% · {samples} samples</div>
            <div style={{ fontSize: 11, lineHeight: 1.8, marginBottom: 20, padding: "12px 14px", background: "#0B1220", border: "1px solid #1E293B", borderRadius: 8, textAlign: "left" }}>
              {details.map((d, i) => <div key={i} style={{ color: d.startsWith("✓") ? "#34D399" : "#f85149" }}>{d}</div>)}
              <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.12)" }}>Saved to Continuity Dataset</div>
            </div>
            <button onClick={next} style={{ width: "100%", padding: "14px 0", fontSize: 15, color: "#060B14", background: "#34D399", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 500 }}>
              {isLast ? "Finish" : `Next: ${STEPS[stepIdx + 1].title} →`}
            </button>
          </>
        )}

      </div>
    </div>
  );
}
