import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.myshape.com";

  const routes = [
    { path: "/", priority: 1.0, changeFreq: "weekly" as const },
    { path: "/genesis", priority: 0.9, changeFreq: "weekly" as const },

    { path: "/developers", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/about-myshape", priority: 0.6, changeFreq: "monthly" as const },
    { path: "/identity", priority: 0.8, changeFreq: "monthly" as const },
    { path: "/vision", priority: 0.8, changeFreq: "monthly" as const },
    { path: "/civ-layer/papers", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/civ-layer/papers/core-protocol", priority: 0.8, changeFreq: "monthly" as const },
    { path: "/civ-layer/papers/manifesto", priority: 0.5, changeFreq: "monthly" as const },
    { path: "/civ-layer/vision/manifesto", priority: 0.5, changeFreq: "monthly" as const },
    { path: "/civ-layer/genesis/manifesto", priority: 0.5, changeFreq: "monthly" as const },
    { path: "/civ-layer/publication", priority: 0.6, changeFreq: "monthly" as const },
    { path: "/civ-layer/publication/manifesto", priority: 0.5, changeFreq: "monthly" as const },
    { path: "/papers/technical-spec", priority: 0.9, changeFreq: "weekly" as const },
    { path: "/papers/threat-model", priority: 0.8, changeFreq: "weekly" as const },
    { path: "/papers/protocol-architecture", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/papers/civilization-roadmap", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/agent", priority: 0.8, changeFreq: "weekly" as const },
    { path: "/ai", priority: 0.5, changeFreq: "monthly" as const },
    { path: "/protocol", priority: 0.9, changeFreq: "weekly" as const },
    { path: "/protocol/manifesto", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/protocol/identity-layer", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/protocol/zk", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/protocol/motion-pipeline", priority: 0.8, changeFreq: "weekly" as const },
    { path: "/protocol/motion-pipeline/documentation", priority: 0.5, changeFreq: "monthly" as const },
    { path: "/contact", priority: 0.5, changeFreq: "monthly" as const },
    { path: "/roadmap", priority: 0.7, changeFreq: "monthly" as const },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFreq,
    priority: route.priority,
  }));
}
