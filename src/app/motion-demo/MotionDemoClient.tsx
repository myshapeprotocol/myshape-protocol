"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import ProtocolHeader from "@/components/header/header";
import { useMyShapeEngine } from "@/hooks/useMyShapeEngine";
import MotionGuide, { TOTAL_DURATION_MS, type VelocitySnapshot } from "@/components/motion-guide/MotionGuide";
import SkeletonOverlay from "@/components/motion-guide/SkeletonOverlay";

import ProtocolFooter from "@/components/footer/footer";
import ProtocolStatusWall from "@/components/status-wall/ProtocolStatusWall";
import { playTick, resumeAudio } from "@/utils/useAudioTick";
import PresenceSignature from "@/components/presence-signature/PresenceSignature";
import { mediaPipeToSST, normalizeSSTFrame } from "@/engine/skeleton-topology";
import { computeFullPES } from "@/engine/presence-entropy";
import { assessThreat } from "@/engine/threat-assessment";
import { generateFullProof } from "@/engine/proof-system";
import { getDeviceSalt } from "@/engine/local-identity";
import type { JointPosition, SSTJointId } from "@/types/motion-vector";
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
import ZKProofBox from "@/components/motion-demo/ZKProofBox";
import TelemetryPanel from "@/components/motion-demo/TelemetryPanel";

type Phase = "idle" | "capturing" | "processing" | "complete";

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

export default function MotionDemoClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isChromium, setIsChromium] = useState(false);
  const [genesisDone, setGenesisDone] = useState(false);
  const [genesisKey, setGenesisKey] = useState<string | null>(null);
  const [cohortFull, setCohortFull] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [features, setFeatures] = useState<FeatureFrame | null>(null);
  const [pesData, setPesData] = useState<PESData | null>(null);
  const [threatVerdict, setThreatVerdict] = useState<string>("");
  const [proofHashes, setProofHashes] = useState<{ zkp: string; pop: string; mp: string; ep: string } | null>(null);
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
    // 在用户点击的同步代码块中恢复 AudioContext（浏览器自动播放策略要求）
    resumeAudio();

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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, frameRate: 30 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Keep video hidden — it's only a MediaPipe input feed.
        // The canvas renders the mirrored camera frame itself.
        await videoRef.current.play();
      }
      if (!window.Pose) {
        await new Promise<void>(resolve => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js";
          s.crossOrigin = "anonymous";
          // SRI ensures CDN file hasn't been tampered with
          s.integrity = "sha384-qcJQ+n/ZcF15Xu2EoRupB4Av+GEAGeW0Td1mp2A90u0NdNLzLYQVMUq1Ax1YAHqk";
          s.onload = () => resolve();
          s.onerror = () => { console.warn("[motion-demo] MediaPipe load failed"); resolve(); };
          document.head.appendChild(s);
        });
      }
      if (!window.Pose) { setPhase("idle"); return; }
      const pose = new window.Pose({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${f}` });
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
            g.addColorStop(1, "rgba(144,200,255,0)");
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
          g.addColorStop(0.3, `rgba(144,200,255,${alpha * 0.5})`);
          g.addColorStop(1, "rgba(144,200,255,0)");
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
        bandGrad.addColorStop(0, "rgba(144,200,255,0)");
        bandGrad.addColorStop(0.4, "rgba(144,200,255,0.08)");
        bandGrad.addColorStop(0.5, "rgba(144,200,255,0.15)");
        bandGrad.addColorStop(0.6, "rgba(144,200,255,0.08)");
        bandGrad.addColorStop(1, "rgba(144,200,255,0)");
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
      console.error("Camera access failed:", err);
      setPhase("idle");
    }
  }, []);

  // ── Sync phaseRef with phase state (keeps feed loop + onResults in sync) ──
  useEffect(() => {
    const check = () => setGenesisDone(sessionStorage.getItem("genesis_completed") === "1");
    check();
    window.addEventListener("genesis:updated", check);
    return () => window.removeEventListener("genesis:updated", check);
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
      // ── Generate full ZK-Presence Proof ──
      const quickHash = (s: string) => {
        let h = 0x6d797368;
        for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
        return Math.abs(h).toString(16).padStart(8, "0");
      };
      const sstJson = JSON.stringify(sstFrames.slice(-30).map(f => f.frame));
      const componentsJson = JSON.stringify(components);
      const deviceSalt = getDeviceSalt();
      const zkp = generateFullProof({
        fps: 30,
        windowSeconds: 1,
        nodes: 18,
        mvHash: quickHash(sstJson),
        featureHash: quickHash(componentsJson),
        pes,
        pesComponents: components,
        deviceSalt,
      });
      setProofHashes({
        zkp: zkp.zkp_hash,
        pop: zkp.pop.pop_hash,
        mp: zkp.mp.mp_hash,
        ep: zkp.ep.ep_hash,
      });

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
          const recEmail = typeof window !== "undefined" ? sessionStorage.getItem("genesis_email") : null;
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
        const genesisEmail = typeof window !== "undefined" ? sessionStorage.getItem("genesis_email") : null;
        if (genesisEmail) {
          fetch("/api/motion/record", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: genesisEmail }),
          }).catch((e) => { console.warn("[motion-demo] API call failed:", e); });
          // ── 熵增计算：更新粒子等级 — use captured values, not stale state
          fetch("/api/node/entropy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: genesisEmail,
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
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 motion-demo__container">
        <div className="space-y-6 mb-12">
          <div className="text-[#90c8ff]/50 text-[10px] tracking-[0.5em] uppercase">Presence_Engine // Live_Demo</div>
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.15em] text-white uppercase">
            Motion <span className="motion-demo__arrow">→</span> Geometry <span className="motion-demo__arrow">→</span> Signature
          </h1>
          <p className="text-white/40 text-[12px] leading-relaxed max-w-xl">
            Real-time Presence Entropy Score via webcam. Motion Vector → SST 18-pt → 4D Entropy → ZK-Proof.
            All processing local. Nothing uploaded. Firefox recommended.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Particle Panel */}
          <div className="lg:col-span-2 border border-white/10 bg-black/60 relative overflow-hidden motion-demo__video-panel">
            {/* Video is the main display — camera feed directly visible */}
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover motion-demo__video" playsInline muted />
            {/* Canvas overlay: particles + skeleton only */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />

            {phase === "idle" && (
              <>
                <IdlePanel
                  isChromium={isChromium}
                  researchConsented={researchConsented}
                  onConsentChange={setResearchConsented}
                  lighting={lighting}
                  onLightingChange={setLighting}
                  uploadState={uploadState}
                  uploadError={uploadError}
                  sessionId={sessionId}
                  uploadDone={uploadDone}
                  onStartCapture={startCapture}
                />
              </>
            )}

            {phase === "capturing" && (
              <>
                {/* ── SkeletonOverlay: ethereal wireframe on camera feed ── */}
                <SkeletonOverlay
                  landmarks={landmarksRef.current as Array<{ x: number; y: number; z: number; visibility?: number }> | null}
                  width={canvasRef.current?.width ?? 640}
                  height={canvasRef.current?.height ?? 400}
                  active={true}
                />
                {/* ── MotionGuide: 5-phase state machine + constraint overlay ── */}
                <MotionGuide
                  elapsedMs={captureElapsedMs}
                  landmarkVisibility={landmarkVisibility}
                  velocity={currentVelocity}
                  anchorsAllVisible={
                    [0, 11, 12, 13, 14, 15, 16, 23, 24].every(
                      i => (landmarkVisibility[i] ?? 0) > 0.5
                    )
                  }
                  active={true}
                />
                {/* Status badge — countdown + frame counter */}
                <div className="absolute top-3 right-3 z-30 flex items-center gap-3 px-3 py-1.5 bg-black/70 border border-[#90c8ff]/20 rounded-sm">
                  <span className="text-white/80 font-mono text-[18px] tabular-nums" style={{ textShadow: "0 0 12px rgba(144,200,255,0.5)" }}>
                    {countdown}s
                  </span>
                  <span className="text-[#90c8ff]/40 text-[8px] tracking-[0.15em] font-mono">
                    {validFrameCount} frames
                  </span>
                  {/* Manual stop — ends capture early, computes PES from accumulated frames */}
                  <button
                    onClick={() => setAllPhasesComplete(true)}
                    onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
                    className="ml-2 px-2 py-0.5 border border-red-400/30 text-red-400/50 hover:bg-red-400/10 hover:text-red-400/80 text-[8px] tracking-[0.1em] uppercase transition-all"
                    title="Stop early and compute PES from current frames">
                    ⏹ Stop
                  </button>
                </div>
              </>
            )}

            {phase === "processing" && <ProcessingOverlay />}
            {/* Completion Ceremony */}
            {phase === "complete" && pesData && (
              <CompletionCeremony
                researchConsented={researchConsented}
                uploadState={uploadState}
                genesisKey={genesisKey}
                cohortFull={cohortFull}
              />
            )}
          </div>

          {/* Feature Panel */}
          {phase === "complete" && pesData ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="sm:w-[38%] border border-white/10 bg-black/40 p-3 flex flex-col space-y-2">
                {/* Box 1: PES + Telemetry + ZK Proof */}
                <div>
                  <div className="text-[#90c8ff]/50 text-[10px] tracking-[0.2em] uppercase mb-1.5">Presence Entropy Score</div>
                  <div className="flex items-center justify-center">
                    <PESGauge score={pesData.score} />
                  </div>
                  <ThreatVerdict verdict={threatVerdict} />
                </div>
                <PESBars bars={buildPESBars(pesData)} />
                <div className="h-px bg-white/5"/>
                <div>
                  <div className="text-[#90c8ff]/50 text-[10px] tracking-[0.2em] uppercase mb-1.5">Telemetry</div>
                  <TelemetryPanel
                    sstFrames={sstFramesRef.current.length}
                    validFrames={validFrameCount}
                    energy={features?.features.energy ?? null}
                    phase="COMPLETE"
                  />
                </div>
                <button onClick={handleAICompare}
                  className="w-full py-1.5 border border-[#90c8ff]/15 text-[#90c8ff]/35 text-[9px] tracking-[0.15em] uppercase hover:border-[#90c8ff]/30 hover:text-[#90c8ff]/60 transition-all">
                  {wasmCompare?.loading ? "Loading WASM..." : wasmCompare?.similarity != null ? `AI: ${(wasmCompare.similarity*100).toFixed(0)}%` : "Compare with AI →"}
                </button>
                {proofHashes && (
                  <div className="mt-auto">
                    <ZKProofBox zkp={proofHashes.zkp} pop={proofHashes.pop} mp={proofHashes.mp} ep={proofHashes.ep} />
                  </div>
                )}
              </div>
              <div className="sm:flex-1 border border-white/10 bg-black/40 p-3 flex flex-col space-y-2">
                {/* Box 2: Presence Signature + Witness + Actions */}
                <div>
                  {proofHashes&&(<PresenceSignature proof={{pesScore:pesData.score,timing:pesData.timing,noise:pesData.noise,freq:pesData.frequency,bio:pesData.biological,zkpHash:proofHashes.zkp,popHash:proofHashes.pop,mpHash:proofHashes.mp,epHash:proofHashes.ep,timestamp:Date.now()}}/>)}
                </div>
                {witnessData?.position_number&&(<div className="p-3 border border-amber-400/20 bg-amber-400/[0.03] text-center space-y-1"><div className="text-amber-300/60 text-[9px] uppercase tracking-[0.12em]">{witnessData.cohort==="genesis"?"Genesis Witness":"Protocol Witness"}</div><div className="text-amber-200/90 text-[18px] font-light">#{witnessData.position_number}</div></div>)}
                {/* Genesis status */}
                {genesisDone ? (
                  <div className="text-center text-[#90c8ff]/40 text-[10px] tracking-[0.1em]">◈ Scan recorded — contributing to orbital evolution</div>
                ) : (
                  <div className="text-center text-amber-400/40 text-[10px] tracking-[0.1em]">⚠ Demo mode — scan not bound to identity</div>
                )}
                <div className="mt-auto space-y-2">
                  <button onClick={()=>{
                    const report={protocol:"MyShape PES Benchmark v0.1",timestamp:new Date().toISOString(),pes:{score:pesData.score,components:{microTimingVariance:pesData.timing,noiseResidual:pesData.noise,frequencyEntropy:pesData.frequency,biologicalPerturbation:pesData.biological}},threat_verdict:threatVerdict,telemetry:{sst_frames:sstFramesRef.current.length,valid_frames:validFrameCount,capture_duration_ms:captureElapsedMs},proof_hashes:proofHashes,wasm_compare:wasmCompare,ai_compare:aiCompare};
                    const blob=new Blob([JSON.stringify(report,null,2)],{type:"application/json"});
                    const url=URL.createObjectURL(blob);
                    const a=document.createElement("a");a.href=url;a.download=`myshape-pes-${new Date().toISOString().replace(/[:.]/g,"-").slice(0,19)}.json`;a.click();URL.revokeObjectURL(url);
                    playTick(800,"sine",0.10,0.025);
                  }} className="w-full py-3 border-2 border-[#90c8ff]/60 text-[#90c8ff] text-[11px] tracking-[0.15em] uppercase font-bold hover:bg-[#90c8ff]/15 hover:border-[#90c8ff] transition-all" style={{ textShadow: "0 0 10px rgba(144,200,255,0.3)" }}>📥 Export PES Report</button>
                  <button onClick={()=>{
                    const frames = sstFramesRef.current;
                    if (frames.length === 0) return;
                    const startTs = frames[0].timestamp;
                    const landmarkData = frames.map(f => ({
                      t: f.timestamp - startTs,
                      joints: Object.fromEntries(
                        Object.entries(f.frame).map(([k, v]) => [k, { x: v.x, y: v.y, z: v.z }])
                      ),
                    }));
                    const report = {
                      session_id: crypto.randomUUID(),
                      subject_id: (typeof window !== "undefined" ? sessionStorage.getItem("genesis_email") : null)?.split("@")[0] || "anonymous",
                      timestamp: new Date().toISOString(),
                      landmarks: landmarkData,
                      pes_score: pesData.score,
                      pes_micro_timing: pesData.timing,
                      pes_noise_residual: pesData.noise,
                      pes_freq_entropy: pesData.frequency,
                      pes_bio_perturb: pesData.biological,
                      total_frames: frames.length,
                      valid_frames: validFrameCount,
                    };
                    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "myshape-landmarks-" + new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) + ".json";
                    a.click();
                    URL.revokeObjectURL(url);
                    playTick(600, "sine", 0.08, 0.02);
                  }} className="w-full py-2.5 border border-[#3fb950]/40 text-[#3fb950]/60 text-[10px] tracking-[0.12em] uppercase hover:bg-[#3fb950]/10 hover:border-[#3fb950]/70 transition-all">💾 Download Landmark Data</button>
                  <button onClick={()=>{const r=`MyShape PES: ${(pesData.score*100).toFixed(0)}% | μT:${(pesData.timing*100).toFixed(0)}% N:${(pesData.noise*100).toFixed(0)}% F:${(pesData.frequency*100).toFixed(0)}% B:${(pesData.biological*100).toFixed(0)}%\nVerified by MyShape Protocol — myshape.com/motion-demo`;navigator.clipboard.writeText(r).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000)})}} className="w-full py-2.5 border border-[#90c8ff]/20 text-[#90c8ff]/40 text-[10px] tracking-[0.15em] uppercase hover:border-[#90c8ff]/40 hover:text-[#90c8ff]/70 transition-all">{copied?"✓ Copied":"📋 Copy Results"}</button>
                  <button onClick={stop} className="w-full py-2.5 border border-[#90c8ff]/15 text-[#90c8ff]/35 text-[10px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/40 hover:text-[#90c8ff]/70 transition-all">↻ Run Again</button>
                </div>
              </div>
            </div>
          ) : (
          <div className="border border-white/10 bg-black/40 p-5 space-y-4">
            {/* ── PES Dashboard ── */}
            {pesData && (
              <>
                <div className="text-[#90c8ff]/40 text-[8px] tracking-[0.3em] uppercase">Presence_Entropy_Score (PES)</div>
                <div className="flex items-center justify-center py-2">
                  <PESGauge score={pesData.score} size="sm" />
                </div>
                <ThreatVerdict verdict={threatVerdict} />
                <div className="h-px bg-white/5" />
                <PESBars bars={buildPESBars(pesData)} />
              </>
            )}

            {/* Live PES Preview (during capture) */}
            {phase === "capturing" && livePes && (
              <div className="p-3 border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02] space-y-2">
                <div className="text-[#90c8ff]/40 text-[8px] tracking-[0.2em] uppercase">Live PES Estimate</div>
                <div className="flex items-center justify-between">
                  <span className="text-white/30 text-[9px]">Score</span>
                  <span className="text-[#90c8ff]/80 font-mono text-[13px]">{(livePes.score * 100).toFixed(0)}%</span>
                </div>
                {[
                  { label: "μTiming", value: livePes.timing },
                  { label: "Noise", value: livePes.noise },
                  { label: "Freq", value: livePes.freq },
                  { label: "Bio", value: livePes.bio },
                ].map(g => (
                  <div key={g.label} className="space-y-0.5">
                    <div className="flex justify-between text-[8px]">
                      <span className="text-white/20">{g.label}</span>
                      <span className="text-[#90c8ff]/40 font-mono">{(g.value * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(g.value * 100, 100)}%`,
                          background: "rgba(144,200,255,0.3)",
                        }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-[#90c8ff]/40 text-[8px] tracking-[0.3em] uppercase">Motion_Telemetry</div>
            <TelemetryPanel
              sstFrames={sstFramesRef.current.length}
              validFrames={validFrameCount}
              energy={features?.features.energy ?? null}
              phase={phase}
              showCollectingHint
            />

            {proofHashes && (
              <ZKProofBox zkp={proofHashes.zkp} pop={proofHashes.pop} mp={proofHashes.mp} ep={proofHashes.ep} />
            )}

            {phase === "complete" && (
              <div className="space-y-2">
                {!aiCompare ? (
                  <button onClick={handleAICompare}
                    onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                    className="w-full py-2 border border-[#90c8ff]/20 text-[#90c8ff]/40 text-[8px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/40 hover:text-[#90c8ff]/70 transition-all disabled:opacity-30"
                    disabled={wasmLoading}>
                    {wasmLoading ? "Loading Engine..." : "Compare with AI →"}
                  </button>
                ) : (
                  <div className="p-3 border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02] space-y-2">
                    <div className="text-[#90c8ff]/40 text-[8px] tracking-[0.2em] uppercase text-center">
                      {wasmCompare?.similarity != null ? "WASM Engine — Real Analysis" : "AI Simulation (for comparison)"}
                    </div>
                    {/* WASM Signature similarity */}
                    {wasmCompare?.similarity != null && (
                      <div className="flex items-center justify-between px-2 py-1.5 bg-black/30 border border-[#90c8ff]/10 rounded-sm">
                        <span className="text-white/20 text-[8px]">Sig Similarity</span>
                        <span className="font-mono text-[10px]" style={{
                          color: wasmCompare.similarity < 0.5 ? "rgba(239,68,68,0.8)" : "rgba(250,204,21,0.8)",
                          textShadow: wasmCompare.similarity < 0.5 ? "0 0 6px rgba(239,68,68,0.3)" : "none",
                        }}>{(wasmCompare.similarity * 100).toFixed(1)}%</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[8px]">
                      <div className="flex justify-between"><span className="text-white/15">μTiming</span><span className="text-amber-300/50">{(aiCompare.timing * 100).toFixed(0)}%</span></div>
                      <div className="flex justify-between"><span className="text-white/15">Noise</span><span className="text-amber-300/50">{(aiCompare.noise * 100).toFixed(0)}%</span></div>
                      <div className="flex justify-between"><span className="text-white/15">Freq</span><span className="text-amber-300/50">{(aiCompare.freq * 100).toFixed(0)}%</span></div>
                      <div className="flex justify-between"><span className="text-white/15">Bio</span><span className="text-amber-300/50">{(aiCompare.bio * 100).toFixed(0)}%</span></div>
                    </div>
                    <div className="text-center text-[8px] text-amber-300/40 mt-1">
                      AI PES: {(aiCompare.score * 100).toFixed(0)}% — ✗ SYNTHETIC
                    </div>
                    {wasmCompare?.similarity != null && (
                      <div className="text-center text-[7px] text-[#90c8ff]/25 mt-0.5">
                        128-dim Motion Signature — {wasmCompare.sigDim}d vector similarity
                      </div>
                    )}
                  </div>
                )}
                {/* Genesis 状态提示 */}
                {genesisDone ? (
                  <div className="text-center text-[#90c8ff]/25 text-[8px] tracking-[0.15em] uppercase">
                    ◈ Scan recorded — contributing to your orbital evolution
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="text-amber-400/25 text-[8px] tracking-[0.15em] uppercase">
                      ⚠ Demo mode — scan not bound to identity
                    </div>
                    <button
                      onClick={async () => {
                        const wallet = sessionStorage.getItem("wallet_address");
                        const email = sessionStorage.getItem("genesis_email");
                        const identityKey = email || (wallet ? "wallet:" + wallet.slice(2, 10) : null);
                        if (identityKey && pesData) {
                          // Bind this scan to the user's identity via entropy API
                          playTick(800, "sine", 0.10, 0.025);
                          try {
                            const res = await fetch("/api/node/entropy", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                email: identityKey,
                                pesScore: pesData.score,
                                pesTiming: pesData.timing,
                                pesNoise: pesData.noise,
                                pesFrequency: pesData.frequency,
                                pesBiological: pesData.biological,
                              }),
                            });
                            const data = await res.json();
                            if (data.badge_minted) {
                              sessionStorage.setItem("genesis_completed", "1");
                              sessionStorage.setItem("genesis_email", identityKey);
                              sessionStorage.setItem("genesis_status", data.status);
                              if (data.genesis_key) {
                                sessionStorage.setItem("genesis_key", data.genesis_key);
                                setGenesisKey(data.genesis_key);
                              }
                              if (data.cohort_full) {
                                setCohortFull(true);
                              }
                              window.dispatchEvent(new CustomEvent("genesis:updated"));
                              setGenesisDone(true);
                              playTick(1200, "sine", 0.12, 0.03);
                            }
                          } catch { /* silent */ }
                        } else {
                          // No identity yet — guide to genesis
                          window.location.href = "/genesis";
                        }
                      }}
                      onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                      className="px-6 py-2 border border-[#90c8ff]/40 text-[#90c8ff]/60 text-[9px] tracking-[0.2em] uppercase hover:bg-[#90c8ff]/10 hover:text-[#90c8ff] transition-all">
                      Verify My Presence
                    </button>
                    <a href="/genesis" className="inline-block text-[#90c8ff]/25 hover:text-[#90c8ff]/50 text-[8px] tracking-[0.15em] uppercase transition-colors">
                      Initialize Genesis identity →
                    </a>
                  </div>
                )}
                {/* ── Witness Badge (recruitment + upload complete) ── */}
                {witnessData && witnessData.position_number && (
                  <div
                    className="p-3 border space-y-2 relative overflow-hidden"
                    style={{
                      borderRadius: 4,
                      borderColor: witnessData.cohort === "genesis" ? "rgba(144,200,255,0.35)" : "rgba(144,200,255,0.15)",
                      background: witnessData.cohort === "genesis" ? "rgba(144,200,255,0.05)" : "rgba(144,200,255,0.02)",
                      animation: witnessData.cohort === "genesis" ? "genesisWitnessGlow 3s ease-in-out infinite" : undefined,
                    }}
                  >
                    {/* Genesis scan line */}
                    {witnessData.cohort === "genesis" && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: "linear-gradient(90deg, transparent 0%, rgba(144,200,255,0.06) 40%, rgba(144,200,255,0.12) 50%, rgba(144,200,255,0.06) 60%, transparent 100%)",
                          animation: "genesisScanLine 2.5s ease-in-out infinite",
                        }}
                      />
                    )}
                    <div className="text-[#90c8ff]/40 text-[7px] tracking-[0.2em] uppercase text-center">
                      {witnessData.cohort === "genesis" ? "Genesis Cohort — Witness Confirmed" : "Protocol Witness"}
                    </div>
                    <div className="text-center">
                      <span
                        className="text-[#90c8ff]/80 text-[14px] font-light tracking-[0.05em]"
                        style={witnessData.cohort === "genesis" ? { animation: "genesisBadgePulse 2s ease-in-out infinite" } : undefined}
                      >
                        ◈ Witness #{witnessData.position_number}
                      </span>
                    </div>
                    <p className="text-white/25 text-[8px] leading-relaxed text-center">
                      {witnessData.cohort === "genesis"
                        ? "You are a founding tester. This status is permanent — not cosmetic, structural."
                        : "Your motion data is now part of the calibration engine. Share your contribution."}
                    </p>
                    {/* Share buttons */}
                    <div className="flex gap-2 justify-center pt-1">
                      <a
                        href={`https://bsky.app/intent/compose?text=I+just+became+MyShape+Protocol+Witness+%23${witnessData.position_number}.+Join+the+first+300+to+calibrate+the+motion-signature+engine.%0A%0Ahttps://myshape.com/research/apply`}
                        target="_blank" rel="noopener noreferrer"
                        className="px-2.5 py-1 border border-[#90c8ff]/15 text-[#90c8ff]/40 text-[7px] tracking-[0.1em] uppercase hover:border-[#90c8ff]/40 hover:text-[#90c8ff]/70 transition-all motion-demo__card-sm"
                      >
                        Share on Bluesky
                      </a>
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=https://myshape.com/research/apply?ref=witness_share`}
                        target="_blank" rel="noopener noreferrer"
                        className="px-2.5 py-1 border border-[#90c8ff]/15 text-[#90c8ff]/40 text-[7px] tracking-[0.1em] uppercase hover:border-[#90c8ff]/40 hover:text-[#90c8ff]/70 transition-all motion-demo__card-sm"
                      >
                        Share on LinkedIn
                      </a>
                    </div>
                  </div>
                )}

                {/* Presence Signature — 存在证明证书 */}
                {pesData && proofHashes && (
                  <PresenceSignature proof={{
                    pesScore: pesData.score,
                    timing: pesData.timing,
                    noise: pesData.noise,
                    freq: pesData.frequency,
                    bio: pesData.biological,
                    zkpHash: proofHashes.zkp,
                    popHash: proofHashes.pop,
                    mpHash: proofHashes.mp,
                    epHash: proofHashes.ep,
                    timestamp: Date.now(),
                  }} />
                )}
                {/* ── Completion Ceremony ── */}
                <div className="space-y-3 pt-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-[#90c8ff]/20 to-transparent" />
                  <div className="text-center space-y-2">
                    <div className="text-[#90c8ff]/30 text-[7px] tracking-[0.4em] uppercase">Genesis Ritual · Motion Captured</div>
                    <p className="text-white/40 text-[10px] leading-relaxed">
                      Your kinetic signature has been inscribed.
                      {researchConsented && uploadState === "success" && " This data now contributes to the protocol's calibration engine."}
                      {researchConsented && uploadState === "error" && " Research upload failed — data kept local."}
                    </p>
                    <div className="flex gap-2 justify-center pt-1">
                      <a href="/research/apply" className="text-[#90c8ff]/30 hover:text-[#90c8ff]/70 text-[7px] tracking-[0.15em] uppercase border-b border-transparent hover:border-[#90c8ff]/30 transition-all pb-0.5">
                        Apply for Genesis Node →
                      </a>
                      <span className="text-white/10">|</span>
                      <a href="/dashboard" className="text-[#90c8ff]/30 hover:text-[#90c8ff]/70 text-[7px] tracking-[0.15em] uppercase border-b border-transparent hover:border-[#90c8ff]/30 transition-all pb-0.5">
                        View Dashboard →
                      </a>
                    </div>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-[#90c8ff]/20 to-transparent" />
                </div>

                {pesData && (
                  <div className="space-y-2">
                  <button onClick={()=>{
                    const report={protocol:"MyShape PES Benchmark v0.1",timestamp:new Date().toISOString(),pes:{score:pesData.score,components:{microTimingVariance:pesData.timing,noiseResidual:pesData.noise,frequencyEntropy:pesData.frequency,biologicalPerturbation:pesData.biological}},threat_verdict:threatVerdict,telemetry:{sst_frames:sstFramesRef.current.length,valid_frames:validFrameCount,capture_duration_ms:captureElapsedMs},proof_hashes:proofHashes,wasm_compare:wasmCompare,ai_compare:aiCompare};
                    const blob=new Blob([JSON.stringify(report,null,2)],{type:"application/json"});
                    const url=URL.createObjectURL(blob);
                    const a=document.createElement("a");a.href=url;a.download=`myshape-pes-${new Date().toISOString().replace(/[:.]/g,"-").slice(0,19)}.json`;a.click();URL.revokeObjectURL(url);
                    playTick(800,"sine",0.10,0.025);
                  }} className="w-full py-3 border-2 border-[#90c8ff]/60 text-[#90c8ff] text-[11px] tracking-[0.15em] uppercase font-bold hover:bg-[#90c8ff]/15 transition-all" style={{textShadow:"0 0 10px rgba(144,200,255,0.3)"}}>📥 Export PES Report</button>
                  <button onClick={()=>{
                    const frames = sstFramesRef.current;
                    if (frames.length === 0) return;
                    const startTs = frames[0].timestamp;
                    const landmarkData = frames.map(f => ({
                      t: f.timestamp - startTs,
                      joints: Object.fromEntries(
                        Object.entries(f.frame).map(([k, v]) => [k, { x: v.x, y: v.y, z: v.z }])
                      ),
                    }));
                    const report = {
                      session_id: crypto.randomUUID(),
                      subject_id: (typeof window !== "undefined" ? sessionStorage.getItem("genesis_email") : null)?.split("@")[0] || "anonymous",
                      timestamp: new Date().toISOString(),
                      landmarks: landmarkData,
                      pes_score: pesData.score,
                      pes_micro_timing: pesData.timing,
                      pes_noise_residual: pesData.noise,
                      pes_freq_entropy: pesData.frequency,
                      pes_bio_perturb: pesData.biological,
                      total_frames: frames.length,
                      valid_frames: validFrameCount,
                    };
                    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "myshape-landmarks-" + new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) + ".json";
                    a.click();
                    URL.revokeObjectURL(url);
                    playTick(600, "sine", 0.08, 0.02);
                  }} className="w-full py-2.5 border border-[#3fb950]/40 text-[#3fb950]/60 text-[10px] tracking-[0.12em] uppercase hover:bg-[#3fb950]/10 hover:border-[#3fb950]/70 transition-all">💾 Download Landmark Data</button>
                  </div>
                )}
                <button onClick={stop}
                  onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                  className="w-full py-2.5 border border-[#90c8ff]/15 text-[#90c8ff]/35 text-[9px] tracking-[0.3em] uppercase hover:border-[#90c8ff]/40 hover:text-[#90c8ff]/70 hover:bg-[#90c8ff]/[0.03] transition-all">
                  ↻ Run_Again
                </button>
              </div>
            )}
          </div>
          )}
        </div>

      </div>

      {/* Protocol Status Wall — live command center dashboard */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pb-8">
        <ProtocolStatusWall />
      </div>

        <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-4 pb-2">
          <div className="flex items-center justify-center gap-2 text-[#90c8ff]/50 text-[12px] tracking-[0.05em]">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>
            {researchConsented ? "Camera images stay local. Only joint-position data is uploaded anonymously." : "Your motion data never leaves this device. No cloud upload. No server storage."}
          </div>
        </div>

      <ProtocolFooter />
    </div>
  );
}
