import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "The Continuity Layer for the Simulation Age — MyShape Protocol",
  description:
    "Identity tells us who you claim to be. Continuity tells us that you are still you. Why the Simulation Age needs a new primitive — and why motion-signature is the only unforgeable anchor.",
  alternates: {
    canonical:
      "https://www.myshape.com/blog/continuity-layer-for-the-simulation-age",
  },
  openGraph: {
    title: "The Continuity Layer for the Simulation Age",
    description:
      "In a world where AI can generate your face, voice, and behavior — what proves that you continue to exist? The case for verifiable digital continuity.",
    url: "https://www.myshape.com/blog/continuity-layer-for-the-simulation-age",
    siteName: "MyShape Protocol",
    type: "article",
    publishedTime: "2026-06-29",
    authors: ["MyShape Protocol"],
    tags: ["continuity", "identity", "AI", "protocol", "agent-economy"],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Continuity Layer for the Simulation Age",
    description:
      "Identity is a snapshot. Continuity is a trajectory. MyShape makes digital continuity verifiable.",
    images: ["/blog/og?title=The%20Continuity%20Layer%20for%20the%20Simulation%20Age%20%E2%80%94%20MyShape%20Protocol"],
  },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd
        headline="The Continuity Layer for the Simulation Age"
        description="Identity tells us who you claim to be. Continuity tells us that you are still you. Why the Simulation Age needs a new primitive — and why motion-signature is the only unforgeable anchor."
        url="https://www.myshape.com/blog/continuity-layer-for-the-simulation-age"
        datePublished="2026-06-29"
        authorName="MyShape Protocol"
        articleType="BlogPosting"
        tags={["continuity", "identity", "AI", "protocol", "agent-economy"]}
      />
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Protocol Log", href: "/blog" },
          { name: "The Continuity Layer for the Simulation Age" },
        ]}
      />
      <PostClient />
    </>
  );
}
