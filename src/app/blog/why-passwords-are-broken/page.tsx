import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "Why Passwords Are Broken — The End of 'Something You Know'",
  description: "Passwords are the weakest link in digital security. 80% of breaches involve compromised credentials. Here's why passwords fail — and what post-password authentication looks like in 2026.",
  keywords: ["passwords broken","passwordless authentication","why passwords fail","authentication security","passkeys","biometrics vs passwords","post-password","MyShape Protocol"],
  alternates: { canonical: "https://www.myshape.com/blog/why-passwords-are-broken" },
  openGraph: { title: "Why Passwords Are Broken", description: "The end of 'something you know' — and what comes next.", url: "https://www.myshape.com/blog/why-passwords-are-broken", siteName: "MyShape Protocol", type: "article", publishedTime: "2026-07-03", authors: ["MyShape Protocol"], tags: ["passwords","security","authentication"] },
  twitter: { card: "summary_large_image", title: "Why Passwords Are Broken", description: "The end of 'something you know.'", images: ["/og-image.png"] },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd headline="Why Passwords Are Broken — The End of 'Something You Know'" description="Passwords are the weakest link in digital security. Here's why they fail and what post-password authentication looks like." url="https://www.myshape.com/blog/why-passwords-are-broken" datePublished="2026-07-03" authorName="MyShape Protocol" articleType="BlogPosting" tags={["passwords","security","authentication"]} />
      <BreadcrumbList items={[{ name: "Home", href: "/" }, { name: "Protocol Log", href: "/blog" }, { name: "Why Passwords Are Broken" }]} />
      <PostClient />
    </>
  );
}
