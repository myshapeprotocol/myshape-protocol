"use client";
import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#02040a] gap-8 px-6 font-mono select-none">
      {/* 大号水印 */}
      <div className="absolute text-[clamp(48px,12vw,140px)] font-extralight text-cyan-400/[0.04] tracking-[0.3em] pointer-events-none">
        404
      </div>

      {/* 错误信息 */}
      <div className="text-center relative z-10 space-y-4">
        <div className="text-cyan-400/40 text-[9px] tracking-[0.5em] uppercase">
          // PROTOCOL_PROBE_LOST
        </div>
        <div className="text-cyan-400/50 text-[10px] tracking-[0.4em] uppercase font-mono">
          ERROR_CODE: NODE_NOT_FOUND
        </div>
        <div className="h-[1px] w-12 mx-auto bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
        <p className="text-white/15 text-[9px] tracking-[0.15em] uppercase max-w-xs leading-relaxed">
          This identity vector does not exist in the protocol mesh.
          The sector you requested has been archived, relocated, or never initialized.
        </p>
      </div>

      {/* 返回按钮 */}
      <Link
        href="/"
        className="relative z-10 px-10 py-3 border border-cyan-400/25 text-cyan-300/60 text-[10px] tracking-[0.4em] uppercase hover:bg-cyan-400/[0.04] hover:text-white hover:border-cyan-400/50 transition-all duration-500"
        style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
        onMouseEnter={() => {
          if (typeof window !== "undefined") {
            const { playTick } = require("@/utils/useAudioTick");
            playTick(800, "sine", 0.10, 0.025);
          }
        }}
      >
        RETURN_TO_ORIGIN
      </Link>
    </div>
  );
}
