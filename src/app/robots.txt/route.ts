// ═══════════════════════════════════════════════════════════════════
// SITE FOUNDATION BATCH-001 — host-aware robots.txt
//
//   https://www.myshape.com/robots.txt      → sitemap = MyShape
//   https://thecontinuitylab.org/robots.txt → sitemap = LAB
//
// Replaces the former static src/app/robots.ts (whose MyShape sitemap
// pointer leaked to thecontinuitylab.org — P0 in the topology audit).
// ═══════════════════════════════════════════════════════════════════

import { classifyHost, LAB_CANONICAL_ORIGIN, MYSHAPE_CANONICAL_ORIGIN } from "@/lib/site-host";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const brand = classifyHost(req.headers.get("host"));
  const sitemapUrl =
    brand === "lab"
      ? `${LAB_CANONICAL_ORIGIN}/sitemap.xml`
      : `${MYSHAPE_CANONICAL_ORIGIN}/sitemap.xml`;

  const xml = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /civ-layer/",
    "",
    "User-agent: GPTBot",
    "Allow: /",
    "Disallow: /api/",
    "",
    "User-agent: Claude-Web",
    "Allow: /",
    "Disallow: /api/",
    "",
    `Sitemap: ${sitemapUrl}`,
    "",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}