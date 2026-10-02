// ============================================================
// Registry commit provenance contract
//
// Tests the locked contract in DERIVATION-SPEC 3.6. The subject under
// test is a pure decision function: given the validator result, the two
// sets of Registry bytes and the resolved HEAD, decide whether a
// registry_commit may be recorded.
//
// Tests A-C and E exercise that function with synthetic bytes, so no Git
// state is fabricated. Test D additionally reads the real repository
// read-only, to confirm that one Registry blob is genuinely carried by
// more than one commit, which is why the derivation never searches
// history.
// ============================================================

import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  REGISTRY_PATH,
  resolveRegistryCommit,
  type RegistryProvenanceInput,
} from "./registry-provenance";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const HEX40 = "d7447748698c4e851365f59e36d7a7f33994f710";

const bytes = (s: string): Uint8Array => new TextEncoder().encode(s);

function input(over: Partial<RegistryProvenanceInput> = {}): RegistryProvenanceInput {
  return {
    registryValidationPassed: true,
    workingTreeRegistryBytes: bytes("registry: 1"),
    headRegistryBytes: bytes("registry: 1"),
    headCommit: HEX40,
    ...over,
  };
}

// ==PART-A==

describe("registry_commit derivation", () => {
  it("A: yields HEAD when validation passed and the bytes are identical", () => {
    const r = resolveRegistryCommit(input());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.registryCommit).toBe(HEX40);
  });

  it("A: identical empty Registry is eligible too", () => {
    const r = resolveRegistryCommit(
      input({ workingTreeRegistryBytes: bytes(""), headRegistryBytes: bytes("") }),
    );
    expect(r.ok).toBe(true);
  });
});

// ==PART-B==

// ----------------------------------------------------------------
// Test B - dirty Registry is a hard failure
// ----------------------------------------------------------------

describe("registry_commit hard failures", () => {
  it("B: refuses when the working-tree Registry differs from HEAD", () => {
    const r = resolveRegistryCommit(
      input({
        workingTreeRegistryBytes: bytes("registry: 2"),
        headRegistryBytes: bytes("registry: 1"),
      }),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("REGISTRY_DIRTY");
  });

  it("B: refuses on validation failure even when the bytes match", () => {
    const r = resolveRegistryCommit(input({ registryValidationPassed: false }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("REGISTRY_VALIDATION_FAILED");
  });

  it("B: refuses when HEAD cannot be resolved", () => {
    for (const head of [null, ""]) {
      const r = resolveRegistryCommit(input({ headCommit: head }));
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.code).toBe("HEAD_UNRESOLVED");
    }
  });

  it("B: refuses when HEAD carries no Registry at that path", () => {
    const r = resolveRegistryCommit(input({ headRegistryBytes: null }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("REGISTRY_DIRTY");
  });

  it("B: never falls back to another commit or to a blob", () => {
    const r = resolveRegistryCommit(
      input({ workingTreeRegistryBytes: bytes("x"), headRegistryBytes: bytes("y") }),
    );
    expect("registryCommit" in r).toBe(false);
  });
});

// ----------------------------------------------------------------
// Test C - other files being dirty is not a failure
// ----------------------------------------------------------------

describe("working-tree rule", () => {
  it("C: a dirty repository with a clean Registry is eligible", () => {
    const r = resolveRegistryCommit(input());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.registryCommit).toBe(HEX40);
  });

  it("C: the decision function never inspects any other path", () => {
    // Only the Registry bytes and HEAD are inputs. There is no parameter
    // through which unrelated working-tree state could leak in.
    const keys = Object.keys(input()).sort();
    expect(keys).toEqual([
      "headCommit",
      "headRegistryBytes",
      "registryValidationPassed",
      "workingTreeRegistryBytes",
    ]);
  });
});

// ----------------------------------------------------------------
// Test E - source_commit separation
// ----------------------------------------------------------------

describe("source_commit separation", () => {
  it("E: registry_commit is a Git commit SHA, never the source commit", () => {
    const sourceCommit = "3a2680c";
    const r = resolveRegistryCommit(input({ headCommit: HEX40 }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.registryCommit).not.toBe(sourceCommit);
    expect(r.registryCommit).toBe(HEX40);
  });

  it("E: the schema regex admits both shapes but nothing forces equality", () => {
    // research_distribution_registry_commit_hex is ^[0-9a-f]{7,40}$.
    // source_commit shares that shape. They stay distinct by contract,
    // not by type.
    const pattern = /^[0-9a-f]{7,40}$/;
    expect(pattern.test("3a2680c")).toBe(true);
    expect(pattern.test(HEX40)).toBe(true);
    expect(pattern.test("not-a-sha")).toBe(false);
  });
});

// ==PART-D==

// ----------------------------------------------------------------
// Test D - no historical tie-break is performed
// ----------------------------------------------------------------

/** Read-only Git query. Never mutates repository state. */
function git(...args: string[]): string {
  return execFileSync("git", ["-C", REPO_ROOT, ...args], {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

describe("historical search is deliberately not used", () => {
  it("D: the real repository carries one Registry blob in more than one commit", () => {
    // This is the fact that makes the reverse mapping ambiguous: given
    // Registry bytes, no unique commit can be derived, so the contract
    // derives from HEAD instead of searching.
    const log = git("log", "--all", "--format=%H", "--", REGISTRY_PATH);
    const byBlob = new Map<string, string[]>();
    for (const commit of log.split("\n")) {
      if (!commit.trim()) continue;
      try {
        const blob = git("rev-parse", `${commit}:${REGISTRY_PATH}`);
        byBlob.set(blob, [...(byBlob.get(blob) ?? []), commit]);
      } catch {
        // commit does not carry the Registry; nothing to record
      }
    }
    const shared = [...byBlob.values()].filter((v) => v.length > 1);
    expect(shared.length).toBeGreaterThan(0);
  });

  it("D: derivation returns HEAD, never an ancestor or the introduction commit", () => {
    const head = git("rev-parse", "HEAD");
    const r = resolveRegistryCommit(input({ headCommit: head }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.registryCommit).toBe(head);
  });

  it("D: HEAD contains the Registry path the contract names", () => {
    const tree = git("ls-tree", "HEAD", "--", REGISTRY_PATH);
    expect(tree).toContain(REGISTRY_PATH);
    expect(tree).toContain("blob ");
  });
});