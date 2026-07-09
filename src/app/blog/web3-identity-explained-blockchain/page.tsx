import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "Web3 Identity Explained — What Blockchain Changes About Who You Are Online",
  description: "Web3 isn't just about money. It's about identity — sovereign, portable, and verifiable without intermediaries. How blockchain transforms digital identity from a database record into a cryptographic primitive.",
  keywords: ["Web3 identity","blockchain identity","crypto identity","decentralized identity Web3","on-chain identity","sovereign identity blockchain","MyShape Protocol"],
  alternates: { canonical: "https://www.myshape.com/blog/web3-identity-explained-blockchain" },
  openGraph: { title: "Web3 Identity Explained — What Blockchain Changes About Identity", description: "How blockchain transforms identity from a database record into a cryptographic primitive.", url: "https://www.myshape.com/blog/web3-identity-explained-blockchain", siteName: "MyShape Protocol", type: "article", publishedTime: "2026-07-03", authors: ["MyShape Protocol"], tags: ["Web3","blockchain","identity","crypto","sovereign"] },
  twitter: { card: "summary_large_image", title: "Web3 Identity Explained", description: "What blockchain changes about who you are online.", images: ["/blog/og?title=Web3%20Identity%20Explained%20%E2%80%94%20What%20Blockchain%20Changes%20About%20Who%20You%20Are%20Online"] },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd headline="Web3 Identity Explained — What Blockchain Changes About Who You Are Online" description="Web3 isn't just about money. It's about identity — sovereign, portable, verifiable without intermediaries." url="https://www.myshape.com/blog/web3-identity-explained-blockchain" datePublished="2026-07-03" authorName="MyShape Protocol" articleType="BlogPosting" tags={["Web3","blockchain","identity","crypto","sovereign"]} />
      <BreadcrumbList items={[{ name: "Home", href: "/" }, { name: "Protocol Log", href: "/blog" }, { name: "Web3 Identity Explained" }]} />
      <PostClient />
    </>
  );
}
