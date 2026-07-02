"use client";

import { useEffect, useState } from "react";

const GENESIS_TARGET = 100;

export default function GenesisCohortBadge() {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/nodes/count")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setCount(d.total ?? 0);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => { cancelled = true; };
  }, []);

  // Refresh every 30s
  useEffect(() => {
    const iv = setInterval(() => {
      fetch("/api/nodes/count")
        .then((r) => r.json())
        .then((d) => setCount(d.total ?? 0))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  if (error || count === null) {
    // Fallback: static text when API unreachable (local dev without Supabase)
    return (
      <div className="flex items-center gap-3 px-4 py-2 border border-[#90c8ff]/20 bg-[#90c8ff]/[0.04]">
        <div className="w-1.5 h-1.5 rounded-full bg-[#90c8ff] animate-pulse shadow-[0_0_6px_#90c8ff]" />
        <span className="text-[#90c8ff]/70 text-[10px] tracking-[0.15em] font-mono uppercase">
          Genesis Cohort — Live
        </span>
      </div>
    );
  }

  const pct = Math.min((count / GENESIS_TARGET) * 100, 100);

  return (
    <div className="flex items-center gap-3 px-4 py-2 border border-[#90c8ff]/20 bg-[#90c8ff]/[0.04]">
      <div className="w-1.5 h-1.5 rounded-full bg-[#90c8ff] animate-pulse shadow-[0_0_6px_#90c8ff]" />
      {/* Progress bar */}
      <div className="h-[3px] w-16 bg-white/[0.06] overflow-hidden rounded-full">
        <div
          className="h-full bg-[#90c8ff]/60 transition-all duration-1000 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Count */}
      <span className="text-[#90c8ff]/60 text-[11px] tracking-[0.12em] font-mono whitespace-nowrap">
        <span className="text-white/80">{count}</span>
        <span className="text-white/30"> / {GENESIS_TARGET}</span>
        <span className="text-white/20 ml-1">GENESIS</span>
      </span>
    </div>
  );
}
