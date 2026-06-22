import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "MyShape — The Sovereign 3D Identity Layer for the Decentralized Human",
  description:
    "Verify human presence, not identity. Motion → Identity Vector → Zero-Knowledge Proof. The decentralized protocol for verifiable human-AI existence.",
  openGraph: {
    title: "MyShape Protocol — Identity for the AI-Native Future",
    description:
      "A new identity standard built on data-body architecture, halo scan, particle aesthetics, and zero-knowledge sovereignty. Enter the Genesis era.",
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
    title: "MyShape Protocol — AI-Native Identity",
    description:
      "Verify human presence, not identity. Motion → Identity Vector → Zero-Knowledge Proof.",
    images: ["/identity-sigil.jpg"],
  },
};

export default function HomePage() {
  return <HomeClient />;
}
