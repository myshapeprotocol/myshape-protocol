// ═══════════════════════════════════════════════════════════════════
// Site host classification — SITE FOUNDATION BATCH-001
//
// Single source of truth for the public-domain policy:
//   MyShape canonical host:  www.myshape.com      (apex myshape.com → 308)
//   Lab canonical host:      thecontinuitylab.org (www variant → 308)
//
// Matching is EXACT (never substring-based): a host such as
// "thecontinuitylab-abc.vercel.app" or "evil-thecontinuitylab.org"
// must NOT be classified as the Lab.
//
// Unknown hosts (localhost, 127.0.0.1, LAN IPs, *.vercel.app previews)
// classify as MyShape — a predictable, safe fallback that preserves
// current preview/development behaviour.
//
// This module is UI/UX-only plumbing. It does not touch protocol
// semantics, signing, evidence engines, or any security boundary.
// ═══════════════════════════════════════════════════════════════════

export type SiteBrand = "myshape" | "lab";

export const MYSHAPE_CANONICAL_ORIGIN = "https://www.myshape.com";
export const LAB_CANONICAL_ORIGIN = "https://thecontinuitylab.org";

/** Non-canonical hosts that normalize (308) to their canonical origin. */
export const MYSHAPE_APEX_HOST = "myshape.com";
export const LAB_WWW_HOST = "www.thecontinuitylab.org";

/** Lowercase and strip a trailing port (`:3000`, `:443`, …). */
export function normalizeHost(host: string | null | undefined): string {
  return (host ?? "").trim().toLowerCase().replace(/:\d+$/, "");
}

/**
 * Exact-match host classification.
 * Unknown / preview / localhost hosts fall back to MyShape.
 */
export function classifyHost(host: string | null | undefined): SiteBrand {
  const h = normalizeHost(host);
  if (h === "thecontinuitylab.org" || h === LAB_WWW_HOST) return "lab";
  return "myshape";
}