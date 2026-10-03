// ============================================================
// Contract tests for the content fingerprint rule.
//
// Covers the seven required properties from the Research Distribution
// application contract §4.2. No database, no Registry, no network, no
// platform adapter: this rule is pure computation.
//
// The exclusion cases (2, 3, 4) deliberately pass extra fields through a
// widened type. The point is to prove at runtime that fields outside
// { content, title } do not reach the digest — not merely to restate the
// TypeScript signature.
// ============================================================

import { describe, it, expect } from "vitest";
import { computeContentFingerprint } from "./content-fingerprint";

const CONTENT = "The Continuity Problem";
const TITLE = "RN-001  The Continuity Problem";

/** Widened input used only to prove that extra fields are ignored. */
function fingerprintWithExtraFields(extra: Record<string, unknown>): string {
  return computeContentFingerprint({
    content: CONTENT,
    title: TITLE,
    ...extra,
  } as { content: string; title: string });
}

describe("computeContentFingerprint", () => {
  // 1
  it("produces the same fingerprint for the same content and title", () => {
    const a = computeContentFingerprint({ content: CONTENT, title: TITLE });
    const b = computeContentFingerprint({ content: CONTENT, title: TITLE });
    expect(a).toBe(b);
  });

  // 2
  it("ignores different platform metadata", () => {
    const baseline = computeContentFingerprint({ content: CONTENT, title: TITLE });
    const bluesky = fingerprintWithExtraFields({
      platform: "bluesky",
    });
    const mastodon = fingerprintWithExtraFields({
      platform: "mastodon",
    });
    expect(bluesky).toBe(baseline);
    expect(mastodon).toBe(baseline);
    expect(bluesky).toBe(mastodon);
  });

  // 3
  it("ignores different surface metadata", () => {
    const baseline = computeContentFingerprint({ content: CONTENT, title: TITLE });
    const lab = fingerprintWithExtraFields({
      surface: "continuity-lab",
      brand: "continuity-lab",
    });
    const main = fingerprintWithExtraFields({
      surface: "myshape",
      brand: "myshape",
    });
    expect(lab).toBe(baseline);
    expect(main).toBe(baseline);
  });

  // 4
  it("ignores timestamp changes", () => {
    const baseline = computeContentFingerprint({ content: CONTENT, title: TITLE });
    const earlier = fingerprintWithExtraFields({
      created_at: "2026-01-01T00:00:00Z",
      approved_at: "2026-01-01T00:00:00Z",
    });
    const later = fingerprintWithExtraFields({
      created_at: "2030-12-31T23:59:59Z",
      approved_at: "2030-12-31T23:59:59Z",
    });
    expect(earlier).toBe(baseline);
    expect(later).toBe(baseline);
  });

  // 5
  it("changes the fingerprint when the title changes", () => {
    const a = computeContentFingerprint({ content: CONTENT, title: TITLE });
    const b = computeContentFingerprint({
      content: CONTENT,
      title: "RN-001  The Continuity Problem (revised)",
    });
    expect(a).not.toBe(b);
  });

  it("changes the fingerprint when the content changes", () => {
    const a = computeContentFingerprint({ content: CONTENT, title: TITLE });
    const b = computeContentFingerprint({
      content: `${CONTENT} — amended`,
      title: TITLE,
    });
    expect(a).not.toBe(b);
  });

  // 6
  it("is insensitive to key ordering", () => {
    const forward = canonicalFrom({
      content: CONTENT,
      title: TITLE,
    });
    const reversed = canonicalFrom({
      title: TITLE,
      content: CONTENT,
    });
    expect(forward).toBe(reversed);
    expect(computeContentFingerprint({ content: CONTENT, title: TITLE })).toBe(
      sha256Hex(forward),
    );
  });

  it("emits a canonical form with no insignificant whitespace", () => {
    const canonical = canonicalFrom({ content: CONTENT, title: TITLE });
    expect(canonical).not.toMatch(/\n|\r/);
    expect(canonical).not.toMatch(/[:,]\s/);
    expect(canonical).toBe(
      `{"content":${JSON.stringify(CONTENT)},"title":${JSON.stringify(TITLE)}}`,
    );
  });

  it("treats whitespace inside a value as significant", () => {
    const tight = computeContentFingerprint({ content: "a b", title: "t" });
    const padded = computeContentFingerprint({ content: "a  b", title: "t" });
    expect(tight).not.toBe(padded);
  });

  // 7
  it("outputs 64 lowercase hexadecimal characters", () => {
    const fp = computeContentFingerprint({ content: CONTENT, title: TITLE });
    expect(fp).toMatch(/^[0-9a-f]{64}$/);
    expect(fp).toHaveLength(64);
    expect(fp).toBe(fp.toLowerCase());
  });

  // Guard behaviour
  it("rejects a missing or non-string field rather than hashing it away", () => {
    // Cast through `unknown` deliberately: these inputs must not satisfy the
    // type, and the point of the test is that the runtime guard rejects them.
    expect(() =>
      computeContentFingerprint(
        { title: TITLE } as unknown as { content: string; title: string },
      ),
    ).toThrow(TypeError);
    expect(() =>
      computeContentFingerprint(
        { content: CONTENT } as unknown as { content: string; title: string },
      ),
    ).toThrow(TypeError);
    expect(() =>
      computeContentFingerprint({
        content: undefined,
        title: TITLE,
      } as unknown as { content: string; title: string }),
    ).toThrow(TypeError);
    expect(() =>
      computeContentFingerprint(
        TITLE as unknown as { content: string; title: string },
      ),
    ).toThrow(TypeError);
  });
});

/* Local helpers, so the assertions above do not restate the implementation
   without also exercising the shared canonicalisation primitive. */
import { canonicalSerialize } from "@/lib/evidence/cps0001";
import { sha256Hex } from "@/lib/hash";

function canonicalFrom(v: { content: string; title: string }): string {
  return canonicalSerialize(v);
}