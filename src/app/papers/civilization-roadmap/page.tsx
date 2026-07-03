import type { Metadata } from "next";
import Client from "@/app/civ-layer/papers/civilization-roadmap/Client";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "MyShape PAPER_10 — Civilization Roadmap",
  description:
    "Four-epoch, 20-year roadmap from geometry to civilization. The long-term vision for a world where human and AI identities coexist in one verifiable protocol.",
  alternates: { canonical: "https://www.myshape.com/papers/civilization-roadmap" },
  openGraph: {
    title: "MyShape PAPER_10 — Civilization Roadmap",
    description:
      "Four-epoch, 20-year roadmap from geometry to civilization. The long-term vision for a world where human and AI identities coexist in one verifiable protocol.",
    url: "https://www.myshape.com/papers/civilization-roadmap",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "article",
    publishedTime: "2026-06-20",
    authors: ["MyShape Protocol"],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape PAPER_10 — Civilization Roadmap",
    description:
      "Four-epoch, 20-year roadmap from geometry to civilization. The long-term vision for a world where human and AI identities coexist in one verifiable protocol.",
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
          { name: "Civilization Roadmap" },
        ]}
      />
      <ArticleJsonLd
        headline="Civilization Roadmap"
        description="Four-epoch, 20-year roadmap from geometry to civilization. The long-term vision for a world where human and AI identities coexist in one verifiable protocol."
        url="https://www.myshape.com/papers/civilization-roadmap"
        datePublished="2026-06-20"
        authorName="MyShape Protocol"
        articleType="Article"
        tags={["roadmap", "civilization", "protocol", "vision", "identity"]}
      />
      <Client />
    </>
  );
}
