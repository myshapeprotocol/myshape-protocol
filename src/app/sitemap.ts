import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.myshape.com";

  const routes = [
    { path: "/", priority: 1.0, changeFreq: "weekly" as const },
    { path: "/genesis", priority: 0.9, changeFreq: "weekly" as const },
    { path: "/identity", priority: 0.8, changeFreq: "monthly" as const },
    { path: "/vision", priority: 0.8, changeFreq: "monthly" as const },
    { path: "/papers", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/protocol", priority: 0.9, changeFreq: "weekly" as const },
    { path: "/protocol/motion-pipeline", priority: 0.8, changeFreq: "weekly" as const },
    { path: "/roadmap", priority: 0.7, changeFreq: "monthly" as const },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFreq,
    priority: route.priority,
  }));
}
