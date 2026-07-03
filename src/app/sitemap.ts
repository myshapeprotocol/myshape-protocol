import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.myshape.com";

  // Use a fixed recent date rather than `new Date()` so crawlers get stable
  // lastmod values.  Update this date whenever significant content changes ship.
  const LAST_MODIFIED = "2026-07-03";

  const routes = [
    // ── Primary pages ──
    { path: "/", priority: 1.0, changeFreq: "daily" as const },
    { path: "/genesis", priority: 0.95, changeFreq: "daily" as const },
    { path: "/genesis/cohort", priority: 0.9, changeFreq: "daily" as const },
    { path: "/dashboard", priority: 0.85, changeFreq: "daily" as const },
    { path: "/motion-demo", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/motion-geometry", priority: 0.8, changeFreq: "weekly" as const },

    // ── Protocol & Architecture ──
    { path: "/handshake", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/protocol", priority: 0.9, changeFreq: "weekly" as const },
    { path: "/protocol/identity-layer", priority: 0.8, changeFreq: "weekly" as const },
    { path: "/protocol/motion-pipeline", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/protocol/motion-pipeline/documentation", priority: 0.5, changeFreq: "monthly" as const },
    { path: "/protocol/zk", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/protocol/manifesto", priority: 0.6, changeFreq: "monthly" as const },
    { path: "/architecture", priority: 0.85, changeFreq: "weekly" as const },

    // ── Papers ──
    { path: "/whitepaper", priority: 0.9, changeFreq: "weekly" as const },
    { path: "/papers", priority: 0.8, changeFreq: "weekly" as const },
    { path: "/papers/core-protocol", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/papers/technical-spec", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/papers/threat-model", priority: 0.8, changeFreq: "weekly" as const },
    { path: "/papers/protocol-architecture", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/papers/civilization-roadmap", priority: 0.6, changeFreq: "monthly" as const },

    // ── About & Vision ──
    { path: "/about-myshape", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/vision", priority: 0.8, changeFreq: "monthly" as const },
    { path: "/roadmap", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/contact", priority: 0.5, changeFreq: "monthly" as const },
    { path: "/continuity", priority: 0.75, changeFreq: "weekly" as const },
    { path: "/compare", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/glossary", priority: 0.8, changeFreq: "weekly" as const },

    // ── Build ──
    { path: "/docs", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/developers", priority: 0.8, changeFreq: "weekly" as const },
    { path: "/identity", priority: 0.75, changeFreq: "monthly" as const },
    { path: "/agent", priority: 0.7, changeFreq: "weekly" as const },
    { path: "/ai", priority: 0.5, changeFreq: "monthly" as const },

    // ── Blog ──
    { path: "/blog", priority: 0.7, changeFreq: "weekly" as const },
    { path: "/blog/genesis-001-why-identity-is-not-enough", priority: 0.80, changeFreq: "weekly" as const },
    { path: "/blog/continuity-layer-for-the-simulation-age", priority: 0.75, changeFreq: "monthly" as const },
    { path: "/blog/stored-identity-vs-generated-presence", priority: 0.75, changeFreq: "monthly" as const },
    { path: "/blog/what-is-proof-of-continuity", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/blog/motion-vs-biometrics-why-your-face-is-not-a-password", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/blog/what-is-decentralized-identity-2026", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/blog/zero-knowledge-proofs-digital-identity-explained", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/blog/proof-of-personhood-vs-proof-of-continuity", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/blog/ai-agent-identity-how-autonomous-agents-prove-who-they-are", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/blog/self-sovereign-identity-explained-2026", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/blog/the-post-biometric-era-2026", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/blog/digital-identity-future-2027", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/blog/why-motion-is-the-only-unforgeable-identity-signal", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/newsletter", priority: 0.65, changeFreq: "monthly" as const },

    // ── Research & Evidence ──
    { path: "/evidence", priority: 0.7, changeFreq: "weekly" as const },
    { path: "/research/apply", priority: 0.6, changeFreq: "weekly" as const },

    // ── llms.txt for AI crawler discovery ──
    { path: "/llms.txt", priority: 0.5, changeFreq: "weekly" as const },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: route.changeFreq,
    priority: route.priority,
  }));
}
