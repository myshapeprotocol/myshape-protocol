import type { Metadata } from "next";
import ProtocolClient from "./ProtocolClient";

const DESCRIPTION =
  "The five-layer protocol architecture for verifiable digital continuity, built on motion geometry and zero-knowledge verification.";

export const metadata: Metadata = {
  title: "MyShape Protocol — Architecture & Core Principles",
  description: DESCRIPTION,
  openGraph: {
    title: "MyShape Protocol — Architecture & Core Principles",
    description: DESCRIPTION,
    url: "https://www.myshape.com/protocol",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Protocol — Architecture & Core Principles",
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function ProtocolPage() {
  return <ProtocolClient />;
}
