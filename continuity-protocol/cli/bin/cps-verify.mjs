#!/usr/bin/env node
/**
 * CPS-0001 Reference Verifier — CLI
 *
 * Usage:
 *   cps-verify receipt.json
 *   cat receipt.json | cps-verify
 *   node continuity-protocol/cli/bin/cps-verify.mjs test-vectors/valid-receipt-01.json
 *
 * Zero MyShape dependencies. Only @noble/hashes + @noble/curves.
 */

import { readFileSync } from "node:fs";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { ed25519 } from "@noble/curves/ed25519.js";

// ── Helpers ──

function sha256Hex(data) {
  return bytesToHex(sha256(new TextEncoder().encode(data)));
}

function hexToBytes(hex) {
  const len = hex.length / 2;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

// ── V₁: Schema Validity ──

function v1(receipt) {
  if (receipt.protocolVersion !== "1.0") return { ok: false, detail: `expected "1.0", got "${receipt.protocolVersion}"` };
  if (!receipt.receiptId || typeof receipt.receiptId !== "string") return { ok: false, detail: "missing receiptId" };
  if (!receipt.interval?.start || !receipt.interval?.end) return { ok: false, detail: "missing interval start/end" };
  if (typeof receipt.interval.coverageMs !== "number" || receipt.interval.coverageMs <= 0) return { ok: false, detail: "coverageMs must be > 0" };
  if (!receipt.subject?.id) return { ok: false, detail: "missing subject.id" };
  if (!Array.isArray(receipt.evidence) || receipt.evidence.length === 0) return { ok: false, detail: "evidence must be non-empty array" };
  if (!receipt.issuer?.id || !receipt.issuer?.publicKey) return { ok: false, detail: "missing issuer id or publicKey" };
  if (!receipt.signature?.algorithm || !receipt.signature?.value) return { ok: false, detail: "missing signature" };
  return { ok: true };
}

// ── V₂: Signature Verification ──
//
// Batch-2F: V₂ now reconstructs the EXACT canonical signing payload (13 fields)
// that src/lib/evidence/cps0001.ts, packages/myshape/src/cps0001.ts and
// noble-verifier.ts sign — byte-for-byte. A receipt signed by any 13-field
// producer verifies here; tampering any signed field fails V₂.
// Order/serialization MUST mirror canonicalSigningPayload in those files:
//   receiptId, interval.start, interval.end, coverageMs.toString(),
//   subject.id, evidenceDigests, issuer.id, issuer.publicKey,
//   protocolVersion ?? "", expiresAt ?? "", assertionsFlat,
//   verdict ?? "", (references ?? []).join(":")

function v2(receipt) {
  if (receipt.signature.algorithm !== "Ed25519") return { ok: false, detail: `unsupported algorithm: ${receipt.signature.algorithm}` };
  const a = receipt.assertions;
  const assertionsFlat = [
    a.observationOccurred.value,
    a.observationOccurred.confidence,
    a.continuityMaintained.value,
    a.continuityMaintained.confidence,
    a.receiptIntegrity.value,
    a.receiptIntegrity.confidence,
  ].join(":");
  const payload = [
    receipt.receiptId,
    receipt.interval.start,
    receipt.interval.end,
    receipt.interval.coverageMs.toString(),
    receipt.subject.id,
    receipt.evidence.map((e) => e.payloadDigest).join(":"),
    receipt.issuer.id,
    receipt.issuer.publicKey,
    receipt.protocolVersion ?? "",
    receipt.expiresAt ?? "",
    assertionsFlat,
    receipt.verdict ?? "",
    (receipt.references ?? []).join(":"),
  ].join(":");
  try {
    const pk = hexToBytes(receipt.issuer.publicKey);
    const sig = hexToBytes(receipt.signature.value);
    const msg = new TextEncoder().encode(payload);
    return ed25519.verify(sig, msg, pk) ? { ok: true } : { ok: false, detail: "signature mismatch" };
  } catch (e) {
    return { ok: false, detail: `crypto error: ${e.message}` };
  }
}

// ── V₃: Assertion Consistency ──

function v3(receipt) {
  const a = receipt.assertions;
  if (!a) return { ok: false, detail: "missing assertions" };
  if (a.continuityMaintained?.value && !a.observationOccurred?.value) {
    return { ok: false, detail: "continuity claimed without observation" };
  }
  return { ok: true };
}

// ── V₄: Temporal Consistency ──
// Batch-2C hardening — mirrors src/lib/evidence/cps0001.ts:
//   every temporal input must parse; completed-window attestation rejects a
//   future interval.end regardless of self-reported signedAt.

function v4(receipt, now = Date.now()) {
  const start = new Date(receipt.interval.start).getTime();
  const end = new Date(receipt.interval.end).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return { ok: false, detail: `malformed interval bound (${receipt.interval.start} … ${receipt.interval.end})` };
  }
  if (start >= end) return { ok: false, detail: `start (${receipt.interval.start}) >= end (${receipt.interval.end})` };
  if (end > now) return { ok: false, detail: `interval ends in the future (${receipt.interval.end})` };
  if (receipt.interval.coverageMs !== end - start) return { ok: false, detail: `coverageMs ${receipt.interval.coverageMs} ≠ ${end - start}` };

  const signedAtRaw = receipt.signature?.signedAt;
  if (signedAtRaw) {
    const signedAt = new Date(signedAtRaw).getTime();
    if (Number.isNaN(signedAt)) return { ok: false, detail: `malformed signature.signedAt (${signedAtRaw})` };
    if (signedAt < end) return { ok: false, detail: "signedAt before interval.end" };
  }

  if (receipt.expiresAt) {
    const expiresAt = new Date(receipt.expiresAt).getTime();
    if (Number.isNaN(expiresAt)) return { ok: false, detail: `malformed expiresAt (${receipt.expiresAt})` };
    if (expiresAt <= end) return { ok: false, detail: "expiresAt before or at interval.end" };
  }

  return { ok: true };
}

// ── V₅: Evidence Integrity ──

function v5(receipt) {
  for (const block of receipt.evidence) {
    const expected = sha256Hex(JSON.stringify(block.payload));
    if (expected !== block.payloadDigest) {
      return { ok: false, detail: `${block.engineId}: digest mismatch` };
    }
  }
  return { ok: true };
}

// ── V₆: Freshness ──
// Batch-2C: malformed expiresAt fails closed instead of meaning "never expires".

function v6(receipt, now = Date.now()) {
  if (receipt.expiresAt) {
    const expiresAt = new Date(receipt.expiresAt).getTime();
    if (Number.isNaN(expiresAt)) return { ok: false, detail: `malformed expiresAt (${receipt.expiresAt})` };
    if (now >= expiresAt) {
      return { ok: false, detail: `expired at ${receipt.expiresAt}` };
    }
  }
  return { ok: true };
}

// ── Verify ──

function verify(receipt) {
  return [
    { id: "V₁", label: "Schema Validity", ...v1(receipt) },
    { id: "V₂", label: "Cryptographic Signature", ...v2(receipt) },
    { id: "V₃", label: "Assertion Consistency", ...v3(receipt) },
    { id: "V₄", label: "Temporal Consistency", ...v4(receipt) },
    { id: "V₅", label: "Evidence Integrity", ...v5(receipt) },
    { id: "V₆", label: "Freshness", ...v6(receipt) },
  ];
}

// ── Main ──

function main() {
  const filePath = process.argv[2];
  let raw;
  try {
    raw = filePath ? readFileSync(filePath, "utf-8") : readFileSync(0, "utf-8");
  } catch {
    console.error("Usage: cps-verify <receipt.json>");
    console.error("       cat receipt.json | cps-verify");
    process.exit(2);
  }

  let receipt;
  try {
    receipt = JSON.parse(raw);
  } catch {
    console.error("Error: invalid JSON");
    process.exit(1);
  }

  if (!receipt.protocolVersion || !receipt.receiptId) {
    console.error("Error: not a CPS-0001 ContinuityReceipt");
    process.exit(1);
  }

  const results = verify(receipt);
  const allPassed = results.every((r) => r.ok);
  const engines = receipt.evidence.map((e) => e.engineId).join(", ");

  console.log("");
  console.log("══════════════════════════════════════════════");
  console.log("  CPS-0001 Reference Verifier");
  console.log("══════════════════════════════════════════════");
  console.log("");
  console.log(`  Protocol  : ${receipt.protocolVersion}`);
  console.log(`  Receipt   : ${receipt.receiptId}`);
  console.log(`  Engines   : ${engines}`);
  console.log(`  Subject   : ${receipt.subject.id.slice(0, 32)}…`);
  console.log("");
  console.log("  ── Verification ──");
  console.log("");
  for (const r of results) {
    const icon = r.ok ? "✅" : "❌";
    const line = r.ok ? `  [${r.id}] ${r.label}` : `  [${r.id}] ${r.label}: ${r.detail}`;
    console.log(`  ${icon} ${line}`);
  }
  console.log("");
  console.log(`  VERDICT: ${allPassed ? "✅ VALID" : "❌ INVALID"}`);
  console.log("");
  console.log("══════════════════════════════════════════════");

  process.exit(allPassed ? 0 : 1);
}

main();
