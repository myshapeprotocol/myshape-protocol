import type { Metadata } from "next";
import TechSpecClient from "./TechSpecClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "MyShape Technical Specification v1 — Protocol Reference",
  description:
    "Motion Vector format, PES engine, proof system, SST topology, and reference implementation. The engineering document behind the MyShape Protocol.",
  alternates: { canonical: "https://www.myshape.com/papers/technical-spec" },
  openGraph: {
    title: "MyShape Technical Specification v1",
    description:
      "Motion Vector format, PES engine, proof system, SST topology, and reference implementation.",
    url: "https://www.myshape.com/papers/technical-spec",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "article",
    publishedTime: "2026-06-18",
    authors: ["MyShape Protocol"],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Technical Specification v1",
    description:
      "Motion Vector format, PES engine, proof system, SST topology, and reference implementation.",
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
          { name: "Technical Specification" },
        ]}
      />
      <ArticleJsonLd
        headline="MyShape Technical Specification v1 — Protocol Reference"
        description="Motion Vector format, PES engine, proof system, SST topology, and reference implementation. The engineering document behind the MyShape Protocol."
        url="https://www.myshape.com/papers/technical-spec"
        datePublished="2026-06-18"
        authorName="MyShape Protocol"
        articleType="TechArticle"
        tags={["technical-spec", "motion-vector", "PES", "proof-system", "reference"]}
      />
      <TechSpecClient />
    </>
  );
}
