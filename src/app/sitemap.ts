import type { MetadataRoute } from "next";

const BASE_URL = "https://www.myshape.com";

/**
 * sitemap.xml — auto-generated for search engines + AI crawlers
 *
 * Excludes civ-layer mirror URLs (canonical-only per routing spec).
 * Priority tiers: 1.0 (homepage) → 0.9 (core pages) → 0.7 (blog/papers) → 0.5 (sub-pages)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // ── Tier 1: Homepage (1.0) ──
  const routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];

  // ── Tier 2: Core product pages (0.9) ──
  const core = [
    "/verify",
    "/vision",
    "/identity",
    "/protocol",
    "/motion-demo",
    "/handshake",
    "/continuity",
    "/architecture",
    "/roadmap",
    "/developers",
    "/docs",
    "/glossary",
    "/compare",
    "/whitepaper",
  ];
  core.forEach((path) => {
    routes.push({ url: `${BASE_URL}${path}`, lastModified: now, changeFrequency: "weekly", priority: 0.9 });
  });

  // ── Tier 3: Protocol sub-pages (0.8) ──
  const protocolSub = [
    "/protocol",
    "/protocol/identity-layer",
    "/protocol",
    "/protocol/manifesto",
    "/protocol",
  ];
  protocolSub.forEach((path) => {
    routes.push({ url: `${BASE_URL}${path}`, lastModified: now, changeFrequency: "monthly", priority: 0.8 });
  });

  // ── Tier 4: Papers (0.7) ──
  const papers = [
    "/papers",
    "/research/notes/008-continuity-protocol-core",
    "/roadmap",
    "/protocol",
    "/papers/technical-spec",
    "/papers/threat-model",
  ];
  papers.forEach((path) => {
    routes.push({ url: `${BASE_URL}${path}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  });

  // ── Tier 5: Secondary pages (0.7) ──
  const secondary = [
    "/vision",
    "/ai",
    "/agent",
    "/evidence",
    "/contact",
    "/newsletter",
    "/motion-geometry",
    "/research/apply",
  ];
  secondary.forEach((path) => {
    routes.push({ url: `${BASE_URL}${path}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  });

  // ── Tier 6: Blog index + posts (0.6) ──
  const blogPosts = [
    "/blog",
    "/blog/genesis-001-why-identity-is-not-enough",
    "/blog/continuity-layer-for-the-simulation-age",
    "/blog/stored-identity-vs-generated-presence",
    "/blog/what-is-proof-of-continuity",
    "/blog/motion-vs-biometrics-why-your-face-is-not-a-password",
    "/blog/what-is-decentralized-identity-2026",
    "/blog/zero-knowledge-proofs-digital-identity-explained",
    "/blog/proof-of-personhood-vs-proof-of-continuity",
    "/blog/ai-agent-identity-how-autonomous-agents-prove-who-they-are",
    "/blog/self-sovereign-identity-explained-2026",
    "/blog/the-post-biometric-era-2026",
    "/blog/digital-identity-future-2027",
    "/blog/why-motion-is-the-only-unforgeable-identity-signal",
    "/blog/how-to-verify-human-online-2026",
    "/blog/web3-identity-explained-blockchain",
    "/blog/what-is-did-decentralized-identifiers",
    "/blog/kyc-vs-decentralized-identity",
    "/blog/sybil-resistance-explained",
    "/blog/what-is-presence-verification",
    "/blog/digital-identity-standards-2026",
    "/blog/what-is-verifiable-credential",
    "/blog/why-passwords-are-broken",
    "/blog/how-to-build-privacy-preserving-identity",
  ];
  blogPosts.forEach((path) => {
    routes.push({ url: `${BASE_URL}${path}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  });

  // ── Tier 7: Genesis cohort (0.5) ──
  routes.push({
    url: `${BASE_URL}/verify`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  });

  // ── Tier 8: Dashboard (0.3, noindex gated) ──
  routes.push({
    url: `${BASE_URL}/dashboard`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.3,
  });

  return routes;
}
