"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface JoinWaitlistProps {
  onEmailChange?: (email: string) => void;
}

export default function JoinWaitlist({ onEmailChange }: JoinWaitlistProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); 
  const [isRitual, setIsRitual] = useState(false); 
  const [ritualStep, setRitualStep] = useState(""); 
  const [isTyping, setIsTyping] = useState(false);
  const [errorHint, setErrorHint] = useState("");
  const [nodeColor, setNodeColor] = useState('rgba(144, 200, 255, 0.4)');

  const themeColor = "144, 200, 255"; 

  // 震撼音效：低频震荡 + 高频脉冲
  const playRitualSound = useCallback((stage: 'start' | 'process' | 'end') => {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
      
      if (stage === 'start') {
        const osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.5);
        masterGain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        osc.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5);
      } else if (stage === 'process') {
        const osc = audioCtx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        masterGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
        osc.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
      } else {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2);
        masterGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        osc.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {}
  }, []);

  const handleTyping = (val: string) => {
    setEmail(val);
    if (onEmailChange) onEmailChange(val);
    if(status === "error") setStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorHint("INVALID_PROTOCOL_FORMAT");
      setStatus("error");
      return;
    }

    setIsRitual(true);
    setStatus("submitting");
    playRitualSound('start');
    
    setRitualStep("ENCRYPTING_BIOMETRIC_DATA...");
    await new Promise(r => setTimeout(r, 800));
    playRitualSound('process');
    
    setRitualStep("REWRITING_CORE_LEDGER...");
    await new Promise(r => setTimeout(r, 1000));
    playRitualSound('process');

    try {
      const response = await fetch("https://formsubmit.co/ajax/e24852dbfcaeee1d6895450fa46367e7", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email, _subject: "New Node Connection", message: `Identity: ${email}` })
      });

      if (response.ok) {
        setRitualStep("HANDSHAKE_SUCCESS.");
        playRitualSound('end');
        await new Promise(r => setTimeout(r, 800));
        const hash = email.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        setNodeColor(`hsla(${190 + (hash % 60)}, 100%, 75%, 0.8)`);
        setStatus("success");
        setIsRitual(false);
      } else { throw new Error(); }
    } catch (err) {
      setIsRitual(false);
      setStatus("error");
      setErrorHint("UPLINK_INTERRUPTED");
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;
    let particles: any[] = [];
    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = 800;
      particles = Array.from({ length: 150 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * 300 + 50,
        speed: 0.005 + Math.random() * 0.005,
        size: Math.random() * 1.5
      }));
    };
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        let currentSpeed = p.speed;
        if (isRitual) {
           // 坍缩效果：粒子向中心汇聚
           p.radius *= 0.95;
           currentSpeed *= 15;
        } else if (status === "success") {
           p.radius += (300 - p.radius) * 0.05;
        }
        p.angle += currentSpeed;
        const x = canvas.width / 2 + Math.cos(p.angle) * p.radius;
        const y = canvas.height / 2 + Math.sin(p.angle) * p.radius;
        ctx.fillStyle = isRitual ? `rgba(255,255,255,0.9)` : (status === "success" ? nodeColor : `rgba(${themeColor}, 0.3)`);
        ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      animationFrameId = requestAnimationFrame(render);
    };
    init(); render();
    window.addEventListener('resize', init);
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', init); };
  }, [isRitual, status, nodeColor]);

  return (
    <section className="waitlist-section" style={{ padding: '100px 24px', position: 'relative', overflow: 'hidden', minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* 升级版：震撼全屏仪式感 */}
      {isRitual && (
        <div className="ritual-overlay">
          <div className="noise-bg" />
          <div className="glitch-matrix">
             {Array.from({length: 10}).map((_, i) => (
               <div key={i} className="hex-row">{Math.random().toString(16).toUpperCase()}</div>
             ))}
          </div>
          <div className="scanner-line-active" />
          <div className="ritual-text-main">{ritualStep}</div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />

      <div style={{ maxWidth: '800px', width: '100%', position: 'relative', zIndex: 2, textAlign: 'center', opacity: isRitual ? 0 : 1 }}>
        <div className="waitlist-header" style={{ marginBottom: "60px" }}>
          <h2 className="genesis-title" style={{ fontWeight: 200, color: '#f8feff', letterSpacing: '-0.02em', marginBottom: '1.5rem', fontSize: '3.5rem' }}>
             {status === "success" ? "Uplink Confirmed." : "Initialize Genesis."}
          </h2>
          {/* 修复：将 display 改为 inline-flex 解决竖线滚太远的问题 */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <p className="typing-text" style={{ color: `rgba(${themeColor}, 0.8)`, fontSize: '11px', letterSpacing: '0.6em', fontWeight: 300, textTransform: 'uppercase', margin: 0 }}>
               {status === "success" ? "IDENTITY_LAYER_INITIALIZED" : "ESTABLISHING_IDENTITY_LAYER_PROTOCOL"}
            </p>
            <span className="cursor-blink" style={{ width: '2px', height: '14px', background: '#90c8ff', display: 'inline-block', boxShadow: '0 0 8px #90c8ff' }} />
          </div>
        </div>

        {status === "success" ? (
          <div className="success-manifest" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="status-box" style={{ padding: '40px 60px', border: `1px solid ${nodeColor}`, background: 'rgba(255,255,255,0.01)', position: 'relative' }}>
               <div className="corner tl" style={{ borderColor: nodeColor }} /> <div className="corner tr" style={{ borderColor: nodeColor }} />
               <div className="corner bl" style={{ borderColor: nodeColor }} /> <div className="corner br" style={{ borderColor: nodeColor }} />
               <p className="font-mono" style={{ color: '#fff', fontSize: '11px', letterSpacing: '0.3em', lineHeight: '2.5', margin: 0, textAlign: 'left' }}>
                 NODE_ID: <span style={{ color: nodeColor }}>{btoa(email).substring(0, 12).toUpperCase()}</span> <br/>
                 STATUS: <span style={{ color: nodeColor }}>ACTIVE_ENQUEUED</span> <br/>
                 ENCRYPTION: AES_256_SHAPE
               </p>
            </div>
          </div>
        ) : (
          <form className="waitlist-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
            <div className="input-portal" style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
              <input
                type="email" required
                onChange={(e) => handleTyping(e.target.value)}
                value={email}
                placeholder="GENESIS_EMAIL@ADDRESS.IO"
                style={{
                  padding: '26px 20px', width: '100%', fontSize: '14px', letterSpacing: '0.2em',
                  textAlign: 'center', outline: 'none', color: '#fff',
                  background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(${themeColor}, 0.2)`,
                  backdropFilter: 'blur(10px)', transition: 'all 0.4s'
                }}
              />
              <div className="corner tl" /> <div className="corner tr" />
              <div className="corner bl" /> <div className="corner br" />
            </div>

            <button type="submit" className="genesis-btn">
              <span className="btn-text">COMMENCE_CONNECTION</span>
              <span className="btn-hover-text">ACTIVATE_PROTOCOL</span>
            </button>
          </form>
        )}
      </div>

      <style jsx>{`
        .ritual-overlay {
          position: absolute; inset: 0; z-index: 999;
          background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .noise-bg {
          position: absolute; inset: 0; opacity: 0.05;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E");
        }
        .glitch-matrix {
          position: absolute; width: 100%; opacity: 0.15; font-family: monospace;
          color: #90c8ff; font-size: 80px; font-weight: bold; overflow: hidden; pointer-events: none;
        }
        .hex-row { white-space: nowrap; animation: matrixMove 10s linear infinite; }
        @keyframes matrixMove { from { transform: translateX(-10%); } to { transform: translateX(10%); } }

        .scanner-line-active {
          position: absolute; width: 100%; height: 2px;
          background: #fff; box-shadow: 0 0 30px #90c8ff, 0 0 60px #90c8ff;
          animation: scan 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .ritual-text-main {
          font-family: monospace; color: #fff; font-size: 14px; letter-spacing: 0.8em;
          text-transform: uppercase; z-index: 10; text-shadow: 0 0 15px #90c8ff;
        }

        @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
        .cursor-blink { animation: blink 1s steps(2) infinite; }
        @keyframes blink { 0% { opacity: 0; } 100% { opacity: 1; } }

        .genesis-btn {
          padding: 24px 90px; letter-spacing: 0.5em; font-size: 11px;
          cursor: pointer; border: 1px solid #90c8ff; background: transparent;
          color: #90c8ff; transition: all 0.5s; position: relative; overflow: hidden;
        }
        .genesis-btn:hover { background: #fff; color: #000; border-color: #fff; box-shadow: 0 0 30px rgba(255,255,255,0.4); }
        .btn-hover-text { position: absolute; left: 50%; top: 150%; transform: translate(-50%, -50%); width: 100%; transition: all 0.4s; font-weight: bold; }
        .genesis-btn:hover .btn-text { transform: translateY(-300%); opacity: 0; }
        .genesis-btn:hover .btn-hover-text { top: 50%; }

        .corner { position: absolute; width: 14px; height: 14px; border-color: rgba(144, 200, 255, 0.5); border-style: solid; }
        .tl { top: -10px; left: -10px; border-width: 1.5px 0 0 1.5px; }
        .tr { top: -10px; right: -10px; border-width: 1.5px 1.5px 0 0; }
        .bl { bottom: -10px; left: -10px; border-width: 0 0 1.5px 1.5px; }
        .br { bottom: -10px; right: -10px; border-width: 0 1.5px 1.5px 0; }
      `}</style>
    </section>
  );
}