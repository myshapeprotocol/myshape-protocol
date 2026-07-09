import type { Metadata } from "next";
import PostClient from "./PostClient";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "AI Agent Identity — How Autonomous Agents Prove Who They Are in 2026",
  description:
    "As AI agents execute transactions, vote in DAOs, and manage digital assets autonomously, a new problem emerges: how does an agent prove its identity — and its continuity — without a human behind every action?",
  keywords: [
    "AI agent identity",
    "autonomous agent authentication",
    "agent identity protocol",
    "AI agent verification",
    "agent economy identity",
    "decentralized AI identity",
    "MyShape Protocol",
  ],
  alternates: {
    canonical: "https://www.myshape.com/blog/ai-agent-identity-how-autonomous-agents-prove-who-they-are",
  },
  openGraph: {
    title: "AI Agent Identity — How Autonomous Agents Prove Who They Are",
    description:
      "As AI agents become autonomous economic actors, how do they prove identity and continuity?",
    url: "https://www.myshape.com/blog/ai-agent-identity-how-autonomous-agents-prove-who-they-are",
    siteName: "MyShape Protocol",
    type: "article",
    publishedTime: "2026-07-03",
    authors: ["MyShape Protocol"],
    tags: ["AI-agents", "agent-identity", "autonomous-agents", "agent-economy", "identity"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Agent Identity — How Autonomous Agents Prove Who They Are",
    description:
      "The identity problem for autonomous AI agents — and how MyShape solves it.",
    images: ["/blog/og?title=AI%20Agent%20Identity%20%E2%80%94%20How%20Autonomous%20Agents%20Prove%20Who%20They%20Are%20in%202026"],
  },
};

export default function Page() {
  return (
    <>
      <ArticleJsonLd
        headline="AI Agent Identity — How Autonomous Agents Prove Who They Are in 2026"
        description="As AI agents execute transactions, vote in DAOs, and manage digital assets autonomously, a new problem emerges: how does an agent prove its identity — and its continuity — without a human behind every action?"
        url="https://www.myshape.com/blog/ai-agent-identity-how-autonomous-agents-prove-who-they-are"
        datePublished="2026-07-03"
        authorName="MyShape Protocol"
        articleType="BlogPosting"
        tags={["AI-agents", "agent-identity", "autonomous-agents", "agent-economy", "identity"]}
      />
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Protocol Log", href: "/blog" },
          { name: "AI Agent Identity" },
        ]}
      />
      <PostClient />
    </>
  );
}
