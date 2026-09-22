import type { Metadata } from "next";
import ChallengeClient from "./ChallengeClient";

export const metadata: Metadata = {
  title: "EE-003 · Challenge-Response — MyShape Protocol",
  description:
    "Active continuity verification: random directional challenge with IMU response analysis. Evidence Engine #3 — interactive motion proof.",
};

export default function Page() {
  return <ChallengeClient />;
}
