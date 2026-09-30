/**
 * Operator read page — authorization and query-safety contract.
 *
 * The security invariant is that no response data is read or rendered unless
 * a valid, unexpired session cookie is present. Each failing case also asserts
 * that the Supabase read was never attempted.
 *
 * Follows the JSX-runtime stubbing pattern already used by
 * discovery-survey/responses/page.test.ts, because the page is a .tsx server
 * component and the dev JSX runtime is unavailable in the node test env.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "node:crypto";

const notFoundState = vi.hoisted(() => ({ called: false }));
const fetchState = vi.hoisted(() => ({ urls: [] as string[], calls: 0 }));
const cookieState = vi.hoisted(() => ({ value: undefined as string | undefined }));
const envState = vi.hoisted(() => ({
  secret: "test-operator-secret" as string | undefined,
  serviceKey: "test-service-key" as string | undefined,
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    notFoundState.called = true;
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));

vi.mock("react/jsx-dev-runtime", () => ({
  jsxDEV: (type: unknown, props: unknown) => ({ type, props }),
  Fragment: "Fragment",
}));

vi.mock("react/jsx-runtime", () => ({
  jsx: (type: unknown, props: unknown) => ({ type, props }),
  jsxs: (type: unknown, props: unknown) => ({ type, props }),
  Fragment: "Fragment",
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "op_session" && cookieState.value !== undefined
        ? { name, value: cookieState.value }
        : undefined,
  }),
}));

const SECRET = "test-operator-secret";
const NOW = Date.now();

function validToken(offsetSeconds = 0): string {
  const payload = Buffer.from(
    JSON.stringify({ v: 1, iat: Math.floor(NOW / 1000) + offsetSeconds }),
    "utf8",
  ).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

beforeEach(() => {
  notFoundState.called = false;
  fetchState.calls = 0;
  fetchState.urls = [];
  cookieState.value = undefined;
  envState.secret = SECRET;
  envState.serviceKey = "test-service-key";

  process.env.OPERATOR_SECRET = SECRET;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

  vi.stubGlobal("fetch", async (input: string | URL) => {
    fetchState.calls += 1;
    fetchState.urls.push(String(input));
    return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.OPERATOR_SECRET;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

async function renderPage(searchParams: Record<string, string> = {}) {
  const { default: Page } = await import("./page");
  return Page({ searchParams: Promise.resolve(searchParams) });
}

describe("authorization gate", () => {
  it("404s with no session cookie and performs no read", async () => {
    await expect(renderPage({ instrument: "survey" })).rejects.toThrow("404");
    expect(notFoundState.called).toBe(true);
    expect(fetchState.calls).toBe(0);
  });

  it("404s when OPERATOR_SECRET is not configured, even with a token", async () => {
    delete process.env.OPERATOR_SECRET;
    cookieState.value = validToken();
    await expect(renderPage({ instrument: "survey" })).rejects.toThrow("404");
    expect(fetchState.calls).toBe(0);
  });

  it("404s on a tampered token and performs no read", async () => {
    cookieState.value = "garbage.signature";
    await expect(renderPage({ instrument: "survey" })).rejects.toThrow("404");
    expect(fetchState.calls).toBe(0);
  });

  it("404s on an expired token and performs no read", async () => {
    cookieState.value = validToken(-7200);
    await expect(renderPage({ instrument: "survey" })).rejects.toThrow("404");
    expect(fetchState.calls).toBe(0);
  });
});

describe("valid session", () => {
  beforeEach(() => {
    cookieState.value = validToken();
  });

  it("renders survey rows", async () => {
    const result = await renderPage({ instrument: "survey" });
    expect(notFoundState.called).toBe(false);
    expect(fetchState.calls).toBe(1);
    expect(result).toBeTruthy();
  });

  it("renders participation rows", async () => {
    const result = await renderPage({ instrument: "participation" });
    expect(notFoundState.called).toBe(false);
    expect(fetchState.calls).toBe(1);
    expect(result).toBeTruthy();
  });
});

describe("instrument isolation", () => {
  beforeEach(() => {
    cookieState.value = validToken();
  });

  it("reads only discovery_survey for instrument=survey", async () => {
    await renderPage({ instrument: "survey" });
    expect(fetchState.urls[0]).toContain("/rest/v1/discovery_survey");
    expect(fetchState.urls[0]).not.toContain("research_participation");
  });

  it("reads only research_participation for instrument=participation", async () => {
    await renderPage({ instrument: "participation" });
    expect(fetchState.urls[0]).toContain("/rest/v1/research_participation");
    expect(fetchState.urls[0]).not.toContain("discovery_survey");
  });

  it("404s when instrument is missing", async () => {
    await expect(renderPage({})).rejects.toThrow("404");
    expect(fetchState.calls).toBe(0);
  });

  it("404s on an unknown instrument and performs no read", async () => {
    for (const bad of ["abc", "123", "discovery_survey", "Survey"]) {
      await expect(renderPage({ instrument: bad })).rejects.toThrow("404");
    }
    expect(fetchState.calls).toBe(0);
  });

  it("never puts a caller-supplied table name in the query", async () => {
    await expect(
      renderPage({ instrument: "survey", table: "recruitment_applications" }),
    ).resolves.toBeTruthy();
    expect(fetchState.urls[0]).not.toContain("recruitment_applications");
  });
});

describe("query parameters", () => {
  beforeEach(() => {
    cookieState.value = validToken();
  });

  it("clamps limit to the hard maximum", async () => {
    await renderPage({ instrument: "survey", limit: "999999" });
    expect(fetchState.urls[0]).toContain("limit=100");
  });

  it("falls back to the default for a non-numeric limit", async () => {
    await renderPage({ instrument: "survey", limit: "abc" });
    expect(fetchState.urls[0]).toContain("limit=50");
  });

  it("handles a negative limit without producing a bad query", async () => {
    await renderPage({ instrument: "survey", limit: "-5" });
    expect(fetchState.urls[0]).toContain("limit=50");
  });

  it("applies has_contact as a fixed filter", async () => {
    await renderPage({ instrument: "survey", has_contact: "1" });
    expect(fetchState.urls[0]).toContain("contact=not.is.null");
  });

  it("applies wants_contact only for participation", async () => {
    await renderPage({ instrument: "participation", wants_contact: "yes" });
    expect(fetchState.urls[0]).toContain("wants_contact=eq.yes");
  });

  it("ignores wants_contact on the survey instrument", async () => {
    await renderPage({ instrument: "survey", wants_contact: "yes" });
    expect(fetchState.urls[0]).not.toContain("wants_contact");
  });

  it("ignores an arbitrary select parameter", async () => {
    await renderPage({ instrument: "survey", select: "contact" });
    expect(fetchState.urls[0]).toContain("select=*");
  });
});

describe("missing service-role configuration", () => {
  beforeEach(() => {
    cookieState.value = validToken();
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("renders without attempting a read", async () => {
    const result = await renderPage({ instrument: "survey" });
    expect(notFoundState.called).toBe(false);
    expect(fetchState.calls).toBe(0);
    expect(result).toBeTruthy();
  });
});
