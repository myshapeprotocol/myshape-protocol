"use client";

import { playTick } from "@/utils/useAudioTick";

interface Step {
  label: string;
  variant: "dim" | "highlight" | "glow";
}

interface Props {
  steps: Step[];
  footer: string;
}

export default function PipelineBar({ steps, footer }: Props) {
  const variantClass = (v: Step["variant"]) => {
    if (v === "highlight") return "il-pipeline-step il-step-highlight";
    if (v === "glow") return "il-pipeline-step il-step-glow";
    return "il-pipeline-step";
  };

  return (
    <section className="il-pipeline">
      <div className="il-pipeline-label">Identity Pipeline</div>
      <div className="il-pipeline-steps">
        {steps.map((step, i) => (
          <span key={step.label}>
            {i > 0 && <span className="il-pipeline-arrow">→</span>}
            <span
              className={variantClass(step.variant)}
              onMouseEnter={() => playTick(400, "sine", 0.04, 0.008)}
            >
              {step.label}
            </span>
          </span>
        ))}
      </div>
      <p className="il-pipeline-footer">{footer}</p>
    </section>
  );
}
