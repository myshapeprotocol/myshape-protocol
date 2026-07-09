import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "Self-Sovereign Identity Explained — What SSI Actually Means in 2026",
  description:
    "Self-Sovereign Identity (SSI) promises that you own your digital identity — not Google, not Meta, not the government. Here's what SSI actually delivers in 2026, what it doesn't, and what comes next.",
  keywords: [
    "self-sovereign identity",
    "SSI explained",
    "decentralized identity",
    "DID",
    "verifiable credentials",
    "sovereign identity",
    "digital identity 2026",
    "MyShape Protocol",
  ],
  alternates: { canonical: "https://www.myshape.com/blog/self-sovereign-identity-explained-2026" },
  openGraph: {
    title: "Self-Sovereign Identity Explained — What SSI Actually Means in 2026",
    description: "SSI promises you own your identity. Here's what it delivers, what it doesn't, and what comes next.",
    url: "https://www.myshape.com/blog/self-sovereign-identity-explained-2026",
    siteName: "MyShape Protocol",
    type: "article",
    publishedTime: "2026-07-03",
    authors: ["MyShape Protocol"],
    tags: ["SSI", "self-sovereign-identity", "DID", "verifiable-credentials", "identity"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Self-Sovereign Identity Explained",
    description: "What SSI actually delivers in 2026 — and what comes next.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd headline="Self-Sovereign Identity Explained — What SSI Actually Means in 2026" description="A practical guide to SSI in 2026, covering the ten principles, what's working, what's broken, and why proof of continuity is the next evolution." url="https://www.myshape.com/blog/self-sovereign-identity-explained-2026" datePublished="2026-07-03" authorName="MyShape Protocol" articleType="BlogPosting" tags={["SSI", "self-sovereign-identity", "DID", "verifiable-credentials", "identity"]} />
      <BreadcrumbList items={[{ name: "Home", href: "/" }, { name: "Protocol Log", href: "/blog" }, { name: "Self-Sovereign Identity Explained" }]} />
      <PostClient />
    </>
  );
}
