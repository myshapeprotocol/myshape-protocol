import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  classifyHost,
  LAB_CANONICAL_ORIGIN,
  MYSHAPE_CANONICAL_ORIGIN,
  normalizeHost,
} from "@/lib/site-host";

// ═══════════════════════════════════════════════════════════════════
// SITE FOUNDATION BATCH-001 — host routing policy
//
// Canonical hosts (frozen):
//   MyShape: https://www.myshape.com      (apex myshape.com → 308)
//   Lab:     https://thecontinuitylab.org (www variant → 308)
//
// LAB host route boundary — explicit allowlist, no catch-all collapse:
//   /                      → rewrite → /lab        (Lab home)
//   /lab/*                 → serve as-is           (current internal routes)
//   /lab (exact)           → 308 → https://thecontinuitylab.org/
//   /research, /protocols, /develop, /contribute, /playground
//                          → serve as-is           (frozen future LAB
//                            namespace — routes may not exist yet, in
//                            which case Next serves 404 instead of the
//                            old behaviour of collapsing into /lab)
//   known static assets    → serve as-is           (og images, fonts, …
//                            shared by both hosts) — EXCEPT robots.txt
//                            and sitemap.xml which are host-aware
//                            route handlers
//   everything else        → pass through (Next renders 404 — the LAB
//                            domain serves nothing outside its boundary)
//
// MyShape host: everything passes through unchanged.
// UI/UX plumbing only — no protocol/security semantics touched here.
// ═══════════════════════════════════════════════════════════════════

const LAB_PUBLIC_PREFIXES = [
  "/lab/",
  "/research",
  "/developers",
  "/playground",
];

/**
 * Production LAB canonical URLs → internal /lab/ routes.
 * These rewrites let thecontinuitylab.org serve clean public URLs
 * while the actual pages live under the /lab/ namespace internally.
 */
const LAB_CANONICAL_REWRITES: [string, string][] = [
  ["/protocols", "/lab/protocols"],
  ["/develop", "/lab/develop"],
  ["/contribute", "/lab/contribute"],
];

const STATIC_ASSET_RE =
  /\.(png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?|ttf|eot|css|js|json|xml|txt|map)$/i;

/** Host-aware documents served by dedicated route handlers. */
function isHostAwareDoc(pathname: string): boolean {
  return pathname === "/sitemap.xml" || pathname === "/robots.txt";
}

export function proxy(req: NextRequest) {
  const host = normalizeHost(req.headers.get("host"));
  const url = req.nextUrl;

  // Force HTTPS redirect — production only (Vercel edge). In dev,
  // Next.js/Turbopack sets x-forwarded-proto which causes a broken 301 loop.
  if (
    process.env.NODE_ENV === "production" &&
    req.headers.get("x-forwarded-proto") === "http"
  ) {
    return NextResponse.redirect(
      new URL(url.pathname + url.search, `https://${host}`),
      308,
    );
  }

  // ── Canonical host normalization (app-layer 308, idempotent) ──
  if (host === "www.thecontinuitylab.org") {
    return NextResponse.redirect(
      new URL(url.pathname + url.search, LAB_CANONICAL_ORIGIN),
      308,
    );
  }
  if (host === "myshape.com") {
    return NextResponse.redirect(
      new URL(url.pathname + url.search, MYSHAPE_CANONICAL_ORIGIN),
      308,
    );
  }

  // Exact host classification — no substring matching.
  if (classifyHost(host) === "lab") {
    const pathname = url.pathname;

    // /lab is an internal route namespace, not a public canonical URL.
    if (pathname === "/lab") {
      return NextResponse.redirect(new URL("/" + url.search, LAB_CANONICAL_ORIGIN), 308);
    }

    // Lab home (canonical root URL).
    if (pathname === "/") {
      const rewritten = url.clone();
      rewritten.pathname = "/lab";
      return NextResponse.rewrite(rewritten);
    }

    // Production canonical LAB URLs → internal /lab/ routes.
    // /research is the full Research archive (notes, experiments, …) and
    // supports sub-paths: thecontinuitylab.org/research/notes/001 →
    // /lab/research/notes/001. The other sections are single pages.
    if (pathname === "/research" || pathname.startsWith("/research/")) {
      const rewritten = url.clone();
      rewritten.pathname = "/lab/research" + pathname.slice("/research".length);
      return NextResponse.rewrite(rewritten);
    }
    // /protocols supports sub-paths for individual protocol artifacts:
    // thecontinuitylab.org/protocols/cps-0001 → /lab/protocols/cps-0001
    if (pathname === "/protocols" || pathname.startsWith("/protocols/")) {
      const rewritten = url.clone();
      rewritten.pathname = "/lab/protocols" + pathname.slice("/protocols".length);
      return NextResponse.rewrite(rewritten);
    }
    const canonicalRewrite = LAB_CANONICAL_REWRITES.find(([pub]) => pathname === pub);
    if (canonicalRewrite) {
      const rewritten = url.clone();
      rewritten.pathname = canonicalRewrite[1];
      return NextResponse.rewrite(rewritten);
    }

    // Current internal routes + frozen future LAB namespace → as-is.
    if (
      pathname.startsWith("/lab/") ||
      LAB_PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
    ) {
      return NextResponse.next();
    }

    // Shared static assets stay reachable on both hosts — except the
    // host-aware documents above, which fall through to their handlers.
    if (STATIC_ASSET_RE.test(pathname) && !isHostAwareDoc(pathname)) {
      return NextResponse.next();
    }

    // Explicit boundary: unknown LAB-host pages simply do not exist
    // (Next renders 404) — no silent collapse into /lab.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  proxy: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|identity-sigil.jpg).*)"],
};
