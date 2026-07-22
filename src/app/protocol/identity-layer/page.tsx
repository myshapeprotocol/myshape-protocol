import type { Metadata } from "next";
import IdentityLayerClient from "./IdentityLayerClient";

export const metadata: Metadata = {
  title: "Identity Layer — MyShape Protocol",
  description: "The identity architecture of the Continuity Protocol. Biological sovereignty, kinematic privacy, motion-presence protocol layer.",
};

export default function Page() {
  return <IdentityLayerClient />;
}
