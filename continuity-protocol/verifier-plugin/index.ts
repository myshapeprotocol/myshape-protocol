// ═══════════════════════════════════════════════════════════════════
// CPS-0001 HTTP Verifier Plugin
//
// A portable verifier for HTTP-based Continuity Receipt consumption.
// Designed to be embedded in:
//   - Express middleware
//   - Envoy external auth filter
//   - Kong plugin
//   - NGINX auth_request handler
//   - Cloudflare Worker
//   - Any HTTP proxy that consumes X-Continuity-Receipt
//
// Zero dependencies on MyShape engine code.
// Only needs the receipt + issuer public key → allow/deny + risk.
//
// v1.0-RC · Apache 2.0 · The Continuity Lab
// ═══════════════════════════════════════════════════════════════════

import {
  verifyReceipt,
  verifyFreshness,
  type ContinuityReceipt,
  type VerificationResult,
} from "../reference-verifier/verifier";

// ── Header parsing ───────────────────────────────────────────────

const HEADER_NAME = "X-Continuity-Receipt";

/**
 * Parse a base64url-encoded ContinuityReceipt from an HTTP header value.
 * Returns null if the header is missing or malformed.
 */
export function parseReceiptHeader(headerValue: string | null | undefined): ContinuityReceipt | null {
  if (!headerValue) return null;
  try {
    const json = Buffer.from(headerValue, "base64url").toString("utf-8");
    return JSON.parse(json) as ContinuityReceipt;
  } catch {
    return null;
  }
}

// ── Verifier ──────────────────────────────────────────────────────

export interface VerifierDecision {
  /** Whether to allow the request */
  allow: boolean;
  /** HTTP status code for the decision */
  statusCode: number;
  /** Human-readable reason */
  reason: string;
  /** Risk score 0–1 (0 = safe, 1 = high risk) — undefined if receipt valid */
  riskScore: number;
  /** Detailed verification result */
  verification: VerificationResult;
}

/**
 * Verify a ContinuityReceipt extracted from the X-Continuity-Receipt header.
 *
 * Returns a VerifierDecision that any gateway/proxy can use to allow/deny.
 *
 * The verifier does NOT:
 *   - Know which evidence engine was used
 *   - Inspect evidence payload content (only payloadDigest)
 *   - Require any MyShape SDK or engine code
 *
 * It ONLY checks:
 *   V₁ Schema · V₃ Assertions · V₄ Temporal · V₅ Evidence · V₆ Freshness
 *
 * V₂ (signature) and V₇ (predecessor chain) require external data
 * and are checked when issuerPublicKey or predecessor is provided.
 */
export async function verifyHeader(
  headerValue: string | null | undefined,
): Promise<VerifierDecision> {
  // Parse
  if (!headerValue) {
    return {
      allow: false,
      statusCode: 401,
      reason: "Missing X-Continuity-Receipt header",
      riskScore: 1.0,
      verification: { status: "INVALID", reason: "INVALID_SCHEMA", detail: "No receipt provided." },
    };
  }

  const receipt = parseReceiptHeader(headerValue);
  if (!receipt) {
    return {
      allow: false,
      statusCode: 400,
      reason: "Malformed X-Continuity-Receipt — not valid base64url JSON",
      riskScore: 1.0,
      verification: { status: "INVALID", reason: "INVALID_SCHEMA", detail: "Failed to parse receipt JSON." },
    };
  }

  // Verify
  const result = await verifyReceipt(receipt);

  if (result.status === "VALID") {
    return {
      allow: true,
      statusCode: 200,
      reason: "Continuity Receipt verified — V₁ V₃ V₄ V₅ V₆ passed.",
      riskScore: 0,
      verification: result,
    };
  }

  // Map failure reasons to HTTP semantics
  const statusMap: Record<string, number> = {
    INVALID_SCHEMA: 400,
    INCONSISTENT_ASSERTIONS: 422,
    TEMPORAL_INCONSISTENCY: 422,
    EVIDENCE_TAMPERED: 403,
    EXPIRED: 403,
    CHAIN_BROKEN: 403,
  };

  return {
    allow: false,
    statusCode: statusMap[result.reason] ?? 403,
    reason: `Receipt verification failed: ${result.reason} — ${result.detail}`,
    riskScore: 1.0,
    verification: result,
  };
}

// ── Risk scoring ──────────────────────────────────────────────────

/**
 * Compute a risk score 0–1 from a valid receipt.
 *
 * Lower = safer. Factors:
 *   - Coverage duration (longer observation → lower risk)
 *   - Confidence (higher confidence → lower risk)
 *   - Time since issuance (older → higher risk)
 */
export function computeRiskScore(receipt: ContinuityReceipt): number {
  let risk = 0;

  // Short observation → higher risk
  if (receipt.interval.coverageMs < 3000) risk += 0.3;

  // Low confidence → higher risk
  const conf = receipt.assertions.continuityMaintained.confidence;
  if (conf < 0.5) risk += 0.4;
  else if (conf < 0.7) risk += 0.2;

  // Old receipt → higher risk (stale)
  if (receipt.interval.end) {
    const ageMs = Date.now() - new Date(receipt.interval.end).getTime();
    if (ageMs > 300_000) risk += 0.3;   // > 5 min
    else if (ageMs > 60_000) risk += 0.1; // > 1 min
  }

  return Math.min(risk, 1.0);
}

// ── Serialization ─────────────────────────────────────────────────

/**
 * Serialize a ContinuityReceipt to a base64url-encoded header value.
 */
export function serializeReceiptHeader(receipt: ContinuityReceipt): string {
  return Buffer.from(JSON.stringify(receipt), "utf-8").toString("base64url");
}

// ── Header name exports for gateway config ───────────────────────

export const CONTINUITY_HEADER = HEADER_NAME;
export const CONTINUITY_RISK_HEADER = "X-Continuity-Risk";
