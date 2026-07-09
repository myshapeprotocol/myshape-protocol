import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title:
    "Stored Identity vs. Generated Presence — Why Your 'Identity' Is Just a Copyable Database Record",
  description:
    "Every identity system today stores a snapshot. Snapshots can be copied. Presence cannot — because presence is not data. It is physics.",
  alternates: {
    canonical:
      "https://www.myshape.com/blog/stored-identity-vs-generated-presence",
  },
  openGraph: {
    title: "Stored Identity vs. Generated Presence",
    description:
      "Every identity system today stores a snapshot. Snapshots can be copied. Presence cannot.",
    url: "https://www.myshape.com/blog/stored-identity-vs-generated-presence",
    siteName: "MyShape Protocol",
    type: "article",
    publishedTime: "2026-06-27",
    authors: ["MyShape Protocol"],
    tags: ["identity", "presence", "AI", "protocol"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stored Identity vs. Generated Presence",
    description:
      "Every identity system today stores a snapshot. Snapshots can be copied. Presence cannot.",
    images: ["/blog/og?title=Stored%20Identity%20vs.%20Generated%20Presence%20%E2%80%94%20Why%20Your%20'Identity'%20Is%20Just%20a%20Copyable%20Database%20Record"],
  },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd
        headline="Stored Identity vs. Generated Presence — Why Your 'Identity' Is Just a Copyable Database Record"
        description="Every identity system today stores a snapshot. Snapshots can be copied. Presence cannot — because presence is not data. It is physics."
        url="https://www.myshape.com/blog/stored-identity-vs-generated-presence"
        datePublished="2026-06-27"
        authorName="MyShape Protocol"
        articleType="BlogPosting"
        tags={["identity", "presence", "AI", "protocol"]}
      />
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Protocol Log", href: "/blog" },
          { name: "Stored Identity vs. Generated Presence" },
        ]}
      />
      <PostClient />
    </>
  );
}
