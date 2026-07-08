"use client";

import { playTick } from "@/utils/useAudioTick";
import type { NetworkData } from "./types";

interface Props {
  data: NetworkData;
  evoEntropy: number;
}

export default function ContinuityKPI({ data, evoEntropy }: Props) {
  const kpis = [
    {
      label: "Trajectories",
      value: data.totalNodes,
      extra: `${data.activeHumans} human · ${data.agents} agent`,
    },
    {
      label: "Evolutionary Entropy",
      value: evoEntropy,
      extra: "protocol vitality index",
    },
    {
      label: "Presence Receipts",
      value: data.totalScans,
      extra: "total notarized becomings",
    },
    {
      label: "Active Today",
      value: data.activeToday,
      extra: "continuity signals / 24h",
    },
  ];

  return (
    <div className="continuity-kpi-grid">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="continuity-kpi-card"
          onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}
        >
          <div className="continuity-kpi-label">{kpi.label}</div>
          <div className="continuity-kpi-value">{kpi.value}</div>
          <div className="continuity-kpi-extra">{kpi.extra}</div>
        </div>
      ))}
    </div>
  );
}
