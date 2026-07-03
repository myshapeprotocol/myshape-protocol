import type { Metadata } from "next";
import ZKPage from "./ZKPageClient";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "MyShape Zero-Knowledge — Privacy by Default",
  description: "How MyShape uses zero-knowledge proofs to verify identity without exposing the individual. ZK-Presence ensures verifiability without surveillance.",
  alternates: { canonical: "https://www.myshape.com/protocol/zk" },
  keywords: ["zero-knowledge proof", "ZK identity", "privacy-preserving", "ZK-Presence", "MyShape Protocol"],
  openGraph: {
    title: "MyShape Zero-Knowledge — Privacy by Default",
    description: "How MyShape uses zero-knowledge proofs to verify identity without exposing the individual.",
    url: "https://www.myshape.com/protocol/zk",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Zero-Knowledge — Privacy by Default",
    description: "How MyShape uses zero-knowledge proofs to verify identity without exposing the individual.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Protocol", href: "/protocol" },
          { name: "Zero-Knowledge" },
        ]}
      />
      <ZKPage />
    </>
  );
}
