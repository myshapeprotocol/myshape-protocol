/**
 * P0-HOTFIX-1 Security Regression — /api/dev/activate
 *
 * Security invariant: in production the endpoint is fully disabled —
 * an arbitrary ms_* token + an arbitrary node_handle must not mutate node
 * state, and no database client may even be constructed (the guard runs at
 * the earliest point of the handler).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const supabaseState = vi.hoisted(() => ({
  constructed: 0,
  current: null as {
    updates: Array<{ payload: Record<string, unknown>; target: { col: string; value: unknown } }>;
  } | null,
}));

function makeSupabaseMock(node: Record<string, unknown> | null) {
  const updates: Array<{ payload: Record<string, unknown>; target: { col: string; value: unknown } }> = [];
  return {
    updates,
    from(_table: string) {
      return {
        select(_cols?: string) {
          return {
            eq: (_col: string, _value: unknown) => ({
              maybeSingle: async () => ({ data: node, error: null }),
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
  createClient: () => {
    supabaseState.constructed += 1;
    return supabaseState.current;
  },
}));

function requestWithHeaderToken(body: Record<string, unknown>, token: string): Request {
  return new Request("http://localhost/api/dev/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-node-token": token },
    body: JSON.stringify(body),
  });
}

function requestWithBodyToken(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/dev/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
let savedEnv: Record<string, string | undefined> = {};
let savedNodeEnv: string | undefined;

function setNodeEnv(value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = value;
}

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  savedNodeEnv = process.env.NODE_ENV;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  supabaseState.constructed = 0;
  supabaseState.current = null;
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  setNodeEnv(savedNodeEnv);
});

describe("P0-3 dev/activate — production disable (unauthenticated write blocked)", () => {
  it("production: arbitrary ms_* token + arbitrary node_handle → 404, zero DB clients, zero mutations", async () => {
    setNodeEnv("production");
    const { POST } = await import("./route");
    const res = await POST(requestWithHeaderToken({ node_handle: "SIG_VICTIM" }, "ms_arbitrary_attacker_token"));
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe("NOT_FOUND");
    // Guard runs before anything else — not even a Supabase client is built
    expect(supabaseState.constructed).toBe(0);
  });

  it("production: body-supplied node_token variant is equally disabled", async () => {
    setNodeEnv("production");
    const { POST } = await import("./route");
    const res = await POST(requestWithBodyToken({ node_handle: "SIG_VICTIM", node_token: "ms_body_token" }));
    expect(res.status).toBe(404);
    expect(supabaseState.constructed).toBe(0);
  });

  it("production: email-targeted variant (victim email + token) cannot mutate node state", async () => {
    setNodeEnv("production");
    const { POST } = await import("./route");
    const res = await POST(requestWithHeaderToken({ email: "victim@myshape.com" }, "ms_x"));
    expect(res.status).toBe(404);
    expect(supabaseState.constructed).toBe(0);
  });

  it("development: existing activation flow preserved (activated:true, scan_count incremented)", async () => {
    setNodeEnv("development");
    supabaseState.current = makeSupabaseMock({
      email: "dev@myshape.dev",
      scan_count: 1,
      node_handle: "SIG_DEV",
      status: "TEST_ACCOUNT",
    });
    const { POST } = await import("./route");
    const res = await POST(requestWithHeaderToken({ node_handle: "SIG_DEV" }, "ms_devtoken"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { activated?: boolean; scan_count?: number };
    expect(body.activated).toBe(true);
    expect(body.scan_count).toBe(2);
    const current = supabaseState.current;
    if (!current) throw new Error("mock not initialized");
    expect(current.updates[0].payload.scan_count).toBe(2);
    expect(current.updates[0].target).toEqual({ col: "email", value: "dev@myshape.dev" });
  });
});
