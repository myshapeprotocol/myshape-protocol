import type { Metadata } from "next";
import BlogClient from "./BlogClient";

export const metadata: Metadata = {
  title: "Protocol Log — MyShape Genesis Archive",
  description:
    "Technical essays on sovereign identity, presence verification, and the protocol layer for verifiable digital continuity.",
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
    description: "Essays on sovereign identity, presence verification, and verifiable digital continuity.",
    images: ["/og-image.png"],
  },
};

export default function BlogPage() {
  return <BlogClient />;
}
