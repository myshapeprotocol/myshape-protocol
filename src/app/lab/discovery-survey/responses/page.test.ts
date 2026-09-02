/**
 * P0-HOTFIX-1 Security Regression — /lab/discovery-survey/responses
 *
 * Security invariant: an anonymous request must NEVER obtain survey responses
 * (including contact PII), and the service-role key must never leave the server.
 *
 * Fix under test: production requests receive a hard 404 (next/navigation
 * notFound) BEFORE any data fetch — the service-key query path is unreachable.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const notFoundState = vi.hoisted(() => ({ called: false }));

vi.mock("next/navigation", () => ({
  notFound: () => {
    notFoundState.called = true;
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));

// The page is a .tsx server component; in the vitest node environment the
// dev-mode JSX runtime interop is unavailable (jsxDEV is not a function).
// Stub both JSX runtimes with trivial element factories — the security
// invariant under test (guard fires before any data fetch) does not need
// real element construction.
vi.mock("react/jsx-dev-runtime", () => ({
  jsxDEV: (type: unknown, props: unknown) => ({ type, props }),
  Fragment: "Fragment",
}));
vi.mock("react/jsx-runtime", () => ({
  jsx: (type: unknown, props: unknown) => ({ type, props }),
  jsxs: (type: unknown, props: unknown) => ({ type, props }),
  Fragment: "Fragment",
}));

const fetchState = vi.hoisted(() => ({ calls: 0 }));

let savedNodeEnv: string | undefined;

beforeEach(() => {
  savedNodeEnv = process.env.NODE_ENV;
  notFoundState.called = false;
  fetchState.calls = 0;
  vi.stubGlobal("fetch", async () => {
    fetchState.calls += 1;
    // Simulated DB rows that WOULD leak PII if the guard were missing
    return new Response(
      JSON.stringify([
        {
          id: 1,
          created_at: "2026-08-01T00:00:00Z",
          domain: "security",
          role: "researcher",
          has_sensor_data: "Extensively",
          pain_point: "Frequently",
          solution: "synthetic solution text",
          interest: "Yes — happy to help",
          contact: "victim-pii@example.com",
        },
      ]),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  });
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
});

function setNodeEnv(value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = value;
}

afterEach(() => {
  vi.unstubAllGlobals();
  setNodeEnv(savedNodeEnv);
});

describe("P0-4 — discovery survey responses page (anonymous PII exposure)", () => {
  it("production: anonymous request gets 404 — no survey records, no contact PII, zero data fetches", async () => {
    setNodeEnv("production");
    const { default: ResponsesPage } = await import("./page");
    // Guard fires before any data access — nothing can enter the response
    await expect(ResponsesPage()).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(notFoundState.called).toBe(true);
    // The service-key REST query must never even be attempted
    expect(fetchState.calls).toBe(0);
  });

  it("production: service-role key cannot leak into any response (guard precedes fetch)", async () => {
    setNodeEnv("production");
    const { default: ResponsesPage } = await import("./page");
    await expect(ResponsesPage()).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    // fetch (the only place the service key would be attached) was never called
    expect(fetchState.calls).toBe(0);
  });

  it("development: local dev tooling preserved (page still renders)", async () => {
    setNodeEnv("development");
    const { default: ResponsesPage } = await import("./page");
    const result = (await ResponsesPage()) as unknown;
    expect(notFoundState.called).toBe(false);
    expect(fetchState.calls).toBe(1);
    expect(result).toBeTruthy();
  });
});
