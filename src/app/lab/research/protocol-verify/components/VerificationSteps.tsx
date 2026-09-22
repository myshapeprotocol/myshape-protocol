"use client";

import { useState, useEffect } from "react";
import type { VerificationStep } from "../lib/verify-receipt";

interface Props {
  steps: VerificationStep[];
  onComplete?: () => void;
}

function stepIcon(status: string) {
  switch (status) {
    case "pass": return "✓";
    case "fail": return "✗";
    case "skipped": return "—";
    case "running": return "◌";
    default: return "○";
  }
}

function stepColor(status: string) {
  switch (status) {
    case "pass": return "#3fb950";
    case "fail": return "#f85149";
    case "skipped": return "#636363";
    case "running": return "#d29922";
    default: return "#262626";
  }
}

/**
 * Displays V₁–V₇ verification steps with sequential animation.
 * Each step transitions from pending → running → pass/fail/skipped
 * with a staggered delay.
 */
export default function VerificationSteps({ steps, onComplete }: Props) {
  const [revealed, setRevealed] = useState<number>(0);

  useEffect(() => {
    setRevealed(0);
    if (steps.length === 0) return;

    // Reveal each step sequentially with 600ms delay
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setRevealed(i + 1);
        if (i === steps.length - 1) {
          onComplete?.();
        }
      }, 600 + i * 800));
    });

    return () => timers.forEach(clearTimeout);
  }, [steps, onComplete]);

  const allDone = revealed >= steps.length;

  return (
    <div className="space-y-1">
      {steps.map((step, i) => {
        const isRevealed = i < revealed;
        const isRunning = i === revealed - 1 && !isDone(step);
        const displayStatus = isRunning ? "running" : isRevealed ? step.status : "pending";

        return (
          <div
            key={step.id}
            className={`
              flex items-center gap-3 px-3 py-2.5 text-[11px]
              border-l-2 transition-all duration-500
              ${displayStatus === "pending" ? "border-l-[#262626] opacity-30" : ""}
              ${displayStatus === "running" ? "border-l-[#d29922] bg-[#d29922]/[0.03]" : ""}
              ${displayStatus === "pass" ? "border-l-[#3fb950] bg-[#3fb950]/[0.03]" : ""}
              ${displayStatus === "fail" ? "border-l-[#f85149] bg-[#f85149]/[0.03]" : ""}
              ${displayStatus === "skipped" ? "border-l-[#636363] bg-white/[0.01]" : ""}
            `}
            style={{
              transitionDelay: `${i * 50}ms`,
            }}
          >
            {/* Step badge */}
            <span
              className="font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0"
              style={{
                background: `${stepColor(displayStatus)}15`,
                color: stepColor(displayStatus),
                border: `1px solid ${stepColor(displayStatus)}30`,
              }}
            >
              {step.id}
            </span>

            {/* Label + description */}
            <div className="flex-1 min-w-0">
              <div
                className="font-medium truncate"
                style={{ color: displayStatus === "pending" ? "#444" : "#ccc" }}
              >
                {step.label}
              </div>
              {isRevealed && (
                <div className="text-[10px] text-white/30 mt-0.5 leading-relaxed">
                  {displayStatus === "skipped" ? (
                    <span className="text-white/20 italic">{step.detail}</span>
                  ) : displayStatus === "fail" ? (
                    <span className="text-[#f85149]/70">{step.error || step.detail}</span>
                  ) : (
                    step.description
                  )}
                </div>
              )}
            </div>

            {/* Status icon */}
            <span
              className="text-[13px] shrink-0"
              style={{
                color: stepColor(displayStatus),
                animation: displayStatus === "running" ? "pulse 1s ease-in-out infinite" : "none",
              }}
            >
              {stepIcon(displayStatus)}
            </span>
          </div>
        );
      })}

      {/* Overall verdict */}
      {allDone && (
        <div className="mt-3 pt-3 border-t border-white/10 text-center">
          {steps.filter(s => s.status === "fail").length === 0 ? (
            <div className="text-[#3fb950] text-[13px] tracking-[0.15em]">
              ✓ ALL CHECKS PASSED
            </div>
          ) : (
            <div className="text-[#f85149] text-[13px] tracking-[0.15em]">
              ✗ VERIFICATION FAILED
            </div>
          )}
          <div className="text-[10px] text-white/20 mt-1">
            {steps.filter(s => s.status === "pass").length} passed ·{" "}
            {steps.filter(s => s.status === "skipped").length} skipped ·{" "}
            {steps.filter(s => s.status === "fail").length} failed
          </div>
        </div>
      )}
    </div>
  );
}

function isDone(step: VerificationStep): boolean {
  return step.status === "pass" || step.status === "fail" || step.status === "skipped";
}
