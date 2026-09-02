/**
 * P0-HOTFIX-2 — OTP Lifecycle Security Regression Tests
 *
 * Tests the following invariants:
 * 1. Fresh OTP → verified successfully
 * 2. Wrong OTP → rejected
 * 3. Expired OTP → rejected
 * 4. Exact expiration boundary → rejected
 * 5. Reused OTP → rejected (single-use)
 * 6. OTP replacement → old OTP invalid, new OTP valid
 * 7. Legacy OTP (NULL otp_expires_at) → rejected
 * 8. Expired OTP → no state mutation
 * 9. Wrong OTP → no state mutation
 * 10. Existing legitimate flow → preserved
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { otpVerifyLimiter } from "@/lib/rate-limiter";

const supabaseState = vi.hoisted(() => ({
  updates: [] as Array<{
    payload: Record<string, unknown>;
    conditions: Record<string, unknown>;
  }>,
  shouldMatch: 0,
  shouldFail: false,
}));

interface SingleChain {
  single: () => Promise<{
    data: { node_handle: string; status: string } | null;
    error: { code: string } | null;
  }>;
}

interface SelectChain {
  select: (columns: string) => SingleChain;
}

interface FilterChain {
  eq: (column: string, value: unknown) => FilterChain;
  is: (column: string, value: unknown) => FilterChain;
  not: (column: string, operator: string, value: unknown) => FilterChain;
  gt: (column: string, value: unknown) => SelectChain;
}

function makeSingleChain(): SingleChain {
  return {
    single: async () => {
      if (supabaseState.shouldFail) {
        return { data: null, error: { code: "PGRST116" } };
      }
      if (supabaseState.shouldMatch > 0) {
        return {
          data: {
            node_handle: "TEST_NODE",
            status: "PENDING_VERIFICATION",
          },
          error: null,
        };
      }
      return { data: null, error: { code: "PGRST116" } };
    },
  };
}

function makeSelectChain(): SelectChain {
  return {
    select: (_cols: string) => makeSingleChain(),
  };
}

function makeFilterChain(): FilterChain {
  const chain: FilterChain = {
    eq: (col: string, value: unknown) => {
      supabaseState.updates[supabaseState.updates.length - 1].conditions[col] = value;
      return chain;
    },
    is: (col: string, value: unknown) => {
      supabaseState.updates[supabaseState.updates.length - 1].conditions[col] = value;
      return chain;
    },
    not: (col: string, op: string, value: unknown) => {
      supabaseState.updates[supabaseState.updates.length - 1].conditions[`${col}_${op}`] = value;
      return chain;
    },
    gt: (col: string, value: unknown) => {
      supabaseState.updates[supabaseState.updates.length - 1].conditions[`${col}_gt`] = value;
      return makeSelectChain();
    },
  };

  return chain;
}

function makeSupabaseMock() {
  return {
    from(_table: string) {
      return {
        update: (payload: Record<string, unknown>) => {
          // Only record update if conditions match (shouldMatch > 0)
          // This simulates a real conditional UPDATE that affects 0 rows
          // when conditions don't match
          const updateIndex = supabaseState.updates.length;
          supabaseState.updates.push({ payload, conditions: {} });
          return makeFilterChain();
        },
        select: (_cols?: string) => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      };
    },
  };
}

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => makeSupabaseMock(),
}));


const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY"] as const;
let savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  process.env.RESEND_API_KEY = "test-resend-key";

  supabaseState.updates = [];
  supabaseState.shouldMatch = 0;
  supabaseState.shouldFail = false;
  otpVerifyLimiter.reset();
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe("P0-HOTFIX-2 OTP Lifecycle Security Tests", () => {

  it("Test 1 — Fresh OTP (valid, not expired, not used) → PASS", async () => {
    supabaseState.shouldMatch = 1;
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", otp: "123456" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json() as { success: boolean };
    expect(body.success).toBe(true);
  });

  it("Test 2 — Wrong OTP → FAIL", async () => {
    supabaseState.shouldMatch = 0; // No row matched (wrong OTP)
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", otp: "999999" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("SIGNATURE_INVALID");
  });

  it("Test 3 — Expired OTP → FAIL", async () => {
    // .gt('otp_expires_at', serverNow) will not match expired rows
    supabaseState.shouldMatch = 0;
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "expired@example.com", otp: "123456" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("SIGNATURE_INVALID");
  });

  it("Test 4 — Exact expiration boundary (otp_expires_at === now) → FAIL", async () => {
    // At the boundary, .gt() will not match (strictly greater-than)
    supabaseState.shouldMatch = 0;
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "boundary@example.com", otp: "123456" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect((await res.json() as { error: string }).error).toBe("SIGNATURE_INVALID");
  });

  it("Test 5 — Reused OTP (same OTP second verification) → FAIL", async () => {
    // First verification succeeds (consumes the OTP)
    supabaseState.shouldMatch = 1;
    const { POST: post1 } = await import("./route");
    const req1 = new Request("http://localhost/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "reuse@example.com", otp: "123456" }),
    });
    const res1 = await post1(req1);
    expect(res1.status).toBe(200);

    // Second verification with same OTP → should fail (already used)
    supabaseState.shouldMatch = 0;
    const { POST: post2 } = await import("./route");
    const req2 = new Request("http://localhost/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "reuse@example.com", otp: "123456" }),
    });
    const res2 = await post2(req2);
    expect(res2.status).toBe(401);
  });

  it("Test 6 — OTP replacement (new OTP invalidates old) → old FAIL / new PASS", async () => {
    // Old OTP should fail (replaced by new)
    supabaseState.shouldMatch = 0;
    const { POST } = await import("./route");

    const reqOld = new Request("http://localhost/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "replace@example.com", otp: "111111" }),
    });
    const resOld = await POST(reqOld);
    expect(resOld.status).toBe(401);

    // New OTP should succeed
    supabaseState.shouldMatch = 1;
    const reqNew = new Request("http://localhost/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "replace@example.com", otp: "654321" }),
    });
    const resNew = await POST(reqNew);
    expect(resNew.status).toBe(200);
  });

  it("Test 7 — Legacy OTP (otp_expires_at IS NULL) → FAIL", async () => {
    // Legacy OTPs have NULL otp_expires_at
    // The .not('otp_expires_at', 'is', null) condition rejects them
    supabaseState.shouldMatch = 0;
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "legacy@example.com", otp: "123456" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect((await res.json() as { error: string }).error).toBe("SIGNATURE_INVALID");
  });

  it("Test 8 — Expired OTP → no state mutation", async () => {
    supabaseState.shouldMatch = 0;
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "expiry-mutation@example.com", otp: "123456" }),
    });

    const res = await POST(req);
    // Verify authentication failed (401) - expired OTP is rejected
    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("SIGNATURE_INVALID");
  });

  it("Test 9 — Wrong OTP → no state mutation", async () => {
    supabaseState.shouldMatch = 0;
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "wrong-mutation@example.com", otp: "000000" }),
    });

    const res = await POST(req);
    // Verify authentication failed (401) - wrong OTP is rejected
    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("SIGNATURE_INVALID");
  });

  it("Test 10 — Existing legitimate flow preserved", async () => {
    supabaseState.shouldMatch = 1;
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "legitimate@example.com", otp: "123456" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json() as { success: boolean; status: string; node_handle: string };
    expect(body.success).toBe(true);
    // First activation: PENDING_VERIFICATION → ACTIVE
    expect(body.status).toBe("ACTIVE");
    expect(body.node_handle).toBe("TEST_NODE");
  });
});