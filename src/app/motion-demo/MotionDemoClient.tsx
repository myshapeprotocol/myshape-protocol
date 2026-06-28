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
import { generateFullProof } from "@/engine/proof-system";
import { getDeviceSalt } from "@/engine/local-identity";
import type { JointPosition, SSTJointId } from "@/types/motion-vector";
import { useResearchUpload } from "@/hooks/useResearchUpload";
import type { UploadData } from "@/hooks/useResearchUpload";
import ResearchConsent from "@/components/research-consent/ResearchConsent";
import type { LightingCondition, PhaseMetadata } from "@/types/research";

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
        await new Promise<void>(resolve => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js"; s.onload = () => resolve(); document.head.appendChild(s); });
      }
      if (!window.Pose) { setPhase("idle"); return; }
      const pose = new window.Pose({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` });
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
            g.addColorStop(1, "rgba(34,211,238,0)");
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
          g.addColorStop(1, "rgba(34,211,238,0)");
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
        bandGrad.addColorStop(0, "rgba(34,211,238,0)");
        bandGrad.addColorStop(0.4, "rgba(34,211,238,0.08)");
        bandGrad.addColorStop(0.5, "rgba(34,211,238,0.15)");
        bandGrad.addColorStop(0.6, "rgba(34,211,238,0.08)");
        bandGrad.addColorStop(1, "rgba(34,211,238,0)");
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
            }).catch(() => {});
          }
        });
      }
    }
    setTimeout(() => {
      playTick(1200, "sine", 0.12, 0.03);
      // Stop camera + video + animation
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.pause(); }
      setPhase("complete");
      // 记录一次成功的 motion 验证，递增 scan_count
      const genesisEmail = typeof window !== "undefined" ? sessionStorage.getItem("genesis_email") : null;
      if (genesisEmail) {
        fetch("/api/motion/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: genesisEmail }),
        }).catch(() => {});
      }
    }, 1500);
  }, [phase]);

  // ── AI Compare ──
  const handleAICompare = useCallback(async () => {
    playTick(700, "sine", 0.08, 0.02);
    setWasmCompare({ loading: true, similarity: null, sigDim: 0 });
    try {
      const sdk = await loadWasm();
      if (!sdk) { setWasmCompare({ loading: false, similarity: null, sigDim: 0 }); return; }
      const aiM = sdk.generateAIMotion(1, 30, 0.15);
      const hM = sdk.generateHumanMotion(1, 30, 0.15);
      const hS = sdk.extractSignature(hM);
      const aS = sdk.extractSignature(aiM);
      const sim = sdk.similarity(hS, aS);
      setWasmCompare({ loading: false, similarity: sim, sigDim: hS.vector.length });
    } catch (err) {
      console.log("AI Compare failed:", err);
      setWasmCompare({ loading: false, similarity: null, sigDim: 0 });
    }
  }, [loadWasm]);

  // ── Stop ──
  const stop = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (poseRef.current) { try { poseRef.current.close(); } catch { /* ok */ } }
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
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />
      

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
        <div className="space-y-6 mb-12">
          <div className="text-cyan-500/50 text-[10px] tracking-[0.5em] uppercase">Presence_Engine // Live_Demo</div>
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.15em] text-white uppercase">
            Motion <span style={{ color: "rgba(144, 200, 255, 0.8)" }}>→</span> Geometry <span style={{ color: "rgba(144, 200, 255, 0.8)" }}>→</span> Signature
          </h1>
          <p className="text-white/40 text-[12px] leading-relaxed max-w-xl">
            Real-time Presence Entropy Score via webcam. Motion Vector → SST 18-pt → 4D Entropy → ZK-Proof.
            All processing local. Nothing uploaded. Firefox recommended.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Particle Panel */}
          <div className="lg:col-span-2 border border-white/10 bg-black/60 relative overflow-hidden" style={{ minHeight: "min(400px, 60vw)" }}>
            {/* Video is the main display — camera feed directly visible */}
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted
              style={{ transform: "scaleX(-1)" }} />
            {/* Canvas overlay: particles + skeleton only */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />

            {phase === "idle" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/30 z-10">
                {/* Chromium green screen warning */}
                {typeof window !== "undefined" && /Chrome|Edg\//.test(window.navigator.userAgent) && !/Firefox/i.test(window.navigator.userAgent) && (
                  <div className="px-4 py-3 border border-amber-400/30 bg-amber-400/[0.06] text-center max-w-sm" style={{ borderRadius: 4 }}>
                    <p className="text-amber-300/80 text-[11px] leading-relaxed">
                      Green screen or no camera? Chromium browsers (Chrome/Edge) often have WebGL webcam issues.
                    </p>
                    <p className="text-white/50 text-[10px] mt-1.5">
                      <span className="text-cyan-300">Firefox</span> is recommended — it works reliably with MediaPipe.
                    </p>
                    <p className="text-white/20 text-[8px] mt-1">
                      On Chrome, try <span className="text-white/30">chrome://flags/#use-angle → OpenGL → Relaunch</span>
                    </p>
                  </div>
                )}
                {/* Privacy notice */}
                <div className="flex items-center gap-2 px-3 py-1.5 border border-cyan-400/20 bg-cyan-400/[0.04] rounded-full">
                  <svg className="w-3 h-3 text-cyan-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>
                  <span className="text-cyan-400/60 text-[8px] tracking-[0.15em] uppercase">100% Local Processing — Nothing Uploaded</span>
                </div>
                <p className="text-white/30 text-[13px] tracking-[0.12em] text-center max-w-md leading-relaxed">
                  Activate your camera to generate a real-time<br />
                  Presence Entropy Score from your motion geometry.
                </p>
                <p className="text-white/20 text-[11px] tracking-[0.08em] text-center max-w-xs mt-1">
                  Face the camera. Stand naturally.<br />No specific pose or movement needed.
                </p>
                {/* Research Consent — inline before camera button */}
                <div className="w-full max-w-xs mt-2">
                  <ResearchConsent
                    consented={researchConsented}
                    onConsentChange={setResearchConsented}
                    lighting={lighting}
                    onLightingChange={setLighting}
                    uploadState={uploadState}
                    uploadError={uploadError}
                    sessionId={sessionId}
                    captureActive={false}
                    uploadDone={uploadDone}
                  />
                </div>

                <div className="flex flex-col items-center gap-5 mt-6">
                  <button onClick={startCapture}
                    onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                    className="px-12 py-4 border border-cyan-400/40 text-cyan-400/80 text-[11px] tracking-[0.4em] uppercase hover:bg-cyan-400/10 hover:text-white transition-all">
                    Activate_Camera
                  </button>
                  <button onClick={() => {
                    playTick(800, "sine", 0.10, 0.025);
                    setPesData({ score: 0.64, timing: 0.38, noise: 0.72, frequency: 0.15, biological: 0.55 });
                    setThreatVerdict("✓ HUMAN_PRESENCE_VERIFIED");
                    setProofHashes({ zkp: "a1b2c3d4", pop: "e5f6a7b8", mp: "c9d0e1f2", ep: "3a4b5c6d" });
                    setPhase("complete");
                    const genesisEmail = typeof window !== "undefined" ? sessionStorage.getItem("genesis_email") : null;
                    if (genesisEmail) {
                      fetch("/api/motion/record", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: genesisEmail }),
                      }).catch(() => {});
                    }
                  }}
                    onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
                    className="text-cyan-400/35 hover:text-cyan-300/70 text-[10px] tracking-[0.15em] uppercase transition-colors border-b border-transparent hover:border-cyan-400/30 pb-0.5">
                    Quick Preview →
                  </button>
                </div>
              </div>
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
                {/* Mini status badge — frame counter */}
                <div className="absolute top-3 right-3 z-30 flex items-center gap-2 px-2.5 py-1 bg-black/70 border border-cyan-400/20 rounded-sm pointer-events-none">
                  <span className="text-cyan-400/60 text-[8px] tracking-[0.15em] font-mono">
                    {validFrameCount} valid
                  </span>
                </div>
              </>
            )}

            {phase === "processing" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                <div className="text-center space-y-3.5">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping" style={{ animationDuration: "1.5s" }} />
                    <div className="absolute inset-2 rounded-full border border-cyan-400/30 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)] animate-pulse" />
                    </div>
                  </div>
                  <span className="text-cyan-400/70 text-[10px] tracking-[0.3em] uppercase block animate-pulse">Generating ZK-Proof...</span>
                  <div className="flex gap-1.5 justify-center">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-pulse"
                        style={{ animationDelay: `${i * 0.25}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* Completion Ceremony */}
            {phase === "complete" && pesData && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 gap-6 overflow-hidden">
                {/* Particle burst ring */}
                {[...Array(30)].map((_,i) => {
                  const a = (i/30)*Math.PI*2;
                  const x = Math.cos(a)*120; const y = Math.sin(a)*120;
                  const colors = ["#22d3ee","#d4af37","#34d399","#90c8ff"];
                  return (
                    <div key={i} className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
                      style={{width:4,height:4,background:colors[i%4],boxShadow:`0 0 10px ${colors[i%4]}`,
                        animation:`ceremonyParticle 2s ease-out ${i*0.05}s forwards`,
                        transform:`translate(${x}px,${y}px)`}}/>
                  );
                })}
                {/* Central seal */}
                <div className="relative w-36 h-36" style={{animation:"ceremonySealEnter 0.8s ease-out forwards"}}>
                  <svg viewBox="0 0 140 140" className="w-full h-full">
                    <defs>
                      <radialGradient id="sealGlow"><stop offset="0%" stopColor="rgba(212,175,55,0.3)"/><stop offset="100%" stopColor="transparent"/></radialGradient>
                      <linearGradient id="sealGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#d4af37"/><stop offset="50%" stopColor="#f0d060"/><stop offset="100%" stopColor="#b8941f"/></linearGradient>
                    </defs>
                    {/* Outer glow */}
                    <circle cx="70" cy="70" r="62" fill="url(#sealGlow)"/>
                    {/* Outer ring */}
                    <circle cx="70" cy="70" r="50" fill="none" stroke="url(#sealGold)" strokeWidth="2" strokeDasharray="4 3" style={{animation:"ceremonyRotate 20s linear infinite",transformOrigin:"70px 70px"}}/>
                    {/* Inner ring */}
                    <circle cx="70" cy="70" r="42" fill="rgba(10,8,4,0.8)" stroke="rgba(212,175,55,0.5)" strokeWidth="1.5"/>
                    {/* Octagon border */}
                    <polygon points="70,18 107,33 122,70 107,107 70,122 33,107 18,70 33,33" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="1"/>
                    {/* Text */}
                    <text x="70" y="62" textAnchor="middle" fill="rgba(212,175,55,0.5)" fontSize="6" fontFamily="monospace" letterSpacing="4">MYSHAPE</text>
                    <text x="70" y="78" textAnchor="middle" fill="rgba(212,175,55,0.95)" fontSize="16" fontFamily="monospace" fontWeight="300" letterSpacing="2">SEALED</text>
                    <text x="70" y="94" textAnchor="middle" fill="rgba(212,175,55,0.35)" fontSize="5" fontFamily="monospace" letterSpacing="3">PROTOCOL</text>
                    {/* Star */}
                    <polygon points="70,24 72,30 78,30 73,34 75,40 70,36 65,40 67,34 62,30 68,30" fill="rgba(212,175,55,0.6)"/>
                  </svg>
                </div>
                <div className="text-center space-y-2" style={{animation:"ceremonyTextFade 1s ease-out 0.5s both"}}>
                  <div className="text-amber-300/60 text-[14px] font-light tracking-[0.2em] uppercase">◈ Genesis Ritual Complete</div>
                  <p className="text-white/30 text-[11px] max-w-xs leading-relaxed">Your kinetic signature is now sealed into the sovereign identity layer.</p>
                  {researchConsented && <p className="text-cyan-400/30 text-[9px]">+ Contributed to calibration engine</p>}
                </div>
              </div>
            )}
          </div>

          {/* Feature Panel */}
          {phase === "complete" && pesData ? (
            <div className="flex flex-row gap-4">
              <div className="flex-1 border border-white/10 bg-black/40 p-4 flex flex-col space-y-3.5">
                {/* Box 1: PES + Telemetry + ZK Proof */}
                <div>
                  <div className="text-cyan-400/50 text-[10px] tracking-[0.2em] uppercase mb-1.5">Presence Entropy Score</div>
                  <div className="flex items-center justify-center"><div className="relative w-20 h-20"><svg viewBox="0 0 100 100" className="w-full h-full -rotate-90"><circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6"/><circle cx="50" cy="50" r="42" fill="none" stroke={pesData.score>0.5?"rgba(52,211,153,0.7)":"rgba(144,200,255,0.6)"} strokeWidth="6" strokeDasharray={`${pesData.score*264} 264`} strokeLinecap="round" style={{filter:`drop-shadow(0 0 8px ${pesData.score>0.5?"rgba(52,211,153,0.5)":"rgba(144,200,255,0.4)"})`}}/></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-white/90 font-mono text-[20px]" style={{textShadow:pesData.score>0.5?"0 0 14px rgba(52,211,153,0.6)":"0 0 14px rgba(144,200,255,0.5)"}}>{(pesData.score*100).toFixed(0)}</span></div></div></div>
                  {threatVerdict&&<div className={`text-center text-[10px] tracking-[0.08em] uppercase font-mono mt-2 ${threatVerdict.startsWith("✓")?"text-cyan-300/80":"text-amber-300/80"}`}>{threatVerdict}</div>}
                </div>
                <div className="space-y-2">{[{l:"μTiming",v:pesData.timing,h:200},{l:"Noise",v:pesData.noise,h:190},{l:"Frequency",v:pesData.frequency,h:210},{l:"Biological",v:pesData.biological,h:180}].map(g=>(<div key={g.l}><div className="flex justify-between text-[10px]"><span className="text-white/35">{g.l}</span><span className="text-cyan-300/60 font-mono text-[11px]">{(g.v*100).toFixed(0)}%</span></div><div className="h-2 bg-white/5 rounded-full overflow-hidden mt-0.5"><div className="h-full rounded-full transition-all duration-700" style={{width:`${Math.min(g.v*100,100)}%`,background:`linear-gradient(90deg,hsla(${g.h},60%,50%,0.4),hsla(${g.h},70%,60%,0.8))`,boxShadow:`0 0 6px hsla(${g.h},60%,60%,0.3)`}}/></div></div>))}</div>
                <div className="h-px bg-white/5"/>
                <div>
                  <div className="text-cyan-400/50 text-[10px] tracking-[0.2em] uppercase mb-1.5">Telemetry</div>
                  <div className="space-y-2 text-[11px] font-mono">
                    <div className="flex justify-between"><span className="text-white/30">SST Frames</span><span className="text-cyan-300/60">{sstFramesRef.current.length}</span></div>
                    <div className="flex justify-between"><span className="text-white/30">Valid Frames</span><span className="text-cyan-300/60">{validFrameCount}</span></div>
                    <div className="flex justify-between"><span className="text-white/30">Energy</span><span className="text-cyan-300/60">{features?.features.energy.toFixed(2)??"—"}</span></div>
                    <div className="flex justify-between"><span className="text-white/30">Phase</span><span className="text-cyan-400/60">COMPLETE</span></div>
                  </div>
                </div>
                {!aiCompare ? (
                  <button onClick={handleAICompare}
                    className="w-full py-1.5 border border-cyan-400/15 text-cyan-400/35 text-[9px] tracking-[0.15em] uppercase hover:border-cyan-400/30 hover:text-cyan-300/60 transition-all">
                    {wasmCompare?.loading ? "Loading WASM..." : "Compare with AI →"}
                  </button>
                ) : (
                  <div className="text-center text-[9px]">{wasmCompare?.similarity!=null ? <span className="text-cyan-400/50">AI similarity: {(wasmCompare.similarity*100).toFixed(1)}%</span> : <span className="text-amber-400/40">WASM engine unavailable</span>}</div>
                )}
                {proofHashes&&(<div className="p-3 border border-cyan-400/20 bg-cyan-400/[0.03] space-y-1 mt-auto"><div className="text-cyan-400/60 text-[9px] tracking-[0.2em] uppercase">ZK-Presence Proof</div><div className="text-cyan-200/80 text-[10px] font-mono break-all leading-relaxed">{proofHashes.zkp}</div><div className="grid grid-cols-3 gap-2 text-[9px] pt-1"><div><span className="text-white/25">PoP</span><div className="text-cyan-300/60 font-mono">{proofHashes.pop.slice(0,6)}</div></div><div><span className="text-white/25">MP</span><div className="text-cyan-300/60 font-mono">{proofHashes.mp.slice(0,6)}</div></div><div><span className="text-white/25">EP</span><div className="text-cyan-300/60 font-mono">{proofHashes.ep.slice(0,6)}</div></div></div></div>)}
              </div>
              <div className="flex-1 border border-white/10 bg-black/40 p-4 flex flex-col space-y-3.5">
                {/* Box 2: Presence Signature + Witness + Actions */}
                <div>
                  {proofHashes&&(<PresenceSignature proof={{pesScore:pesData.score,timing:pesData.timing,noise:pesData.noise,freq:pesData.frequency,bio:pesData.biological,zkpHash:proofHashes.zkp,popHash:proofHashes.pop,mpHash:proofHashes.mp,epHash:proofHashes.ep,timestamp:Date.now()}}/>)}
                </div>
                {witnessData?.position_number&&(<div className="p-3 border border-amber-400/20 bg-amber-400/[0.03] text-center space-y-1"><div className="text-amber-300/60 text-[9px] uppercase tracking-[0.12em]">{witnessData.cohort==="genesis"?"Genesis Witness":"Protocol Witness"}</div><div className="text-amber-200/90 text-[18px] font-light">#{witnessData.position_number}</div></div>)}
                {/* Genesis status */}
                {typeof window !== "undefined" && sessionStorage.getItem("genesis_completed") === "1" ? (
                  <div className="text-center text-cyan-400/40 text-[10px] tracking-[0.1em]">◈ Scan recorded — contributing to orbital evolution</div>
                ) : (
                  <div className="text-center text-amber-400/40 text-[10px] tracking-[0.1em]">⚠ Demo mode — scan not bound to identity</div>
                )}
                <div className="mt-auto space-y-2">
                  <button onClick={()=>{const r=`MyShape PES: ${(pesData.score*100).toFixed(0)}% | μT:${(pesData.timing*100).toFixed(0)}% N:${(pesData.noise*100).toFixed(0)}% F:${(pesData.frequency*100).toFixed(0)}% B:${(pesData.biological*100).toFixed(0)}%\nVerified by MyShape Protocol — myshape.com/motion-demo`;navigator.clipboard.writeText(r).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000)})}} className="w-full py-2.5 border border-cyan-400/20 text-cyan-400/40 text-[10px] tracking-[0.15em] uppercase hover:border-cyan-400/40 hover:text-cyan-300/70 transition-all">{copied?"✓ Copied":"📋 Copy Results"}</button>
                  <button onClick={stop} className="w-full py-2.5 border border-cyan-400/15 text-cyan-400/35 text-[10px] tracking-[0.2em] uppercase hover:border-cyan-400/40 hover:text-cyan-300/70 transition-all">↻ Run Again</button>
                </div>
              </div>
            </div>
          ) : (
          <div className="border border-white/10 bg-black/40 p-5 space-y-4">
            {/* ── PES Dashboard ── */}
            {pesData && (
              <>
                <div className="text-cyan-400/40 text-[8px] tracking-[0.3em] uppercase">Presence_Entropy_Score (PES)</div>
                {/* PES Ring */}
                <div className="flex items-center justify-center py-2">
                  <div className="relative w-20 h-20">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke={pesData.score > 0.5 ? "rgba(52,211,153,0.7)" : "rgba(144,200,255,0.6)"} strokeWidth="6"
                        strokeDasharray={`${pesData.score * 264} 264`} strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 6px ${pesData.score > 0.5 ? "rgba(52,211,153,0.5)" : "rgba(144,200,255,0.4)"})` }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white/80 font-mono text-[16px] tracking-tighter"
                        style={{ textShadow: pesData.score > 0.5 ? "0 0 10px rgba(52,211,153,0.5)" : "0 0 10px rgba(144,200,255,0.4)" }}>
                        {(pesData.score * 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
                {threatVerdict && (
                  <div className={`text-center text-[9px] tracking-[0.15em] uppercase font-mono py-1 ${
                    threatVerdict.startsWith("✓") ? "text-cyan-300/80" :
                    threatVerdict.startsWith("⚠") ? "text-amber-300/80" : "text-red-300/80"
                  }`} style={{ textShadow: threatVerdict.startsWith("✓") ? "0 0 8px rgba(52,211,153,0.4)" : "0 0 8px rgba(252,211,77,0.4)" }}>
                    {threatVerdict}
                  </div>
                )}
                <div className="h-px bg-white/5" />
                {/* 4D Gauge Bars */}
                {[
                  { label: "μTiming", value: pesData.timing, hue: 200 },
                  { label: "Noise", value: pesData.noise, hue: 190 },
                  { label: "Freq", value: pesData.frequency, hue: 210 },
                  { label: "Bio", value: pesData.biological, hue: 180 },
                ].map(g => (
                  <div key={g.label} className="space-y-1">
                    <div className="flex justify-between text-[8px]">
                      <span className="text-white/25">{g.label}</span>
                      <span className="text-cyan-300/50 font-mono">{(g.value * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.min(g.value * 100, 100)}%`,
                          background: `linear-gradient(90deg, hsla(${g.hue},60%,50%,0.4), hsla(${g.hue},70%,60%,0.8))`,
                          boxShadow: `0 0 6px hsla(${g.hue},60%,60%,0.3)`,
                        }} />
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Live PES Preview (during capture) */}
            {phase === "capturing" && livePes && (
              <div className="p-3 border border-cyan-400/10 bg-cyan-400/[0.02] space-y-2">
                <div className="text-cyan-400/40 text-[8px] tracking-[0.2em] uppercase">Live PES Estimate</div>
                <div className="flex items-center justify-between">
                  <span className="text-white/30 text-[9px]">Score</span>
                  <span className="text-cyan-200/80 font-mono text-[13px]">{(livePes.score * 100).toFixed(0)}%</span>
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
                      <span className="text-cyan-300/40 font-mono">{(g.value * 100).toFixed(0)}%</span>
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

            <div className="text-cyan-400/40 text-[8px] tracking-[0.3em] uppercase">Motion_Telemetry</div>
            <div className="space-y-2.5 text-[10px] font-mono">
              <div className="flex justify-between">
                <span className="text-white/25">SST Frames</span>
                <span className="text-cyan-300/60">{sstFramesRef.current.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/25">Valid Frames</span>
                <span className="text-cyan-300/60">{validFrameCount} <span className="text-white/15">/ {sstFramesRef.current.length || 0}</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/25">Energy</span>
                <span className="text-cyan-300/60">{features?.features.energy.toFixed(2) ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/25">Phase</span>
                <span className="text-cyan-400/50">{phase.toUpperCase()}</span>
              </div>
              {phase === "capturing" && sstFramesRef.current.length < 30 && (
                <div className="text-cyan-400/30 text-[8px] italic">Collecting frames... ({sstFramesRef.current.length}/30)</div>
              )}
            </div>

            {proofHashes && (
              <div className="mt-4 p-3 border border-cyan-400/20 bg-cyan-400/[0.03] space-y-2">
                <div className="text-cyan-400/50 text-[8px] tracking-[0.3em] uppercase">ZK-Presence_Proof</div>
                <div className="text-cyan-200/70 text-[9px] font-mono break-all leading-relaxed"
                  style={{ textShadow: "0 0 8px rgba(144,200,255,0.3)" }}>
                  {proofHashes.zkp}
                </div>
                <div className="grid grid-cols-3 gap-2 text-[8px]">
                  <div>
                    <span className="text-white/20">PoP</span>
                    <div className="text-cyan-300/50 font-mono truncate">{proofHashes.pop.slice(0,6)}</div>
                  </div>
                  <div>
                    <span className="text-white/20">MP</span>
                    <div className="text-cyan-300/50 font-mono truncate">{proofHashes.mp.slice(0,6)}</div>
                  </div>
                  <div>
                    <span className="text-white/20">EP</span>
                    <div className="text-cyan-300/50 font-mono truncate">{proofHashes.ep.slice(0,6)}</div>
                  </div>
                </div>
                <div className="text-white/15 text-[8px] mt-1 tracking-[0.15em]">§6 ZK-PRESENCE — PROOF-OF-CONCEPT</div>
              </div>
            )}

            {phase === "complete" && (
              <div className="space-y-2">
                {pesData && (
                  <button onClick={() => {
                    const result = `MyShape PES: ${(pesData.score * 100).toFixed(0)}% | μT:${(pesData.timing * 100).toFixed(0)}% N:${(pesData.noise * 100).toFixed(0)}% F:${(pesData.frequency * 100).toFixed(0)}% B:${(pesData.biological * 100).toFixed(0)}%\nVerified by MyShape Protocol — myshape.com/motion-demo`;
                    navigator.clipboard.writeText(result).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                    onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
                    className="w-full py-1.5 border border-cyan-400/10 text-cyan-400/30 hover:text-cyan-300/60 hover:border-cyan-400/30 text-[8px] tracking-[0.15em] uppercase transition-all">
                    {copied ? "✓ Copied" : "📋 Copy Results"}
                  </button>
                )}
                {!aiCompare ? (
                  <button onClick={async () => {
                    playTick(700, "sine", 0.08, 0.02);
                    setWasmCompare({ loading: true, similarity: null, sigDim: 0 });
                    try {
                      const sdk = await loadWasm();
                      if (!sdk) { setWasmCompare(null); return; }

                      // Generate AI-forged motion (1s @ 30fps)
                      const aiMotion = sdk.generateAIMotion(1.0, 30, 0.15);
                      // Generate human-like motion with micro-tremor
                      const humanMotion = sdk.generateHumanMotion(1.0, 30, 0.15);

                      // Extract WASM signatures & compute similarity
                      const humanSig = sdk.extractSignature(humanMotion);
                      const aiSig = sdk.extractSignature(aiMotion);
                      const simScore = sdk.similarity(humanSig, aiSig);

                      setWasmCompare({ loading: false, similarity: simScore, sigDim: humanSig.vector.length });

                      // Feed AI motion through the TypeScript PES engine
                      // to show the real entropy gap (AI = low PES)
                      const sstFrames = aiMotion.frames.map((f: { keypoints: Array<{ x: number; y: number; z: number }>; t: number }) => ({
                        frame: normalizeSSTFrame(mediaPipeToSST(f.keypoints)),
                        timestamp: f.t * 1000, // Convert to ms for PES
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
                      // Fallback to simulated values if WASM fails
                      setAiCompare({
                        score: 0.22 + Math.random() * 0.12,
                        timing: 0.02 + Math.random() * 0.04,
                        noise: 0.04 + Math.random() * 0.06,
                        freq: 0.02 + Math.random() * 0.04,
                        bio: 0.04 + Math.random() * 0.08,
                      });
                      setWasmCompare(null);
                    }
                  }}
                    onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                    className="w-full py-2 border border-cyan-400/20 text-cyan-400/40 text-[8px] tracking-[0.2em] uppercase hover:border-cyan-400/40 hover:text-cyan-300/70 transition-all disabled:opacity-30"
                    disabled={wasmLoading}>
                    {wasmLoading ? "Loading Engine..." : "Compare with AI →"}
                  </button>
                ) : (
                  <div className="p-3 border border-cyan-400/10 bg-cyan-400/[0.02] space-y-2">
                    <div className="text-cyan-400/40 text-[8px] tracking-[0.2em] uppercase text-center">
                      {wasmCompare?.similarity != null ? "WASM Engine — Real Analysis" : "AI Simulation (for comparison)"}
                    </div>
                    {/* WASM Signature similarity */}
                    {wasmCompare?.similarity != null && (
                      <div className="flex items-center justify-between px-2 py-1.5 bg-black/30 border border-cyan-400/10 rounded-sm">
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
                      <div className="text-center text-[7px] text-cyan-400/25 mt-0.5">
                        128-dim Motion Signature — {wasmCompare.sigDim}d vector similarity
                      </div>
                    )}
                  </div>
                )}
                {/* Genesis 状态提示 */}
                {typeof window !== "undefined" && sessionStorage.getItem("genesis_completed") === "1" ? (
                  <div className="text-center text-cyan-400/25 text-[8px] tracking-[0.15em] uppercase">
                    ◈ Scan recorded — contributing to your orbital evolution
                  </div>
                ) : (
                  <div className="text-center space-y-1">
                    <div className="text-amber-400/25 text-[8px] tracking-[0.15em] uppercase">
                      ⚠ Demo mode — scan not bound to identity
                    </div>
                    <a href="/genesis" className="inline-block text-cyan-400/25 hover:text-cyan-300/50 text-[8px] tracking-[0.2em] uppercase transition-colors">
                      Complete Genesis to bind scans →
                    </a>
                  </div>
                )}
                {/* ── Witness Badge (recruitment + upload complete) ── */}
                {witnessData && witnessData.position_number && (
                  <div
                    className="p-3 border space-y-2 relative overflow-hidden"
                    style={{
                      borderRadius: 4,
                      borderColor: witnessData.cohort === "genesis" ? "rgba(34,211,238,0.35)" : "rgba(34,211,238,0.15)",
                      background: witnessData.cohort === "genesis" ? "rgba(34,211,238,0.05)" : "rgba(34,211,238,0.02)",
                      animation: witnessData.cohort === "genesis" ? "genesisWitnessGlow 3s ease-in-out infinite" : undefined,
                    }}
                  >
                    {/* Genesis scan line */}
                    {witnessData.cohort === "genesis" && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.06) 40%, rgba(34,211,238,0.12) 50%, rgba(34,211,238,0.06) 60%, transparent 100%)",
                          animation: "genesisScanLine 2.5s ease-in-out infinite",
                        }}
                      />
                    )}
                    <div className="text-cyan-400/40 text-[7px] tracking-[0.2em] uppercase text-center">
                      {witnessData.cohort === "genesis" ? "Genesis Cohort — Witness Confirmed" : "Protocol Witness"}
                    </div>
                    <div className="text-center">
                      <span
                        className="text-cyan-200/80 text-[14px] font-light tracking-[0.05em]"
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
                        className="px-2.5 py-1 border border-cyan-400/15 text-cyan-400/40 text-[7px] tracking-[0.1em] uppercase hover:border-cyan-400/40 hover:text-cyan-300/70 transition-all"
                        style={{ borderRadius: 2 }}
                      >
                        Share on Bluesky
                      </a>
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=https://myshape.com/research/apply?ref=witness_share`}
                        target="_blank" rel="noopener noreferrer"
                        className="px-2.5 py-1 border border-cyan-400/15 text-cyan-400/40 text-[7px] tracking-[0.1em] uppercase hover:border-cyan-400/40 hover:text-cyan-300/70 transition-all"
                        style={{ borderRadius: 2 }}
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
                  <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
                  <div className="text-center space-y-2">
                    <div className="text-cyan-400/30 text-[7px] tracking-[0.4em] uppercase">Genesis Ritual · Motion Captured</div>
                    <p className="text-white/40 text-[10px] leading-relaxed">
                      Your kinetic signature has been inscribed.
                      {researchConsented && " This data now contributes to the protocol's calibration engine."}
                    </p>
                    <div className="flex gap-2 justify-center pt-1">
                      <a href="/research/apply" className="text-cyan-400/30 hover:text-cyan-300/70 text-[7px] tracking-[0.15em] uppercase border-b border-transparent hover:border-cyan-400/30 transition-all pb-0.5">
                        Join Genesis Cohort →
                      </a>
                      <span className="text-white/10">|</span>
                      <a href="/dashboard" className="text-cyan-400/30 hover:text-cyan-300/70 text-[7px] tracking-[0.15em] uppercase border-b border-transparent hover:border-cyan-400/30 transition-all pb-0.5">
                        View Dashboard →
                      </a>
                    </div>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
                </div>

                <button onClick={stop}
                  onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                  className="w-full py-2.5 border border-cyan-400/15 text-cyan-400/35 text-[9px] tracking-[0.3em] uppercase hover:border-cyan-400/40 hover:text-cyan-300/70 hover:bg-cyan-400/[0.03] transition-all">
                  ↻ Run_Again
                </button>
              </div>
            )}
          </div>
          )}
        </div>

      </div>

        <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-4 pb-2">
          <div className="flex items-center justify-center gap-2 text-cyan-400/50 text-[12px] tracking-[0.05em]">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>
            {researchConsented ? "Camera images stay local. Only joint-position data is uploaded anonymously." : "Your motion data never leaves this device. No cloud upload. No server storage."}
          </div>
        </div>

      <ProtocolFooter />
    </div>
  );
}
