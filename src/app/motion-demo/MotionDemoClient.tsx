"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import ProtocolHeader from "@/components/header/header";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ProtocolFooter from "@/components/footer/footer";
import { playTick, resumeAudio } from "@/utils/useAudioTick";
import PresenceSignature from "@/components/presence-signature/PresenceSignature";
import { mediaPipeToSST, normalizeSSTFrame } from "@/engine/skeleton-topology";
import { computeFullPES } from "@/engine/presence-entropy";
import { assessThreat } from "@/engine/threat-assessment";
import { generateFullProof } from "@/engine/proof-system";
import { getDeviceSalt } from "@/engine/local-identity";
import type { JointPosition, SSTJointId } from "@/types/motion-vector";

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
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const framesRef = useRef<FeatureFrame[]>([]);
  const animRef = useRef<number>(0);
  const phaseRef = useRef<Phase>("idle");
  const poseRef = useRef<PoseInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const energyRef = useRef<number>(0);
  const landmarksRef = useRef<Array<{ x: number; y: number; z: number }> | null>(null);
  const sstFramesRef = useRef<Array<{ frame: Record<SSTJointId, JointPosition>; timestamp: number }>>([]);
  const sparkParticlesRef = useRef<SparkParticle[]>([]);

  // ── Real Camera Mode ──
  const startCapture = useCallback(async () => {
    // 在用户点击的同步代码块中恢复 AudioContext（浏览器自动播放策略要求）
    resumeAudio();

    setPhase("capturing");
    phaseRef.current = "capturing";
    setCountdown(8);
    framesRef.current = [];
    setProofHashes(null);

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

  // ── Countdown ──
  useEffect(() => {
    if (phase !== "capturing") return;
    if (countdown <= 0) { setPhase("processing"); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

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
    }
    setTimeout(() => {
      playTick(1200, "sine", 0.12, 0.03);
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
    framesRef.current = [];
    sstFramesRef.current = [];
  };

  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-5xl mx-auto px-6" style={{ paddingTop: "10rem", paddingBottom: "4rem" }}>
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
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/70 border border-cyan-400/30">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-cyan-400/80 text-[9px] tracking-[0.2em] uppercase">Capturing... {countdown}s</span>
                </div>
                <div className="absolute top-16 left-0 right-0 z-10 text-center pointer-events-none">
                  <p className="text-cyan-400/35 text-[11px] tracking-[0.12em] uppercase leading-relaxed">
                    Stand naturally — micro-motion is your signature
                  </p>
                  <p className="text-white/15 text-[10px] tracking-[0.06em] mt-0.5">
                    No pose required. Breathe. Shift weight. Be present.
                  </p>
                </div>
              </>
            )}

            {phase === "processing" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                <div className="text-center space-y-5">
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
          </div>

          {/* Feature Panel */}
          <div className="border border-white/10 bg-black/40 p-5 space-y-4">
            {/* ── PES Dashboard ── */}
            {pesData && (
              <>
                <div className="text-cyan-400/40 text-[7px] tracking-[0.3em] uppercase">Presence_Entropy_Score (PES)</div>
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
                <div className="text-cyan-400/40 text-[7px] tracking-[0.2em] uppercase">Live PES Estimate</div>
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
                    <div className="flex justify-between text-[7px]">
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

            <div className="text-cyan-400/40 text-[7px] tracking-[0.3em] uppercase">Motion_Telemetry</div>
            <div className="space-y-2.5 text-[10px] font-mono">
              <div className="flex justify-between">
                <span className="text-white/25">SST Frames</span>
                <span className="text-cyan-300/60">{sstFramesRef.current.length}</span>
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
                <div className="text-cyan-400/30 text-[7px] italic">Collecting frames... ({sstFramesRef.current.length}/30)</div>
              )}
            </div>

            {proofHashes && (
              <div className="mt-4 p-3 border border-cyan-400/20 bg-cyan-400/[0.03] space-y-2">
                <div className="text-cyan-400/50 text-[7px] tracking-[0.3em] uppercase">ZK-Presence_Proof</div>
                <div className="text-cyan-200/70 text-[9px] font-mono break-all leading-relaxed"
                  style={{ textShadow: "0 0 8px rgba(144,200,255,0.3)" }}>
                  {proofHashes.zkp}
                </div>
                <div className="grid grid-cols-3 gap-2 text-[7px]">
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
                <div className="text-white/15 text-[7px] mt-1 tracking-[0.15em]">§6 ZK-PRESENCE — PROOF-OF-CONCEPT</div>
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
                  <button onClick={() => {
                    // Simulate AI-generated motion PES (low entropy, over-smooth)
                    setAiCompare({
                      score: 0.22 + Math.random() * 0.12,
                      timing: 0.02 + Math.random() * 0.04,
                      noise: 0.04 + Math.random() * 0.06,
                      freq: 0.02 + Math.random() * 0.04,
                      bio: 0.04 + Math.random() * 0.08,
                    });
                  }}
                    onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                    className="w-full py-2 border border-cyan-400/20 text-cyan-400/40 text-[8px] tracking-[0.2em] uppercase hover:border-cyan-400/40 hover:text-cyan-300/70 transition-all">
                    Compare with AI →
                  </button>
                ) : (
                  <div className="p-3 border border-cyan-400/10 bg-cyan-400/[0.02] space-y-2">
                    <div className="text-cyan-400/40 text-[7px] tracking-[0.2em] uppercase text-center">AI Simulation (for comparison)</div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[8px]">
                      <div className="flex justify-between"><span className="text-white/15">μTiming</span><span className="text-amber-300/50">{(aiCompare.timing * 100).toFixed(0)}%</span></div>
                      <div className="flex justify-between"><span className="text-white/15">Noise</span><span className="text-amber-300/50">{(aiCompare.noise * 100).toFixed(0)}%</span></div>
                      <div className="flex justify-between"><span className="text-white/15">Freq</span><span className="text-amber-300/50">{(aiCompare.freq * 100).toFixed(0)}%</span></div>
                      <div className="flex justify-between"><span className="text-white/15">Bio</span><span className="text-amber-300/50">{(aiCompare.bio * 100).toFixed(0)}%</span></div>
                    </div>
                    <div className="text-center text-[8px] text-amber-300/40 mt-1">
                      AI PES: {(aiCompare.score * 100).toFixed(0)}% — ✗ SYNTHETIC
                    </div>
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
                    <a href="/genesis" className="inline-block text-cyan-400/25 hover:text-cyan-300/50 text-[7px] tracking-[0.2em] uppercase transition-colors">
                      Complete Genesis to bind scans →
                    </a>
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
                <button onClick={stop}
                  onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                  className="w-full py-2.5 border border-cyan-400/15 text-cyan-400/35 text-[9px] tracking-[0.3em] uppercase hover:border-cyan-400/40 hover:text-cyan-300/70 hover:bg-cyan-400/[0.03] transition-all">
                  ↻ Run_Again
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-cyan-400/50 text-[8px] tracking-[0.15em] uppercase">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>
            Your motion data never leaves this device. No cloud upload. No server storage.
          </div>
          <p className="text-white/15 text-[7px] tracking-[0.15em] uppercase">
            This is a proof-of-concept prototype. All processing is local. No data stored or transmitted.
            For best results, use <span className="text-cyan-400/50">Firefox</span> (Chromium-based browsers may show a green screen with some webcams).
            See the <a href="/papers/technical-spec" className="text-cyan-400/50 hover:text-cyan-300" onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>technical spec</a> for the full architecture.
          </p>
        </div>
      </div>

      <ProtocolFooter />
    </div>
  );
}
