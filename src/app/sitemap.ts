import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.myshape.com";

  const routes = [
    // ── Primary pages ──
    { path: "/", priority: 1.0, changeFreq: "daily" as const },
    { path: "/genesis", priority: 0.95, changeFreq: "daily" as const },
    { path: "/genesis/cohort", priority: 0.9, changeFreq: "daily" as const },
    { path: "/dashboard", priority: 0.85, changeFreq: "daily" as const },
    { path: "/motion-demo", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/motion-geometry", priority: 0.8, changeFreq: "weekly" as const },

    // ── Protocol & Architecture ──
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
    { path: "/papers/technical-spec", priority: 0.85, changeFreq: "weekly" as const },
    { path: "/papers/threat-model", priority: 0.8, changeFreq: "weekly" as const },
    { path: "/papers/protocol-architecture", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/papers/civilization-roadmap", priority: 0.6, changeFreq: "monthly" as const },

    // ── About & Vision ──
    { path: "/about-myshape", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/vision", priority: 0.8, changeFreq: "monthly" as const },
    { path: "/roadmap", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/contact", priority: 0.5, changeFreq: "monthly" as const },

    // ── Build ──
    { path: "/developers", priority: 0.8, changeFreq: "weekly" as const },
    { path: "/identity", priority: 0.75, changeFreq: "monthly" as const },
    { path: "/agent", priority: 0.7, changeFreq: "weekly" as const },
    { path: "/ai", priority: 0.5, changeFreq: "monthly" as const },

    // ── Blog ──
    { path: "/blog", priority: 0.7, changeFreq: "weekly" as const },
    { path: "/blog/continuity-layer-for-the-simulation-age", priority: 0.75, changeFreq: "monthly" as const },
    { path: "/blog/stored-identity-vs-generated-presence", priority: 0.75, changeFreq: "monthly" as const },

    // ── Research & Evidence ──
    { path: "/evidence", priority: 0.7, changeFreq: "weekly" as const },
    { path: "/research/apply", priority: 0.6, changeFreq: "weekly" as const },

    // ── Mirror routes (lower priority, canonical to primary) ──
    { path: "/civ-layer/papers", priority: 0.5, changeFreq: "monthly" as const },
    { path: "/civ-layer/papers/core-protocol", priority: 0.5, changeFreq: "monthly" as const },
    { path: "/civ-layer/papers/manifesto", priority: 0.3, changeFreq: "monthly" as const },
    { path: "/civ-layer/vision/manifesto", priority: 0.3, changeFreq: "monthly" as const },
    { path: "/civ-layer/genesis/manifesto", priority: 0.3, changeFreq: "monthly" as const },
    { path: "/civ-layer/publication", priority: 0.4, changeFreq: "monthly" as const },
    { path: "/civ-layer/publication/manifesto", priority: 0.3, changeFreq: "monthly" as const },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFreq,
    priority: route.priority,
  }));
}
