"use client";

import type { NetworkData } from "./types";

interface Props {
  data: NetworkData;
}

function nodeDotClass(node: { isGenesis: boolean; scans: number }): string {
  if (node.isGenesis) return "continuity-node-dot continuity-node-dot-genesis";
  if (node.scans > 0) return "continuity-node-dot continuity-node-dot-active";
  return "continuity-node-dot continuity-node-dot-idle";
}

export default function ContinuityNodeList({ data }: Props) {
  if (data.nodes.length === 0) return null;

  return (
    <section aria-labelledby="node-list-heading">
      <div className="continuity-node-list-header">
        <span id="node-list-heading" className="continuity-node-list-label">
          Connected Trajectories
        </span>
        <span className="continuity-node-list-count">
          {data.nodes.length} nodes
        </span>
      </div>
      <div className="continuity-node-grid">
        {data.nodes.slice(0, 20).map((node) => (
          <div key={node.handle || node.mask} className="continuity-node-card">
            <div className="continuity-node-left">
              <div className={nodeDotClass(node)} />
              <div>
                <div className="continuity-node-name">
                  {node.handle || node.mask}
                </div>
                <div className="continuity-node-meta">
                  {node.scans} receipts · Lv.{node.particleLevel}
                </div>
              </div>
            </div>
            <div className="continuity-node-right">
              <div className="continuity-node-entropy">
                {node.entropy?.toFixed(0) || "—"}
              </div>
              <div className="continuity-node-entropy-label">entropy</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
