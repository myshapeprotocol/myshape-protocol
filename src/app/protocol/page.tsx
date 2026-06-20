import type { Metadata } from "next";
import ProtocolClient from "./ProtocolClient";

export const metadata: Metadata = {
  title: "MyShape Protocol — Architecture & Core Principles",
  description: "The five-layer protocol architecture for sovereign, AI-native identity built on motion geometry and zero-knowledge verification.",
};

export default function ProtocolPage() {
  return <ProtocolClient />;
}
