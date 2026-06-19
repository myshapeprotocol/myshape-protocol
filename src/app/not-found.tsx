import Link from "next/link";

/**
 * Root Not Found UI — 自定义 404 页面
 * Next.js App Router 约定：not-found.tsx 在 app/ 根目录即全局生效
 */
export default function RootNotFound() {
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
      {/* 大号水印 */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "clamp(48px, 12vw, 120px)",
          fontWeight: 200,
          color: "rgba(144, 200, 255, 0.06)",
          letterSpacing: "0.2em",
          userSelect: "none",
          pointerEvents: "none",
          position: "absolute",
        }}
      >
        404
      </div>

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "10px",
            letterSpacing: "0.4em",
            color: "rgba(144, 200, 255, 0.5)",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          NODE_NOT_FOUND
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "8px",
            letterSpacing: "0.2em",
            color: "rgba(255, 255, 255, 0.2)",
            textTransform: "uppercase",
          }}
        >
          This sector does not exist in the protocol mesh.
        </div>
      </div>

      <Link
        href="/"
        style={{
          fontFamily: "monospace",
          fontSize: "9px",
          letterSpacing: "0.3em",
          background: "transparent",
          border: "1px solid rgba(144, 200, 255, 0.25)",
          color: "#90c8ff",
          padding: "12px 32px",
          cursor: "pointer",
          textTransform: "uppercase",
          textDecoration: "none",
          transition: "all 0.4s",
          position: "relative",
          zIndex: 1,
        }}
      >
        RETURN_TO_ORIGIN
      </Link>
    </div>
  );
}
