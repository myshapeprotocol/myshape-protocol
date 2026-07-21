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

const BLOG_ITEMS = [
  { title: "What Is Proof of Continuity? The Missing Primitive for the Agent Economy", url: "https://www.myshape.com/blog/what-is-proof-of-continuity", date: "2026-07-03" },
  { title: "What Is Decentralized Identity? The 2026 Guide", url: "https://www.myshape.com/blog/what-is-decentralized-identity-2026", date: "2026-07-03" },
  { title: "Continuity Verification Explained — What ZK Means for Digital Identity", url: "https://www.myshape.com/blog/zero-knowledge-proofs-digital-identity-explained", date: "2026-07-03" },
  { title: "Motion vs Biometrics — Why Your Face Is Not a Password", url: "https://www.myshape.com/blog/motion-vs-biometrics-why-your-face-is-not-a-password", date: "2026-07-03" },
  { title: "Proof of Personhood vs Proof of Continuity", url: "https://www.myshape.com/blog/proof-of-personhood-vs-proof-of-continuity", date: "2026-07-03" },
  { title: "AI Agent Identity — How Autonomous Agents Prove Who They Are", url: "https://www.myshape.com/blog/ai-agent-identity-how-autonomous-agents-prove-who-they-are", date: "2026-07-03" },
  { title: "Self-Sovereign Identity Explained — What SSI Actually Means in 2026", url: "https://www.myshape.com/blog/self-sovereign-identity-explained-2026", date: "2026-07-03" },
  { title: "The Post-Biometric Era — Why 2026 Is the Year We Stop Scanning Faces", url: "https://www.myshape.com/blog/the-post-biometric-era-2026", date: "2026-07-03" },
  { title: "Digital Identity Future 2027 — Predictions for the Identity Layer", url: "https://www.myshape.com/blog/digital-identity-future-2027", date: "2026-07-03" },
  { title: "Why Motion Is the Only Unforgeable Identity Signal", url: "https://www.myshape.com/blog/why-motion-is-the-only-unforgeable-identity-signal", date: "2026-07-03" },
  { title: "How to Verify a Human Online in 2026 — The Complete Guide", url: "https://www.myshape.com/blog/how-to-verify-human-online-2026", date: "2026-07-03" },
  { title: "Web3 Identity Explained — What Blockchain Changes About Identity", url: "https://www.myshape.com/blog/web3-identity-explained-blockchain", date: "2026-07-03" },
  { title: "What Is a DID? Decentralized Identifiers Explained", url: "https://www.myshape.com/blog/what-is-did-decentralized-identifiers", date: "2026-07-03" },
  { title: "KYC vs Decentralized Identity — Why Document Verification Is Not Sovereignty", url: "https://www.myshape.com/blog/kyc-vs-decentralized-identity", date: "2026-07-03" },
  { title: "Sybil Resistance Explained — Why One Person One Vote Is Hard Online", url: "https://www.myshape.com/blog/sybil-resistance-explained", date: "2026-07-03" },
  { title: "What Is Presence Verification? The History and Future", url: "https://www.myshape.com/blog/what-is-presence-verification", date: "2026-07-03" },
  { title: "Digital Identity Standards 2026 — W3C, ISO, IETF, eIDAS", url: "https://www.myshape.com/blog/digital-identity-standards-2026", date: "2026-07-03" },
];

export default function BlogPage() {
  return (
    <>
      {/* RSS auto-discovery */}
      <link rel="alternate" type="application/rss+xml" title="MyShape Protocol — Protocol Log" href="/blog/feed.xml" />

      {/* ItemList — Google rich results for blog listing */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "MyShape Protocol — Protocol Log",
        description: "Technical essays on sovereign identity, presence verification, and the protocol layer for verifiable digital continuity.",
        url: "https://www.myshape.com/blog",
        numberOfItems: BLOG_ITEMS.length,
        itemListElement: BLOG_ITEMS.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "BlogPosting",
            headline: item.title,
            url: item.url,
            datePublished: item.date,
            author: { "@type": "Organization", name: "MyShape Protocol" },
          },
        })),
      }) }} />

      <BlogClient />
    </>
  );
}

