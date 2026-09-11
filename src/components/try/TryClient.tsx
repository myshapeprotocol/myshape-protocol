"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { mediaPipeToSST, normalizeSSTFrame } from "@/engine/skeleton-topology";
import {
  runContinuityVerificationAsync,
  PRESENCE_THRESHOLD,
  CHALLENGE_PASS_CONFIDENCE,
  type ContinuityVerificationResult,
} from "@/lib/continuity/verify-continuity";
import {
  DIRECTION_ARROW,
  DIRECTIONS,
  BASE_COUNTDOWN_MS,
  MAX_JITTER_MS,
  CAPTURE_DURATION_MS,
  pick,
  analyzeRound,
  gyroAxisFor,
  expectedSign,
  type Direction,
  type RoundResult,
} from "@/lib/evidence/gyro-challenge";
import { verifyReceipt } from "@/lib/evidence/cps0001";
import { saveRun, type ExperimentRun, type LoggedRound } from "@/lib/experiment-logger";
import {
  getDiagnosticSessions,
  copyDiagnosticSessions,
  downloadDiagnosticSessions,
} from "@/lib/try-instrumentation";
import type { JointPosition, SSTJointId } from "@/types/motion-vector";
import "./try.css";

const POSE_DURATION_MS = 8000;

type Phase = "idle" | "pose" | "challenge" | "processing" | "result";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function roundVal(v: number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return Math.round(v * 1000) / 1000;
}

// Observation-only per-round diagnostic. analyzeRound computes the SIGNED peak
// rotation internally (its `meanAngle` field) but RoundResult only persists the
// unsigned magnitude. This captures the signed value + axis so the /try readout
// can show the ACTUAL direction. No research logic, threshold, weight, or verdict
// is touched.
interface RoundDirectionDiag {
  round: number;
  axis: "rx" | "ry";
  signedPeakDegS: number;
  pass: boolean;
}

export default function TryClient() {
  const [phase, setPhase] = useState<Phase>("idle");
    const [errorMsg, setErrorMsg] = useState("");
  const [poseReady, setPoseReady] = useState(false);

  // BATCH-005A — pre-flight entry: users are walked through a thin
  // "Ready to verify?" layer before anything starts, then a motion-access
  // explicit allow step. start() below is unchanged (permission, camera,
  // challenge semantics untouched) — only the trigger is split into two taps.
  const [idleStage, setIdleStage] = useState<"intro" | "consent">("intro");

  const [poseCountdown, setPoseCountdown] = useState(0);

  // REAL-TRY-004 field diagnostic (display-only): flips the bottom-left load
  // marker from "V" to "V ✓" once client JS is actually executing, so the
  // operator can distinguish a hydrated page from static HTML on the phone.
  const [markerLive, setMarkerLive] = useState(false);
  useEffect(() => {
    setMarkerLive(true);
  }, []);

  // Challenge state
  const [currentRound, setCurrentRound] = useState(1);
  const [targetDir, setTargetDir] = useState<Direction>("→");
  const [countdownSec, setCountdownSec] = useState(0);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [lastRoundResult, setLastRoundResult] = useState<RoundResult | null>(null);
  const [roundDirectionDiags, setRoundDirectionDiags] = useState<RoundDirectionDiag[]>([]);

  // Result state
  const [result, setResult] = useState<ContinuityVerificationResult | null>(null);
  const [receiptStatus, setReceiptStatus] = useState<"valid" | "invalid" | "">("");
  const [showReceiptJson, setShowReceiptJson] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<PoseInstance | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const sstFramesRef = useRef<Array<Record<SSTJointId, JointPosition>>>([]);
  const timestampsRef = useRef<number[]>([]);
  const imuSamplesRef = useRef<Array<{ t: number; ax: number; ay: number; az: number; rx: number; ry: number; rz: number }>>([]);
  const targetDirRef = useRef<Direction>("→");
    const isCapturingRef = useRef(false);
  // Keyed by receiptId to guarantee a completed run is persisted exactly once,
  // even across React StrictMode effect double-invocation.
  const savedRunIdRef = useRef<string | null>(null);

  // ── Secure-context gate (production only) ─────────────────────
  // Camera/motion APIs do not exist on insecure origins (e.g. a phone opening
  // the dev box via http://<lan-ip>:3000). Originally we gated these uniformly,
  // which forced an extra "Open Secure Preview" hop on LAN HTTP in dev.
  //
  // Dev/bench decision: in NON-production we allow the local LAN flow to proceed
  // straight to Start Verification (fast phone↔desktop iteration). Browser-level
  // camera/IMU restrictions on insecure origins still apply if the phone hits
  // them — if that happens, use the HTTPS preview (https://<lan-ip>:3443).
  // The strict HTTPS requirement remains ONLY in production builds.
  const [needsSecure, setNeedsSecure] = useState(false);
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      typeof window !== "undefined" &&
      !window.isSecureContext
    ) {
      setNeedsSecure(true);
    }
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // ── Experiment logging (observational only) ────────────────────────
  // Persists one ExperimentRun per completed /try verification, keyed on the
  // receiptId. This effect only READS the finished result — it never writes
  // into the verification state machine, the verdict, or any EE score.
  useEffect(() => {
    if (!result) return;
    const id = result.receipt.receiptId;
    if (!id || savedRunIdRef.current === id) return;
    savedRunIdRef.current = id;

    const passingRounds = roundResults.filter(
      (r) => r.directionMatch && r.magnitudeStatus === "PASS",
    ).length;
    const ee003Score = roundResults.length > 0 ? passingRounds / roundResults.length : 0;

    const roundResultsPersisted: LoggedRound[] = roundResults.map((r) => {
      const diag = roundDirectionDiags.find((x) => x.round === r.round);
      return {
        round: r.round,
        direction: r.direction,
        directionMatch: r.directionMatch,
        magnitudeStatus: r.magnitudeStatus,
        angleDeg: r.angleDeg,
        peakG: r.peakG,
        sampleCount: r.sampleCount,
        // EE-003 forensics captured for comparability — not consumed by verification
        axis: diag?.axis,
        expectedSign: expectedSign(r.direction),
        signedPeakDegS: diag?.signedPeakDegS,
      };
    });

    const run: ExperimentRun = {
      id,
      engineId: "EE-003",
      timestamp: result.receipt.interval.end,
      isSimulated: false,
      verdict: result.verified ? "PASS" : "FAIL",
      confidence: result.confidence,
      components: [
        {
          metric: "EE-001.PES",
          value: result.pes,
          threshold: PRESENCE_THRESHOLD,
          status: result.pes >= PRESENCE_THRESHOLD ? "PASS" : "FAIL",
        },
        {
          metric: "EE-003.ChallengeResponse",
          value: ee003Score,
          threshold: 1,
          status: ee003Score >= 1 ? "PASS" : "FAIL",
        },
      ],
      diagnostics: [],
      roundResults: roundResultsPersisted,
    };

    saveRun(run);
  }, [result, roundResults, roundDirectionDiags]);

  // Attach the camera stream once the <video> element actually mounts.
  // The <video> only renders during the "pose" phase, so assigning srcObject
  // inside start() (before setPhase("pose")) finds a null ref and is a no-op —
  // that left MediaPipe with no video input and produced 0 pose frames.
  useEffect(() => {
    if (phase === "pose" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [phase]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (poseRef.current) {
      try {
        poseRef.current.close();
      } catch {
        /* ignore */
      }
    }
    poseRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }
  }, []);

  const handleIMU = useCallback((e: DeviceMotionEvent) => {
    if (!isCapturingRef.current) return;
    imuSamplesRef.current.push({
      t: performance.now(),
      ax: roundVal(e.acceleration?.x ?? e.accelerationIncludingGravity?.x),
      ay: roundVal(e.acceleration?.y ?? e.accelerationIncludingGravity?.y),
      az: roundVal(e.acceleration?.z ?? e.accelerationIncludingGravity?.z),
      rx: roundVal(e.rotationRate?.alpha),
      ry: roundVal(e.rotationRate?.beta),
      rz: roundVal(e.rotationRate?.gamma),
    });
  }, []);

  // ── EE-003: one challenge round ──
  const runRound = useCallback(
    async (roundNum: number, dir: Direction): Promise<RoundResult> => {
      const jitterMs = Math.floor(Math.random() * MAX_JITTER_MS);
      const totalCountdown = BASE_COUNTDOWN_MS + jitterMs;
      const steps = Math.ceil(totalCountdown / 1000);

      setTargetDir(dir);
      targetDirRef.current = dir;
      for (let i = steps; i >= 0; i--) {
        setCountdownSec(i);
        if (i > 0) await sleep(1000);
      }

      imuSamplesRef.current = [];
      isCapturingRef.current = true;
      const captureStart = performance.now();
      const timer = setInterval(() => {
        setCaptureProgress(((performance.now() - captureStart) / CAPTURE_DURATION_MS) * 100);
      }, 50);
      await sleep(CAPTURE_DURATION_MS);
      clearInterval(timer);
      isCapturingRef.current = false;
      setCaptureProgress(100);

      const analysis = analyzeRound(imuSamplesRef.current, dir);
      const rr: RoundResult = {
        round: roundNum,
        direction: dir,
        jitterMs,
        angleDeg: Math.round(analysis.angleDeg),
        directionMatch: analysis.directionMatch,
        peakG: Math.round(analysis.peakG * 100) / 100,
        magnitudeStatus: analysis.magnitudeStatus,
        sampleCount: imuSamplesRef.current.length,
      };
      setLastRoundResult(rr);
      setRoundResults((prev) => [...prev, rr]);
      // Observation-only: record the signed peak so the readout can show actual
      // direction. Uses only analyzeRound's already-computed `meanAngle` (signed
      // peak) — no new analysis, no verdict change.
      setRoundDirectionDiags((prev) => [
        ...prev,
        {
          round: roundNum,
          axis: gyroAxisFor(dir),
          signedPeakDegS: Math.round(analysis.meanAngle),
          pass: analysis.directionMatch && analysis.magnitudeStatus === "PASS",
        },
      ]);
      await sleep(1200);
      return rr;
    },
    [],
  );

  // ── Full flow ──
    const start = useCallback(async () => {
    setErrorMsg("");
    setResult(null);
    setPoseReady(false);

    // Defensive re-check inside the handler (covers any entry path that skips
    // the render-level gate): never run the flow on an insecure origin.
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setNeedsSecure(true);
      setErrorMsg("Camera and motion verification require a secure connection.");
      return;
    }

    setReceiptStatus("");
    setShowReceiptJson(false);
    sstFramesRef.current = [];
    timestampsRef.current = [];
    setRoundResults([]);
    setLastRoundResult(null);
    setRoundDirectionDiags([]);

    // 1) Motion permission FIRST — iOS requires DeviceMotionEvent.requestPermission()
    //    to run synchronously inside the tap gesture. Any prior `await` (e.g. camera)
    //    consumes the transient activation and iOS throws NotAllowedError
    //    (REAL-TRY-001 Step I). Camera follows below.
    if (typeof DeviceMotionEvent !== "undefined") {
      const dm = DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (typeof dm.requestPermission === "function") {
        try {
          const perm = await Promise.race([
            dm.requestPermission(),
            new Promise<string>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
          ]);
          if (perm !== "granted") {
            setErrorMsg("Motion sensor permission denied. Enable Motion & Orientation Access in browser settings.");
            setPhase("idle");
            return;
          }
        } catch {
          setErrorMsg("Motion sensor unavailable. Ensure you're on HTTPS and try again.");
          setPhase("idle");
          return;
        }
      }
    } else {
      // Fix B: explicit unsupported state instead of silently proceeding to a
      // guaranteed FAIL with zero sensor samples.
      setErrorMsg("Motion sensors are not available on this device. Please use a compatible mobile device.");
      setPhase("idle");
      return;
    }

    // 2) Camera (EE-001 requires MediaPipe pose)
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
    } catch {
      setErrorMsg(
        "Camera unavailable — this verification needs the camera to observe your motion. " +
          "Use a device with a camera over HTTPS.",
      );
      setPhase("idle");
      return;
    }
    streamRef.current = stream;

    // 3) Init MediaPipe pose
    // MediaPipe Pose 0.5 exposes no onError and surfaces runtime failures only
    // via send() rejection and/or onResults never firing (see below). Track both
    // so an infra failure is reported as one, never as "insufficient frames".
    const POSE_MODEL_TIMEOUT_MS = 10000;
    let modelReady = false;
    let lastSendError: string | null = null;
    let resolveModelReady: (() => void) | null = null;
    let modelLoadTimer: ReturnType<typeof setTimeout> | null = null;
    try {
      const { Pose } = await import("@mediapipe/pose");
      const pose = new Pose({
        locateFile: (f: string) => {
          if (!f || f.includes("undefined")) {
            throw new Error(`[TryClient] MediaPipe locateFile received an invalid asset path: "${f}"`);
          }
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${f}`;
        },
      });

      pose.setOptions({
        modelComplexity: 0,
        // Raw pose — EE-001's noise residual measures real joint noise, so we do
        // NOT apply MediaPipe temporal smoothing (unlike motion-demo).
        smoothLandmarks: false,
        minDetectionConfidence: 0.5,
      });
      pose.onResults((results: PoseResult) => {
        if (results.poseLandmarks && phaseRef.current === "pose") {
          modelReady = true;
          setPoseReady(true);
          resolveModelReady?.();
          const now = performance.now();
          const sst = normalizeSSTFrame(mediaPipeToSST(results.poseLandmarks));
          sstFramesRef.current.push(sst);
          timestampsRef.current.push(now);
        }
      });

      poseRef.current = pose;

      const feedLoop = async () => {
        const v = videoRef.current;
        if (v && poseRef.current && v.readyState >= 2) {
          try {
            await poseRef.current.send({ image: v });
          } catch (err: unknown) {
            // EE-002 FIX: surface send() errors instead of swallowing them. They
            // are the primary signal that the Pose WASM model / web-worker failed
            // to init or run. Swallowing left onResults silent -> 0 frames -> the
            // misleading "Not enough pose frames" message.
            lastSendError = err instanceof Error ? err.message : String(err);
            console.error("[TryClient] pose.send() failed:", err);
            resolveModelReady?.();
            if (modelLoadTimer) clearTimeout(modelLoadTimer);
            return;
          }

        }
        // Gate on poseRef (set synchronously) rather than phaseRef — phaseRef is
        // still "idle" on the first call here because feedLoop() runs immediately
        // after setPhase("pose"), before the phase-sync effect commits. Gating on
        // phaseRef killed the loop on its first tick (no rAF scheduled → 0 frames).
        // stopCamera() nulls poseRef, which stops the loop.
        if (poseRef.current) requestAnimationFrame(feedLoop);
      };

      // 4) Pose phase — GATE on model readiness first (up to POSE_MODEL_TIMEOUT_MS).
      //    Only a model that actually emits output proceeds to the capture window.
      //    EE-002 fix: keep "did not initialize" separate from "not enough frames".
      setPhase("pose");
      feedLoop();

      await new Promise<void>((resolve) => {
        resolveModelReady = resolve;
        modelLoadTimer = setTimeout(() => resolve(), POSE_MODEL_TIMEOUT_MS);
      });

      // Model never produced output (or send() threw) -> infra failure, NOT user error.
      if (!modelReady) {
        if (modelLoadTimer) clearTimeout(modelLoadTimer);
        stopCamera();
        setErrorMsg(
          lastSendError
            ? `Pose model error — the on-device model could not run: ${lastSendError}`
            : `Pose model did not initialize within ${POSE_MODEL_TIMEOUT_MS}ms. This is usually a WebAssembly / web-worker load failure — check the browser console for the MediaPipe error.`,
        );
        setPhase("idle");
        return;
      }

      // Model confirmed working — run the 8s capture window. Clear frames
      // accumulated during model warm-up so the window matches the original 8s.
      sstFramesRef.current = [];
      timestampsRef.current = [];
      const poseStart = performance.now();
      const poseTimer = setInterval(() => {
        setPoseCountdown(Math.max(0, Math.ceil((POSE_DURATION_MS - (performance.now() - poseStart)) / 1000)));
      }, 200);
      setPoseCountdown(Math.ceil(POSE_DURATION_MS / 1000));
      await sleep(POSE_DURATION_MS);
      clearInterval(poseTimer);
      setPoseCountdown(0);
      stopCamera();

      const frames = sstFramesRef.current;
      // "Not enough frames" is ONLY reported when the model was confirmed ready
      // but simply did not see enough valid poses within the window.
      if (frames.length < 8) {
        setErrorMsg("Not enough pose frames captured. Ensure your face and body are well-lit and in frame, then try again.");
        setPhase("idle");
        return;
      }


      // 5) Challenge phase (3 rounds)
      setPhase("challenge");
      window.addEventListener("devicemotion", handleIMU);
      const allResults: RoundResult[] = [];
      try {
        setCurrentRound(1);
        allResults.push(await runRound(1, pick(DIRECTIONS)));
        setCurrentRound(2);
        allResults.push(await runRound(2, pick(DIRECTIONS)));
        setCurrentRound(3);
        allResults.push(await runRound(3, pick(DIRECTIONS)));
      } finally {
        window.removeEventListener("devicemotion", handleIMU);
        isCapturingRef.current = false;
      }

      // 6) Compose + verify
      setPhase("processing");
      await sleep(400);
      const verification = await runContinuityVerificationAsync(
        frames as Array<Record<number, JointPosition>>,
        timestampsRef.current,
        allResults,
        8,
      );
      if (!verification) {
        setErrorMsg("Unable to verify — insufficient signal collected.");
        setPhase("idle");
        return;
      }
      setResult(verification);
      setPhase("result");
    } catch (err) {
      stopCamera();
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Verification failed: ${msg}`);
      setPhase("idle");
    }
  }, [handleIMU, runRound, stopCamera]);

    const reset = useCallback(() => {
    setPhase("idle");
    setErrorMsg("");
    setResult(null);
    setPoseReady(false);

    setReceiptStatus("");
    setShowReceiptJson(false);
    setCurrentRound(1);
    setRoundResults([]);
    setLastRoundResult(null);
    setRoundDirectionDiags([]);
    sstFramesRef.current = [];
    timestampsRef.current = [];
  }, []);

  const handleVerifyReceipt = useCallback(() => {
    if (!result) return;
    const v = verifyReceipt(result.receipt);
    setReceiptStatus(v.status === "VALID" ? "valid" : "invalid");
  }, [result]);

  const verified = result?.verified ?? false;
  const confidencePct = result ? Math.round(result.confidence * 100) : 0;

  // Per-engine confidence read straight from the signed receipt evidence blocks.
  // Observation only: these are the EXACT values that fed evaluateTwoStage
  // (weakest-link min of EE-001 and EE-003). No research logic is modified here.
  const ee001Conf = result?.receipt.evidence.find((e) => e.engineId === "EE-001")?.confidence ?? 0;
  const ee003Conf = result?.receipt.evidence.find((e) => e.engineId === "EE-003")?.confidence ?? 0;

  // Stage flags derived from the SAME confidence values and thresholds that
  // already fed evaluateTwoStage. Observation-only mirror: no new verdict, just
  // surfacing Stage 1 / Stage 2 from the existing result.
  const stage1Pass = ee001Conf >= PRESENCE_THRESHOLD;
  const stage2Pass = ee003Conf >= CHALLENGE_PASS_CONFIDENCE;

  return (
    <div className="try-root">
      <div className="try-shell">
        {/* Header */}
        <header className="try-header">
          <span className="try-wordmark">MYSHAPE</span>
          <span className="try-kicker">Experimental Continuity Verification</span>
        </header>

        {/* ── IDLE — BATCH-005A pre-flight: intro → motion consent → start ── */}
        {phase === "idle" && (
          <section className="try-center">
            <p className="try-eyebrow">RESEARCH PREVIEW</p>

            {needsSecure ? (
              <>
                <h1 className="try-title">Prove continuity.</h1>
                <p className="try-subtitle">
                  This is a research preview. No identity information is required.
                  <br />
                  Nothing is uploaded — verification runs on this device.
                </p>
                {errorMsg && <div className="try-error">{errorMsg}</div>}
                <a
                  className="try-cta"
                  href={`https://${window.location.hostname}:3443${window.location.pathname}`}
                >
                  Open Secure Preview
                </a>
                <p className="try-footnote">
                  You opened this preview over HTTP, which cannot access the camera or
                  motion sensors. Tap above to switch to the encrypted local preview,
                  then run the verification there.
                </p>
              </>
            ) : idleStage === "intro" ? (
              <>
                <h1 className="try-title">Ready to verify?</h1>
                <p className="try-subtitle">
                  MyShape will use your device&apos;s camera and motion to verify
                  continuity.
                  <br />
                  Nothing is uploaded — verification runs on this device.
                </p>
                {errorMsg && <div className="try-error">{errorMsg}</div>}
                <button className="try-cta" onClick={() => setIdleStage("consent")}>
                  Continue
                </button>
                <p className="try-footnote">
                  You&apos;ll grant camera + motion access, face the camera for a few seconds,
                  then rotate your phone to follow on-screen directions. ~20 seconds total.
                </p>
              </>
            ) : (
              <>
                <h1 className="try-title">Motion access required</h1>
                <p className="try-subtitle">
                  Allow motion access to continue. Your phone&apos;s motion sensors verify
                  continuity — nothing is uploaded.
                </p>
                {errorMsg && <div className="try-error">{errorMsg}</div>}
                <button className="try-cta" onClick={start}>
                  Allow Motion Access
                </button>
                <button
                  className="try-btn"
                  onClick={() => setIdleStage("intro")}
                >
                  ← Back
                </button>
                <p className="try-footnote">
                  Camera + motion access is requested only for this verification session.
                </p>
              </>
            )}

            {/* Load marker (display-only): confirms tonight's build is live on this
                device. Distinguishes a fresh page from a stale cached one. */}
            <span aria-hidden style={{ position: "fixed", left: 8, bottom: 6, fontSize: 10, opacity: 0.45 }}>
              {markerLive ? "V ✓" : "V"}
            </span>

          </section>
        )}

        {/* ── POSE ── */}
        {phase === "pose" && (
          <section className="try-center">
            <div className="try-camera-frame">
              <video ref={videoRef} playsInline muted className="try-video" />
              <div className="try-countdown">{poseCountdown}</div>
            </div>
            <p className="try-instruction">
              {poseReady
                ? "Face the camera. Stay natural. Move slightly."
                : "Loading pose model…"}
            </p>
            <p className="try-footnote">
              {poseReady
                ? `Collecting presence entropy — ${sstFramesRef.current.length} frames`
                : "Waiting for the on-device model to initialize…"}
            </p>

          </section>
        )}

        {/* ── CHALLENGE ── */}
        {phase === "challenge" && (
          <section className="try-center">
            <p className="try-eyebrow">Challenge {currentRound}/3</p>
            <div className="try-arrow">{DIRECTION_ARROW[targetDir]}</div>
            <p className="try-instruction">
              {targetDir === "←" ? "rotate phone left" : targetDir === "→" ? "rotate phone right" : targetDir === "↑" ? "tilt top toward you" : "tilt top away"}
            </p>
            {countdownSec > 0 ? (
              <div className="try-countdown">{countdownSec}</div>
            ) : (
              <div className="try-rotate">ROTATE NOW</div>
            )}
            <div className="try-progress-track">
              <div className="try-progress-fill" style={{ width: `${captureProgress}%` }} />
            </div>
            {lastRoundResult && (
              <p className="try-round-result">
                R{lastRoundResult.round} {DIRECTION_ARROW[lastRoundResult.direction]}: {lastRoundResult.directionMatch ? "match ✓" : "match ✗"} | {lastRoundResult.angleDeg}°/s vs 40 | {lastRoundResult.magnitudeStatus} | n={lastRoundResult.sampleCount}
              </p>
            )}
          </section>
        )}

        {/* ── PROCESSING ── */}
        {phase === "processing" && (
          <section className="try-center">
            <div className="try-spinner" />
            <p className="try-instruction">Composing evidence…</p>
          </section>
        )}

        {/* ── RESULT ── */}
        {phase === "result" && result && (
          <section className="try-center">
            <div className={`try-verdict ${verified ? "is-verified" : "is-not"}`}>
              {verified ? "CONTINUITY VERIFIED" : "CONTINUITY NOT VERIFIED"}
            </div>
            <p className="try-confidence">Confidence: {confidencePct}%</p>

            {/* Observation-only readout. No research logic touched. */}
            <div className="try-diag try-diag-stack">
              <span>EE-001 {ee001Conf.toFixed(3)}</span>
              <span>EE-003 {ee003Conf.toFixed(3)}</span>
              <span>Stage 1 (EE-001 ≥ {PRESENCE_THRESHOLD.toFixed(2)}): {stage1Pass ? "PASS" : "FAIL"}</span>
              <span>Stage 2 (EE-003 ≥ {CHALLENGE_PASS_CONFIDENCE.toFixed(2)}): {stage2Pass ? "PASS" : "FAIL"}</span>
              <span>combined {result.confidence.toFixed(3)} → {verified ? "VERIFIED" : "NOT VERIFIED"}</span>
            </div>
            <div className="try-diag try-diag-stack">
              {roundResults.map((r) => {
                const d = roundDirectionDiags.find((x) => x.round === r.round);
                const actualSign = d ? `${d.signedPeakDegS >= 0 ? "+" : ""}${d.signedPeakDegS}` : "?";
                const axis = d ? d.axis : "?";
                const roundPass = r.directionMatch && r.magnitudeStatus === "PASS";
                return (
                  <span key={r.round}>
                    R{r.round} req {DIRECTION_ARROW[r.direction]} ({axis}, expect {expectedSign(r.direction) >= 0 ? "+" : "-"})
                    {" | "}actual {actualSign}°/s on {axis}
                    {" | "}peak {r.angleDeg}°/s {r.peakG.toFixed(2)}g
                    {" | "}match {r.directionMatch ? "✓" : "✗"} {r.magnitudeStatus}
                    {" | "}{roundPass ? "PASS" : "FAIL"}
                  </span>
                );
              })}
            </div>

            <p className="try-subtitle">
              {verified
                ? "Experimental verification completed."
                : "The signal was insufficient or inconsistent. Try again and follow the movement directions more closely."}
            </p>

            {/* Receipt */}
            <div className="try-receipt">
              <div className="try-receipt-title">CONTINUITY RECEIPT</div>
              <div className="try-receipt-row"><span>Status</span><span>{verified ? "VERIFIED" : "NOT VERIFIED"}</span></div>
              <div className="try-receipt-row"><span>Confidence</span><span>{(result.confidence).toFixed(2)}</span></div>
              <div className="try-receipt-row"><span>Timestamp</span><span>{result.receipt.interval.end}</span></div>
              <div className="try-receipt-row"><span>Receipt ID</span><span className="try-mono">{result.receipt.receiptId}</span></div>
              <div className="try-receipt-row"><span>Protocol</span><span>CPS-0001 v{result.receipt.protocolVersion}</span></div>
              <div className="try-receipt-row"><span>Engines</span><span>{result.evidenceEngines.join(" + ")}</span></div>

              <div className="try-receipt-actions">
                <button className="try-btn" onClick={() => setShowReceiptJson((s) => !s)}>
                  {showReceiptJson ? "Hide Receipt" : "View Receipt"}
                </button>
                <button className="try-btn" onClick={handleVerifyReceipt}>
                  Verify Receipt
                </button>
              </div>

              {receiptStatus && (
                <div className={`try-receipt-status ${receiptStatus === "valid" ? "is-valid" : "is-invalid"}`}>
                  {receiptStatus === "valid" ? "✓ Receipt valid — V₁–V₆ passed" : "✗ Receipt failed verification"}
                </div>
              )}

              {showReceiptJson && (
                <pre className="try-receipt-json">{JSON.stringify(result.receipt, null, 2)}</pre>
              )}
                                                </div>

            {/* Research Diagnostics (developer/research use only) */}
            {getDiagnosticSessions().length > 0 && (
            <div className="try-diag">
              <div className="try-diag try-diag-header">RESEARCH DIAGNOSTICS</div>
              <div className="try-actions">
                <button className="try-btn" onClick={() => { void copyDiagnosticSessions(); }}>Copy JSON</button>
                <button className="try-btn" onClick={() => { downloadDiagnosticSessions(); }}>Download JSON</button>
              </div>
            </div>
            )}

            <div className="try-disclaimer">
              <strong>Experimental research preview.</strong> This is not production authentication
              or identity verification. Benchmarks use limited real-world data; replay
              and spoofing research is ongoing. The receipt is self-issued by this device.
            </div>

            <div className="try-actions">
              <button className="try-cta" onClick={reset}>Try Again</button>
              <Link className="try-btn" href="/verify-receipt">Verify another receipt →</Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
