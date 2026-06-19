"use client";

import React, { useState } from "react";

export default function IdentityLink() {
  const [connected, setConnected] = useState(false);
  const [address] = useState("myshae.base.eth");

  return (
    <div className="flex flex-col items-end gap-2 pointer-events-auto">
      <button 
        onClick={() => setConnected(!connected)}
        className="group relative bg-transparent border border-blue-500/10 px-4 py-1.5 overflow-hidden transition-all hover:border-blue-500/40"
      >
        {/* 红蓝重影层 (Ghosting) */}
        <span className="absolute inset-0 flex items-center justify-center text-red-500/30 opacity-0 group-hover:opacity-100 group-hover:animate-[glitch_0.3s_infinite] translate-x-[2px] pointer-events-none font-mono text-[10px]">
          {connected ? address.toUpperCase() : "INITIATE_SYNC"}
        </span>
        <span className="absolute inset-0 flex items-center justify-center text-blue-400/30 opacity-0 group-hover:opacity-100 group-hover:animate-[glitch_0.3s_infinite_reverse] -translate-x-[2px] pointer-events-none font-mono text-[10px]">
          {connected ? address.toUpperCase() : "INITIATE_SYNC"}
        </span>

        {/* 主文字层 */}
        <span className="relative z-10 font-mono text-[10px] tracking-[0.2em] text-blue-200/50 group-hover:text-white transition-colors">
          {connected ? (
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 bg-blue-400 animate-pulse rounded-full" />
              {address.toUpperCase()}
            </span>
          ) : (
            "INITIATE_SYNC"
          )}
        </span>

        {/* 底部扫描线 */}
        <div className="absolute bottom-0 left-0 h-[1px] bg-blue-500/50 w-0 group-hover:w-full transition-all duration-500" />
      </button>

      {/* 状态提示：针对那个缺少的 "P" */}
      {connected && (
        <div className="font-mono text-[7px] text-red-500/40 tracking-widest animate-pulse">
          SIGNAL_DEGRADATION: RECOVERY_IN_PROGRESS [ERR: MISSING_P]
        </div>
      )}

      <style>{`
        @keyframes glitch {
          0% { transform: translate(2px, -1px); filter: hue-rotate(90deg); }
          50% { transform: translate(-2px, 1px); filter: hue-rotate(180deg); }
          100% { transform: translate(1px, -2px); filter: hue-rotate(0deg); }
        }
      `}</style>
    </div>
  );
}