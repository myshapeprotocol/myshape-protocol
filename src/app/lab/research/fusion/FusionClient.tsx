"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  type ComponentEvidence,
  type EngineEvidence,
  type Verdict,
  computeStatus,
  computeHint,
  hashEvidence,
  defaultPolicy,
} from "@/lib/evidence/types";

// ═══════════════════════════════════════════════════════════════
// EE-001 · Fusion Continuity Verification
// Dual-channel Presence Evidence: IMU PES + Camera PES
// Outputs EngineEvidence — no verdict in the evidence object.
// Verdict is computed by VerificationPolicy for display only.
// ═══════════════════════════════════════════════════════════════

interface IMUSample { t: number; ax: number; ay: number; az: number; rx: number; ry: number; rz: number; interval: number; }
interface PESResult { score: number; microTiming: number; noise: number; entropy: number; }

interface FusionTemplate {
  id: string; enrolledAt: string;
  imu: PESResult; imuRaw: number[];
  camera: PESResult; cameraRaw: number[];
}

type Phase = "idle" | "countdown" | "capturing" | "complete";

// ── Thresholds (empirical v0.1 — recalibrate with per-device enrollment variance) ──

const IMU_PES_THRESHOLD = 0.18;
const CAMERA_PES_THRESHOLD = 0.15;
const IMU_SIMILARITY_THRESHOLD = 0.55;
const CAMERA_SIMILARITY_THRESHOLD = 0.50;

// ── Utilities ──

function movingAvg(s: number[], w: number): number[] { const r: number[] = []; const h = Math.floor(w / 2); for (let i = 0; i < s.length; i++) { let sum = 0, c = 0; for (let j = Math.max(0, i - h); j < Math.min(s.length, i + h + 1); j++) { sum += s[j]; c++; } r.push(c > 0 ? sum / c : s[i]); } return r; }
function specEntropy(s: number[]): number { if (s.length < 16) return 0; const N = s.length; const mags: number[] = []; for (let k = 0; k < Math.floor(N / 2); k++) { let re = 0, im = 0; for (let n = 0; n < N; n++) { const a = (-2 * Math.PI * k * n) / N; re += s[n] * Math.cos(a); im += s[n] * Math.sin(a); } mags.push(Math.sqrt(re * re + im * im) / N); } const total = mags.reduce((a, b) => a + b, 0) || 1; const norm = mags.map((m) => m / total); const e = -norm.reduce((sum, p) => sum + (p > 1e-9 ? p * Math.log2(p) : 0), 0); const maxE = Math.log2(norm.length); return maxE > 0 ? e / maxE : 0; }
function similarity(a: number[], b: number[]): number { if (a.length < 10 || b.length < 10) return 0; const ma = a.reduce((x, y) => x + y, 0) / a.length; const mb = b.reduce((x, y) => x + y, 0) / b.length; const sa = Math.sqrt(a.reduce((s, x) => s + (x - ma) ** 2, 0) / a.length) || 1; const sb = Math.sqrt(b.reduce((s, x) => s + (x - mb) ** 2, 0) / b.length) || 1; const corr = a.slice(0, Math.min(a.length, b.length)).reduce((s, _, i) => s + ((a[i] - ma) / sa) * ((b[i] - mb) / sb), 0) / Math.min(a.length, b.length); return (corr + 1) / 2; }
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function round(v: number | null | undefined): number { if (v === null || v === undefined) return 0; return Math.round(v * 1000) / 1000; }

function computePES(samples: IMUSample[]): { result: PESResult; raw: number[] } {
  const intervals = samples.map((s) => s.interval).filter((i) => i > 0 && i < 200);
  let microTiming = 0; if (intervals.length >= 10) { const m = intervals.reduce((a, b) => a + b, 0) / intervals.length; const v = intervals.reduce((s, x) => s + (x - m) ** 2, 0) / intervals.length; const cv = m > 0 ? Math.sqrt(v) / m : 0; microTiming = 1 - Math.exp(-cv / 0.15); }
  const accMag = samples.map((s) => Math.sqrt(s.ax ** 2 + s.ay ** 2 + s.az ** 2));
  let noise = 0; if (accMag.length >= 16) { const m = accMag.reduce((a, b) => a + b, 0) / accMag.length; const std = Math.sqrt(accMag.reduce((s, x) => s + (x - m) ** 2, 0) / accMag.length); if (std >= 0.01) { const smoothed = movingAvg(accMag, 9); const residuals = accMag.map((x, i) => (x - smoothed[i]) ** 2); const rmse = Math.sqrt(residuals.reduce((a, b) => a + b, 0) / residuals.length); noise = 1 - Math.exp(-(rmse / std) / 0.3); } }
  const entropy = specEntropy(accMag);
  return { result: { score: microTiming * 0.25 + noise * 0.30 + entropy * 0.20 + 0.125, microTiming, noise, entropy }, raw: accMag };
}

export default function FusionClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [mode, setMode] = useState<"enroll" | "verify">("enroll");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [template, setTemplate] = useState<FusionTemplate | null>(null);
  const [evidence, setEvidence] = useState<EngineEvidence | null>(null);
  const [displayVerdict, setDisplayVerdict] = useState<Verdict | null>(null);
  const [enrollmentDone, setEnrollmentDone] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("");
  const [isSimulated, setIsSimulated] = useState(false);
  const [noSensors, setNoSensors] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const samplesRef = useRef<IMUSample[]>([]);
  const cameraSamplesRef = useRef<number[]>([]);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRealSensorRef = useRef(false);
  const startTimeRef = useRef(0);
  const lastEventRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const poseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const DURATION = 8;

  useEffect(() => { return () => { stopAll(); }; }, []);

  function stopAll() {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (simTimerRef.current) { clearInterval(simTimerRef.current); simTimerRef.current = null; }
    if (poseIntervalRef.current) { clearInterval(poseIntervalRef.current); poseIntervalRef.current = null; }
    window.removeEventListener("devicemotion", handleIMU);
  }

  useEffect(() => {
    try {
      const s = localStorage.getItem("myshape-fusion-template");
      if (s) {
        const t = JSON.parse(s);
        if (t && t.imuRaw && t.cameraRaw && Array.isArray(t.imuRaw)) {
          setTemplate(t); setMode("verify");
        } else { localStorage.removeItem("myshape-fusion-template"); }
      }
      localStorage.removeItem("myshape-action-template");
    } catch { /* */ }
  }, []);

  const handleIMU = useCallback((e: DeviceMotionEvent) => {
    hasRealSensorRef.current = true;
    const now = performance.now(); const t = now - startTimeRef.current;
    const iv = lastEventRef.current > 0 ? now - lastEventRef.current : 0; lastEventRef.current = now;
    samplesRef.current.push({ t: Math.round(t), ax: round(e.acceleration?.x), ay: round(e.acceleration?.y), az: round(e.acceleration?.z), rx: round(e.rotationRate?.alpha), ry: round(e.rotationRate?.beta), rz: round(e.rotationRate?.gamma), interval: Math.round(iv * 100) / 100 });
    setSampleCount(samplesRef.current.length);
  }, []);

  const startSim = useCallback(() => {
    if (simTimerRef.current) return; let t = 0; const seed = Math.floor(Math.random() * 3);
    simTimerRef.current = setInterval(() => { samplesRef.current.push({ t, ax: Math.sin(t * 0.02 + seed) * 2.5 + (Math.random() - 0.5) * 0.8, ay: Math.cos(t * 0.025 + seed) * 1.8 + (Math.random() - 0.5) * 0.6, az: 9.8 + Math.sin(t * 0.015) * 0.3, rx: Math.cos(t * 0.02) * 30 + (Math.random() - 0.5) * 6, ry: Math.sin(t * 0.022) * 25 + (Math.random() - 0.5) * 5, rz: Math.sin(t * 0.018) * 15 + (Math.random() - 0.5) * 4, interval: 16 + (Math.random() - 0.5) * 6 }); setSampleCount(samplesRef.current.length); t += 16; }, 16);
  }, []);

  const stopSim = useCallback(() => { if (simTimerRef.current) { clearInterval(simTimerRef.current); simTimerRef.current = null; } }, []);

  async function startCamera() {
    try {
      setCameraStatus("Starting...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, frameRate: 15 } });
      if (!videoRef.current) return; streamRef.current = stream; videoRef.current.srcObject = stream; await videoRef.current.play();
      if (!(window as any).Pose) { setCameraStatus("Loading MediaPipe..."); await new Promise<void>((r) => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js"; s.crossOrigin = "anonymous"; s.onload = () => r(); s.onerror = () => r(); document.head.appendChild(s); }); }
      if (!(window as any).Pose) { setCameraStatus("MediaPipe unavailable"); return; }
      const MP_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404";
      const pose = new (window as any).Pose({ locateFile: (f: string) => { const url = `${MP_BASE}/${f}`; if (!f || f.includes("undefined")) throw new Error(`Invalid MediaPipe file: ${f}`); return url; } });
      pose.setOptions({ modelComplexity: 0, smoothLandmarks: false, enableSegmentation: false });
      pose.onResults((results: any) => { if (results.poseLandmarks) { const lw = results.poseLandmarks[15]; if (lw) { cameraSamplesRef.current.push(lw.x * 100 + lw.y * 100 + lw.z * 100); if (cameraSamplesRef.current.length > 500) cameraSamplesRef.current.shift(); } } });
      poseIntervalRef.current = setInterval(async () => { if (videoRef.current) { try { await pose.send({ image: videoRef.current }); } catch { /* */ } } }, 100);
      setCameraStatus("Active");
    } catch { setCameraStatus("Unavailable"); }
  }

  function stopCamera() { if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; } if (poseIntervalRef.current) { clearInterval(poseIntervalRef.current); poseIntervalRef.current = null; } if (videoRef.current) videoRef.current.srcObject = null; setCameraStatus(""); }

  function cameraPES(): { result: PESResult; raw: number[] } { const s = cameraSamplesRef.current; if (s.length < 20) return { result: { score: 0, microTiming: 0, noise: 0, entropy: 0 }, raw: s }; const entropy = specEntropy(s); const m = s.reduce((a, b) => a + b, 0) / s.length; const std = Math.sqrt(s.reduce((sum, x) => sum + (x - m) ** 2, 0) / s.length); const noise = std > 1 ? 1 - Math.exp(-std / 15) : 0.1; const score = Math.min(1, entropy * 0.4 + noise * 0.35 + 0.125); return { result: { score, microTiming: 0, noise, entropy }, raw: s }; }

  // ── Evidence Builder (engine-agnostic ComponentEvidence[]) ──

  function buildEvidence(
    currentMode: "enroll" | "verify",
    imu: { result: PESResult; raw: number[] },
    cam: { result: PESResult; raw: number[] },
    tpl: FusionTemplate | null,
  ): EngineEvidence {
    const components: ComponentEvidence[] = [];
    const diagnostics: string[] = [];

    // ── IMU PES ──
    const imuStatus = imu.result.score === 0 ? "INSUFFICIENT" as const : computeStatus(imu.result.score, IMU_PES_THRESHOLD);
    components.push({
      engine: "EE-001", metric: "IMU_PES", value: imu.result.score, threshold: IMU_PES_THRESHOLD, status: imuStatus,
      explanation: `μT:${imu.result.microTiming.toFixed(3)} noise:${imu.result.noise.toFixed(3)} ent:${imu.result.entropy.toFixed(3)}`,
      hint: computeHint("IMU_PES", imuStatus),
    });
    if (imuStatus === "PASS") diagnostics.push("✓ IMU PES — credible biological motion detected");
    else if (imuStatus === "INSUFFICIENT") diagnostics.push("✗ IMU PES — insufficient sensor data");
    else diagnostics.push(`✗ IMU PES (${imu.result.score.toFixed(3)} < ${IMU_PES_THRESHOLD}) — motion lacks biological entropy signature`);

    // ── Camera PES ──
    const camStatus = cam.raw.length < 20 ? "INSUFFICIENT" as const : computeStatus(cam.result.score, CAMERA_PES_THRESHOLD);
    components.push({
      engine: "EE-001", metric: "Camera_PES", value: cam.result.score, threshold: CAMERA_PES_THRESHOLD, status: camStatus,
      explanation: `noise:${cam.result.noise.toFixed(3)} ent:${cam.result.entropy.toFixed(3)} frames:${cam.raw.length}`,
      hint: computeHint("Camera_PES", camStatus),
    });
    if (camStatus === "PASS") diagnostics.push("✓ Camera PES — credible visual motion entropy");
    else if (camStatus === "INSUFFICIENT") diagnostics.push("✗ Camera PES — insufficient landmark data (<20 frames)");
    else diagnostics.push(`✗ Camera PES (${cam.result.score.toFixed(3)} < ${CAMERA_PES_THRESHOLD}) — visual motion lacks complexity`);

    // ── Cross-modal similarity (verify mode only) ──
    if (currentMode === "verify" && tpl) {
      const is = similarity(imu.raw, tpl.imuRaw);
      const cs = similarity(cam.raw, tpl.cameraRaw);

      const imuSimStatus = computeStatus(is, IMU_SIMILARITY_THRESHOLD);
      components.push({
        engine: "EE-001", metric: "IMU_Similarity", value: is, threshold: IMU_SIMILARITY_THRESHOLD, status: imuSimStatus,
        explanation: `correlation: ${(is * 100).toFixed(0)}% vs template`,
        hint: computeHint("IMU_Similarity", imuSimStatus),
      });
      if (imuSimStatus === "PASS") diagnostics.push(`✓ IMU Similarity (${(is * 100).toFixed(0)}%) — waveform matches template`);
      else diagnostics.push(`✗ IMU Similarity (${(is * 100).toFixed(0)}% < ${(IMU_SIMILARITY_THRESHOLD * 100).toFixed(0)}%) — differs from template`);

      const camSimStatus = cam.raw.length < 20 ? "INSUFFICIENT" as const : computeStatus(cs, CAMERA_SIMILARITY_THRESHOLD);
      components.push({
        engine: "EE-001", metric: "Camera_Similarity", value: cs, threshold: CAMERA_SIMILARITY_THRESHOLD, status: camSimStatus,
        explanation: cam.raw.length < 20 ? "insufficient data — cannot compare" : `correlation: ${(cs * 100).toFixed(0)}% vs template`,
        hint: computeHint("Camera_Similarity", camSimStatus),
      });
      if (camSimStatus === "PASS") diagnostics.push("✓ Camera Similarity — visual motion matches template");
      else if (camSimStatus === "INSUFFICIENT") diagnostics.push("— Camera Similarity: insufficient data to compare");
      else diagnostics.push(`✗ Camera Similarity (${(cs * 100).toFixed(0)}% < ${(CAMERA_SIMILARITY_THRESHOLD * 100).toFixed(0)}%) — differs from template`);
    }

    return {
      engineId: "EE-001",
      timestamp: new Date().toISOString(),
      components,
      diagnostics,
    };
  }

  // ── Main Action ──

  const modeRef = useRef(mode);
  const templateRef = useRef(template);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { templateRef.current = template; }, [template]);

  const run = useCallback(async () => {
    setPhase("countdown"); setCountdown(3); for (let i = 2; i >= 0; i--) { await sleep(1000); setCountdown(i); }
    samplesRef.current = []; cameraSamplesRef.current = []; setSampleCount(0); hasRealSensorRef.current = false;
    await startCamera();
    window.addEventListener("devicemotion", handleIMU);
    startTimeRef.current = performance.now(); lastEventRef.current = 0;
    if (isSimulated) { setNoSensors(true); startSim(); } else { setTimeout(() => { if (!hasRealSensorRef.current && !simTimerRef.current) { setNoSensors(true); setIsSimulated(true); startSim(); } }, 1500); }
    setPhase("capturing"); setElapsed(0);
    const start = performance.now();
    const timer = setInterval(() => { const e = (performance.now() - start) / 1000; setElapsed(e); if (e >= DURATION) { clearInterval(timer); finish(); } }, 100);

    function finish() {
      window.removeEventListener("devicemotion", handleIMU); stopSim(); stopCamera();
      const imu = computePES(samplesRef.current); const cam = cameraPES();
      const currentMode = modeRef.current;
      const tpl = templateRef.current;

      const ev = buildEvidence(currentMode, imu, cam, tpl);

      // Enrollment: save template if presence evidence passes
      if (currentMode === "enroll") {
        const imuPES = ev.components.find((c) => c.metric === "IMU_PES");
        if (imuPES?.status === "PASS") {
          const newTpl: FusionTemplate = { id: crypto.randomUUID?.() ?? String(Date.now()), enrolledAt: new Date().toISOString(), imu: imu.result, imuRaw: imu.raw, camera: cam.result, cameraRaw: cam.raw };
          setTemplate(newTpl);
          try { localStorage.setItem("myshape-fusion-template", JSON.stringify(newTpl)); } catch { /* */ }
          setMode("verify"); setEnrollmentDone(true);
        }
      }

      setEvidence(ev);
      // Compute tamper-evident hash (async)
      hashEvidence(ev).then((d) => { if (d) setEvidence((prev) => prev ? { ...prev, evidenceDigest: d } : prev); });
      // Policy evaluates evidence → verdict (display only, not stored in evidence)
      setDisplayVerdict(defaultPolicy([ev]));
      setPhase("complete");
    }
  }, [isSimulated, handleIMU, startSim, stopSim]);

  // ── Render helpers ──

  function statusColor(s: string): string {
    if (s === "PASS") return "#3fb950";
    if (s === "FAIL") return "#f85149";
    return "#d29922";
  }

  function statusIcon(s: string): string {
    if (s === "PASS") return "✓";
    if (s === "FAIL") return "✗";
    return "—";
  }

  // ── Render ──

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/lab/research" className="text-white/30 text-[11px] tracking-[0.2em] uppercase hover:text-white/60">← Research</Link>
        <span className="text-white/15 text-[11px] tracking-[0.3em] uppercase">EE-001</span>
        <div className="w-16" />
      </header>
      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="text-5xl">🔬</div>
          <h1 className="text-white/80 text-[22px] font-light">Fusion Continuity Verification</h1>
          <p className="text-white/30 text-[13px] leading-relaxed max-w-sm mx-auto">
            {template ? "Template enrolled. Verify your continuity." : "First time? Enroll your motion signature."}
          </p>
        </div>

        <video ref={videoRef} className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none" playsInline muted />
        <div className="p-2 border border-white/5 text-[11px] font-mono text-white/20 flex justify-between">
          <span>IMU: {sampleCount} | Cam: {cameraStatus || "off"} | {isSimulated ? "SIM" : "LIVE"}</span>
          <span>{template ? "✓ Enrolled" : "○ No template"}</span>
        </div>

        {phase === "idle" && (
          <div className="space-y-4">
            {noSensors && <div className="p-3 border border-yellow-400/20 bg-yellow-400/[0.04] text-yellow-400/60 text-[11px] text-center">No sensors — simulation active. Use HTTPS for real test.</div>}
            <button onClick={() => setIsSimulated(!isSimulated)}
              className={`w-full py-2 border text-[11px] tracking-[0.12em] uppercase ${isSimulated ? "border-[#90c8ff]/30 text-[#90c8ff]/50 bg-[#90c8ff]/5" : "border-white/5 text-white/15 hover:border-white/15 hover:text-white/30"}`}>
              {isSimulated ? "⚡ Simulate" : "💻 Simulate (if no sensors)"}
            </button>
            <button onClick={() => { setMode(template ? "verify" : "enroll"); run(); }}
              className="w-full py-5 bg-gradient-to-r from-[#3fb950]/20 to-[#90c8ff]/20 border-2 border-[#3fb950]/40 text-[#3fb950] text-[16px] tracking-[0.15em] uppercase font-bold hover:border-[#3fb950] transition-all active:scale-[0.98]">
              {template ? "✅ Verify Continuity" : "🔒 Enroll Continuity"}
            </button>
            {template && (
              <button onClick={() => { setTemplate(null); localStorage.removeItem("myshape-fusion-template"); setMode("enroll"); }}
                className="w-full py-2 border border-white/5 text-white/15 text-[11px] tracking-[0.15em] uppercase hover:border-white/15">
                Reset (Re-Enroll)
              </button>
            )}
          </div>
        )}

        {phase === "countdown" && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="text-white/20 text-[12px] uppercase">{mode === "enroll" ? "Recording Your Signature" : "Verifying Continuity"}</div>
            <div className="text-[120px] font-light text-[#3fb950] leading-none" style={{ textShadow: "0 0 60px rgba(63,185,80,0.4)", animation: "countdownPulse 1s ease-in-out infinite" }}>{countdown}</div>
          </div>
        )}

        {phase === "capturing" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] uppercase"><span className="text-[#3fb950]/50">{mode === "enroll" ? "Enrolling" : "Verifying"}</span><span className="text-[#3fb950]/50 font-mono">{elapsed.toFixed(1)}s / {DURATION}s</span></div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#3fb950]/60 to-[#90c8ff]/60 rounded-full transition-all duration-100" style={{ width: `${(elapsed / DURATION) * 100}%` }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 border border-[#3fb950]/10 bg-[#3fb950]/[0.02]"><div className="text-[#3fb950]/40 text-[11px] uppercase mb-1">IMU</div><div className="text-white/50 font-mono">{sampleCount} samples</div></div>
              <div className="p-3 border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02]"><div className="text-[#90c8ff]/40 text-[11px] uppercase mb-1">Camera</div><div className="text-white/50 font-mono">{cameraSamplesRef.current.length} frames</div></div>
            </div>
            <div className="text-center p-8 border border-dashed border-white/10 text-white/30 text-[14px]">Move naturally — any motion works.</div>
          </div>
        )}

        {/* ── Results ── */}
        {phase === "complete" && evidence && displayVerdict && (
          <div className="space-y-6">
            {/* Verdict card — computed by Policy, not stored in Evidence */}
            {enrollmentDone ? (
              <div className="text-center p-6 border-2 border-[#90c8ff]/40 bg-[#90c8ff]/[0.04] space-y-4">
                <div className="text-6xl">🔒</div>
                <h2 className="text-[22px] font-light text-[#90c8ff]">Continuity Enrolled</h2>
                <p className="text-white/25 text-[12px]">Your dual-channel signature saved. Now verify to confirm it works.</p>
              </div>
            ) : displayVerdict === "PASS" ? (
              <div className="text-center p-6 border-2 border-[#3fb950]/40 bg-[#3fb950]/[0.04] space-y-4">
                <div className="text-6xl">✅</div>
                <h2 className="text-[22px] font-light text-[#3fb950]">Continuity Verified</h2>
                <p className="text-white/25 text-[12px]">All evidence components pass. Policy: {displayVerdict}.</p>
              </div>
            ) : (
              <div className="text-center p-6 border-2 border-red-400/40 bg-red-400/[0.04] space-y-4">
                <div className="text-6xl">{displayVerdict === "INSUFFICIENT_EVIDENCE" ? "⚠️" : "❌"}</div>
                <h2 className="text-[22px] font-light text-red-400">
                  {displayVerdict === "INSUFFICIENT_EVIDENCE" ? "Insufficient Evidence" : "Verification Failed"}
                </h2>
                <p className="text-white/25 text-[12px]">
                  {displayVerdict === "INSUFFICIENT_EVIDENCE"
                    ? "Not enough data to make a determination."
                    : "One or more evidence components did not meet threshold."}
                </p>
              </div>
            )}

            {/* ── Evidence Components (engine-agnostic table) ── */}
            <div className="p-4 border border-white/10 bg-white/[0.02] space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase text-white/20">Evidence Components</div>
                <span className="text-[11px] text-white/10 font-mono">{evidence.engineId}</span>
              </div>
              {evidence.components.map((comp) => (
                <div key={comp.metric} className="flex items-center justify-between p-2 border border-white/5">
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-white/50">{comp.metric}</div>
                    <div className="text-[11px] text-white/20">
                      {comp.value.toFixed(3)} vs {comp.threshold} — {comp.explanation}
                    </div>
                  </div>
                  <span style={{ color: statusColor(comp.status), fontSize: "13px" }}>
                    {statusIcon(comp.status)}
                  </span>
                </div>
              ))}
            </div>

            {/* ── Diagnostic Log ── */}
            <div className="p-4 border border-white/10 bg-white/[0.02] space-y-2">
              <div className="text-[11px] uppercase text-white/20">Diagnostic Log</div>
              <div className="space-y-1">
                {evidence.diagnostics.map((d, i) => (
                  <div key={i} className={`text-[11px] font-mono leading-relaxed ${
                    d.startsWith("✓") ? "text-[#3fb950]/70" : d.startsWith("✗") ? "text-[#f85149]/70" : d.startsWith("⚠") ? "text-[#d29922]/70" : "text-white/25"
                  }`}>{d}</div>
                ))}
              </div>
            </div>

            {/* Policy note */}
            <div className="p-3 border border-white/5 bg-white/[0.01] text-[11px] font-mono text-white/15 space-y-1">
              <div className="text-white/20 text-[11px] uppercase mb-1">Policy · defaultPolicy v0.1</div>
              <div>All components must PASS. INSUFFICIENT in any → INSUFFICIENT_EVIDENCE.</div>
              <div>Verdict: <span style={{ color: statusColor(displayVerdict) }}>{displayVerdict}</span> (computed by VerificationPolicy — not stored in Evidence)</div>
            </div>

            <button onClick={() => { setPhase("idle"); setEvidence(null); setDisplayVerdict(null); setEnrollmentDone(false); }}
              className="w-full py-4 border border-white/10 text-white/25 text-[11px] tracking-[0.2em] uppercase hover:border-white/30 transition-all">
              {enrollmentDone ? "Continue → Verify" : template ? "↻ Verify Again" : "↻ Enroll Again"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
