import type { Metadata } from "next";
import Client from "@/app/civ-layer/papers/protocol-architecture/Client";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "MyShape PAPER_06 — MyShape Protocol Architecture",
  description:
    "Five-layer protocol architecture from on-device capture to sovereign identity mesh. Design principles, modular structure, and the protocol lifecycle.",
  alternates: { canonical: "https://www.myshape.com/papers/protocol-architecture" },
  openGraph: {
    title: "MyShape PAPER_06 — MyShape Protocol Architecture",
    description:
      "Five-layer protocol architecture from on-device capture to sovereign identity mesh. Design principles, modular structure, and the protocol lifecycle.",
    url: "https://www.myshape.com/papers/protocol-architecture",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "article",
    publishedTime: "2026-06-25",
    authors: ["MyShape Protocol"],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape PAPER_06 — MyShape Protocol Architecture",
    description:
      "Five-layer protocol architecture from on-device capture to sovereign identity mesh. Design principles, modular structure, and the protocol lifecycle.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Papers", href: "/papers" },
          { name: "Protocol Architecture" },
        ]}
      />
      <ArticleJsonLd
        headline="MyShape Protocol Architecture"
        description="Five-layer protocol architecture from on-device capture to sovereign identity mesh. Design principles, modular structure, and the protocol lifecycle."
        url="https://www.myshape.com/papers/protocol-architecture"
        datePublished="2026-06-25"
        authorName="MyShape Protocol"
        articleType="Article"
        tags={["architecture", "protocol", "layers", "identity", "design"]}
      />
      <Client />
    </>
  );
}
