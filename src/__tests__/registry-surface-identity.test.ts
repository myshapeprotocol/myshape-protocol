// ============================================================
// Registry surface identity contract
//
// Pins the surface identity contract declared in the canonical
// Registry (docs/research-assets.registry.yaml):
//
//   surface_id    stable identity of a destination surface,
//                 globally stable across Registry versions
//   brand         the brand that owns that surface
//   canonical_url canonical public location
//   route_path    repository/site routing location
//
// Two rules carry the weight:
//
//   1. surface_id is read directly. There is no fallback to brand,
//      canonical_url or route_path. A missing surface_id is a hard
//      failure, not a prompt to derive one.
//   2. surface_id is unique WITHIN A VERSION. The same surface_id on
//      two versions is correct: one destination serves many assets.
//
// The validator is exercised through its CLI (--registry <path>)
// against the real Registry and against fixtures derived from it.
// ============================================================

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const VALIDATOR = path.join(REPO_ROOT, "scripts", "validate-research-assets.mjs");
const REGISTRY = path.join(REPO_ROOT, "docs", "research-assets.registry.yaml");

/** Run the validator. Never throws; always reports exit + output. */
function validate(target: string): { exit: number; output: string } {
  try {
    const output = execFileSync(
      process.execPath,
      [VALIDATOR, "--registry", target],
      { cwd: REPO_ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { exit: 0, output };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return { exit: err.status ?? 1, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

function scratch(contents: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), "registry-surface-"));
  const file = path.join(dir, "registry.yaml");
  writeFileSync(file, contents, "utf-8");
  return file;
}

interface SurfaceFact {
  assetId: string;
  versionId: string;
  brand: string;
  surfaceId: string;
}

/** Parse the shipped Registry well enough to assert identity facts. */
function readRegistry(): SurfaceFact[] {
  const out: SurfaceFact[] = [];
  let assetId = "";
  let versionId = "";
  let brand = "";
  let pending: SurfaceFact | null = null;
  const flush = () => {
    if (pending) out.push(pending);
    pending = null;
  };
  for (const line of readFileSync(REGISTRY, "utf-8").split("\n")) {
    const t = line.trim();
    if (t.startsWith("- asset_id:")) {
      flush();
      assetId = t.slice("- asset_id:".length).trim();
    } else if (t.startsWith("- version_id:")) {
      flush();
      versionId = t.slice("- version_id:".length).trim();
    } else if (t.startsWith("- brand:")) {
      // A new surface record begins here; close the previous one first.
      flush();
      brand = t.slice("- brand:".length).trim();
    } else if (t.startsWith("surface_id:")) {
      pending = {
        assetId,
        versionId,
        brand,
        surfaceId: t.slice("surface_id:".length).trim(),
      };
    }
  }
  flush();
  return out;
}

function surfacesOf(versionId: string): string[] {
  return readRegistry()
    .filter((s) => s.versionId === versionId)
    .map((s) => s.surfaceId);
}
interface SurfaceSpec {
  brand: string;
  host: string;
  url: string;
  route: string;
  /** Governance-approved identity. Omitted entirely when undefined. */
  sid?: string;
  /** Raw surface_id value, used for malformed-input cases. */
  rawSid?: string;
}

function surface(opts: SurfaceSpec): string[] {
  let sidLine: string | null = null;
  if (opts.rawSid !== undefined) sidLine = `            surface_id: ${opts.rawSid}`;
  else if (opts.sid !== undefined) sidLine = `            surface_id: ${opts.sid}`;
  return [
    `          - brand: ${opts.brand}`,
    ...(sidLine ? [sidLine] : []),
    `            canonical_url: "https://${opts.host}/${opts.url}"`,
    `            route_path: "src/app/${opts.route}/${opts.url}"`,
    "            status: live",
    "            last_verified_at: null",
    "            indexed_in: []",
    "            evidence:",
    '              - locator: "fixture.md:1"',
    '                value: "fixture"',
  ];
}

/**
 * Build a single-asset Registry by cloning the shipped RN-004 block.
 *
 * Deriving the fixture from the real Registry keeps these tests honest: if
 * the canonical structure changes, the fixture follows instead of silently
 * testing a shape the repository never produces.
 */
function fixtureRegistry(surfaceLines: string[]): string {
  const raw = readFileSync(REGISTRY, "utf-8").split("\n");
  const start = raw.findIndex((l) => l.trim() === "- asset_id: RN-004");
  const end = raw.findIndex((l, i) => i > start && l.trim() === "- asset_id: RN-005");
  const block = raw.slice(start, end).map((l) =>
    l
      .replace(/RN-004/g, "RN-901")
      .replace(/rn-004-r01/g, "rn-901-r01")
      .replace(/docs\/RN-004-cps-0001-evolution\.md/g, "fixture.md"),
  );
  const out: string[] = [];
  for (const line of block) {
    if (line.trim() === "surfaces: []") {
      out.push("        surfaces:");
      for (const s of surfaceLines) out.push(s);
      continue;
    }
    out.push(line);
  }
  return ["schema_version: 1", "", "assets:", ...out].join("\n") + "\n";
}

const LAB = {
  brand: "continuity-lab",
  host: "thecontinuitylab.org",
  route: "lab/research",
} as const;
const SHAPE = {
  brand: "myshape",
  host: "www.myshape.com",
  route: "research",
} as const;
const URL = "research/notes/x";
// ----------------------------------------------------------------
// A. Every current surface carries an identity
// ----------------------------------------------------------------

describe("canonical Registry surface identity", () => {
  it("validates the shipped Registry with no violations", () => {
    const result = validate(REGISTRY);
    expect(result.output).toContain("PASS: all registry invariants hold.");
    expect(result.exit).toBe(0);
  });

  it("reports 8 surfaces across 5 versions", () => {
    const result = validate(REGISTRY);
    expect(result.output).toMatch(/surfaces\s+:\s+8/);
    expect(result.output).toMatch(/versions\s+:\s+5/);
  });

  it("gives every one of the 8 surfaces a non-empty identity", () => {
    const facts = readRegistry();
    expect(facts.length).toBe(8);
    for (const f of facts) {
      expect(f.surfaceId.length, `${f.assetId}/${f.versionId}`).toBeGreaterThan(0);
    }
  });
});

// ----------------------------------------------------------------
// B. Only the two governance-approved identities appear
// ----------------------------------------------------------------

describe("approved surface identities", () => {
  it("uses continuity-lab-research for every Continuity Lab surface", () => {
    const lab = readRegistry().filter((s) => s.brand === "continuity-lab");
    expect(lab.length).toBe(4);
    expect(new Set(lab.map((s) => s.surfaceId))).toEqual(
      new Set(["continuity-lab-research"]),
    );
  });

  it("uses myshape-public for every MyShape surface", () => {
    const shape = readRegistry().filter((s) => s.brand === "myshape");
    expect(shape.length).toBe(4);
    expect(new Set(shape.map((s) => s.surfaceId))).toEqual(
      new Set(["myshape-public"]),
    );
  });

  it("introduces no third identity", () => {
    const ids = new Set(readRegistry().map((s) => s.surfaceId));
    expect([...ids].sort()).toEqual(["continuity-lab-research", "myshape-public"]);
  });

  it("keeps surface_id unique within each version", () => {
    for (const versionId of new Set(readRegistry().map((s) => s.versionId))) {
      const ids = surfacesOf(versionId);
      expect(new Set(ids).size, versionId).toBe(ids.length);
    }
  });

  it("gives RN-005 both identities in a single version", () => {
    expect(surfacesOf("rn-005-r01").sort()).toEqual([
      "continuity-lab-research",
      "myshape-public",
    ]);
  });
});
// ----------------------------------------------------------------
// C. Cross-version reuse is legal
// ----------------------------------------------------------------

describe("cross-version reuse", () => {
  it("reuses both identities across four versions in the shipped Registry", () => {
    const versions = new Set(readRegistry().map((s) => s.versionId));
    const using = [...versions].filter((v) => surfacesOf(v).includes("myshape-public"));
    expect(using.length).toBe(4);
  });

  it("accepts a version carrying one approved identity", () => {
    const result = validate(
      scratch(fixtureRegistry(surface({ ...SHAPE, sid: "myshape-public", url: URL }))),
    );
    expect(result.exit, result.output).toBe(0);
    expect(result.output).toContain("PASS");
  });

  it("accepts two distinct identities in one version", () => {
    const result = validate(
      scratch(
        fixtureRegistry([...surface({ ...LAB, sid: "continuity-lab-research", url: URL }), ...surface({ ...SHAPE, sid: "myshape-public", url: URL })]),
      ),
    );
    expect(result.exit, result.output).toBe(0);
  });
});

// ----------------------------------------------------------------
// D. Duplicate within one version
// ----------------------------------------------------------------

describe("per-version uniqueness", () => {
  it("rejects the same surface_id twice in one version", () => {
    const result = validate(
      scratch(
        fixtureRegistry([...surface({ ...LAB, sid: "continuity-lab-research", url: URL }), ...surface({ ...LAB, sid: "continuity-lab-research", url: URL })]),
      ),
    );
    expect(result.exit).toBe(1);
    expect(result.output).toContain("SID-3");
    expect(result.output).not.toContain("PASS");
  });
});
// ----------------------------------------------------------------
// E-G. No fallback to brand, canonical_url or route_path
// ----------------------------------------------------------------

describe("no inference from other fields", () => {
  const noId = surface({ ...SHAPE, url: URL });

  it("refuses a surface that has brand but no surface_id", () => {
    const result = validate(scratch(fixtureRegistry(noId)));
    expect(result.exit).toBe(1);
    expect(result.output).toContain("SID-1");
    expect(result.output).not.toContain("PASS");
  });

  it("does not accept brand as the identity", () => {
    const result = validate(scratch(fixtureRegistry(noId)));
    expect(result.output).not.toMatch(/surface_id: myshape/);
  });

  it("does not accept canonical_url as the identity", () => {
    const result = validate(scratch(fixtureRegistry(noId)));
    expect(result.output).not.toMatch(/surface_id: "?https/);
    expect(result.output).toContain("surface_id is required");
  });

  it("does not accept route_path as the identity", () => {
    const result = validate(scratch(fixtureRegistry(noId)));
    expect(result.output).not.toMatch(/surface_id: "?src\//);
    expect(result.output).toContain("surface_id is required");
  });

  it("rejects a null, non-scalar, empty or malformed surface_id", () => {
    const cases = ["null", "7", "[]", '""', '"Bad Case"'];
    for (const rawSid of cases) {
      const body = fixtureRegistry(surface({ ...SHAPE, rawSid, url: URL }));
      const result = validate(scratch(body));
      expect(result.exit, `surface_id: ${rawSid}`).toBe(1);
      expect(result.output, `surface_id: ${rawSid}`).toMatch(/SID-[12]/);
    }
  });
});

// ----------------------------------------------------------------
// H. RN-004 keeps no surface
// ----------------------------------------------------------------

describe("RN-004", () => {
  it("declares no surfaces", () => {
    expect(readRegistry().filter((s) => s.assetId === "RN-004")).toHaveLength(0);
  });

  it("is given no synthetic surface by the validator", () => {
    const result = validate(REGISTRY);
    expect(result.exit).toBe(0);
    expect(result.output).toMatch(/surfaces\s+:\s+8/);
  });
});

// ----------------------------------------------------------------
// I. Ordering stays a separate contract
// ----------------------------------------------------------------

describe("presentation ordering", () => {
  it("still sorts by brand then canonical_url, not by surface_id", () => {
    const result = validate(
      scratch(
        fixtureRegistry([...surface({ ...SHAPE, sid: "myshape-public", url: URL }), ...surface({ ...LAB, sid: "continuity-lab-research", url: URL })]),
      ),
    );
    expect(result.exit).toBe(1);
    expect(result.output).toContain("ORD-3");
  });
});
