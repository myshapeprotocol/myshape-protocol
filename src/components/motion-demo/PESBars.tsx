"use client";

interface PESBar {
  label: string;
  value: number;
  hue: number;
}

interface PESBarsProps {
  bars: PESBar[];
  /** "full" = colored gradient bars, "minimal" = flat blue bars */
  variant?: "full" | "minimal";
}

/** 4-dimensional entropy breakdown bars. */
export default function PESBars({ bars, variant = "full" }: PESBarsProps) {
  return (
    <div className="space-y-2">
      {bars.map((g) => (
        <div key={g.label}>
          <div className="flex justify-between text-[10px]">
            <span className="text-white/35">{g.label}</span>
            <span className="text-[#90c8ff]/60 font-mono text-[11px]">
              {(g.value * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={
                variant === "full"
                  ? {
                      width: `${Math.min(g.value * 100, 100)}%`,
                      background: `linear-gradient(90deg, hsla(${g.hue},60%,50%,0.4), hsla(${g.hue},70%,60%,0.8))`,
                      boxShadow: `0 0 6px hsla(${g.hue},60%,60%,0.3)`,
                    }
                  : {
                      width: `${Math.min(g.value * 100, 100)}%`,
                      background: "rgba(144,200,255,0.3)",
                    }
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Build bar data from PES components */
export function buildPESBars(pes: {
  timing: number;
  noise: number;
  frequency: number;
  biological: number;
}): PESBar[] {
  return [
    { label: "μTiming", value: pes.timing, hue: 200 },
    { label: "Noise", value: pes.noise, hue: 190 },
    { label: "Frequency", value: pes.frequency, hue: 210 },
    { label: "Biological", value: pes.biological, hue: 180 },
  ];
}
