// ============================================================
// Canonical content contract - tests
//
// These tests pin the four governance decisions this module implements:
//
//   G-1  content_path is governance-designated, never inferred
//   G-2  content is exact checked-out UTF-8 text, never transformed
//   G-3  title is canonical_title, never inferred from the file
//   G-6  the source-type allowlist is exactly .md and .txt
//
// Every fingerprint assertion calls the frozen implementation in
// ../content-fingerprint and compares against a digest this test derives
// through the same public entry point, so a change to that algorithm
// surfaces here rather than being silently absorbed.
// ============================================================

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { computeContentFingerprint } from "../content-fingerprint";
import {
  ALLOWED_CANONICAL_CONTENT_EXTENSIONS,
  computeCanonicalContentFingerprint,
  isAllowedCanonicalContentPath,
  isSafeRepositoryRelativePath,
  readCanonicalContent,
} from "./canonical-content";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

function scratch(): string {
  return mkdtempSync(path.join(tmpdir(), "canonical-content-"));
}

// ----------------------------------------------------------------
// A. Extension eligibility (G-6)
// ----------------------------------------------------------------

describe("G-6 allowed canonical content formats", () => {
  it("admits exactly .md and .txt", () => {
    expect(isAllowedCanonicalContentPath("docs/RN-004-note.md")).toBe(true);
    expect(isAllowedCanonicalContentPath("notes/plain.txt")).toBe(true);
  });

  it("compares the extension case-insensitively", () => {
    expect(isAllowedCanonicalContentPath("docs/UPPER.MD")).toBe(true);
    expect(isAllowedCanonicalContentPath("notes/UPPER.TXT")).toBe(true);
    expect(isAllowedCanonicalContentPath("mixed.Md")).toBe(true);
  });

  it("refuses every format outside the v1 allowlist", () => {
    const refused = [
      "papers/arxiv-rn-001/paper.tex",
      "papers/rn-002/cover.html",
      "papers/arxiv-rn-001/paper.pdf",
      "papers/rn-002/cover.png",
      "papers/arxiv-rn-001/fig-architecture.svg",
      "papers/arxiv-rn-001/references.bib",
      "papers/arxiv-rn-001/paper.aux",
      "build/paper.log",
      "build/paper.out",
      "pkg/myshape_wasm_bg.wasm",
      "fonts/inter.woff",
      "fonts/inter.woff2",
      "data/no-extension",
      "data/archive.tar.gz",
    ];
    for (const candidate of refused) {
      expect(isAllowedCanonicalContentPath(candidate), candidate).toBe(false);
    }
  });

  it("refuses empty and non-string candidates", () => {
    expect(isAllowedCanonicalContentPath("")).toBe(false);
    expect(isAllowedCanonicalContentPath(undefined as unknown as string)).toBe(
      false,
    );
  });

  it("treats UTF-8 decodability as insufficient", () => {
    // .tex, .html and .bib are all decodable text. None qualifies.
    expect(isAllowedCanonicalContentPath("paper.tex")).toBe(false);
    expect(isAllowedCanonicalContentPath("page.html")).toBe(false);
    expect(isAllowedCanonicalContentPath("refs.bib")).toBe(false);
  });

  it("exposes the allowlist as exactly two entries", () => {
    expect([...ALLOWED_CANONICAL_CONTENT_EXTENSIONS]).toEqual([".md", ".txt"]);
  });

  it("never selects a source: eligibility is per path, not per directory", () => {
    // A directory full of eligible files yields no answer. G-1 requires the
    // Registry to designate exactly one; this function is never consulted
    // to make that choice.
    expect(isAllowedCanonicalContentPath("papers/arxiv-rn-001")).toBe(false);
  });
});

// ----------------------------------------------------------------
// B. Exact content preservation (G-2)
// ----------------------------------------------------------------

describe("G-2 exact content preservation", () => {
  it("returns leading, trailing and internal whitespace untouched", async () => {
    const dir = scratch();
    const exact =
      "   leading spaces\n\ndouble blank line above\nprose  with   runs\n\n\ntrailing blank lines   \n";
    writeFileSync(path.join(dir, "exact.md"), exact, "utf-8");

    const result = await readCanonicalContent("exact.md", {
      repositoryRoot: dir,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Byte-for-byte equality. No trim, no collapsing, no re-encoding.
    expect(result.content).toBe(exact);
    expect(result.content.startsWith("   ")).toBe(true);
    expect(result.content.endsWith("   \n")).toBe(true);
    expect(result.content).toContain("prose  with   runs");
  });

  it("preserves LF line endings and does not convert them", async () => {
    const dir = scratch();
    writeFileSync(path.join(dir, "lf.md"), "one\ntwo\nthree\n", "utf-8");

    const result = await readCanonicalContent("lf.md", { repositoryRoot: dir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.content).toBe("one\ntwo\nthree\n");
    expect(result.content.includes("\r")).toBe(false);
  });

  it("preserves CRLF bytes exactly as checked out", async () => {
    // G-4 makes the checkout deterministic; G-2 does not rewrite what
    // arrives. A CRLF file and an LF file are different bytes and must
    // therefore produce different digests.
    const dir = scratch();
    writeFileSync(path.join(dir, "crlf.md"), "one\r\ntwo\r\n", "utf-8");

    const result = await readCanonicalContent("crlf.md", {
      repositoryRoot: dir,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.content).toBe("one\r\ntwo\r\n");
  });

  it("preserves a UTF-8 BOM rather than stripping it", async () => {
    const dir = scratch();
    writeFileSync(path.join(dir, "bom.md"), "\uFEFF# Title", "utf-8");

    const result = await readCanonicalContent("bom.md", { repositoryRoot: dir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // TextDecoder strips a leading BOM unless ignoreBOM is set. Stripping it
    // here would be a silent transform, and would make this file digest
    // identically to one written without the BOM.
    expect(result.content.charCodeAt(0)).toBe(0xfeff);
  });

  it("performs no Markdown parsing", async () => {
    const dir = scratch();
    const source = "# Heading\n\n**bold** and [link](https://example.test)\n";
    writeFileSync(path.join(dir, "raw.md"), source, "utf-8");

    const result = await readCanonicalContent("raw.md", { repositoryRoot: dir });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.content).toBe(source);
    expect(result.content).toContain("**bold**");
    expect(result.content).toContain("# Heading");
  });

  it("fails closed on bytes that are not valid UTF-8", async () => {
    const dir = scratch();
    writeFileSync(
      path.join(dir, "bad.md"),
      Buffer.from([0xff, 0xfe, 0x00, 0x01]),
    );

    const result = await readCanonicalContent("bad.md", { repositoryRoot: dir });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("READ_FAILED");
  });
});


// ----------------------------------------------------------------
// C. Title mapping (G-3)
// ----------------------------------------------------------------

describe("G-3 title comes from canonical_title", () => {
  it("uses the Registry title verbatim", async () => {
    const dir = scratch();
    writeFileSync(path.join(dir, "note.md"), "# Heading\n\nbody\n", "utf-8");

    const result = await computeCanonicalContentFingerprint(
      {
        contentPath: "note.md",
        canonicalTitle: "RN-900  Registry Designated Title",
      },
      { repositoryRoot: dir },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.canonicalTitle).toBe("RN-900  Registry Designated Title");
  });

  it("does not take the title from the Markdown H1", async () => {
    const dir = scratch();
    writeFileSync(
      path.join(dir, "note.md"),
      "# Heading From File\n\nbody\n",
      "utf-8",
    );

    const result = await computeCanonicalContentFingerprint(
      { contentPath: "note.md", canonicalTitle: "RN-900  Registry Title" },
      { repositoryRoot: dir },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.canonicalTitle).toBe("RN-900  Registry Title");
    expect(result.content).toContain("Heading From File");

    const withH1 = computeContentFingerprint({
      content: result.content,
      title: "Heading From File",
    });
    expect(result.contentFingerprint).not.toBe(withH1);
  });

  it("does not take the title from the filename", async () => {
    const dir = scratch();
    writeFileSync(
      path.join(dir, "filename-would-be-wrong.md"),
      "prose\n",
      "utf-8",
    );

    const result = await computeCanonicalContentFingerprint(
      {
        contentPath: "filename-would-be-wrong.md",
        canonicalTitle: "RN-900  Real",
      },
      { repositoryRoot: dir },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.canonicalTitle).toBe("RN-900  Real");
  });

  it("refuses a missing or empty title rather than guessing one", async () => {
    const dir = scratch();
    writeFileSync(path.join(dir, "note.md"), "# Heading\n", "utf-8");

    for (const title of ["", undefined, null]) {
      const result = await computeCanonicalContentFingerprint(
        { contentPath: "note.md", canonicalTitle: title as unknown as string },
        { repositoryRoot: dir },
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe("TITLE_MISSING");
    }
  });
});

// ----------------------------------------------------------------
// D. Fingerprint integration against the frozen implementation
// ----------------------------------------------------------------

describe("fingerprint integration", () => {
  it("equals computeContentFingerprint over the exact loaded string", async () => {
    const dir = scratch();
    const source = "# RN\n\nprose  with   runs\n";
    writeFileSync(path.join(dir, "note.md"), source, "utf-8");

    const result = await computeCanonicalContentFingerprint(
      { contentPath: "note.md", canonicalTitle: "RN-900  Title" },
      { repositoryRoot: dir },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.content).toBe(source);
    expect(result.contentFingerprint).toBe(
      computeContentFingerprint({ content: source, title: "RN-900  Title" }),
    );
    expect(result.contentFingerprint).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes the digest when the exact content changes", async () => {
    const dir = scratch();
    writeFileSync(path.join(dir, "a.md"), "prose\n", "utf-8");
    writeFileSync(path.join(dir, "b.md"), "prose  \n", "utf-8");

    const a = await computeCanonicalContentFingerprint(
      { contentPath: "a.md", canonicalTitle: "T" },
      { repositoryRoot: dir },
    );
    const b = await computeCanonicalContentFingerprint(
      { contentPath: "b.md", canonicalTitle: "T" },
      { repositoryRoot: dir },
    );

    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.contentFingerprint).not.toBe(b.contentFingerprint);
  });

  it("gives identical content the same digest regardless of filename", async () => {
    const dir = scratch();
    writeFileSync(path.join(dir, "one.md"), "same prose\n", "utf-8");
    writeFileSync(path.join(dir, "two.md"), "same prose\n", "utf-8");

    const one = await computeCanonicalContentFingerprint(
      { contentPath: "one.md", canonicalTitle: "T" },
      { repositoryRoot: dir },
    );
    const two = await computeCanonicalContentFingerprint(
      { contentPath: "two.md", canonicalTitle: "T" },
      { repositoryRoot: dir },
    );

    expect(one.ok && two.ok).toBe(true);
    if (!one.ok || !two.ok) return;
    expect(one.contentFingerprint).toBe(two.contentFingerprint);
  });
});

// ----------------------------------------------------------------
// E. Invalid sources and path safety (fail closed)
// ----------------------------------------------------------------

describe("fail-closed behaviour", () => {
  it("refuses an ineligible extension before touching the filesystem", async () => {
    for (const candidate of [
      "paper.tex",
      "page.html",
      "paper.pdf",
      "cover.png",
      "diagram.svg",
      "unknown.xyz",
    ]) {
      const result = await readCanonicalContent(candidate);
      expect(result.ok, candidate).toBe(false);
      if (result.ok) return;
      expect(result.code, candidate).toBe("EXTENSION_NOT_ALLOWED");
    }
  });

  it("refuses a missing file", async () => {
    const result = await readCanonicalContent("does-not-exist.md", {
      repositoryRoot: scratch(),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("FILE_NOT_FOUND");
  });

  it("refuses parent-directory traversal", async () => {
    const dir = scratch();
    writeFileSync(path.join(dir, "inside.md"), "prose\n", "utf-8");

    for (const escape of ["../outside.md", "sub/../../outside.md", "./../outside.md"]) {
      const result = await readCanonicalContent(escape, { repositoryRoot: dir });
      expect(result.ok, escape).toBe(false);
      if (result.ok) return;
      expect(result.code, escape).toBe("UNSAFE_PATH");
    }
  });

  it("refuses a bare parent-directory reference", async () => {
    // ".." carries no eligible extension, so it is refused on both counts.
    const result = await readCanonicalContent("..");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("EXTENSION_NOT_ALLOWED");
    expect(isSafeRepositoryRelativePath("..")).toBe(false);
  });

  it("refuses absolute paths in both POSIX and Windows form", async () => {
    for (const absolute of [
      "/etc/passwd.md",
      "C:/Windows/System32/drivers/etc/hosts.md",
      "C:\\Windows\\notes.md",
    ]) {
      const result = await readCanonicalContent(absolute);
      expect(result.ok, absolute).toBe(false);
      if (result.ok) return;
      expect(result.code, absolute).toBe("UNSAFE_PATH");
    }
  });

  it("refuses URLs as a canonical content source", async () => {
    for (const url of [
      "https://example.test/paper.md",
      "http://example.test/paper.md",
      "file:///etc/passwd.md",
    ]) {
      const result = await readCanonicalContent(url);
      expect(result.ok, url).toBe(false);
      if (result.ok) return;
      expect(result.code, url).toBe("UNSAFE_PATH");
    }
  });

  it("rejects backslash separators, which are traversal on Windows", () => {
    expect(isSafeRepositoryRelativePath("docs\\RN-004.md")).toBe(false);
    expect(isSafeRepositoryRelativePath("docs/RN-004.md")).toBe(true);
  });

  it("accepts ordinary nested repository paths", () => {
    for (const safe of [
      "docs/RN-004-cps-0001-evolution.md",
      "papers/rn-002/pes-benchmark-v0.2-article.md",
      "a/b/c/d.md",
      "name.with.dots.md",
    ]) {
      expect(isSafeRepositoryRelativePath(safe), safe).toBe(true);
    }
  });

  it("never falls back to another source after a rejection", async () => {
    const dir = scratch();
    writeFileSync(path.join(dir, "fallback.md"), "should not be read\n", "utf-8");

    const result = await readCanonicalContent("paper.tex", { repositoryRoot: dir });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("EXTENSION_NOT_ALLOWED");
    expect("content" in result).toBe(false);
  });
});

// ----------------------------------------------------------------
// F + G. RN-004 and RN-005 against the real repository
// ----------------------------------------------------------------

const GOVERNED_ASSETS = [
  {
    assetId: "RN-004",
    contentPath: "docs/RN-004-cps-0001-evolution.md",
    canonicalTitle:
      "RN-004  From Human Verification to Continuity Infrastructure",
  },
  {
    assetId: "RN-005",
    contentPath: "docs/RN-005-two-stage-continuity-verification.md",
    canonicalTitle: "RN-005  Two-Stage Continuity Verification",
  },
];

describe("governed research assets", () => {
  for (const asset of GOVERNED_ASSETS) {
    describe(asset.assetId, () => {
      it("has an eligible content_path", () => {
        expect(isAllowedCanonicalContentPath(asset.contentPath)).toBe(true);
        expect(isSafeRepositoryRelativePath(asset.contentPath)).toBe(true);
      });

      it("loads its exact content from the repository", async () => {
        const result = await readCanonicalContent(asset.contentPath, {
          repositoryRoot: REPO_ROOT,
        });
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.content.length).toBeGreaterThan(0);
        expect(result.content).toContain("#");
      });

      it("fingerprints with its canonical_title", async () => {
        const result = await computeCanonicalContentFingerprint(
          {
            contentPath: asset.contentPath,
            canonicalTitle: asset.canonicalTitle,
          },
          { repositoryRoot: REPO_ROOT },
        );
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.canonicalTitle).toBe(asset.canonicalTitle);
        expect(result.contentFingerprint).toMatch(/^[0-9a-f]{64}$/);
        expect(result.contentFingerprint).toBe(
          computeContentFingerprint({
            content: result.content,
            title: asset.canonicalTitle,
          }),
        );
      });

      it("produces the same digest on repeated resolution", async () => {
        const request = {
          contentPath: asset.contentPath,
          canonicalTitle: asset.canonicalTitle,
        };
        const first = await computeCanonicalContentFingerprint(request, {
          repositoryRoot: REPO_ROOT,
        });
        const second = await computeCanonicalContentFingerprint(request, {
          repositoryRoot: REPO_ROOT,
        });
        expect(first.ok && second.ok).toBe(true);
        if (!first.ok || !second.ok) return;
        expect(first.contentFingerprint).toBe(second.contentFingerprint);
      });
    });
  }

  it("gives the two assets different digests", async () => {
    const digests: string[] = [];
    for (const asset of GOVERNED_ASSETS) {
      const result = await computeCanonicalContentFingerprint(
        {
          contentPath: asset.contentPath,
          canonicalTitle: asset.canonicalTitle,
        },
        { repositoryRoot: REPO_ROOT },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      digests.push(result.contentFingerprint);
    }
    expect(digests[0]).not.toBe(digests[1]);
  });

  it("refuses RN-001's LaTeX source as canonical content", async () => {
    // RN-001 has no v1 canonical source. The module must not read LaTeX as
    // publication text, and must not promote a submission checklist.
    const readme = await readCanonicalContent("papers/arxiv-rn-001/README.md", {
      repositoryRoot: REPO_ROOT,
    });
    const tex = await readCanonicalContent("papers/arxiv-rn-001/paper.tex", {
      repositoryRoot: REPO_ROOT,
    });

    // README.md is format-eligible; eligibility is not designation.
    expect(readme.ok).toBe(true);
    expect(tex.ok).toBe(false);
    if (tex.ok) return;
    expect(tex.code).toBe("EXTENSION_NOT_ALLOWED");
  });

  it("refuses RN-002's ineligible paths", async () => {
    for (const candidate of [
      "papers/rn-002/cover.png",
      "papers/rn-002/cover.html",
    ]) {
      const result = await readCanonicalContent(candidate, {
        repositoryRoot: REPO_ROOT,
      });
      expect(result.ok, candidate).toBe(false);
      if (result.ok) return;
      expect(result.code, candidate).toBe("EXTENSION_NOT_ALLOWED");
    }
  });
});
