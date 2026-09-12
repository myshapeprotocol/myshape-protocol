"use client";

import { useState } from "react";
import {
  getDiagnosticSessions,
  copyDiagnosticSessions,
  downloadDiagnosticSessions,
} from "@/lib/try-instrumentation";

export default function DiagnosticExportPage() {
  const [sessions, setSessions] = useState<unknown[] | null>(() => getDiagnosticSessions());
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const handleCopy = async () => {
    const result = await copyDiagnosticSessions();
    setCopyState(result);
    setTimeout(() => setCopyState("idle"), 2500);
  };

  const handleDownload = () => downloadDiagnosticSessions();

  const sessionCount = sessions?.length ?? 0;
  const latest = sessionCount > 0 ? (sessions as Array<{ timestamp: string }>)[sessionCount - 1] : null;

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 540,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        RESEARCH DIAGNOSTICS
      </h1>
      <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 24 }}>
        Local-only diagnostic data export
      </p>

      <section
        style={{
          marginBottom: 20,
          padding: 16,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 8,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
          {sessionCount} diagnostic session{sessionCount !== 1 ? "s" : ""} found
        </div>
        {latest && (
          <div style={{ fontSize: 12, opacity: 0.5 }}>
            Latest session: {new Date(latest.timestamp).toLocaleString()}
          </div>
        )}
        {sessionCount === 0 && (
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
            No diagnostic sessions found in this browser. Run a verification on
            this phone first, then return to this page.
          </div>
        )}
      </section>

      {sessionCount > 0 && (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <button onClick={handleCopy} style={primaryBtn}>
              {copyState === "copied"
                ? "COPIED ✓"
                : copyState === "failed"
                  ? "Copy failed — use DOWNLOAD instead"
                  : "COPY JSON"}
            </button>
            <button onClick={handleDownload} style={secondaryBtn}>
              DOWNLOAD JSON
            </button>
          </div>

          <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 8 }}>
            1. Tap <b>COPY JSON</b> → 2. Open this chat → 3. Paste the JSON here
          </div>

          <section style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              DATA PREVIEW
            </h3>
            <pre
              style={{
                maxHeight: 360,
                overflow: "auto",
                fontSize: 11,
                background: "rgba(0,0,0,0.3)",
                padding: 12,
                borderRadius: 6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {JSON.stringify(sessions, null, 2)}
            </pre>
          </section>
        </>
      )}
    </main>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: "16px 24px",
  fontSize: 16,
  fontWeight: 700,
  background: "#fff",
  color: "#000",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  padding: "14px 24px",
  fontSize: 14,
  fontWeight: 600,
  background: "transparent",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: 8,
  cursor: "pointer",
};