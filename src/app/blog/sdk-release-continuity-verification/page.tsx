import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "Continuity Verification Becomes Programmable — MyShape Protocol",
  description:
    "The Continuity Lab releases @thecontinuitylab/myshape v0.2.0 — the first open SDK for programmable continuity verification. One function: verifyContinuity().",
  alternates: {
    canonical: "https://www.myshape.com/blog/sdk-release-continuity-verification",
  },
  openGraph: {
    title: "Continuity Verification Becomes Programmable",
    description:
      "The first open SDK for verifying digital continuity. npm install @thecontinuitylab/myshape.",
    url: "https://www.myshape.com/blog/sdk-release-continuity-verification",
    siteName: "MyShape Protocol",
    type: "article",
    publishedTime: "2026-07-20",
    authors: ["The Continuity Lab"],
    tags: ["sdk", "continuity", "verification", "release", "open-source"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Continuity Verification Becomes Programmable",
    description: "npm install @thecontinuitylab/myshape",
  },
};

export default function Page() {
  return (
    <>
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: "Continuity Verification Becomes Programmable" },
        ]}
      />
      <ArticleJsonLd
        headline="Continuity Verification Becomes Programmable"
        description="The Continuity Lab releases v0.2.0 — the first open SDK for programmable continuity verification."
        datePublished="2026-07-20"
        authorName="The Continuity Lab"
        url="https://www.myshape.com/blog/sdk-release-continuity-verification"
      />
      <PostClient />
    </>
  );
}
