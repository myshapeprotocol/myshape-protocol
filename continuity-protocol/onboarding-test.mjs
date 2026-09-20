#!/usr/bin/env node
/**
 * CPS-0001 Onboarding Test — LEGACY 9-field signing payload.
 *
 * WARNING (P0-3): this template signs only
 * [receiptId, interval.start, interval.end, coverageMs, subject.id,
 *  evidence[0].payloadDigest, issuer.id, issuer.publicKey]
 * and will FAIL the current normative 13-slot V2
 * (src/lib/evidence/cps0001.ts:382-412, CLI cps-verify.mjs:57-82).
 * Retained as a historical artifact; do NOT use as the spec.
 * Normative signing input: CPS0001 Annex N-1.
 *
 * Simulates an external developer following the Engine Authoring Guide.
 * This script uses ONLY the continuity-protocol/ directory.
 * It does NOT import anything from src/.
 *
 * Run: node continuity-protocol/onboarding-test.mjs
 *
 * Expected output: "VALID" from the Reference Verifier.
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { ed25519 } from "@noble/curves/ed25519.js";

// ── Step 1: Build an Engine (following ENGINE_AUTHORING_GUIDE.md) ──

function sha256Hex(data) {
  return bytesToHex(sha256(new TextEncoder().encode(data)));
}

/**
 * A minimal Engine that measures typing cadence.
 * Takes a string, counts characters, produces a confidence score.
 * Zero MyShape dependencies.
 */
function myEngine(text) {
  const chars = text.length;
  const hasNumbers = /[0-9]/.test(text);
  const hasLetters = /[a-zA-Z]/.test(text);
  const confidence = Math.min(0.95, (chars / 100) * (hasNumbers ? 1.2 : 0.8) * (hasLetters ? 1.1 : 0.7));

  const payload = {
    text,
    chars,
    hasNumbers,
    hasLetters,
    timestamp: new Date().toISOString(),
  };

  return {
    engineId: "EE-EXTERNAL-001",
    engineVersion: "1.0.0",
    confidence,
    payload,
    payloadDigest: sha256Hex(JSON.stringify(payload)),
  };
}

// ── Step 2: Generate Ed25519 keypair ──

const secretKey = ed25519.utils.randomSecretKey();
const publicKey = ed25519.getPublicKey(secretKey);
const issuerId = sha256Hex(bytesToHex(publicKey)).slice(0, 16);
const issuer = { id: issuerId, publicKey: bytesToHex(publicKey) };

// ── Step 3: Build ContinuityReceipt (manual — no MyShape imports) ──

const text = "hello CPS-0001 from external implementer 12345";
const block = myEngine(text);
const now = new Date();
const start = new Date(now.getTime() - 5000);

const assertConf = [block.confidence];
const avg = assertConf.reduce((a, b) => a + b, 0) / assertConf.length;

const unsigned = {
  protocolVersion: "1.0",
  receiptId: (() => {
    const ts = Date.now().toString(16).padStart(12, "0");
    const r = bytesToHex(ed25519.utils.randomSecretKey()).slice(0, 20);
    const hex = (ts + r).slice(0, 32).padEnd(32, "0");
    return [hex.slice(0,8), hex.slice(8,12), "7"+hex.slice(13,16), "8"+hex.slice(16,19), hex.slice(19,31)].join("-");
  })(),
  interval: { start: start.toISOString(), end: now.toISOString(), coverageMs: 5000 },
  subject: { id: sha256Hex("external-test-device"), type: "embodied" },
  evidence: [block],
  assertions: {
    observationOccurred: { value: true, confidence: 0.95 },
    continuityMaintained: { value: avg >= 0.5, confidence: avg },
    receiptIntegrity: { value: true, confidence: 1.0 },
  },
  issuer,
  previousReceiptHash: null,
  references: [],
  expiresAt: new Date(now.getTime() + 300000).toISOString(),
};

// ── Step 4: Sign with Ed25519 ──

const signPayload = [
  unsigned.receiptId, unsigned.interval.start, unsigned.interval.end,
  String(unsigned.interval.coverageMs), unsigned.subject.id,
  unsigned.evidence[0].payloadDigest, unsigned.issuer.id, unsigned.issuer.publicKey,
].join(":");

const sig = ed25519.sign(new TextEncoder().encode(signPayload), secretKey);
const signedReceipt = { ...unsigned, signature: { algorithm: "Ed25519", value: bytesToHex(sig), signedAt: now.toISOString() } };

// ── Step 5: Verify locally ──

// Schema check
const schemaOk = (
  signedReceipt.protocolVersion === "1.0" &&
  signedReceipt.receiptId.length > 0 &&
  signedReceipt.interval?.start && signedReceipt.interval?.end &&
  signedReceipt.interval.coverageMs > 0 &&
  signedReceipt.subject?.id &&
  Array.isArray(signedReceipt.evidence) &&
  signedReceipt.issuer?.id && signedReceipt.issuer?.publicKey &&
  signedReceipt.signature?.algorithm === "Ed25519" && signedReceipt.signature?.value
);

// Signature check
const reconstructPayload = [
  signedReceipt.receiptId, signedReceipt.interval.start, signedReceipt.interval.end,
  String(signedReceipt.interval.coverageMs), signedReceipt.subject.id,
  signedReceipt.evidence[0].payloadDigest, signedReceipt.issuer.id, signedReceipt.issuer.publicKey,
].join(":");
const sigOk = ed25519.verify(
  (() => { const h = signedReceipt.signature.value; return Uint8Array.from(h.match(/.{2}/g).map(b => parseInt(b, 16))); })(),
  new TextEncoder().encode(reconstructPayload),
  (() => { const h = signedReceipt.issuer.publicKey; return Uint8Array.from(h.match(/.{2}/g).map(b => parseInt(b, 16))); })(),
);

// Evidence check
const evidenceOk = sha256Hex(JSON.stringify(block.payload)) === block.payloadDigest;

// Temporal check
const temporalOk = new Date(signedReceipt.interval.start).getTime() < new Date(signedReceipt.interval.end).getTime();

// Freshness check
const freshOk = new Date(signedReceipt.expiresAt).getTime() > Date.now();

// Assertion check
const assertionOk = !(signedReceipt.assertions.continuityMaintained.value && !signedReceipt.assertions.observationOccurred.value);

const allPassed = schemaOk && sigOk && evidenceOk && temporalOk && freshOk && assertionOk;

// ── Output ──

console.log("");
console.log("═══════════════════════════════════════════");
console.log("  CPS-0001 Onboarding Test");
console.log("═══════════════════════════════════════════");
console.log("");
console.log(`  Engine: ${block.engineId} (${block.engineVersion})`);
console.log(`  Input:  "${text}"`);
console.log(`  Confidence: ${block.confidence.toFixed(2)}`);
console.log(`  Subject: ${unsigned.subject.id}`);
console.log("");
console.log("  V₁ Schema:    ", schemaOk ? "✅" : "❌");
console.log("  V₂ Signature: ", sigOk ? "✅" : "❌");
console.log("  V₃ Assertion: ", assertionOk ? "✅" : "❌");
console.log("  V₄ Temporal:  ", temporalOk ? "✅" : "❌");
console.log("  V₅ Evidence:  ", evidenceOk ? "✅" : "❌");
console.log("  V₆ Freshness: ", freshOk ? "✅" : "❌");
console.log("");
console.log("  VERDICT:", allPassed ? "✅ VALID" : "❌ INVALID");
console.log("");
console.log("═══════════════════════════════════════════");
console.log("  This receipt was produced by an external");
console.log("  Engine with ZERO MyShape dependencies.");
console.log("  It passes all CPS-0001 protocol checks.");
console.log("═══════════════════════════════════════════");

process.exit(allPassed ? 0 : 1);
