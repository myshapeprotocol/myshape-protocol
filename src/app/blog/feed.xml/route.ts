import { type NextRequest } from "next/server";

/**
 * RSS 2.0 Feed for MyShape Protocol Blog
 *
 * Served at /blog/feed.xml
 * - Traditional SEO: RSS discovery for feed readers, Google News
 * - GEO: AI crawlers (GPTBot, Claude-Web) consume RSS for content indexing
 *
 * Post data is maintained inline until a proper CMS/headless integration exists.
 */

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
}

const POSTS: BlogPost[] = [
  {
    slug: "proof-of-personhood-vs-proof-of-continuity",
    title: "Proof of Personhood vs Proof of Continuity — Two Different Problems, Two Different Protocols",
    description:
      "Proof of Personhood proves you are a unique human. Proof of Continuity proves you are still the same human. Why the Agent Economy needs both primitives.",
    publishedAt: "2026-07-03",
    tags: ["proof-of-personhood", "proof-of-continuity", "Worldcoin", "identity", "agents"],
  },
  {
    slug: "ai-agent-identity-how-autonomous-agents-prove-who-they-are",
    title: "AI Agent Identity — How Autonomous Agents Prove Who They Are in 2026",
    description:
      "As AI agents execute transactions, vote in DAOs, and manage digital assets autonomously, how do they prove identity and continuity?",
    publishedAt: "2026-07-03",
    tags: ["AI-agents", "agent-identity", "autonomous-agents", "agent-economy", "identity"],
  },
  {
    slug: "zero-knowledge-proofs-digital-identity-explained",
    title: "Zero-Knowledge Proofs Explained — What ZK Means for Digital Identity in 2026",
    description:
      "Zero-knowledge proofs enable verifying identity without revealing identity data. How ZK works, why it matters for privacy, and how MyShape uses ZK-Presence for surveillance-free identity verification.",
    publishedAt: "2026-07-03",
    tags: ["zero-knowledge", "ZK-proof", "identity", "privacy", "cryptography"],
  },
  {
    slug: "what-is-decentralized-identity-2026",
    title: "What Is Decentralized Identity? The 2026 Guide to Self-Sovereign Digital Identity",
    description:
      "A comprehensive guide to decentralized identity (DID), self-sovereign identity (SSI), verifiable credentials, and why the next evolution — proof of continuity — changes everything.",
    publishedAt: "2026-07-03",
    tags: ["decentralized-identity", "SSI", "DID", "verifiable-credentials", "Web3", "blockchain"],
  },
  {
    slug: "what-is-proof-of-continuity",
    title: "What Is Proof of Continuity? The Missing Primitive for the Agent Economy",
    description:
      "Proof of Continuity is the cryptographic verification that a digital subject has maintained unbroken sovereignty across time. It answers what identity cannot: are you still you?",
    publishedAt: "2026-07-03",
    tags: ["proof-of-continuity", "agent-economy", "identity", "protocol", "motion-signature"],
  },
  {
    slug: "motion-vs-biometrics-why-your-face-is-not-a-password",
    title: "Motion-Based Authentication vs Biometrics — Why Your Face Is Not a Password",
    description:
      "Static biometrics (face, fingerprint, iris) are fundamentally broken as authentication factors. Motion-based authentication offers a post-biometric alternative that is generative, non-replayable, and privacy-preserving.",
    publishedAt: "2026-07-03",
    tags: ["motion", "biometrics", "authentication", "security", "post-biometric"],
  },
  {
    slug: "genesis-001-why-identity-is-not-enough",
    title: "GENESIS 001 — Why Identity Is Not Enough",
    description:
      "Identity proves existence. Continuity proves evolution. In the age of autonomous agents, we need protocols that verify the trajectory of a subject — not just its snapshot.",
    publishedAt: "2026-07-02",
    tags: ["identity", "continuity", "agents", "protocol", "sovereign-identity"],
  },
  {
    slug: "continuity-layer-for-the-simulation-age",
    title: "The Continuity Layer for the Simulation Age",
    description:
      "Identity tells us who you claim to be. Continuity tells us that you are still you. Why the Simulation Age needs a new primitive — and why motion-signature is the only unforgeable anchor.",
    publishedAt: "2026-06-29",
    tags: ["continuity", "identity", "AI", "protocol", "agent-economy"],
  },
  {
    slug: "stored-identity-vs-generated-presence",
    title: "Stored Identity vs. Generated Presence — Why Your 'Identity' Is Just a Copyable Database Record",
    description:
      "Every identity system today stores a snapshot. Snapshots can be copied. Presence cannot — because presence is not data. It is physics.",
    publishedAt: "2026-06-27",
    tags: ["identity", "presence", "AI", "protocol"],
  },
];

const BASE_URL = "https://www.myshape.com";
const SITE_TITLE = "MyShape Protocol — Protocol Log";
const SITE_DESCRIPTION =
  "Technical essays on sovereign identity, presence verification, and the protocol layer for verifiable digital continuity.";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateRss(): string {
  const items = POSTS.map(
    (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${BASE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${post.slug}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <author>protocol@myshape.com (MyShape Protocol)</author>
      ${post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join("\n")}
    </item>`
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${BASE_URL}/blog</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <generator>MyShape Protocol — Next.js App Router</generator>
    <image>
      <url>${BASE_URL}/og-image.png</url>
      <title>${escapeXml(SITE_TITLE)}</title>
      <link>${BASE_URL}/blog</link>
    </image>
${items}
  </channel>
</rss>`;
}

export async function GET(_request: NextRequest): Promise<Response> {
  const rss = generateRss();
  return new Response(rss, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      // Allow cross-origin access for feed readers
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// ISR: regenerate at most once per hour
export const revalidate = 3600;
