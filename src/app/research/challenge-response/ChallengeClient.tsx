"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useDebug } from "@/hooks/useDebug";
import ResearchStatus from "@/components/ResearchStatus";
import ExperimentExport from "@/components/experiment/ExperimentExport";
import { saveRun } from "@/lib/experiment-logger";
import {
  type EngineEvidence,
  type Verdict,
  hashEvidence,
  evaluatePolicy,
} from "@/lib/evidence/types";
import {
  type Direction,
  type RoundResult,
  type GyroSample,
  DIRECTION_ARROW,
  DIRECTIONS,
  TOTAL_ROUNDS,
  BASE_COUNTDOWN_MS,
  MAX_JITTER_MS,
  CAPTURE_DURATION_MS,
  pick,
  analyzeRound,
  buildChallengeEvidence,
} from "@/lib/evidence/gyro-challenge";

// ═══════════════════════════════════════════════════════════════════
// EE-003 · Additional Evidence — Gyroscope Challenge
// Collects additional evidence through random directional gyroscope checks.
// 3 rounds with jittered timing, direction + magnitude checks.
// ═══════════════════════════════════════════════════════════════════

type Phase = "idle" | "countdown" | "capturing" | "round-result" | "complete";

interface IMUSample {
  t: number;
  ax: number; ay: number; az: number;
  rx: number; ry: number; rz: number;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function round(v: number | null | undefined): number { if (v === null || v === undefined) return 0; return Math.round(v * 1000) / 1000; }

// ── Component ──

export default function ChallengeClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentRound, setCurrentRound] = useState(1);
  const [targetDir, setTargetDir] = useState<Direction>("→");
  const [countdownSec, setCountdownSec] = useState(0);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [lastRoundResult, setLastRoundResult] = useState<RoundResult | null>(null);
  const [evidence, setEvidence] = useState<EngineEvidence | null>(null);
  const [displayVerdict, setDisplayVerdict] = useState<Verdict | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [imuDebug, setImuDebug] = useState(0); // debug: IMU sample count
  const debug = useDebug();

  const imuSamplesRef = useRef<IMUSample[]>([]);
  const targetDirRef = useRef<Direction>("→");
  const isCapturingRef = useRef(false);
  const listenerActiveRef = useRef(false);

  // Single persistent listener (added once, kept for all rounds — iOS friendly)
  const handleIMU = useCallback((e: DeviceMotionEvent) => {
    if (!isCapturingRef.current) return;
    const ax = round(e.acceleration?.x ?? e.accelerationIncludingGravity?.x);
    const ay = round(e.acceleration?.y ?? e.accelerationIncludingGravity?.y);
    const az = round(e.acceleration?.z ?? e.accelerationIncludingGravity?.z);
    const rx = round(e.rotationRate?.alpha); // yaw (z-axis) — left/right rotation
    const ry = round(e.rotationRate?.beta);  // pitch (x-axis) — up/down rotation
    const rz = round(e.rotationRate?.gamma); // roll (y-axis)
    imuSamplesRef.current.push({ t: performance.now(), ax, ay, az, rx, ry, rz });
    setImuDebug((prev) => prev + 1);
  }, []);

  // ── Run one round (returns result directly — does not rely on state) ──

  async function runRound(round: number, dir: Direction): Promise<RoundResult> {
    // Countdown with jitter
    const jitterMs = Math.floor(Math.random() * MAX_JITTER_MS);
    const totalCountdown = BASE_COUNTDOWN_MS + jitterMs;
    const countdownSteps = Math.ceil(totalCountdown / 1000);

    setPhase("countdown");
    setTargetDir(dir);
    targetDirRef.current = dir;

    for (let i = countdownSteps; i >= 0; i--) {
      setCountdownSec(i);
      if (i > 0) await sleep(1000);
    }

    // Capture
    setPhase("capturing");
    imuSamplesRef.current = [];
    setImuDebug(0);
    isCapturingRef.current = true;

    const captureStart = performance.now();
    const captureTimer = setInterval(() => {
      setCaptureProgress(((performance.now() - captureStart) / CAPTURE_DURATION_MS) * 100);
    }, 50);

    await sleep(CAPTURE_DURATION_MS);

    clearInterval(captureTimer);
    isCapturingRef.current = false;
    setCaptureProgress(100);

    // Analyze
    const analysis = analyzeRound(imuSamplesRef.current, dir);
    const roundResult: RoundResult = {
      round,
      direction: dir,
      jitterMs,
      angleDeg: Math.round(analysis.angleDeg),
      directionMatch: analysis.directionMatch,
      peakG: Math.round(analysis.peakG * 100) / 100,
      magnitudeStatus: analysis.magnitudeStatus,
      sampleCount: imuSamplesRef.current.length,
    };

    setLastRoundResult(roundResult);
    setRoundResults((prev) => [...prev, roundResult]);
    setPhase("round-result");
    await sleep(1500);

    return roundResult;
  }

  // ── Full challenge ──

  const runFull = useCallback(async () => {
    setRoundResults([]);
    setEvidence(null);
    setDisplayVerdict(null);
    setErrorMsg("");
    setCurrentRound(1);

    // Check sensor availability
    const hasIMU = "DeviceMotionEvent" in window;
    if (!hasIMU) {
      setErrorMsg("DeviceMotion not available. Use HTTPS on a mobile device.");
      setPhase("idle");
      return;
    }

    // iOS 13+ requires explicit permission for DeviceMotion
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const perm = await (DeviceMotionEvent as any).requestPermission();
        if (perm !== "granted") {
          setErrorMsg("Motion sensor permission denied. Enable in Settings > Safari > Motion & Orientation Access.");
          setPhase("idle");
          return;
        }
      } catch {
        setErrorMsg("Motion sensor permission error. Ensure you're on HTTPS.");
        setPhase("idle");
        return;
      }
    }

    // Add listener ONCE (matching PE-001 pattern — iOS prefers this)
    window.addEventListener("devicemotion", handleIMU);
    listenerActiveRef.current = true;

    const allResults: RoundResult[] = [];

    try {
      // Round 1
      allResults.push(await runRound(1, pick(DIRECTIONS)));

      // Round 2
      setCurrentRound(2);
      allResults.push(await runRound(2, pick(DIRECTIONS)));

      // Round 3
      setCurrentRound(3);
      allResults.push(await runRound(3, pick(DIRECTIONS)));
    } finally {
      window.removeEventListener("devicemotion", handleIMU);
      listenerActiveRef.current = false;
      isCapturingRef.current = false;
    }

    // Build evidence
    const ev = buildChallengeEvidence(allResults);
    setEvidence(ev);
    hashEvidence(ev).then((d) => {
      if (d) setEvidence((prev) => (prev ? { ...prev, evidenceDigest: d } : prev));
    });
    const verdict = evaluatePolicy({ policyId: "EE-003", acceptThreshold: 0.70, rejectThreshold: 0.35 }, ev.confidence ?? 0);
    setDisplayVerdict(verdict);
    saveRun({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      engineId: "EE-003",
      timestamp: new Date().toISOString(),
      isSimulated: false,
      verdict,
      confidence: ev.confidence ?? 0,
      components: ev.components.map((c) => ({ metric: c.metric, value: c.value, threshold: c.threshold, status: c.status })),
      diagnostics: ev.diagnostics,
      roundResults: allResults.map((r) => ({ round: r.round, direction: r.direction, directionMatch: r.directionMatch, magnitudeStatus: r.magnitudeStatus, angleDeg: r.angleDeg, peakG: r.peakG, sampleCount: r.sampleCount })),
    });
    setPhase("complete");
  }, [handleIMU]);

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
        <Link href="/research" className="text-white/30 text-[11px] tracking-[0.2em] uppercase hover:text-white/60">
          ← Research
        </Link>
        <span className="text-white/15 text-[9px] tracking-[0.3em] uppercase">EE-003</span>
        <div className="w-16" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-white/85 text-[clamp(1.5rem,4vw,2rem)] font-light tracking-[0.02em]">
            Motion Challenge
          </h1>
          <p className="text-white/35 text-[14px] leading-relaxed max-w-sm mx-auto"
            style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
            Can your phone's gyroscope tell the difference between a human responding to a random challenge and a replay attack?
          </p>
        </div>

        <ResearchStatus engineId="EE-003" />

        {/* Progress indicator */}
        {phase !== "idle" && phase !== "complete" && (
          <div className="flex gap-1 justify-center">
            {[1, 2, 3].map((r) => (
              <div
                key={r}
                className={`w-3 h-3 rounded-full transition-colors ${
                  r < currentRound
                    ? "bg-[#3fb950]/60"
                    : r === currentRound
                      ? "bg-[#90c8ff]/80"
                      : "bg-white/10"
                }`}
              />
            ))}
          </div>
        )}

        {/* ── Idle ── */}
        {phase === "idle" && (
          <div className="space-y-5">
            {errorMsg && (
              <div className="p-3 border border-red-400/20 bg-red-400/[0.04] text-red-400/60 text-[11px] text-center">
                {errorMsg}
              </div>
            )}
            <button
              onClick={runFull}
              className="w-full py-5 bg-white/[0.04] border border-white/10 text-white/70 text-[15px] tracking-[0.05em] hover:bg-white/[0.08] hover:border-white/20 hover:text-white/90 transition-all"
            >
              Run Challenge
            </button>

            <details className="group">
              <summary className="text-white/20 text-[9px] tracking-[0.15em] text-center cursor-pointer hover:text-white/35 transition-colors list-none">How this works</summary>
              <div className="mt-3 p-4 border border-white/[0.04] bg-white/[0.01] text-[11px] text-white/35 leading-relaxed space-y-2"
                style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
                <p>3 randomized rounds. Each round shows a direction — rotate your phone that way when the timer hits zero.</p>
                <p>← → = yaw (twist wrist left/right) &nbsp;|&nbsp; ↑ ↓ = pitch (tilt phone toward/away)</p>
                <p className="text-white/20">Timing is jittered (±1000ms) to prevent replay attacks. Need 2/3 rounds for sufficient evidence.</p>
              </div>
            </details>
          </div>
        )}

        {/* ── Countdown ── */}
        {phase === "countdown" && (
          <div className="flex flex-col items-center justify-center py-12 gap-6">
            <div className="text-white/20 text-[10px] tracking-[0.3em] uppercase">
              Round {currentRound}/3 — Get Ready
            </div>
            <div className="text-[96px] leading-none" style={{ color: "#d29922" }}>
              {DIRECTION_ARROW[targetDir]}
            </div>
            {/* Direction preview — animated ring */}
            <div className="gyro-preview-ring">
              <div className={`gyro-preview-dot ${targetDir === "←" ? "gyro-preview-ccw" : targetDir === "→" ? "gyro-preview-cw" : targetDir === "↑" ? "gyro-preview-up" : "gyro-preview-dn"}`} />
            </div>
            <div className="gyro-preview-label">
              {targetDir === "←" ? "rotate phone left" : targetDir === "→" ? "rotate phone right" : targetDir === "↑" ? "tilt top toward you" : "tilt top away"}
            </div>
            <div className="text-[56px] font-light text-[#d29922] leading-none">
              {countdownSec}
            </div>
          </div>
        )}

        {/* ── Capturing ── */}
        {phase === "capturing" && (
          <div className="flex flex-col items-center justify-center py-16 gap-8">
            <div className="text-[80px] leading-none animate-pulse" style={{ color: "#3fb950" }}>
              {DIRECTION_ARROW[targetDir]}
            </div>
            <div className="text-[#3fb950] text-[24px] font-bold tracking-[0.1em] uppercase animate-pulse">
              ROTATE {targetDir} NOW
            </div>
            <div className="text-white/15 text-[9px] font-mono">IMU: {imuDebug} events</div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#3fb950]/60 to-[#d29922]/60 rounded-full"
                style={{ width: `${captureProgress}%`, transition: "width 0.1s linear" }}
              />
            </div>
          </div>
        )}

        {/* ── Round Result ── */}
        {phase === "round-result" && lastRoundResult && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div
              className="text-[64px] leading-none"
              style={{ color: lastRoundResult.directionMatch && lastRoundResult.magnitudeStatus === "PASS" ? "#3fb950" : "#f85149" }}
            >
              {lastRoundResult.directionMatch && lastRoundResult.magnitudeStatus === "PASS" ? "✓" : "✗"}
            </div>
            <div className="text-white/40 text-[14px]">
              Round {lastRoundResult.round} — {lastRoundResult.direction}
            </div>
            {debug && (
              <div className="text-white/20 text-[11px]">
                Angle: {lastRoundResult.angleDeg}° | Force: {lastRoundResult.peakG}g
              </div>
            )}
          </div>
        )}

        {/* ── Complete ── */}
        {phase === "complete" && evidence && displayVerdict && (
          <div className="space-y-6">
            {/* Copy button */}
            <button
              onClick={() => {
                const lines = [
                  `Verdict: ${displayVerdict}`,
                  ...evidence.diagnostics,
                ];
                const text = lines.join("\n");
                navigator.clipboard
                  .writeText(text)
                  .then(() => {
                    setCopyStatus("✓ Copied!");
                    setTimeout(() => setCopyStatus(""), 2000);
                  })
                  .catch(() => setCopyStatus("Failed"));
              }}
              className="w-full py-3 border border-[#d29922]/40 text-[#d29922]/70 text-[11px] tracking-[0.1em] uppercase hover:border-[#d29922] transition-all"
            >
              {copyStatus || "📋 Copy All Results"}
            </button>

            {/* Verdict */}
            <div className="text-center p-6 border-2 border-[#d29922]/40 bg-[#d29922]/[0.04] space-y-3">
              <div className="text-white/20 text-[9px] tracking-[0.2em] uppercase">Policy Decision</div>
              <div
                className="text-[20px] font-light"
                style={{ color: statusColor(displayVerdict) }}
              >
                {displayVerdict.replace(/_/g, " ")}
              </div>
              <div className="text-white/25 text-[11px]">
                {displayVerdict === "PASS"
                  ? "Additional Evidence collected — motion direction and force match."
                  : displayVerdict === "FAIL"
                    ? "Additional Evidence insufficient — motion does not convincingly match."
                    : "Insufficient evidence."}
              </div>
            </div>

            {/* Round summary cards */}
            <div className="grid grid-cols-3 gap-2">
              {roundResults.map((r) => {
                const ok = r.directionMatch && r.magnitudeStatus === "PASS";
                return (
                  <div
                    key={r.round}
                    className={`p-3 border text-center ${ok ? "border-[#3fb950]/20 bg-[#3fb950]/[0.04]" : "border-[#f85149]/20 bg-[#f85149]/[0.04]"}`}
                  >
                    <div className="text-[24px]">{DIRECTION_ARROW[r.direction]}</div>
                    <div className="text-[9px] text-white/30">R{r.round}</div>
                    <div className={`text-[10px] ${ok ? "text-[#3fb950]" : "text-[#f85149]"}`}>
                      {ok ? "PASS" : "FAIL"}{debug ? ` ${r.angleDeg}° ${r.peakG}g` : ""}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Evidence Components */}
            <div className="p-4 border border-white/10 bg-white/[0.02] space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase text-white/20">Evidence Components</div>
                <span className="text-[8px] text-white/10 font-mono">{evidence.engineId}</span>
              </div>
              {evidence.components.map((comp) => (
                <div
                  key={comp.metric}
                  className="flex items-center justify-between p-2 border border-white/5"
                >
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-white/50">{comp.metric}</div>
                    <div className="text-[9px] text-white/20">
                      {comp.value.toFixed(3)} vs {comp.threshold} — {comp.explanation}
                    </div>
                  </div>
                  <span style={{ color: statusColor(comp.status), fontSize: "13px" }}>
                    {statusIcon(comp.status)}
                  </span>
                </div>
              ))}
            </div>

            {/* Diagnostic Log */}
            <div className="p-4 border border-white/10 bg-white/[0.02] space-y-2">
              <div className="text-[10px] uppercase text-white/20">Diagnostic Log</div>
              <div className="space-y-1">
                {evidence.diagnostics.map((d, i) => (
                  <div
                    key={i}
                    className={`text-[10px] font-mono leading-relaxed ${
                      d.startsWith("✓")
                        ? "text-[#3fb950]/70"
                        : d.startsWith("✗")
                          ? "text-[#f85149]/70"
                          : d.startsWith("⚠")
                            ? "text-[#d29922]/70"
                            : "text-white/25"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setPhase("idle");
                setCurrentRound(1);
                setRoundResults([]);
                setLastRoundResult(null);
                setEvidence(null);
                setDisplayVerdict(null);
              }}
              className="w-full py-4 border border-white/10 text-white/25 text-[11px] tracking-[0.2em] uppercase hover:border-white/30 transition-all"
            >
              ↻ Run Again
            </button>
          </div>
        )}
        <ExperimentExport engineId="EE-003" />
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
