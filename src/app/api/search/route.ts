/** @experimental ZK subsystem — under active research. Not production-grade. */
import { NextResponse } from "next/server";
import { POSTS } from "@/app/blog/posts";

// Glossary subset — keep it lightweight
const GLOSSARY_TERMS = [
  "Motion-Signature", "Presence Entropy Score (PES)", "Proof of Continuity",
  "Continuity Layer", "Data-Body", "ZK-Presence", "Entropy Gap Theorem",
  "Jerk Spectrum", "Genesis Ritual", "Genesis Cohort", "Presence Receipt",
  "State-Chain Evolution", "Entropy Transformation", "Ethereal Data Energy",
  "Non-Binary Aesthetic", "Wireframe Anatomy", "Root Entropy Source",
  "Agent Economy", "Sovereign Identity", "Zero-Knowledge Proof (ZKP)",
  "SST (Skeletal Surface Topology)", "Halo Scan", "Motion Pipeline",
  "Protocol Node", "Agent Declaration", "Hurst Exponent",
  "Kinetic Verification", "Identity Mesh", "Post-Biometric Identity",
  "Physiological Tremor",
];

interface SearchResult {
  title: string;
  subtitle?: string;
  url: string;
  type: "blog" | "glossary" | "page";
}

const STATIC_PAGES: SearchResult[] = [
  { title: "Protocol Overview", url: "/protocol", type: "page" },
  { title: "Research Hub", url: "/research", type: "page" },
  { title: "Research Agenda", url: "/research/agenda", type: "page" },
  { title: "Agent Declaration", url: "/agent", type: "page" },
  { title: "Genesis", url: "/genesis", type: "page" },
  { title: "Whitepaper", url: "/whitepaper", type: "page" },
  { title: "Developers", url: "/developers", type: "page" },
  { title: "Roadmap", url: "/roadmap", type: "page" },
  { title: "Vision", url: "/vision", type: "page" },
  { title: "Glossary", url: "/glossary", type: "page" },
  { title: "Contact", url: "/contact", type: "page" },
];

function score(text: string, query: string): number {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  // Fuzzy: count matching words
  const qWords = q.split(/\s+/);
  const tWords = t.split(/\s+/);
  let matches = 0;
  for (const qw of qWords) {
    for (const tw of tWords) {
      if (tw.includes(qw) || qw.includes(tw)) matches++;
    }
  }
  return Math.min(50, matches * 15);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const results: (SearchResult & { score: number })[] = [];

  // Blog posts
  for (const post of POSTS) {
    const s = Math.max(
      score(post.title, q),
      score(post.subtitle, q),
    );
    if (s > 0) {
      results.push({
        title: post.title,
        subtitle: post.subtitle,
        url: post.slug,
        type: "blog",
        score: s,
      });
    }
  }

  // Glossary
  for (const term of GLOSSARY_TERMS) {
    const s = score(term, q);
    if (s > 0) {
      const id = term.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, "");
      results.push({
        title: term,
        url: `/glossary#${id}`,
        type: "glossary",
        score: s,
      });
    }
  }

  // Static pages
  for (const page of STATIC_PAGES) {
    const s = score(page.title, q);
    if (s > 0) {
      results.push({ ...page, score: s });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return NextResponse.json({ results: results.slice(0, 10) });
}
