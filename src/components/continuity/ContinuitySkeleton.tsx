export default function ContinuitySkeleton() {
  return (
    <div className="continuity-skeleton" aria-busy="true" aria-label="Loading network data">
      {/* KPI skeleton */}
      <div className="continuity-skeleton-kpi">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="continuity-skeleton-card" />
        ))}
      </div>

      {/* Genesis section skeleton */}
      <div
        style={{
          border: "1px solid rgba(212,175,55,0.08)",
          background: "rgba(212,175,55,0.01)",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            height: "12px",
            width: "120px",
            background: "rgba(212,175,55,0.08)",
            animation: "continuity-shimmer 1.8s ease-in-out infinite",
          }}
        />
      </div>

      {/* Node rows skeleton */}
      <div className="continuity-skeleton-rows">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="continuity-skeleton-row" />
        ))}
      </div>
    </div>
  );
}
