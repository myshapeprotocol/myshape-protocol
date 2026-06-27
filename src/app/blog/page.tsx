import type { Metadata } from "next";
import BlogClient from "./BlogClient";

export const metadata: Metadata = {
  title: "AI Cannot Forge Human Motion — MyShape Protocol",
  description:
    "We proved it. Here is the evidence. A Rust engine that detects AI-generated human motion with a 0.3960 Human—AI gap. Open source.",
  openGraph: {
    title: "AI Cannot Forge Human Motion — We Proved It",
    description:
      "GPT-5 and DeepSeek both failed. Our engine proves AI cannot generate human motion — 0.3960 Human—AI gap.",
    url: "https://www.myshape.com/blog",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Cannot Forge Human Motion — We Proved It",
    description: "GPT-5 and DeepSeek both failed. 0.3960 Human—AI gap. Here is the evidence.",
    images: ["/og-image.png"],
  },
};

export default function BlogPage() {
  return <BlogClient />;
}
