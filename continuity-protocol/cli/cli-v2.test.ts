/**
 * Batch-2F — CLI V₂ canonical signing payload parity.
 *
 * Proves the CLI (continuity-protocol/cli/bin/cps-verify.mjs) verifies
 * receipts signed by the main implementation (src/lib/evidence/cps0001.ts)
 * using the 13-field canonical signing payload — and rejects any tamper of
 * a signed field.
 *
 * This is an end-to-end process test: a REAL receipt is built + signed by
 * the main implementation, serialized to JSON, piped into the CLI over stdin,
 * and the CLI's exit code / output is asserted.
 */

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { generateKeyPair, createIssuerIdentity } from "@/lib/crypto";
import {
  buildReceipt,
  signReceipt,
  computePayloadDigest,
  type ContinuityReceipt,
} from "@/lib/evidence/cps0001";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, "bin", "cps-verify.mjs");

function runCli(receipt: ContinuityReceipt): { status: number | null; stdout: string } {
  const res = spawnSync(process.execPath, [CLI_PATH], {
    input: JSON.stringify(receipt),
    encoding: "utf-8",
    timeout: 30_000,
  });
  return { status: res.status, stdout: res.stdout ?? "" };
}

/** Build a REAL receipt signed by the main implementation's 13-field payload. */
function makeSignedReceipt(): ContinuityReceipt {
  const kp = generateKeyPair();
  const issuer = createIssuerIdentity(kp);

  // Deterministic completed window (end strictly in the past so V₄ future-interval
  // check passes regardless of wall-clock drift between build and verify).
  const endT = Date.now() - 5_000;
  const payload = { seed: "cli-conformance", n: 42 };
  const unsigned = buildReceipt({
    evidence: [
      {
        engineId: "EE-999",
        engineVersion: "1.0.0",
        confidence: 0.8,
        payload,
        payloadDigest: computePayloadDigest(payload),
      },
    ],
    interval: {
      start: new Date(endT - 8_000).toISOString(),
      end: new Date(endT).toISOString(),
      coverageMs: 8_000,
    },
    subject: { id: "cli-subject", type: "device" },
    issuer,
    verdict: "PASS",
  });
  return signReceipt(unsigned, kp.secretKey);
}

describe("CLI V₂ — 13-field canonical signing payload parity", () => {
  const valid = makeSignedReceipt();

  it("Positive: main-implementation signed receipt → CLI exits 0 / VALID", () => {
    const { status, stdout } = runCli(valid);
    expect(status).toBe(0);
    expect(stdout).toContain("VALID");
  });

  it("tampered protocolVersion → CLI rejects (exit ≠ 0)", () => {
    const r: ContinuityReceipt = structuredClone(valid);
    r.protocolVersion = "2.0";
    expect(runCli(r).status).not.toBe(0);
  });

  it("tampered expiresAt → CLI rejects (exit ≠ 0)", () => {
    const r: ContinuityReceipt = structuredClone(valid);
    r.expiresAt = "2099-12-31T23:59:59.999Z";
    expect(runCli(r).status).not.toBe(0);
  });

  it("tampered assertions → CLI rejects (exit ≠ 0)", () => {
    const r: ContinuityReceipt = structuredClone(valid);
    r.assertions.observationOccurred.confidence = 0.123;
    expect(runCli(r).status).not.toBe(0);
  });

  it("tampered verdict → CLI rejects (exit ≠ 0)", () => {
    const r: ContinuityReceipt = structuredClone(valid);
    r.verdict = "FAIL";
    expect(runCli(r).status).not.toBe(0);
  });

  it("tampered references → CLI rejects (exit ≠ 0)", () => {
    const r: ContinuityReceipt = structuredClone(valid);
    r.references = ["attacker-controlled-ref"];
    expect(runCli(r).status).not.toBe(0);
  });

  it("tampered coverageMs → CLI rejects (exit ≠ 0)", () => {
    const r: ContinuityReceipt = structuredClone(valid);
    r.interval.coverageMs = valid.interval.coverageMs - 1;
    expect(runCli(r).status).not.toBe(0);
  });
});

function runCliFile(relative: string): { status: number | null; stdout: string; stderr: string } {
  const p = path.join(__dirname, "..", "test-vectors", relative);
  const res = spawnSync(process.execPath, [CLI_PATH, p], { encoding: "utf-8", timeout: 30_000 });
  return { status: res.status, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}

/** Same as makeSignedReceipt but non-genesis: previousReceiptHash !== null.
 *  previousReceiptHash is UNSIGNED in CPS-0001 Annex N-1, so the receipt stays valid. */
function makeSignedNonGenesis(prevHash = "0".repeat(64)): ContinuityReceipt {
  const kp = generateKeyPair();
  const endT = Date.now() - 5_000;
  const payload = { seed: "cli-non-genesis", n: 7 };
  const unsigned = buildReceipt({
    evidence: [
      {
        engineId: "EE-999",
        engineVersion: "1.0.0",
        confidence: 0.8,
        payload,
        payloadDigest: computePayloadDigest(payload),
      },
    ],
    interval: {
      start: new Date(endT - 8_000).toISOString(),
      end: new Date(endT).toISOString(),
      coverageMs: 8_000,
    },
    subject: { id: "cli-subject", type: "device" },
    issuer: createIssuerIdentity(kp),
    verdict: "PASS",
    previousReceiptHash: prevHash,
  });
  return signReceipt(unsigned, kp.secretKey);
}

// ═══════════════════════════════════════════════════════════════════
// Batch-4 receipt-local contract: genesis vs non-genesis, INCOMPLETE.
// ═══════════════════════════════════════════════════════════════════

describe("CLI receipt-local contract — genesis vs non-genesis", () => {
  it("1. genesis + V1-V6 pass -> VALID / exit 0", () => {
    const r = makeSignedReceipt();
    expect(r.previousReceiptHash).toBeNull();
    const { status, stdout } = runCli(r);
    expect(status).toBe(0);
    expect(stdout).toContain("VALID");
    expect(stdout).not.toContain("INCOMPLETE");
  });

  it("2. non-genesis + V1-V6 pass -> INCOMPLETE / exit 3 (never VALID)", () => {
    const r = makeSignedNonGenesis();
    expect(r.previousReceiptHash).not.toBeNull();
    const { status, stdout } = runCli(r);
    expect(status).toBe(3);
    expect(stdout).toContain("INCOMPLETE");
    // The critical regression guard: it must NOT claim VALID.
    expect(stdout).not.toMatch(/VERDICT: ✅ VALID/);
    expect(stdout).toContain("NOT EVALUATED");
  });

  it("3. non-genesis + local V1-V6 failure -> INVALID / exit 1", () => {
    const r = makeSignedNonGenesis();
    r.assertions.observationOccurred.confidence = 0.123; // breaks V2 signature
    const { status, stdout } = runCli(r);
    expect(status).toBe(1);
    expect(stdout).toContain("INVALID");
    expect(stdout).not.toContain("INCOMPLETE");
  });

  it("5. usage error preserves exit 2, invalid JSON preserves exit 1", () => {
    const missing = spawnSync(process.execPath, [CLI_PATH, path.join(__dirname, "no-such-file.json")], {
      encoding: "utf-8", timeout: 30_000,
    });
    expect(missing.status).toBe(2);

    const bad = spawnSync(process.execPath, [CLI_PATH], { input: "{not json", encoding: "utf-8", timeout: 30_000 });
    expect(bad.status).toBe(1);
  });
});

describe("CLI receipt-local contract — frozen vectors", () => {
  it("4. broken-chain -> INVALID / exit 1 (local reason is NOT canonical CHAIN_BROKEN)", () => {
    const { status, stdout } = runCliFile("invalid/broken-chain.json");
    expect(status).toBe(1);
    expect(stdout).toContain("INVALID");
    // V7 is normative and unevaluated here. The tool must not claim it ran V7,
    // and its local reason must not be presented as the canonical code.
    expect(stdout).toContain("NOT EVALUATED");
    expect(stdout).toContain("NOT necessarily the canonical CPS-0001 first-failure code");
    expect(stdout).not.toContain("VERDICT: ✅ VALID");
  });

  it("6. subject-mismatch -> INCOMPLETE / exit 3, not VALID", () => {
    const { status, stdout } = runCliFile("invalid/subject-mismatch.json");
    expect(status).toBe(3);
    expect(stdout).toContain("INCOMPLETE");
    expect(stdout).not.toMatch(/VERDICT: ✅ VALID/);
  });

  it("6b. issuer-mismatch -> INCOMPLETE / exit 3, not VALID", () => {
    const { status, stdout } = runCliFile("invalid/issuer-mismatch.json");
    expect(status).toBe(3);
    expect(stdout).toContain("INCOMPLETE");
    expect(stdout).not.toMatch(/VERDICT: ✅ VALID/);
  });

  it("6c. chain-temporal-violation -> INCOMPLETE / exit 3, not VALID", () => {
    const { status, stdout } = runCliFile("invalid/chain-temporal-violation.json");
    expect(status).toBe(3);
    expect(stdout).toContain("INCOMPLETE");
    expect(stdout).not.toMatch(/VERDICT: ✅ VALID/);
  });

  it("genesis vectors still VALID: single-engine, n2-predecessor", () => {
    for (const v of ["valid/single-engine.json", "valid/n2-predecessor.json"]) {
      const { status, stdout } = runCliFile(v);
      expect(status, v).toBe(0);
      expect(stdout, v).toContain("VALID");
    }
  });

  it("genetically-invalid vectors still INVALID: expired, tampered, inconsistent-assertions", () => {
    for (const v of [
      "invalid/expired.json",
      "invalid/tampered-evidence.json",
      "invalid/inconsistent-assertions.json",
    ]) {
      const { status, stdout } = runCliFile(v);
      expect(status, v).toBe(1);
      expect(stdout, v).toContain("INVALID");
    }
  });

  it("non-genesis valid/multi-engine -> INCOMPLETE / exit 3 (V7 unevaluated)", () => {
    const { status, stdout } = runCliFile("valid/multi-engine.json");
    expect(status).toBe(3);
    expect(stdout).toContain("INCOMPLETE");
  });

  it("INCOMPLETE is labelled as a tool status, not a protocol failureCode", () => {
    const { stdout } = runCliFile("invalid/subject-mismatch.json");
    expect(stdout).toContain("TOOL status");
    expect(stdout).toContain("not a CPS-0001 failureCode");
    expect(stdout).toContain("not equivalent to the protocol V7 N/A");
  });
});