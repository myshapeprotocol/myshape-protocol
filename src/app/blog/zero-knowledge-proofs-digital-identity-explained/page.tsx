import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "Zero-Knowledge Proofs Explained — What ZK Means for Digital Identity in 2026",
  description:
    "Zero-knowledge proofs enable verifying identity without revealing identity data. Here's how ZK works, why it matters for privacy, and how MyShape uses ZK-Presence for surveillance-free identity verification.",
  keywords: [
    "zero-knowledge proof",
    "ZK proof explained",
    "zero-knowledge identity",
    "ZK identity verification",
    "privacy-preserving identity",
    "ZK-SNARK",
    "ZK-Presence",
    "MyShape Protocol",
  ],
  alternates: {
    canonical:
      "https://www.myshape.com/blog/zero-knowledge-proofs-digital-identity-explained",
  },
  openGraph: {
    title: "Zero-Knowledge Proofs Explained — What ZK Means for Digital Identity",
    description:
      "How zero-knowledge proofs enable identity verification without surveillance. ZK-Presence and the future of privacy-first identity.",
    url: "https://www.myshape.com/blog/zero-knowledge-proofs-digital-identity-explained",
    siteName: "MyShape Protocol",
    type: "article",
    publishedTime: "2026-07-03",
    authors: ["MyShape Protocol"],
    tags: ["zero-knowledge", "ZK-proof", "identity", "privacy", "cryptography"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zero-Knowledge Proofs Explained for Digital Identity",
    description:
      "Verify identity without revealing who you are. How ZK enables privacy-first identity.",
    images: ["/blog/og?title=Zero-Knowledge%20Proofs%20Explained%20%E2%80%94%20What%20ZK%20Means%20for%20Digital%20Identity%20in%202026"],
  },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd
        headline="Zero-Knowledge Proofs Explained — What ZK Means for Digital Identity in 2026"
        description="Zero-knowledge proofs enable verifying identity without revealing identity data. Here's how ZK works, why it matters for privacy, and how MyShape uses ZK-Presence for surveillance-free identity verification."
        url="https://www.myshape.com/blog/zero-knowledge-proofs-digital-identity-explained"
        datePublished="2026-07-03"
        authorName="MyShape Protocol"
        articleType="BlogPosting"
        tags={["zero-knowledge", "ZK-proof", "identity", "privacy", "cryptography"]}
      />
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Protocol Log", href: "/blog" },
          { name: "Zero-Knowledge Proofs Explained" },
        ]}
      />
      <PostClient />
    </>
  );
}
