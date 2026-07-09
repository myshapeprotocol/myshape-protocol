import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "The Future of Digital Identity — 2027 Predictions for the Identity Layer",
  description: "By 2027, digital identity will be unrecognizable from today. SSI goes mainstream. AI agents get identity. Biometrics collapse. Continuity becomes the new primitive. Here's what's coming.",
  keywords: ["digital identity future", "identity predictions 2027", "identity layer trends", "post-biometric", "agent identity", "SSI future", "MyShape Protocol"],
  alternates: { canonical: "https://www.myshape.com/blog/digital-identity-future-2027" },
  openGraph: { title: "The Future of Digital Identity — 2027 Predictions", description: "SSI goes mainstream. AI agents get identity. Biometrics collapse. Here's what's coming.", url: "https://www.myshape.com/blog/digital-identity-future-2027", siteName: "MyShape Protocol", type: "article", publishedTime: "2026-07-03", authors: ["MyShape Protocol"], tags: ["digital-identity","future","predictions","SSI","AI-agents"] },
  twitter: { card: "summary_large_image", title: "The Future of Digital Identity — 2027", description: "SSI mainstream. AI agents. Post-biometric. The identity layer in 2027.", images: ["/blog/og?title=The%20Future%20of%20Digital%20Identity%20%E2%80%94%202027%20Predictions%20for%20the%20Identity%20Layer"] },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd headline="The Future of Digital Identity — 2027 Predictions" description="By 2027, digital identity will be unrecognizable. SSI mainstream, AI agent identity, biometrics collapse, continuity as the new primitive." url="https://www.myshape.com/blog/digital-identity-future-2027" datePublished="2026-07-03" authorName="MyShape Protocol" articleType="BlogPosting" tags={["digital-identity","future","predictions","SSI","AI-agents"]} />
      <BreadcrumbList items={[{ name: "Home", href: "/" }, { name: "Protocol Log", href: "/blog" }, { name: "Digital Identity Future 2027" }]} />
      <PostClient />
    </>
  );
}
