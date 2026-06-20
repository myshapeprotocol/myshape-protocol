import type { Metadata } from "next";
import PaperCoreProtocolClient from "./PaperCoreProtocolClient";

export const metadata: Metadata = {
  title: "MyShape PAPER_01 — A Geometric Approach to Decoupled Digital Identity",
  description: "Full whitepaper introducing MyShape Protocol, a geometric identity framework derived from biological motion geometry and zero-knowledge proofs.",
};

export default function PaperCoreProtocolPage() {
  return <PaperCoreProtocolClient />;
}
