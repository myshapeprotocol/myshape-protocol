import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "MyShape Protocol — The Sovereign 3D Identity Layer",
  description:
    "MyShape is the identity protocol for the AI-native era. A particle-based data-body system enabling sovereign, zero-knowledge, cross-platform identity. Body is data. Data is sovereignty.",
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
      "A particle-based identity protocol for the AI-native era. Body is data. Data is sovereignty.",
    images: ["/identity-sigil.jpg"],
  },
};

export default function HomePage() {
  return <HomeClient />;
}
