import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "What Is Decentralized Identity? The 2026 Guide to Self-Sovereign Digital Identity",
  description:
    "A comprehensive guide to decentralized identity (DID), self-sovereign identity (SSI), verifiable credentials, and why the next evolution — proof of continuity — changes everything.",
  keywords: [
    "decentralized identity",
    "self-sovereign identity",
    "DID",
    "verifiable credentials",
    "SSI explained",
    "blockchain identity",
    "Web3 identity",
    "digital identity 2026",
    "proof of continuity",
    "MyShape Protocol",
  ],
  alternates: {
    canonical: "https://www.myshape.com/blog/what-is-decentralized-identity-2026",
  },
  openGraph: {
    title: "What Is Decentralized Identity? The 2026 Guide",
    description:
      "DID, SSI, verifiable credentials, proof of personhood, and proof of continuity — a complete guide to the decentralized identity landscape in 2026.",
    url: "https://www.myshape.com/blog/what-is-decentralized-identity-2026",
    siteName: "MyShape Protocol",
    type: "article",
    publishedTime: "2026-07-03",
    authors: ["MyShape Protocol"],
    tags: ["decentralized-identity", "SSI", "DID", "verifiable-credentials", "Web3", "blockchain"],
  },
  twitter: {
    card: "summary_large_image",
    title: "What Is Decentralized Identity? The 2026 Guide",
    description:
      "The complete guide to DID, SSI, and why proof of continuity is the next evolution.",
    images: ["/blog/og?title=What%20Is%20Decentralized%20Identity%3F%20The%202026%20Guide%20to%20Self-Sovereign%20Digital%20Identity"],
  },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd
        headline="What Is Decentralized Identity? The 2026 Guide to Self-Sovereign Digital Identity"
        description="A comprehensive guide to decentralized identity (DID), self-sovereign identity (SSI), verifiable credentials, proof of personhood, and why proof of continuity is the next evolution in digital identity."
        url="https://www.myshape.com/blog/what-is-decentralized-identity-2026"
        datePublished="2026-07-03"
        authorName="MyShape Protocol"
        articleType="BlogPosting"
        tags={["decentralized-identity", "SSI", "DID", "verifiable-credentials", "Web3", "blockchain", "proof-of-continuity"]}
      />
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Protocol Log", href: "/blog" },
          { name: "What Is Decentralized Identity?" },
        ]}
      />
      <PostClient />
    </>
  );
}
