"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useDebug } from "@/hooks/useDebug";
import ResearchStatus from "@/components/ResearchStatus";
import ExperimentExport from "@/components/experiment/ExperimentExport";
import { saveRun } from "@/lib/experiment-logger";
import {
  type ComponentEvidence,
  type EngineEvidence,
  type Verdict,
  computeStatus,
  computeHint,
  hashEvidence,
  evaluatePolicy,
} from "@/lib/evidence/types";
import {
  type IMUSample,
  type CameraSample,
  type JerkEvent,
  type DirChangeEvent,
  type MatchedEvent,
  median,
  detectJerkPeaks,
  detectDirectionChanges,
  matchEvents,
  buildEvidence,
  DIRECTION_TOLERANCE_DEG,
  MATCH_WINDOW_MS,
  JERK_MIN_THRESHOLD,
  DIR_CHANGE_MIN_ANGLE_DEG,
  MIN_SPEED,
  CAMERA_PIPELINE_LATENCY_MS,
  TEMPORAL_ALIGNMENT_THRESHOLD,
  DIRECTION_AGREEMENT_THRESHOLD,
  EVENT_DENSITY_THRESHOLD,
  CAUSAL_EVIDENCE_THRESHOLD,
} from "@/lib/evidence/causal-coupling";

// ═══════════════════════════════════════════════════════════════
// EE-002 · Event-Level Causal Coupling
// Evidence Engine that derives causal evidence from the temporal
// consistency of independent physical observations.
// Outputs EngineEvidence — unified shape with EE-001.
// ═══════════════════════════════════════════════════════════════

// v0.2 parameters imported from @/lib/evidence/causal-coupling

type Phase = "idle" | "countdown" | "capturing" | "complete";

// ── Utilities ──
function round(v: number | null | undefined): number { if (v === null || v === undefined) return 0; return Math.round(v * 1000) / 1000; }
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── Component ──

export default function CausalCouplingClient() {
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [imuCount, setImuCount] = useState(0);
  const [camCount, setCamCount] = useState(0);
  const [cameraStatus, setCameraStatus] = useState("");
  const [isSimulated, setIsSimulated] = useState(false);
  const [noSensors, setNoSensors] = useState(false);
  const [evidence, setEvidence] = useState<EngineEvidence | null>(null);
  const [displayVerdict, setDisplayVerdict] = useState<Verdict | null>(null);
  // Internal data for timeline rendering
  const [internalData, setInternalData] = useState<{
    matches: MatchedEvent[]; unmatchedIMU: JerkEvent[]; unmatchedCam: DirChangeEvent[];
  } | null>(null);

  const [copyStatus, setCopyStatus] = useState("");
  const debug = useDebug();

  const videoRef = useRef<HTMLVideoElement>(null);
  const imuSamplesRef = useRef<IMUSample[]>([]);
  const camSamplesRef = useRef<CameraSample[]>([]);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRealSensorRef = useRef(false);
  const startTimeRef = useRef(0);
  const lastIMUEventRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const poseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const DURATION = 8;

  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => { return () => { stopAll(); }; }, []);

  function stopAll() {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (simTimerRef.current) { clearInterval(simTimerRef.current); simTimerRef.current = null; }
    if (poseIntervalRef.current) { clearInterval(poseIntervalRef.current); poseIntervalRef.current = null; }
    window.removeEventListener("devicemotion", handleIMU);
  }

  const handleIMU = useCallback((e: DeviceMotionEvent) => {
    hasRealSensorRef.current = true;
    const now = performance.now(); const t = now - startTimeRef.current;
    const iv = lastIMUEventRef.current > 0 ? now - lastIMUEventRef.current : 0; lastIMUEventRef.current = now;
    imuSamplesRef.current.push({ t: Math.round(t), ax: round(e.acceleration?.x), ay: round(e.acceleration?.y), az: round(e.acceleration?.z), rx: round(e.rotationRate?.alpha), ry: round(e.rotationRate?.beta), rz: round(e.rotationRate?.gamma), interval: Math.round(iv * 100) / 100 });
    setImuCount(imuSamplesRef.current.length);
  }, []);

  const startSim = useCallback(() => {
    if (simTimerRef.current) return; let t = 0;
    simTimerRef.current = setInterval(() => {
      const ax = Math.sin(t * 0.025) * 3 + Math.sin(t * 0.08) * 1.5 + (Math.random() - 0.5) * 0.5;
      const ay = Math.cos(t * 0.03) * 2.5 + Math.cos(t * 0.07) * 1.2 + (Math.random() - 0.5) * 0.5;
      imuSamplesRef.current.push({ t, ax, ay, az: 9.8 + Math.sin(t * 0.015) * 0.4, rx: Math.cos(t * 0.02) * 30 + (Math.random() - 0.5) * 6, ry: Math.sin(t * 0.022) * 25 + (Math.random() - 0.5) * 5, rz: Math.sin(t * 0.018) * 15 + (Math.random() - 0.5) * 4, interval: 16 + (Math.random() - 0.5) * 6 });
      if (t % 100 < 16) { camSamplesRef.current.push({ t, x: Math.sin(t * 0.025) * 15 + Math.cos(t * 0.08) * 8 + (Math.random() - 0.5) * 3, y: Math.cos(t * 0.03) * 12 + Math.sin(t * 0.07) * 6 + (Math.random() - 0.5) * 3, z: (Math.random() - 0.5) * 2 }); setCamCount(camSamplesRef.current.length); }
      setImuCount(imuSamplesRef.current.length); t += 16;
    }, 16);
  }, []);

  const stopSim = useCallback(() => { if (simTimerRef.current) { clearInterval(simTimerRef.current); simTimerRef.current = null; } }, []);

  async function startCamera() {
    try {
      setCameraStatus("Starting...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, frameRate: 15 } });
      if (!videoRef.current) return; streamRef.current = stream; videoRef.current.srcObject = stream; await videoRef.current.play();
      if (!(window as any).Pose) { setCameraStatus("Loading MediaPipe..."); await new Promise<void>((r) => { const script = document.createElement("script"); script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js"; script.crossOrigin = "anonymous"; script.onload = () => r(); script.onerror = () => r(); document.head.appendChild(script); }); }
      if (!(window as any).Pose) { setCameraStatus("MediaPipe unavailable"); return; }
      const MP_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404";
      const pose = new (window as any).Pose({ locateFile: (f: string) => { const url = `${MP_BASE}/${f}`; if (!f || f.includes("undefined")) throw new Error(`Invalid MediaPipe file: ${f}`); return url; } });
      pose.setOptions({ modelComplexity: 0, smoothLandmarks: false, enableSegmentation: false });
      pose.onResults((results: any) => { if (results.poseLandmarks) { const lw = results.poseLandmarks[15]; if (lw) { const now = performance.now() - startTimeRef.current; camSamplesRef.current.push({ t: Math.round(now), x: round(lw.x * 100), y: round(lw.y * 100), z: round(lw.z * 100) }); if (camSamplesRef.current.length > 600) camSamplesRef.current.shift(); setCamCount(camSamplesRef.current.length); } } });
      // 200ms interval reduces iOS Safari memory pressure (was 100ms)
      poseIntervalRef.current = setInterval(async () => { if (videoRef.current) { try { await pose.send({ image: videoRef.current }); } catch { /* MediaPipe frame dropped — non-fatal */ } } }, 200);
      setCameraStatus("Active");
    } catch { setCameraStatus("Unavailable"); }
  }

  function stopCamera() { if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; } if (poseIntervalRef.current) { clearInterval(poseIntervalRef.current); poseIntervalRef.current = null; } if (videoRef.current) videoRef.current.srcObject = null; setCameraStatus(""); }

  const run = useCallback(async () => {
    setPhase("countdown"); setEvidence(null); setDisplayVerdict(null); setInternalData(null);
    for (let i = 3; i >= 1; i--) { setCountdown(i); await sleep(1000); }
    imuSamplesRef.current = []; camSamplesRef.current = []; setImuCount(0); setCamCount(0); hasRealSensorRef.current = false;
    await startCamera();
    window.addEventListener("devicemotion", handleIMU);
    startTimeRef.current = performance.now(); lastIMUEventRef.current = 0;
    if (isSimulated) { setNoSensors(true); startSim(); } else { setTimeout(() => { if (!hasRealSensorRef.current && !simTimerRef.current) { setNoSensors(true); setIsSimulated(true); startSim(); } }, 1500); }
    setPhase("capturing"); setElapsed(0);
    const captureStart = performance.now();
    const timer = setInterval(() => { const e = (performance.now() - captureStart) / 1000; setElapsed(e); if (e >= DURATION) { clearInterval(timer); finish(); } }, 100);

    function finish() {
      window.removeEventListener("devicemotion", handleIMU); stopSim(); stopCamera();
      const imuEvents = detectJerkPeaks(imuSamplesRef.current);
      // Camera events naturally precede IMU events by ~160ms (visual trajectory change
      // is detectable before the corresponding force builds up). No compensation needed —
      // we rely on the widened match window (±500ms) to absorb this physical lag.
      const camEvents = detectDirectionChanges(camSamplesRef.current);
      const { matches, unmatchedIMU, unmatchedCam } = matchEvents(imuEvents, camEvents);
      const lastImuT = imuEvents.length > 0 ? imuEvents[imuEvents.length - 1].t : 0;
      const lastCamT = camEvents.length > 0 ? camEvents[camEvents.length - 1].t : 0;
      const totalDuration = Math.max(lastImuT, lastCamT, DURATION * 1000);

      const ev = buildEvidence(imuEvents, camEvents, matches, unmatchedIMU, unmatchedCam, totalDuration);
      setEvidence(ev);
      hashEvidence(ev).then((d) => { if (d) setEvidence((prev) => prev ? { ...prev, evidenceDigest: d } : prev); });
      const verdict = evaluatePolicy({ policyId: "EE-002", acceptThreshold: 0.70, rejectThreshold: 0.35 }, ev.confidence ?? 0);
      setDisplayVerdict(verdict);
      setInternalData({ matches, unmatchedIMU, unmatchedCam });
      saveRun({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        engineId: "EE-002",
        timestamp: new Date().toISOString(),
        isSimulated,
        verdict,
        confidence: ev.confidence ?? 0,
        components: ev.components.map((c) => ({ metric: c.metric, value: c.value, threshold: c.threshold, status: c.status })),
        diagnostics: ev.diagnostics,
        imuCount: imuSamplesRef.current.length,
        camCount: camSamplesRef.current.length,
        matchCount: matches.length,
      });
      setPhase("complete");
    }
  }, [isSimulated, handleIMU, startSim, stopSim]);

  // ── Render helpers ──

  function statusColor(s: string): string { if (s === "PASS") return "#3fb950"; if (s === "FAIL") return "#f85149"; return "#d29922"; }
  function statusIcon(s: string): string { if (s === "PASS") return "✓"; if (s === "FAIL") return "✗"; return "—"; }

  // ── Render ──

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/research" className="text-white/30 text-[11px] tracking-[0.2em] uppercase hover:text-white/60">← Research</Link>
        <span className="text-white/15 text-[9px] tracking-[0.3em] uppercase">EE-002</span>
        <div className="w-16" />
      </header>
      <main className="max-w-lg mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-white/85 text-[clamp(1.5rem,4vw,2rem)] font-light tracking-[0.02em]">
            Causal Coupling
          </h1>
          <p className="text-white/35 text-[14px] leading-relaxed max-w-sm mx-auto"
            style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
            Do your phone's IMU and camera describe the same physical event — or are they seeing different things?
          </p>
        </div>

        <ResearchStatus engineId="EE-002" />

        <video ref={videoRef} className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none" playsInline muted />

        {/* Active status — only visible when running */}
        {phase !== "idle" && phase !== "complete" && (
          <div className="p-2 border border-white/5 text-[9px] font-mono text-white/20 flex justify-between">
            <span>IMU: {imuCount} | Cam: {camCount} | {cameraStatus || "off"} | {isSimulated ? "SIM" : "LIVE"}</span>
            <span>{evidence ? "✓ Evidence" : "○ Idle"}</span>
          </div>
        )}

        {phase === "idle" && (
          <div className="space-y-5">
            {noSensors && <div className="p-3 border border-yellow-400/20 bg-yellow-400/[0.04] text-yellow-400/60 text-[11px] text-center">No physical sensors — simulation active. Use HTTPS on a mobile device for real testing.</div>}
            <div className="p-3 border border-red-400/20 bg-red-400/[0.04] text-red-400/50 text-[10px] text-center leading-relaxed">
              ⚠ iOS Safari: camera + IMU together may crash. Use Sim mode instead.
            </div>
            <button onClick={run} className="w-full py-5 bg-white/[0.04] border border-white/10 text-white/70 text-[15px] tracking-[0.05em] hover:bg-white/[0.08] hover:border-white/20 hover:text-white/90 transition-all">
              Collect Evidence
            </button>

            <details className="group">
              <summary className="text-white/20 text-[9px] tracking-[0.15em] text-center cursor-pointer hover:text-white/35 transition-colors list-none">How this works</summary>
              <div className="mt-3 p-4 border border-white/[0.04] bg-white/[0.01] text-[11px] text-white/35 leading-relaxed space-y-2"
                style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
                <p>Move your phone while keeping your other hand visible to the camera. The system checks if IMU and camera events are temporally and directionally aligned — evidence that both sensors describe the same physical event.</p>
                <p className="text-white/20">This is the most experimental engine. Single-device constraint limits causal discriminability. Works best with an independent camera.</p>
              </div>
            </details>

            <div className="text-center">
              <button onClick={() => setIsSimulated(!isSimulated)} className={`text-[9px] tracking-[0.1em] ${isSimulated ? "text-[#90c8ff]/40" : "text-white/12 hover:text-white/25"} transition-colors`}>
                {isSimulated ? "⚡ Simulating sensors" : "No sensors? Use simulation"}
              </button>
            </div>
          </div>
        )}

        {phase === "countdown" && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="text-white/20 text-[12px] tracking-[0.3em] uppercase">Starting Capture</div>
            <div className="text-[120px] font-light text-[#90c8ff] leading-none" style={{ textShadow: "0 0 60px rgba(144,200,255,0.4)", animation: "countdownPulse 1s ease-in-out infinite" }}>{countdown}</div>
          </div>
        )}

        {phase === "capturing" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase"><span className="text-[#90c8ff]/50">Capturing</span><span className="text-[#90c8ff]/50 font-mono">{elapsed.toFixed(1)}s / {DURATION}s</span></div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#90c8ff]/60 to-[#a371f7]/60 rounded-full transition-all duration-100" style={{ width: `${(elapsed / DURATION) * 100}%` }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div className="p-3 border border-[#90c8ff]/10"><div className="text-[#90c8ff]/40 text-[8px] uppercase mb-1">IMU</div><div className="text-white/50 font-mono">{imuCount} samples</div></div>
              <div className="p-3 border border-[#a371f7]/10"><div className="text-[#a371f7]/40 text-[8px] uppercase mb-1">Camera</div><div className="text-white/50 font-mono">{camCount} frames</div></div>
            </div>
            <div className="text-center p-8 border border-dashed border-white/10 text-white/30 text-[14px]">Move naturally — any motion works.</div>
          </div>
        )}

        {/* ── Results ── */}
        {phase === "complete" && evidence && displayVerdict && (
          <div className="space-y-6">
            <button onClick={() => {
                const lines = [
                  `Verdict: ${displayVerdict}`,
                  `IMU: ${imuCount} samples, Cam: ${camCount} frames`,
                  ...evidence.diagnostics,
                ];
                const text = lines.join("\n");
                navigator.clipboard.writeText(text).then(() => { setCopyStatus("✓ Copied!"); setTimeout(() => setCopyStatus(""), 2000); }).catch(() => setCopyStatus("Failed"));
              }} className="w-full py-3 border border-[#d29922]/40 text-[#d29922]/70 text-[11px] tracking-[0.1em] uppercase hover:border-[#d29922] transition-all">{copyStatus || "📋 Copy All Results"}</button>

            {/* Verdict */}
            <div className="text-center p-6 border-2 border-[#a371f7]/40 bg-[#a371f7]/[0.04] space-y-3">
              <div className="text-white/20 text-[9px] tracking-[0.2em] uppercase">Verification Confidence</div>
              <div className="text-[36px] font-light" style={{ color: statusColor(displayVerdict) }}>
                {debug ? displayVerdict.replace(/_/g, " ") : evidence.confidence ? `${(evidence.confidence * 100).toFixed(0)}%` : "—"}
              </div>
              <div className="text-white/25 text-[11px]">
                {displayVerdict === "PASS" ? "Strong causal coupling — both streams consistent with a single physical event."
                  : displayVerdict === "FAIL" ? "Weak coupling — streams may describe different physical events."
                  : "Insufficient evidence to evaluate causal coupling."}
              </div>
            </div>

            {/* ── Evidence Components ── */}
            <div className="p-4 border border-white/10 bg-white/[0.02] space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase text-white/20">Evidence Components</div>
                {debug && <span className="text-[8px] text-white/10 font-mono">{evidence.engineId}</span>}
              </div>
              {evidence.components.map((comp) => (
                <div key={comp.metric} className="flex items-center justify-between p-2 border border-white/5">
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-white/50">{comp.metric}</div>
                    {debug && <div className="text-[9px] text-white/20">{comp.value.toFixed(3)} vs {comp.threshold} — {comp.explanation}</div>}
                  </div>
                  <span style={{ color: statusColor(comp.status), fontSize: "13px" }}>{statusIcon(comp.status)}</span>
                </div>
              ))}
            </div>

            {/* ── Diagnostic Log ── */}
            <div className="p-4 border border-white/10 bg-white/[0.02] space-y-2">
              <div className="text-[10px] uppercase text-white/20">Diagnostic Log</div>
              <div className="space-y-1">
                {evidence.diagnostics.map((d, i) => (
                  <div key={i} className={`text-[10px] font-mono leading-relaxed ${d.startsWith("✓") ? "text-[#3fb950]/70" : d.startsWith("✗") ? "text-[#f85149]/70" : d.startsWith("⚠") ? "text-[#d29922]/70" : "text-white/25"}`}>{d}</div>
                ))}
              </div>
            </div>

            {/* ── Timeline (internal data, not part of evidence) ── */}
            {internalData && (
              <div className="p-4 border border-white/10 bg-white/[0.02] space-y-3">
                <div className="text-[10px] uppercase text-white/20">Event Timeline</div>
                <div className="relative h-8 bg-white/[0.03] rounded overflow-hidden">
                  {internalData.matches.map((m, i) => (
                    <div key={i} className="absolute top-1 h-6 rounded" style={{ left: `${(m.imu.t / (DURATION * 1000)) * 100}%`, width: `${Math.max(1, (Math.abs(m.dtMs) / (DURATION * 1000)) * 100)}%`, backgroundColor: m.directionAligned ? "rgba(63,185,80,0.5)" : "rgba(248,81,73,0.5)" }} />
                  ))}
                  {internalData.unmatchedIMU.map((e, i) => (<div key={`imu-${i}`} className="absolute top-1 w-1 h-6 rounded bg-[#90c8ff]/40" style={{ left: `${(e.t / (DURATION * 1000)) * 100}%` }} />))}
                  {internalData.unmatchedCam.map((e, i) => (<div key={`cam-${i}`} className="absolute top-1 w-1 h-6 rounded bg-[#a371f7]/40" style={{ left: `${(e.t / (DURATION * 1000)) * 100}%` }} />))}
                </div>
                <div className="flex gap-4 text-[8px] text-white/20 flex-wrap">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#3fb950]/50" /> Aligned</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#f85149]/50" /> Misaligned</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#90c8ff]/40" /> Unmatched IMU</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#a371f7]/40" /> Unmatched Cam</span>
                </div>
              </div>
            )}

            {/* Policy note */}
            <div className="p-3 border border-white/5 bg-white/[0.01] text-[9px] font-mono text-white/15 space-y-1">
              <div className="text-white/20 text-[8px] uppercase mb-1">Policy · evaluatePolicy</div>
              <div>All components must PASS. Verdict computed by VerificationPolicy — not stored in Evidence.</div>
              <div className="text-white/10">Candidate Parameters: DirectionTolerance={DIRECTION_TOLERANCE_DEG}° MatchWindow=±{MATCH_WINDOW_MS}ms</div>
            </div>

            <button onClick={() => { setPhase("idle"); setEvidence(null); setDisplayVerdict(null); setInternalData(null); }}
              className="w-full py-4 border border-white/10 text-white/25 text-[11px] tracking-[0.2em] uppercase hover:border-white/30 transition-all">↻ Run Again</button>
          </div>
        )}
        <ExperimentExport engineId="EE-002" />
        <div className="mt-10 pt-5 border-t border-white/[0.04] text-center">
          <p className="text-white/25 text-[9px] tracking-[0.1em]">Research Prototype &middot; The Continuity Lab</p>
          <p className="text-white/20 text-[8px] mt-1">
            Parameters intentionally omitted &middot;{" "}
            <a href={`?debug=${debug ? "0" : "1"}`} className="underline hover:text-white/35">
              {debug ? "Public view" : "Developer mode"}
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
