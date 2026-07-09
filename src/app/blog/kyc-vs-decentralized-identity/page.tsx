import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "KYC vs Decentralized Identity — Why Document Verification Is Not Sovereignty",
  description: "KYC is broken. Decentralized identity offers an alternative. Here's why document verification fails at scale, how SSI solves the problem, and what the regulatory landscape looks like in 2026.",
  keywords: ["KYC vs decentralized identity","KYC problems","document verification","SSI KYC","self-sovereign identity regulation","eIDAS","MyShape Protocol"],
  alternates: { canonical: "https://www.myshape.com/blog/kyc-vs-decentralized-identity" },
  openGraph: { title: "KYC vs Decentralized Identity", description: "Why document verification is broken and how SSI solves it.", url: "https://www.myshape.com/blog/kyc-vs-decentralized-identity", siteName: "MyShape Protocol", type: "article", publishedTime: "2026-07-03", authors: ["MyShape Protocol"], tags: ["KYC","SSI","regulation","identity"] },
  twitter: { card: "summary_large_image", title: "KYC vs Decentralized Identity", description: "Why document verification fails at scale.", images: ["/blog/og?title=KYC%20vs%20Decentralized%20Identity%20%E2%80%94%20Why%20Document%20Verification%20Is%20Not%20Sovereignty"] },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd headline="KYC vs Decentralized Identity — Why Document Verification Is Not Sovereignty" description="KYC is broken. Here's why document verification fails at scale, how SSI solves it, and the 2026 regulatory landscape." url="https://www.myshape.com/blog/kyc-vs-decentralized-identity" datePublished="2026-07-03" authorName="MyShape Protocol" articleType="BlogPosting" tags={["KYC","SSI","regulation","identity"]} />
      <BreadcrumbList items={[{ name: "Home", href: "/" }, { name: "Protocol Log", href: "/blog" }, { name: "KYC vs Decentralized Identity" }]} />
      <PostClient />
    </>
  );
}
