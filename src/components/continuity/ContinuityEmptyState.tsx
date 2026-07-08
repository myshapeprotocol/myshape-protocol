import Link from "next/link";

export default function ContinuityEmptyState() {
  return (
    <div className="continuity-empty">
      <div className="continuity-empty-label">No Trajectories Yet</div>
      <p className="continuity-empty-text">
        The network is waiting for its first verified trajectories. Be the
        first to establish a sovereign continuity chain.
      </p>
      <Link
        href="/genesis"
        className="inline-block px-10 py-3.5 border text-[10px] tracking-[0.3em] uppercase transition-all mt-4"
        style={{
          borderColor: "rgba(144,200,255,0.3)",
          color: "rgba(144,200,255,0.7)",
          clipPath:
            "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.background = "rgba(144,200,255,0.04)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(144,200,255,0.7)";
          e.currentTarget.style.background = "transparent";
        }}
      >
        Initialize Your Trajectory →
      </Link>
    </div>
  );
}
