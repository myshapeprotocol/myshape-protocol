"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useDebug } from "@/hooks/useDebug";
import ResearchStatus from "@/components/ResearchStatus";
import ExperimentExport from "@/components/experiment/ExperimentExport";
import { saveRun } from "@/lib/experiment-logger";
import { type EngineEvidence, type Verdict, hashEvidence, evaluatePolicy } from "@/lib/evidence/types";
import { type IMUSample, detectJerkPeaks } from "@/lib/evidence/causal-coupling";
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
// Verification Session — dual-engine with camera fallback
//
// Stage 1 · Passive Evidence  — EE-001 IMU presence (8s free motion)
// Additional · Active Evidence   — EE-003 gyroscope challenge (3 rounds)
//
// Confidence: Reject / Escalate / Accept
// ═══════════════════════════════════════════════════════════════════

// Confidence thresholds
const CONFIDENCE_REJECT = 0.35;
const CONFIDENCE_ACCEPT = 0.70;
const IMU_ONLY_CAP = 0.65; // IMU alone can't auto-accept

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function round(v: number | null | undefined): number { if (v === null || v === undefined) return 0; return Math.round(v * 1000) / 1000; }

// ═══════════════════════════════════════════════════════════════════

type Stage = "idle" | "s1-countdown" | "s1-passive" | "s1-result" | "s2-countdown" | "s2-active" | "s2-result" | "complete";
type Decision = "reject" | "escalate" | "accept";
const DURATION = 8;

export default function ProtocolVerifyClient() {
  const [stage, setStage] = useState<Stage>("idle");
  const [cd, setCd] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [imuN, setImuN] = useState(0);
  const [isSim, setIsSim] = useState(false);
  const [noSensors, setNoSensors] = useState(false);
  const [passive, setPassive] = useState<EngineEvidence[]>([]);
  const [score, setScore] = useState(0);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [currRound, setCurrRound] = useState(1);
  const [targetDir, setTargetDir] = useState<Direction>("→");
  const [cdSec, setCdSec] = useState(0);
  const [gyroR, setGyroR] = useState<RoundResult[]>([]);
  const [lastGyro, setLastGyro] = useState<RoundResult | null>(null);
  const [active, setActive] = useState<EngineEvidence | null>(null);
  const [finalV, setFinalV] = useState<Verdict | null>(null);
  const [copySt, setCopySt] = useState("");
  const debug = useDebug();

  const imuRef = useRef<IMUSample[]>([]);
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSensRef = useRef(false);
  const startRef = useRef(0);
  const lastRef = useRef(0);
  const capRef = useRef(false);

  function stopSim() { if (simRef.current) { clearInterval(simRef.current); simRef.current = null; } }

  useEffect(() => {
    return () => {
      stopSim();
      if (fallbackRef.current) { clearTimeout(fallbackRef.current); fallbackRef.current = null; }
    };
  }, []);

  const handleIMU = useCallback((e: DeviceMotionEvent) => {
    if (!capRef.current) return;
    hasSensRef.current = true;
    const now = performance.now(); const t = now - startRef.current;
    const iv = lastRef.current > 0 ? now - lastRef.current : 0; lastRef.current = now;
    imuRef.current.push({ t: Math.round(t), ax: round(e.acceleration?.x ?? e.accelerationIncludingGravity?.x), ay: round(e.acceleration?.y ?? e.accelerationIncludingGravity?.y), az: round(e.acceleration?.z ?? e.accelerationIncludingGravity?.z), rx: round(e.rotationRate?.alpha), ry: round(e.rotationRate?.beta), rz: round(e.rotationRate?.gamma), interval: Math.round(iv * 100) / 100 });
    if (imuRef.current.length % 10 === 0) setImuN(imuRef.current.length);
  }, []);

  const startSim = useCallback(() => {
    if (simRef.current) return; let t = 0;
    simRef.current = setInterval(() => {
      imuRef.current.push({ t, ax: Math.sin(t * 0.025) * 3 + (Math.random() - 0.5), ay: Math.cos(t * 0.03) * 2.5 + (Math.random() - 0.5), az: 9.8, rx: Math.cos(t * 0.02) * 30 + (Math.random() - 0.5) * 6, ry: Math.sin(t * 0.022) * 25 + (Math.random() - 0.5) * 5, rz: Math.sin(t * 0.018) * 15 + (Math.random() - 0.5) * 4, interval: 16 });
      if (imuRef.current.length % 10 === 0) setImuN(imuRef.current.length); t += 16;
    }, 16);
  }, []);

  // ═══════════════════════════════════════
  // RUN
  // ═══════════════════════════════════════

  const run = useCallback(async () => {
    setPassive([]); setScore(0); setDecision(null); setActive(null); setGyroR([]); setFinalV(null);

    // iOS motion permission
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try { if ((await (DeviceMotionEvent as any).requestPermission()) !== "granted") { setStage("idle"); return; } } catch { setStage("idle"); return; }
    }

    // Countdown
    setStage("s1-countdown");
    for (let i = 3; i >= 1; i--) { setCd(i); await sleep(1000); }

    // Stage 1 · Passive
    setStage("s1-passive");
    imuRef.current = []; setImuN(0); hasSensRef.current = false;
    capRef.current = true; window.addEventListener("devicemotion", handleIMU);
    startRef.current = performance.now(); lastRef.current = 0;

    if (isSim) { setNoSensors(true); startSim(); } else { fallbackRef.current = setTimeout(() => { if (!hasSensRef.current && !simRef.current) { setNoSensors(true); setIsSim(true); startSim(); } }, 1500); }

    setElapsed(0);
    const t0 = performance.now();
    await new Promise<void>((resolve) => { const t = setInterval(() => { const e = (performance.now() - t0) / 1000; setElapsed(e); if (e >= DURATION) { clearInterval(t); resolve(); } }, 200); });

    window.removeEventListener("devicemotion", handleIMU); stopSim(); capRef.current = false;

    // Analysis — IMU-only passive evidence
    const events = detectJerkPeaks(imuRef.current);
    const density = events.length > 0 ? events.length / DURATION : 0;
    const rate = imuRef.current.length / DURATION;
    const pScore = Math.min(1, density / 2.0);

    const ee001: EngineEvidence = {
      engineId: "EE-001", timestamp: new Date().toISOString(),
      components: [{ engine: "EE-001", metric: "IMU_Presence", value: pScore, threshold: 0.3, status: rate > 5 ? (pScore >= 0.3 ? 'PASS' as const : "FAIL" as const) : "INSUFFICIENT" as const, explanation: `density ${density.toFixed(1)}/s rate ${rate.toFixed(1)}/s` }],
      diagnostics: [rate > 5 ? `✓ Passive Evidence — IMU presence ${rate.toFixed(0)} samples/s` : "✗ Passive Evidence — insufficient IMU"],
      confidence: Math.min(pScore, IMU_ONLY_CAP),
    };
    await hashEvidence(ee001).then((d) => { if (d) ee001.evidenceDigest = d; });

    const passiveEvidence = [ee001];
    const cappedScore = Math.min(pScore, IMU_ONLY_CAP);
    let dec: Decision = "reject";
    if (cappedScore < CONFIDENCE_REJECT) dec = "reject";
    else if (cappedScore >= CONFIDENCE_ACCEPT) dec = "accept";
    else dec = "escalate";

    setPassive(passiveEvidence); setScore(cappedScore); setDecision(dec);
    setStage("s1-result"); await sleep(3000);

    if (dec === "reject") {
      const v = evaluatePolicy({ policyId: "default", acceptThreshold: 0.70, rejectThreshold: 0.35 }, cappedScore);
      setFinalV(v);
      saveRun({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        engineId: "VS-001",
        timestamp: new Date().toISOString(),
        isSimulated: isSim,
        verdict: v,
        confidence: cappedScore,
        components: ee001.components.map((c) => ({ metric: c.metric, value: c.value, threshold: c.threshold, status: c.status })),
        diagnostics: ee001.diagnostics,
        passiveScore: cappedScore,
        decision: dec,
        imuCount: imuRef.current.length,
      });
      setStage("complete"); return;
    }
    if (dec === "accept") {
      const v = evaluatePolicy({ policyId: "default", acceptThreshold: 0.70, rejectThreshold: 0.35 }, cappedScore);
      setFinalV(v);
      saveRun({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        engineId: "VS-001",
        timestamp: new Date().toISOString(),
        isSimulated: isSim,
        verdict: v,
        confidence: cappedScore,
        components: ee001.components.map((c) => ({ metric: c.metric, value: c.value, threshold: c.threshold, status: c.status })),
        diagnostics: ee001.diagnostics,
        passiveScore: cappedScore,
        decision: dec,
        imuCount: imuRef.current.length,
      });
      setStage("complete"); return;
    }

    // ── Additional · Active Evidence ──
    const results: RoundResult[] = [];
    for (let r = 1; r <= TOTAL_ROUNDS; r++) {
      setCurrRound(r);
      const dir = pick(DIRECTIONS); const j = Math.floor(Math.random() * MAX_JITTER_MS);
      const totalCd = BASE_COUNTDOWN_MS + j; const steps = Math.ceil(totalCd / 1000);

      setStage("s2-countdown"); setTargetDir(dir); setLastGyro(null);
      for (let i = steps; i >= 0; i--) { setCdSec(i); if (i > 0) await sleep(1000); }

      setStage("s2-active");
      const rs: IMUSample[] = [];
      const rh = (e: DeviceMotionEvent) => { rs.push({ t: performance.now(), ax: round(e.acceleration?.x ?? e.accelerationIncludingGravity?.x), ay: round(e.acceleration?.y ?? e.accelerationIncludingGravity?.y), az: round(e.acceleration?.z ?? e.accelerationIncludingGravity?.z), rx: round(e.rotationRate?.alpha), ry: round(e.rotationRate?.beta), rz: round(e.rotationRate?.gamma), interval: 0 }); };
      window.addEventListener("devicemotion", rh);
      await sleep(CAPTURE_DURATION_MS);
      window.removeEventListener("devicemotion", rh);

      const a = analyzeRound(rs, dir);
      const gr: RoundResult = { round: r, direction: dir, jitterMs: j, directionMatch: a.directionMatch, magnitudeStatus: a.magnitudeStatus, angleDeg: a.angleDeg, peakG: a.peakG, sampleCount: rs.length };
      results.push(gr); setLastGyro(gr); setGyroR([...results]);
      setStage("s2-result"); await sleep(1200);
    }

    const act = buildChallengeEvidence(results);
    const chalComp = act.components.find((c) => c.metric === "ChallengeResponse");
    act.confidence = chalComp?.value ?? 0;
    await hashEvidence(act).then((d) => { if (d) act.evidenceDigest = d; });
    setActive(act);
    // Aggregate confidence from all evidence
    const aggConf = [...passiveEvidence, act].reduce((sum, e) => sum + (e.confidence || 0), 0) / 2;
    const v = evaluatePolicy({ policyId: "default", acceptThreshold: 0.70, rejectThreshold: 0.35 }, aggConf);
    setFinalV(v);
    saveRun({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      engineId: "VS-001",
      timestamp: new Date().toISOString(),
      isSimulated: isSim,
      verdict: v,
      confidence: aggConf,
      components: [...ee001.components, ...act.components].map((c) => ({ metric: c.metric, value: c.value, threshold: c.threshold, status: c.status })),
      diagnostics: [...ee001.diagnostics, ...act.diagnostics],
      roundResults: results.map((r) => ({ round: r.round, direction: r.direction, directionMatch: r.directionMatch, magnitudeStatus: r.magnitudeStatus, angleDeg: r.angleDeg, peakG: r.peakG, sampleCount: r.sampleCount })),
      passiveScore: cappedScore,
      decision: "escalate",
      imuCount: imuRef.current.length,
    });
    setStage("complete");
  }, [isSim, handleIMU, startSim]);

  // ── Render ──

  function sc(s: string) { return s === 'PASS' ? "#3fb950" : s === "FAIL" ? "#f85149" : "#d29922"; }
  function si(s: string) { return s === 'PASS' ? "✓" : s === "FAIL" ? "✗" : "—"; }
  function dl(d: Decision) { return d === "accept" ? "Accept — sufficient confidence" : d === "escalate" ? "Collecting additional evidence..." : "Reject — insufficient confidence"; }
  function dc(d: Decision) { return d === "accept" ? "#3fb950" : d === "escalate" ? "#d29922" : "#f85149"; }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/research" className="text-white/30 text-[11px] tracking-[0.2em] uppercase hover:text-white/60">← Research</Link>
        <span className="text-white/15 text-[9px] tracking-[0.3em] uppercase">Verification Session</span>
        <div className="w-16" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-white/85 text-[clamp(1.5rem,4vw,2rem)] font-light tracking-[0.02em]">
            Verification Confidence
          </h1>
          <p className="text-white/35 text-[14px] leading-relaxed max-w-sm mx-auto"
            style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
            How sure are we that a human is physically present — not an AI, not a replay, not a script?
          </p>
        </div>

        <ResearchStatus engineId="EE-001 + EE-003" />

        {/* ── Idle ── */}
        {stage === "idle" && (
          <div className="space-y-5">
            <button onClick={run} className="w-full py-5 bg-white/[0.04] border border-white/10 text-white/70 text-[15px] tracking-[0.05em] hover:bg-white/[0.08] hover:border-white/20 hover:text-white/90 transition-all">
              Collect Evidence
            </button>

            <details className="group">
              <summary className="text-white/20 text-[9px] tracking-[0.15em] text-center cursor-pointer hover:text-white/35 transition-colors list-none">How this works</summary>
              <div className="mt-3 p-4 border border-white/[0.04] bg-white/[0.01] text-[11px] text-white/35 leading-relaxed space-y-2"
                style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
                <p><span className="text-white/50">Stage 1</span> — 8 seconds of free motion. Your phone's IMU passively checks for the presence of a physically embodied entity.</p>
                <p><span className="text-white/50">Additional</span> — If confidence is uncertain, the system requests more evidence through a randomized gyroscope challenge.</p>
                <p className="text-white/20">Escalation is the default. Acceptance requires multiple independent signals.</p>
              </div>
            </details>

            <div className="text-center">
              <button onClick={() => setIsSim(!isSim)} className={`text-[9px] tracking-[0.1em] ${isSim ? "text-[#90c8ff]/40" : "text-white/12 hover:text-white/25"} transition-colors`}>
                {isSim ? "⚡ Simulating sensors" : "No sensors? Use simulation"}
              </button>
            </div>
          </div>
        )}

        {/* Active status bar — only visible when running */}
        {stage !== "idle" && stage !== "complete" && (
          <div className="p-2 border border-white/5 text-[9px] font-mono text-white/20 flex justify-between">
            <span>IMU: {imuN} | {isSim ? "SIM" : "LIVE"}</span>
            <span>{stage.includes("s1") ? "Stage 1" : stage.includes("s2") ? "Additional" : "● Complete"}</span>
          </div>
        )}

        {/* Stage 1 countdown + capture */}
        {stage === "s1-countdown" && <div className="flex flex-col items-center py-24 gap-6"><div className="text-white/20 text-[12px] tracking-[0.3em] uppercase">Stage 1 · Passive</div><div className="text-[100px] font-light text-[#90c8ff] leading-none">{cd}</div></div>}
        {stage === "s1-passive" && (
          <div className="space-y-4">
            <div className="text-center text-[10px] text-white/20 uppercase">Stage 1 · Passive Evidence</div>
            <div className="flex justify-between text-[10px]"><span className="text-[#90c8ff]/50">{elapsed.toFixed(1)}s / {DURATION}s</span></div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#90c8ff]/60 to-[#a371f7]/60 rounded-full" style={{ width: `${(elapsed / DURATION) * 100}%` }} /></div>
            <div className="p-3 border border-[#90c8ff]/10 text-[10px]"><span className="text-[#90c8ff]/40 text-[8px] uppercase">IMU</span><div className="text-white/50 font-mono">{imuN} samples</div></div>
            <div className="text-center p-8 border border-dashed border-white/10 text-white/30 text-[14px]">Move naturally.</div>
          </div>
        )}

        {/* Stage 1 result */}
        {stage === "s1-result" && decision && (
          <div className="space-y-4">
            <div className="p-4 border border-white/10 bg-white/[0.02] space-y-2">
              <div className="flex justify-between text-[10px]"><span className="text-white/20">Passive Confidence</span><span className="text-white/50 font-mono">{(score * 100).toFixed(0)}%</span></div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#f85149] via-[#d29922] to-[#3fb950] rounded-full" style={{ width: `${score * 100}%` }} /></div>
            </div>
            <div className="text-center p-6 border-2 space-y-3" style={{ borderColor: dc(decision) + "66", backgroundColor: dc(decision) + "0a" }}>
              <div className="text-white/20 text-[9px] tracking-[0.2em] uppercase">Decision</div>
              <div className="text-[18px] font-light" style={{ color: dc(decision) }}>{dl(decision)}</div>
            </div>
          </div>
        )}

        {/* Additional countdown/active/result */}
        {(stage.startsWith("s2-") || stage === "s2-active" || stage === "s2-result") && (
          <div className="flex gap-2 justify-center">
            {[1, 2, 3].map((r) => { const done = gyroR.length >= r; const active = currRound === r && (stage === "s2-countdown" || stage === "s2-active"); return <div key={r} className={`w-4 h-4 rounded-full transition-all ${done ? "bg-[#3fb950]/80" : active ? "bg-[#d29922] animate-pulse shadow-lg shadow-[#d29922]/50" : "bg-white/10"}`} />; })}
          </div>
        )}
        {stage === "s2-countdown" && (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="text-white/20 text-[10px]">Round {currRound}/3</div>
            <div className="text-[64px] leading-none" style={{ color: "#d29922" }}>{DIRECTION_ARROW[targetDir]}</div>
            <div className="gyro-preview-ring">
              <div className={`gyro-preview-dot ${targetDir === "←" ? "gyro-preview-ccw" : targetDir === "→" ? "gyro-preview-cw" : targetDir === "↑" ? "gyro-preview-up" : "gyro-preview-dn"}`} />
            </div>
            <div className="gyro-preview-label">
              {targetDir === "←" ? "rotate phone left" : targetDir === "→" ? "rotate phone right" : targetDir === "↑" ? "tilt top toward you" : "tilt top away"}
            </div>
            <div className="text-[48px] font-light text-[#d29922]">{cdSec}</div>
          </div>
        )}
        {stage === "s2-active" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="text-white/20 text-[10px]">Round {currRound}/3</div>
            <div className="text-[64px] leading-none animate-pulse" style={{ color: "#3fb950" }}>{DIRECTION_ARROW[targetDir]}</div>
            <div className="text-[#3fb950] text-[20px] font-bold animate-pulse tracking-widest">ROTATE {targetDir}</div>
          </div>
        )}
        {stage === "s2-result" && lastGyro && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="text-[64px]" style={{ color: lastGyro.directionMatch && lastGyro.magnitudeStatus === 'PASS' ? "#3fb950" : "#f85149" }}>{lastGyro.directionMatch && lastGyro.magnitudeStatus === 'PASS' ? "✓" : "✗"}</div>
            <div className="text-white/40">Round {lastGyro.round}{debug ? ` · ${lastGyro.angleDeg}°/s` : ""}</div>
          </div>
        )}

        {/* ── Complete ── */}
        {stage === "complete" && finalV && (
          <div className="space-y-6">
            <button onClick={() => { const lines = passive.concat(active || []).flatMap((e) => e.diagnostics); lines.unshift(`Verdict: ${finalV}`, `Passive: ${(score * 100).toFixed(0)}%`); navigator.clipboard.writeText(lines.join("\n")).then(() => { setCopySt("✓ Copied!"); setTimeout(() => setCopySt(""), 2000); }).catch(() => {}); }} className="w-full py-3 border border-[#d29922]/40 text-[#d29922]/70 text-[11px] tracking-[0.1em] uppercase hover:border-[#d29922] transition-all">{copySt || "📋 Copy All"}</button>
            <div className={`text-center p-6 border-2 ${finalV === 'PASS' ? "border-[#3fb950]/40 bg-[#3fb950]/[0.04]" : "border-[#f85149]/40 bg-[#f85149]/[0.04]"} space-y-3`}>
              <div className="text-white/20 text-[9px] tracking-[0.2em] uppercase">Verification Confidence</div>
              <div className="text-[48px] font-light" style={{ color: finalV === "PASS" ? "#3fb950" : finalV === "FAIL" ? "#f85149" : "#d29922" }}>{debug ? `${(score * 100).toFixed(0)}%` : `${(100 * [...passive, ...(active ? [active] : [])].reduce((s, e) => s + (e.confidence || 0), 0) / [...passive, ...(active ? [active] : [])].length).toFixed(0)}%`}</div>
            </div>
            {debug ? (
              [...passive, ...(active ? [active] : [])].map((ev) => (
                <div key={ev.engineId} className="p-4 border border-white/10 bg-white/[0.02] space-y-2">
                  <div className="flex justify-between"><span className="text-[10px] uppercase text-white/20">{ev.engineId === "EE-001" ? "Passive Evidence" : "Additional Evidence"}</span><span className="text-[8px] text-white/10">{ev.engineId}</span></div>
                  {ev.components.map((c) => <div key={c.metric} className="flex justify-between p-2 border border-white/5"><span className="text-[10px] text-white/40">{c.metric}: <span className="text-white/60">{c.value.toFixed(3)}</span></span><span style={{ color: sc(c.status) }}>{si(c.status)}</span></div>)}
                  {ev.diagnostics.filter((d) => d.startsWith("✓") || d.startsWith("✗") || d.startsWith("⚠")).map((d, i) => <div key={i} className={`text-[10px] font-mono ${d.startsWith("✓") ? "text-[#3fb950]/70" : d.startsWith("✗") ? "text-[#f85149]/70" : "text-[#d29922]/70"}`}>{d}</div>)}
                </div>
              ))
            ) : (
              <div className="space-y-3">
                {[...passive, ...(active ? [active] : [])].map((ev) => {
                  const passed = ev.components.filter((c) => c.status === "PASS").length;
                  const total = ev.components.length;
                  return (
                    <div key={ev.engineId} className="p-4 border border-white/10 bg-white/[0.02] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-white/50">{ev.engineId === "EE-001" ? "Presence Check" : "Motion Challenge"}</span>
                        <span className="text-[10px]" style={{ color: passed === total ? "#3fb950" : "#d29922" }}>{passed}/{total} checks passed</span>
                      </div>
                      {ev.diagnostics.filter((d) => d.startsWith("✓")).slice(0, 2).map((d, i) => <div key={i} className="text-[10px] text-[#3fb950]/60">✓ {d.replace(/^✓ /, "").replace(/\|.*$/, "").trim()}</div>)}
                    </div>
                  );
                })}
              </div>
            )}
            <button onClick={() => { setStage("idle"); setIsSim(false); setNoSensors(false); }} className="w-full py-4 border border-white/10 text-white/25 text-[11px] tracking-[0.2em] uppercase hover:border-white/30 transition-all">↻ New Session</button>
          </div>
        )}
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
