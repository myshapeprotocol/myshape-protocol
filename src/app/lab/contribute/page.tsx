"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ── Challenge prompts for directed motion ── */
const PROMPTS = [
  { text: "Rotate right", icon: "↻" },
  { text: "Rotate left", icon: "↺" },
  { text: "Tilt forward", icon: "↥" },
  { text: "Tilt back", icon: "↧" },
  { text: "Shake gently", icon: "⟳" },
];

/* ── Three experiment steps ── */
type Step = {
  id: string;
  title: string;
  desc: string;
  seconds: number;        // total recording time
  freeSeconds: number;     // seconds of free motion before prompts (0 = no prompts)
  promptSeconds: number;   // seconds per prompt (0 = no prompts)
};

const STEPS: Step[] = [
  { id: "free",    title: "Free Motion",        desc: "Move your phone naturally in any direction. Walk, wave, gesture — whatever feels natural.", seconds: 8,  freeSeconds: 8,  promptSeconds: 0 },
  { id: "directed",title: "Directed Motion",     desc: "Follow the rotation prompts on screen. Tests anti-replay with intentional directional movement.", seconds: 15, freeSeconds: 0,  promptSeconds: 3 },
  { id: "dual",    title: "Free + Directed",     desc: "First 10 seconds: move freely. Then follow the prompts that appear.", seconds: 20, freeSeconds: 10, promptSeconds: 4 },
];

type Phase = "idle" | "countdown" | "recording" | "done" | "finished";

export default function ContributePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [promptText, setPromptText] = useState("");
  const [promptIcon, setPromptIcon] = useState("");
  const [verdict, setVerdict] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [detailLines, setDetailLines] = useState<string[]>([]);
  const [samples, setSamples] = useState(0);
  const [error, setError] = useState("");
  const [collected, setCollected] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  const rawRef = useRef<Array<{ t: number; ax: number; ay: number; az: number }>>([]);
  const capRef = useRef(false);
  const promptTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  useEffect(() => { setIsMobile(/Mobi|Android|iPhone/i.test(navigator.userAgent)); }, []);

  /* ── Analysis ── */
  const analyze = useCallback((data: Array<{ t: number; ax: number; ay: number; az: number }>) => {
    if (data.length < 10) { setVerdict("Not enough data"); return; }
    const n = data.length;
    let si = 0; for (let i = 1; i < n; i++) si += data[i].t - data[i - 1].t;
    const mi = si / Math.max(n - 1, 1);
    let sv = 0; for (let i = 1; i < n; i++) { const d = data[i].t - data[i - 1].t; sv += (d - mi) ** 2; }
    const cv = Math.sqrt(sv / Math.max(n - 1, 1)) / Math.max(mi, 1);
    let sm = 0; for (const d of data) sm += Math.sqrt(d.ax ** 2 + d.ay ** 2 + d.az ** 2);
    const mv = sm / n;
    let mv2 = 0; for (const d of data) { const m = Math.sqrt(d.ax ** 2 + d.ay ** 2 + d.az ** 2); mv2 += (m - mv) ** 2; }
    const mvv = mv2 / n;
    const sc = Math.min(cv / 0.25, 1) * 0.5 + Math.min(mvv / 1.5, 1) * 0.5;
    const ok = sc > 0.25;
    setVerdict(ok ? "Physical motion detected" : "Weak signal — try moving more");
    setConfidence(Math.round(sc * 100));
    setDetailLines([cv > 0.08 ? "✓ Natural timing variation" : "✗ Timing too regular", mvv > 0.25 ? "✓ Good motion intensity" : "✗ Movement too subtle"]);
  }, []);

  /* ── Run one experiment ── */
  async function run() {
    setError("");
    setVerdict(""); setConfidence(0); setDetailLines([]); setSamples(0);
    setPromptText(""); setPromptIcon(""); setElapsed(0);

    // iOS permission
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try { if (await (DeviceMotionEvent as any).requestPermission() !== "granted") { setError("Motion sensor access is required. Check your privacy settings."); return; } }
      catch { setError("Permission error. Check your privacy settings."); return; }
    }
    if (!("DeviceMotionEvent" in window)) { setError("This device doesn't have motion sensors."); return; }

    // ── Countdown ──
    setPhase("countdown");
    for (let c = 3; c >= 1; c--) { setCountdown(c); await delay(800); }
    setCountdown(0);

    // ── Recording ──
    setPhase("recording");
    rawRef.current = [];
    capRef.current = true;
    const t0 = performance.now();
    const handler = (e: DeviceMotionEvent) => {
      if (!capRef.current) return;
      rawRef.current.push({
        t: performance.now() - t0,
        ax: e.acceleration?.x ?? e.accelerationIncludingGravity?.x ?? 0,
        ay: e.acceleration?.y ?? e.accelerationIncludingGravity?.y ?? 0,
        az: e.acceleration?.z ?? e.accelerationIncludingGravity?.z ?? 0,
      });
    };
    window.addEventListener("devicemotion", handler);

    // Elapsed timer
    elapsedTimer.current = setInterval(() => {
      setElapsed(Math.floor((performance.now() - t0) / 1000));
    }, 250);

    const totalMs = step.seconds * 1000;

    if (step.promptSeconds === 0) {
      // Pure free motion — just wait
      setPromptText("Move naturally");
      await delay(totalMs);
    } else if (step.freeSeconds === 0) {
      // Pure prompts from start
      let i = 0;
      const show = () => { setPromptText(PROMPTS[i].text); setPromptIcon(PROMPTS[i].icon); };
      show();
      promptTimer.current = setInterval(() => { i = (i + 1) % PROMPTS.length; show(); }, step.promptSeconds * 1000);
      await delay(totalMs);
    } else {
      // Free first, then prompts
      setPromptText("Move freely");
      await delay(step.freeSeconds * 1000);
      let i = 0;
      const show = () => { setPromptText(PROMPTS[i].text); setPromptIcon(PROMPTS[i].icon); };
      show();
      promptTimer.current = setInterval(() => { i = (i + 1) % PROMPTS.length; show(); }, step.promptSeconds * 1000);
      await delay((step.seconds - step.freeSeconds) * 1000);
    }

    // ── Cleanup ──
    if (promptTimer.current) { clearInterval(promptTimer.current); promptTimer.current = null; }
    if (elapsedTimer.current) { clearInterval(elapsedTimer.current); elapsedTimer.current = null; }
    capRef.current = false;
    window.removeEventListener("devicemotion", handler);
    setPromptText(""); setPromptIcon("");
    setTotalTime(step.seconds);
    setSamples(rawRef.current.length);

    // ── Analyze & save ──
    analyze(rawRef.current);
    try {
      await fetch("/api/pe001/session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: `lab-${step.id}-${Date.now()}`, imuSamples: rawRef.current, mode: step.id }),
      });
      setCollected(c => c + 1);
    } catch { /* ok */ }
    setPhase("done");
  }

  function nextStep() {
    if (isLast) { setPhase("finished"); return; }
    setStepIdx(i => i + 1);
    setPhase("idle");
  }

  function reset() { setStepIdx(0); setPhase("idle"); setCollected(0); }

  /* ── Desktop prompt ── */
  if (!isMobile) {
    return (
      <div style={{ minHeight: "100dvh", background: "#060B14", color: "#E6EDF7", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <div style={{ maxWidth: 360 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📱</div>
          <h2 style={{ fontSize: 22, fontWeight: 300, margin: "0 0 12px", color: "#60A5FA" }}>Open on your phone</h2>
          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.7 }}>
            Motion sensors are only available on mobile devices.<br /><br />
            <code style={{ color: "#60A5FA", fontSize: 12 }}>thecontinuitylab.org/lab/contribute</code>
          </p>
        </div>
      </div>
    );
  }

  /* ── Finished screen ── */
  if (phase === "finished") {
    return (
      <div style={{ minHeight: "100dvh", background: "#060B14", color: "#E6EDF7", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <div style={{ maxWidth: 360 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 300, color: "#34D399", margin: "0 0 8px" }}>All done — thank you!</h2>
          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.7, marginBottom: 24 }}>
            {collected} experiment{collected > 1 ? "s" : ""} added to the open Continuity Dataset.
          </p>
          <button onClick={reset} style={{ padding: "12px 28px", fontSize: 14, color: "#34D399", background: "transparent", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 8, cursor: "pointer" }}>
            Start over
          </button>
        </div>
      </div>
    );
  }

  /* ── Main UI ── */
  return (
    <div style={{ minHeight: "100dvh", background: "#060B14", color: "#E6EDF7", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div style={{ maxWidth: 380, width: "100%" }}>

        {/* ── Progress dots ── */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{
              width: 8, height: 8, borderRadius: "50%",
              background: i < stepIdx ? "#34D399" : i === stepIdx ? "#60A5FA" : "rgba(255,255,255,0.1)",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* ── Idle ── */}
        {phase === "idle" && (
          <>
            <div style={{ fontSize: 11, color: "#34D399", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
              Step {stepIdx + 1} of {STEPS.length}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 300, margin: "0 0 8px" }}>{step.title}</h1>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: "0 0 4px", lineHeight: 1.6 }}>{step.desc}</p>
            <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 24px" }}>{step.seconds} seconds · Anonymous · Open dataset</p>
            {error && (
              <div style={{ fontSize: 12, color: "#f85149", marginBottom: 16, padding: 10, background: "rgba(248,81,73,0.06)", border: "1px solid rgba(248,81,73,0.2)", borderRadius: 6 }}>{error}</div>
            )}
            <button onClick={run} style={{ width: "100%", padding: "18px 0", fontSize: 17, color: "#060B14", background: "#34D399", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 500 }}>
              Start
            </button>
            <button onClick={() => setPhase("finished")} style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.2)", background: "none", border: "none", cursor: "pointer" }}>
              Skip
            </button>
          </>
        )}

        {/* ── Countdown / Recording ── */}
        {(phase === "countdown" || phase === "recording") && (
          <div>
            {phase === "countdown" ? (
              <div style={{ fontSize: 64, fontWeight: 200, color: "#34D399", padding: 56 }}>{countdown}</div>
            ) : (
              <>
                {promptIcon && <div style={{ fontSize: 48, color: "#34D399", marginBottom: 8, opacity: 0.5 }}>{promptIcon}</div>}
                <div style={{ fontSize: 20, fontWeight: 300, color: "#34D399", marginBottom: 20, minHeight: 32 }}>{promptText || "Recording…"}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {/* Simple progress bar */}
                  <div style={{ width: 200, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min((elapsed / step.seconds) * 100, 100)}%`, height: "100%", background: "#34D399", transition: "width 0.25s linear", borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", minWidth: 36 }}>{step.seconds - elapsed}s</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Done ── */}
        {phase === "done" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{verdict.startsWith("Physical") ? "✓" : "?"}</div>
            <div style={{ fontSize: 18, fontWeight: 300, color: verdict.startsWith("Physical") ? "#34D399" : "#d29922", marginBottom: 6 }}>{verdict}</div>
            <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 16 }}>{confidence}% · {samples} samples · {totalTime}s</div>
            {detailLines.length > 0 && (
              <div style={{ fontSize: 11, lineHeight: 1.8, marginBottom: 20, padding: "12px 14px", background: "#0B1220", border: "1px solid #1E293B", borderRadius: 8, textAlign: "left" }}>
                {detailLines.map((d, i) => <div key={i} style={{ color: d.startsWith("✓") ? "#34D399" : "#f85149" }}>{d}</div>)}
                <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.12)" }}>Saved to Continuity Dataset</div>
              </div>
            )}
            <button onClick={nextStep} style={{ width: "100%", padding: "14px 0", fontSize: 15, color: "#060B14", background: "#34D399", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 500 }}>
              {isLast ? "Finish" : `Next: ${STEPS[stepIdx + 1].title} →`}
            </button>
          </>
        )}

      </div>
    </div>
  );
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
