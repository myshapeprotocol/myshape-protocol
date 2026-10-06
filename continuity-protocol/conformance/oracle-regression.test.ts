// ═══════════════════════════════════════════════════════════════════
// CPS-0001 oracle-regression harness  (H-2 conformance coverage + H-3 oracle assertions)
//
// Evidence boundary, one direction only:
//
//   frozen vector bytes -> published expected-results.json -> implementation -> compare
//
// The published oracle is the SOLE source of expected values. This file contains
// NO inline CPS-0001 expected result, NO second protocol verifier, and NO
// redefinition of V1-V7. The only hardcoded data is the vector SHA-256 identity
// anchor below, which is an integrity anchor, not an expected outcome.
//
// Fail-closed: any missing artefact, hash drift, oracle/vector disagreement or
// per-check mismatch throws. There is no skip, no fallback and no write path to
// the oracle.
//
// Time: every time-dependent call receives the oracle's published
// `evaluationTime`. `verifyReceipt()` is deliberately NOT used because it takes
// no injectable `now`; P1-1 remains a separate tracked item.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  verifySchema,
  verifySignature,
  verifyAssertions,
  verifyTemporal,
  verifyEvidenceIntegrity,
  verifyFreshness,
  verifyPredecessor,
} from "@/lib/evidence/cps0001";
import { MemoryChainStore } from "@/lib/evidence/chain-store";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTOCOL_DIR = path.join(__dirname, "..");
const VECTORS_DIR = path.join(PROTOCOL_DIR, "test-vectors");
const ORACLE_PATH = path.join(PROTOCOL_DIR, "expected-results.json");

// Sole source of expected results. Loaded at runtime; never rewritten here.
const ORACLE = JSON.parse(readFileSync(ORACLE_PATH, "utf8"));
const NOW = Date.parse(ORACLE.evaluationTime);

const CHECKS = ["V1", "V2", "V3", "V4", "V5", "V6", "V7"] as const;

// Vector SHA-256 identity anchors. Integrity anchors only, mirroring
// continuity-protocol/VECTOR-INVENTORY.md. Not expected outcomes.
const VECTOR_SHA256: Record<string, string> = {
  "test-vectors/valid/single-engine.json":
    "65f528e08b7f4471c39ce088ed675f26ebd9d12a8fa9db589c9c6ff5aeca66f8",
  "test-vectors/valid/multi-engine.json":
    "0693d58449603ee3d5f69bbbd529ae57179bf7e1c309eaab75e055904076ef26",
  "test-vectors/valid/n2-predecessor.json":
    "1c3eb7ebe02728fb60258478a8ad9359a92b0981e5f01d091e79acf766d770ff",
  "test-vectors/valid/agent-trace.json":
    "5f715cd458970213c0ec0bb0e943d607e9448bb3e740e4d486212171cb4b3788",
  "test-vectors/invalid/expired.json":
    "2374d75a73809c7d93f482277b519b1c0eef8aa4c6a9783346a43944abc07672",
  "test-vectors/invalid/tampered-evidence.json":
    "4a6367340e54841394c8d1d15b57f4c56095885198d6ccd629afadbba95f3c1b",
  "test-vectors/invalid/broken-chain.json":
    "8bb675d2192b49d2ad14c9ba93f4be5ea86e54464874f15478e47b063210af26",
  "test-vectors/invalid/inconsistent-assertions.json":
    "b1cabcfdd094d0b3750ae11f547c79bbeb2cb6596ece9ae695e5dead701a6441",
  "test-vectors/invalid/subject-mismatch.json":
    "2a4d79d8cf435fc4b062226a5b7864f40ad4d47f2496f1182534788d4db9f4bc",
  "test-vectors/invalid/issuer-mismatch.json":
    "b294cf99447fd24c0b01e9ff694f77adc282954c6497f7bc2af0d450232b6d26",
  "test-vectors/invalid/chain-temporal-violation.json":
    "7d1ce03a891f22815e00136a3f22a79ee7a2feec1a48e336e76aeffc13b275ff",
};

const abs = (relToProtocol: string) => path.join(PROTOCOL_DIR, relToProtocol);
const sha256File = (absPath: string) =>
  createHash("sha256").update(readFileSync(absPath)).digest("hex");

// Parse every oracle-declared vector. Missing file => throw (fail closed).
const receipts = new Map<string, any>();
for (const v of ORACLE.vectors) receipts.set(v.file, JSON.parse(readFileSync(abs(v.file), "utf8")));

// Trusted store built from oracle-declared bindings only. Every published vector
// is indexed under its own canonical hash so a declared predecessor resolves.
const store = new MemoryChainStore();
for (const v of ORACLE.vectors) store.store(receipts.get(v.file));

const bindingFor = (child: string) =>
  (ORACLE.predecessorBindings?.bindings ?? []).find((b: any) => b.child === child);

// null => PASS, any failure code => FAIL
const outcome = (result: string | null): "PASS" | "FAIL" => (result === null ? "PASS" : "FAIL");

// First failing check in the oracle's declared normative order.
function firstFailingCheck(actual: Record<string, string>): string | null {
  for (const k of ORACLE.checkOrder) if (actual[k] === "FAIL") return k;
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// L3 — vector identity and predecessor binding integrity
// ═══════════════════════════════════════════════════════════════════

describe("L3 — frozen vector identity", () => {
  it("oracle declares exactly the 11 anchored vectors, no more, no fewer", () => {
    const declared = ORACLE.vectors.map((v: any) => v.file).sort();
    expect(declared).toEqual(Object.keys(VECTOR_SHA256).sort());
    expect(declared).toHaveLength(11);
  });

  for (const [rel, expectedHash] of Object.entries(VECTOR_SHA256)) {
    it(`vector bytes unchanged: ${rel}`, () => {
      expect(sha256File(abs(rel))).toBe(expectedHash);
    });
  }

  it("every oracle entry resolves to a readable vector file", () => {
    for (const v of ORACLE.vectors) {
      expect(receipts.has(v.file), `vector file unreadable: ${v.file}`).toBe(true);
    }
  });
});

describe("L3 — oracle-declared predecessor bindings", () => {
  const bindings = ORACLE.predecessorBindings?.bindings ?? [];

  it("oracle publishes predecessor bindings", () => {
    expect(Array.isArray(bindings)).toBe(true);
    expect(bindings.length).toBeGreaterThan(0);
  });

  for (const b of bindings) {
    it(`binding: ${b.child} <- ${b.predecessor}`, () => {
      // Both endpoints must exist as published vectors.
      expect(receipts.has(b.child), `child vector missing: ${b.child}`).toBe(true);
      expect(receipts.has(b.predecessor), `predecessor vector missing: ${b.predecessor}`).toBe(true);
      // The child pointer must equal the published predecessorHash (pure data vs data).
      expect(receipts.get(b.child).previousReceiptHash).toBe(b.predecessorHash);
      // The declared predecessor artefact must actually resolve under that hash.
      expect(store.resolve(b.predecessorHash), `predecessor artefact unresolvable: ${b.predecessor}`).toBeTruthy();
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// L1 — oracle self-consistency (integrity of published fields only)
//
// Mechanical only: walk the oracle's own declared checkOrder over the oracle's
// own per-check fields and confirm the resulting verdict matches the oracle's
// own verdict, and that failureCode is non-null exactly when the verdict is
// INVALID. The exact failure code per check is verified by L2, not re-derived
// here — this layer deliberately does not encode a per-check code table, which
// would amount to re-deriving protocol semantics.
// ═══════════════════════════════════════════════════════════════════

describe("L1 — oracle self-consistency", () => {
  for (const v of ORACLE.vectors) {
    it(`oracle is internally consistent: ${v.file}`, () => {
      const oracleActual: Record<string, string> = {};
      for (const k of CHECKS) oracleActual[k] = v[k];
      const firstFail = firstFailingCheck(oracleActual);
      const derivedVerdict = firstFail ? "INVALID" : "VALID";
      expect(derivedVerdict, `verdict disagrees with oracle's own per-check fields`).toBe(v.verdict);
      // null failureCode <=> VALID. The specific code is bound by L2.
      expect(v.failureCode === null, `failureCode nullness disagrees with verdict`).toBe(v.verdict === "VALID");
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// L2 — PRIMARY: implementation per-check vs published oracle
//
// Expected values come only from expected-results.json. The implementation
// supplies the observed per-check outcomes and the observed first-failure code;
// those are then compared against the oracle. Disagreement fails the test.
//
// For a non-genesis vector with no published predecessor binding, V7 is FAIL and
// the code is PREDECESSOR_MISSING, transcribed from the oracle's own published
// `v7FailClosed` rule. That literal is a transcription, not a new rule: the
// assertion below still compares it against the oracle, so changing the oracle
// fails here rather than silently following.


const V7_FAIL_CLOSED_CODE = "PREDECESSOR_MISSING"; // from oracle.v7FailClosed

function evaluateDetailed(file: string) {
  const r = receipts.get(file);
  const results: Record<string, string> = {};
  const codes: Record<string, string | null> = {};

  const put = (k: string, raw: string | null) => {
    results[k] = outcome(raw);
    codes[k] = raw;
  };

  put("V1", verifySchema(r));
  put("V2", verifySignature(r));

  if (r.previousReceiptHash === null) {
    results.V7 = "N/A";
    codes.V7 = null;
  } else {
    const b = bindingFor(file);
    if (!b) {
      results.V7 = "FAIL";
      codes.V7 = V7_FAIL_CLOSED_CODE;
    } else {
      const predecessor = store.resolve(b.predecessorHash);
      if (!predecessor) throw new Error(`predecessor artefact unresolvable for ${file}`);
      put("V7", verifyPredecessor(r, predecessor));
    }
  }

  put("V3", verifyAssertions(r));
  put("V4", verifyTemporal(r, NOW));
  put("V5", verifyEvidenceIntegrity(r));
  put("V6", verifyFreshness(r, NOW));

  const firstFail = firstFailingCheck(results);
  return {
    results,
    firstFail,
    verdict: firstFail ? "INVALID" : "VALID",
    code: firstFail ? codes[firstFail] ?? null : null,
  };
}

describe("L2 — implementation vs published oracle (all 11 vectors)", () => {
  for (const v of ORACLE.vectors) {
    it(`${v.file}: V1-V7, verdict and failureCode match the oracle`, () => {
      const d = evaluateDetailed(v.file);
      for (const k of CHECKS) {
        expect(d.results[k], `${v.file} ${k}`).toBe(v[k]);
      }
      expect(d.verdict, `${v.file} verdict`).toBe(v.verdict);
      expect(d.code, `${v.file} failureCode`).toBe(v.failureCode);
    });
  }

  it("covers exactly 11 vectors through this layer", () => {
    expect(ORACLE.vectors).toHaveLength(11);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Agent-trace regression guard (the historical P0-1 failure mode)
// ═══════════════════════════════════════════════════════════════════

describe("agent-trace — genesis must not be treated as non-genesis", () => {
  const FILE = "test-vectors/valid/agent-trace.json";

  it("the receipt is genesis: previousReceiptHash === null", () => {
    expect(receipts.get(FILE).previousReceiptHash).toBeNull();
  });

  it("V7 is N/A and is not evaluated as a chain check", () => {
    const d = evaluateDetailed(FILE);
    expect(d.results.V7).toBe("N/A");
  });

  it("first failure is V6 and the oracle failureCode is EXPIRED", () => {
    const d = evaluateDetailed(FILE);
    const o = ORACLE.vectors.find((x: any) => x.file === FILE);
    expect(d.results.V6).toBe("FAIL");
    expect(d.firstFail).toBe("V6");
    expect(d.code).toBe(o.failureCode);
    expect(d.verdict).toBe("INVALID");
  });
});

// ═══════════════════════════════════════════════════════════════════
// N-2 predecessor-bound family
// ═══════════════════════════════════════════════════════════════════

describe("N-2 predecessor-bound family", () => {
  const n2Children = (ORACLE.predecessorBindings?.bindings ?? [])
    .map((b: any) => b.child)
    .filter((f: string) => f.includes("subject-mismatch") || f.includes("issuer-mismatch") || f.includes("chain-temporal-violation"));

  it("oracle binds the three N-2 children to the dedicated predecessor", () => {
    expect(n2Children).toHaveLength(3);
  });

  for (const child of n2Children) {
    it(`${child}: resolves its declared predecessor and matches oracle V7`, () => {
      const b = bindingFor(child);
      expect(b, `no oracle binding for ${child}`).toBeTruthy();
      const predecessor = store.resolve(b.predecessorHash);
      expect(predecessor, `predecessor unresolvable for ${child}`).toBeTruthy();
      const o = ORACLE.vectors.find((x: any) => x.file === child);
      const d = evaluateDetailed(child);
      expect(d.results.V7).toBe(o.V7);
      expect(d.code).toBe(o.failureCode);
    });
  }

  it("inconsistent-assertions is genesis: V7 N/A, V3 supplies the code", () => {
    const file = "test-vectors/invalid/inconsistent-assertions.json";
    const d = evaluateDetailed(file);
    const o = ORACLE.vectors.find((x: any) => x.file === file);
    expect(receipts.get(file).previousReceiptHash).toBeNull();
    expect(d.results.V7).toBe("N/A");
    expect(d.firstFail).toBe("V3");
    expect(d.code).toBe(o.failureCode);
  });
});
