/** @experimental ZK subsystem — under active research. Not production-grade. */
"use client";
import "./ProcessingOverlay.css";

/** Processing overlay shown while generating ZK-Proof after capture completes. */
export default function ProcessingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
      <div className="text-center space-y-3.5">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border border-[#90c8ff]/20 animate-ping motion-demo__ping-fast" />
          <div className="absolute inset-2 rounded-full border border-[#90c8ff]/30 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#90c8ff] shadow-[0_0_12px_rgba(144,200,255,0.6)] animate-pulse" />
          </div>
        </div>
        <span className="text-[#90c8ff]/70 text-[11px] tracking-[0.3em] uppercase block animate-pulse">
          Generating ZK-Proof...
        </span>
        <div className="flex gap-1.5 justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full bg-[#90c8ff]/50 animate-pulse motion-demo__status-dot-${i}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
