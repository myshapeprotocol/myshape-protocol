"use client";

interface PESGaugeProps {
  score: number;
  size?: "lg" | "sm";
}

/** PES ring gauge — circular progress with dynamic color threshold (0.5). */
export default function PESGauge({ score, size = "lg" }: PESGaugeProps) {
  const isLarge = size === "lg";
  const dims = isLarge ? "w-20 h-20" : "w-16 h-16";
  const fontSize = isLarge ? "text-[20px]" : "text-[16px]";
  const strokeColor =
    score > 0.5 ? "rgba(52,211,153,0.7)" : "rgba(144,200,255,0.6)";
  const glowColor =
    score > 0.5
      ? "rgba(52,211,153,0.5)"
      : "rgba(144,200,255,0.4)";
  const textGlow =
    score > 0.5
      ? "0 0 14px rgba(52,211,153,0.6)"
      : "0 0 14px rgba(144,200,255,0.5)";

  return (
    <div className={`relative ${dims}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="42" fill="none"
          stroke={strokeColor}
          strokeWidth="6"
          strokeDasharray={`${score * 264} 264`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-white/90 font-mono ${fontSize}`}
          style={{ textShadow: textGlow }}
        >
          {(score * 100).toFixed(0)}
        </span>
      </div>
    </div>
  );
}
