/** Scene definitions for HeroDemo — extracted from HeroDemo.tsx. */

export interface SceneDef {
  name: "formation" | "motion" | "genesis" | "mesh";
  label: string;
  subtitle: string;
}

export const SCENES: SceneDef[] = [
  {
    name: "formation",
    label: "PRESENCE",
    subtitle:
      "Your motion is the key. No password. No physical scan. No stored data. Presence is the proof — and the proof is the identity.",
  },
  {
    name: "motion",
    label: "ENTROPY",
    subtitle:
      "AI cannot forge biological motion. The 4D entropy gap — timing, noise, frequency, perturbation — is mathematically irreducible.",
  },
  {
    name: "genesis",
    label: "SOVEREIGNTY",
    subtitle:
      "Your identity vector is yours alone. Non-invertible. Non-custodial. No platform can revoke what you generate through your own motion.",
  },
  {
    name: "mesh",
    label: "CONTINUITY",
    subtitle:
      "Human and AI identities coexist in one protocol. Presence Receipts form a continuous verifiable timeline — your identity infrastructure.",
  },
];

export const SCENE_DURATION = 10000;
export const FADE_MS = 600;
