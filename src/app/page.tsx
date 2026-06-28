import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "MyShape — The Continuity Layer for the Simulation Age",
  description:
    "Identity tells us who you claim to be. Continuity tells us that you are still you. Motion → Identity Vector → Continuity Proof. The decentralized protocol for verifiable digital continuity in the Agent Economy.",
  openGraph: {
    title: "MyShape Protocol — The Continuity Layer for the Simulation Age",
    description:
      "In a world where AI can generate everything — what proves that you continue to exist? MyShape verifies continuity, not identity. Motion-Signature proofs for persistent digital subjects.",
    url: "https://www.myshape.com",
    siteName: "MyShape Protocol",
    images: [
      {
        url: "/identity-sigil.jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Protocol — The Continuity Layer for the Simulation Age",
    description:
      "Identity is a snapshot. Continuity is a trajectory. MyShape makes digital continuity verifiable.",
    images: ["/identity-sigil.jpg"],
  },
};

export default function HomePage() {
  return <HomeClient />;
}
