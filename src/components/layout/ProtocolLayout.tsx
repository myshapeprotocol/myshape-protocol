"use client";
import React, { useState, useEffect } from 'react';
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import IdentitySigil from "@/components/identity/IdentitySigil";

interface ProtocolLayoutProps {
  children: React.ReactNode;
  refId: string;
  category: string;
  title: string;
  secLevel: string;
  systemStatus: string;
  renderSigil?: boolean;
  transparentBg?: boolean;
}

export default function ProtocolLayout({ 
  children, 
  refId, 
  category, 
  title, 
  secLevel, 
  systemStatus,
  renderSigil = false,
  transparentBg = false,
}: ProtocolLayoutProps) {
  const [flashSecLevel, setFlashSecLevel] = useState(false);
  const [flashSysStatus, setFlashSysStatus] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (setter: typeof setFlashSecLevel) => {
      const delay = 5000 + Math.random() * 3000;
      const timer = setTimeout(() => {
        setter(true);
        setTimeout(() => setter(false), 200);
        schedule(setter);
      }, delay);
      timers.push(timer);
    };
    schedule(setFlashSecLevel);
    schedule(setFlashSysStatus);
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={`min-h-screen text-white font-mono selection:bg-cyan-500/30 overflow-x-hidden flex flex-col ${transparentBg ? 'bg-transparent' : 'bg-[#02040a]'}`}>
      {/* 1. 統一背景與動畫裝飾 */}
      <div className="fixed inset-0 pointer-events-none opacity-10" 
           style={{ 
             backgroundImage: 'radial-gradient(circle, #22d3ee 1px, transparent 1px)', 
             backgroundSize: '60px 60px' 
           }} />
      
      <div className="fixed top-0 left-0 w-full h-[2px] bg-cyan-500/5 shadow-[0_0_15px_rgba(34,211,238,0.2)] animate-scan-slow pointer-events-none z-50" />

      <ProtocolHeader />

      {/* 2. 頁面內容主體 */}
      <main className="flex-1 pt-40 pb-10 px-10 max-w-5xl mx-auto relative z-10 animate-fade-in w-full protocol-main">
        <div className="relative mb-24 border-b border-white/10 pb-12">
          <div className="flex justify-between items-end">
            <div>
              {renderSigil ? (
                <IdentitySigil />
              ) : (
                <div className="text-cyan-500 text-[10px] tracking-[0.6em] mb-4 uppercase opacity-70 font-bold">
                  {category} // REF_{refId}
                </div>
              )}
              <h1 className="text-4xl font-extralight tracking-[0.4em] uppercase leading-tight">
                {title.replace(/_/g, ' ')}
              </h1>
            </div>
            <div className="hidden md:block text-[9px] tracking-[0.3em] text-right uppercase leading-loose font-mono">
              <span style={{ color: flashSecLevel ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)' }}>
                SECURITY_LVL: {secLevel}
              </span>
              <br/>
              <span style={{ color: flashSysStatus ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)' }}>
                SYS_STATUS: {systemStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="min-h-[30vh] protocol-main-inner">
          {children}
        </div>

        {/* 狀態裝飾條 */}
        <div className="mt-20 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 opacity-30 group transition-opacity hover:opacity-100">
          <div className="text-[9px] tracking-[0.5em] uppercase font-light">
            {category} // {systemStatus} // AUTH_VERIFIED
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-1">
               {[...Array(4)].map((_, i) => (
                 <div key={i} className="w-1 h-1 bg-cyan-500/50" />
               ))}
            </div>
            <div className="text-[8px] tracking-[0.2em] uppercase font-bold text-cyan-500/60">
              MYS_GENESIS_CORE_SYNCED
            </div>
          </div>
        </div>
      </main>

      {/* 3. 全局唯一 Footer */}
      <ProtocolFooter />

      <style>{`
        .protocol-main { background: transparent !important; }
        .protocol-main-inner { background: transparent !important; }

        @keyframes scan-slow {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        .animate-scan-slow {
          animation: scan-slow 12s linear infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}