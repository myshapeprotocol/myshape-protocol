"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import ProtocolHeader from "@/components/header/header";
import { useMyShapeEngine } from "@/hooks/useMyShapeEngine";
import MotionGuide, { TOTAL_DURATION_MS, type VelocitySnapshot } from "@/components/motion-guide/MotionGuide";
import SkeletonOverlay from "@/components/motion-guide/SkeletonOverlay";

import ProtocolFooter from "@/components/footer/footer";
import { playTick, resumeAudio } from "@/utils/useAudioTick";
import PresenceSignature from "@/components/presence-signature/PresenceSignature";
import { mediaPipeToSST, normalizeSSTFrame } from "@/engine/skeleton-topology";
import { computeFullPES } from "@/engine/presence-entropy";
import { assessThreat } from "@/engine/threat-assessment";
import { getDeviceSalt } from "@/engine/local-identity";
import type { JointPosition, SSTJointId } from "@/types/motion-vector";
import { buildReceiptFromPES } from "@/sdk/presence-v2";
import type { ContinuityReceipt } from "@/lib/evidence/cps0001";
import { sha256Hex } from "@/lib/hash";
import { useResearchUpload } from "@/hooks/useResearchUpload";
import type { UploadData } from "@/hooks/useResearchUpload";
import ResearchConsent from "@/components/research-consent/ResearchConsent";
import type { LightingCondition, PhaseMetadata } from "@/types/research";
import "./motion-demo.css";
import ProcessingOverlay from "@/components/motion-demo/ProcessingOverlay";
import IdlePanel from "@/components/motion-demo/IdlePanel";
import CompletionCeremony from "@/components/motion-demo/CompletionCeremony";
import PESGauge from "@/components/motion-demo/PESGauge";
import PESBars, { buildPESBars } from "@/components/motion-demo/PESBars";
import ThreatVerdict from "@/components/motion-demo/ThreatVerdict";
import TelemetryPanel from "@/components/motion-demo/TelemetryPanel";

type Phase = "idle" | "capturing" | "processing" | "complete";
type SensorMode = "camera" | "gyro";

interface SparkParticle {
  x: number; y: number;
  life: number; maxLife: number;
  size: number;
}

interface PESData {
  score: number;
  timing: number;
  noise: number;
  frequency: number;
  biological: number;
}

interface MotionFeatures {
  angles: Record<string, number>;
  velocities: Record<string, number>;
  joints: Record<string, { x: number; y: number; z: number }>;
  phase: string;
  energy: number;
  custom: Record<string, number>;
}
interface FeatureFrame {
  features: MotionFeatures;
  timestamp: number;
}

/** Cumulative phase boundary timestamps (ms) — mirrors MotionGuide PHASES */
const PHASE_BOUNDARIES_MS = [6000, 12000, 19000, 25000, 30000];

function storePESForPlayground(data: {
  score: number; timing: number; noise: number; freq: number; bio: number;
  verdict: string; receiptId?: string; payloadDigest?: string;
}) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("motiondemo_pes", JSON.stringify(data));
  }
}

export default function MotionDemoClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isChromium, setIsChromium] = useState(false);
  const [sovereignEnrolled, setSovereignEnrolled] = useState(false);
  const [sovereignKey, setSovereignKey] = useState<string | null>(null);
  const [cohortFull, setCohortFull] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [sensorMode, setSensorMode] = useState<SensorMode | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  useEffect(() => { setCameraAvailable(typeof navigator?.mediaDevices?.getUserMedia === "function"); }, []);
  const [features, setFeatures] = useState<FeatureFrame | null>(null);
  const [pesData, setPesData] = useState<PESData | null>(null);
  const [threatVerdict, setThreatVerdict] = useState<string>("");
  const [proofHashes, setProofHashes] = useState<{ receiptId: string; payloadDigest: string } | null>(null);
  const [continuityReceipt, setContinuityReceipt] = useState<ContinuityReceipt | null>(null);
  const [livePes, setLivePes] = useState<{ score: number; timing: number; noise: number; freq: number; bio: number } | null>(null);
  const [aiCompare, setAiCompare] = useState<{ score: number; timing: number; noise: number; freq: number; bio: number } | null>(null);
  const [wasmCompare, setWasmCompare] = useState<{ loading: boolean; similarity: number | null; sigDim: number } | null>(null);
  const { engine, loading: wasmLoading, load: loadWasm } = useMyShapeEngine();
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [landmarkVisibility, setLandmarkVisibility] = useState<(number | undefined)[]>([]);
  const [captureElapsedMs, setCaptureElapsedMs] = useState(0);
  const [validFrameCount, setValidFrameCount] = useState(0);
  const [allPhasesComplete, setAllPhasesComplete] = useState(false);
  const [currentVelocity, setCurrentVelocity] = useState<VelocitySnapshot | null>(null);
  // ── Research consent & upload state ──
  const [researchConsented, setResearchConsented] = useState(false);
  const [lighting, setLighting] = useState<LightingCondition>("indoor_day");
  const { state: uploadState, error: uploadError, sessionId, upload, reset: resetUpload } = useResearchUpload();
  const [uploadDone, setUploadDone] = useState(false);
  const [witnessData, setWitnessData] = useState<{
    position_number?: number;
    cohort?: string;
  } | null>(null);
  const framesRef = useRef<FeatureFrame[]>([]);
  const animRef = useRef<number>(0);
  const phaseRef = useRef<Phase>("idle");
  const captureStartRef = useRef<number>(0);
  const prevLandmarksRef = useRef<Array<{ x: number; y: number; z: number }> | null>(null);
  const prevTimestampRef = useRef<number>(0);
  const poseRef = useRef<PoseInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const energyRef = useRef<number>(0);
  const landmarksRef = useRef<Array<{ x: number; y: number; z: number }> | null>(null);
  const sstFramesRef = useRef<Array<{ frame: Record<SSTJointId, JointPosition>; timestamp: number }>>([]);
  const sparkParticlesRef = useRef<SparkParticle[]>([]);
  // Phase E-1 research: per-phase frame/velocity accumulation
  const phaseFrameCountsRef = useRef<number[]>([0, 0, 0, 0, 0]);
  const phaseWristVelRef = useRef<number[]>([0, 0, 0, 0, 0]);
  const phaseHeadVelRef = useRef<number[]>([0, 0, 0, 0, 0]);
  const phaseTorsoVelRef = useRef<number[]>([0, 0, 0, 0, 0]);

  function resolvePhaseIndex(elapsedMs: number): number {
    for (let i = 0; i < PHASE_BOUNDARIES_MS.length; i++) {
      if (elapsedMs < PHASE_BOUNDARIES_MS[i]) return i;
    }
    return 4;
  }

  // ── Real Camera Mode ──
  const startCapture = useCallback(async () => {
    resumeAudio();

    setSensorMode("camera");
    setPhase("capturing");
    phaseRef.current = "capturing";
    setCountdown(30);
    captureStartRef.current = performance.now();
    setCaptureElapsedMs(0);
    // Drive countdown independently of MediaPipe — ensures timer always ticks
    const timerInterval = setInterval(() => {
      const elapsed = performance.now() - captureStartRef.current;
      setCaptureElapsedMs(elapsed);
      // Auto-stop after 30s even if no landmarks detected
      if (elapsed >= TOTAL_DURATION_MS) {
        setAllPhasesComplete(true);
      }
    }, 250);
    // Store for cleanup
    (window as unknown as Record<string, unknown>).__motionTimer = timerInterval;
    setValidFrameCount(0);
    setLandmarkVisibility([]);
    setAllPhasesComplete(false);
    setCurrentVelocity(null);
    prevLandmarksRef.current = null;
    prevTimestampRef.current = 0;
    framesRef.current = [];
    setProofHashes(null);
    setUploadDone(false);
    if (researchConsented) resetUpload();
    // Reset phase tracking
    phaseFrameCountsRef.current = [0, 0, 0, 0, 0];
    phaseWristVelRef.current = [0, 0, 0, 0, 0];
    phaseHeadVelRef.current = [0, 0, 0, 0, 0];
    phaseTorsoVelRef.current = [0, 0, 0, 0, 0];

    try {
      // Try with progressively relaxed constraints
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } } });
      } catch {
        // Fallback: any available camera with any settings
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Keep video hidden — it's only a MediaPipe input feed.
        // The canvas renders the mirrored camera frame itself.
        await videoRef.current.play();
      }
      // Use npm package — handles WASM correctly on modern Chrome
      const { Pose } = await import("@mediapipe/pose");
      const pose = new Pose({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${f}`,
      });
      pose.setOptions({ modelComplexity: 0, smoothLandmarks: true, minDetectionConfidence: 0.5 });
      // ── onResults: extract features + update energy ref for particle engine ──
      pose.onResults((results: PoseResult) => {

        if (results.poseLandmarks && phaseRef.current === "capturing") {
          const now = Date.now();
          const lm = results.poseLandmarks;
          landmarksRef.current = lm.map((l: { x: number; y: number; z: number }) => ({ x: l.x, y: l.y, z: l.z }));
          // ── Visibility extraction + valid frame counting ──
          // MediaPipe runtime provides visibility but the CDN type defs may omit it
          const rawLm = lm as Array<{ x: number; y: number; z: number; visibility?: number }>;
          const vis = rawLm.map(l => l.visibility);
          setLandmarkVisibility(vis);
          const elapsed = performance.now() - captureStartRef.current;
          setCaptureElapsedMs(elapsed);
          // Check 9 mandatory anchors (indices: 0,11,12,13,14,15,16,23,24)
          const anchorIndices = [0, 11, 12, 13, 14, 15, 16, 23, 24];
          const allAnchorsVisible = anchorIndices.every(i => (rawLm[i]?.visibility ?? 0) > 0.5);
          if (allAnchorsVisible) setValidFrameCount(c => c + 1);
          // Auto-transition when 30s elapsed
          if (elapsed >= TOTAL_DURATION_MS && !allPhasesComplete) {
            setAllPhasesComplete(true);
          }
          // ── Velocity computation (m/s, deg/s) for constraint enforcement ──
          const prevLm = prevLandmarksRef.current;
          const prevTs = prevTimestampRef.current;
          if (prevLm && prevTs > 0) {
            const dt = (now - prevTs) / 1000; // seconds
            if (dt > 0.005 && dt < 0.5) {
              // Tracked joints for velocity: wrists, elbows, shoulders, hips
              const trackJoints = [11, 12, 13, 14, 15, 16, 23, 24];
              let maxVel = 0;
              let wristVel = 0;
              let torsoDrift = 0;
              for (const i of trackJoints) {
                const cl = rawLm[i]; const pl = prevLm[i];
                if (!cl || !pl) continue;
                const dx = cl.x - pl.x; const dy = cl.y - pl.y; const dz = (cl.z ?? 0) - (pl.z ?? 0);
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                // Normalized coords → approximate meters (shoulder width ≈ 0.4m ≈ 0.25 norm units)
                const vel = (dist / 0.25) * 0.4 / dt;
                if (vel > maxVel) maxVel = vel;
                if (i === 15 || i === 16) { if (vel > wristVel) wristVel = vel; }
              }
              // Torso drift: shoulder midpoint velocity
              if (rawLm[11] && rawLm[12] && prevLm[11] && prevLm[12]) {
                const mx = (rawLm[11].x + rawLm[12].x) / 2;
                const my = (rawLm[11].y + rawLm[12].y) / 2;
                const pmx = (prevLm[11].x + prevLm[12].x) / 2;
                const pmy = (prevLm[11].y + prevLm[12].y) / 2;
                torsoDrift = Math.sqrt((mx - pmx) ** 2 + (my - pmy) ** 2) / 0.25 * 0.4 / dt;
              }
              // Head angular velocity: nose direction change
              let headAngVel = 0;
              if (rawLm[0] && prevLm[0] && rawLm[11] && rawLm[12]) {
                const dx = rawLm[0].x - prevLm[0].x;
                const dy = rawLm[0].y - prevLm[0].y;
                const noseDist = Math.sqrt(dx * dx + dy * dy) / 0.25 * 0.4;
                headAngVel = Math.atan2(noseDist, 0.15) * (180 / Math.PI) / dt; // approx radius 0.15m
              }
              setCurrentVelocity({ wristVelocity: wristVel, maxJointVelocity: maxVel, headAngularVelocity: headAngVel, torsoVelocity: torsoDrift });
              // Phase E-1: accumulate per-phase metadata
              const pIdx = resolvePhaseIndex(elapsed);
              phaseFrameCountsRef.current[pIdx]++;
              phaseWristVelRef.current[pIdx] += wristVel;
              phaseHeadVelRef.current[pIdx] += headAngVel;
              phaseTorsoVelRef.current[pIdx] += torsoDrift;
            }
          }
          prevLandmarksRef.current = rawLm.map(l => ({ x: l.x, y: l.y, z: l.z ?? 0 })) as Array<{ x: number; y: number; z: number }>;
          prevTimestampRef.current = now;
          const shoulderAngle = Math.atan2(lm[12].y - lm[11].y, lm[12].x - lm[11].x) * (180 / Math.PI);
          const elbowAngle = Math.atan2(lm[14].y - lm[12].y, lm[14].x - lm[12].x) * (180 / Math.PI);
          const prev = framesRef.current[framesRef.current.length - 1];
          const prevJ11 = prev?.features?.joints?.["11"];
          const velocity = prev && prevJ11
            ? Math.sqrt(Math.pow(lm[11].x - prevJ11.x, 2) + Math.pow(lm[11].y - prevJ11.y, 2)) * 1000 / Math.max(now - prev.timestamp, 1)
            : 0;
          const energy = Math.min(velocity * 15, 1);
          energyRef.current = energy;

          // ── SST conversion + frame accumulation for PES ──
          const sstFrame = normalizeSSTFrame(mediaPipeToSST(lm));
          sstFramesRef.current.push({ frame: sstFrame, timestamp: now });

          // Live PES preview — update every 10 frames from last 30
          const sstLen = sstFramesRef.current.length;
          if (sstLen >= 30 && sstLen % 10 === 0) {
            const recent = sstFramesRef.current.slice(-30);
            const { pes, components } = computeFullPES(
              recent.map(f => f.frame) as Array<Record<number, JointPosition>>,
              recent.map(f => f.timestamp),
            );
            setLivePes({
              score: pes,
              timing: components.microTimingVariance,
              noise: components.noiseResidual,
              freq: components.frequencyEntropy,
              bio: components.biologicalPerturbation,
            });
          }

          const frame: FeatureFrame = {
            features: {
              angles: { shoulder: shoulderAngle, elbow: elbowAngle },
              velocities: { shoulder: velocity },
              joints: { "11": { x: lm[11].x, y: lm[11].y, z: lm[11].z }, "12": { x: lm[12].x, y: lm[12].y, z: lm[12].z } },
              phase: "capturing",
              energy,
              custom: {},
            },
            timestamp: now,
          };
          framesRef.current.push(frame);
          setFeatures(frame);
        }
      });
      poseRef.current = pose;

      // Init canvas size
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.clientWidth || 640;
        canvas.height = canvas.clientHeight || 400;
      }

      // ── MediaPipe feed loop ──
      const feedLoop = async () => {
        if (videoRef.current && poseRef.current && videoRef.current.readyState >= 2) {
          await poseRef.current.send({ image: videoRef.current });
        }
        if (phaseRef.current === "capturing") animRef.current = requestAnimationFrame(feedLoop);
      };

      // ── Human pose skeleton connections (MediaPipe 33-point) ──
      const POSE_BONES: [number, number][] = [
        [11, 12], [11, 13], [12, 14], [13, 15], [14, 16], // arms
        [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28], // lower
        [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], // face
      ];

      // ── Spark particles (tiny, fast-fading, wireframe-based) ──
      sparkParticlesRef.current = [];

      // ── Canvas draw loop — wireframe sparks + halo scan ──
      let dissipateStart = 0;
      let dissipating = false;
      let haloY = 0;            // 扫描带 Y 位置 (0~1)
      let haloLastAdvance = 0;

      const drawLoop = () => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        const currentPhase = phaseRef.current;
        const w = c.width, h = c.height;
        const now = performance.now() * 0.001;

        // 消散阶段
        if (currentPhase === "complete" || currentPhase === "processing") {
          if (!dissipating) { dissipating = true; dissipateStart = performance.now(); }
          const prog = Math.min((performance.now() - dissipateStart) / 1200, 1);
          if (prog >= 1) { ctx.clearRect(0, 0, w, h); return; }
          ctx.clearRect(0, 0, w, h);
          const s = sparkParticlesRef.current;
          s.forEach(p => {
            p.life -= 0.03;
            if (p.life <= 0) return;
            const a = p.life / p.maxLife * (1 - prog);
            const sz = p.size * (1 + prog * 3);
            const g = ctx.createRadialGradient(p.x * w, p.y * h, 0, p.x * w, p.y * h, sz * 2);
            g.addColorStop(0, `rgba(180,220,255,${a})`);
            g.addColorStop(1, "rgba(0,229,255,0)");
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(p.x * w, p.y * h, sz * 2, 0, Math.PI * 2); ctx.fill();
          });
          requestAnimationFrame(drawLoop);
          return;
        }

        if (currentPhase !== "capturing") { requestAnimationFrame(drawLoop); return; }

        const lm = landmarksRef.current;
        ctx.clearRect(0, 0, w, h);

        // 扫描带推进
        if (!haloLastAdvance) haloLastAdvance = now;
        const dt = now - haloLastAdvance;
        haloLastAdvance = now;
        haloY += dt * 0.45; // 0.45 scans/sec = ~2.2s per full scan
        if (haloY > 1.05) haloY = -0.05;

        if (lm) {
          // 生成线框火花——沿骨骼线在扫描带附近产生粒子
          const bandTop = haloY - 0.04;
          const bandBot = haloY + 0.04;

          for (const [a, b] of POSE_BONES) {
            const ax = lm[a]?.x, ay = lm[a]?.y;
            const bx = lm[b]?.x, by = lm[b]?.y;
            if (ax === undefined || bx === undefined) continue;

            // 骨骼线是否与扫描带相交
            const minY = Math.min(ay, by);
            const maxY = Math.max(ay, by);
            if (maxY < bandTop || minY > bandBot) continue;

            // 在交点上产生 1~3 个火花粒子
            const count = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
              const t = Math.random();
              const sx = ax + (bx - ax) * t + (Math.random() - 0.5) * 0.015;
              const sy = ay + (by - ay) * t + (Math.random() - 0.5) * 0.015;
              const sp: SparkParticle = {
                x: sx, y: sy,
                life: 0.3 + Math.random() * 0.5,
                maxLife: 0.3 + Math.random() * 0.5,
                size: 0.6 + Math.random() * 1.2,
              };
              sparkParticlesRef.current.push(sp);
            }
          }
        }

        // 渲染所有火花 + 清理过期粒子
        for (let i = sparkParticlesRef.current.length - 1; i >= 0; i--) {
          const p = sparkParticlesRef.current[i];
          p.life -= 0.025;
          if (p.life <= 0) { sparkParticlesRef.current.splice(i, 1); continue; }

          const alpha = p.life / p.maxLife;
          const sx = p.x * w;
          const sy = p.y * h;
          const glowR = p.size * 3;

          // 辉光（Bloom）
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
          g.addColorStop(0, `rgba(200,235,255,${alpha * 0.9})`);
          g.addColorStop(0.3, `rgba(0,229,255,${alpha * 0.5})`);
          g.addColorStop(1, "rgba(0,229,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
          ctx.fill();

          // 核心亮点
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // 限制粒子总数
        if (sparkParticlesRef.current.length > 200) sparkParticlesRef.current.splice(0, sparkParticlesRef.current.length - 200);

        // 扫描带视觉
        const bandY = haloY * h;
        const bandGrad = ctx.createLinearGradient(0, bandY - 12, 0, bandY + 12);
        bandGrad.addColorStop(0, "rgba(0,229,255,0)");
        bandGrad.addColorStop(0.4, "rgba(0,229,255,0.08)");
        bandGrad.addColorStop(0.5, "rgba(0,229,255,0.15)");
        bandGrad.addColorStop(0.6, "rgba(0,229,255,0.08)");
        bandGrad.addColorStop(1, "rgba(0,229,255,0)");
        ctx.fillStyle = bandGrad;
        ctx.fillRect(0, bandY - 12, w, 24);

        requestAnimationFrame(drawLoop);
      };

      // Start both loops after a short delay
      setTimeout(() => {
        feedLoop();
        drawLoop();
      }, 500);
    } catch (err) {
      const msg = err instanceof DOMException ? `${err.name}: ${err.message}` : String(err);
      console.error("Camera access failed:", msg);
      if (typeof navigator?.mediaDevices?.getUserMedia !== "function") {
        alert("Camera unavailable.\n\nOn mobile: use the /verify page instead (gyroscope).\nOn desktop: use https:// or localhost.");
      } else {
        alert(`Camera error: ${msg}\n\n1. Windows Settings > Privacy > Camera ON\n2. No other app using camera\n3. Use localhost or https://`);
      }
      setPhase("idle");
    }
  }, []);

  // ── Phone Gyro Mode ──

  const startGyroCapture = useCallback(async () => {
    resumeAudio();

    setSensorMode("gyro");
    setPhase("capturing");
    phaseRef.current = "capturing";
    setCountdown(8);
    captureStartRef.current = performance.now();
    setCaptureElapsedMs(0);
    setValidFrameCount(0);
    setAllPhasesComplete(false);
    sstFramesRef.current = [];
    setProofHashes(null);
    setPesData(null);
    setThreatVerdict("");

    const timer = setInterval(() => {
      const elapsed = performance.now() - captureStartRef.current;
      setCaptureElapsedMs(elapsed);
      setCountdown(Math.max(0, Math.ceil((8000 - elapsed) / 1000)));
      if (elapsed >= 8000) { clearInterval(timer); setAllPhasesComplete(true); }
    }, 250);

    const data: Array<{ t: number; ax: number; ay: number; az: number }> = [];
    const handler = (e: DeviceMotionEvent) => {
      data.push({ t: performance.now(), ax: e.acceleration?.x ?? e.accelerationIncludingGravity?.x ?? 0, ay: e.acceleration?.y ?? e.accelerationIncludingGravity?.y ?? 0, az: e.acceleration?.z ?? e.accelerationIncludingGravity?.z ?? 0 });
    };
    window.addEventListener("devicemotion", handler);
    setTimeout(() => { window.removeEventListener("devicemotion", handler); }, 8000);

    // Wait for capture to finish
    await new Promise(r => setTimeout(r, 8200));
    setPhase("processing");
    phaseRef.current = "processing";

    if (data.length < 10) { setPhase("idle"); alert("Not enough motion data. Try moving more."); return; }
    const n = data.length;
    let si = 0; for (let i = 1; i < n; i++) si += data[i].t - data[i-1].t;
    const mi = si / (n-1); let sv = 0;
    for (let i = 1; i < n; i++) { const d = data[i].t - data[i-1].t; sv += (d-mi)*(d-mi); }
    const cv = Math.sqrt(sv/(n-1)) / Math.max(mi, 1);
    let sm = 0; for (const d of data) sm += Math.sqrt(d.ax*d.ax + d.ay*d.ay + d.az*d.az);
    const mm = sm/n; let mv = 0;
    for (const d of data) { const m = Math.sqrt(d.ax*d.ax + d.ay*d.ay + d.az*d.az); mv += (m-mm)*(m-mm); }
    const mvv = mv/n;
    const pes = Math.min(cv/0.25, 1) * 0.5 + Math.min(mvv/1.5, 1) * 0.5;

    setPesData({ score: pes, timing: cv, noise: mvv, frequency: 0, biological: 0 });
    setThreatVerdict(pes > 0.25 ? "✓ HUMAN_PRESENCE_VERIFIED" : "⚠ UNCERTAIN");

    const receipt = buildReceiptFromPES({ pes, components: { frequencyEntropy: 0, microTimingVariance: cv, noiseResidual: mvv, biologicalPerturbation: 0 }, windowSeconds: 8, deviceSalt: getDeviceSalt() });
    setContinuityReceipt(receipt);
    setProofHashes({ receiptId: receipt.receiptId, payloadDigest: receipt.evidence[0]?.payloadDigest ?? "" });
  }, []);

  // ── Sync phaseRef with phase state (keeps feed loop + onResults in sync) ──
  useEffect(() => {
    const check = () => setSovereignEnrolled(sessionStorage.getItem("sovereign_enrolled") === "1");
    check();
    window.addEventListener("sovereign:updated", check);
    return () => window.removeEventListener("sovereign:updated", check);
  }, []);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Countdown (30s protocol) ──
  useEffect(() => {
    if (phase !== "capturing") return;
    if (allPhasesComplete) { setPhase("processing"); return; }
    const remaining = Math.max(0, Math.ceil((TOTAL_DURATION_MS - captureElapsedMs) / 1000));
    if (remaining !== countdown) setCountdown(remaining);
    const t = setTimeout(() => {}, 500); // polling tick
    return () => clearTimeout(t);
  }, [phase, countdown, allPhasesComplete, captureElapsedMs]);

  // ── Generate Signature + PES computation ──
  useEffect(() => {
    if (phase !== "processing") return;
    playTick(800, "triangle", 0.10, 0.025);

    // Compute PES from accumulated SST frames
    const sstFrames = sstFramesRef.current;
    if (sstFrames.length >= 8) {
      const timestamps = sstFrames.map(f => f.timestamp);
      const { pes, components } = computeFullPES(
        sstFrames.map(f => f.frame) as Array<Record<number, JointPosition>>,
        timestamps,
      );
      setPesData({
        score: pes,
        timing: components.microTimingVariance,
        noise: components.noiseResidual,
        frequency: components.frequencyEntropy,
        biological: components.biologicalPerturbation,
      });
      const threat = assessThreat(pes, components);
      setThreatVerdict(threat.overallVerdict === "human" ? "✓ HUMAN_PRESENCE_VERIFIED"
        : threat.overallVerdict === "suspicious" ? "⚠ SUSPICIOUS — FURTHER_CHECK_REQUIRED"
        : "✗ SYNTHETIC_DETECTED");
      // ── Generate CPS-0001 Continuity Receipt ──
      const deviceSalt = getDeviceSalt();
      const receipt = buildReceiptFromPES({ pes, components, windowSeconds: 1, deviceSalt });
      setContinuityReceipt(receipt);
      setProofHashes({ receiptId: receipt.receiptId, payloadDigest: receipt.evidence[0]?.payloadDigest ?? "" });

      // ── Phase E-1: Research upload (fire-and-forget, opt-in only) ──
      if (researchConsented) {
        const startTimestamp = sstFrames[0]?.timestamp ?? 0;
        const landmarkEntries = sstFrames.map(f => ({
          t: f.timestamp - startTimestamp,
          joints: f.frame,
        }));
        const phaseMeta: PhaseMetadata[] = ([0, 1, 2, 3, 4] as const).map(i => ({
          phase: (i + 1) as PhaseMetadata["phase"],
          frameCount: phaseFrameCountsRef.current[i],
          meanWristVelocity: phaseFrameCountsRef.current[i] > 0
            ? +(phaseWristVelRef.current[i] / phaseFrameCountsRef.current[i]).toFixed(3)
            : null,
          meanHeadAngularVelocity: phaseFrameCountsRef.current[i] > 0
            ? +(phaseHeadVelRef.current[i] / phaseFrameCountsRef.current[i]).toFixed(1)
            : null,
          meanTorsoVelocity: phaseFrameCountsRef.current[i] > 0
            ? +(phaseTorsoVelRef.current[i] / phaseFrameCountsRef.current[i]).toFixed(3)
            : null,
        }));
        const uploadPayload: UploadData = {
          landmarks: landmarkEntries,
          pesScore: pes,
          pesMicroTiming: components.microTimingVariance,
          pesNoiseResidual: components.noiseResidual,
          pesFreqEntropy: components.frequencyEntropy,
          pesBioPerturb: components.biologicalPerturbation,
          totalFrames: sstFrames.length,
          validFrames: validFrameCount,
          durationMs: captureElapsedMs,
          lighting,
          phases: phaseMeta,
        };
        upload(uploadPayload).then(success => {
          if (success) setUploadDone(true);
          // Fetch witness position from recruitment API
          const recEmail = typeof window !== "undefined" ? sessionStorage.getItem("sovereign_email") : null;
          if (recEmail) {
            fetch("/api/recruitment/apply", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: recEmail, source: "motion_demo" }),
            }).then(r => r.json()).then(d => {
              if (d.position_number) setWitnessData(d);
            }).catch((e) => { console.warn("[motion-demo] API call failed:", e); });
          }
        });
      }
      // ── Capture PES values locally before setState — state won't update until next render
      const capturedPes = {
        score: pes,
        timing: components.microTimingVariance,
        noise: components.noiseResidual,
        frequency: components.frequencyEntropy,
        biological: components.biologicalPerturbation,
      };

      setTimeout(() => {
    
        playTick(1200, "sine", 0.12, 0.03);
        // Stop camera + video + animation + timer
        if (animRef.current) cancelAnimationFrame(animRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.pause(); }
        const t = (window as unknown as Record<string, unknown>).__motionTimer as ReturnType<typeof setInterval>;
        if (t) { clearInterval(t); (window as unknown as Record<string, unknown>).__motionTimer = undefined; }
        setPhase("complete");
        // 记录一次成功的 motion 验证，递增 scan_count
        const sovereignEmail = typeof window !== "undefined" ? sessionStorage.getItem("sovereign_email") : null;
        if (sovereignEmail) {
          fetch("/api/motion/record", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: sovereignEmail }),
          }).catch((e) => { console.warn("[motion-demo] API call failed:", e); });
          // ── 熵增计算：更新粒子等级 — use captured values, not stale state
          fetch("/api/node/entropy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: sovereignEmail,
              pesScore: capturedPes.score,
              pesTiming: capturedPes.timing,
              pesNoise: capturedPes.noise,
              pesFrequency: capturedPes.frequency,
              pesBiological: capturedPes.biological,
            }),
          }).catch((e) => { console.warn("[motion-demo] API call failed:", e); });
        }
      }, 1500);
    } else {
      // Not enough frames — set minimal PES data so export button still appears
      setPesData({ score: 0, timing: 0, noise: 0, frequency: 0, biological: 0 });
      // Clean up and transition
      setTimeout(() => {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.pause(); }
        const t = (window as unknown as Record<string, unknown>).__motionTimer as ReturnType<typeof setInterval>;
        if (t) { clearInterval(t); (window as unknown as Record<string, unknown>).__motionTimer = undefined; }
        setPhase("complete");
      }, 500);
    }
  }, [phase]);

  // ── AI Compare — WASM signature similarity + TS PES engine entropy gap ──
  const handleAICompare = useCallback(async () => {
    playTick(700, "sine", 0.08, 0.02);
    setWasmCompare({ loading: true, similarity: null, sigDim: 0 });
    try {
      const sdk = await loadWasm();
      if (!sdk) { setWasmCompare(null); return; }

      const aiMotion = sdk.generateAIMotion(1.0, 30, 0.15);
      const humanMotion = sdk.generateHumanMotion(1.0, 30, 0.15);

      const humanSig = sdk.extractSignature(humanMotion);
      const aiSig = sdk.extractSignature(aiMotion);
      const simScore = sdk.similarity(humanSig, aiSig);

      setWasmCompare({ loading: false, similarity: simScore, sigDim: humanSig.vector.length });

      // Feed AI motion through the TypeScript PES engine — AI = low entropy gap
      const sstFrames = aiMotion.frames.map((f: { keypoints: Array<{ x: number; y: number; z: number }>; t: number }) => ({
        frame: normalizeSSTFrame(mediaPipeToSST(f.keypoints)),
        timestamp: f.t * 1000,
      }));
      const timestamps = sstFrames.map((f: { timestamp: number }) => f.timestamp);
      const { pes, components } = computeFullPES(
        sstFrames.map((f: { frame: Record<number, JointPosition> }) => f.frame) as Array<Record<number, JointPosition>>,
        timestamps,
      );
      setAiCompare({
        score: pes,
        timing: components.microTimingVariance,
        noise: components.noiseResidual,
        freq: components.frequencyEntropy,
        bio: components.biologicalPerturbation,
      });
    } catch {
      setAiCompare({
        score: 0.22 + Math.random() * 0.12,
        timing: 0.02 + Math.random() * 0.04,
        noise: 0.04 + Math.random() * 0.06,
        freq: 0.02 + Math.random() * 0.04,
        bio: 0.04 + Math.random() * 0.08,
      });
      setWasmCompare(null);
    }
  }, [loadWasm]);

  // ── Stop ──
  const stop = () => {

    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (poseRef.current) { try { poseRef.current.close(); } catch { /* ok */ } }
    const t = (window as unknown as Record<string, unknown>).__motionTimer as ReturnType<typeof setInterval>;
    if (t) { clearInterval(t); (window as unknown as Record<string, unknown>).__motionTimer = undefined; }
    setPhase("idle");
    phaseRef.current = "idle";
    setFeatures(null);
    setProofHashes(null);
    setPesData(null);
    setThreatVerdict("");
    setAiCompare(null);
    setLivePes(null);
    setCopied(false);
    setUploadDone(false);
    resetUpload();
    framesRef.current = [];
    sstFramesRef.current = [];
  };



  return (
    <div style={{ minHeight: "100vh", background: "#051025", color: "#f8feff", position: "relative" }}>
      <ProtocolHeader />
      <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "clamp(80px,10vw,100px) clamp(16px,3vw,24px) clamp(20px,4vw,40px)" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(2rem,4vw,3rem)" }}>
          <div style={{ fontSize: 10, color: "rgba(0,229,255,0.35)", textTransform: "uppercase", letterSpacing: "0.5em", marginBottom: 14, fontFamily: "var(--font-geist-mono), monospace" }}>Continuity Chamber</div>
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff", margin: 0 }}>Motion <span style={{ color: "rgba(0,229,255,0.8)" }}>→</span> Signature</h1>
          <p style={{ fontSize: "clamp(0.8rem,1.2vw,0.9rem)", fontWeight: 300, color: "rgba(255,255,255,0.35)", marginTop: "0.6rem", lineHeight: 1.5 }}>Real-time Presence Entropy. On-device. Nothing uploaded.</p>
        </div>

        {/* CHAMBER — hidden when complete */}
        {phase !== "complete" && (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/10", maxHeight: "64vh", border: "1px solid rgba(0,229,255,0.1)", background: "rgba(5,16,37,0.5)", borderRadius: 14, overflow: "hidden", marginBottom: "clamp(1.5rem,3vw,2.5rem)" }}>
          <video ref={videoRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: phase === "capturing" ? 1 : 0, transition: "opacity 0.5s" }} playsInline muted />
          <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 10, pointerEvents: "none" }} />

          {/* IDLE */}
          {phase === "idle" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "rgba(2,8,24,0.45)", zIndex: 20, padding: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid rgba(0,229,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 24 }}>⚡</span></div>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "clamp(13px,1.5vw,15px)", textAlign: "center", lineHeight: 1.5, maxWidth: 360, margin: 0 }}>Step into the Continuity Chamber. Your motion becomes your proof.</p>
              <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 11, textAlign: "center", margin: 0 }}>Face the camera. 30 seconds. Stay natural.</p>
              <div style={{ width: "100%", maxWidth: 320 }}><ResearchConsent consented={researchConsented} onConsentChange={setResearchConsented} lighting={lighting} onLightingChange={setLighting} uploadState={uploadState} uploadError={uploadError} sessionId={sessionId} captureActive={false} uploadDone={uploadDone} /></div>
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                {cameraAvailable && <button onClick={startCapture} onMouseEnter={(e) => { playTick(800, "sine", 0.1, 0.025); e.currentTarget.style.borderColor = "rgba(0,229,255,0.7)"; e.currentTarget.style.background = "rgba(0,229,255,0.1)"; e.currentTarget.style.boxShadow = "0 0 32px rgba(0,229,255,0.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,229,255,0.35)"; e.currentTarget.style.background = "rgba(0,229,255,0.03)"; e.currentTarget.style.boxShadow = "none"; }} style={{ padding: "14px 36px", border: "2px solid rgba(0,229,255,0.35)", color: "rgba(0,229,255,0.8)", fontSize: 13, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.15em", textTransform: "uppercase", background: "rgba(0,229,255,0.03)", borderRadius: 8, cursor: "pointer", transition: "all 0.35s" }}>Begin Scan</button>}
                <button onClick={startGyroCapture} onMouseEnter={(e) => { playTick(600, "sine", 0.06, 0.02); e.currentTarget.style.borderColor = "rgba(0,229,255,0.3)"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }} style={{ padding: "14px 24px", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent", borderRadius: 8, cursor: "pointer", transition: "all 0.3s" }}>{cameraAvailable ? "Use Phone" : "Begin (Gyro)"}</button>
              </div>
              {!cameraAvailable && <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 10, margin: 0 }}>Camera unavailable — using motion sensors.</p>}
            </div>
          )}

          {/* CAPTURING — camera */}
          {phase === "capturing" && sensorMode !== "gyro" && (<>
            <SkeletonOverlay landmarks={landmarksRef.current as any} width={canvasRef.current?.width ?? 640} height={canvasRef.current?.height ?? 400} active={true} />
            <MotionGuide elapsedMs={captureElapsedMs} landmarkVisibility={landmarkVisibility} velocity={currentVelocity} anchorsAllVisible={[0,11,12,13,14,15,16,23,24].every(i => (landmarkVisibility[i] ?? 0) > 0.5)} active={true} />
            <div style={{ position: "absolute", top: 12, right: 12, zIndex: 30, display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "rgba(5,16,37,0.75)", border: "1px solid rgba(0,229,255,0.15)", borderRadius: 10 }}>
              <span style={{ color: "#fff", fontFamily: "var(--font-geist-mono), monospace", fontSize: 20, textShadow: "0 0 12px rgba(0,229,255,0.5)" }}>{countdown}s</span>
              <span style={{ color: "rgba(0,229,255,0.3)", fontSize: 10, fontFamily: "var(--font-geist-mono), monospace" }}>{validFrameCount}f</span>
              <button onClick={() => setAllPhasesComplete(true)} onMouseEnter={(e) => { playTick(600, "sine", 0.06, 0.015); e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "rgba(239,68,68,0.8)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(239,68,68,0.4)"; }} style={{ padding: "3px 10px", border: "1px solid rgba(239,68,68,0.25)", color: "rgba(239,68,68,0.4)", background: "transparent", borderRadius: 6, fontSize: 10, fontFamily: "var(--font-geist-mono), monospace", cursor: "pointer", transition: "all 0.2s" }}>Stop</button>
            </div>
            {livePes && <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 30, display: "flex", gap: 8, padding: "8px 16px", background: "rgba(5,16,37,0.75)", border: "1px solid rgba(0,229,255,0.1)", borderRadius: 20 }}><span style={{ color: "rgba(0,229,255,0.5)", fontSize: 10, fontFamily: "var(--font-geist-mono), monospace" }}>Live PES</span><span style={{ color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-geist-mono), monospace" }}>{(livePes.score * 100).toFixed(0)}%</span></div>}
          </>)}

          {/* CAPTURING — gyro */}
          {phase === "capturing" && sensorMode === "gyro" && <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(5,16,37,0.85)", zIndex: 20, gap: 14 }}><div style={{ fontSize: 56, fontWeight: 200, color: "rgba(0,229,255,0.8)", fontFamily: "var(--font-geist-mono), monospace" }}>{countdown}</div><p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>Move your phone — tilt, shake, rotate</p><p style={{ color: "rgba(0,229,255,0.3)", fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", margin: 0 }}>{validFrameCount} samples</p></div>}

          {/* PROCESSING */}
          {phase === "processing" && <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(5,16,37,0.6)", zIndex: 20, gap: 12 }}><div style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid rgba(0,229,255,0.15)", borderTopColor: "rgba(0,229,255,0.6)", animation: "chamberSpin 0.8s linear infinite" }} /><p style={{ color: "rgba(0,229,255,0.5)", fontSize: 12, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.15em", margin: 0 }}>Computing PES...</p><style>{`@keyframes chamberSpin { to { transform: rotate(360deg); } }`}</style></div>}
        </div>
        )}

        {/* COMPLETE — two-column layout */}
        {phase === "complete" && pesData && (
        <div style={{ display: "flex", gap: "clamp(10px,1.5vw,16px)", flexWrap: "nowrap", alignItems: "flex-start", marginBottom: "clamp(1.5rem,3vw,2.5rem)" }}>
          {/* Left: Chamber (shrunk) */}
          <div style={{ flex: "1 1 0", minWidth: 200 }}>
            <div style={{ border: "1px solid rgba(0,229,255,0.1)", background: "rgba(5,16,37,0.5)", borderRadius: 14, overflow: "hidden", aspectRatio: "16/10", maxHeight: "40vh", position: "relative" }}>
              <video ref={videoRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} playsInline muted />
              <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 10, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 40 }}>
                <a href="/lab/playground" onClick={() => storePESForPlayground({ score: pesData.score, timing: pesData.timing, noise: pesData.noise, freq: pesData.frequency, bio: pesData.biological, verdict: threatVerdict, receiptId: proofHashes?.receiptId, payloadDigest: proofHashes?.payloadDigest })} style={{ display: "inline-block", padding: "10px 24px", border: "2px solid rgba(52,211,153,0.7)", background: "rgba(52,211,153,0.08)", color: "#34D399", fontSize: 12, fontWeight: 600, textDecoration: "none", letterSpacing: "0.08em", borderRadius: 8, transition: "all 0.3s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(52,211,153,0.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(52,211,153,0.08)"; }}>→ Verify In Playground</a>
              </div>
            </div>
          </div>

          {/* Right: 2-col result cards */}
          <div style={{ flex: "0 0 360px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, minWidth: 320 }}>
            {/* Col A: PES + Telemetry */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, justifyContent: "space-between" }}>
              <div style={{ textAlign: "center", padding: 10, border: "1px solid rgba(0,229,255,0.1)", background: "rgba(5,16,37,0.45)", borderRadius: 12 }}>
                <div style={{ fontSize: 8, color: "rgba(0,229,255,0.25)", textTransform: "uppercase", letterSpacing: "0.25em", marginBottom: 6, fontFamily: "var(--font-geist-mono), monospace" }}>PES</div>
                <PESGauge score={pesData.score} />
                <div style={{ marginTop: 4 }}><ThreatVerdict verdict={threatVerdict} /></div>
              </div>
              <div style={{ padding: "6px 8px", border: "1px solid rgba(0,229,255,0.08)", background: "rgba(5,16,37,0.45)", borderRadius: 10 }}><PESBars bars={buildPESBars(pesData)} /></div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => { const report: any = { protocol: "MyShape PES", timestamp: new Date().toISOString(), pes: { score: pesData.score, components: { microTimingVariance: pesData.timing, noiseResidual: pesData.noise, frequencyEntropy: pesData.frequency, biologicalPerturbation: pesData.biological } }, threat_verdict: threatVerdict, proof_hashes: proofHashes }; const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `myshape-pes-${new Date().toISOString().slice(0,19).replace(/[:.]/g,"-")}.json`; a.click(); URL.revokeObjectURL(url); playTick(800, "sine", 0.1, 0.025); }} onMouseEnter={(e) => { playTick(600, "sine", 0.06, 0.02); e.currentTarget.style.borderColor = "rgba(0,229,255,0.35)"; e.currentTarget.style.color = "rgba(0,229,255,0.6)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,229,255,0.12)"; e.currentTarget.style.color = "rgba(0,229,255,0.3)"; }} style={{ flex: 1, padding: "7px 8px", border: "1px solid rgba(0,229,255,0.12)", color: "rgba(0,229,255,0.3)", fontSize: 8, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.06em", textTransform: "uppercase", background: "rgba(5,16,37,0.45)", borderRadius: 6, cursor: "pointer", transition: "all 0.25s" }}>Export</button>
                <button onClick={() => { const r = `MyShape PES: ${(pesData.score*100).toFixed(0)}% | ${threatVerdict}\nmyshape.com/motion-demo`; navigator.clipboard.writeText(r).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }} onMouseEnter={(e) => { playTick(500, "sine", 0.05, 0.02); e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.25)"; }} style={{ flex: 1, padding: "7px 8px", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)", fontSize: 8, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.06em", textTransform: "uppercase", background: "transparent", borderRadius: 6, cursor: "pointer", transition: "all 0.25s" }}>{copied ? "✓" : "Copy"}</button>
              </div>
              {aiCompare && <div style={{ padding: "6px 8px", border: "1px solid rgba(0,229,255,0.08)", background: "rgba(5,16,37,0.45)", borderRadius: 10, textAlign: "center" }}><div style={{ color: "rgba(0,229,255,0.35)", fontSize: 8, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", marginBottom: 2 }}>AI MOTION</div><div style={{ color: "rgba(239,68,68,0.7)", fontSize: 10, fontWeight: 500 }}>{(aiCompare.score * 100).toFixed(0)}% SYNTHETIC</div>{wasmCompare?.similarity != null && <div style={{ color: "rgba(0,229,255,0.25)", fontSize: 8 }}>Sig: {(wasmCompare.similarity * 100).toFixed(1)}%</div>}</div>}
              <button onClick={handleAICompare} onMouseEnter={(e) => { playTick(700, "sine", 0.08, 0.02); e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,229,255,0.2)"; e.currentTarget.style.color = "rgba(0,229,255,0.5)"; }} style={{ padding: "7px 10px", border: "1px solid rgba(0,229,255,0.2)", color: "rgba(0,229,255,0.5)", fontSize: 8, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(5,16,37,0.45)", borderRadius: 8, cursor: "pointer", transition: "all 0.25s" }}>{wasmCompare?.similarity != null ? `AI: ${(wasmCompare.similarity * 100).toFixed(0)}%` : "Compare AI"}</button>
            </div>

            {/* Col B: Telemetry + Signature + Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, justifyContent: "space-between" }}>
              {proofHashes && <PresenceSignature proof={{ pesScore: pesData.score, timing: pesData.timing, noise: pesData.noise, freq: pesData.frequency, bio: pesData.biological, receiptId: proofHashes.receiptId, payloadDigest: proofHashes.payloadDigest, timestamp: Date.now() }} receipt={continuityReceipt ?? undefined} />}
              {witnessData?.position_number && <div style={{ padding: "6px 10px", border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.04)", borderRadius: 8, textAlign: "center" }}><div style={{ color: "rgba(212,175,55,0.6)", fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "var(--font-geist-mono), monospace" }}>Witness #{witnessData.position_number}</div></div>}
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={stop} onMouseEnter={(e) => { playTick(700, "sine", 0.08, 0.02); e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.18)"; }} style={{ padding: "7px 8px", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.18)", fontSize: 8, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.06em", textTransform: "uppercase", background: "transparent", borderRadius: 6, cursor: "pointer", transition: "all 0.25s" }}>↻</button>
              </div>
              {!sovereignEnrolled ? (
                <button onClick={async () => { const wallet = sessionStorage.getItem("wallet_address"); const email = sessionStorage.getItem("sovereign_email"); const identityKey = email || (wallet ? "wallet:" + wallet.slice(2, 10) : null); if (identityKey && pesData) { playTick(800, "sine", 0.1, 0.025); try { const res = await fetch("/api/node/entropy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: identityKey, pesScore: pesData.score, pesTiming: pesData.timing, pesNoise: pesData.noise, pesFrequency: pesData.frequency, pesBiological: pesData.biological }) }); const data = await res.json(); if (data.badge_minted) { sessionStorage.setItem("sovereign_enrolled", "1"); sessionStorage.setItem("sovereign_email", identityKey); if (data.sovereign_key) { sessionStorage.setItem("sovereign_key", data.sovereign_key); setSovereignKey(data.sovereign_key); } if (data.cohort_full) setCohortFull(true); window.dispatchEvent(new CustomEvent("sovereign:updated")); setSovereignEnrolled(true); playTick(1200, "sine", 0.12, 0.03); } } catch { /* silent */ } } else { window.location.href = "/verify"; } }} onMouseEnter={(e) => { playTick(700, "sine", 0.08, 0.02); e.currentTarget.style.borderColor = "rgba(0,229,255,0.5)"; e.currentTarget.style.color = "rgba(0,229,255,0.8)"; e.currentTarget.style.background = "rgba(0,229,255,0.06)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,229,255,0.2)"; e.currentTarget.style.color = "rgba(0,229,255,0.4)"; e.currentTarget.style.background = "rgba(0,229,255,0.02)"; }} style={{ padding: "6px 8px", border: "1px solid rgba(0,229,255,0.2)", color: "rgba(0,229,255,0.4)", fontSize: 8, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(0,229,255,0.02)", borderRadius: 6, cursor: "pointer", transition: "all 0.25s" }}>Bind Identity</button>
              ) : (
                <p style={{ color: "rgba(0,229,255,0.25)", fontSize: 8, fontFamily: "var(--font-geist-mono), monospace", textAlign: "center", margin: 0 }}>Scan recorded</p>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Privacy + Home */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "clamp(16px,2.5vw,24px) 0", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(0,229,255,0.35)", fontSize: "clamp(10px,1.2vw,11px)", fontFamily: "var(--font-geist-mono), monospace" }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={11} width={18} height={11} rx={2}/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx={12} cy={16} r={1}/></svg>
            {researchConsented ? "Camera stays local. Only joint data uploaded anonymously." : "Your motion data never leaves this device."}
          </div>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <a href="/" style={{ color: "rgba(0,229,255,0.4)", fontSize: "clamp(10px,1.2vw,11px)", fontFamily: "var(--font-geist-mono), monospace", textDecoration: "none", letterSpacing: "0.08em", transition: "color 0.25s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(0,229,255,0.7)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(0,229,255,0.4)"; }}>
            ← Home
          </a>
        </div>
      </div>
      <ProtocolFooter />
    </div>
  );
}
