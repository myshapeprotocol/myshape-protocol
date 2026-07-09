import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "What Is Proof of Continuity? The Missing Primitive for the Agent Economy",
  description:
    "Proof of Continuity is the cryptographic verification that a digital subject has maintained unbroken sovereignty across time. It answers what identity cannot: are you still you?",
  keywords: [
    "proof of continuity",
    "continuity protocol",
    "agent identity verification",
    "digital continuity",
    "motion-signature",
    "MyShape Protocol",
    "AI agent identity",
    "verifiable continuity",
  ],
  alternates: {
    canonical: "https://www.myshape.com/blog/what-is-proof-of-continuity",
  },
  openGraph: {
    title: "What Is Proof of Continuity? The Missing Primitive for the Agent Economy",
    description:
      "Proof of Continuity verifies the trajectory of a subject across time. It is the missing cryptographic primitive that the Agent Economy has been waiting for.",
    url: "https://www.myshape.com/blog/what-is-proof-of-continuity",
    siteName: "MyShape Protocol",
    type: "article",
    publishedTime: "2026-07-03",
    authors: ["MyShape Protocol"],
    tags: ["proof-of-continuity", "agent-economy", "identity", "protocol", "motion-signature"],
  },
  twitter: {
    card: "summary_large_image",
    title: "What Is Proof of Continuity?",
    description:
      "The missing cryptographic primitive for the Agent Economy. Why identity is not enough — and what comes next.",
    images: ["/blog/og?title=What%20Is%20Proof%20of%20Continuity%3F%20The%20Missing%20Primitive%20for%20the%20Agent%20Economy"],
  },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd
        headline="What Is Proof of Continuity? The Missing Primitive for the Agent Economy"
        description="Proof of Continuity is the cryptographic verification that a digital subject has maintained unbroken sovereignty across time. It answers the question that identity protocols cannot: are you still you?"
        url="https://www.myshape.com/blog/what-is-proof-of-continuity"
        datePublished="2026-07-03"
        authorName="MyShape Protocol"
        articleType="BlogPosting"
        tags={["proof-of-continuity", "agent-economy", "identity", "protocol", "motion-signature"]}
      />
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Protocol Log", href: "/blog" },
          { name: "What Is Proof of Continuity?" },
        ]}
      />
      <PostClient />
    </>
  );
}
