"use client";

interface ThreatVerdictProps {
  verdict: string;
}

/** Threat assessment verdict badge — green for human, amber for warning, red otherwise. */
export default function ThreatVerdict({ verdict }: ThreatVerdictProps) {
  if (!verdict) return null;

  const isPass = verdict.startsWith("✓");
  const isWarn = verdict.startsWith("⚠");

  const textColor = isPass
    ? "text-[#90c8ff]/80"
    : isWarn
      ? "text-amber-300/80"
      : "text-red-300/80";

  const textShadow = isPass
    ? "0 0 8px rgba(52,211,153,0.4)"
    : "0 0 8px rgba(252,211,77,0.4)";

  return (
    <div
      className={`text-center text-[10px] tracking-[0.08em] uppercase font-mono mt-2 ${textColor}`}
      style={{ textShadow }}
    >
      {verdict}
    </div>
  );
}
