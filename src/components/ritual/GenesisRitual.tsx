"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// 引入我們即將創建的實時捕捉組件
import LiveCapture from './LiveCapture';

export default function GenesisRitual({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState(0);
  
  const protocolStages = [
    { text: 'SIGNAL_DETECTED', sub: 'ESTABLISHING_ENCRYPTED_TUNNEL', code: '0xCC_1' },
    { text: 'EXTRACTING_KINEMATIC_SIGNATURE', sub: 'STABILITY_LOCKED // 87.4%', code: '0xCC_2' },
    { text: 'FORMING_GEOMETRY_PRIMITIVES', sub: 'SKELETON_MAPPING_ACTIVE', code: '0xCC_3' },
    { text: 'HALO_SCAN_IN_PROGRESS', sub: 'VERIFYING_IDENTITY_SOVEREIGNTY', code: '0xCC_4' },
    { text: 'PROTOCOL_BINDING_COMPLETE', sub: 'IDENTITY_ANCHORED_TO_NODE', code: '0xCC_READY' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStage((prev) => {
        if (prev < protocolStages.length - 1) return prev + 1;
        clearInterval(timer);
        setTimeout(onComplete, 1500); 
        return prev;
      });
    }, 2000); // 稍微延長一點時間讓捕捉更穩定

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-[#02040a] flex flex-col items-center justify-center font-mono overflow-hidden"
    >
      {/* 1. 背景加料：掃描線效果 */}
      <div className="absolute inset-0 pointer-events-none z-[1001] opacity-[0.05]"
           style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 255, 255, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 4px, 3px 100%' }} />

      {/* 2. 實時捕捉層 (在背景與 UI 之間) */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <LiveCapture activeStage={stage} />
      </div>

      {/* 3. 背景加料：動態數據流 */}
      <div className="absolute top-10 left-10 text-[8px] text-cyan-500/20 space-y-1 hidden md:block">
        {[...Array(10)].map((_, i) => (
          <div key={i}>FETCHING_DATA_STREAM_0x{Math.random().toString(16).slice(2, 8).toUpperCase()}... OK</div>
        ))}
      </div>

      <div className="relative w-96 h-96 flex items-center justify-center z-10">
        {/* 4. 核心加料：幾何圖騰動畫 */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={stage}
            initial={{ scale: 0.8, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 1.2, opacity: 0, rotate: 45 }}
            className="absolute flex items-center justify-center"
          >
            {stage === 2 ? (
              <div className="w-24 h-24 border-2 border-cyan-400 rotate-45 animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
            ) : stage === 4 ? (
              <div className="w-20 h-20 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-10 h-10 bg-cyan-400 animate-ping rounded-full" />
              </div>
            ) : (
              <div className="w-16 h-[2px] bg-cyan-500/50 animate-bounce" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* 外圍旋轉環 */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-[1px] border-dashed border-cyan-500/30 rounded-full"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 border-[1px] border-cyan-400/10 rounded-full"
        />
        
        {/* 文字與狀態 */}
        <div className="text-center space-y-6 relative z-10">
          <motion.div 
            key={stage}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            className="space-y-2"
          >
            <div className="text-cyan-400 text-[16px] font-bold tracking-[0.6em] uppercase">
              {protocolStages[stage].text}
            </div>
            <div className="text-white/30 text-[9px] tracking-[0.4em] uppercase">
              {protocolStages[stage].sub}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 底部進度條 */}
      <div className="absolute bottom-20 flex flex-col items-center gap-4 z-10">
        <div className="flex gap-2 text-[8px] text-cyan-500/40 tracking-[0.4em]">
           <span>PRTCL_ID: MS_V1.0</span>
           <span className="text-white/10">|</span>
           <span>MODE: ENCRYPTED_INIT</span>
        </div>
        <div className="w-72 h-[2px] bg-white/5 relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((stage + 1) / protocolStages.length) * 100}%` }}
            className="h-full bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,1)]"
          />
        </div>
        <div className="text-cyan-400/60 text-[10px] font-mono mt-2">
           {Math.round(((stage + 1) / protocolStages.length) * 100)}%
        </div>
      </div>
    </motion.div>
  );
}