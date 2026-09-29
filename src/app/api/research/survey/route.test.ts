/**
 * Questionnaire submission contract (Patch 2 — auditable research governance).
 *
 * Invariants under test:
 *   - consent is required: a submission without consent_version is refused
 *   - an unrecognised consent_version is refused, never stored
 *   - the supported version is accepted
 *   - consent_at is generated server-side and a client-supplied one is refused
 *   - the pre-existing required fields still work
 *   - optional contact still works: present, absent, blank, length-capped
 *   - a failed submission never reports success
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { POST } from "./route";

const VALID_BASE = {
  domain: "Robotics",
  has_sensor_data: "Yes, occasionally",
  pain_point: "Rarely",
};

type SupabaseCall = { url: string; payload: Record<string, unknown> };

const supabase = vi.hoisted(() => ({ calls: [] as SupabaseCall[], nextStatus: 200 }));

/**
 * The route keys its rate limiter on client IP, and the limiter is a module
 * singleton that lives for the whole test file. If every test used one source
 * IP, the shared counter would trip after five requests and later tests would
 * get 429 instead of the status under test. Each call therefore gets its own
 * source IP, which keeps the rate limiter out of the way of these assertions.
 */
let ipCounter = 0;
function makeRequest(payload: unknown, headers: Record<string, string> = {}): Request {
  ipCounter += 1;
  return new Request("https://example.test/api/research/survey", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `10.0.0.${ipCounter}`,
      ...headers,
    },
    body: JSON.stringify(payload),
  });
}

beforeEach(() => {
  supabase.calls.length = 0;
  supabase.nextStatus = 200;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  delete process.env.DISCORD_WEBHOOK_URL;

  vi.stubGlobal("fetch", async (input: string | URL, init?: RequestInit) => {
    supabase.calls.push({ url: String(input), payload: JSON.parse(String(init?.body ?? "{}")) });
    return new Response("", { status: supabase.nextStatus });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("consent is required", () => {
  it("rejects a submission with no consent_version", async () => {
    const res = await POST(makeRequest(VALID_BASE));

    expect(res.status).toBe(400);
    expect((await res.json()).ok).toBe(false);
    expect(supabase.calls).toHaveLength(0);
  });

  it("rejects a blank consent_version", async () => {
    const res = await POST(makeRequest({ ...VALID_BASE, consent_version: "   " }));

    expect(res.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });

  it("rejects an unrecognised consent_version", async () => {
    const res = await POST(makeRequest({ ...VALID_BASE, consent_version: "survey-consent-v99" }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Unrecognised consent version");
    expect(supabase.calls).toHaveLength(0);
  });
});

describe("consent_at is server-generated", () => {
  it("sets consent_at on an accepted submission", async () => {
    await POST(makeRequest({ ...VALID_BASE, consent_version: "survey-consent-v1" }));

    expect(typeof supabase.calls[0].payload.consent_at).toBe("string");
    expect(Number.isNaN(Date.parse(String(supabase.calls[0].payload.consent_at)))).toBe(false);
  });

  it("refuses a client-supplied consent_at rather than storing it", async () => {
    const res = await POST(
      makeRequest({
        ...VALID_BASE,
        consent_version: "survey-consent-v1",
        consent_at: "1999-01-01T00:00:00.000Z",
      }),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Unknown fields are not accepted");
    expect(supabase.calls).toHaveLength(0);
  });
});

describe("required questionnaire fields still enforced", () => {
  it.each(["domain", "has_sensor_data", "pain_point"])("rejects a submission missing %s", async (key) => {
    const payload: Record<string, unknown> = { ...VALID_BASE, consent_version: "survey-consent-v1" };
    delete payload[key];

    const res = await POST(makeRequest(payload));

    expect(res.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });

  it("rejects an unknown field", async () => {
    const res = await POST(
      makeRequest({ ...VALID_BASE, consent_version: "survey-consent-v1", surprise: "x" }),
    );

    expect(res.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });
});

describe("optional follow-up contact", () => {
  it("stores contact when provided", async () => {
    await POST(
      makeRequest({ ...VALID_BASE, consent_version: "survey-consent-v1", contact: "me@example.test" }),
    );

    expect(supabase.calls[0].payload.contact).toBe("me@example.test");
  });

  it("stores NULL when contact is absent", async () => {
    await POST(makeRequest({ ...VALID_BASE, consent_version: "survey-consent-v1" }));

    expect(supabase.calls[0].payload.contact).toBeNull();
  });

  it("stores NULL when contact is blank", async () => {
    await POST(makeRequest({ ...VALID_BASE, consent_version: "survey-consent-v1", contact: "   " }));

    expect(supabase.calls[0].payload.contact).toBeNull();
  });

  it("still rejects contact over 300 characters", async () => {
    const res = await POST(
      makeRequest({
        ...VALID_BASE,
        consent_version: "survey-consent-v1",
        contact: "x".repeat(301),
      }),
    );

    expect(res.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });
});

describe("failed submission never reports success", () => {
  it("returns 502 and no ok:true when the insert fails", async () => {
    supabase.nextStatus = 500;

    const res = await POST(makeRequest({ ...VALID_BASE, consent_version: "survey-consent-v1" }));
    const result = await res.json();

    expect(res.status).toBe(502);
    expect(result.ok).toBe(false);
  });

  it("returns 500 when Supabase env is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const res = await POST(makeRequest({ ...VALID_BASE, consent_version: "survey-consent-v1" }));

    expect(res.status).toBe(500);
    expect((await res.json()).ok).toBe(false);
  });
});
