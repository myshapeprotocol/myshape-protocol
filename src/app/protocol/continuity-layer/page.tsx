import type { Metadata } from "next";
import ContinuityLayerClient from "./ContinuityLayerClient";

export const metadata: Metadata = {
  title: "Continuity Layer — MyShape Protocol",
  description: "The continuity architecture of the Continuity Protocol. Physical continuity, kinematic privacy, and the motion-presence protocol layer.",
  alternates: { canonical: "https://www.myshape.com/protocol/continuity-layer" },
};

export default function Page() {
  return <ContinuityLayerClient />;
}
