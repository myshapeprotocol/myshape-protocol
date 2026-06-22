"use client";
import React from 'react';
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import IdentitySigil from "@/components/identity/IdentitySigil";
import "./ProtocolLayout.css";

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
                <div className="text-cyan-500/50 text-[10px] tracking-[0.5em] mb-4 uppercase">
                  {category} // REF_{refId}
                </div>
              )}
              <h1 className="text-3xl md:text-4xl font-light tracking-[0.15em] text-white uppercase">
                {title.replace(/_/g, ' ')}
              </h1>
            </div>
            <div className="hidden md:block text-[9px] tracking-[0.3em] text-right uppercase leading-loose font-mono">
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>
                SECURITY_LVL: {secLevel}
              </span>
              <br/>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>
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

    </div>
  );
}