"use client";

/**
 * MotionGuide — 5-Phase Gold Standard Motion Sequence Overlay
 *
 * State-machine-driven real-time guidance for the 30-second human motion
 * sampling protocol. Enforces per-phase velocity/angular constraints and
 * renders ethereal-data-energy wireframe skeleton feedback.
 *
 * Spec: MyShape_Documentation/Module_D_Engineering/MOTION_SEQUENCE_SPEC.md
 */

import { useMemo, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// Phase Definitions — extracted directly from MOTION_SEQUENCE_SPEC.md
// ═══════════════════════════════════════════════════════════════════

export interface PhaseSpec {
  phase: number;
  title: string;
  titleCN: string;
  instruction: string;
  durationMs: number;
  dominantFeature: string;
  /** Phase-specific motion constraints */
  constraints: PhaseConstraints;
}

export interface PhaseConstraints {
  /** Maximum allowed joint velocity (m/s). null = no check */
  maxJointVelocity: number | null;
  /** Maximum head angular velocity (deg/s). null = no check */
  maxHeadAngular: number | null;
  /** Minimum wrist velocity (m/s) to detect "too slow/motionless". null = no check */
  minWristVelocity: number | null;
  /** Whether torso stillness is enforced (Phases 1, 5) */
  enforceStillness: boolean;
}

export const PHASES: PhaseSpec[] = [
  {
    phase: 1,
    title: "Static Baseline",
    titleCN: "站定",
    instruction: "Stand still. Arms at sides.\nLook straight ahead.\nBreathe naturally.",
    durationMs: 6000,
    dominantFeature: "Jerk Spectrum (8–12 Hz tremor)",
    constraints: {
      maxJointVelocity: 0.3,       // > 0.3 m/s → moving too much
      maxHeadAngular: 10,           // > 10°/s → head drift
      minWristVelocity: null,
      enforceStillness: true,
    },
  },
  {
    phase: 2,
    title: "Head Panorama",
    titleCN: "环顾",
    instruction: "Slowly turn head left.\nThen slowly right.\nNow look up… then down.",
    durationMs: 6000,
    dominantFeature: "Kinematics (cervical ROM)",
    constraints: {
      maxJointVelocity: 0.2,       // torso must stay near-still
      maxHeadAngular: 30,           // 30°/s hard ceiling (motion blur)
      minWristVelocity: null,
      enforceStillness: true,       // only head moves, not torso
    },
  },
  {
    phase: 3,
    title: "Signature Arc",
    titleCN: "画弧",
    instruction: "Extend right arm.\nDraw large circles —\nclockwise 2×, then counter 2×.",
    durationMs: 7000,
    dominantFeature: "Acceleration + Jerk",
    constraints: {
      maxJointVelocity: 4.0,        // 4 m/s hard ceiling (MediaPipe tracking loss)
      maxHeadAngular: null,
      minWristVelocity: 0.05,       // > 0.05 m/s ensures actual motion
      enforceStillness: false,
    },
  },
  {
    phase: 4,
    title: "Weight Transfer",
    titleCN: "移重心",
    instruction: "Shift weight to right foot…\nnow to left foot…\nback to center.",
    durationMs: 6000,
    dominantFeature: "Kinematics (pelvic/hip ratios)",
    constraints: {
      maxJointVelocity: 0.5,        // slow lateral shift
      maxHeadAngular: null,
      minWristVelocity: null,
      enforceStillness: false,
    },
  },
  {
    phase: 5,
    title: "Return to Stillness",
    titleCN: "归位",
    instruction: "Stand still again.\nArms at sides.\nRelax and breathe.",
    durationMs: 5000,
    dominantFeature: "Post-exertion tremor recovery",
    constraints: {
      maxJointVelocity: 0.3,
      maxHeadAngular: 10,
      minWristVelocity: null,
      enforceStillness: true,
    },
  },
];

export const TOTAL_DURATION_MS = PHASES.reduce((s, p) => s + p.durationMs, 0); // 30000

// ═══════════════════════════════════════════════════════════════════
// Mandatory Skeletal Anchors
// ═══════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════
// Constraint Violation Types
// ═══════════════════════════════════════════════════════════════════

export interface ConstraintViolation {
  type: 'speed_high' | 'speed_low' | 'angular' | 'stillness';
  message: string;
  actualValue: number;
  threshold: number;
}

/** Wrist velocity (m/s) tracked for Phase 3 slow-motion detection */
export interface VelocitySnapshot {
  wristVelocity: number;           // m/s — max of left/right wrist
  maxJointVelocity: number;        // m/s — max across all tracked joints
  headAngularVelocity: number;     // deg/s
  torsoVelocity: number;           // m/s — shoulder midpoint drift
}

// ═══════════════════════════════════════════════════════════════════
// Component Props
// ═══════════════════════════════════════════════════════════════════

interface MotionGuideProps {
  elapsedMs: number;
  landmarkVisibility: (number | undefined)[];
  /** Per-frame velocity snapshot from MediaPipe tracking */
  velocity: VelocitySnapshot | null;
  /** Whether the 9-anchor valid-frame condition is met this frame */
  anchorsAllVisible: boolean;
  active: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// State Machine Engine
// ═══════════════════════════════════════════════════════════════════

function resolvePhase(elapsedMs: number): {
  phase: PhaseSpec;
  phaseElapsed: number;
  phaseProgress: number;
  phaseIndex: number;
} {
  let remaining = elapsedMs;
  for (let i = 0; i < PHASES.length; i++) {
    if (remaining < PHASES[i].durationMs) {
      return {
        phase: PHASES[i],
        phaseElapsed: remaining,
        phaseProgress: Math.min(remaining / PHASES[i].durationMs, 1),
        phaseIndex: i,
      };
    }
    remaining -= PHASES[i].durationMs;
  }
  const last = PHASES[PHASES.length - 1];
  return { phase: last, phaseElapsed: last.durationMs, phaseProgress: 1, phaseIndex: PHASES.length - 1 };
}

function checkConstraints(
  phase: PhaseSpec,
  vel: VelocitySnapshot | null
): ConstraintViolation[] {
  if (!vel) return [];
  const c = phase.constraints;
  const violations: ConstraintViolation[] = [];

  // Hard speed ceiling
  if (c.maxJointVelocity !== null && vel.maxJointVelocity > c.maxJointVelocity) {
    violations.push({
      type: 'speed_high',
      message: c.enforceStillness
        ? 'Stay still — micro-motion only'
        : `Slow down — ${vel.maxJointVelocity.toFixed(1)} m/s > ${c.maxJointVelocity} m/s limit`,
      actualValue: vel.maxJointVelocity,
      threshold: c.maxJointVelocity,
    });
  }

  // Head angular velocity ceiling
  if (c.maxHeadAngular !== null && vel.headAngularVelocity > c.maxHeadAngular) {
    violations.push({
      type: 'angular',
      message: `Head turn too fast — ${vel.headAngularVelocity.toFixed(0)}°/s > ${c.maxHeadAngular}°/s`,
      actualValue: vel.headAngularVelocity,
      threshold: c.maxHeadAngular,
    });
  }

  // "Too slow" detection (Phase 3: must draw actual circles)
  if (c.minWristVelocity !== null && vel.wristVelocity < c.minWristVelocity) {
    violations.push({
      type: 'speed_low',
      message: 'Move your arm — draw larger circles',
      actualValue: vel.wristVelocity,
      threshold: c.minWristVelocity,
    });
  }

  // Stillness enforcement: torso drift check
  if (c.enforceStillness && vel.torsoVelocity > 0.15) {
    violations.push({
      type: 'stillness',
      message: 'Keep your torso still — only breathe naturally',
      actualValue: vel.torsoVelocity,
      threshold: 0.15,
    });
  }

  return violations;
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export default function MotionGuide({
  elapsedMs, landmarkVisibility, velocity, anchorsAllVisible, active,
}: MotionGuideProps) {
  // ── State Machine ──
  const { phase, phaseElapsed, phaseProgress, phaseIndex } = useMemo(
    () => resolvePhase(elapsedMs), [elapsedMs]
  );

  const violations = useMemo(
    () => checkConstraints(phase, velocity), [phase, velocity]
  );

  // ── Voice Guidance ──
  const prevPhaseRef = useRef(-1);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Pre-load US English voice (voices load asynchronously)
  useEffect(() => {
    const loadVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      voiceRef.current =
        voices.find(v => v.name === "Samantha" && v.lang === "en-US") ||
        voices.find(v => v.name.includes("Google US English")) ||
        voices.find(v => v.lang === "en-US" && v.name.includes("English")) ||
        voices.find(v => v.lang === "en-US") ||
        null;
    };
    loadVoice();
    window.speechSynthesis.onvoiceschanged = loadVoice;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  useEffect(() => {
    if (!active) return;
    if (prevPhaseRef.current === phaseIndex) return;
    prevPhaseRef.current = phaseIndex;

    const utterance = new SpeechSynthesisUtterance(phase.instruction.replace(/\n/g, ". "));
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.7;
    if (voiceRef.current) utterance.voice = voiceRef.current;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [phaseIndex, phase.instruction, active]);

  const totalProgress = Math.min(elapsedMs / TOTAL_DURATION_MS, 1);
  const remainingSec = Math.max(0, (TOTAL_DURATION_MS - elapsedMs) / 1000);

  // ── Anchors ──
  const anchors: AnchorState[] = useMemo(
    () => MANDATORY_ANCHORS.map(a => ({
      ...a,
      visible: (landmarkVisibility[a.index] ?? 0) > 0.5,
    })),
    [landmarkVisibility]
  );
  const missingCount = anchors.filter(a => !a.visible).length;

  // Frame border color
  const borderColor = anchorsAllVisible
    ? "rgba(144,200,255,0.5)"
    : missingCount < 3
    ? "rgba(250,204,21,0.5)"
    : "rgba(239,68,68,0.5)";

  // Violation → red flash
  const hasViolation = violations.length > 0;
  const violationBorder = hasViolation ? "rgba(239,68,68,0.55)" : borderColor;

  if (!active) return null;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none">
      {/* ══════════════════════════════════════════════════════════
          TOP BAR — phase indicator + progress + countdown
          ══════════════════════════════════════════════════════════ */}
      <div className="absolute top-0 left-0 right-0 flex items-center gap-3 px-4 py-2.5"
        style={{ background: "linear-gradient(180deg, rgba(2,4,10,0.9) 60%, rgba(2,4,10,0) 100%)" }}>
        {/* Phase pill */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[#90c8ff]/70 text-[10px] tracking-[0.3em] font-mono">
            PHASE {phase.phase}/5
          </span>
          <span className="text-white/70 text-[11px] tracking-[0.15em] font-medium">
            {phase.title}
          </span>
          {/* Mini phase dots */}
          <div className="flex gap-1 ml-1">
            {PHASES.map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full transition-colors duration-500"
                style={{
                  background: i < phaseIndex ? "rgba(144,200,255,0.6)"
                    : i === phaseIndex ? "rgba(144,200,255,0.9)"
                    : "rgba(255,255,255,0.1)",
                  boxShadow: i === phaseIndex ? "0 0 4px rgba(144,200,255,0.5)" : "none",
                }} />
            ))}
          </div>
        </div>

        {/* Total progress bar */}
        <div className="flex-1 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300 ease-linear"
            style={{
              width: `${(totalProgress * 100).toFixed(1)}%`,
              background: hasViolation
                ? "linear-gradient(90deg, rgba(239,68,68,0.4), rgba(239,68,68,0.8))"
                : "linear-gradient(90deg, rgba(144,200,255,0.4), rgba(144,200,255,0.8))",
              boxShadow: hasViolation
                ? "0 0 6px rgba(239,68,68,0.3)"
                : "0 0 6px rgba(144,200,255,0.3)",
            }} />
        </div>

        <span className="text-white/50 text-[10px] font-mono tabular-nums shrink-0">
          {remainingSec.toFixed(1)}s
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════
          CENTER — instruction card
          ══════════════════════════════════════════════════════════ */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 max-w-[180px] px-4 py-3 border bg-black/70 backdrop-blur-sm transition-all duration-500"
        style={{ borderColor: violationBorder, borderRadius: 4 }}>

        {/* Phase mini progress */}
        <div className="h-[2px] bg-white/5 rounded-full mb-3 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300 ease-linear"
            style={{
              width: `${(phaseProgress * 100).toFixed(1)}%`,
              background: `linear-gradient(90deg, rgba(144,200,255,0.3), rgba(144,200,255,0.7))`,
            }} />
        </div>

        <p className="text-white/80 text-[11px] leading-relaxed tracking-[0.04em] whitespace-pre-line">
          {phase.instruction}
        </p>

        <p className="text-[#90c8ff]/30 text-[8px] tracking-[0.1em] uppercase mt-2 leading-tight">
          {phase.dominantFeature}
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          CONSTRAINT VIOLATION WARNING
          ══════════════════════════════════════════════════════════ */}
      {hasViolation && (
        <div className="absolute left-1/2 bottom-32 -translate-x-1/2 z-30">
          {violations.map((v, i) => (
            <div key={i} className="px-3 py-1.5 border border-red-400/30 bg-red-500/10 backdrop-blur-sm animate-pulse"
              style={{ borderRadius: 3 }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                <span className="text-red-300/80 text-[9px] tracking-[0.08em] font-mono leading-tight">
                  {v.message}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          BOTTOM-RIGHT — anchor detection lights
          ══════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-4 right-4 px-3 py-2 border bg-black/70 backdrop-blur-sm"
        style={{ borderColor, borderRadius: 4 }}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-white/20 text-[7px] tracking-[0.2em] uppercase">
            Anchors
          </span>
          <span className="text-[8px] font-mono"
            style={{ color: anchorsAllVisible ? "rgba(144,200,255,0.7)" : "rgba(250,204,21,0.7)" }}>
            {anchorsAllVisible ? "✓ LOCKED" : `${missingCount} MISSING`}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-x-3 gap-y-1">
          {anchors.map(a => (
            <div key={a.index} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
                style={{
                  background: a.visible ? "rgba(144,200,255,0.8)" : "rgba(239,68,68,0.6)",
                  boxShadow: a.visible
                    ? "0 0 5px rgba(144,200,255,0.5)"
                    : "0 0 4px rgba(239,68,68,0.3)",
                }} />
              <span className="text-[7px] tracking-[0.06em] transition-colors duration-300"
                style={{ color: a.visible ? "rgba(255,255,255,0.5)" : "rgba(239,68,68,0.5)" }}>
                {a.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BORDER — anchor-locked glow / violation red pulse
          ══════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 border-[2px] rounded-sm pointer-events-none transition-all duration-500"
        style={{
          borderColor: hasViolation
            ? "rgba(239,68,68,0.35)"
            : anchorsAllVisible
            ? "rgba(144,200,255,0.25)"
            : "rgba(255,255,255,0.05)",
          boxShadow: hasViolation
            ? "inset 0 0 60px rgba(239,68,68,0.06)"
            : anchorsAllVisible
            ? "inset 0 0 40px rgba(144,200,255,0.04), 0 0 20px rgba(144,200,255,0.06)"
            : "none",
        }} />

      {/* ══════════════════════════════════════════════════════════
          PHASE TRANSITION — flash on entry
          ══════════════════════════════════════════════════════════ */}
      {phaseElapsed < 400 && (
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: "radial-gradient(circle at center, rgba(144,200,255,0.08) 0%, transparent 70%)",
            opacity: 1 - phaseElapsed / 400,
          }} />
      )}
    </div>
  );
}
