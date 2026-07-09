import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "Motion-Based Authentication vs Biometrics — Why Your Face Is Not a Password",
  description:
    "Static biometrics (face, fingerprint, iris) are fundamentally broken as authentication factors. Motion-based authentication offers a post-biometric alternative that is generative, non-replayable, and privacy-preserving.",
  keywords: [
    "motion-based authentication",
    "biometrics vs motion",
    "post-biometric identity",
    "why biometrics fail",
    "motion-signature verification",
    "biometric security problems",
    "passwordless authentication alternatives",
    "MyShape Protocol",
  ],
  alternates: {
    canonical:
      "https://www.myshape.com/blog/motion-vs-biometrics-why-your-face-is-not-a-password",
  },
  openGraph: {
    title: "Motion-Based Authentication vs Biometrics — Why Your Face Is Not a Password",
    description:
      "Biometrics are static, irreplaceable, and increasingly vulnerable to AI. Here's why motion is the future of authentication.",
    url: "https://www.myshape.com/blog/motion-vs-biometrics-why-your-face-is-not-a-password",
    siteName: "MyShape Protocol",
    type: "article",
    publishedTime: "2026-07-03",
    authors: ["MyShape Protocol"],
    tags: ["motion", "biometrics", "authentication", "security", "post-biometric"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Motion-Based Authentication vs Biometrics",
    description:
      "Your face is not a password. Here's why motion is the future of authentication.",
    images: ["/blog/og?title=Motion-Based%20Authentication%20vs%20Biometrics%20%E2%80%94%20Why%20Your%20Face%20Is%20Not%20a%20Password"],
  },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd
        headline="Motion-Based Authentication vs Biometrics — Why Your Face Is Not a Password"
        description="Static biometrics (face, fingerprint, iris) are fundamentally broken as authentication factors. Motion-based authentication offers a post-biometric alternative that is generative, non-replayable, and privacy-preserving."
        url="https://www.myshape.com/blog/motion-vs-biometrics-why-your-face-is-not-a-password"
        datePublished="2026-07-03"
        authorName="MyShape Protocol"
        articleType="BlogPosting"
        tags={["motion", "biometrics", "authentication", "security", "post-biometric"]}
      />
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Protocol Log", href: "/blog" },
          { name: "Motion vs Biometrics" },
        ]}
      />
      <PostClient />
    </>
  );
}
