import type { Metadata } from "next";
import ContinuityClient from "./ContinuityClient";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "MyShape — Global Continuity Network",
  description:
    "The State Chain of Subject Evolution. Live network of verified trajectories, evolutionary entropy, and presence receipts across the MyShape Protocol. Proof of continuity in real-time.",
  keywords: [
    "continuity network",
    "state chain",
    "presence receipts",
    "subject evolution",
    "verifiable trajectory",
    "continuity proof",
    "MyShape Protocol",
  ],
  alternates: { canonical: "https://www.myshape.com/continuity" },
  openGraph: {
    title: "MyShape — Global Continuity Network",
    description:
      "Live network of verified trajectories across the MyShape Protocol. Evolutionary entropy in real-time.",
    url: "https://www.myshape.com/continuity",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape — Global Continuity Network",
    description:
      "Live network of verified trajectories across the MyShape Protocol.",
    images: ["/og-image.png"],
  },
};

export default function ContinuityPage() {
  return (
    <>
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Continuity Network" },
        ]}
      />
      {/* JSON-LD: CollectionPage for the continuity network */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": "https://www.myshape.com/continuity/#webpage",
            url: "https://www.myshape.com/continuity",
            name: "MyShape — Global Continuity Network",
            description:
              "Live network of verified trajectories across the MyShape Protocol. The State Chain of Subject Evolution — real-time presence receipts and evolutionary entropy.",
            isPartOf: {
              "@type": "WebSite",
              "@id": "https://www.myshape.com/#website",
              name: "MyShape Protocol",
              url: "https://www.myshape.com",
            },
            about: {
              "@type": "Thing",
              name: "Continuity Network",
              description:
                "A decentralized network of verified digital subject trajectories, each node representing a sovereign entity whose continuity is cryptographically proven across time.",
            },
          }),
        }}
      />
      <ContinuityClient />
    </>
  );
}
