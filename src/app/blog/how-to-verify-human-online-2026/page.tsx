import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "How to Verify a Human Online in 2026 — The Complete Guide",
  description: "From passwords to biometrics to motion-signature: every method of verifying human presence online, ranked by security, privacy, and AI-resistance. The complete guide for developers, founders, and security engineers.",
  keywords: ["verify human online","human verification","proof of personhood","liveness detection","how to verify identity","motion-signature","MyShape Protocol"],
  alternates: { canonical: "https://www.myshape.com/blog/how-to-verify-human-online-2026" },
  openGraph: { title: "How to Verify a Human Online in 2026", description: "Every method ranked by security, privacy, and AI-resistance. The complete guide.", url: "https://www.myshape.com/blog/how-to-verify-human-online-2026", siteName: "MyShape Protocol", type: "article", publishedTime: "2026-07-03", authors: ["MyShape Protocol"], tags: ["verification","human","identity","security","guide"] },
  twitter: { card: "summary_large_image", title: "How to Verify a Human Online in 2026", description: "Every method ranked. The complete guide.", images: ["/blog/og?title=How%20to%20Verify%20a%20Human%20Online%20in%202026%20%E2%80%94%20The%20Complete%20Guide"] },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd headline="How to Verify a Human Online in 2026 — The Complete Guide" description="Every method of verifying human presence online, ranked by security, privacy, and AI-resistance. From passwords to motion-signature." url="https://www.myshape.com/blog/how-to-verify-human-online-2026" datePublished="2026-07-03" authorName="MyShape Protocol" articleType="BlogPosting" tags={["verification","human","identity","security","guide"]} />
      <BreadcrumbList items={[{ name: "Home", href: "/" }, { name: "Protocol Log", href: "/blog" }, { name: "How to Verify a Human Online" }]} />
      <PostClient />
    </>
  );
}
