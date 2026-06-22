import type { Metadata } from "next";
import ArchitectureClient from "./ArchitectureClient";

export const metadata: Metadata = {
  title: "MyShape Architecture — Protocol Design",
  description: "Human Motion → Behavior Encoding → Identity Vector → Proof Engine → Agent Identity → Presence Layer. The complete MyShape Protocol architecture.",
  openGraph: {
    title: "MyShape Architecture — Protocol Design",
    description: "Human Motion → Behavior Encoding → Identity Vector → Proof Engine → Agent Identity → Presence Layer.",
    url: "https://www.myshape.com/architecture",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Architecture — Protocol Design",
    description: "Human Motion → Behavior Encoding → Identity Vector → Proof Engine → Agent Identity → Presence Layer.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <ArchitectureClient />;
}
