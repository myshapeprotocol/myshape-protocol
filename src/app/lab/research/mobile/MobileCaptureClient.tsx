"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

interface IMUSample {
  t: number;
  ax: number; ay: number; az: number;
  agx: number; agy: number; agz: number;
  rx: number; ry: number; rz: number;
  interval: number;
}

type CapturePhase = "idle" | "countdown" | "capturing" | "complete";

const ACTIONS = [
  { id: "circle", label: "Circle", desc: "Move phone in a smooth circle", icon: "🔄", duration: 5 },
  { id: "nod", label: "Nod / Tilt", desc: "Tilt phone forward and back", icon: "↕️", duration: 5 },
  { id: "wave", label: "Wave", desc: "Wave phone side to side", icon: "👋", duration: 5 },
];

const TOTAL_DURATION = 15;

export default function MobileCaptureClient() {
  const [phase, setPhase] = useState<CapturePhase>("idle");
  const [permission, setPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [currentAction, setCurrentAction] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [downloaded, setDownloaded] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [noSensors, setNoSensors] = useState(false);

  const samplesRef = useRef<IMUSample[]>([]);
  const startTimeRef = useRef<number>(0);
  const lastEventTimeRef = useRef<number>(0);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRealSensorRef = useRef(false);

  // ── iOS Permission ──

  const requestPermission = useCallback((): Promise<boolean> => {
    const isSecure = typeof window !== "undefined" && (window.isSecureContext || window.location.hostname === "localhost");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DME = (typeof DeviceMotionEvent !== "undefined" ? DeviceMotionEvent : undefined) as any;
    if (DME && typeof DME.requestPermission === "function") {
      if (!isSecure) {
        setPermission("denied");
        return Promise.resolve(false);
      }
      return DME.requestPermission().then(
        (perm: string) => { setPermission(perm === "granted" ? "granted" : "denied"); return perm === "granted"; },
        () => { setPermission("denied"); return false; }
      );
    }
    setPermission("granted");
    return Promise.resolve(true);
  }, []);

  // ── IMU Handler ──

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    hasRealSensorRef.current = true;
    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    const interval = lastEventTimeRef.current > 0 ? now - lastEventTimeRef.current : 0;
    lastEventTimeRef.current = now;
    samplesRef.current.push({
      t: Math.round(elapsed),
      ax: round(event.acceleration?.x), ay: round(event.acceleration?.y), az: round(event.acceleration?.z),
      agx: round(event.accelerationIncludingGravity?.x), agy: round(event.accelerationIncludingGravity?.y), agz: round(event.accelerationIncludingGravity?.z),
      rx: round(event.rotationRate?.alpha), ry: round(event.rotationRate?.beta), rz: round(event.rotationRate?.gamma),
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
        agx: 0, agy: 0, agz: 0,
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

  // ── Capture ──

  const runCapture = useCallback((simulated: boolean) => {
    (async () => {
      try {
        samplesRef.current = [];
        setSampleCount(0);
        setDownloaded(false);
        hasRealSensorRef.current = false;
        setPhase("countdown");
        setCountdown(3);
        for (let i = 2; i >= 0; i--) { await sleep(1000); setCountdown(i); }
        startTimeRef.current = performance.now();
        lastEventTimeRef.current = 0;
        window.addEventListener("devicemotion", handleMotion);
        setPhase("capturing");
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
          setCurrentAction(Math.min(Math.floor(e / 5), 2));
          if (e >= TOTAL_DURATION) {
            clearInterval(timer);
            if ((runCapture as any).__sc) clearTimeout((runCapture as any).__sc);
            window.removeEventListener("devicemotion", handleMotion);
            stopSimulation();
            setPhase("complete");
          }
        }, 100);
      } catch (err) {
        window.removeEventListener("devicemotion", handleMotion);
        stopSimulation();
        setPhase("idle");
      }
    })();
  }, [handleMotion, startSimulation, stopSimulation]);

  // ── Start Capture (public entry) ──

  const startCapture = useCallback(() => {
    if (isSimulated) { runCapture(true); return; }
    requestPermission().then(granted => { if (granted) runCapture(false); });
  }, [isSimulated, requestPermission, runCapture]);

  // ── Cleanup ──

  useEffect(() => {
    return () => { window.removeEventListener("devicemotion", handleMotion); stopSimulation(); };
  }, [handleMotion, stopSimulation]);

  // ── Download ──

  const downloadData = useCallback(() => {
    const data = {
      total_samples: samplesRef.current.length,
      duration_ms: samplesRef.current.length > 0 ? samplesRef.current[samplesRef.current.length - 1].t : 0,
      samples: samplesRef.current,
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
      <header className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/lab/research" className="text-white/30 text-[11px] tracking-[0.2em] uppercase hover:text-white/60 transition-colors">← Research</Link>
        <span className="text-white/15 text-[11px] tracking-[0.3em] uppercase">Mobile IMU Capture</span>
        <div className="w-16" />
      </header>
      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="p-1.5 border border-white/5 text-[11px] font-mono text-white/20">
          phase={phase} | cd={countdown} | sim={String(isSimulated)} | samples={sampleCount}
        </div>

        {phase === "idle" && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="text-5xl">📱</div>
              <h1 className="text-white/80 text-[20px] font-light">Mobile Motion Capture</h1>
              <p className="text-white/30 text-[13px] leading-relaxed max-w-xs mx-auto">
                Records your phone&apos;s accelerometer and gyroscope. No video. Pure sensor data.
              </p>
            </div>
            {ACTIONS.map((action, i) => (
              <div key={action.id} className="flex items-center gap-4 p-3 border border-white/5 bg-white/[0.02]">
                <span className="text-2xl">{action.icon}</span>
                <div><div className="text-white/60 text-[14px]">{action.label} <span className="text-white/15 text-[11px] ml-2">{action.duration}s</span></div>
                <div className="text-white/20 text-[11px]">{action.desc}</div></div>
                <span className="ml-auto text-white/10 text-[11px] font-mono">{i + 1}/{ACTIONS.length}</span>
              </div>
            ))}
            {permission === "denied" && (
              <div className="p-3 border border-yellow-400/20 bg-yellow-400/[0.04] text-yellow-400/60 text-[11px] text-center">
                Real sensors unavailable (HTTPS required on iOS). Use Simulate below.
              </div>
            )}
            {noSensors && (
              <div className="p-3 border border-yellow-400/20 bg-yellow-400/[0.04] text-yellow-400/60 text-[11px] text-center">
                No physical sensors — using simulated data.
              </div>
            )}
            <div className="space-y-2">
              <button onClick={() => { setIsSimulated(!isSimulated); setNoSensors(false); }}
                className={`w-full py-2 border text-[11px] tracking-[0.12em] uppercase transition-all ${isSimulated ? "border-[#90c8ff]/30 text-[#90c8ff]/50 bg-[#90c8ff]/5" : "border-white/5 text-white/15 hover:border-white/15 hover:text-white/30"}`}>
                {isSimulated ? "⚡ Simulation ON" : "💻 Simulate (if no sensors)"}
              </button>
              <button onClick={() => startCapture()}
                className="w-full py-4 bg-[#3fb950]/20 border-2 border-[#3fb950]/50 text-[#3fb950] text-[14px] tracking-[0.15em] uppercase font-bold hover:bg-[#3fb950]/30 transition-all active:scale-[0.98]">
                ▶ Start Capture
              </button>
            </div>
          </div>
        )}

        {phase === "countdown" && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="text-white/20 text-[12px] tracking-[0.3em] uppercase">Get Ready</div>
            <div className="text-[120px] font-light text-[#3fb950] leading-none"
              style={{ textShadow: "0 0 60px rgba(63,185,80,0.4)", animation: "countdownPulse 1s ease-in-out infinite" }}>{countdown}</div>
            <div className="text-white/15 text-[11px]">Hold your phone and prepare to move</div>
          </div>
        )}

        {phase === "capturing" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] tracking-[0.1em] uppercase">
                <span className="text-white/30">{ACTIONS[currentAction]?.icon} {ACTIONS[currentAction]?.label}</span>
                <span className="text-[#3fb950]/50 font-mono">{elapsed.toFixed(1)}s / {TOTAL_DURATION}s</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#3fb950]/60 rounded-full transition-all duration-100" style={{ width: `${(elapsed / TOTAL_DURATION) * 100}%` }} />
              </div>
            </div>
            <div className="text-center text-[#3fb950]/30 text-[11px] font-mono">{sampleCount} samples</div>
            <div className="text-center p-6 border border-dashed border-white/10">
              <div className="text-4xl mb-2">{ACTIONS[currentAction]?.icon}</div>
              <div className="text-white/50 text-[13px]">{ACTIONS[currentAction]?.desc}</div>
            </div>
          </div>
        )}

        {phase === "complete" && (
          <div className="space-y-6">
            <div className="text-center space-y-3 py-8">
              <div className="text-5xl">✅</div>
              <h2 className="text-white/80 text-[18px] font-light">Capture Complete</h2>
              <div className="text-[#3fb950]/40 text-[36px] font-light font-mono">{sampleCount}</div>
              <p className="text-white/25 text-[12px]">IMU samples recorded across {ACTIONS.length} actions</p>
            </div>
            {samplesRef.current.length > 0 && (
              <div className="p-4 border border-white/10 bg-white/[0.02] space-y-2">
                <div className="text-white/30 text-[11px] tracking-[0.2em] uppercase">Session Stats</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="text-white/15">Duration</div><div className="text-white/40 font-mono text-right">{(samplesRef.current[samplesRef.current.length - 1].t / 1000).toFixed(1)}s</div>
                  <div className="text-white/15">Sample Rate</div><div className="text-white/40 font-mono text-right">{Math.round(sampleCount / (samplesRef.current[samplesRef.current.length - 1].t / 1000))} Hz</div>
                  <div className="text-white/15">Avg Interval</div><div className="text-white/40 font-mono text-right">{(samplesRef.current.reduce((s, x) => s + x.interval, 0) / sampleCount).toFixed(1)}ms</div>
                </div>
              </div>
            )}
            <button onClick={() => downloadData()}
              className="w-full py-4 bg-[#3fb950]/15 border-2 border-[#3fb950]/40 text-[#3fb950] text-[14px] tracking-[0.15em] uppercase font-bold hover:bg-[#3fb950]/25 transition-all">
              {downloaded ? "✓ Downloaded" : "💾 Download IMU Data"}
            </button>
            <button onClick={() => { samplesRef.current = []; setPhase("idle"); setSampleCount(0); setElapsed(0); setCurrentAction(0); setDownloaded(false); setNoSensors(false); stopSimulation(); }}
              className="w-full py-3 border border-white/10 text-white/25 text-[11px] tracking-[0.2em] uppercase hover:border-white/30 hover:text-white/50 transition-all">
              ↻ Capture Again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function round(value: number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Math.round(value * 1000) / 1000;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
