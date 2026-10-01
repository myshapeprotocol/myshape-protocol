/**
 * Phase 1.5 — RN-002 registry pilot verification.
 *
 * These tests exercise the reader end to end through its real on-disk path
 * (`process.cwd()/research-assets/registry`), so a regression in the static
 * path pattern would fail here rather than silently at runtime.
 *
 * The path-traversal case is a security invariant carried over from the B2
 * finding: no caller-supplied string may reach path.join unfiltered.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  getRegistryRecord,
  parseRegistryRecord,
  SUPPORTED_ASSET_TYPES,
  DECLARED_STATES,
} from "./research-registry";

const VALID = {
  asset_id: "RN-002",
  asset_type: "research_note",
  canonical_source: "papers/rn-002/pes-benchmark-v0.2-article.md",
  version: "v0.2",
  declared_state: "IN_REVIEW",
} as const;

describe("getRegistryRecord", () => {
  it("resolves RN-002 with the values fixed by the Phase 1.4D contract", () => {
    const record = getRegistryRecord("RN-002");
    expect(record).not.toBeNull();
    expect(record).toEqual({
      asset_id: "RN-002",
      asset_type: "research_note",
      canonical_source: "papers/rn-002/pes-benchmark-v0.2-article.md",
      version: "v0.2",
      declared_state: "IN_REVIEW",
    });
  });

  it("reads the record through the static research-assets path", () => {
    const expected = path.join(
      process.cwd(),
      "research-assets",
      "registry",
      "RN-002.json",
    );
    expect(fs.existsSync(expected)).toBe(true);
    expect(getRegistryRecord("RN-002")).not.toBeNull();
  });

  it("exposes exactly the five contract fields and no content", () => {
    const record = getRegistryRecord("RN-002");
    expect(Object.keys(record!).sort()).toEqual([
      "asset_id",
      "asset_type",
      "canonical_source",
      "declared_state",
      "version",
    ]);
  });

  it("returns null for an unregistered asset", () => {
    expect(getRegistryRecord("RN-999")).toBeNull();
  });

  it("rejects caller-supplied path traversal before building a path", () => {
    expect(getRegistryRecord("../../package")).toBeNull();
    expect(getRegistryRecord("..%2f..%2fpackage")).toBeNull();
    expect(getRegistryRecord("registry/RN-002")).toBeNull();
  });
});

describe("parseRegistryRecord", () => {
  it("accepts a contract-conformant payload", () => {
    expect(parseRegistryRecord(VALID)).toEqual(VALID);
  });

  it("fails closed on an asset_type outside the supported set", () => {
    for (const type of ["dataset", "EXPERIMENT", "rn", ""]) {
      expect(parseRegistryRecord({ ...VALID, asset_type: type })).toBeNull();
    }
  });

  it("fails closed when declared_state claims approval", () => {
    expect(parseRegistryRecord({ ...VALID, declared_state: "APPROVED" })).toBeNull();
    expect(parseRegistryRecord({ ...VALID, declared_state: "PUBLISHED" })).toBeNull();
  });

  it("rejects every declared_state outside the exact enum", () => {
    // Case, whitespace and type drift must all fail closed — the enum is an
    // exact-match allowlist, not a normaliser.
    const rejected = [
      "approved",
      "published",
      "in_review",
      "draft",
      "IN REVIEW",
      " IN_REVIEW",
      "IN_REVIEW ",
      "ARCHIVED",
      "RETRACTED",
      "",
      "DRAFT;APPROVED",
    ];
    for (const state of rejected) {
      expect(parseRegistryRecord({ ...VALID, declared_state: state })).toBeNull();
    }
    for (const state of [null, 0, 1, true, ["IN_REVIEW"], { value: "IN_REVIEW" }]) {
      expect(parseRegistryRecord({ ...VALID, declared_state: state })).toBeNull();
    }
  });

  it("accepts only the two declared enum values", () => {
    for (const state of DECLARED_STATES) {
      expect(parseRegistryRecord({ ...VALID, declared_state: state })).not.toBeNull();
    }
  });

  it("fails closed when a required field is missing or empty", () => {
    for (const key of Object.keys(VALID)) {
      const without = { ...VALID } as Record<string, unknown>;
      delete without[key];
      expect(parseRegistryRecord(without)).toBeNull();

      expect(parseRegistryRecord({ ...VALID, [key]: "" })).toBeNull();
    }
  });

  it("fails closed on a non-object payload", () => {
    expect(parseRegistryRecord(null)).toBeNull();
    expect(parseRegistryRecord("RN-002")).toBeNull();
    expect(parseRegistryRecord(undefined)).toBeNull();
  });
});

describe("registry vocabulary", () => {
  it("pins the pilot supported values", () => {
    expect([...SUPPORTED_ASSET_TYPES]).toEqual(["research_note", "benchmark"]);
    expect([...DECLARED_STATES]).toEqual(["DRAFT", "IN_REVIEW"]);
  });
});

describe("RN-002 drift check", () => {
  it("canonical_source points at a file that exists", () => {
    const record = getRegistryRecord("RN-002");
    expect(record).not.toBeNull();
    const source = path.join(process.cwd(), record!.canonical_source);
    expect(fs.existsSync(source)).toBe(true);
  });
});

describe("reader safeguards", () => {
  const READER_PATH = path.join(
    process.cwd(),
    "src",
    "lib",
    "research-registry.ts",
  );

  /**
   * Source assertions run against code with comments stripped. The reader's
   * own doc comments deliberately *name* the banned constructs in order to
   * warn against them, so a raw substring scan would flag the warning itself.
   */
  function code(): string {
    return fs
      .readFileSync(READER_PATH, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
  }

  it("does not introduce directory scanning", () => {
    // Resolution must stay a single addressed file read. Enumeration APIs are
    // banned outright: they would both widen the surface and reintroduce the
    // whole-project NFT tracing that B4.5 identified.
    const src = code();
    for (const api of [
      "readdir",
      "opendir",
      "withFileTypes",
      "glob",
    ]) {
      expect(src).not.toContain(api);
    }
  });

  it("does not hide its filesystem access from static analysis", () => {
    // A statically scoped cwd subfolder is what Next/NFT traces into the
    // route bundle. Computed or hidden access would silently lose the file.
    const src = code();
    expect(src).toContain('path.join(process.cwd(), "research-assets")');
    expect(src).not.toContain("new Function");
    expect(src).not.toMatch(/\brequire\s*\(/);
  });

  it("resolves exactly one file per lookup", () => {
    // The only filesystem calls permitted are the single-file pair.
    const calls = code().match(/fs\.\w+/g) ?? [];
    expect(new Set(calls)).toEqual(new Set(["fs.existsSync", "fs.readFileSync"]));
  });
});
