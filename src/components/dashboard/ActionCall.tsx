"use client";

import Link from "next/link";
import type { ProtocolProgress } from "@/types/protocol-progress";
import { playTick } from "@/utils/useAudioTick";

type Props = { progress: ProtocolProgress };

export default function ActionCall({ progress }: Props) {
  const { narrative, stage } = progress;

  return (
    <section
      className="action-call"
      onMouseEnter={() => playTick(450, "sine", 0.04, 0.008)}
    >
      {/* ── Summary ── */}
      <p className="action-summary">{narrative.summary}</p>

      {/* ── Next step ── */}
      {narrative.nextUnlock && (
        <div className="action-next">
          <span className="action-next-label">Next Protocol Milestone</span>
          <span className="action-next-feature">{narrative.nextUnlock.label}</span>
          <span className="action-next-req">{narrative.nextUnlock.requirement}</span>
        </div>
      )}

      {/* ── All gates unlocked ── */}
      {!narrative.nextUnlock && (
        <div className="action-complete">
          <span className="action-complete-icon">◈</span>
          <span className="action-complete-text">
            All protocol capabilities unlocked. You are a fully sovereign entity in the MyShape identity mesh.
          </span>
        </div>
      )}

      {/* ── CTA button ── */}
      <div className="action-cta-row">
        {stage === "GENESIS" && (
          <Link
            href="/motion-demo"
            className="action-cta"
            onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
          >
            ◈ Perform Motion Scan →
          </Link>
        )}
        {stage === "FORMATION" && (
          <Link
            href="/protocol/zk"
            className="action-cta"
            onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
          >
            ◈ Explore Continuity Protocol →
          </Link>
        )}
        {stage === "SOVEREIGN" && (
          <span
            className="action-cta action-cta-sovereign"
          >
            ◈ Governance Module — Coming Soon
          </span>
        )}
      </div>
    </section>
  );
}
