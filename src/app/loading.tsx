/**
 * Root Loading UI — 路由切换时的全局加载状态
 * Next.js App Router 约定：loading.tsx 自动包裹所有 page.tsx 的 Suspense 边界
 */
export default function RootLoading() {
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
        gap: "24px",
      }}
    >
      {/* 简单的脉冲指示器 — 保持品牌调性 */}
      <div
        style={{
          width: "4px",
          height: "4px",
          borderRadius: "50%",
          background: "#90c8ff",
          boxShadow: "0 0 12px #90c8ff, 0 0 24px rgba(144, 200, 255, 0.5)",
          animation: "myshape-loading-pulse 1.2s ease-in-out infinite",
        }}
      />
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "9px",
          letterSpacing: "0.6em",
          color: "rgba(144, 200, 255, 0.4)",
          textTransform: "uppercase",
        }}
      >
        SYNCHRONIZING
      </span>
      <style>{`
        @keyframes myshape-loading-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.8); }
        }
      `}</style>
    </div>
  );
}
