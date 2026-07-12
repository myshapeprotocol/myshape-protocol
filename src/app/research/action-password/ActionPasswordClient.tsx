"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

interface IMUSample {
  t: number; ax: number; ay: number; az: number;
  rx: number; ry: number; rz: number; interval: number;
}

interface PESLikeFeatures {
  microTimingVariance: number; noiseResidual: number;
  frequencyEntropy: number; biologicalPerturbation: number; pesScore: number;
}

interface StoredTemplate {
  id: string; enrolledAt: string; features: PESLikeFeatures; label: string;
}

type Phase = "idle" | "enroll-countdown" | "enrolling" | "verify-countdown" | "verifying" | "enroll-done" | "verify-done" | "result";
type Mode = "enroll" | "verify";

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function round(value: number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Math.round(value * 1000) / 1000;
}

function movingAvg(signal: number[], w: number): number[] {
  const r: number[] = []; const half = Math.floor(w / 2);
  for (let i = 0; i < signal.length; i++) {
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - half); j < Math.min(signal.length, i + half + 1); j++) { sum += signal[j]; count++; }
    r.push(count > 0 ? sum / count : signal[i]);
  }
  return r;
}

function specEntropy(signal: number[]): number {
  if (signal.length < 16) return 0;
  const N = signal.length; const mags: number[] = [];
  for (let k = 0; k < Math.floor(N / 2); k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) { const a = (-2 * Math.PI * k * n) / N; re += signal[n] * Math.cos(a); im += signal[n] * Math.sin(a); }
    mags.push(Math.sqrt(re * re + im * im) / N);
  }
  const total = mags.reduce((a, b) => a + b, 0) || 1;
  const norm = mags.map((m) => m / total);
  const e = -norm.reduce((s, p) => s + (p > 1e-9 ? p * Math.log2(p) : 0), 0);
  const maxE = Math.log2(norm.length);
  return maxE > 0 ? e / maxE : 0;
}

function computeFeatures(samples: IMUSample[]): PESLikeFeatures {
  const intervals = samples.map((s) => s.interval).filter((i) => i > 0 && i < 200);
  let microTimingVariance = 0;
  if (intervals.length >= 10) {
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((s, v) => s + (v - mean) ** 2, 0) / intervals.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    microTimingVariance = 1 - Math.exp(-cv / 0.15);
  }
  const accMag = samples.map((s) => Math.sqrt(s.ax ** 2 + s.ay ** 2 + s.az ** 2));
  let noiseResidual = 0;
  if (accMag.length >= 16) {
    const mean = accMag.reduce((a, b) => a + b, 0) / accMag.length;
    const std = Math.sqrt(accMag.reduce((s, v) => s + (v - mean) ** 2, 0) / accMag.length);
    if (std >= 0.01) {
      const smoothed = movingAvg(accMag, 9);
      const residuals = accMag.map((m, i) => (m - smoothed[i]) ** 2);
      const rmse = Math.sqrt(residuals.reduce((a, b) => a + b, 0) / residuals.length);
      noiseResidual = 1 - Math.exp(-(rmse / std) / 0.3);
    }
  }
  const frequencyEntropy = specEntropy(accMag);
  const pesScore = microTimingVariance * 0.25 + noiseResidual * 0.30 + frequencyEntropy * 0.20 + 0.25 * 0.5;
  return { microTimingVariance, noiseResidual, frequencyEntropy, biologicalPerturbation: 0, pesScore };
}

function similarity(a: PESLikeFeatures, b: PESLikeFeatures): number {
  return Math.exp(-Math.sqrt(
    ((a.microTimingVariance - b.microTimingVariance) / 0.3) ** 2 +
    ((a.noiseResidual - b.noiseResidual) / 0.4) ** 2 +
    ((a.frequencyEntropy - b.frequencyEntropy) / 0.3) ** 2
  ));
}

export default function ActionPasswordClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [template, setTemplate] = useState<StoredTemplate | null>(null);
  const [result, setResult] = useState<{ passed: boolean; similarity: number; pesScore: number } | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [noSensors, setNoSensors] = useState(false);

  const samplesRef = useRef<IMUSample[]>([]);
  const startTimeRef = useRef<number>(0);
  const lastEventRef = useRef<number>(0);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRealSensorRef = useRef(false);
  const modeRef = useRef<Mode>("enroll");
  const duration = 5;

  // ── iOS Permission ──

  const requestIMU = useCallback((): Promise<boolean> => {
    const isSecure = typeof window !== "undefined" && (window.isSecureContext || window.location.hostname === "localhost");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DME = (typeof DeviceMotionEvent !== "undefined" ? DeviceMotionEvent : undefined) as any;
    if (DME && typeof DME.requestPermission === "function") {
      if (!isSecure) return Promise.resolve(false);
      return DME.requestPermission().then((p: string) => p === "granted", () => false);
    }
    return Promise.resolve(true);
  }, []);

  // ── IMU Handler ──

  const handleMotion = useCallback((e: DeviceMotionEvent) => {
    hasRealSensorRef.current = true;
    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    const interval = lastEventRef.current > 0 ? now - lastEventRef.current : 0;
    lastEventRef.current = now;
    samplesRef.current.push({
      t: Math.round(elapsed),
      ax: round(e.acceleration?.x), ay: round(e.acceleration?.y), az: round(e.acceleration?.z),
      rx: round(e.rotationRate?.alpha), ry: round(e.rotationRate?.beta), rz: round(e.rotationRate?.gamma),
      interval: Math.round(interval * 100) / 100,
    });
    setSampleCount(samplesRef.current.length);
  }, []);

  // ── Simulation ──

  const startSimulation = useCallback(() => {
    if (simTimerRef.current) return;
    let t = 0;
    const action = Math.floor(Math.random() * 3);
    simTimerRef.current = setInterval(() => {
      samplesRef.current.push({
        t, ax: Math.sin(t * 0.02 + action) * 2.5 + (Math.random() - 0.5) * 0.8,
        ay: Math.cos(t * 0.025 + action) * 1.8 + (Math.random() - 0.5) * 0.6,
        az: 9.8 + Math.sin(t * 0.015) * 0.5 + (Math.random() - 0.5) * 0.3,
        rx: Math.cos(t * 0.02) * 30 + (Math.random() - 0.5) * 8,
        ry: Math.sin(t * 0.022) * 25 + (Math.random() - 0.5) * 6,
        rz: Math.sin(t * 0.018) * 15 + (Math.random() - 0.5) * 4,
        interval: 16 + (Math.random() - 0.5) * 6,
      });
      setSampleCount(samplesRef.current.length);
      t += 16 + (Math.random() - 0.5) * 6;
    }, 16);
  }, []);

  const stopSimulation = useCallback(() => {
    if (simTimerRef.current) { clearInterval(simTimerRef.current); simTimerRef.current = null; }
  }, []);

  // ── Capture Runner ──

  const runCapture = useCallback((simulated: boolean, captPhase: Mode) => {
    (async () => {
      try {
        samplesRef.current = [];
        setSampleCount(0);
        hasRealSensorRef.current = false;
        startTimeRef.current = performance.now();
        lastEventRef.current = 0;
        window.addEventListener("devicemotion", handleMotion);
        setPhase(captPhase === "enroll" ? "enrolling" : "verifying");
        setElapsed(0);
        if (simulated) { setNoSensors(true); startSimulation(); }
        else {
          const sc = setTimeout(() => {
            if (!hasRealSensorRef.current && !simTimerRef.current) { setNoSensors(true); setIsSimulated(true); startSimulation(); }
          }, 1000);
          (runCapture as any).__sc = sc;
        }
        const start = performance.now();
        const timer = setInterval(() => {
          const e = (performance.now() - start) / 1000;
          setElapsed(e);
          if (e >= duration) {
            clearInterval(timer);
            if ((runCapture as any).__sc) clearTimeout((runCapture as any).__sc);
            window.removeEventListener("devicemotion", handleMotion);
            stopSimulation();
            // Like MobileCaptureClient: setPhase directly, no callback
            setPhase(captPhase === "enroll" ? "enroll-done" : "verify-done");
          }
        }, 100);
      } catch (err) {
        window.removeEventListener("devicemotion", handleMotion);
        stopSimulation();
        setPhase("idle");
      }
    })();
  }, [handleMotion, startSimulation, stopSimulation]);

  // ── Enroll ──

  const startEnroll = useCallback(() => {
    modeRef.current = "enroll";
    if (isSimulated) {
      (async () => { setPhase("enroll-countdown"); setCountdown(3); for (let i = 2; i >= 0; i--) { await sleep(1000); setCountdown(i); } runCapture(true, "enroll"); })();
      return;
    }
    requestIMU().then(granted => { if (!granted) return; (async () => { setPhase("enroll-countdown"); setCountdown(3); for (let i = 2; i >= 0; i--) { await sleep(1000); setCountdown(i); } runCapture(false, "enroll"); })(); });
  }, [isSimulated, requestIMU, runCapture]);

  // ── Verify ──

  const startVerify = useCallback(() => {
    if (!template) return;
    modeRef.current = "verify";
    if (isSimulated) {
      (async () => { setPhase("verify-countdown"); setCountdown(3); for (let i = 2; i >= 0; i--) { await sleep(1000); setCountdown(i); } runCapture(true, "verify"); })();
      return;
    }
    requestIMU().then(granted => { if (!granted) return; (async () => { setPhase("verify-countdown"); setCountdown(3); for (let i = 2; i >= 0; i--) { await sleep(1000); setCountdown(i); } runCapture(false, "verify"); })(); });
  }, [template, isSimulated, requestIMU, runCapture]);

  // ── Save template on enroll complete ──

  useEffect(() => {
    if (phase === "enroll-done" && samplesRef.current.length > 0) {
      try {
        const features = computeFeatures(samplesRef.current);
        const tpl: StoredTemplate = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), enrolledAt: new Date().toISOString(), features, label: "My Secret Motion" };
        setTemplate(tpl);
        try { localStorage.setItem("myshape-action-template", JSON.stringify(tpl)); } catch { /* ignore */ }
      } catch (err) {
        console.error("enroll-done error:", err);
        setPhase("idle");
      }
    }
  }, [phase]);

  // ── Compute result on verify complete ──

  useEffect(() => {
    if (phase === "verify-done" && template && samplesRef.current.length > 0) {
      try {
        const features = computeFeatures(samplesRef.current);
        const sim = similarity(template.features, features);
        setResult({ passed: sim >= 0.55, similarity: sim, pesScore: features.pesScore });
      } catch (err) {
        console.error("verify-done error:", err);
        setResult({ passed: false, similarity: 0, pesScore: 0 });
      }
    }
  }, [phase, template]);

  // ── Load template ──

  useEffect(() => {
    try { const s = localStorage.getItem("myshape-action-template"); if (s) setTemplate(JSON.parse(s)); } catch { /* ignore */ }
  }, []);

  // ── Cleanup ──

  useEffect(() => { return () => { window.removeEventListener("devicemotion", handleMotion); stopSimulation(); }; }, [handleMotion, stopSimulation]);

  // ── Render ──

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/research" className="text-white/30 text-[11px] tracking-[0.2em] uppercase hover:text-white/60">← Research</Link>
        <span className="text-white/15 text-[9px] tracking-[0.3em] uppercase">Action Password</span>
        <div className="w-16" />
      </header>
      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="p-1.5 border border-white/5 text-[9px] font-mono text-white/20">
          phase={phase} | sim={String(isSimulated)} | samples={sampleCount} | {template ? "enrolled" : "no tpl"}
        </div>

        {(phase === "idle" || phase === "result") && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="text-5xl">🔐</div>
              <h1 className="text-white/80 text-[20px] font-light">Action Password</h1>
              <p className="text-white/30 text-[13px] leading-relaxed max-w-xs mx-auto">
                {template ? "Template enrolled. Verify with the same motion." : "Set a secret motion only you can perform."}
              </p>
            </div>
            {template && (
              <div className="p-4 border border-[#3fb950]/10 bg-[#3fb950]/[0.02] space-y-2">
                <div className="text-[#3fb950]/40 text-[9px] tracking-[0.2em] uppercase">Template Active</div>
                <div className="text-white/25 text-[11px]">Enrolled {new Date(template.enrolledAt).toLocaleDateString()} · PES {template.features.pesScore.toFixed(3)}</div>
              </div>
            )}
            {result && (
              <div className={`p-4 border ${result.passed ? "border-[#3fb950]/30 bg-[#3fb950]/[0.04]" : "border-red-400/30 bg-red-400/[0.04]"} space-y-2`}>
                <div className={`text-[14px] font-light ${result.passed ? "text-[#3fb950]" : "text-red-400"}`}>{result.passed ? "✅ Match" : "❌ No Match"}</div>
                <div className="text-white/25 text-[11px] space-y-1"><div>Similarity: {(result.similarity * 100).toFixed(0)}%</div><div>PES Score: {result.pesScore.toFixed(3)}</div></div>
              </div>
            )}
            {noSensors && <div className="p-3 border border-yellow-400/20 bg-yellow-400/[0.04] text-yellow-400/60 text-[11px] text-center">No physical sensors — using simulated data.</div>}
            <button onClick={() => setIsSimulated(!isSimulated)}
              className={`w-full py-2 border text-[11px] tracking-[0.12em] uppercase transition-all ${isSimulated ? "border-[#90c8ff]/30 text-[#90c8ff]/50 bg-[#90c8ff]/5" : "border-white/5 text-white/15 hover:border-white/15 hover:text-white/30"}`}>
              {isSimulated ? "⚡ Simulation ON" : "💻 Simulate (if no sensors)"}
            </button>
            <div className="space-y-3">
              <button onClick={() => startEnroll()}
                className="w-full py-4 bg-[#90c8ff]/10 border-2 border-[#90c8ff]/40 text-[#90c8ff] text-[14px] tracking-[0.15em] uppercase font-bold hover:bg-[#90c8ff]/20 transition-all">
                {template ? "🔄 Re-Enroll" : "🔒 Enroll New Motion"}
              </button>
              {template && (
                <button onClick={() => startVerify()}
                  className="w-full py-4 bg-[#3fb950]/10 border-2 border-[#3fb950]/40 text-[#3fb950] text-[14px] tracking-[0.15em] uppercase font-bold hover:bg-[#3fb950]/20 transition-all">
                  ✅ Verify
                </button>
              )}
            </div>
          </div>
        )}

        {(phase === "enroll-countdown" || phase === "verify-countdown") && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="text-white/20 text-[12px] tracking-[0.3em] uppercase">{phase === "enroll-countdown" ? "Get Ready to Enroll" : "Get Ready to Verify"}</div>
            <div className="text-[120px] font-light text-[#90c8ff] leading-none" style={{ textShadow: "0 0 60px rgba(144,200,255,0.4)", animation: "countdownPulse 1s ease-in-out infinite" }}>{countdown}</div>
            <div className="text-white/15 text-[11px]">Perform your secret motion</div>
          </div>
        )}

        {phase === "enroll-done" && (
          <div className="text-center space-y-6 py-8">
            <div className="text-5xl">✅</div>
            <h2 className="text-white/80 text-[18px] font-light">Enrollment Complete</h2>
            <div className="text-white/25 text-[12px]">{sampleCount} samples · Template saved</div>
            <button onClick={() => { setResult(null); setPhase("idle"); }}
              className="w-full py-4 bg-[#3fb950]/10 border-2 border-[#3fb950]/40 text-[#3fb950] text-[14px] tracking-[0.15em] uppercase font-bold hover:bg-[#3fb950]/20 transition-all">
              Continue to Verify
            </button>
          </div>
        )}

        {phase === "verify-done" && (
          <div className="text-center space-y-6 py-8">
            <div className="text-5xl">{result?.passed ? "✅" : "❌"}</div>
            <h2 className="text-white/80 text-[18px] font-light">{result?.passed ? "Match Confirmed" : "No Match"}</h2>
            <div className="text-white/25 text-[12px] space-y-1">
              {result && <><div>Similarity: {(result.similarity * 100).toFixed(0)}%</div><div>PES: {result.pesScore.toFixed(3)}</div></>}
            </div>
            <button onClick={() => { setResult(null); setPhase("idle"); }}
              className="w-full py-3 border border-white/10 text-white/25 text-[11px] tracking-[0.2em] uppercase hover:border-white/30 transition-all">
              Done
            </button>
          </div>
        )}

        {(phase === "enrolling" || phase === "verifying") && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] tracking-[0.1em] uppercase">
                <span className={phase === "enrolling" ? "text-[#90c8ff]/50" : "text-[#3fb950]/50"}>{phase === "enrolling" ? "Recording Enrollment" : "Recording Verification"}</span>
                <span className="text-white/20 font-mono">{elapsed.toFixed(1)}s / {duration}s</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-100 ${phase === "enrolling" ? "bg-[#90c8ff]/60" : "bg-[#3fb950]/60"}`} style={{ width: `${(elapsed / duration) * 100}%` }} />
              </div>
              <div className="text-center text-white/15 text-[11px]">{sampleCount} samples</div>
            </div>
            <div className="text-center p-8 border border-dashed border-white/10 text-white/30 text-[14px]">
              {phase === "enrolling" ? "Perform your secret motion now" : "Repeat your enrolled motion exactly"}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
