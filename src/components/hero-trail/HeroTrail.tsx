"use client";
import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import "@/components/hero-demo/hero-demo.css";
import { playTick } from "@/utils/useAudioTick";

const SCENES = ["formation","motion","verification","mesh"] as const;
const DUR = 8000;
const LABELS: Record<string, string> = {
  formation: "PRESENCE",
  motion: "THE GAP",
  verification: "VERIFICATION",
  mesh: "CONTINUITY",
};
const SUBTITLES: Record<string, string> = {
  formation: "AI can generate a face in seconds. A voice in milliseconds. But maintaining a convincing continuous presence over time is a different problem entirely.",
  motion: "We don't ask what the data says about identity. We ask whether the pattern of motion looks biologically plausible — and whether it can be maintained consistently over time.",
  verification: "Three independent engines. Challenge-response. Cross-modal binding. We're not identifying anyone. We're verifying one thing: the same entity has been continuously present.",
  mesh: "Every verification produces evidence — not a yes or a no, but a receipt. Linked together, they form a chain of proof. Not who you are. That you stayed.",
};

/* Short mobile versions — max 2-3 lines */
const SUBTITLES_MOBILE: Record<string, string> = {
  formation: "AI generates faces, voices — in seconds. But biological entropy sustained over time? That's the real test.",
  motion: "We don't ask what the data says. We ask whether the motion pattern stays biologically plausible — over time.",
  verification: "Three engines. Challenge-response. Cross-modal binding. Verifying one thing — the same entity stayed.",
  mesh: "Every check produces evidence. A receipt, not a yes or no. A chain of proof. Not who you are — that you stayed.",
};

export default function HeroTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [subtitle, setSubtitle] = useState("");
  const [subVisible, setSubVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  /* detect mobile — sync on mount + resize */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* particle canvas */
  useEffect(() => {
    const c = canvasRef.current; if(!c)return;
    const ctx = c.getContext("2d"); if(!ctx)return;
    let raf=0, start=performance.now(), cur=0;
    const TMAX=40, N=150;
    const p: number[][] = [];
    for(let i=0;i<N;i++)p.push([Math.random()*Math.PI*2,50+Math.random()*200,(Math.random()-.5)*200,.003+Math.random()*.012,60+Math.random()*180,(Math.random()-.5)*180,Math.random()*Math.PI*2,i%4]);
    const trails:{x:number;y:number;age:number}[][]=p.map(()=>[]);
    function cl(v:number){return Math.max(15,Math.min(285,v))}
    function csc(z:number){return Math.max(.3,290/(290+z))}

    const draw=(n:number)=>{
      const el=n-start; if(el>DUR){start=n;cur=(cur+1)%4;setSceneIdx(cur)}
      const t=n*.001, fr=Math.floor(n/55);
      const W=c.width=window.innerWidth, H=c.height=window.innerHeight;
      ctx.clearRect(0,0,W,H);
      ctx.save();ctx.translate(W/2,H*.48);

      for(let i=0;i<trails.length;i++){
        const tb=trails[i];
        for(let j=0;j<tb.length;j++){
          const d=tb[j],a=(1-d.age/TMAX)*.35;if(a<=0)continue;
          ctx.fillStyle=`rgba(0,229,255,${a})`;
          ctx.beginPath();ctx.arc(d.x,d.y,.55,0,Math.PI*2);ctx.fill();
          if(j>0){ctx.strokeStyle=`rgba(0,229,255,${a*.4})`;ctx.lineWidth=.25;ctx.beginPath();ctx.moveTo(tb[j-1].x,tb[j-1].y);ctx.lineTo(d.x,d.y);ctx.stroke();}
        }
      }
      for(let i=0;i<p.length;i++){
        const pi=p[i];pi[0]+=pi[3];
        if(cur===0){const tr=130+Math.sin(i*.12)*100;pi[1]=cl(pi[1]+(Math.abs(tr)-pi[1])*.04);pi[2]+=(Math.sin(i*.05)*50-pi[2])*.04}
        else if(cur===1){const br=1+Math.sin(t*.7+pi[6])*.25;pi[1]=cl(pi[4]*br);pi[2]=pi[5]+Math.sin(t*.6+pi[6])*25}
        else if(cur===2){pi[1]=cl(pi[1]+(pi[4]-pi[1])*.05);pi[2]+=(pi[5]-pi[2])*.05}
        else{const cx=pi[7]<2?-110:110;pi[1]=cl(pi[1]+(90+Math.sin(i*.4)*50-pi[1])*.03);pi[2]+=(cx-pi[2])*.03}
        const rr=cl(pi[1]||pi[4]),sx=Math.cos(pi[0])*rr,sz=Math.sin(pi[0])*rr,sc=csc(sz);
        const px=sx*sc,py=(pi[2]||pi[5])*sc;
        const tb=trails[i];
        for(let j=tb.length-1;j>=0;j--){tb[j].age++;if(tb[j].age>TMAX)tb.splice(j,1)}
        if(fr%3===i%3)tb.unshift({x:px,y:py,age:0});
        ctx.fillStyle=`rgba(0,229,255,${Math.min(.7,.35+sc*.5)})`;
        ctx.beginPath();ctx.arc(px,py,Math.max(.3,1.3*sc),0,Math.PI*2);ctx.fill();
      }
      const pulse=1+Math.sin(t*1.5)*.3;
      const g=ctx.createRadialGradient(0,0,0,0,0,22*pulse);
      g.addColorStop(0,"rgba(0,229,255,.1)");g.addColorStop(1,"rgba(0,229,255,0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,22*pulse,0,Math.PI*2);ctx.fill();
      ctx.restore();raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);
  },[]);

  /* subtitle — typing on both, shorter text on mobile */
  useEffect(() => {
    const full = isMobile
      ? (SUBTITLES_MOBILE[SCENES[sceneIdx]] || "")
      : (SUBTITLES[SCENES[sceneIdx]] || "");
    setSubtitle("");
    setSubVisible(true);
    let i = 0;
    const speed = isMobile ? 18 : 22;
    const t = setInterval(() => { i++; setSubtitle(full.slice(0, i)); if (i >= full.length) clearInterval(t); }, speed);
    return () => clearInterval(t);
  }, [sceneIdx, isMobile]);

  const label = LABELS[SCENES[sceneIdx]];

  return (
    <section className="hero-demo-root">
      <canvas ref={canvasRef} width={1920} height={1080} className="hero-demo-canvas" />
      <div className="hero-demo-content">
        <div className="hero-demo-title-zone" style={{ position: "relative", zIndex: 5 }}>
          <h1 className="hero-demo-title">THE CONTINUITY LAYER</h1>
          <p className="hero-demo-tagline" style={{ color: "rgba(255,255,255,0.45)" }}>
            Identity tells you who someone claims to be.<br />Continuity asks whether the same entity is still here.
          </p>
        </div>

{/* Scene subtitle */}
        <div className={`hero-demo-subtitle${subVisible ? " on" : ""}`}>
          <span className="hero-demo-subtitle-dot" />
          <span className="hero-demo-subtitle-label">{label}</span>
          <span className="hero-demo-subtitle-sep">|</span>
          <span className="hero-demo-subtitle-text">{subtitle}</span>
        </div>

        {/* Scene dots */}
        <div className="hero-demo-dots">
          {SCENES.map((_, i) => (
            <button key={i} className={`hero-demo-dot${i === sceneIdx ? " on" : ""}`}
              onMouseEnter={() => playTick(500 + i * 100, "sine", 0.06, 0.02)} />
          ))}
        </div>

        {/* Mobile CTA — data collection */}
        <div className="hero-demo-ctas">
          <Link href="/lab/contribute" className="hero-demo-cta primary"
            onMouseEnter={() => playTick(700, "sine", 0.1, 0.03)}>
            <span className="hero-demo-cta-label">Contribute Data</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
