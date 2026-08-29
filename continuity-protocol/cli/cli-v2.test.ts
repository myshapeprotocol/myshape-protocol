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