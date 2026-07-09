import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "Why Motion Is the Only Unforgeable Identity Signal — The Physics of Irreducible Entropy",
  description: "Passwords can be stolen. Biometrics can be replayed. Tokens can be phished. But the way you move — your micro-timing variance, your physiological tremor, your motor noise — is mathematically impossible to forge. Here's the physics behind it.",
  keywords: ["unforgeable identity", "motion physics", "entropy gap", "biological motion", "identity signal", "anti-AI verification", "MyShape Protocol"],
  alternates: { canonical: "https://www.myshape.com/blog/why-motion-is-the-only-unforgeable-identity-signal" },
  openGraph: { title: "Why Motion Is the Only Unforgeable Identity Signal", description: "The physics of irreducible entropy. Why your motion cannot be forged — mathematically.", url: "https://www.myshape.com/blog/why-motion-is-the-only-unforgeable-identity-signal", siteName: "MyShape Protocol", type: "article", publishedTime: "2026-07-03", authors: ["MyShape Protocol"], tags: ["motion","physics","entropy","identity","unforgeability"] },
  twitter: { card: "summary_large_image", title: "Why Motion Is the Only Unforgeable Identity Signal", description: "The physics of irreducible entropy. Why AI cannot forge human motion.", images: ["/blog/og?title=Why%20Motion%20Is%20the%20Only%20Unforgeable%20Identity%20Signal%20%E2%80%94%20The%20Physics%20of%20Irreducible%20Entropy"] },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd headline="Why Motion Is the Only Unforgeable Identity Signal" description="Passwords can be stolen. Biometrics can be replayed. But the way you move is mathematically impossible to forge. Here's the physics." url="https://www.myshape.com/blog/why-motion-is-the-only-unforgeable-identity-signal" datePublished="2026-07-03" authorName="MyShape Protocol" articleType="BlogPosting" tags={["motion","physics","entropy","identity","unforgeability"]} />
      <BreadcrumbList items={[{ name: "Home", href: "/" }, { name: "Protocol Log", href: "/blog" }, { name: "Why Motion Is Unforgeable" }]} />
      <PostClient />
    </>
  );
}
