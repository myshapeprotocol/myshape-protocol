import type { NetworkData } from "./types";

interface Props {
  data: NetworkData;
}

export default function ContinuityStatsFooter({ data }: Props) {
  const stats = [
    { label: "Protocol Engines", value: data.engines },
    { label: "Attack Signatures", value: data.attackSigs },
    {
      label: "Enclave",
      value: data.protocolEnclave ? "ACTIVE" : "DEGRADED",
    },
  ];

  return (
    <footer className="continuity-stats-footer" aria-label="Protocol statistics">
      {stats.map((s) => (
        <div key={s.label} className="continuity-stat-item">
          <div className="continuity-stat-label">{s.label}</div>
          <div className="continuity-stat-value">{s.value}</div>
        </div>
      ))}
    </footer>
  );
}
