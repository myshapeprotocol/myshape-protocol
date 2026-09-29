/**
 * P0-AUTH Security Regression — /api/auth/siwe (with replay protection)
 *
 * Security invariants under test:
 *   A wallet signature proves ONLY control of wallet_address.
 *   It must NEVER be treated as proof of email ownership.
 *   Nonce must be server-issued, unexpired, unused, and atomically consumed.
 *   Replay of a consumed nonce MUST be rejected.
 *
 * Real ethers signatures are used (deterministic throwaway test key);
 * the Supabase client is mocked and records every query/write so the
 * tests can assert the ABSENCE of wallet-binding writes.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ethers } from "ethers";
import { randomUUID } from "crypto";
import { apiLookupLimiter } from "@/lib/rate-limiter";

// Deterministic, well-known throwaway test key (never used in production)
const ATTACKER_WALLET = new ethers.Wallet(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
);

/**
 * Build a valid SIWE message with a server-generated nonce.
 */
function buildSiweMessage(
  address: string,
  nonce: string,
  domain: string = "myshape.com",
  expirationOffsetMs: number = 5 * 60 * 1000
): string {
  const now = new Date();
  const expirationTime = new Date(now.getTime() + expirationOffsetMs);
  return `${domain} wants you to sign in:\n${address}\n\nMyShape Protocol — Sovereign Identity Initialization\n\nURI: https://${domain}\nVersion: 1\nChain ID: 8453\nNonce: ${nonce}\nIssued At: ${now.toISOString()}\nExpiration Time: ${expirationTime.toISOString()}`;
}

const supabaseState = vi.hoisted(() => ({
  current: null as {
    selects: Array<{ col: string; value: unknown }>;
    updates: Array<{ payload: Record<string, unknown>; target: { col: string; value: unknown } }>;
    rpcCalls: Array<{ fn: string; params: Record<string, unknown> }>;
    readonly updateCount: number;
    nonceConsumeShouldFail: boolean;
    singleUseNonces: boolean;
  } | null,
}));

function makeSupabaseMock(
  options: {
    nodeByWallet?: Record<string, unknown> | null;
    throwOnSelect?: boolean;
    nonceConsumeShouldFail?: boolean;
    /** Model DB single-use semantics: first consume of a nonce succeeds, any later consume of the SAME nonce fails. */
    singleUseNonces?: boolean;
  } = {}
) {
  const selects: Array<{ col: string; value: unknown }> = [];
  const updates: Array<{ payload: Record<string, unknown>; target: { col: string; value: unknown } }> = [];
  const rpcCalls: Array<{ fn: string; params: Record<string, unknown> }> = [];
  const consumedNonces = new Set<string>();
  return {
    selects,
    updates,
    rpcCalls,
    get updateCount() {
      return updates.length;
    },
    nonceConsumeShouldFail: options.nonceConsumeShouldFail ?? false,
    singleUseNonces: options.singleUseNonces ?? false,
    rpc: (fn: string, params: Record<string, unknown>) => {
      rpcCalls.push({ fn, params });
      return {
        // consume_siwe_nonce returns the consumed row, or null on failure
        then: async (resolve: (value: { data: unknown; error: unknown }) => void) => {
          if (fn === "consume_siwe_nonce") {
            const nonce = String(params.p_nonce ?? "");
            const shouldFail =
              options.nonceConsumeShouldFail ||
              (options.singleUseNonces && consumedNonces.has(nonce));
            if (shouldFail) {
              resolve({ data: null, error: { message: "NONCE_INVALID_OR_CONSUMED" } });
            } else {
              // Atomic check-and-set: mirrors UPDATE ... WHERE used_at IS NULL
              if (options.singleUseNonces) consumedNonces.add(nonce);
              resolve({ data: { nonce: params.p_nonce, used_at: new Date().toISOString() }, error: null });
            }
          } else {
            resolve({ data: null, error: null });
          }
        },
        // For non-promise usage (direct await)
        data: options.nonceConsumeShouldFail ? null : { nonce: params.p_nonce, used_at: new Date().toISOString() },
        error: options.nonceConsumeShouldFail ? { message: "NONCE_INVALID_OR_CONSUMED" } : null,
      };
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

describe("P0-AUTH SIWE — replay protection + email ownership invariant", () => {
  it("Test 1 — valid nonce succeeds", async () => {
    supabaseState.current = makeSupabaseMock({
      nodeByWallet: {
        email: "user@myshape.com",
        status: "ACTIVE",
        wallet_address: ATTACKER_WALLET.address.toLowerCase(),
        node_handle: "SIG_USER",
      },
    });
    const nonce = randomUUID();
    const message = buildSiweMessage(ATTACKER_WALLET.address, nonce);
    const signature = await ATTACKER_WALLET.signMessage(message);
    const res = await callRoute({ message, signature, address: ATTACKER_WALLET.address });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success?: boolean; skip_otp?: boolean };
    expect(body.success).toBe(true);
    expect(body.skip_otp).toBe(true);
    expect(fake().rpcCalls.length).toBe(1);
    expect(fake().rpcCalls[0].fn).toBe("consume_siwe_nonce");
  });

  it("Test 2 — nonexistent nonce rejected", async () => {
    supabaseState.current = makeSupabaseMock({ nodeByWallet: null, nonceConsumeShouldFail: true });
    const nonce = randomUUID();
    const message = buildSiweMessage(ATTACKER_WALLET.address, nonce);
    const signature = await ATTACKER_WALLET.signMessage(message);
    const res = await callRoute({ message, signature, address: ATTACKER_WALLET.address });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("SIWE_NONCE_INVALID");
  });

  it("Test 3 — expired nonce rejected", async () => {
    // Expiry is enforced inside consume_siwe_nonce (SQL: WHERE expires_at > NOW()).
    // The mock simulates the DB rejecting an expired nonce; the route must
    // surface a uniform 400 without leaking WHICH failure occurred.
    supabaseState.current = makeSupabaseMock({ nodeByWallet: null, nonceConsumeShouldFail: true });
    const nonce = randomUUID();
    const message = buildSiweMessage(ATTACKER_WALLET.address, nonce);
    const signature = await ATTACKER_WALLET.signMessage(message);
    const res = await callRoute({ message, signature, address: ATTACKER_WALLET.address });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("SIWE_NONCE_INVALID");
    expect(fake().rpcCalls.length).toBe(1);
    expect(fake().selects).toHaveLength(0);
  });

  it("Test 4 — consumed nonce: first succeeds, second fails", async () => {
    supabaseState.current = makeSupabaseMock({
      nodeByWallet: {
        email: "user@myshape.com",
        status: "ACTIVE",
        wallet_address: ATTACKER_WALLET.address.toLowerCase(),
        node_handle: "SIG_USER",
      },
    });
    const nonce = randomUUID();
    const message = buildSiweMessage(ATTACKER_WALLET.address, nonce);
    const signature = await ATTACKER_WALLET.signMessage(message);
    const res1 = await callRoute({ message, signature, address: ATTACKER_WALLET.address });
    expect(res1.status).toBe(200);
    supabaseState.current = makeSupabaseMock({
      nodeByWallet: {
        email: "user@myshape.com",
        status: "ACTIVE",
        wallet_address: ATTACKER_WALLET.address.toLowerCase(),
        node_handle: "SIG_USER",
      },
      nonceConsumeShouldFail: true,
    });
    const res2 = await callRoute({ message, signature, address: ATTACKER_WALLET.address });
    expect(res2.status).toBe(400);
    expect((await res2.json()).error).toContain("SIWE_NONCE_INVALID");
  });

  it("Test 5 — concurrent replay: exactly one of two identical requests succeeds", async () => {
    // Two concurrent requests racing the SAME valid nonce. The DB function
    // consume_siwe_nonce is atomic (UPDATE ... WHERE used_at IS NULL), so the
    // mock models that semantics with a synchronous check-and-set: the first
    // consume wins, the loser must be rejected.
    supabaseState.current = makeSupabaseMock({
      nodeByWallet: {
        email: "user@myshape.com",
        status: "ACTIVE",
        wallet_address: ATTACKER_WALLET.address.toLowerCase(),
        node_handle: "SIG_USER",
      },
      singleUseNonces: true,
    });
    const nonce = randomUUID();
    const message = buildSiweMessage(ATTACKER_WALLET.address, nonce);
    const signature = await ATTACKER_WALLET.signMessage(message);
    const body = { message, signature, address: ATTACKER_WALLET.address };
    const [resA, resB] = await Promise.all([callRoute(body), callRoute(body)]);
    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 400]);
    const rejected = resA.status === 400 ? resA : resB;
    expect(((await rejected.json()) as { error?: string }).error).toContain("SIWE_NONCE_INVALID");
    expect(fake().rpcCalls.length).toBe(2);
    expect(fake().rpcCalls.every((c) => c.fn === "consume_siwe_nonce")).toBe(true);
  });

  it("Test 6 — client arbitrary nonce: Date.now() rejected", async () => {
    supabaseState.current = makeSupabaseMock({ nodeByWallet: null, nonceConsumeShouldFail: true });
    const clientNonce = Date.now().toString();
    const message = `myshape.com wants you to sign in:\n${ATTACKER_WALLET.address}\n\nMyShape Protocol\n\nURI: https://myshape.com\nVersion: 1\nChain ID: 8453\nNonce: ${clientNonce}\nIssued At: ${new Date().toISOString()}`;
    const signature = await ATTACKER_WALLET.signMessage(message);
    const res = await callRoute({ message, signature, address: ATTACKER_WALLET.address });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/SIWE_INVALID_MESSAGE|SIWE_NONCE_INVALID/);
  });

  it("Test 7 — invalid domain: rejected", async () => {
    supabaseState.current = makeSupabaseMock({ nodeByWallet: null });
    const nonce = randomUUID();
    const message = buildSiweMessage(ATTACKER_WALLET.address, nonce, "evil.com");
    const signature = await ATTACKER_WALLET.signMessage(message);
    const res = await callRoute({ message, signature, address: ATTACKER_WALLET.address });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("SIWE_INVALID_DOMAIN");
  });

  it("Test 8 — invalid URI: rejected", async () => {
    supabaseState.current = makeSupabaseMock({ nodeByWallet: null });
    const nonce = randomUUID();
    const now = new Date();
    const exp = new Date(now.getTime() + 5 * 60 * 1000);
    const message = `myshape.com wants you to sign in:\n${ATTACKER_WALLET.address}\n\nMyShape Protocol\n\nURI: https://evil.com\nVersion: 1\nChain ID: 8453\nNonce: ${nonce}\nIssued At: ${now.toISOString()}\nExpiration Time: ${exp.toISOString()}`;
    const signature = await ATTACKER_WALLET.signMessage(message);
    const res = await callRoute({ message, signature, address: ATTACKER_WALLET.address });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("SIWE_INVALID_URI");
  });

  it("Test 9 — expired SIWE message: rejected", async () => {
    // expirationTime in the past must fail timestamp validation BEFORE any
    // nonce consumption or signature-dependent state change.
    supabaseState.current = makeSupabaseMock({ nodeByWallet: null });
    const nonce = randomUUID();
    const message = buildSiweMessage(ATTACKER_WALLET.address, nonce, "myshape.com", -60_000);
    const signature = await ATTACKER_WALLET.signMessage(message);
    const res = await callRoute({ message, signature, address: ATTACKER_WALLET.address });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("SIWE_MESSAGE_EXPIRED");
    expect(fake().rpcCalls).toHaveLength(0);
  });

  it("Test 10 — invalid signature: rejected", async () => {
    supabaseState.current = makeSupabaseMock({ nodeByWallet: null });
    const nonce = randomUUID();
    const message = buildSiweMessage(ATTACKER_WALLET.address, nonce);
    const wrongWallet = ethers.Wallet.createRandom();
    const signature = await wrongWallet.signMessage(message);
    const res = await callRoute({ message, signature, address: ATTACKER_WALLET.address });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toContain("SIGNATURE_MISMATCH");
  });

  it("Test A — unbound attacker wallet + victim email: MUST reject", async () => {
    supabaseState.current = makeSupabaseMock({ nodeByWallet: null });
    const nonce = randomUUID();
    const message = buildSiweMessage(ATTACKER_WALLET.address, nonce);
    const signature = await ATTACKER_WALLET.signMessage(message);
    const res = await callRoute({
      message, signature, address: ATTACKER_WALLET.address, email: "victim@myshape.com",
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error?: string; skip_otp?: boolean };
    expect(body.error).toContain("EMAIL_VERIFICATION_REQUIRED");
    expect(body.skip_otp).toBeUndefined();
    expect(fake().updates.filter((u) => "wallet_address" in u.payload)).toHaveLength(0);
    expect(fake().selects.filter((s) => s.col === "email")).toHaveLength(0);
  });

  it.each([
    ["ACTIVE", "Test B"],
    ["GENESIS_NODE", "Test C"],
    ["AGENT_ACTIVE", "Test D"],
  ])(
    "%s victim node exists: attacker wallet + victim email MUST NOT bind and MUST NOT return skip_otp (%s)",
    async () => {
      supabaseState.current = makeSupabaseMock({ nodeByWallet: null });
      const nonce = randomUUID();
      const message = buildSiweMessage(ATTACKER_WALLET.address, nonce);
      const signature = await ATTACKER_WALLET.signMessage(message);
      const res = await callRoute({
        message, signature, address: ATTACKER_WALLET.address, email: "victim@myshape.com",
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
    const nonce = randomUUID();
    const message = buildSiweMessage(ATTACKER_WALLET.address, nonce);
    const signature = await ATTACKER_WALLET.signMessage(message);
    const res = await callRoute({ message, signature, address: ATTACKER_WALLET.address });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      is_bound?: boolean; skip_otp?: boolean; node_handle?: string | null; status?: string;
    };
    expect(body.is_bound).toBe(true);
    expect(body.skip_otp).toBe(true);
    expect(body.node_handle).toBe("SIG_OWNER");
    expect(body.status).toBe("ACTIVE");
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
    const nonce = randomUUID();
    const message = buildSiweMessage(ATTACKER_WALLET.address, nonce);
    const signature = await ATTACKER_WALLET.signMessage(message);
    const res = await callRoute({ message, signature, address: ATTACKER_WALLET.address });
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
    const nonce = randomUUID();
    const message = buildSiweMessage(ATTACKER_WALLET.address, nonce);
    const signature = await ATTACKER_WALLET.signMessage(message);
    const res = await callRoute({
      message, signature, address: ATTACKER_WALLET.address, email: "victim@myshape.com",
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
    const nonce = randomUUID();
    const message = buildSiweMessage(ATTACKER_WALLET.address, nonce);
    const signature = await ATTACKER_WALLET.signMessage(message);
    const res = await callRoute({ message, signature, address: ATTACKER_WALLET.address });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { is_bound?: boolean; skip_otp?: boolean; status?: string };
    expect(body.is_bound).toBe(false);
    expect(body.skip_otp).toBe(false);
    expect(body.status).toBe("NEW");
    expect(fake().updateCount).toBe(0);
  });

  it("Test H — internal errors are sanitized (no exception details leak to the client)", async () => {
    supabaseState.current = makeSupabaseMock({ nodeByWallet: null, throwOnSelect: true });
    const nonce = randomUUID();
    const message = buildSiweMessage(ATTACKER_WALLET.address, nonce);
    const signature = await ATTACKER_WALLET.signMessage(message);
    const res = await callRoute({ message, signature, address: ATTACKER_WALLET.address });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe("INTERNAL_SERVER_ERROR");
  });

  it("invalid signature (recovered ≠ claimed address) is still rejected with 401", async () => {
    supabaseState.current = makeSupabaseMock({ nodeByWallet: null });
    const nonce = randomUUID();
    const message = buildSiweMessage(ATTACKER_WALLET.address, nonce);
    const signature = await ATTACKER_WALLET.signMessage(message);
    const res = await callRoute({
      message, signature, address: "0x000000000000000000000000000000000000dEaD",
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toContain("SIGNATURE_MISMATCH");
  });
});
