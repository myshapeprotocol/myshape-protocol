import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "What Is a DID? Decentralized Identifiers Explained Simply",
  description: "Decentralized Identifiers (DIDs) are the foundation of self-sovereign identity. Learn how DIDs work, the different DID methods, and why they matter for Web3 identity.",
  keywords: ["DID","decentralized identifier","DID explained","did:ethr","did:key","W3C DID","self-sovereign identity","MyShape Protocol"],
  alternates: { canonical: "https://www.myshape.com/blog/what-is-did-decentralized-identifiers" },
  openGraph: { title: "What Is a DID? Decentralized Identifiers Explained", description: "The foundation of self-sovereign identity. How DIDs work and why they matter.", url: "https://www.myshape.com/blog/what-is-did-decentralized-identifiers", siteName: "MyShape Protocol", type: "article", publishedTime: "2026-07-03", authors: ["MyShape Protocol"], tags: ["DID","identity","SSI","Web3"] },
  twitter: { card: "summary_large_image", title: "What Is a DID?", description: "The foundation of self-sovereign identity, explained.", images: ["/blog/og?title=What%20Is%20a%20DID%3F%20Decentralized%20Identifiers%20Explained%20Simply"] },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd headline="What Is a DID? Decentralized Identifiers Explained Simply" description="Decentralized Identifiers are the foundation of self-sovereign identity. Learn how DIDs work, the different DID methods, and why they matter." url="https://www.myshape.com/blog/what-is-did-decentralized-identifiers" datePublished="2026-07-03" authorName="MyShape Protocol" articleType="BlogPosting" tags={["DID","identity","SSI","Web3"]} />
      <BreadcrumbList items={[{ name: "Home", href: "/" }, { name: "Protocol Log", href: "/blog" }, { name: "What Is a DID?" }]} />
      <PostClient />
    </>
  );
}
