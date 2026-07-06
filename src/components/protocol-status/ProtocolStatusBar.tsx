"use client";
import { useState, useEffect } from "react";
import { useGenesisSlots } from "@/hooks/useGenesisSlots";

interface NetworkStats {
  total: number;
  humans: number;
  genesis_nodes: number;
  slots_remaining: number;
}

/** Minimalist live protocol status indicator with latency ping. Mobile: collapses to ◈ icon. */
export default function ProtocolStatusBar() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [live, setLive] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { isFull } = useGenesisSlots();

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const start = performance.now();
      try {
        const res = await fetch("/api/nodes/count");
        const elapsed = Math.round(performance.now() - start);
        if (cancelled) return;

        setLatency(elapsed);
        if (!res.ok) throw new Error("down");

        const data = await res.json();
        setStats({
          total: data.total ?? 0,
          humans: data.humans ?? 0,
          genesis_nodes: data.genesis_nodes ?? 0,
          slots_remaining: Math.max(0, 100 - (data.genesis_nodes ?? 0)),
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

  return (
    <div
      className="fixed bottom-4 left-4 z-[998] font-mono text-[10px] tracking-[0.1em] select-none"
      style={{
        background: "rgba(2,4,10,0.85)",
        border: "1px solid rgba(144,200,255,0.12)",
        borderRadius: 6,
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Mobile: collapsed ◈ icon */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="md:hidden flex items-center justify-center pointer-events-auto"
        style={{ padding: "6px 10px", width: "100%", border: "none", background: "none", cursor: "pointer" }}
        aria-label="Toggle protocol status"
      >
        <span
          style={{
            color: live ? "rgba(63,185,80,0.9)" : "rgba(248,81,73,0.9)",
            fontSize: 14,
            textShadow: live ? "0 0 8px rgba(63,185,80,0.5)" : "0 0 8px rgba(248,81,73,0.5)",
          }}
        >
          ◈
        </span>
        {!expanded && stats && (
          <span style={{ color: "rgba(144,200,255,0.6)", marginLeft: 6, fontSize: 9 }}>
            {stats.total}
          </span>
        )}
      </button>

      {/* Expanded content */}
      <div
        className={`${expanded ? "block" : "hidden"} md:block`}
        style={{ padding: "6px 12px" }}
      >
        <div className="flex items-center gap-3 text-white/60" style={{ whiteSpace: "nowrap" }}>
          {/* Live dot */}
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                background: live ? "#3fb950" : "#f85149",
                boxShadow: live
                  ? "0 0 6px rgba(63,185,80,0.5)"
                  : "0 0 6px rgba(248,81,73,0.5)",
              }}
            />
            <span
              style={{ color: live ? "rgba(63,185,80,0.7)" : "rgba(248,81,73,0.7)" }}
            >
              {live ? "LIVE" : "OFFLINE"}
            </span>
          </span>

          {stats && (
            <>
              <span style={{ color: "rgba(144,200,255,0.2)" }}>|</span>

              <span>
                Nodes:{" "}
                <span style={{ color: "rgba(144,200,255,0.8)" }}>{stats.total}</span>
              </span>

              <span style={{ color: "rgba(144,200,255,0.2)" }}>|</span>

              <span>
                Genesis:{" "}
                <span
                  style={{
                    color: isFull
                      ? "rgba(210,153,29,0.8)"
                      : stats.slots_remaining <= 10
                        ? "rgba(210,153,29,0.8)"
                        : "rgba(144,200,255,0.8)",
                  }}
                >
                  {stats.genesis_nodes}/100
                </span>
                {isFull ? (
                  <span style={{ color: "rgba(210,153,29,0.5)", marginLeft: 4 }}>SEALED</span>
                ) : stats.slots_remaining > 0 && stats.slots_remaining <= 10 && (
                  <span style={{ color: "rgba(210,153,29,0.6)", marginLeft: 4 }}>
                    ({stats.slots_remaining})
                  </span>
                )}
              </span>

              {latency !== null && (
                <>
                  <span style={{ color: "rgba(144,200,255,0.2)" }}>|</span>
                  <span>
                    Latency:{" "}
                    <span
                      style={{
                        color:
                          latency < 150
                            ? "rgba(63,185,80,0.7)"
                            : latency < 400
                              ? "rgba(210,153,29,0.7)"
                              : "rgba(248,81,73,0.7)",
                      }}
                    >
                      {latency}ms
                    </span>
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
