import type { Metadata } from "next";
import PaperCoreProtocolClient from "@/app/civ-layer/papers/core-protocol/PaperCoreProtocolClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "MyShape PAPER_01 — A Geometric Approach to Decoupled Digital Identity",
  description:
    "Full whitepaper introducing MyShape Protocol, a geometric identity framework derived from biological motion geometry and zero-knowledge proofs.",
  alternates: { canonical: "https://www.myshape.com/papers/core-protocol" },
  openGraph: {
    title: "MyShape PAPER_01 — A Geometric Approach to Decoupled Digital Identity",
    description:
      "Full whitepaper introducing MyShape Protocol, a geometric identity framework derived from biological motion geometry and zero-knowledge proofs.",
    url: "https://www.myshape.com/papers/core-protocol",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "article",
    publishedTime: "2026-06-15",
    authors: ["MyShape Protocol"],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape PAPER_01 — A Geometric Approach to Decoupled Digital Identity",
    description:
      "Full whitepaper introducing MyShape Protocol, a geometric identity framework derived from biological motion geometry and zero-knowledge proofs.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Papers", href: "/papers" },
          { name: "Core Protocol" },
        ]}
      />
      <ArticleJsonLd
        headline="A Geometric Approach to Decoupled Digital Identity"
        description="Full whitepaper introducing MyShape Protocol, a geometric identity framework derived from biological motion geometry and zero-knowledge proofs."
        url="https://www.myshape.com/papers/core-protocol"
        datePublished="2026-06-15"
        authorName="MyShape Protocol"
        articleType="Article"
        tags={["motion-geometry", "zero-knowledge", "identity", "protocol", "whitepaper"]}
      />
      <PaperCoreProtocolClient />
    </>
  );
}
