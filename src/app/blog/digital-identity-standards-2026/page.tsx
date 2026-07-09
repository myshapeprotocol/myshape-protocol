import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "Digital Identity Standards 2026 — W3C, ISO, IETF, and What They Mean",
  description: "A complete map of digital identity standards in 2026: W3C DID Core, VC Data Model, ISO 18013-5 (mDL), IETF SATP, eIDAS 2.0, and how they fit together.",
  keywords: ["digital identity standards","W3C DID","VC Data Model","ISO 18013","eIDAS 2.0","IETF SATP","identity standards 2026","MyShape Protocol"],
  alternates: { canonical: "https://www.myshape.com/blog/digital-identity-standards-2026" },
  openGraph: { title: "Digital Identity Standards 2026", description: "W3C, ISO, IETF, eIDAS — the complete map.", url: "https://www.myshape.com/blog/digital-identity-standards-2026", siteName: "MyShape Protocol", type: "article", publishedTime: "2026-07-03", authors: ["MyShape Protocol"], tags: ["standards","W3C","ISO","IETF","eIDAS"] },
  twitter: { card: "summary_large_image", title: "Digital Identity Standards 2026", description: "The complete map of identity standards.", images: ["/og-image.png"] },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd headline="Digital Identity Standards 2026 — W3C, ISO, IETF, eIDAS" description="A complete map of digital identity standards in 2026 and how they fit together." url="https://www.myshape.com/blog/digital-identity-standards-2026" datePublished="2026-07-03" authorName="MyShape Protocol" articleType="BlogPosting" tags={["standards","W3C","ISO","IETF","eIDAS"]} />
      <BreadcrumbList items={[{ name: "Home", href: "/" }, { name: "Protocol Log", href: "/blog" }, { name: "Digital Identity Standards 2026" }]} />
      <PostClient />
    </>
  );
}
