"use client";

export default function GenesisCohortBadge() {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border border-[#90c8ff]/20 bg-[#90c8ff]/[0.04]">
      <div className="w-1.5 h-1.5 rounded-full bg-[#90c8ff] animate-pulse shadow-[0_0_6px_#90c8ff]" />
      <span className="text-[#90c8ff]/70 text-[10px] tracking-[0.15em] font-mono uppercase">
        Phase: Genesis Alpha
      </span>
      <span className="text-white/10">·</span>
      <span className="text-[#90c8ff]/40 text-[10px] tracking-[0.12em] font-mono uppercase">
        Access Restricted
      </span>
    </div>
  );
}
