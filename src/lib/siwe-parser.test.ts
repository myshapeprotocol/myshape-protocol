import { describe, it, expect } from "vitest";
import { parseSiweMessage } from "./siwe-parser";

describe("siwe-parser", () => {
  it("parses a valid SIWE message", () => {
    const msg = `myshape.com wants you to sign in:\n0x1234567890123456789012345678901234567890\n\nMyShape Protocol\n\nURI: https://myshape.com\nVersion: 1\nChain ID: 8453\nNonce: 550e8400-e29b-41d4-a716-446655440000\nIssued At: 2026-01-01T00:00:00.000Z`;
    const result = parseSiweMessage(msg);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message.domain).toBe("myshape.com");
      expect(result.message.chainId).toBe(8453);
      expect(result.message.nonce).toBe("550e8400-e29b-41d4-a716-446655440000");
    }
  });

  it("rejects invalid nonce format", () => {
    const msg = `myshape.com wants you to sign in:\n0x1234567890123456789012345678901234567890\n\nMyShape Protocol\n\nURI: https://myshape.com\nVersion: 1\nChain ID: 8453\nNonce: 12345\nIssued At: 2026-01-01T00:00:00.000Z`;
    const result = parseSiweMessage(msg);
    expect(result.ok).toBe(false);
  });

  it("validates timestamps", () => {
    const msg = `myshape.com wants you to sign in:\n0x1234567890123456789012345678901234567890\n\nMyShape Protocol\n\nURI: https://myshape.com\nVersion: 1\nChain ID: 8453\nNonce: 550e8400-e29b-41d4-a716-446655440000\nIssued At: 2026-01-01T00:00:00.000Z`;
    const result = parseSiweMessage(msg);
    expect(result.ok).toBe(true);
  });
});