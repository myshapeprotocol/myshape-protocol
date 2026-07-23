// ═══════════════════════════════════════════════════════════════════
// Minimal CPS-0001 Producer
//
// This is the simplest possible CPS-0001 producer.
// Zero dependencies. Zero MyShape code. ~60 lines.
//
// It generates a valid Continuity Receipt that passes V₁–V₆.
// ═══════════════════════════════════════════════════════════════════

import crypto from "node:crypto";
import { writeFileSync } from "node:fs";

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function createReceiptId() {
  const ts = Date.now().toString(16).padStart(12, "0");
  const rand = Array.from({ length: 20 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
  const hex = (ts + rand).slice(0, 32).padEnd(32, "0");
  return [
    hex.slice(0, 8), hex.slice(8, 12),
    "7" + hex.slice(13, 16),
    "8" + hex.slice(16, 19),
    hex.slice(19, 31),
  ].join("-");
}

// ── Your evidence goes here ──────────────────────────────────────
// This is the engine-specific part. Replace with real sensor data.
const result = 0.72; // your confidence score [0, 1]

const payload = {
  algorithm: "simple-motion-estimate",
  score: result,
  samples: 240,
  capturedAt: new Date().toISOString(),
};

const payloadDigest = sha256(JSON.stringify(payload));
// ─────────────────────────────────────────────────────────────────

const startTime = new Date(Date.now() - 8000);
const endTime = new Date();

const receipt = {
  protocolVersion: "1.0",
  receiptId: createReceiptId(),

  interval: {
    start: startTime.toISOString(),
    end: endTime.toISOString(),
    coverageMs: endTime.getTime() - startTime.getTime(),
  },

  subject: {
    id: "sha256:" + sha256("my-producer-demo").slice(0, 16),
    type: "embodied",
  },

  evidence: [
    {
      engineId: "com.example.my-producer",
      engineVersion: "0.1.0",
      confidence: result,
      payload,
      payloadDigest,
    },
  ],

  assertions: {
    observationOccurred: { value: true, confidence: 0.95 },
    continuityMaintained: {
      value: result >= 0.5,
      confidence: result,
    },
    receiptIntegrity: { value: true, confidence: 1.0 },
  },

  expiresAt: new Date(endTime.getTime() + 300_000).toISOString(),
  previousReceiptHash: null,
  references: [],

  issuer: {
    id: "sha256:my-producer",
    publicKey: "demo-unsigned",
  },

  signature: {
    algorithm: "unsigned",
    value: "cps-0001-demonstration",
    signedAt: endTime.toISOString(),
  },
};

const outPath = "my-cps-0001-receipt.json";
writeFileSync(outPath, JSON.stringify(receipt, null, 2));
console.log("✅ Receipt saved to", outPath);
console.log("   receiptId:", receipt.receiptId);
console.log("   confidence:", result);
console.log("   blocks:", receipt.evidence.length);
