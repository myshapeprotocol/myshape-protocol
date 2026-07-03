import type { Metadata } from "next";
import ThreatModelClient from "./ThreatModelClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "MyShape Threat Model — Security Analysis",
  description:
    "8 attack signatures, entropy gap theorem, defense-in-depth architecture. How MyShape resists AI-generated motion, replay, imitation, and sensor attacks.",
  alternates: { canonical: "https://www.myshape.com/papers/threat-model" },
  openGraph: {
    title: "MyShape Threat Model — Security Analysis",
    description:
      "8 attack signatures, entropy gap theorem, defense-in-depth architecture.",
    url: "https://www.myshape.com/papers/threat-model",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "article",
    publishedTime: "2026-06-22",
    authors: ["MyShape Protocol"],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Threat Model — Security Analysis",
    description:
      "8 attack signatures, entropy gap theorem, defense-in-depth architecture.",
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
          { name: "Threat Model" },
        ]}
      />
      <ArticleJsonLd
        headline="MyShape Threat Model — Security Analysis"
        description="8 attack signatures, entropy gap theorem, defense-in-depth architecture. How MyShape resists AI-generated motion, replay, imitation, and sensor attacks."
        url="https://www.myshape.com/papers/threat-model"
        datePublished="2026-06-22"
        authorName="MyShape Protocol"
        articleType="Article"
        tags={["security", "threat-model", "entropy-gap", "defense-in-depth", "AI-attacks"]}
      />
      <ThreatModelClient />
    </>
  );
}
