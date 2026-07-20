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
      "Your motion is the key. No password. No credentials. No stored data. Presence is the proof — 4-dimensional entropy scoring at 60Hz.",
  },
  {
    name: "motion",
    label: "ENTROPY",
    subtitle:
      "AI cannot forge embodied motion. The irreducible gap between biological entropy and synthetic smoothness is mathematically detectable.",
  },
  {
    name: "verification",
    label: "VERIFICATION",
    subtitle:
      "Three evidence engines. Cross-modal binding. Challenge-response. 576 experimental runs. Continuity Failure Conditions detect attacks before they succeed.",
  },
  {
    name: "mesh",
    label: "CONTINUITY",
    subtitle:
      "Hash-chained evidence receipts form a verifiable timeline. Not a snapshot. A trajectory. Proving you remain you — across time, across devices.",
  },
];

export const SCENE_DURATION = 10000;
export const FADE_MS = 600;
