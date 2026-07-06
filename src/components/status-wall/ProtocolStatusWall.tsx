"use client";
import { useState, useEffect, useCallback } from "react";
import { playTick } from "@/utils/useAudioTick";
import "./status-wall.css";

interface HealthData {
  status: string;
  services?: {
    supabase?: { ok: boolean };
    wasm?: { ok: boolean };
    calibration?: { ok: boolean; version?: string };
  };
}

interface NetworkData {
  totalNodes: number;
  activeHumans: number;
  genesisNodes: number;
  agents: number;
  activeToday: number;
  totalScans: number;
  engines: number;
  attackSigs: number;
  coreTests: string;
  lastInbound?: {
    handle: string;
    mask: string;
    timestamp: string;
  } | null;
}

interface StatusData {
  total_nodes: number;
  genesis_nodes: number;
  genesis_remaining: number;
  active_nodes: number;
  last_scan_date?: string;
}

function Row({
  label,
  value,
  sub,
  accent = "cyan",
  pulse = false,
  flash = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "cyan" | "green" | "amber" | "red" | "muted";
  pulse?: boolean;
  flash?: boolean;
}) {
  const dotColors: Record<string, string> = {
    cyan: "rgba(34,211,238,0.9)",
    green: "rgba(52,211,153,0.9)",
    amber: "rgba(251,191,36,0.9)",
    red: "rgba(239,68,68,0.9)",
    muted: "rgba(144,200,255,0.3)",
  };
  const dotShadow: Record<string, string> = {
    cyan: "0 0 6px rgba(34,211,238,0.6)",
    green: "0 0 6px rgba(52,211,153,0.6)",
    amber: "0 0 6px rgba(251,191,36,0.6)",
    red: "0 0 6px rgba(239,68,68,0.6)",
    muted: "none",
  };

  return (
    <div
      className={`tsw-row ${flash ? "tsw-row-flash" : ""}`}
      onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}
    >
      <span className="tsw-row-prefix">{">"}</span>
      <span
        className={`tsw-row-dot ${pulse ? "tsw-row-dot-pulse" : ""}`}
        style={{
          backgroundColor: dotColors[accent],
          boxShadow: dotShadow[accent],
        }}
      />
      <span className="tsw-row-label">{label}</span>
      <span className="tsw-row-value">{value}</span>
      {sub && <span className="tsw-row-sub">{sub}</span>}
    </div>
  );
}

export default function ProtocolStatusWall() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [network, setNetwork] = useState<NetworkData | null>(null);
  const [nodeStatus, setNodeStatus] = useState<StatusData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState(false);
  const [flashRows, setFlashRows] = useState<Set<string>>(new Set());

  const fetchAll = useCallback(async () => {
    try {
      const [healthRes, networkRes, statusRes] = await Promise.all([
        fetch("/api/health").then((r) => r.json()).catch(() => null),
        fetch("/api/presence/network").then((r) => r.json()).catch(() => null),
        fetch("/api/nodes/status").then((r) => r.json()).catch(() => null),
      ]);

      if (!healthRes && !networkRes && !statusRes) {
        setError(true);
        return;
      }

      // Track which rows changed for flash animation
      const changed = new Set<string>();

      if (healthRes) {
        const prevWasm = health?.services?.wasm?.ok;
        const prevSupabase = health?.services?.supabase?.ok;
        const prevCal = health?.services?.calibration?.ok;
        if (prevWasm !== undefined && prevWasm !== healthRes.services?.wasm?.ok) changed.add("ENGINE");
        if (prevSupabase !== undefined && prevSupabase !== healthRes.services?.supabase?.ok) changed.add("DATABASE");
        if (prevCal !== undefined && prevCal !== healthRes.services?.calibration?.ok) changed.add("CALIBRATION");
        setHealth(healthRes);
      }

      if (networkRes) {
        const prevNodes = network?.totalNodes;
        const prevGenesis = network?.genesisNodes;
        const prevActive = network?.activeToday;
        if (prevNodes !== undefined && prevNodes !== networkRes.totalNodes) changed.add("NODES");
        if (prevGenesis !== undefined && prevGenesis !== networkRes.genesisNodes) changed.add("GENESIS");
        if (prevActive !== undefined && prevActive !== networkRes.activeToday) changed.add("ACTIVE");
        setNetwork(networkRes);
      }

      if (statusRes) {
        setNodeStatus(statusRes);
      }

      if (changed.size > 0) {
        setFlashRows(changed);
        setTimeout(() => setFlashRows(new Set()), 600);
      }

      setError(false);
      setLastUpdated(new Date());
    } catch {
      setError(true);
    }
  }, [health, network]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const wasmOk = health?.services?.wasm?.ok ?? false;
  const supabaseOk = health?.services?.supabase?.ok ?? false;
  const calOk = health?.services?.calibration?.ok ?? false;
  const allOk = wasmOk && supabaseOk;

  const total = network?.totalNodes ?? (nodeStatus?.total_nodes ?? 0);
  const genesis = network?.genesisNodes ?? (nodeStatus?.genesis_nodes ?? 0);
  const genesisRemaining = nodeStatus?.genesis_remaining ?? Math.max(0, 100 - genesis);
  const activeToday = network?.activeToday ?? 0;
  const engines = network?.engines ?? 3;
  const attackSigs = network?.attackSigs ?? 8;
  const coreTests = network?.coreTests ?? "172/172";
  const lastInbound = network?.lastInbound;

  const visibleRows = expanded ? 12 : 8;

  return (
    <div className="tsw-root">
      {/* Header */}
      <div className="tsw-header">
        <div className="tsw-header-left">
          <span
            className="tsw-header-dot"
            style={{
              backgroundColor: error ? "rgba(239,68,68,0.9)" : allOk ? "rgba(52,211,153,0.9)" : "rgba(251,191,36,0.9)",
              boxShadow: error ? "0 0 8px rgba(239,68,68,0.6)" : allOk ? "0 0 8px rgba(52,211,153,0.6)" : "0 0 8px rgba(251,191,36,0.6)",
            }}
          />
          <span className="tsw-header-label">PROTOCOL_STATUS_WALL // V0.1</span>
        </div>
        <div className="tsw-header-right">
          <span className={`tsw-indicator ${allOk ? "tsw-indicator-green" : "tsw-indicator-amber"}`}>
            {allOk ? "ENGINE_OK" : "ENGINE_DEGRADED"}
          </span>
          <span className="tsw-indicator-sep">|</span>
          <span className={`tsw-indicator ${error ? "tsw-indicator-red" : "tsw-indicator-green"}`}>
            {error ? "NET_UNREACHABLE" : "NET_OK"}
          </span>
          <span className="tsw-indicator-sep">|</span>
          <span className="tsw-indicator tsw-indicator-cyan">
            {genesisRemaining > 0 ? `COHORT:${genesis}/100` : "COHORT:SEALED"}
          </span>
        </div>
      </div>

      {/* Scan line */}
      <div className="tsw-scan-line" />

      {/* Rows */}
      <div className="tsw-body">
        {error && !network && !health ? (
          <div className="tsw-error-state">
            <span className="tsw-error-icon">⚠</span>
            <span className="tsw-error-text">NETWORK_UNREACHABLE — RETRYING_IN_30S</span>
          </div>
        ) : !network ? (
          <div className="tsw-loading-state">
            <span className="tsw-loading-dot" />
            <span className="tsw-loading-text">PROTOCOL_ENCLAVE_HANDSHAKE...</span>
          </div>
        ) : (
          <>
            <Row
              label="PES_ENGINE"
              value={wasmOk ? "ONLINE" : "OFFLINE"}
              sub={calOk ? `cal_v${health?.services?.calibration?.version ?? "?"}` : "UNCALIBRATED"}
              accent={wasmOk ? "green" : "red"}
              pulse={wasmOk}
              flash={flashRows.has("ENGINE")}
            />
            <Row
              label="DATABASE"
              value={supabaseOk ? "CONNECTED" : "DISCONNECTED"}
              accent={supabaseOk ? "green" : "red"}
              pulse={supabaseOk}
              flash={flashRows.has("DATABASE")}
            />
            <Row
              label="NETWORK_NODES"
              value={String(total)}
              sub={`${network?.activeHumans ?? 0} HUMANS · ${network?.agents ?? 0} AGENTS`}
              accent={total > 0 ? "green" : "amber"}
              flash={flashRows.has("NODES")}
            />
            <Row
              label="GENESIS_COHORT"
              value={`${genesis}/100`}
              sub={genesisRemaining > 0 ? `${genesisRemaining} SLOTS_REMAIN` : "SEALED"}
              accent={genesisRemaining > 0 ? "amber" : "cyan"}
              pulse={genesisRemaining > 0}
              flash={flashRows.has("GENESIS")}
            />
            <Row
              label="ACTIVE_TODAY"
              value={String(activeToday)}
              accent={activeToday > 0 ? "green" : "muted"}
              flash={flashRows.has("ACTIVE")}
            />
            <Row
              label="PROTOCOL_ENGINES"
              value={String(engines)}
              sub="PES · SST · ZK"
              accent="cyan"
            />
            <Row
              label="ATTACK_SIGNATURES"
              value={String(attackSigs)}
              sub="THREAT_MATRIX_INDEXED"
              accent="amber"
            />
            <Row
              label="CORE_TEST_SUITE"
              value={coreTests}
              accent="green"
            />

            {expanded && (
              <>
                <Row
                  label="CALIBRATION"
                  value={calOk ? "CALIBRATED" : "VACUUM_DEFAULTS"}
                  sub={health?.services?.calibration?.version ?? undefined}
                  accent={calOk ? "green" : "amber"}
                  flash={flashRows.has("CALIBRATION")}
                />
                <Row
                  label="TOTAL_SCANS"
                  value={String(network?.totalScans ?? 0)}
                  accent="cyan"
                />
                {lastInbound && (
                  <Row
                    label="LAST_INBOUND"
                    value={lastInbound.handle}
                    sub={lastInbound.mask}
                    accent="cyan"
                  />
                )}
                <Row
                  label="UPDATED"
                  value={lastUpdated ? lastUpdated.toLocaleTimeString() : "--"}
                  accent="muted"
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="tsw-footer">
        <button
          onClick={() => { setExpanded(!expanded); playTick(600, "sine", 0.06, 0.015); }}
          className="tsw-expand-btn"
        >
          {expanded ? "▲ COLLAPSE" : "▼ EXPAND"}
        </button>
        <span className="tsw-footer-text">
          {lastUpdated ? `LAST_SYNC: ${lastUpdated.toLocaleTimeString()}` : "POLLING..."}
        </span>
        <button
          onClick={() => { fetchAll(); playTick(700, "sine", 0.08, 0.02); }}
          className="tsw-refresh-btn"
        >
          ↻ REFRESH
        </button>
      </div>
    </div>
  );
}
