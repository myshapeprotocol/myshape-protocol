import type { Metadata } from "next";
import PapersClient from "./PapersClient";

export const metadata: Metadata = {
  title: "MyShape Papers — Technical Research & Whitepapers",
  description: "Academic research papers on motion-geometry identity, ZK-SNARK verification, and post-account civilization theory.",
};

export default function PapersPage() {
  return <PapersClient />;
}
