"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

// ── Types ──

interface IMUSample {
  /** Elapsed ms from capture start */
  t: number;
  /** Device acceleration (m/s²) — no gravity */
  ax: number;
  ay: number;
  az: number;
  /** Acceleration including gravity (m/s²) */
  agx: number;
  agy: number;
  agz: number;
  /** Rotation rate (deg/s) */
  rx: number;
  ry: number;
  rz: number;
  /** Interval since last event (ms) */
  interval: number;
}

type CapturePhase = "idle" | "countdown" | "capturing" | "complete";

const ACTIONS = [
  { id: "circle", label: "Circle", desc: "Move phone in a smooth circle", icon: "🔄", duration: 5 },
  { id: "nod", label: "Nod / Tilt", desc: "Tilt phone forward and back", icon: "↕️", duration: 5 },
  { id: "wave", label: "Wave", desc: "Wave phone side to side", icon: "👋", duration: 5 },
];

const TOTAL_DURATION = 15; // seconds

// ── Component ──

export default function MobileCaptureClient() {
  const [phase, setPhase] = useState<CapturePhase>("idle");
  const [permission, setPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [currentAction, setCurrentAction] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [downloaded, setDownloaded] = useState(false);

  const samplesRef = useRef<IMUSample[]>([]);
  const startTimeRef = useRef<number>(0);
  const lastEventTimeRef = useRef<number>(0);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  // ── iOS Permission ──

  const requestPermission = useCallback(async () => {
    // iOS 13+ requires explicit permission for DeviceMotionEvent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DME = DeviceMotionEvent as any;
    if (typeof DME !== "undefined" && typeof DME.requestPermission === "function") {
      try {
        const perm = await DME.requestPermission();
        setPermission(perm === "granted" ? "granted" : "denied");
        return perm === "granted";
      } catch {
        setPermission("denied");
        return false;
      }
    }
    // Android / desktop — no permission needed
    setPermission("granted");
    return true;
  }, []);

  // ── IMU Handler ──

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    const interval = lastEventTimeRef.current > 0 ? now - lastEventTimeRef.current : 0;
    lastEventTimeRef.current = now;

    const sample: IMUSample = {
      t: Math.round(elapsed),
      ax: round(event.acceleration?.x),
      ay: round(event.acceleration?.y),
      az: round(event.acceleration?.z),
      agx: round(event.accelerationIncludingGravity?.x),
      agy: round(event.accelerationIncludingGravity?.y),
      agz: round(event.accelerationIncludingGravity?.z),
      rx: round(event.rotationRate?.alpha),
      ry: round(event.rotationRate?.beta),
      rz: round(event.rotationRate?.gamma),
      interval: Math.round(interval * 100) / 100,
    };

    samplesRef.current.push(sample);
    setSampleCount(samplesRef.current.length);
  }, []);

  // ── Start Capture ──

  const startCapture = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) return;

    samplesRef.current = [];
    sessionIdRef.current = crypto.randomUUID();
    setSampleCount(0);
    setDownloaded(false);

    // Countdown
    setPhase("countdown");
    setCountdown(3);
    for (let i = 2; i >= 0; i--) {
      await sleep(1000);
      setCountdown(i);
    }

    // Start
    startTimeRef.current = performance.now();
    lastEventTimeRef.current = 0;
    window.addEventListener("devicemotion", handleMotion);
    setPhase("capturing");
    setElapsed(0);

    // Progress timer
    const start = performance.now();
    const timer = setInterval(() => {
      const e = (performance.now() - start) / 1000;
      setElapsed(e);
      setCurrentAction(Math.min(Math.floor(e / 5), 2));
      if (e >= TOTAL_DURATION) {
        clearInterval(timer);
        window.removeEventListener("devicemotion", handleMotion);
        setPhase("complete");
      }
    }, 100);
  }, [requestPermission, handleMotion]);

  // ── Cleanup ──

  useEffect(() => {
    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [handleMotion]);

  // ── Download ──

  const downloadData = useCallback(() => {
    const data = {
      session_id: sessionIdRef.current,
      subject_id: "mobile-demo",
      captured_at: new Date().toISOString(),
      device_type: "mobile-imu",
      source: "DeviceMotionEvent",
      total_samples: samplesRef.current.length,
      duration_ms: samplesRef.current.length > 0
        ? samplesRef.current[samplesRef.current.length - 1].t
        : 0,
      samples: samplesRef.current,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `myshape-imu-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  }, []);

  // ── Render ──

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#3fb950]/30">
      {/* Header */}
      <header className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/research" className="text-white/30 text-[11px] tracking-[0.2em] uppercase hover:text-white/60 transition-colors">
          ← Research
        </Link>
        <span className="text-white/15 text-[9px] tracking-[0.3em] uppercase">Mobile IMU Capture</span>
        <div className="w-16" />
      </header>

      {/* Main */}
      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* ── IDLE ── */}
        {phase === "idle" && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="text-5xl">📱</div>
              <h1 className="text-white/80 text-[20px] font-light tracking-[0.03em]">
                Mobile Motion Capture
              </h1>
              <p className="text-white/30 text-[13px] leading-relaxed max-w-xs mx-auto">
                Records your phone&apos;s accelerometer and gyroscope during challenge-response actions.
                No video. Pure sensor data.
              </p>
            </div>

            <div className="space-y-3">
              {ACTIONS.map((action, i) => (
                <div
                  key={action.id}
                  className="flex items-center gap-4 p-3 border border-white/5 bg-white/[0.02]"
                >
                  <span className="text-2xl">{action.icon}</span>
                  <div>
                    <div className="text-white/60 text-[14px]">
                      {action.label}
                      <span className="text-white/15 text-[10px] ml-2">
                        {action.duration}s
                      </span>
                    </div>
                    <div className="text-white/20 text-[11px]">{action.desc}</div>
                  </div>
                  <span className="ml-auto text-white/10 text-[11px] font-mono">
                    {i + 1}/{ACTIONS.length}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 border border-[#3fb950]/20 bg-[#3fb950]/[0.03] space-y-2">
              <div className="text-[#3fb950]/50 text-[10px] tracking-[0.15em] uppercase">
                What we record
              </div>
              <div className="text-white/25 text-[11px] leading-relaxed">
                Acceleration (x, y, z) · Gravity vector · Rotation rate (α, β, γ) ·
                Micro-timing between sensor events.{" "}
                <span className="text-white/15">
                  No camera. No video. No face. Just physics.
                </span>
              </div>
            </div>

            {permission === "denied" && (
              <div className="p-3 border border-red-400/20 bg-red-400/[0.04] text-red-400/60 text-[11px] text-center">
                Motion sensors not available. iOS: enable in Settings → Safari → Motion &amp; Orientation Access.
              </div>
            )}

            <button
              onClick={startCapture}
              className="w-full py-4 bg-[#3fb950]/20 border-2 border-[#3fb950]/50 text-[#3fb950] text-[14px] tracking-[0.15em] uppercase font-bold hover:bg-[#3fb950]/30 hover:border-[#3fb950] transition-all active:scale-[0.98]"
            >
              ▶ Start Capture
            </button>
          </div>
        )}

        {/* ── COUNTDOWN ── */}
        {phase === "countdown" && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="text-white/20 text-[12px] tracking-[0.3em] uppercase">Get Ready</div>
            <div
              className="text-[120px] font-light text-[#3fb950] leading-none"
              style={{
                textShadow: "0 0 60px rgba(63,185,80,0.4), 0 0 120px rgba(63,185,80,0.2)",
                animation: "pulseCount 1s ease-in-out infinite",
              }}
            >
              {countdown}
            </div>
            <div className="text-white/15 text-[11px]">Hold your phone and prepare to move</div>
            <style>{`@keyframes pulseCount { 0%,100%{opacity:0.4;transform:scale(0.9)} 50%{opacity:1;transform:scale(1.1)} }`}</style>
          </div>
        )}

        {/* ── CAPTURING ── */}
        {phase === "capturing" && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] tracking-[0.1em] uppercase">
                <span className="text-white/30">
                  {ACTIONS[currentAction]?.icon} {ACTIONS[currentAction]?.label}
                </span>
                <span className="text-[#3fb950]/50 font-mono">
                  {elapsed.toFixed(1)}s / {TOTAL_DURATION}s
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3fb950]/60 rounded-full transition-all duration-100"
                  style={{ width: `${(elapsed / TOTAL_DURATION) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px]">
                {ACTIONS.map((a, i) => (
                  <span
                    key={a.id}
                    className={
                      i < currentAction
                        ? "text-[#3fb950]/30"
                        : i === currentAction
                          ? "text-[#3fb950]"
                          : "text-white/10"
                    }
                  >
                    {a.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Live sensor feed */}
            <div className="p-4 border border-[#3fb950]/10 bg-[#3fb950]/[0.02] space-y-3">
              <div className="text-[#3fb950]/40 text-[9px] tracking-[0.2em] uppercase">
                Live Sensor Feed
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {["ax", "ay", "az"].map((axis) => (
                  <div key={axis} className="space-y-1">
                    <div className="text-white/15 text-[8px] uppercase">{axis}</div>
                    <div className="text-[#3fb950]/50 text-[11px] font-mono">
                      {samplesRef.current.length > 0
                        ? (samplesRef.current[samplesRef.current.length - 1]?.[
                            axis as "ax" | "ay" | "az"
                          ]?.toFixed(2) ?? "—")
                        : "—"}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center text-[#3fb950]/30 text-[11px] font-mono">
                {sampleCount} samples recorded
              </div>
            </div>

            {/* Action guide */}
            <div className="text-center p-6 border border-dashed border-white/10">
              <div className="text-4xl mb-2">{ACTIONS[currentAction]?.icon}</div>
              <div className="text-white/50 text-[13px]">{ACTIONS[currentAction]?.desc}</div>
            </div>
          </div>
        )}

        {/* ── COMPLETE ── */}
        {phase === "complete" && (
          <div className="space-y-6">
            <div className="text-center space-y-3 py-8">
              <div className="text-5xl">✅</div>
              <h2 className="text-white/80 text-[18px] font-light">Capture Complete</h2>
              <div className="text-[#3fb950]/40 text-[36px] font-light font-mono">
                {sampleCount}
              </div>
              <p className="text-white/25 text-[12px]">
                IMU samples recorded across {ACTIONS.length} actions
              </p>
            </div>

            {/* Quick stats */}
            {samplesRef.current.length > 0 && (
              <div className="p-4 border border-white/10 bg-white/[0.02] space-y-2">
                <div className="text-white/30 text-[9px] tracking-[0.2em] uppercase">Session Stats</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="text-white/15">Duration</div>
                  <div className="text-white/40 font-mono text-right">
                    {(samplesRef.current[samplesRef.current.length - 1].t / 1000).toFixed(1)}s
                  </div>
                  <div className="text-white/15">Sample Rate</div>
                  <div className="text-white/40 font-mono text-right">
                    {Math.round(sampleCount / (samplesRef.current[samplesRef.current.length - 1].t / 1000))} Hz
                  </div>
                  <div className="text-white/15">Avg Interval</div>
                  <div className="text-white/40 font-mono text-right">
                    {(samplesRef.current.reduce((s, x) => s + x.interval, 0) / sampleCount).toFixed(1)}ms
                  </div>
                </div>
              </div>
            )}

            {/* Download */}
            <button
              onClick={downloadData}
              className="w-full py-4 bg-[#3fb950]/15 border-2 border-[#3fb950]/40 text-[#3fb950] text-[14px] tracking-[0.15em] uppercase font-bold hover:bg-[#3fb950]/25 hover:border-[#3fb950] transition-all"
            >
              {downloaded ? "✓ Downloaded" : "💾 Download IMU Data"}
            </button>

            {/* Run again */}
            <button
              onClick={() => {
                samplesRef.current = [];
                setPhase("idle");
                setSampleCount(0);
                setElapsed(0);
                setCurrentAction(0);
                setDownloaded(false);
              }}
              className="w-full py-3 border border-white/10 text-white/25 text-[11px] tracking-[0.2em] uppercase hover:border-white/30 hover:text-white/50 transition-all"
            >
              ↻ Capture Again
            </button>

            <div className="text-center text-white/10 text-[10px]">
              Data saved as JSON — compatible with{" "}
              <code className="text-white/15">myshape-cli</code> analysis pipeline.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Helpers ──

function round(value: number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Math.round(value * 1000) / 1000;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
