import type { Metadata } from "next";
import IdentityLayer from "./IdentityLayerClient";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "MyShape Identity Layer — Sovereign by Design",
  description:
    "The MyShape identity layer — local generation, selective expression, zero-knowledge verification.",
  alternates: {
    canonical: "https://www.myshape.com/protocol/identity-layer",
  },
  keywords: [
    "identity layer",
    "sovereign identity",
    "zero-knowledge",
    "data-body",
    "MyShape Protocol",
  ],
  openGraph: {
    title: "MyShape Identity Layer — Sovereign by Design",
    description:
      "The MyShape identity layer — local generation, selective expression, zero-knowledge verification.",
    url: "https://www.myshape.com/protocol/identity-layer",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Identity Layer — Sovereign by Design",
    description:
      "The MyShape identity layer — local generation, selective expression, zero-knowledge verification.",
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
          { name: "Identity Layer" },
        ]}
      />
      {/* JSON-LD: TechArticle for the identity layer */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "@id":
              "https://www.myshape.com/protocol/identity-layer/#webpage",
            url: "https://www.myshape.com/protocol/identity-layer",
            name: "MyShape Identity Layer — Sovereign by Design",
            description:
              "The MyShape identity layer — local generation, selective expression, zero-knowledge verification. Biological sovereignty, kinematic privacy, and ZK-presence form the foundation of sovereign digital identity.",
            isPartOf: {
              "@type": "WebSite",
              "@id": "https://www.myshape.com/#website",
              name: "MyShape Protocol",
              url: "https://www.myshape.com",
            },
            about: {
              "@type": "Thing",
              name: "Identity Layer",
              description:
                "A sovereign identity architecture where motion becomes a cryptographic identity vector through zero-knowledge proofs, enabling verifiable human presence without traditional identity recognition.",
            },
          }),
        }}
      />
      <IdentityLayer />
    </>
  );
}
