// ============================================================
// MyShape Protocol — Content fingerprint
//
// SHA-256 over the RFC 8785 JCS canonicalization of { content, title }.
//
// This is the fingerprint rule fixed by the Research Distribution
// application contract §4.3. It is the fourth component of the
// idempotency key
//   UNIQUE (version_id, surface, platform, content_fingerprint)
// and the value copied onto every governance event, so that an approval
// provably refers to exactly this content.
//
// The digest rule is shared with the frozen CPS-0001 / CPS-0002 rule:
// the canonical form is produced by canonicalSerialize() and hashed by
// sha256Hex(). Neither helper is duplicated here, and neither is modified.
//
// SCOPE OF JCS CONFORMANCE
// ------------------------
// canonicalSerialize() sorts object keys in UTF-16 code unit order, omits
// undefined, and emits through JSON.stringify with no inserted whitespace.
// For a flat object whose values are strings — the only shape this
// function accepts — that is equivalent to RFC 8785 JCS. This module does
// not claim general JCS conformance for numbers, nested structures, or
// non-string scalars, and must not be used for such payloads.
// ============================================================

import { canonicalSerialize } from "@/lib/evidence/cps0001";
import { sha256Hex } from "@/lib/hash";

/**
 * The exact and complete fingerprint input.
 *
 * No other field participates. In particular platform, surface, brand,
 * Registry metadata, timestamps and delivery metadata are excluded, so the
 * same approved content fingerprints identically regardless of where it is
 * distributed.
 */
export interface FingerprintInput {
  content: string;
  title: string;
}

/**
 * Compute the content fingerprint.
 *
 * Returns 64 lowercase hexadecimal characters, matching the schema CHECK
 * `research_distribution_fingerprint_hex`.
 *
 * Throws if either field is not a string. This guard is deliberate:
 * canonicalSerialize() drops undefined values, so an absent field would
 * otherwise yield a well-formed 64-hex digest that silently describes
 * different content rather than failing loudly.
 */
export function computeContentFingerprint(input: FingerprintInput): string {
  if (typeof input?.content !== "string" || typeof input?.title !== "string") {
    throw new TypeError(
      "computeContentFingerprint: content and title must both be strings",
    );
  }

  return sha256Hex(
    canonicalSerialize({ content: input.content, title: input.title }),
  );
}