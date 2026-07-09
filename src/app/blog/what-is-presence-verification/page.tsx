import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "What Is Presence Verification? The History and Future of Proving Someone Is Really There",
  description: "From wax seals to CAPTCHAs to motion-signature: the 500-year history of presence verification, and why 2026 marks the transition from 'prove you know something' to 'prove you are someone.'",
  keywords: ["presence verification","proof of presence","liveness detection","motion verification","anti-spoofing","MyShape Protocol"],
  alternates: { canonical: "https://www.myshape.com/blog/what-is-presence-verification" },
  openGraph: { title: "What Is Presence Verification?", description: "The 500-year history of proving someone is really there.", url: "https://www.myshape.com/blog/what-is-presence-verification", siteName: "MyShape Protocol", type: "article", publishedTime: "2026-07-03", authors: ["MyShape Protocol"], tags: ["presence","verification","history","motion"] },
  twitter: { card: "summary_large_image", title: "What Is Presence Verification?", description: "From wax seals to motion-signature.", images: ["/blog/og?title=What%20Is%20Presence%20Verification%3F%20The%20History%20and%20Future%20of%20Proving%20Someone%20Is%20Really%20There"] },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd headline="What Is Presence Verification? The History and Future of Proving Someone Is Really There" description="From wax seals to CAPTCHAs to motion-signature: the 500-year history of presence verification." url="https://www.myshape.com/blog/what-is-presence-verification" datePublished="2026-07-03" authorName="MyShape Protocol" articleType="BlogPosting" tags={["presence","verification","history","motion"]} />
      <BreadcrumbList items={[{ name: "Home", href: "/" }, { name: "Protocol Log", href: "/blog" }, { name: "What Is Presence Verification?" }]} />
      <PostClient />
    </>
  );
}
