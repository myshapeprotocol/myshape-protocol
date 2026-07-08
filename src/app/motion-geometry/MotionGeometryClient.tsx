"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";
import "./motion-geometry.css";

function DemoHash() { const [hash, setHash] = useState("0x--------------"); useEffect(() => { setHash(`0x${Math.floor(Math.random() * 0xFFFFFFFFFFFF).toString(16).padStart(12, "0")}`); }, []); return <>{hash}</>; }

const SIM_STEPS = [
  { t: 0.0, timing: 0.42, noise: 0.88, freq: 0.15, bio: 0.71, score: 0.56 }, { t: 0.5, timing: 0.38, noise: 0.85, freq: 0.12, bio: 0.68, score: 0.62 },
  { t: 1.0, timing: 0.45, noise: 0.91, freq: 0.18, bio: 0.74, score: 0.71 }, { t: 1.5, timing: 0.41, noise: 0.87, freq: 0.14, bio: 0.72, score: 0.78 },
  { t: 2.0, timing: 0.44, noise: 0.89, freq: 0.16, bio: 0.73, score: 0.85 }, { t: 2.5, timing: 0.40, noise: 0.86, freq: 0.13, bio: 0.70, score: 0.89 },
  { t: 3.0, timing: 0.43, noise: 0.90, freq: 0.17, bio: 0.75, score: 0.94 }, { t: 3.5, timing: 0.39, noise: 0.84, freq: 0.11, bio: 0.69, score: 0.92 },
  { t: 4.0, timing: 0.42, noise: 0.88, freq: 0.15, bio: 0.71, score: 0.96 }, { t: 4.5, timing: 0.38, noise: 0.85, freq: 0.14, bio: 0.72, score: 0.98 },
];

function Gauge({ label, value, color = "#90c8ff" }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="mg-gauge-label">{label}</span>
      <div className="flex-1 h-1.5 bg-white/[0.04] overflow-hidden">
        <div className="h-full transition-all duration-700 ease-out" style={{ width: `${Math.min(value * 100, 100)}%`, background: `linear-gradient(90deg, ${color}99, ${color}cc)`, boxShadow: `0 0 6px ${color}44` }} />
      </div>
      <span className="mg-gauge-value">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

function WireframePreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let frame = 0;
    const joints = [[0.5,0.18],[0.5,0.22],[0.5,0.26],[0.38,0.22],[0.26,0.35],[0.2,0.48],[0.62,0.22],[0.74,0.35],[0.8,0.48],[0.42,0.48],[0.42,0.65],[0.38,0.82],[0.58,0.48],[0.58,0.65],[0.62,0.82]];
    const bones = [[0,1],[1,2],[2,3],[3,4],[3,5],[4,6],[5,7],[2,8],[8,9],[9,10],[2,11],[11,12],[12,13]];
    const draw = () => { frame++; const t = frame * 0.05; ctx.clearRect(0,0,c.width,c.height);
      bones.forEach(([a,b]) => { const jx=Math.sin(t*2+a*0.5)*3+Math.cos(t*1.3+b)*2; const jy=Math.cos(t*1.8+b*0.5)*2; const ax=joints[a][0]*c.width+jx*0.3; const ay=joints[a][1]*c.height+jy*0.3; const bx=joints[b][0]*c.width+jx*0.3; const by=joints[b][1]*c.height+jy*0.3; ctx.strokeStyle=`rgba(144,200,255,${0.15+Math.sin(t+a)*0.05})`; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke(); });
      joints.forEach((j,i)=>{const jx=Math.sin(t*2+i*0.5)*3;const jy=Math.cos(t*1.8+i)*2;const x=j[0]*c.width+jx*0.3;const y=j[1]*c.height+jy*0.3;const g=ctx.createRadialGradient(x,y,0,x,y,3);g.addColorStop(0,"rgba(144,200,255,0.6)");g.addColorStop(1,"rgba(144,200,255,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();});
      requestAnimationFrame(draw);
    }; draw();
  }, []);
  return <canvas ref={canvasRef} width={160} height={220} className="mx-auto" />;
}

export default function MotionGeometryClient() {
  const [step, setStep] = useState(0);
  const data = SIM_STEPS[step];
  useEffect(() => { const i = setInterval(() => setStep((s) => (s + 1) % SIM_STEPS.length), 2500); return () => clearInterval(i); }, []);

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16">
        <div className="text-center mb-16">
          <div className="text-[#90c8ff]/40 text-[10px] tracking-[0.5em] uppercase mb-6">MOTION_GEOMETRY // VISUAL_PIPELINE</div>
          <h1 className="text-2xl md:text-4xl font-light tracking-[0.08em] text-white mb-4" style={{ textShadow: "0 0 40px rgba(144,200,255,0.2)" }}>Entity → Geometry → Proof</h1>
          <p className="text-white/30 text-[12px] max-w-lg mx-auto leading-relaxed">Watch a simulated motion pipeline transform raw skeletal data into entropy scores and a cryptographic identity vector.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="mg-panel text-center" onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
            <div className="mg-panel-label">01 — Capture</div>
            <WireframePreview />
            <div className="text-white/20 text-[9px] mt-4 tracking-[0.2em] uppercase">33-pt → 18-pt SST</div>
            <div className="text-[#90c8ff]/30 font-mono text-[8px] mt-1">Frame {step + 1}/10</div>
          </div>
          <div className="mg-panel space-y-4 flex flex-col justify-center" onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
            <div className="mg-panel-label">02 — PES_4D</div>
            <Gauge label="μTiming" value={data.timing} color="#90c8ff" /><Gauge label="Noise" value={data.noise} color="#a78bfa" /><Gauge label="Freq" value={data.freq} color="#f472b6" /><Gauge label="Bio" value={data.bio} color="#a78bfa" />
            <div className="pt-3 border-t border-white/5 flex justify-between items-center"><span className="text-white/20 text-[8px] tracking-[0.2em] uppercase">PES Score</span><span className="text-[#90c8ff]/80 font-mono text-[18px] font-light">{(data.score * 100).toFixed(0)}</span></div>
          </div>
          <div className="mg-panel flex flex-col justify-center" onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
            <div className="mg-panel-label">03 — 128D Vector</div>
            <div className="space-y-1 font-mono text-[8px]">
              {["K:0.42 A:0.88 J:0.15 S:0.71","K:0.39 A:0.84 J:0.11 S:0.69","K:0.41 A:0.87 J:0.14 S:0.72","K:0.44 A:0.89 J:0.16 S:0.73"].map((line,i)=>(<div key={i} className="mg-vec-line">{line}</div>))}
            </div>
            <div className="mt-4 pt-3 border-t border-white/5"><div className="text-white/15 text-[8px] tracking-[0.2em] uppercase mb-1">Proof Hash</div><div className="text-[#90c8ff]/40 font-mono text-[9px] break-all"><DemoHash /></div></div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-white/20 text-[10px]">This is a simulation. Experience the real pipeline with your own motion.</p>
          <Link href="/motion-demo" className="mg-cta" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}>Try Live Demo →</Link>
        </div>
      </div>
      <ProtocolFooter />
    </div>
  );
}
