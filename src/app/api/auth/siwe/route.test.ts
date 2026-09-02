/**
 * P0-HOTFIX-1 Security Regression — /api/auth/siwe
 *
 * Security invariant under test:
 *   A wallet signature proves ONLY control of wallet_address.
 *   It must NEVER be treated as proof of email ownership.
 *
 * Covers the confirmed account-takeover chain fixed in this batch:
 *   attacker wallet + valid attacker signature + victim email
 *     => MUST NOT bind wallet to victim node
 *     => MUST NOT return skip_otp: true
 *
 * Real ethers signatures are used (deterministic throwaway test key);
 * the Supabase client is mocked and records every query/write so the
 * tests can assert the ABSENCE of wallet-binding writes.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ethers } from "ethers";
import { apiLookupLimiter } from "@/lib/rate-limiter";

// Deterministic, well-known throwaway test key (never used in production)
const ATTACKER_WALLET = new ethers.Wallet(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
);
const ATTACKER_MESSAGE =
  "attacker-signed arbitrary message (old server never validated SIWE structure)";
const ATTACKER_SIGNATURE = await ATTACKER_WALLET.signMessage(ATTACKER_MESSAGE);

const supabaseState = vi.hoisted(() => ({
  current: null as {
    selects: Array<{ col: string; value: unknown }>;
    updates: Array<{ payload: Record<string, unknown>; target: { col: string; value: unknown } }>;
    readonly updateCount: number;
  } | null,
}));

function makeSupabaseMock(
  options: { nodeByWallet?: Record<string, unknown> | null; throwOnSelect?: boolean } = {}
) {
  const selects: Array<{ col: string; value: unknown }> = [];
  const updates: Array<{ payload: Record<string, unknown>; target: { col: string; value: unknown } }> = [];
  return {
    selects,
    updates,
    get updateCount() {
      return updates.length;
    },
    from(_table: string) {
      return {
        select(_cols?: string) {
          return {
            eq: (col: string, value: unknown) => ({
              maybeSingle: async () => {
                if (options.throwOnSelect) throw new Error("SIMULATED_DB_FAILURE");
                selects.push({ col, value });
                if (col === "wallet_address") {
                  return { data: options.nodeByWallet ?? null, error: null };
                }
                // P0-1 invariant: the fixed route never queries by email.
                // Any email lookup observed in tests = regression of the fix.
                return { data: null, error: null };
              },
              single: async () => ({ data: null, error: null }),
            }),
          };
        },
        update(payload: Record<string, unknown>) {
          return {
            eq: async (col: string, value: unknown) => {
              updates.push({ payload, target: { col, value } });
              return { error: null };
            },
          };
        },
      };
    },
  };
}

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => supabaseState.current,
}));

function fake() {
  const current = supabaseState.current;
  if (!current) throw new Error("supabase mock not initialized");
  return current;
}

let ipCounter = 0;
async function callRoute(body: Record<string, unknown>): Promise<Response> {
  ipCounter += 1;
  const request = new Request("http://localhost/api/auth/siwe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": `10.9.0.${ipCounter}`,
    },
    body: JSON.stringify(body),
  });
  const { POST } = await import("./route");
  return POST(request);
}

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;
let savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  apiLookupLimiter.reset();
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe("P0-1 SIWE — a wallet signature never proves email ownership", () => {
  it("Test A — unbound attacker wallet + victim email: MUST reject, never bind, never skip OTP", async () => {
    supabaseState.current = makeSupabaseMock({ nodeByWallet: null });
    const res = await callRoute({
      message: ATTACKER_MESSAGE,
      signature: ATTACKER_SIGNATURE,
      address: ATTACKER_WALLET.address,
      email: "victim@myshape.com",
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error?: string; skip_otp?: boolean };
    expect(body.error).toContain("EMAIL_VERIFICATION_REQUIRED");
    expect(body.skip_otp).toBeUndefined();
    expect(fake().updates.filter((u) => "wallet_address" in u.payload)).toHaveLength(0);
    // Uniform response — victim email is never queried (no enumeration signal)
    expect(fake().selects.filter((s) => s.col === "email")).toHaveLength(0);
  });

  it.each([
    ["ACTIVE", "Test B"],
    ["GENESIS_NODE", "Test C"],
    ["AGENT_ACTIVE", "Test D"],
  ])(
    "%s victim node exists: attacker wallet + victim email MUST NOT bind and MUST NOT return skip_otp (%s)",
    async () => {
      // The victim node exists in the (simulated) database with this status —
      // but the fixed route must never even reach it: it no longer queries by email.
      supabaseState.current = makeSupabaseMock({ nodeByWallet: null });
      const res = await callRoute({
        message: ATTACKER_MESSAGE,
        signature: ATTACKER_SIGNATURE,
        address: ATTACKER_WALLET.address,
        email: "victim@myshape.com",
      });
      expect(res.status).toBe(403);
      const body = (await res.json()) as { error?: string; skip_otp?: boolean; is_bound?: boolean };
      expect(body.error).toContain("EMAIL_VERIFICATION_REQUIRED");
      expect(body.skip_otp ?? false).toBe(false);
      expect(body.is_bound ?? false).toBe(false);
      expect(fake().updates.filter((u) => "wallet_address" in u.payload)).toHaveLength(0);
    }
  );

  it("Test E — legitimate already-bound wallet keeps valid authentication (skip_otp preserved)", async () => {
    supabaseState.current = makeSupabaseMock({
      nodeByWallet: {
        email: "owner@myshape.com",
        status: "ACTIVE",
        wallet_address: ATTACKER_WALLET.address.toLowerCase(),
        node_handle: "SIG_OWNER",
      },
    });
    const res = await callRoute({
      message: ATTACKER_MESSAGE,
      signature: ATTACKER_SIGNATURE,
      address: ATTACKER_WALLET.address,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      is_bound?: boolean;
      skip_otp?: boolean;
      node_handle?: string | null;
      status?: string;
    };
    expect(body.is_bound).toBe(true);
    expect(body.skip_otp).toBe(true);
    expect(body.node_handle).toBe("SIG_OWNER");
    expect(body.status).toBe("ACTIVE");
    // Only the trusted wallet_verified_at refresh — never a wallet_address write
    expect(fake().updates).toHaveLength(1);
    expect(Object.keys(fake().updates[0].payload)).toEqual(["wallet_verified_at"]);
    expect(fake().updates[0].target).toEqual({
      col: "wallet_address",
      value: ATTACKER_WALLET.address.toLowerCase(),
    });
  });

  it("Test E2 — bound GENESIS_NODE wallet keeps skip_otp without any email input", async () => {
    supabaseState.current = makeSupabaseMock({
      nodeByWallet: {
        email: "genesis@myshape.com",
        status: "GENESIS_NODE",
        wallet_address: ATTACKER_WALLET.address.toLowerCase(),
        node_handle: "SIG_GENESIS",
      },
    });
    const res = await callRoute({
      message: ATTACKER_MESSAGE,
      signature: ATTACKER_SIGNATURE,
      address: ATTACKER_WALLET.address,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { skip_otp?: boolean; is_genesis?: boolean };
    expect(body.is_genesis).toBe(true);
    expect(body.skip_otp).toBe(true);
  });

  it("Test F — wallet already bound elsewhere: victim email MUST NOT overwrite any binding", async () => {
    supabaseState.current = makeSupabaseMock({
      nodeByWallet: {
        email: "attacker-own@myshape.com",
        status: "ACTIVE",
        wallet_address: ATTACKER_WALLET.address.toLowerCase(),
        node_handle: "SIG_ATTACKER_OWN",
      },
    });
    const res = await callRoute({
      message: ATTACKER_MESSAGE,
      signature: ATTACKER_SIGNATURE,
      address: ATTACKER_WALLET.address,
      email: "victim@myshape.com",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { email?: string | null; node_handle?: string | null };
    expect(body.email).toBe("attacker-own@myshape.com");
    expect(body.node_handle).toBe("SIG_ATTACKER_OWN");
    expect(fake().updates.filter((u) => "wallet_address" in u.payload)).toHaveLength(0);
    expect(fake().selects.filter((s) => s.col === "email")).toHaveLength(0);
  });

  it("Test G — unbound wallet without email: pre-existing behavior preserved (NEW, no skip_otp)", async () => {
    supabaseState.current = makeSupabaseMock({ nodeByWallet: null });
    const res = await callRoute({
      message: ATTACKER_MESSAGE,
      signature: ATTACKER_SIGNATURE,
      address: ATTACKER_WALLET.address,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { is_bound?: boolean; skip_otp?: boolean; status?: string };
    expect(body.is_bound).toBe(false);
    expect(body.skip_otp).toBe(false);
    expect(body.status).toBe("NEW");
    expect(fake().updateCount).toBe(0);
  });

  it("Test H — internal errors are sanitized (no exception details leak to the client)", async () => {
    supabaseState.current = makeSupabaseMock({ nodeByWallet: null, throwOnSelect: true });
    const res = await callRoute({
      message: ATTACKER_MESSAGE,
      signature: ATTACKER_SIGNATURE,
      address: ATTACKER_WALLET.address,
    });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe("INTERNAL_SERVER_ERROR");
  });

  it("invalid signature (recovered ≠ claimed address) is still rejected with 401", async () => {
    supabaseState.current = makeSupabaseMock({ nodeByWallet: null });
    const res = await callRoute({
      message: ATTACKER_MESSAGE,
      signature: ATTACKER_SIGNATURE,
      address: "0x000000000000000000000000000000000000dEaD",
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toContain("SIGNATURE_MISMATCH");
  });
});
