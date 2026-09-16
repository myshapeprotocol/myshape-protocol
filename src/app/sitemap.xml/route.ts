// ═══════════════════════════════════════════════════════════════════
// SITE FOUNDATION BATCH-001 — host-aware sitemap
//
//   https://www.myshape.com/sitemap.xml      → MyShape canonical URLs only
//   https://thecontinuitylab.org/sitemap.xml → LAB canonical URLs only
//
// Replaces the former static src/app/sitemap.ts (which leaked the full
// MyShape URL list to thecontinuitylab.org — P0 in the topology audit).
// LAB lists only its canonical root for now; research/protocol pages
// join after their IA migration (follow-up batch).
// ═══════════════════════════════════════════════════════════════════

import { classifyHost, LAB_CANONICAL_ORIGIN, MYSHAPE_CANONICAL_ORIGIN } from "@/lib/site-host";

export const dynamic = "force-dynamic";

interface SitemapEntry {
  path: string;
  changeFrequency: string;
  priority: number;
}

// ── MyShape URL inventory (unchanged scope from the former sitemap.ts) ──
const MYSHAPE_ENTRIES: SitemapEntry[] = [
  // Tier 1: Homepage (1.0)
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  // Tier 2: Core product pages (0.9)
  { path: "/verify", changeFrequency: "weekly", priority: 0.9 },
  { path: "/vision", changeFrequency: "weekly", priority: 0.9 },
  { path: "/protocol", changeFrequency: "weekly", priority: 0.9 },
  { path: "/motion-demo", changeFrequency: "weekly", priority: 0.9 },
  { path: "/continuity", changeFrequency: "weekly", priority: 0.9 },
  { path: "/architecture", changeFrequency: "weekly", priority: 0.9 },
  { path: "/roadmap", changeFrequency: "weekly", priority: 0.9 },
  { path: "/developers", changeFrequency: "weekly", priority: 0.9 },
  { path: "/glossary", changeFrequency: "weekly", priority: 0.9 },
  { path: "/compare", changeFrequency: "weekly", priority: 0.9 },
  { path: "/whitepaper", changeFrequency: "weekly", priority: 0.9 },
  // Tier 3: Protocol sub-pages (0.8)
  { path: "/protocol/continuity-layer", changeFrequency: "monthly", priority: 0.8 },
  { path: "/protocol/manifesto", changeFrequency: "monthly", priority: 0.8 },
  { path: "/protocol", changeFrequency: "monthly", priority: 0.8 },
  // Tier 4: Papers (0.7)
  { path: "/papers", changeFrequency: "monthly", priority: 0.7 },
  { path: "/research/notes/008-continuity-protocol-core", changeFrequency: "monthly", priority: 0.7 },
  { path: "/roadmap", changeFrequency: "monthly", priority: 0.7 },
  { path: "/papers/technical-spec", changeFrequency: "monthly", priority: 0.7 },
  { path: "/papers/threat-model", changeFrequency: "monthly", priority: 0.7 },
  // Tier 5: Secondary pages (0.7)
  { path: "/vision", changeFrequency: "monthly", priority: 0.7 },
  { path: "/ai", changeFrequency: "monthly", priority: 0.7 },
  { path: "/agent", changeFrequency: "monthly", priority: 0.7 },
  { path: "/evidence", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/newsletter", changeFrequency: "monthly", priority: 0.7 },
  { path: "/motion-geometry", changeFrequency: "monthly", priority: 0.7 },
  { path: "/research/apply", changeFrequency: "monthly", priority: 0.7 },
  // Tier 6: Blog index + posts (0.6)
  { path: "/blog", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/genesis-001-why-identity-is-not-enough", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/continuity-layer-for-the-simulation-age", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/stored-identity-vs-generated-presence", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/what-is-proof-of-continuity", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/motion-vs-biometrics-why-your-face-is-not-a-password", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/what-is-decentralized-identity-2026", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/zero-knowledge-proofs-digital-identity-explained", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/proof-of-personhood-vs-proof-of-continuity", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/ai-agent-identity-how-autonomous-agents-prove-who-they-are", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/self-sovereign-identity-explained-2026", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/the-post-biometric-era-2026", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/digital-identity-future-2027", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/why-motion-is-the-only-unforgeable-identity-signal", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/how-to-verify-human-online-2026", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/web3-identity-explained-blockchain", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/what-is-did-decentralized-identifiers", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/kyc-vs-decentralized-identity", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/sybil-resistance-explained", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/what-is-presence-verification", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/digital-identity-standards-2026", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/what-is-verifiable-credential", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/why-passwords-are-broken", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog/how-to-build-privacy-preserving-identity", changeFrequency: "monthly", priority: 0.6 },
  // Tier 7: Verify (0.5)
  { path: "/verify", changeFrequency: "monthly", priority: 0.5 },
  // Tier 8: Dashboard (0.3, noindex gated)
  { path: "/dashboard", changeFrequency: "monthly", priority: 0.3 },
];

// ── LAB: canonical root + protocol artifacts ──
// /lab/* paths are the internal route namespace and are deliberately NOT
// listed as canonical URLs (BATCH-001 §4/§9). Public LAB URLs use the
// canonical /protocols/* namespace (rewritten to /lab/protocols/* internally).
const LAB_ENTRIES: SitemapEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/protocols", changeFrequency: "monthly", priority: 0.8 },
  { path: "/protocols/cps-0001", changeFrequency: "monthly", priority: 0.8 },
  { path: "/protocols/cps-0002", changeFrequency: "monthly", priority: 0.8 },
];

function buildSitemapXml(origin: string, entries: SitemapEntry[]): string {
  const now = new Date().toISOString();
  const urls = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${origin}${e.path === "/" ? "/" : e.path}</loc>\n    <lastmod>${now}</lastmod>\n    <changeFrequency>${e.changeFrequency}</changeFrequency>\n    <priority>${e.priority.toFixed(1)}</priority>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export async function GET(req: Request) {
  const brand = classifyHost(req.headers.get("host"));
  const xml =
    brand === "lab"
      ? buildSitemapXml(LAB_CANONICAL_ORIGIN, LAB_ENTRIES)
      : buildSitemapXml(MYSHAPE_CANONICAL_ORIGIN, MYSHAPE_ENTRIES);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}