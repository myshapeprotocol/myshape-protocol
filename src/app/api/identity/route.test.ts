/**
 * Identity API route — HTTP-level tests.
 *
 * Tests input validation and rate limiting without Supabase dependency.
 * These code paths execute before any DB call.
 */
import { describe, it, expect, beforeEach } from "vitest";

const { apiLookupLimiter } = await import("@/lib/rate-limiter");

// ── Helpers ──

function buildRequest(url: string, headers?: Record<string, string>): Request {
  return new Request(url, { headers });
}

// ── Input Validation (happens before Supabase) ──

describe("Identity API — validation", () => {
  it("returns 400 for missing email", async () => {
    const { GET } = await import("./route");
    const req = buildRequest("http://localhost/api/identity");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("INVALID_EMAIL");
  });

  it("returns 400 for non-email input", async () => {
    const { GET } = await import("./route");
    const req = buildRequest("http://localhost/api/identity?email=notanemail");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 500 when Supabase env vars are missing", async () => {
    // Save and clear env
    const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const savedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete (process.env as Record<string, string>).NEXT_PUBLIC_SUPABASE_URL;
    delete (process.env as Record<string, string>).SUPABASE_SERVICE_ROLE_KEY;

    const { GET } = await import("./route");
    const req = buildRequest("http://localhost/api/identity?email=test@myshape.com");
    const res = await GET(req);
    expect(res.status).toBe(500);

    // Restore
    if (savedUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl;
    if (savedKey) process.env.SUPABASE_SERVICE_ROLE_KEY = savedKey;
  });
});

// ── Rate Limiting ──

describe("Identity API — rate limiting", () => {
  beforeEach(() => {
    apiLookupLimiter.reset();
  });

  it("returns 429 when rate limit exceeded", async () => {
    const { GET } = await import("./route");
    const ip = "172.16.0.99";

    // Exhaust the limit (10 req/min)
    for (let i = 0; i < 10; i++) {
      const req = buildRequest(
        `http://localhost/api/identity?email=test${i}@myshape.com`,
        { "x-forwarded-for": ip },
      );
      const res = await GET(req);
      // These should NOT be rate limited (status will be 500 due to no Supabase env)
      expect(res.status).not.toBe(429);
    }

    // 11th request should be rate limited
    const blocked = await GET(buildRequest(
      "http://localhost/api/identity?email=blocked@myshape.com",
      { "x-forwarded-for": ip },
    ));
    expect(blocked.status).toBe(429);
  });

  it("different IPs have independent rate limits", async () => {
    const { GET } = await import("./route");

    // Exhaust IP 1
    for (let i = 0; i < 10; i++) {
      await GET(buildRequest(
        `http://localhost/api/identity?email=test${i}@a.com`,
        { "x-forwarded-for": "10.0.0.1" },
      ));
    }
    const blocked = await GET(buildRequest(
      "http://localhost/api/identity?email=blocked@a.com",
      { "x-forwarded-for": "10.0.0.1" },
    ));
    expect(blocked.status).toBe(429);

    // IP 2 still has full quota
    const allowed = await GET(buildRequest(
      "http://localhost/api/identity?email=fresh@b.com",
      { "x-forwarded-for": "10.0.0.2" },
    ));
    expect(allowed.status).not.toBe(429);
  });
});
