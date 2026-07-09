import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "What Is a Verifiable Credential? The Complete 2026 Guide",
  description: "Verifiable Credentials (VCs) are the building blocks of self-sovereign identity. How they work, the W3C standard, selective disclosure, and why VCs matter for privacy-preserving identity.",
  keywords: ["verifiable credential","VC explained","W3C VC","selective disclosure","SSI credential","digital credential","MyShape Protocol"],
  alternates: { canonical: "https://www.myshape.com/blog/what-is-verifiable-credential" },
  openGraph: { title: "What Is a Verifiable Credential? The Complete Guide", description: "The building blocks of self-sovereign identity. How VCs work and why they matter.", url: "https://www.myshape.com/blog/what-is-verifiable-credential", siteName: "MyShape Protocol", type: "article", publishedTime: "2026-07-03", authors: ["MyShape Protocol"], tags: ["VC","SSI","W3C","credentials"] },
  twitter: { card: "summary_large_image", title: "What Is a Verifiable Credential?", description: "The building blocks of self-sovereign identity.", images: ["/blog/og?title=What%20Is%20a%20Verifiable%20Credential%3F%20The%20Complete%202026%20Guide"] },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd headline="What Is a Verifiable Credential? The Complete 2026 Guide" description="Verifiable Credentials are the building blocks of self-sovereign identity. How they work, the W3C standard, selective disclosure, and why VCs matter." url="https://www.myshape.com/blog/what-is-verifiable-credential" datePublished="2026-07-03" authorName="MyShape Protocol" articleType="BlogPosting" tags={["VC","SSI","W3C","credentials"]} />
      <BreadcrumbList items={[{ name: "Home", href: "/" }, { name: "Protocol Log", href: "/blog" }, { name: "What Is a Verifiable Credential?" }]} />
      <PostClient />
    </>
  );
}
