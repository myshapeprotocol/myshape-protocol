"use client";

interface TelemetryPanelProps {
  sstFrames: number;
  validFrames: number;
  energy: number | null;
  phase: string;
  /** When true, shows a "collecting frames" hint when frame count is low */
  showCollectingHint?: boolean;
}

/** Motion telemetry display — SST frames, valid count, energy, phase. */
export default function TelemetryPanel({
  sstFrames,
  validFrames,
  energy,
  phase,
  showCollectingHint = false,
}: TelemetryPanelProps) {
  return (
    <div className="space-y-2.5 text-[10px] font-mono">
      <div className="flex justify-between">
        <span className="text-white/25">SST Frames</span>
        <span className="text-[#90c8ff]/60">{sstFrames}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-white/25">Valid Frames</span>
        <span className="text-[#90c8ff]/60">
          {validFrames}{" "}
          <span className="text-white/15">/ {sstFrames || 0}</span>
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-white/25">Energy</span>
        <span className="text-[#90c8ff]/60">
          {energy != null ? energy.toFixed(2) : "—"}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-white/25">Phase</span>
        <span className="text-[#90c8ff]/50">{phase.toUpperCase()}</span>
      </div>
      {showCollectingHint && sstFrames < 30 && (
        <div className="text-[#90c8ff]/30 text-[8px] italic">
          Collecting frames... ({sstFrames}/30)
        </div>
      )}
    </div>
  );
}
