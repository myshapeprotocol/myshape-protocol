"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  type EngineEvidence,
  type Verdict,
  hashEvidence,
  evaluatePolicy,
} from "@/lib/evidence/types";
import {
  type IMUSample,
  type CameraSample,
  detectJerkPeaks,
  detectDirectionChanges,
  matchEvents,
  buildEvidence,
} from "@/lib/evidence/causal-coupling";

const DURATION = 8;

function round(v: number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return Math.round(v * 1000) / 1000;
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function genCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function PE001Page() {
  const [phase, setPhase] = useState<"idle" | "countdown" | "capturing" | "waiting" | "complete">("idle");
  const [sessionCode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("pe001-code");
      if (saved) return saved;
      const code = genCode();
      sessionStorage.setItem("pe001-code", code);
      return code;
    }
    return genCode();
  });
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [camCount, setCamCount] = useState(0);
  const [imuCount, setImuCount] = useState(0);
  const [mpCalls, setMpCalls] = useState(0); // debug: MediaPipe callback count
  const [cameraStatus, setCameraStatus] = useState("");
  const [phoneStatus, setPhoneStatus] = useState("waiting");
  const [evidence, setEvidence] = useState<EngineEvidence | null>(null);
  const [displayVerdict, setDisplayVerdict] = useState<Verdict | null>(null);
  const [copyStatus, setCopyStatus] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const camSamplesRef = useRef<CameraSample[]>([]);
  const startTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      stopCamera();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function stopCamera() {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (poseIntervalRef.current) { clearInterval(poseIntervalRef.current); poseIntervalRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function startCamera() {
    try {
      setCameraStatus("Starting...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, frameRate: 15 } });
      if (!videoRef.current) return;
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      if (!(window as any).Pose) {
        setCameraStatus("Loading MediaPipe...");
        await new Promise<void>((r) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js";
          s.crossOrigin = "anonymous";
          s.onload = () => r();
          s.onerror = () => r();
          document.head.appendChild(s);
        });
      }
      if (!(window as any).Pose) { setCameraStatus("MediaPipe unavailable"); return; }

      const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404";
      const pose = new (window as any).Pose({
        locateFile: (f: string) => {
          if (!f || f.includes("undefined")) throw new Error(`Invalid MediaPipe file: ${f}`);
          return `${MP}/${f}`;
        },
      });
      pose.setOptions({ modelComplexity: 0, smoothLandmarks: false, enableSegmentation: false });
      pose.onResults((results: any) => {
        setMpCalls((c) => c + 1);
        if (results.poseLandmarks && startTimeRef.current > 0) {
          const nose = results.poseLandmarks[0];
          const wrist = results.poseLandmarks[15];
          const pt = wrist || nose || results.poseLandmarks[11]; // wrist > nose > shoulder
          if (pt) {
            const now = performance.now() - startTimeRef.current;
            camSamplesRef.current.push({ t: Math.round(now), x: round(pt.x * 100), y: round(pt.y * 100), z: round(pt.z * 100) });
            if (camSamplesRef.current.length > 600) camSamplesRef.current.shift();
            setCamCount(camSamplesRef.current.length);
          }
        }
      });
      poseIntervalRef.current = setInterval(async () => {
        if (videoRef.current) { try { await pose.send({ image: videoRef.current }); } catch { /* drop */ } }
      }, 200);
      setCameraStatus("Active");
    } catch { setCameraStatus("Unavailable"); }
  }

  async function run() {
    setPhase("countdown");
    for (let i = 3; i >= 1; i--) { setCountdown(i); await sleep(1000); }

    camSamplesRef.current = [];
    setCamCount(0);
    setMpCalls(0);
    setImuCount(0);
    setEvidence(null);
    setDisplayVerdict(null);

    await startCamera();
    startTimeRef.current = performance.now();

    setPhase("capturing");
    setElapsed(0);
    const t0 = performance.now();
    await new Promise<void>((resolve) => {
      const t = setInterval(() => {
        const e = (performance.now() - t0) / 1000;
        setElapsed(e);
        if (e >= DURATION) { clearInterval(t); resolve(); }
      }, 100);
    });

    stopCamera();
    setPhase("waiting");
    setPhoneStatus("polling...");

    // Poll API for phone IMU data
    const pollStart = Date.now();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pe001/session`);
        const data = await res.json();
        if (data.ready) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setPhoneStatus("received");
          setImuCount(data.imuSamples.length);
          analyze(data.imuSamples);
        } else if (Date.now() - pollStart > 120_000) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setPhoneStatus("timeout — no phone data received");
          setPhase("idle");
        }
      } catch { /* retry */ }
    }, 1000);
  }

  function analyze(imuSamples: IMUSample[]) {
    const imuEvents = detectJerkPeaks(imuSamples);
    const camEvents = detectDirectionChanges(camSamplesRef.current);
    const { matches } = matchEvents(imuEvents, camEvents);
    const totalDuration = Math.max(
      imuEvents.length > 0 ? imuEvents[imuEvents.length - 1].t : 0,
      camEvents.length > 0 ? camEvents[camEvents.length - 1].t : 0,
      DURATION * 1000,
    );
    const ev = buildEvidence(imuEvents, camEvents, matches, [], [], totalDuration);
    setEvidence(ev);
    hashEvidence(ev).then((d) => { if (d) setEvidence((prev) => (prev ? { ...prev, evidenceDigest: d } : prev)); });
    setDisplayVerdict(evaluatePolicy({ policyId: "EE-002", acceptThreshold: 0.70, rejectThreshold: 0.35 }, ev.confidence ?? 0));
    setPhase("complete");
  }

  function sc(s: string) { return s === "PASS" ? "#3fb950" : s === "FAIL" ? "#f85149" : "#d29922"; }
  function si(s: string) { return s === "PASS" ? "✓" : s === "FAIL" ? "✗" : "—"; }

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono">
      <header className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/research" className="text-white/30 text-[11px] tracking-[0.2em] uppercase hover:text-white/60">← Research</Link>
        <span className="text-white/15 text-[9px] tracking-[0.3em] uppercase">PE-001</span>
        <div className="w-16" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-12 space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-white/85 text-2xl font-light">PE-001 Offline Sync</h1>
          <p className="text-white/35 text-[14px]"
            style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
            Desktop camera + phone IMU, synced by session code.
          </p>
        </div>

        {/* Recording hint */}
        <div className="text-center p-4 border border-[#90c8ff]/20 bg-[#90c8ff]/[0.03]">
          <div className="text-white/30 text-[11px]">1. Click Start Recording below</div>
          <div className="text-white/30 text-[11px]">2. On phone: open PE-001 Phone page and record</div>
          <div className="text-white/30 text-[11px]">3. Move both devices together for 8 seconds</div>
        </div>

        {/* Camera preview — show what the camera sees */}
        <div className="flex justify-center">
          <video ref={videoRef} className="w-64 h-48 object-cover border border-white/10 rounded" playsInline muted />
        </div>

        {/* Status */}
        <div className="p-2 border border-white/5 text-[9px] font-mono text-white/20 flex justify-between">
          <span>Camera: {cameraStatus || "off"}</span>
          <span>Phone: {phoneStatus}</span>
        </div>

        {phase === "idle" && (
          <button onClick={run} className="w-full py-5 bg-white/[0.04] border border-white/10 text-white/70 text-[15px] tracking-[0.05em] hover:bg-white/[0.08] transition-all">
            Start Recording
          </button>
        )}

        {phase === "countdown" && (
          <div className="flex flex-col items-center py-24 gap-6">
            <div className="text-white/20 text-[12px] tracking-[0.3em] uppercase">Starting</div>
            <div className="text-[100px] font-light text-[#90c8ff] leading-none">{countdown}</div>
          </div>
        )}

        {phase === "capturing" && (
          <div className="space-y-4">
            <div className="flex justify-between text-[10px]">
              <span className="text-[#90c8ff]/50">{elapsed.toFixed(1)}s / {DURATION}s</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#90c8ff]/60 to-[#a371f7]/60 rounded-full" style={{ width: `${(elapsed / DURATION) * 100}%` }} />
            </div>
            <div className="text-center p-8 border border-dashed border-white/10 text-white/30 text-[14px]">
              Camera: {camCount} landmarks · MP: {mpCalls} calls
            </div>
          </div>
        )}

        {phase === "waiting" && (
          <div className="text-center p-8 border border-[#d29922]/20 bg-[#d29922]/[0.03]">
            <div className="text-[#d29922]/60 text-[12px] animate-pulse">Waiting for phone data...</div>
            <div className="text-white/20 text-[10px] mt-3">Record IMU on your phone (same session code)</div>
          </div>
        )}

        {phase === "complete" && evidence && displayVerdict && (
          <div className="space-y-4">
            <button onClick={() => {
              const lines = [`Verdict: ${displayVerdict}`, `Camera: ${camCount} frames, IMU: ${imuCount} samples`, ...evidence.diagnostics];
              navigator.clipboard.writeText(lines.join("\n")).then(() => { setCopyStatus("✓ Copied!"); setTimeout(() => setCopyStatus(""), 2000); }).catch(() => {});
            }} className="w-full py-3 border border-[#d29922]/40 text-[#d29922]/70 text-[11px] tracking-[0.1em] uppercase hover:border-[#d29922] transition-all">
              {copyStatus || "📋 Copy Results"}
            </button>

            <div className={`text-center p-6 border-2 ${displayVerdict === "PASS" ? "border-[#3fb950]/40 bg-[#3fb950]/[0.04]" : "border-[#f85149]/40 bg-[#f85149]/[0.04]"} space-y-3`}>
              <div className="text-white/20 text-[9px] tracking-[0.2em] uppercase">Cross-Modal Confidence</div>
              <div className="text-[36px] font-light" style={{ color: sc(displayVerdict) }}>
                {evidence.confidence ? `${(evidence.confidence * 100).toFixed(0)}%` : "—"}
              </div>
            </div>

            {evidence.components.map((comp) => (
              <div key={comp.metric} className="flex items-center justify-between p-2 border border-white/5">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-white/50">{comp.metric}</div>
                  <div className="text-[9px] text-white/20">{comp.value.toFixed(3)} vs {comp.threshold}</div>
                </div>
                <span style={{ color: sc(comp.status), fontSize: "13px" }}>{si(comp.status)}</span>
              </div>
            ))}
            <div className="space-y-1">
              {evidence.diagnostics.map((d, i) => (
                <div key={i} className={`text-[10px] font-mono ${d.startsWith("✓") ? "text-[#3fb950]/70" : d.startsWith("✗") ? "text-[#f85149]/70" : "text-white/25"}`}>{d}</div>
              ))}
            </div>
            <button onClick={() => setPhase("idle")} className="w-full py-4 border border-white/10 text-white/25 text-[11px] tracking-[0.2em] uppercase hover:border-white/30 transition-all">↻ New Session</button>
          </div>
        )}
      </main>
    </div>
  );
}
