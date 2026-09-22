import type { Metadata } from "next";
import CausalCouplingClient from "./CausalCouplingClient";

export const metadata: Metadata = {
  title: "PE-001 · Event-Level Causal Coupling — MyShape Protocol",
  description:
    "Cross-modal causal verification: detecting whether IMU jerk peaks and video trajectory changes originate from the same physical event.",
};

export default function CausalCouplingPage() {
  return <CausalCouplingClient />;
}
