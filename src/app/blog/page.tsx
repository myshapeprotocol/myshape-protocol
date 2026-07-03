import type { Metadata } from "next";
import BlogClient from "./BlogClient";

export const metadata: Metadata = {
  title: "Protocol Log — MyShape Genesis Archive",
  description:
    "Technical essays on sovereign identity, presence verification, and the protocol layer for verifiable digital continuity.",
  alternates: {
    canonical: "https://www.myshape.com/blog",
    types: {
      "application/rss+xml": "https://www.myshape.com/blog/feed.xml",
    },
  },
  openGraph: {
    title: "Protocol Log — MyShape Genesis Archive",
    description:
      "Essays on sovereign identity, presence verification, and verifiable digital continuity.",
    url: "https://www.myshape.com/blog",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Protocol Log — MyShape Genesis Archive",
    description:
      "Essays on sovereign identity, presence verification, and verifiable digital continuity.",
    images: ["/og-image.png"],
  },
};

export default function BlogPage() {
  return (
    <>
      {/* RSS auto-discovery for browsers and feed readers */}
      <link
        rel="alternate"
        type="application/rss+xml"
        title="MyShape Protocol — Protocol Log"
        href="/blog/feed.xml"
      />
      <BlogClient />
    </>
  );
}
