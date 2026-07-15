"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

const DURATION = 8;

function round(v: number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return Math.round(v * 1000) / 1000;
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export default function PE001PhonePage() {
  const [phase, setPhase] = useState<"idle" | "countdown" | "capturing" | "uploading" | "done">("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [status, setStatus] = useState("");

  const imuRef = useRef<Array<{ t: number; ax: number; ay: number; az: number; rx: number; ry: number; rz: number; interval: number }>>([]);
  const isCapturing = useRef(false);
  const startRef = useRef(0);
  const lastRef = useRef(0);

  const handleIMU = useCallback((e: DeviceMotionEvent) => {
    if (!isCapturing.current) return;
    const now = performance.now();
    const t = now - startRef.current;
    const iv = lastRef.current > 0 ? now - lastRef.current : 0;
    lastRef.current = now;
    imuRef.current.push({
      t: Math.round(t),
      ax: round(e.acceleration?.x ?? e.accelerationIncludingGravity?.x),
      ay: round(e.acceleration?.y ?? e.accelerationIncludingGravity?.y),
      az: round(e.acceleration?.z ?? e.accelerationIncludingGravity?.z),
      rx: round(e.rotationRate?.alpha),
      ry: round(e.rotationRate?.beta),
      rz: round(e.rotationRate?.gamma),
      interval: Math.round(iv * 100) / 100,
    });
    if (imuRef.current.length % 50 === 0) setSampleCount(imuRef.current.length);
  }, []);

  async function record() {
    // iOS motion permission
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const p = await (DeviceMotionEvent as any).requestPermission();
        if (p !== "granted") { setStatus("Motion permission denied"); return; }
      } catch { setStatus("Permission error"); return; }
    }

    window.addEventListener("devicemotion", handleIMU);

    setPhase("countdown");
    for (let i = 3; i >= 1; i--) { setCountdown(i); await sleep(1000); }

    imuRef.current = [];
    setSampleCount(0);
    isCapturing.current = true;
    startRef.current = performance.now();
    lastRef.current = 0;

    setPhase("capturing");
    setElapsed(0);
    const t0 = performance.now();
    await new Promise<void>((resolve) => {
      const t = setInterval(() => {
        const e = (performance.now() - t0) / 1000;
        setElapsed(e);
        if (e >= DURATION) { clearInterval(t); resolve(); }
      }, 200);
    });

    isCapturing.current = false;
    window.removeEventListener("devicemotion", handleIMU);
    setSampleCount(imuRef.current.length);

    // Upload
    setPhase("uploading");
    setStatus("Uploading...");
    try {
      const res = await fetch("/api/pe001/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "latest", imuSamples: imuRef.current }),
      });
      const data = await res.json();
      if (data.ok) { setStatus("✓ Data sent to desktop"); setPhase("done"); }
      else { setStatus("Upload failed. Retry."); setPhase("idle"); }
    } catch {
      setStatus("Network error. Check WiFi."); setPhase("idle");
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/research" className="text-white/30 text-[11px] tracking-[0.2em] uppercase hover:text-white/60">← Research</Link>
        <span className="text-white/15 text-[9px] tracking-[0.3em] uppercase">PE-001 Phone</span>
        <div className="w-16" />
      </header>

      <main className="max-w-sm mx-auto px-4 py-12 space-y-8 text-center">
        <h1 className="text-white/85 text-xl font-light">PE-001 IMU Recorder</h1>

        {status && (
          <div className={`text-[11px] ${status.startsWith("✓") ? "text-[#3fb950]" : status.startsWith("Uploading") ? "text-[#d29922]" : "text-[#f85149]"}`}>{status}</div>
        )}

        {phase === "idle" && (
          <button onClick={record} className="w-full py-6 bg-white/[0.04] border border-white/10 text-white/70 text-[18px] tracking-[0.05em] hover:bg-white/[0.08] transition-all">
            Record IMU
          </button>
        )}

        {phase === "countdown" && (
          <div className="flex flex-col items-center py-16 gap-6">
            <div className="text-white/20 text-[12px] tracking-[0.3em] uppercase">Get Ready</div>
            <div className="text-[100px] font-light text-[#a371f7] leading-none">{countdown}</div>
          </div>
        )}

        {phase === "capturing" && (
          <div className="space-y-6">
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="text-[#a371f7] text-[16px] animate-pulse font-bold tracking-widest">RECORDING</div>
              <div className="text-white/15 text-[11px]">{elapsed.toFixed(1)}s / {DURATION}s · {sampleCount} samples</div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#a371f7]/60 to-[#90c8ff]/60 rounded-full" style={{ width: `${(elapsed / DURATION) * 100}%` }} />
            </div>
            <div className="text-center p-6 border border-dashed border-white/10 text-white/25 text-[14px]">
              Move your phone naturally.
            </div>
          </div>
        )}

        {phase === "uploading" && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="text-[#d29922]/60 text-[14px] animate-pulse">Uploading data...</div>
          </div>
        )}

        {phase === "done" && (
          <div className="space-y-4">
            <div className="text-center p-6 border border-[#3fb950]/20 bg-[#3fb950]/[0.04]">
              <div className="text-[#3fb950] text-[40px]">✓</div>
              <div className="text-white/50 text-[14px] mt-2">{sampleCount} samples sent</div>
              <div className="text-white/25 text-[11px] mt-1">Check desktop for result</div>
            </div>
            <button onClick={() => { setPhase("idle"); setStatus(""); }} className="w-full py-4 border border-white/10 text-white/25 text-[11px] tracking-[0.2em] uppercase hover:border-white/30 transition-all">
              Record Again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
