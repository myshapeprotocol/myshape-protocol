"use client";

/**
 * MotionGuide — 5-Phase Gold Standard Motion Sequence Overlay
 *
 * Renders real-time guidance during the 30-second human motion sampling.
 * Displays current phase instructions, progress bar, countdown,
 * and 9 mandatory skeletal anchor point detection status lights.
 *
 * Spec: MyShape_Documentation/Module_D_Engineering/MOTION_SEQUENCE_SPEC.md
 */

import { useMemo } from "react";

// ── Phase Definitions ──────────────────────────────────────────────

export interface PhaseSpec {
  phase: number;
  title: string;
  titleCN: string;
  instruction: string;
  durationMs: number;
  dominantFeature: string;
}

export const PHASES: PhaseSpec[] = [
  {
    phase: 1,
    title: "Static Baseline",
    titleCN: "站定",
    instruction: "Stand still. Arms at sides.\nLook straight ahead.\nBreathe naturally.",
    durationMs: 6000,
    dominantFeature: "Jerk Spectrum (8–12 Hz tremor)",
  },
  {
    phase: 2,
    title: "Head Panorama",
    titleCN: "环顾",
    instruction: "Slowly turn head left.\nThen slowly right.\nNow look up… then down.",
    durationMs: 6000,
    dominantFeature: "Kinematics (cervical ROM)",
  },
  {
    phase: 3,
    title: "Signature Arc",
    titleCN: "画弧",
    instruction: "Extend right arm.\nDraw large circles —\nclockwise 2×, then counter 2×.",
    durationMs: 7000,
    dominantFeature: "Acceleration + Jerk",
  },
  {
    phase: 4,
    title: "Weight Transfer",
    titleCN: "移重心",
    instruction: "Shift weight to right foot…\nnow to left foot…\nback to center.",
    durationMs: 6000,
    dominantFeature: "Kinematics (pelvic/hip ratios)",
  },
  {
    phase: 5,
    title: "Return to Stillness",
    titleCN: "归位",
    instruction: "Stand still again.\nArms at sides.\nRelax and breathe.",
    durationMs: 5000,
    dominantFeature: "Post-exertion tremor recovery",
  },
];

export const TOTAL_DURATION_MS = PHASES.reduce((s, p) => s + p.durationMs, 0); // 30000

// ── Mandatory Anchor Points ────────────────────────────────────────

export interface AnchorState {
  index: number;
  label: string;
  visible: boolean;
}

export const MANDATORY_ANCHORS: { index: number; label: string }[] = [
  { index: 0, label: "Nose" },
  { index: 11, label: "L Shoulder" },
  { index: 12, label: "R Shoulder" },
  { index: 13, label: "L Elbow" },
  { index: 14, label: "R Elbow" },
  { index: 15, label: "L Wrist" },
  { index: 16, label: "R Wrist" },
  { index: 23, label: "L Hip" },
  { index: 24, label: "R Hip" },
];

// ── Component Props ─────────────────────────────────────────────────

interface MotionGuideProps {
  /** Elapsed time within the 30s sequence (ms) */
  elapsedMs: number;
  /** Current frame's landmark visibility array (33 elements, 0–1) */
  landmarkVisibility: (number | undefined)[];
  /** Whether capture is active */
  active: boolean;
}

// ── Component ──────────────────────────────────────────────────────

export default function MotionGuide({ elapsedMs, landmarkVisibility, active }: MotionGuideProps) {
  // Determine current phase
  const { currentPhase, phaseElapsed, phaseProgress } = useMemo(() => {
    let remaining = elapsedMs;
    for (const p of PHASES) {
      if (remaining < p.durationMs) {
        return {
          currentPhase: p,
          phaseElapsed: remaining,
          phaseProgress: Math.min(remaining / p.durationMs, 1),
        };
      }
      remaining -= p.durationMs;
    }
    // Past total duration — show last phase complete
    const last = PHASES[PHASES.length - 1];
    return {
      currentPhase: last,
      phaseElapsed: last.durationMs,
      phaseProgress: 1,
    };
  }, [elapsedMs]);

  // Overall progress
  const totalProgress = Math.min(elapsedMs / TOTAL_DURATION_MS, 1);

  // Anchor validation
  const anchors: AnchorState[] = useMemo(
    () =>
      MANDATORY_ANCHORS.map((a) => ({
        ...a,
        visible: (landmarkVisibility[a.index] ?? 0) > 0.5,
      })),
    [landmarkVisibility]
  );

  const allAnchorsVisible = anchors.every((a) => a.visible);
  const missingCount = anchors.filter((a) => !a.visible).length;
  const borderColor = allAnchorsVisible
    ? "rgba(34,211,238,0.5)"
    : missingCount < 3
    ? "rgba(250,204,21,0.5)"
    : "rgba(239,68,68,0.5)";

  if (!active) return null;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none">
      {/* ── Top bar: phase indicator + total progress ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center gap-3 px-4 py-2.5"
        style={{ background: "linear-gradient(180deg, rgba(2,4,10,0.9) 60%, rgba(2,4,10,0) 100%)" }}>
        {/* Phase badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-cyan-400/70 text-[10px] tracking-[0.3em] font-mono">
            PHASE {currentPhase.phase}/5
          </span>
          <span className="text-white/70 text-[11px] tracking-[0.15em] font-medium">
            {currentPhase.titleCN}
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="flex-1 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-linear"
            style={{
              width: `${(totalProgress * 100).toFixed(1)}%`,
              background: "linear-gradient(90deg, rgba(34,211,238,0.4), rgba(34,211,238,0.8))",
              boxShadow: "0 0 6px rgba(34,211,238,0.3)",
            }}
          />
        </div>

        {/* Countdown */}
        <span className="text-white/50 text-[10px] font-mono tabular-nums shrink-0">
          {((TOTAL_DURATION_MS - elapsedMs) / 1000).toFixed(1)}s
        </span>
      </div>

      {/* ── Center: phase instruction card ── */}
      <div
        className="absolute left-4 top-1/2 -translate-y-1/2 max-w-[180px] px-4 py-3 border bg-black/70 backdrop-blur-sm transition-all duration-500"
        style={{ borderColor, borderRadius: 4 }}
      >
        {/* Phase progress within card */}
        <div className="h-[2px] bg-white/5 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-linear"
            style={{
              width: `${(phaseProgress * 100).toFixed(1)}%`,
              background: `linear-gradient(90deg, rgba(34,211,238,0.3), rgba(34,211,238,0.7))`,
            }}
          />
        </div>

        {/* Instruction text */}
        <p className="text-white/80 text-[11px] leading-relaxed tracking-[0.04em] whitespace-pre-line">
          {currentPhase.instruction}
        </p>

        {/* Dominant feature hint */}
        <p className="text-cyan-400/30 text-[8px] tracking-[0.1em] uppercase mt-2 leading-tight">
          {currentPhase.dominantFeature}
        </p>
      </div>

      {/* ── Bottom-right: anchor detection lights ── */}
      <div
        className="absolute bottom-4 right-4 px-3 py-2 border bg-black/70 backdrop-blur-sm"
        style={{ borderColor, borderRadius: 4 }}
      >
        <div className="text-white/20 text-[7px] tracking-[0.2em] uppercase mb-1.5">
          Anchors {allAnchorsVisible ? "✓" : `${missingCount} missing`}
        </div>
        <div className="grid grid-cols-3 gap-x-3 gap-y-1">
          {anchors.map((a) => (
            <div key={a.index} className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
                style={{
                  background: a.visible
                    ? "rgba(34,211,238,0.8)"
                    : "rgba(239,68,68,0.6)",
                  boxShadow: a.visible
                    ? "0 0 5px rgba(34,211,238,0.5)"
                    : "0 0 4px rgba(239,68,68,0.3)",
                }}
              />
              <span
                className="text-[7px] tracking-[0.06em] transition-colors duration-300"
                style={{ color: a.visible ? "rgba(255,255,255,0.5)" : "rgba(239,68,68,0.5)" }}
              >
                {a.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Border glow pulse when all anchors locked ── */}
      {allAnchorsVisible && (
        <div
          className="absolute inset-0 border-[2px] rounded-sm pointer-events-none transition-opacity duration-500"
          style={{
            borderColor: "rgba(34,211,238,0.25)",
            boxShadow: "inset 0 0 40px rgba(34,211,238,0.04), 0 0 20px rgba(34,211,238,0.06)",
            opacity: 0.8,
          }}
        />
      )}

      {/* ── Phase transition flash ── */}
      {phaseElapsed < 300 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: "radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)",
            opacity: 1 - phaseElapsed / 300,
          }}
        />
      )}
    </div>
  );
}
