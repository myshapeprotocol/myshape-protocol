import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "Sybil Resistance Explained — Why One Person One Vote Is Hard Online",
  description: "Sybil attacks are the fundamental problem of online identity. How do you prevent one person from creating a thousand fake accounts? From CAPTCHAs to Proof of Personhood — every approach ranked.",
  keywords: ["Sybil resistance","Sybil attack","proof of personhood","one person one vote","anti-Sybil","DAO voting","airdrop protection","MyShape Protocol"],
  alternates: { canonical: "https://www.myshape.com/blog/sybil-resistance-explained" },
  openGraph: { title: "Sybil Resistance Explained", description: "Why one person one vote is hard online — and every approach to solving it.", url: "https://www.myshape.com/blog/sybil-resistance-explained", siteName: "MyShape Protocol", type: "article", publishedTime: "2026-07-03", authors: ["MyShape Protocol"], tags: ["Sybil","PoP","voting","DAO"] },
  twitter: { card: "summary_large_image", title: "Sybil Resistance Explained", description: "The fundamental problem of online identity.", images: ["/og-image.png"] },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd headline="Sybil Resistance Explained — Why One Person One Vote Is Hard Online" description="From CAPTCHAs to Proof of Personhood — every approach to preventing Sybil attacks, ranked." url="https://www.myshape.com/blog/sybil-resistance-explained" datePublished="2026-07-03" authorName="MyShape Protocol" articleType="BlogPosting" tags={["Sybil","PoP","voting","DAO"]} />
      <BreadcrumbList items={[{ name: "Home", href: "/" }, { name: "Protocol Log", href: "/blog" }, { name: "Sybil Resistance Explained" }]} />
      <PostClient />
    </>
  );
}
