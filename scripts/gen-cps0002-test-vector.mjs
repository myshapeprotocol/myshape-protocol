#!/usr/bin/env node
/**
 * Generate the CPS-0002 deterministic test vectors (ALL FOUR).
 *
 * Produces:
 *   continuity-protocol/test-vectors/cps0002/human-signal-01.json            (VALID)
 *   continuity-protocol/test-vectors/cps0002/invalid-modified-signature.json (INVALID_SIGNATURE)
 *   continuity-protocol/test-vectors/cps0002/invalid-wrong-receipt.json      (INVALID_RECEIPT_HASH)
 *   continuity-protocol/test-vectors/cps0002/invalid-expired.json            (EXPIRED)
 *
 * Uses @noble/hashes + @noble/curves only (same deps as onboarding-test.mjs).
 * JCS canonicalization replicated from continuity-protocol/shared/jcs.ts.
 *
 * BATCH-0002-3-F8: payloadDigest is now SHA-256(UTF8(JCS(payload))) — the
 * F7 fix. All four vectors are regenerated so digest + signature are
 * cryptographically coherent under the new definition. The invalid vectors
 * keep internally-valid assertions (valid JCS digest + valid signature);
 * their INVALID reasons come from signature tampering, receipt
 * substitution, and the vector's verifyAt — NOT from stale digests
 * (V2.5 runs before V3/V4, so a stale digest would preempt the intended
 * reason code).
 *
 * Run: node scripts/gen-cps0002-test-vector.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { ed25519 } from "@noble/curves/ed25519.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── JCS Canonicalization (replicated from shared/jcs.ts) ──

function sortForCanonicalization(value) {
  if (Array.isArray(value)) return value.map(sortForCanonicalization);
  if (value !== null && typeof value === "object") {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      const v = value[key];
      if (v === undefined) continue;
      sorted[key] = sortForCanonicalization(v);
    }
    return sorted;
  }
  return value;
}

function canonicalSerialize(value) {
  return JSON.stringify(sortForCanonicalization(value));
}

// ── Crypto Helpers ──

function sha256Hex(data) {
  return bytesToHex(sha256(new TextEncoder().encode(data)));
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// ── Fixed Attester Key (deterministic) ──

const ATTESTER_SECRET_HEX =
  "37e91b18c7b9d3a6f8e4c2b1a0d9f8e7c6b5a4d3e2f1a0b9c8d7e6f5a4b3c2d1";
const ATTESTER_PUBLIC_HEX = bytesToHex(
  ed25519.getPublicKey(hexToBytes(ATTESTER_SECRET_HEX)),
);
const ATTESTER_ID = sha256Hex(ATTESTER_PUBLIC_HEX).slice(0, 16);

// ── Deterministic Assertion ID ──

function createAssertionId(seed) {
  const digest = sha256Hex(seed);
  const hex = digest.slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    "7" + hex.slice(13, 16),
    "8" + hex.slice(16, 19),
    hex.slice(19, 31),
  ].join("-");
}

// ── Main ──

const receiptPath = resolve(__dirname, "../continuity-protocol/test-vectors/valid/single-engine.json");
const receipt = JSON.parse(readFileSync(receiptPath, "utf-8"));

// Compute CPS-0001 receipt hash: SHA-256(JCS(receipt))
const receiptHash = sha256Hex(canonicalSerialize(receipt));

// Deterministic assertion parameters
const assertionSeed = "cps-0002-deterministic";
const evidenceSeed = "cps-0002-toy-deterministic";
const issuedAt = "2026-08-29T00:00:00.000Z";
const expiresAt = "2099-12-31T23:59:59.000Z";

// Toy evidence (matches toyEvidence() in src/index.ts)
const evidencePayload = {
  label: "TOY / PROTOTYPE / NOT PROOF OF HUMAN",
  engine: "CPS-0002 Toy Human Signal Attester",
  version: "0.1-draft",
  challenge: evidenceSeed,
  timestamp: issuedAt,
  note: "This evidence contains no biometric, physiological, or liveness data. Confidence is 0.0 by design.",
};
// F7 fix (BATCH-0002-3-F8): JCS-based digest (RFC 8785), NOT JSON.stringify.
const evidencePayloadDigest = sha256Hex(canonicalSerialize(evidencePayload));

// Assemble assertion (without signature value)
const assertion = {
  protocolType: "cps-hsa-0.1-draft",
  assertionId: createAssertionId(assertionSeed),
  attester: { id: ATTESTER_ID, publicKey: ATTESTER_PUBLIC_HEX },
  subject: {
    id: receipt.subject.id,
    ...(receipt.subject.type ? { type: receipt.subject.type } : {}),
  },
  reference: {
    receiptHash,
    receiptId: receipt.receiptId,
  },
  evidence: {
    engineId: "TOY-HSA-999",
    confidence: 0.0,
    payload: evidencePayload,
    payloadDigest: evidencePayloadDigest,
  },
  validity: { issuedAt, expiresAt },
  signature: {
    algorithm: "Ed25519",
    value: "", // filled below
    signedAt: issuedAt,
  },
};

// Build 12-field canonical assertion payload
const canonicalPayload = [
  assertion.protocolType,
  assertion.assertionId,
  assertion.attester.id,
  assertion.attester.publicKey,
  assertion.subject.id,
  assertion.reference.receiptHash,
  assertion.reference.receiptId,
  assertion.evidence.engineId,
  assertion.evidence.payloadDigest,
  assertion.validity.issuedAt,
  assertion.validity.expiresAt,
  assertion.signature.signedAt,
].join(":");

// Sign with Ed25519
const sig = ed25519.sign(
  new TextEncoder().encode(canonicalPayload),
  hexToBytes(ATTESTER_SECRET_HEX),
);
assertion.signature.value = bytesToHex(sig);

// ── Write vectors ──
const outDir = resolve(__dirname, "../continuity-protocol/test-vectors/cps0002");
mkdirSync(outDir, { recursive: true });

function writeVector(fileName, obj) {
  const p = resolve(outDir, fileName);
  writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
  console.log("Generated:", fileName);
}

// 1) VALID vector (bare assertion — no wrapper)
writeVector("human-signal-01.json", assertion);

// 2) invalid-modified-signature: signature.value first nibble decremented
//    (mod 16). Everything else untouched → V2 fires (INVALID_SIGNATURE)
//    before V2.5, because the signature covers the 12-field input.
const tamperedSig = JSON.parse(JSON.stringify(assertion));
const firstNibble = parseInt(tamperedSig.signature.value[0], 16);
tamperedSig.signature.value =
  ((firstNibble + 15) % 16).toString(16) + tamperedSig.signature.value.slice(1);

writeVector("invalid-modified-signature.json", {
  vectorId: "cps0002-invalid-modified-signature",
  protocol: "cps-hsa-0.1-draft",
  category: "invalid",
  description:
    "Valid CPS-0002 assertion (JCS payloadDigest + valid Ed25519 signature, BATCH-0002-3-F8 regeneration) with the signature.value first hex nibble decremented (mod 16). The signature is tampered directly, so both verifiers must reject it as INVALID_SIGNATURE (V2 precedes V2.5).",
  expect: { status: "INVALID", reason: "INVALID_SIGNATURE" },
  verifyAt: "2026-08-30T00:00:00.000Z",
  assertion: tamperedSig,
  receipt,
});

// 3) invalid-wrong-receipt: valid assertion paired with a receipt whose
//    protocolVersion changed → SHA-256(JCS(receipt)) differs while
//    receiptId and subject.id still match. V2 and V2.5 pass; V3 fires.
const wrongReceipt = JSON.parse(JSON.stringify(receipt));
wrongReceipt.protocolVersion = "9.9";

writeVector("invalid-wrong-receipt.json", {
  vectorId: "cps0002-invalid-wrong-receipt",
  protocol: "cps-hsa-0.1-draft",
  category: "invalid",
  description:
    "Valid CPS-0002 assertion (JCS payloadDigest + valid Ed25519 signature, BATCH-0002-3-F8 regeneration; signature untouched) paired with a DIFFERENT CPS-0001 receipt: only protocolVersion changed to '9.9', which changes the canonical SHA-256(JCS(receipt)) while leaving receiptId and subject.id matching. Expected: INVALID_RECEIPT_HASH (V2 and V2.5 pass first — the assertion itself is internally coherent under the JCS digest rule).",
  expect: { status: "INVALID", reason: "INVALID_RECEIPT_HASH" },
  verifyAt: "2026-08-30T00:00:00.000Z",
  assertion: JSON.parse(JSON.stringify(assertion)),
  receipt: wrongReceipt,
});

// 4) invalid-expired: fully valid assertion, evaluated at verifyAt=2100 —
//    beyond the signed expiresAt. V0/V2/V2.5/V3 pass; V4 fires.
writeVector("invalid-expired.json", {
  vectorId: "cps0002-invalid-expired",
  protocol: "cps-hsa-0.1-draft",
  category: "invalid",
  description:
    "Cryptographically VALID CPS-0002 assertion (JCS payloadDigest + valid Ed25519 signature + valid receipt binding, BATCH-0002-3-F8 regeneration) evaluated at verifyAt=2100-01-01, which is beyond the signed expiresAt (2099-12-31T23:59:59.000Z). Expected: EXPIRED. No signed field was modified; the vector declares the verification time at which the assertion is stale.",
  expect: { status: "INVALID", reason: "EXPIRED" },
  verifyAt: "2100-01-01T00:00:00.000Z",
  assertion: JSON.parse(JSON.stringify(assertion)),
  receipt,
});

console.log("\nSummary:");
console.log("  protocolType:", assertion.protocolType);
console.log("  assertionId:", assertion.assertionId);
console.log("  attester.id:", assertion.attester.id);
console.log("  attester.publicKey:", assertion.attester.publicKey);
console.log("  reference.receiptHash:", assertion.reference.receiptHash);
console.log("  reference.receiptId:", assertion.reference.receiptId);
console.log("  subject.id:", assertion.subject.id);
console.log("  evidence.payloadDigest (JCS):", assertion.evidence.payloadDigest);
console.log("  signature.value:", assertion.signature.value);
console.log("  canonicalPayload:", canonicalPayload);
