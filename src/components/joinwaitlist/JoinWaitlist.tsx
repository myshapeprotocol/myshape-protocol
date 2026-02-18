"use client";
import React, { useEffect, useRef, useState } from 'react';

export default function JoinWaitlist() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [isTyping, setIsTyping] = useState(false);
  const [errorHint, setErrorHint] = useState("");
  const [nodeColor, setNodeColor] = useState('rgba(144, 200, 255, 0.4)');

  const themeColor = "144, 200, 255"; 

  const playProtocolSound = (isSuccess: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(isSuccess ? 880 : 440, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(isSuccess ? 1200 : 200, audioCtx.currentTime + 0.3);

      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorHint("INVALID_PROTOCOL_FORMAT");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorHint("");
    playProtocolSound(false); 

    try {
      const response = await fetch("https://formsubmit.co/ajax/e24852dbfcaeee1d6895450fa46367e7", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email, _subject: "New Node Connection", message: `Identity: ${email}` })
      });

      if (response.ok) {
        // ⭐ 增强点：计算唯一色相并应用
        const hash = email.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        const uniqueHue = 190 + (hash % 60); // 190-250 之间，保持蓝色到紫色的高级感
        setNodeColor(`hsla(${uniqueHue}, 100%, 75%, 0.8)`);
        
        setStatus("success");
        playProtocolSound(true); 
      } else {
        throw new Error();
      }
    } catch (err) {
      setErrorHint("UPLINK_INTERRUPTED_RETRY");
      setStatus("error");
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
        size: Math.random() * 1.5
      }));
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        // ⭐ 增强点：成功后和提交时加速旋转
        let currentSpeed = p.speed;
        if (status === "submitting") currentSpeed *= 6;
        if (status === "success") currentSpeed *= 1.5;
        if (isTyping) currentSpeed *= 2.5;

        p.angle += currentSpeed;
        
        const x = canvas.width / 2 + Math.cos(p.angle) * p.radius;
        const y = canvas.height / 2 + Math.sin(p.angle) * p.radius;
        
        ctx.fillStyle = status === "success" ? nodeColor : (isTyping ? `rgba(${themeColor}, 0.8)` : `rgba(${themeColor}, 0.4)`);
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(render);
    };

    init(); render();
    window.addEventListener('resize', init);
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', init); };
  }, [isTyping, status, nodeColor]);

  return (
    <section className="waitlist-section" style={{ padding: '100px 24px', position: 'relative', overflow: 'hidden', minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />

      <div style={{ maxWidth: '800px', width: '100%', position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div className="waitlist-header" style={{ marginBottom: "50px" }}>
          <h2 className="genesis-title" style={{ fontWeight: 200, color: '#f8feff', letterSpacing: '-0.02em', marginBottom: '1.2rem', fontSize: '3.2rem' }}>
             {status === "success" ? "Uplink Confirmed." : "Initialize Genesis."}
          </h2>
          <div style={{ overflow: 'hidden', display: 'inline-block' }}>
             <p className="typing-text" style={{ color: `rgba(${themeColor}, 0.7)`, fontSize: '10px', letterSpacing: '0.6em', fontWeight: 300, textTransform: 'uppercase' }}>
               {status === "success" ? "IDENTITY_LAYER_INITIALIZED" : "ESTABLISHING_IDENTITY_LAYER_PROTOCOL"}
             </p>
          </div>
        </div>

        {status === "success" ? (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px' }}>
            <div className="status-box" style={{ padding: '30px', border: `1px solid ${status === 'success' ? nodeColor : `rgba(${themeColor}, 0.2)`}`, background: 'rgba(255,255,255,0.01)', position: 'relative' }}>
               <div className="corner tl" style={{ borderColor: nodeColor }} /> <div className="corner tr" style={{ borderColor: nodeColor }} />
               <div className="corner bl" style={{ borderColor: nodeColor }} /> <div className="corner br" style={{ borderColor: nodeColor }} />
               <p style={{ color: '#fff', fontSize: '10px', letterSpacing: '0.2em', lineHeight: '2.4', margin: 0, fontWeight: 300, textAlign: 'left', fontFamily: 'monospace' }}>
                 NODE_ID: <span style={{ color: nodeColor }}>{btoa(email).substring(0, 12).toUpperCase()}</span> <br/>
                 STATUS: <span style={{ color: nodeColor }}>ACTIVE_ENQUEUED</span> <br/>
                 ENCRYPTION: <span style={{ color: nodeColor }}>SHA-256_PROTOCOL</span>
               </p>
            </div>
            <a href="#" className="secret-link" style={{ fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>DOWNLOAD_PROTOCOL_BRIEF_V1.PDF</a>
            <div className="pulse-dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: nodeColor, boxShadow: `0 0 20px ${nodeColor}` }} />
          </div>
        ) : (
          <form className="waitlist-form" onSubmit={handleSubmit} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '35px', width: '100%' }}>
            <div className={`input-portal ${isTyping ? 'active' : ''}`} style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
              <input
                type="email" required
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                onChange={(e) => { setEmail(e.target.value); if(status === "error") setStatus("idle"); }}
                value={email}
                placeholder="GENESIS_EMAIL@ADDRESS.IO"
                style={{
                  padding: '24px 15px', width: '100%', fontSize: '13px', letterSpacing: '0.15em',
                  textAlign: 'center', outline: 'none', color: '#fff',
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${status === "error" ? '#ff4d4d' : `rgba(${themeColor}, 0.3)`}`,
                  transition: 'all 0.5s ease', backdropFilter: 'blur(5px)', borderRadius: '0'
                }}
              />
              <div className="corner tl" /> <div className="corner tr" />
              <div className="corner bl" /> <div className="corner br" />
              {status === "error" && <p style={{ position: 'absolute', bottom: '-28px', left: 0, width: '100%', color: '#ff4d4d', fontSize: '9px' }}>{errorHint}</p>}
            </div>

            <button type="submit" disabled={status === "submitting"} className="genesis-btn">
              <div className="btn-glow-bar" />
              <span className="btn-text">{status === "submitting" ? "SYNCHRONIZING..." : "COMMENCE_CONNECTION"}</span>
              <span className="btn-hover-text">ACTIVATE_IDENTITY</span>
            </button>
          </form>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .genesis-title { font-size: 2.2rem !important; }
          .genesis-btn { padding: 16px 30px !important; width: 100%; max-width: 400px; font-size: 9px !important; }
        }
        .genesis-btn {
          padding: 22px 80px; letter-spacing: 0.4em; font-size: 10px;
          cursor: pointer; border: 1px solid #80bfff; background: transparent;
          color: #80bfff; transition: all 0.6s; position: relative; overflow: hidden;
        }
        .genesis-btn:hover { background: #90c8ff; color: #02040a !important; box-shadow: 0 0 30px rgba(144, 200, 255, 0.3); }
        .btn-hover-text { position: absolute; left: 50%; top: 180%; transform: translate(-50%, -50%); width: 100%; transition: all 0.5s; font-weight: bold; }
        .genesis-btn:hover .btn-text { transform: translateY(-350%); opacity: 0; }
        .genesis-btn:hover .btn-hover-text { top: 50%; }
        
        .corner { position: absolute; width: 12px; height: 12px; border-color: rgba(144, 200, 255, 0.4); border-style: solid; transition: 0.4s; }
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