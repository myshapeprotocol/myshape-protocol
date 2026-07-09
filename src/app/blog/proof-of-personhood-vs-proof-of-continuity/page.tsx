import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "Proof of Personhood vs Proof of Continuity — Two Different Problems, Two Different Protocols",
  description:
    "Proof of Personhood proves you are a unique human. Proof of Continuity proves you are still the same human. Why the Agent Economy needs both — and why the second is the harder problem.",
  keywords: [
    "proof of personhood",
    "proof of continuity",
    "Worldcoin vs MyShape",
    "unique human verification",
    "continuity verification",
    "PoP vs PoC",
    "agent identity",
    "MyShape Protocol",
  ],
  alternates: {
    canonical: "https://www.myshape.com/blog/proof-of-personhood-vs-proof-of-continuity",
  },
  openGraph: {
    title: "Proof of Personhood vs Proof of Continuity",
    description:
      "PoP proves uniqueness. PoC proves continuity. Why the Agent Economy needs both primitives.",
    url: "https://www.myshape.com/blog/proof-of-personhood-vs-proof-of-continuity",
    siteName: "MyShape Protocol",
    type: "article",
    publishedTime: "2026-07-03",
    authors: ["MyShape Protocol"],
    tags: ["proof-of-personhood", "proof-of-continuity", "Worldcoin", "identity", "agents"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Proof of Personhood vs Proof of Continuity",
    description:
      "One proves you are human. The other proves you are still you. Why both matter.",
    images: ["/blog/og?title=Proof%20of%20Personhood%20vs%20Proof%20of%20Continuity%20%E2%80%94%20Two%20Different%20Problems%2C%20Two%20Different%20Protocols"],
  },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd
        headline="Proof of Personhood vs Proof of Continuity — Two Different Problems, Two Different Protocols"
        description="Proof of Personhood proves you are a unique human. Proof of Continuity proves you are still the same human. Why the Agent Economy needs both primitives — and why the second is the harder problem."
        url="https://www.myshape.com/blog/proof-of-personhood-vs-proof-of-continuity"
        datePublished="2026-07-03"
        authorName="MyShape Protocol"
        articleType="BlogPosting"
        tags={["proof-of-personhood", "proof-of-continuity", "Worldcoin", "identity", "agents"]}
      />
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Protocol Log", href: "/blog" },
          { name: "Proof of Personhood vs Proof of Continuity" },
        ]}
      />
      <PostClient />
    </>
  );
}
