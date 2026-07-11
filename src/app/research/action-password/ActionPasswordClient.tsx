"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

// ── Types ──

interface IMUSample {
  t: number;
  ax: number; ay: number; az: number;
  rx: number; ry: number; rz: number;
  interval: number;
}

interface PESLikeFeatures {
  microTimingVariance: number;
  noiseResidual: number;
  frequencyEntropy: number;
  biologicalPerturbation: number;
  pesScore: number;
}

interface StoredTemplate {
  id: string;
  enrolledAt: string;
  features: PESLikeFeatures;
  label: string;
}

type Phase = "idle" | "enroll-countdown" | "enrolling" | "verify-countdown" | "verifying" | "result";

// ── In-browser feature computation (no CLI dependency) ──

function movingAverage(signal: number[], w: number): number[] {
  const r: number[] = [];
  const half = Math.floor(w / 2);
  for (let i = 0; i < signal.length; i++) {
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - half); j < Math.min(signal.length, i + half + 1); j++) { sum += signal[j]; count++; }
    r.push(count > 0 ? sum / count : signal[i]);
  }
  return r;
}

function spectralEntropy(signal: number[]): number {
  if (signal.length < 16) return 0;
  const N = signal.length;
  const mags: number[] = [];
  for (let k = 0; k < Math.floor(N / 2); k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const a = (-2 * Math.PI * k * n) / N;
      re += signal[n] * Math.cos(a);
      im += signal[n] * Math.sin(a);
    }
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
      const smoothed = movingAverage(accMag, 9);
      const residuals = accMag.map((m, i) => (m - smoothed[i]) ** 2);
      const rmse = Math.sqrt(residuals.reduce((a, b) => a + b, 0) / residuals.length);
      noiseResidual = 1 - Math.exp(-(rmse / std) / 0.3);
    }
  }

  const frequencyEntropy = spectralEntropy(accMag);
  const biologicalPerturbation = 0; // not computed in browser

  const pesScore = microTimingVariance * 0.25 + noiseResidual * 0.30 + frequencyEntropy * 0.20 + 0.25 * 0.5;

  return { microTimingVariance, noiseResidual, frequencyEntropy, biologicalPerturbation, pesScore };
}

function similarity(a: PESLikeFeatures, b: PESLikeFeatures): number {
  const dTiming = (a.microTimingVariance - b.microTimingVariance) / 0.3;
  const dNoise = (a.noiseResidual - b.noiseResidual) / 0.4;
  const dFreq = (a.frequencyEntropy - b.frequencyEntropy) / 0.3;
  return Math.exp(-Math.sqrt(dTiming ** 2 + dNoise ** 2 + dFreq ** 2));
}

// ── Component ──

export default function ActionPasswordClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [template, setTemplate] = useState<StoredTemplate | null>(null);
  const [result, setResult] = useState<{
    passed: boolean;
    similarity: number;
    pesScore: number;
  } | null>(null);

  const samplesRef = useRef<IMUSample[]>([]);
  const startTimeRef = useRef(0);
  const lastEventRef = useRef(0);
  const duration = 5; // seconds

  // ── iOS permission ──

  const requestIMU = useCallback(async () => {
    if (typeof DeviceMotionEvent !== "undefined" &&
      typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === "function") {
      try {
        const p = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        return p === "granted";
      } catch { return false; }
    }
    return true;
  }, []);

  // ── IMU handler ──

  const handleMotion = useCallback((e: DeviceMotionEvent) => {
    const now = performance.now();
    const t = now - startTimeRef.current;
    const interval = lastEventRef.current > 0 ? now - lastEventRef.current : 0;
    lastEventRef.current = now;
    samplesRef.current.push({
      t: Math.round(t),
      ax: Math.round((e.acceleration?.x ?? 0) * 1000) / 1000,
      ay: Math.round((e.acceleration?.y ?? 0) * 1000) / 1000,
      az: Math.round((e.acceleration?.z ?? 0) * 1000) / 1000,
      rx: Math.round((e.rotationRate?.alpha ?? 0) * 1000) / 1000,
      ry: Math.round((e.rotationRate?.beta ?? 0) * 1000) / 1000,
      rz: Math.round((e.rotationRate?.gamma ?? 0) * 1000) / 1000,
      interval: Math.round(interval * 100) / 100,
    });
  }, []);

  // ── Start enrollment ──

  const startEnroll = useCallback(async () => {
    const ok = await requestIMU();
    if (!ok) return;
    samplesRef.current = [];
    setPhase("enroll-countdown");
    setCountdown(3);
    for (let i = 2; i >= 0; i--) { await sleep(1000); setCountdown(i); }
    startTimeRef.current = performance.now();
    lastEventRef.current = 0;
    window.addEventListener("devicemotion", handleMotion);
    setPhase("enrolling");
    setElapsed(0);
    const start = performance.now();
    const timer = setInterval(() => {
      const e = (performance.now() - start) / 1000;
      setElapsed(e);
      if (e >= duration) {
        clearInterval(timer);
        window.removeEventListener("devicemotion", handleMotion);
        const features = computeFeatures(samplesRef.current);
        const tpl: StoredTemplate = {
          id: crypto.randomUUID(),
          enrolledAt: new Date().toISOString(),
          features,
          label: "My Secret Motion",
        };
        setTemplate(tpl);
        localStorage.setItem("myshape-action-template", JSON.stringify(tpl));
        setPhase("idle");
      }
    }, 100);
  }, [requestIMU, handleMotion]);

  // ── Start verification ──

  const startVerify = useCallback(async () => {
    if (!template) return;
    const ok = await requestIMU();
    if (!ok) return;
    samplesRef.current = [];
    setPhase("verify-countdown");
    setCountdown(3);
    for (let i = 2; i >= 0; i--) { await sleep(1000); setCountdown(i); }
    startTimeRef.current = performance.now();
    lastEventRef.current = 0;
    window.addEventListener("devicemotion", handleMotion);
    setPhase("verifying");
    setElapsed(0);
    const start = performance.now();
    const timer = setInterval(() => {
      const e = (performance.now() - start) / 1000;
      setElapsed(e);
      if (e >= duration) {
        clearInterval(timer);
        window.removeEventListener("devicemotion", handleMotion);
        const features = computeFeatures(samplesRef.current);
        const sim = similarity(template.features, features);
        const pesOk = features.pesScore >= 0.20;
        const simOk = sim >= 0.55;
        setResult({
          passed: pesOk && simOk,
          similarity: sim,
          pesScore: features.pesScore,
        });
        setPhase("result");
      }
    }, 100);
  }, [template, requestIMU, handleMotion]);

  // ── Load saved template ──

  useEffect(() => {
    try {
      const saved = localStorage.getItem("myshape-action-template");
      if (saved) setTemplate(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // ── Cleanup ──

  useEffect(() => { return () => { window.removeEventListener("devicemotion", handleMotion); }; }, [handleMotion]);

  // ── Render ──

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/research" className="text-white/30 text-[11px] tracking-[0.2em] uppercase hover:text-white/60">← Research</Link>
        <span className="text-white/15 text-[9px] tracking-[0.3em] uppercase">Action Password</span>
        <div className="w-16" />
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* ── IDLE ── */}
        {(phase === "idle" || phase === "result") && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="text-5xl">🔐</div>
              <h1 className="text-white/80 text-[20px] font-light">Action Password</h1>
              <p className="text-white/30 text-[13px] leading-relaxed max-w-xs mx-auto">
                {template
                  ? "Template enrolled. Verify with the same motion."
                  : "Set a secret motion only you can perform."}
              </p>
            </div>

            {template && (
              <div className="p-4 border border-[#3fb950]/10 bg-[#3fb950]/[0.02] space-y-2">
                <div className="text-[#3fb950]/40 text-[9px] tracking-[0.2em] uppercase">Template Active</div>
                <div className="text-white/25 text-[11px]">
                  Enrolled {new Date(template.enrolledAt).toLocaleDateString()} · PES {template.features.pesScore.toFixed(3)}
                </div>
              </div>
            )}

            {result && (
              <div className={`p-4 border ${result.passed ? "border-[#3fb950]/30 bg-[#3fb950]/[0.04]" : "border-red-400/30 bg-red-400/[0.04]"} space-y-2`}>
                <div className={`text-[14px] font-light ${result.passed ? "text-[#3fb950]" : "text-red-400"}`}>
                  {result.passed ? "✅ Match" : "❌ No Match"}
                </div>
                <div className="text-white/25 text-[11px] space-y-1">
                  <div>Similarity: {(result.similarity * 100).toFixed(0)}%</div>
                  <div>PES Score: {result.pesScore.toFixed(3)}</div>
                  {!result.passed && <div className="text-red-400/50 text-[10px]">Motion doesn&apos;t match or not a live human</div>}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button onClick={startEnroll}
                className="w-full py-4 bg-[#90c8ff]/10 border-2 border-[#90c8ff]/40 text-[#90c8ff] text-[14px] tracking-[0.15em] uppercase font-bold hover:bg-[#90c8ff]/20 transition-all">
                {template ? "🔄 Re-Enroll" : "🔒 Enroll New Motion"}
              </button>
              {template && (
                <button onClick={startVerify}
                  className="w-full py-4 bg-[#3fb950]/10 border-2 border-[#3fb950]/40 text-[#3fb950] text-[14px] tracking-[0.15em] uppercase font-bold hover:bg-[#3fb950]/20 transition-all">
                  ✅ Verify
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── COUNTDOWN ── */}
        {(phase === "enroll-countdown" || phase === "verify-countdown") && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="text-white/20 text-[12px] tracking-[0.3em] uppercase">
              {phase === "enroll-countdown" ? "Get Ready to Enroll" : "Get Ready to Verify"}
            </div>
            <div className="text-[120px] font-light text-[#90c8ff] leading-none" style={{ textShadow: "0 0 60px rgba(144,200,255,0.4)", animation: "pulse 1s ease-in-out infinite" }}>
              {countdown}
            </div>
            <div className="text-white/15 text-[11px]">Perform your secret motion</div>
            <style>{`@keyframes pulse{0%,100%{opacity:0.4;transform:scale(0.9)}50%{opacity:1;transform:scale(1.1)}}`}</style>
          </div>
        )}

        {/* ── CAPTURING ── */}
        {(phase === "enrolling" || phase === "verifying") && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] tracking-[0.1em] uppercase">
                <span className={phase === "enrolling" ? "text-[#90c8ff]/50" : "text-[#3fb950]/50"}>
                  {phase === "enrolling" ? "Recording Enrollment" : "Recording Verification"}
                </span>
                <span className="text-white/20 font-mono">{elapsed.toFixed(1)}s / {duration}s</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-100 ${phase === "enrolling" ? "bg-[#90c8ff]/60" : "bg-[#3fb950]/60"}`}
                  style={{ width: `${(elapsed / duration) * 100}%` }} />
              </div>
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

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
