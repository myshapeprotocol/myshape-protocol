import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "The Post-Biometric Era — Why 2026 Is the Year We Stop Scanning Faces",
  description:
    "Biometrics were supposed to make identity secure. Instead they created the largest unchangeable password database in history — one that is now compromised. The post-biometric era begins now, with motion as the new primitive.",
  keywords: [
    "post-biometric identity",
    "biometrics broken",
    "motion-based authentication",
    "biometric security problems",
    "deepfake identity theft",
    "post-biometric era",
    "MyShape Protocol",
  ],
  alternates: { canonical: "https://www.myshape.com/blog/the-post-biometric-era-2026" },
  openGraph: {
    title: "The Post-Biometric Era — Why 2026 Is the Year We Stop Scanning Faces",
    description: "Biometrics created the largest unchangeable password database in history. The post-biometric era begins now.",
    url: "https://www.myshape.com/blog/the-post-biometric-era-2026",
    siteName: "MyShape Protocol",
    type: "article",
    publishedTime: "2026-07-03",
    authors: ["MyShape Protocol"],
    tags: ["post-biometric", "biometrics", "identity", "motion", "security"],
  },
  twitter: { card: "summary_large_image", title: "The Post-Biometric Era", description: "Why we stop scanning faces in 2026.", images: ["/blog/og?title=The%20Post-Biometric%20Era%20%E2%80%94%20Why%202026%20Is%20the%20Year%20We%20Stop%20Scanning%20Faces"] },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd headline="The Post-Biometric Era — Why 2026 Is the Year We Stop Scanning Faces" description="Biometrics were supposed to make identity secure. They created the largest unchangeable password database in history. The post-biometric era begins with motion as the new primitive." url="https://www.myshape.com/blog/the-post-biometric-era-2026" datePublished="2026-07-03" authorName="MyShape Protocol" articleType="BlogPosting" tags={["post-biometric","biometrics","identity","motion","security"]} />
      <BreadcrumbList items={[{ name: "Home", href: "/" }, { name: "Protocol Log", href: "/blog" }, { name: "The Post-Biometric Era" }]} />
      <PostClient />
    </>
  );
}
