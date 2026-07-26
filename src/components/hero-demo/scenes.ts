export interface SceneDef {
  name: "formation" | "motion" | "verification" | "mesh";
  label: string;
  subtitle: string;
}

export const SCENES: SceneDef[] = [
  {
    name: "formation",
    label: "PRESENCE",
    subtitle:
      "AI can generate a face in seconds. A voice in milliseconds. But a living body produces entropy patterns that no model has learned to fake. That's the signal.",
  },
  {
    name: "motion",
    label: "THE GAP",
    subtitle:
      "381 experiments. We don't ask what the data says about identity. We ask whether it looks like a body that is actually, physically here. The answer hides in the noise.",
  },
  {
    name: "verification",
    label: "VERIFICATION",
    subtitle:
      "Three independent engines. Challenge-response. Cross-modal binding. 576 runs. We're not identifying anyone. We're verifying one thing: the same entity has been continuously present.",
  },
  {
    name: "mesh",
    label: "CONTINUITY",
    subtitle:
      "Every verification produces evidence — not a yes or a no, but a receipt. Linked together, they form a chain of proof. Not who you are. That you stayed.",
  },
];

export const SCENE_DURATION = 10000;
export const FADE_MS = 600;
