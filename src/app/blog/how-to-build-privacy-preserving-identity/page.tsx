import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "How to Build Privacy-Preserving Identity Systems — A 2026 Guide",
  description: "Building identity systems that protect user privacy is the defining engineering challenge of this decade. A practical guide to ZKP, selective disclosure, and sovereign architecture.",
  keywords: ["privacy-preserving identity","zero-knowledge identity","selective disclosure","sovereign identity architecture","privacy by design","identity engineering","MyShape Protocol"],
  alternates: { canonical: "https://www.myshape.com/blog/how-to-build-privacy-preserving-identity" },
  openGraph: { title: "How to Build Privacy-Preserving Identity Systems", description: "ZKP, selective disclosure, sovereign architecture — a 2026 practical guide.", url: "https://www.myshape.com/blog/how-to-build-privacy-preserving-identity", siteName: "MyShape Protocol", type: "article", publishedTime: "2026-07-03", authors: ["MyShape Protocol"], tags: ["privacy","identity","zero-knowledge"] },
  twitter: { card: "summary_large_image", title: "How to Build Privacy-Preserving Identity Systems", description: "ZKP, selective disclosure, sovereign architecture.", images: ["/og-image.png"] },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd headline="How to Build Privacy-Preserving Identity Systems — A 2026 Guide" description="Building identity systems that protect user privacy is the defining engineering challenge of this decade." url="https://www.myshape.com/blog/how-to-build-privacy-preserving-identity" datePublished="2026-07-03" authorName="MyShape Protocol" articleType="BlogPosting" tags={["privacy","identity","zero-knowledge"]} />
      <BreadcrumbList items={[{ name: "Home", href: "/" }, { name: "Protocol Log", href: "/blog" }, { name: "How to Build Privacy-Preserving Identity" }]} />
      <PostClient />
    </>
  );
}
