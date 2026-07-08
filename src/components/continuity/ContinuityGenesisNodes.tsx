"use client";

import type { NetworkData } from "./types";

interface Props {
  data: NetworkData;
}

export default function ContinuityGenesisNodes({ data }: Props) {
  if (data.genesisNodes === 0) return null;

  return (
    <section
      className="continuity-genesis"
      aria-labelledby="genesis-nodes-heading"
    >
      <div className="continuity-genesis-header">
        <span id="genesis-nodes-heading" className="continuity-genesis-label">
          Founding Cohort
        </span>
        <span className="continuity-genesis-count">
          {data.genesisNodes} / 100
        </span>
      </div>
      <div className="continuity-genesis-tags">
        {data.nodes
          .filter((n) => n.isGenesis)
          .slice(0, 20)
          .map((n, i) => (
            <div key={n.handle || i} className="continuity-genesis-tag">
              {n.handle || `GNS_${i + 1}`}
            </div>
          ))}
        {data.genesisNodes > 20 && (
          <div className="continuity-genesis-more">
            +{data.genesisNodes - 20} more
          </div>
        )}
      </div>
    </section>
  );
}
