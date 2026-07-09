import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "GENESIS 001 — Why Identity Is Not Enough",
  description:
    "Identity proves existence. Continuity proves evolution. In the age of autonomous agents, we need protocols that verify the trajectory of a subject — not just its snapshot.",
  alternates: {
    canonical: "https://www.myshape.com/blog/genesis-001-why-identity-is-not-enough",
  },
  openGraph: {
    title: "GENESIS 001 — Why Identity Is Not Enough",
    description:
      "Identity proves existence. Continuity proves evolution. The missing protocol layer for the agent age.",
    url: "https://www.myshape.com/blog/genesis-001-why-identity-is-not-enough",
    siteName: "MyShape Protocol",
    type: "article",
    publishedTime: "2026-07-02",
    authors: ["MyShape Protocol"],
    tags: ["identity", "continuity", "agents", "protocol", "sovereign-identity"],
  },
  twitter: {
    card: "summary_large_image",
    title: "GENESIS 001 — Why Identity Is Not Enough",
    description: "Identity proves existence. Continuity proves evolution.",
    images: ["/blog/og?title=GENESIS%20001%20%E2%80%94%20Why%20Identity%20Is%20Not%20Enough"],
  },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd
        headline="Why Identity Is Not Enough"
        description="Identity proves existence. Continuity proves evolution. In the age of autonomous agents, we need protocols that verify the trajectory of a subject — not just its snapshot."
        url="https://www.myshape.com/blog/genesis-001-why-identity-is-not-enough"
        datePublished="2026-07-02"
        authorName="MyShape Protocol"
        articleType="BlogPosting"
        tags={["identity", "continuity", "agents", "protocol", "sovereign-identity"]}
      />
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Protocol Log", href: "/blog" },
          { name: "Why Identity Is Not Enough" },
        ]}
      />
      <PostClient />
    </>
  );
}
