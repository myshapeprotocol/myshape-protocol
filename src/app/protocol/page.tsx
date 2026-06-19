"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtocolLayout from "@/components/layout/ProtocolLayout";

export default function ProtocolPage() {
  const fullText = "THE ARCHITECTURE OF SOVEREIGN IDENTITY REQUIRES A NEW LOCAL ANCHOR.";
  const highlightStart = fullText.indexOf("SOVEREIGN IDENTITY");
  const highlightEnd = highlightStart + "SOVEREIGN IDENTITY".length;
  const [revealedCount, setRevealedCount] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(false);

  useEffect(() => {
    const total = fullText.length;
    let count = 0;
    const typeInterval = setInterval(() => {
      count++;
      setRevealedCount(count);
      setCursorVisible(true);
      if (count >= total) {
        clearInterval(typeInterval);
        let blinkStep = 0;
        const blinkTimer = setInterval(() => {
          blinkStep++;
          if (blinkStep >= 6) {
            clearInterval(blinkTimer);
            setCursorVisible(false);
          } else {
            setCursorVisible(blinkStep % 2 === 1);
          }
        }, 300);
      }
    }, 40);
    return () => clearInterval(typeInterval);
  }, []);
  const protocolMilestones = [
    { year: "LOCAL_GEN", event: "IDENTITY MUST ORIGINATE FROM THE INDIVIDUAL, NOT THE PLATFORM." },
    { year: "PROOF_SYS", event: "VERIFICATION OCCURS THROUGH PROOFS, NOT DATA DISCLOSURE." },
    { year: "NON_REPLIC", event: "A DATA-BODY THAT REMAINS SINGULAR, INSEPARABLE, AND UNCOPYABLE." }
  ];

  return (
    <ProtocolLayout
      refId="001" category="PROTOCOL_CORE" title="SYSTEM_INDEX"
      secLevel="CLASS_OMEGA" systemStatus="ACTIVE_SYNC"
      renderSigil={true}
    >
      <div className="space-y-32">
        {/* --- 1. 引言 --- */}
        <section className="max-w-4xl relative">
          <div className="absolute -left-10 top-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-transparent opacity-30" />
          <h2 className="text-2xl md:text-3xl font-extralight tracking-[0.4em] text-white leading-tight uppercase mb-8 min-h-[1.2em]">
            {fullText.split('').map((char, i) => {
              if (i >= revealedCount) return null;
              return (
                <span key={i} className={i >= highlightStart && i < highlightEnd ? 'text-cyan-400' : ''}>
                  {char}
                </span>
              );
            })}
            {cursorVisible && <span className="text-cyan-400 ml-0.5">|</span>}
          </h2>
          <p className="text-white/50 text-base tracking-[0.2em] leading-relaxed font-light">
            Identity in the AI era cannot be something that platforms store. 
            The Protocol ensures it originates as a local construct.
          </p>
        </section>

        {/* --- 2. 核心里程碑表格 --- */}
        <section className="space-y-12">
          <h3 className="text-white/20 text-[9px] tracking-[0.6em] uppercase text-center">// CORE_PRINCIPLES</h3>
          <div className="space-y-px bg-white/5 border border-white/5">
            {protocolMilestones.map((item) => (
              <div key={item.year} className="grid grid-cols-1 md:grid-cols-12 bg-[#02040a] p-8 group hover:bg-cyan-500/[0.03] transition-all">
                <div className="md:col-span-3 text-cyan-500 text-[10px] tracking-[0.4em] font-bold mb-4 md:mb-0">{item.year}</div>
                <div className="md:col-span-9 text-white/60 text-[11px] tracking-[0.2em] uppercase group-hover:text-white transition-colors">{item.event}</div>
              </div>
            ))}
          </div>
        </section>

        {/* --- 3. 核心跳轉按鈕 (這就是被我漏掉的關鍵！) --- */}
        <section className="flex justify-center py-20 border-t border-white/5">
          <Link href="/protocol/manifesto" className="group relative">
            {/* 背景發光霧化 */}
            <div className="absolute inset-0 bg-cyan-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            {/* 按鈕主體 */}
            <div className="relative px-12 py-6 border border-cyan-500/40 bg-black text-cyan-400 text-[11px] tracking-[0.6em] uppercase hover:text-white hover:border-white transition-all font-bold">
              Execute_Manifesto_Protocol →
            </div>
          </Link>
        </section>

        <div className="flex justify-center opacity-20">
          <div className="text-[8px] tracking-[1em] uppercase border-y border-white/20 py-4 px-12">Protocol_Origin_Verified</div>
        </div>
      </div>
    </ProtocolLayout>
  );
}