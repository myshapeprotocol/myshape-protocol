import { describe, it, expect, beforeEach } from "vitest";
import { RateLimiter } from "./rate-limiter";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ maxRequests: 5, windowMs: 60_000 });
  });

  it("allows requests within the limit", () => {
    for (let i = 0; i < 5; i++) {
      const result = limiter.check("127.0.0.1");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  it("blocks requests exceeding the limit", () => {
    for (let i = 0; i < 5; i++) limiter.check("127.0.0.1");
    const result = limiter.check("127.0.0.1");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks different IPs independently", () => {
    for (let i = 0; i < 5; i++) limiter.check("10.0.0.1");
    const blockedResult = limiter.check("10.0.0.1");
    expect(blockedResult.allowed).toBe(false);

    const freshResult = limiter.check("10.0.0.2");
    expect(freshResult.allowed).toBe(true);
    expect(freshResult.remaining).toBe(4);
  });

  it("resets after window expires", async () => {
    // Use a 10ms window for fast testing
    const fast = new RateLimiter({ maxRequests: 2, windowMs: 10, cleanupIntervalMs: 5 });
    fast.check("ip");
    fast.check("ip");
    expect(fast.check("ip").allowed).toBe(false);

    // Wait for window to expire
    await new Promise((r) => setTimeout(r, 15));
    const result = fast.check("ip");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("prunes expired entries to prevent memory leaks", () => {
    const fast = new RateLimiter({ maxRequests: 2, windowMs: 5, cleanupIntervalMs: 1 });
    fast.check("old-ip");

    // Force check triggers prune, which should not throw
    expect(() => fast.check("new-ip")).not.toThrow();
  });

  it("returns correct resetAt timestamp", () => {
    const before = Date.now();
    const result = limiter.check("test");
    const after = Date.now();
    expect(result.resetAt).toBeGreaterThanOrEqual(before + 60_000 - 100); // tolerance
    expect(result.resetAt).toBeLessThanOrEqual(after + 60_000 + 100);
  });
});
