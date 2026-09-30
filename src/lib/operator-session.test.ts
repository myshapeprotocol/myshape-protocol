/**
 * Operator session — signing, verification, and secret comparison.
 *
 * These tests cover the security properties the operator read path depends on:
 * a token can only be produced by someone holding OPERATOR_SECRET, and any
 * modification, expiry, or format change makes it invalid.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  createOperatorSessionToken,
  verifyOperatorSessionToken,
  verifyOperatorSecret,
  safeEqual,
  OPERATOR_SESSION_SECONDS,
} from "./operator-session";

const SECRET = "test-operator-secret-value";
const NOW = 1_700_000_000_000;

beforeEach(() => {
  process.env.OPERATOR_SECRET = SECRET;
});

afterEach(() => {
  delete process.env.OPERATOR_SECRET;
});

describe("verifyOperatorSecret", () => {
  it("accepts the exact secret", () => {
    expect(verifyOperatorSecret(SECRET)).toBe(true);
  });

  it("rejects a wrong secret", () => {
    expect(verifyOperatorSecret("wrong")).toBe(false);
  });

  it("rejects an empty or missing submission", () => {
    expect(verifyOperatorSecret("")).toBe(false);
    expect(verifyOperatorSecret(null)).toBe(false);
    expect(verifyOperatorSecret(undefined)).toBe(false);
  });

  it("fails closed when OPERATOR_SECRET is not configured", () => {
    delete process.env.OPERATOR_SECRET;
    expect(verifyOperatorSecret(SECRET)).toBe(false);
  });
});

describe("safeEqual", () => {
  it("matches identical strings", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
  });

  it("returns false for different lengths without throwing", () => {
    expect(safeEqual("abc", "abcd")).toBe(false);
  });

  it("returns false for same-length different content", () => {
    expect(safeEqual("abc", "abd")).toBe(false);
  });
});

describe("session token", () => {
  it("verifies a freshly created token", () => {
    const token = createOperatorSessionToken(SECRET, NOW);
    expect(verifyOperatorSessionToken(token, SECRET, NOW)).toBe(true);
  });

  it("does not embed the secret in the token", () => {
    const token = createOperatorSessionToken(SECRET, NOW);
    expect(token).not.toContain(SECRET);
  });

  it("rejects a token signed with a different secret", () => {
    const token = createOperatorSessionToken(SECRET, NOW);
    expect(verifyOperatorSessionToken(token, "another-secret", NOW)).toBe(false);
  });

  it("rejects a tampered payload", () => {
    const token = createOperatorSessionToken(SECRET, NOW);
    const [payload, signature] = token.split(".");
    const tampered = `${Buffer.from(
      JSON.stringify({ v: 1, iat: Math.floor(NOW / 1000) + 10_000 }),
      "utf8",
    ).toString("base64url")}.${signature}`;
    expect(tampered).not.toBe(payload);
    expect(verifyOperatorSessionToken(tampered, SECRET, NOW)).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const token = createOperatorSessionToken(SECRET, NOW);
    const [payload, signature] = token.split(".");
    const flipped = signature.slice(0, -1) + (signature.endsWith("A") ? "B" : "A");
    expect(verifyOperatorSessionToken(`${payload}.${flipped}`, SECRET, NOW)).toBe(false);
  });

  it("rejects an expired token", () => {
    const token = createOperatorSessionToken(SECRET, NOW);
    const later = NOW + (OPERATOR_SESSION_SECONDS + 60) * 1000;
    expect(verifyOperatorSessionToken(token, SECRET, later)).toBe(false);
  });

  it("accepts a token just inside the expiry window", () => {
    const token = createOperatorSessionToken(SECRET, NOW);
    const inside = NOW + (OPERATOR_SESSION_SECONDS - 30) * 1000;
    expect(verifyOperatorSessionToken(token, SECRET, inside)).toBe(true);
  });

  it("rejects a future-dated token", () => {
    const token = createOperatorSessionToken(SECRET, NOW + 3_600_000);
    expect(verifyOperatorSessionToken(token, SECRET, NOW)).toBe(false);
  });

  it("rejects malformed tokens without throwing", () => {
    for (const bad of ["", "x", "a.b", "a.b.c", "...", "not-base64.signature", null, undefined]) {
      expect(verifyOperatorSessionToken(bad, SECRET, NOW)).toBe(false);
    }
  });

  it("rejects when the verifying secret is empty", () => {
    const token = createOperatorSessionToken(SECRET, NOW);
    expect(verifyOperatorSessionToken(token, "", NOW)).toBe(false);
  });
});
