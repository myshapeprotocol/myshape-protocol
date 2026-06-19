"use client";

import { useEffect } from "react";

/**
 * Root Error Boundary — 捕获页面级运行时错误
 * Next.js App Router 约定：error.tsx 必须是 Client Component
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ROOT_ERROR_BOUNDARY:", error);
  }, [error]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#02040a",
        gap: "32px",
        padding: "24px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "10px",
            letterSpacing: "0.5em",
            color: "rgba(255, 255, 255, 0.3)",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          SIGNAL_INTERRUPTED
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "8px",
            letterSpacing: "0.2em",
            color: "rgba(144, 200, 255, 0.3)",
            textTransform: "uppercase",
            maxWidth: "400px",
            lineHeight: "1.8",
          }}
        >
          The protocol layer encountered an unexpected state.
          <br />
          This node can be re-initialized.
        </div>
      </div>

      <button
        onClick={reset}
        style={{
          fontFamily: "monospace",
          fontSize: "9px",
          letterSpacing: "0.3em",
          background: "transparent",
          border: "1px solid rgba(144, 200, 255, 0.3)",
          color: "#90c8ff",
          padding: "12px 32px",
          cursor: "pointer",
          textTransform: "uppercase",
          transition: "all 0.4s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(144, 200, 255, 0.1)";
          e.currentTarget.style.borderColor = "#90c8ff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "rgba(144, 200, 255, 0.3)";
        }}
      >
        REINITIALIZE_NODE
      </button>
    </div>
  );
}
