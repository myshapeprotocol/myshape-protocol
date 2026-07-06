"use client";

/* ═══════════════════════════════════════════════
   DashboardSkeleton — three-layer loading mirror

   Mirrors the exact structure of the Protocol
   Journey dashboard (Hero → CapabilityMatrix →
   ActionCall) so the page never renders blank.

   Each layer fades in sequentially to communicate
   that the protocol pipeline is assembling.
   ═══════════════════════════════════════════════ */

function PulsingBar({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        background: "rgba(144,200,255,0.06)",
        borderRadius: 2,
        ...style,
      }}
    />
  );
}

export default function DashboardSkeleton() {
  return (
    <div
      className="space-y-8 md:space-y-10"
      style={{ animation: "fadeIn 0.6s ease-out" }}
    >
      {/* ════════════════════════════════════════
          Layer 1 — Hero Skeleton
          ════════════════════════════════════════ */}
      <div
        className="flex flex-col gap-4 p-6"
        style={{
          border: "1px solid rgba(144,200,255,0.08)",
          background: "rgba(144,200,255,0.015)",
        }}
      >
        {/* Stage badge row */}
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "rgba(144,200,255,0.15)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          <PulsingBar className="h-3 w-20" />
          <PulsingBar className="h-3 w-12 ml-auto" />
        </div>

        {/* Particle identity — centred */}
        <div className="flex flex-col items-center gap-1.5 py-3">
          <PulsingBar
            className="h-9 w-36"
            style={{ background: "rgba(144,200,255,0.08)" }}
          />
          <PulsingBar className="h-3 w-24" />
        </div>

        {/* Progress bar */}
        <div
          className="h-1 w-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div
            className="h-full w-2/5"
            style={{
              background: "rgba(144,200,255,0.12)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
        </div>

        {/* Next level hint */}
        <div className="flex justify-between">
          <PulsingBar className="h-3 w-28" />
          <PulsingBar className="h-3 w-10" />
        </div>

        {/* Streak row */}
        <div
          className="flex justify-between pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <PulsingBar className="h-3 w-20" />
          <PulsingBar className="h-3 w-16" />
        </div>
      </div>

      {/* ════════════════════════════════════════
          Layer 2 — Capability Matrix Skeleton
          ════════════════════════════════════════ */}
      <div
        className="flex flex-col gap-5 p-6"
        style={{
          border: "1px solid rgba(144,200,255,0.08)",
          background: "rgba(144,200,255,0.015)",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <PulsingBar className="h-3 w-24" />
          <PulsingBar className="h-3 w-10" />
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-2 p-4"
              style={{
                border: "1px solid rgba(144,200,255,0.06)",
                background: "rgba(144,200,255,0.008)",
              }}
            >
              <PulsingBar className="h-5 w-5 rounded" />
              <PulsingBar className="h-3.5 w-28" />
              <PulsingBar className="h-2.5 w-full mt-1" />
              <PulsingBar className="h-2.5 w-3/4" />
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════
          Layer 3 — Action Call Skeleton
          ════════════════════════════════════════ */}
      <div
        className="flex flex-col items-center gap-4 p-6 text-center"
        style={{
          border: "1px solid rgba(144,200,255,0.08)",
          background: "rgba(144,200,255,0.015)",
        }}
      >
        <PulsingBar className="h-4 w-56" />
        <PulsingBar className="h-3 w-40" />
        <div className="flex flex-col items-center gap-1.5 mt-1">
          <PulsingBar className="h-3 w-16" />
          <PulsingBar className="h-4 w-32" />
          <PulsingBar className="h-3 w-24" />
        </div>
        <PulsingBar
          className="h-10 w-40 mt-2"
          style={{ background: "rgba(144,200,255,0.06)" }}
        />
      </div>

      {/* Fade-in keyframe injected once per document */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
