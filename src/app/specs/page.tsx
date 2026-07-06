import type { Metadata } from "next";
import SpecsClient from "./SpecsClient";

export const metadata: Metadata = {
  title: "Protocol Specification — MyShape",
  description:
    "Technical specification of the MyShape Protocol. PES engine, data sovereignty path, Genesis governance, and protocol evolution roadmap.",
  openGraph: {
    title: "MyShape Protocol — Technical Specification",
    description:
      "Presence Entropy Score engine, ZK-identity data path, Genesis governance rules, and protocol evolution roadmap.",
  },
};

export default function SpecsPage() {
  return <SpecsClient />;
}
