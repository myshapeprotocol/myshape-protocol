"use client";
import { useState, useEffect } from "react";

interface NetworkStats {
  total_nodes: number;
  genesis_nodes: number;
  active_humans: number;
  agents: number;
  total_scans: number;
  genesis_remaining: number;
}

/** Compact protocol telemetry — fixed bottom-left. Short words, color-coded values. */
export default function ProtocolStatusBar() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [live, setLive] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const start = performance.now();
      try {
        const res = await fetch("/api/nodes/status");
        const elapsed = Math.round(performance.now() - start);
        if (cancelled) return;
        setLatency(elapsed);
        if (!res.ok) throw new Error("down");
        const data = await res.json();
        setStats({
          total_nodes: data.total_nodes ?? 0,
          genesis_nodes: data.genesis_nodes ?? 0,
          active_humans: data.active_humans ?? 0,
          agents: data.agents ?? 0,
          total_scans: data.total_scans ?? 0,
          genesis_remaining: data.genesis_remaining ?? 100,
        });
        setLive(true);
      } catch {
        if (!cancelled) setLive(false);
      }
    }
    poll();
    const id = setInterval(poll, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const dim = "rgba(255,255,255,0.18)";
  const sep = <span style={{ color: dim, margin: "0 2px" }}>·</span>;

  return (
    <div
      className="fixed bottom-3 left-3 z-[998] font-mono text-[9px] tracking-[0.04em] select-none"
      style={{ lineHeight: 1 }}
    >
      <span
        style={{
          display: "inline-block",
          background: "rgba(2,4,10,0.82)",
          border: "1px solid rgba(144,200,255,0.08)",
          borderRadius: 4,
          padding: "3px 7px",
          backdropFilter: "blur(6px)",
          whiteSpace: "nowrap",
        }}
      >
        {/* Live dot */}
        <span
          style={{
            color: live ? "#3fb950" : "#f85149",
            marginRight: 3,
          }}
        >
          ◉
        </span>

        {!stats ? (
          <span style={{ color: live ? "rgba(144,200,255,0.4)" : "rgba(248,81,73,0.5)" }}>
            {live ? "syncing…" : "offline"}
          </span>
        ) : (
          <>
            <span style={{ color: dim }}>nodes </span>
            <span style={{ color: "rgba(144,200,255,0.65)" }}>{stats.total_nodes}</span>
            {sep}

            <span style={{ color: dim }}>humans </span>
            <span style={{ color: stats.active_humans > 0 ? "rgba(74,222,128,0.6)" : dim }}>{stats.active_humans}</span>
            {sep}

            <span style={{ color: dim }}>agents </span>
            <span style={{ color: stats.agents > 0 ? "rgba(167,139,250,0.6)" : dim }}>{stats.agents}</span>
            {sep}

            <span style={{ color: dim }}>scans </span>
            <span style={{ color: stats.total_scans > 0 ? "rgba(251,191,36,0.6)" : dim }}>{stats.total_scans}</span>
            {sep}

            <span style={{ color: dim }}>genesis </span>
            <span style={{ color: stats.genesis_remaining <= 10 ? "rgba(210,153,29,0.7)" : "rgba(144,200,255,0.55)" }}>
              {stats.genesis_nodes}/100
            </span>
            {stats.genesis_remaining <= 10 && stats.genesis_remaining > 0 && (
              <span style={{ color: "rgba(210,153,29,0.4)" }}> ‑{stats.genesis_remaining}</span>
            )}

            {latency !== null && (
              <>
                {sep}
                <span style={{
                  color: latency < 150 ? "rgba(74,222,128,0.5)" :
                         latency < 400 ? "rgba(251,191,36,0.5)" :
                         "rgba(248,81,73,0.5)",
                }}>
                  {latency}ms
                </span>
              </>
            )}
          </>
        )}
      </span>
    </div>
  );
}
