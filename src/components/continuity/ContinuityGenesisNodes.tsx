"use client";

import { playTick } from "@/utils/useAudioTick";
import type { NetworkData } from "./types";

interface Props {
  data: NetworkData;
}

export default function ContinuityGenesisNodes({ data }: Props) {
  return (
    <section
      className="continuity-genesis"
      aria-labelledby="genesis-nodes-heading"
      onMouseEnter={() => playTick(400, "sine", 0.03, 0.008)}
    >
      <div className="continuity-genesis-header">
        <span id="genesis-nodes-heading" className="continuity-genesis-label">
          Phase: Genesis Alpha
        </span>
        <span className="continuity-genesis-count">
          Access Restricted
        </span>
      </div>
      <div className="continuity-genesis-tags">
        {data.nodes
          .filter((n) => n.isGenesis)
          .slice(0, 20)
          .map((n, i) => (
            <div
              key={n.handle || i}
              className="continuity-genesis-tag"
              onMouseEnter={() => playTick(350, "sine", 0.03, 0.006)}
            >
              {n.handle || `GNS_${i + 1}`}
            </div>
          ))}
        {data.sovereignNodes > 20 && (
          <div className="continuity-genesis-more">
            +{data.sovereignNodes - 20} more
          </div>
        )}
      </div>
    </section>
  );
}
