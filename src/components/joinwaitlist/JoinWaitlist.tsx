"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface JoinWaitlistProps {
  onEmailChange?: (email: string) => void;
  onCommitSuccess?: (email: string) => void;
}

export default function JoinWaitlist({ onEmailChange, onCommitSuccess }: JoinWaitlistProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(""); 
  const [step, setStep] = useState(1); 
  const [status, setStatus] = useState("idle"); 
  const [isTyping, setIsTyping] = useState(false);
  const [isRitual, setIsRitual] = useState(false); 
  const [ritualText, setRitualText] = useState(""); 
  const [errorHint, setErrorHint] = useState("");
  const [nodeColor, setNodeColor] = useState('rgba(144, 200, 255, 0.4)');

  const themeColor = "144, 200, 255"; 

  const playSound = useCallback((freq: number, type: OscillatorType = 'sine', duration: number = 0.1, vol: number = 0.02) => {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }, []);

  const handleTyping = (val: string) => {
    setEmail(val);
    if (onEmailChange) onEmailChange(val);
    if(status === "error") setStatus("idle");
    playSound(1200 + Math.random() * 400, 'sine', 0.05, 0.01);
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRitual(true);
    setStatus("submitting");
    setRitualText("ENCRYPTING_IDENTITY_HASH...");
    playSound(60, 'sawtooth', 0.8, 0.1); 

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "UPLINK_REFUSED");

      await new Promise(r => setTimeout(r, 1200)); 
      setStep(2);
      setStatus("idle");
    } catch (err: any) {
      setErrorHint(err.message);
      setStatus("error");
    } finally {
      setIsRitual(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRitual(true);
    setStatus("submitting");
    setRitualText("DECRYPTING_SIGNATURE_HASH...");
    playSound(80, 'sawtooth', 0.8, 0.1);

    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "SIGNATURE_INVALID");

      setRitualText("OVERWRITING_GENESIS_SECTOR...");
      await new Promise(r => setTimeout(r, 1000));

      const hash = email.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
      setNodeColor(`hsla(${190 + (hash % 60)}, 100%, 75%, 0.8)`);
      setStatus("success");
      if (onCommitSuccess) onCommitSuccess(email);
    } catch (err: any) {
      setErrorHint(err.message);
      setStatus("error");
    } finally {
      setIsRitual(false);
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
      const count = window.innerWidth < 768 ? 60 : 180;
      particles = Array.from({ length: count }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * (window.innerWidth < 768 ? window.innerWidth * 0.35 : 320) + 20,
        speed: 0.005 + Math.random() * 0.005,
        size: Math.random() * 1.5,
        originalRadius: 0
      }));
      particles.forEach(p => p.originalRadius = p.radius);
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        let currentSpeed = p.speed;
        if (isRitual) {
          p.radius *= 0.96; 
          currentSpeed *= 18; 
        } else if (isTyping) {
          currentSpeed *= 3.5; 
        } else if (status === "success") {
          p.radius += (p.originalRadius * 1.5 - p.radius) * 0.05;
        } else if (p.radius < p.originalRadius) {
          p.radius += (p.originalRadius - p.radius) * 0.04;
        }

        p.angle += currentSpeed;
        const x = canvas.width / 2 + Math.cos(p.angle) * p.radius;
        const y = canvas.height / 2 + Math.sin(p.angle) * p.radius;
        
        ctx.fillStyle = status === "success" ? nodeColor : (isRitual ? '#fff' : (isTyping ? `rgba(${themeColor}, 0.8)` : `rgba(${themeColor}, 0.4)`));
        ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      animationFrameId = requestAnimationFrame(render);
    };

    init(); render();
    window.addEventListener('resize', init);
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', init); };
  }, [isTyping, status, nodeColor, isRitual]);

  return (
    <section className="waitlist-section" style={{ padding: '100px 24px', position: 'relative', overflow: 'hidden', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {isRitual && (
        <div className="ritual-overlay">
          <div className="scanner-line" />
          <div className="ritual-text">{ritualText}</div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />

      <div style={{ 
        maxWidth: '800px', width: '100%', position: 'relative', zIndex: 2, textAlign: 'center',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isRitual ? 0.3 : 1,
        transform: isRitual ? 'scale(0.8) blur(10px)' : 'scale(1)',
        filter: isRitual ? 'brightness(1.5)' : 'none'
      }}>
        <div className="waitlist-header" style={{ marginBottom: "50px" }}>
          <h2 style={{ fontWeight: 200, color: '#f8feff', letterSpacing: '-0.02em', marginBottom: '1.2rem', fontSize: '3.2rem' }}>
             {status === "success" ? "Uplink Confirmed." : step === 1 ? "Initialize Genesis." : "Verify Identity."}
          </h2>
          
          {/* 打字机效果容器 */}
          <div className="typing-container">
            <p className="typing-text">
              {status === "success" ? "IDENTITY_LAYER_INITIALIZED" : step === 1 ? "ESTABLISHING_IDENTITY_LAYER_PROTOCOL" : "CHALLENGE_MODE_ACTIVE"}
            </p>
          </div>
        </div>

        {status === "success" ? (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px' }}>
            <div className="status-box" style={{ padding: '30px', border: `1px solid ${nodeColor}`, background: 'rgba(255,255,255,0.01)', position: 'relative' }}>
               <div className="corner tl" style={{ borderColor: nodeColor }} /> <div className="corner tr" style={{ borderColor: nodeColor }} />
               <div className="corner bl" style={{ borderColor: nodeColor }} /> <div className="corner br" style={{ borderColor: nodeColor }} />
               <p style={{ color: '#fff', fontSize: '10px', letterSpacing: '0.2em', lineHeight: '2.4', margin: 0, fontWeight: 300, textAlign: 'left', fontFamily: 'monospace' }}>
                 NODE_ID: <span style={{ color: nodeColor }}>{btoa(email).substring(0, 12).toUpperCase()}</span> <br/>
                 STATUS: <span style={{ color: nodeColor }}>ACTIVE_ENQUEUED</span>
               </p>
            </div>
          </div>
        ) : (
          <form onSubmit={step === 1 ? handleRequestOTP : handleVerifyOTP} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '35px', width: '100%' }}>
            <div className={`input-portal ${isTyping ? 'active' : ''}`} style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
              <input
                type={step === 1 ? "email" : "text"}
                maxLength={step === 1 ? undefined : 6}
                autoComplete="off"
                required
                onFocus={() => { setIsTyping(true); playSound(1000, 'sine', 0.05); }}
                onBlur={() => setIsTyping(false)}
                onChange={(e) => step === 1 ? handleTyping(e.target.value) : setOtp(e.target.value)}
                value={step === 1 ? email : otp}
                placeholder={step === 1 ? "GENESIS_EMAIL@ADDRESS.IO" : "6_DIGIT_CHALLENGE"}
                style={{
                  padding: '24px 15px', width: '100%', fontSize: '13px', letterSpacing: step === 2 ? '0.8em' : '0.15em',
                  textAlign: 'center', outline: 'none', color: step === 2 ? '#90c8ff' : '#fff',
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${status === "error" ? '#ff4d4d' : `rgba(${themeColor}, 0.3)`}`,
                  transition: 'all 0.5s ease', backdropFilter: 'blur(5px)', borderRadius: '0'
                }}
              />
              <div className="corner tl" /> <div className="corner tr" />
              <div className="corner bl" /> <div className="corner br" />
              {status === "error" && <p style={{ position: 'absolute', bottom: '-28px', left: 0, width: '100%', color: '#ff4d4d', fontSize: '9px', letterSpacing: '0.2em' }}>{errorHint}</p>}
            </div>

            <button type="submit" disabled={status === "submitting"} className="genesis-btn">
              <div className="btn-glow-bar" />
              <span className="btn-text">{status === "submitting" ? "SYNCHRONIZING..." : step === 1 ? "COMMENCE_CONNECTION" : "CONFIRM_SIGNATURE"}</span>
              <span className="btn-hover-text">{step === 1 ? "ACTIVATE_IDENTITY" : "UNLOCK_NODE"}</span>
            </button>
          </form>
        )}
      </div>

      <style jsx>{`
        .typing-container {
          display: inline-block;
          position: relative;
        }

        .typing-text {
          color: rgba(144, 200, 255, 0.7);
          font-size: 10px;
          letter-spacing: 0.6em;
          font-weight: 300;
          text-transform: uppercase;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          border-right: 2px solid #90c8ff;
          width: 0;
          animation: 
            typing 3.5s steps(40) infinite,
            blink-cursor 0.75s step-end infinite;
        }

        @keyframes typing {
          0% { width: 0; }
          70% { width: 100%; }
          90% { width: 100%; }
          100% { width: 0; }
        }

        @keyframes blink-cursor {
          from, to { border-color: transparent }
          50% { border-color: #90c8ff; }
        }

        .ritual-overlay { position: absolute; inset: 0; z-index: 100; background: rgba(0, 0, 0, 0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .scanner-line { position: absolute; width: 100%; height: 2px; background: #90c8ff; box-shadow: 0 0 20px #90c8ff; animation: scan 1.5s linear infinite; }
        .ritual-text { color: #fff; font-family: monospace; font-size: 11px; letter-spacing: 0.8em; }
        @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }

        .genesis-btn {
          padding: 22px 80px; letter-spacing: 0.4em; font-size: 10px; cursor: pointer; border: 1px solid #80bfff; background: transparent; color: #80bfff; transition: all 0.6s; position: relative; overflow: hidden;
        }
        .btn-glow-bar { position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(144, 200, 255, 0.3), transparent); animation: flow 3s infinite; }
        @keyframes flow { 0% { left: -100%; } 100% { left: 100%; } }
        .genesis-btn:hover { background: rgba(144, 200, 255, 0.1); color: #fff; box-shadow: 0 0 30px rgba(144, 200, 255, 0.2); }
        .btn-hover-text { position: absolute; left: 50%; top: 180%; transform: translate(-50%, -50%); width: 100%; transition: all 0.5s; font-weight: bold; }
        .genesis-btn:hover .btn-text { transform: translateY(-350%); opacity: 0; }
        .genesis-btn:hover .btn-hover-text { top: 50%; }
        
        .corner { position: absolute; width: 12px; height: 12px; border-color: rgba(144, 200, 255, 0.4); border-style: solid; }
        .tl { top: -8px; left: -8px; border-width: 1px 0 0 1px; }
        .tr { top: -8px; right: -8px; border-width: 1px 1px 0 0; }
        .bl { bottom: -8px; left: -8px; border-width: 0 0 1px 1px; }
        .br { bottom: -8px; right: -8px; border-width: 0 1px 1px 0; }
        .fade-in { animation: fadeIn 0.8s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </section>
  );
}