/**
 * Research Participation intake contract.
 *
 * Invariants under test:
 *   - consent is required and version-checked
 *   - consent_at is server-generated; a client-supplied one is refused
 *   - enums are validated against the exact accepted sets
 *   - multi-select fields accept arrays of known values, reject unknown ones
 *   - contact is only accepted alongside an explicit opt-in
 *   - unknown fields never reach storage
 *   - a failed submission never reports success
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { POST } from "./route";

const VALID_BASE = {
  role: "researcher",
  physical_world: "yes",
  interests: ["learn"],
  wants_contact: "no",
  consent_version: "participation-consent-v1",
};

type SupabaseCall = { url: string; payload: Record<string, unknown> };

const supabase = vi.hoisted(() => ({ calls: [] as SupabaseCall[], nextStatus: 200 }));

/**
 * The route rate-limits on client IP using a module-singleton limiter. Sharing
 * one source IP across tests would trip the limit after five requests and turn
 * later assertions into 429s, so each call gets its own IP.
 */
let ipCounter = 0;
function makeRequest(payload: unknown, headers: Record<string, string> = {}): Request {
  ipCounter += 1;
  return new Request("https://example.test/api/research/participate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `10.1.0.${ipCounter}`,
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
    const res = await POST(makeRequest({ ...VALID_BASE, consent_version: undefined }));

    expect(res.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });

  it("rejects an unrecognised consent_version", async () => {
    const res = await POST(makeRequest({ ...VALID_BASE, consent_version: "participation-consent-v99" }));

    expect(res.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });

  it("accepts participation-consent-v1 and records it", async () => {
    const res = await POST(makeRequest(VALID_BASE));

    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(supabase.calls[0].payload.consent_version).toBe("participation-consent-v1");
  });
});

describe("consent_at is server-generated", () => {
  it("sets consent_at on an accepted submission", async () => {
    await POST(makeRequest(VALID_BASE));

    expect(typeof supabase.calls[0].payload.consent_at).toBe("string");
    expect(Number.isNaN(Date.parse(String(supabase.calls[0].payload.consent_at)))).toBe(false);
  });

  it("refuses a client-supplied consent_at", async () => {
    const res = await POST(makeRequest({ ...VALID_BASE, consent_at: "1999-01-01T00:00:00.000Z" }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Unknown fields are not accepted");
    expect(supabase.calls).toHaveLength(0);
  });
});

describe("enum validation", () => {
  it("rejects an unknown role", async () => {
    const res = await POST(makeRequest({ ...VALID_BASE, role: "wizard" }));

    expect(res.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });

  it("rejects an unknown physical_world value", async () => {
    const res = await POST(makeRequest({ ...VALID_BASE, physical_world: "maybe" }));

    expect(res.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });

  it("rejects an unknown interest", async () => {
    const res = await POST(makeRequest({ ...VALID_BASE, interests: ["become-a-pilot"] }));

    expect(res.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });

  it("rejects an empty interests array", async () => {
    const res = await POST(makeRequest({ ...VALID_BASE, interests: [] }));

    expect(res.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });

  it("rejects a non-array interests value", async () => {
    const res = await POST(makeRequest({ ...VALID_BASE, interests: "learn" }));

    expect(res.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });
});

describe("multi-select areas", () => {
  it("stores the selected areas as an array", async () => {
    await POST(makeRequest({ ...VALID_BASE, areas: ["robotics", "iot"] }));

    expect(supabase.calls[0].payload.areas).toEqual(["robotics", "iot"]);
  });

  it("stores an empty array when no area is chosen", async () => {
    await POST(makeRequest(VALID_BASE));

    expect(supabase.calls[0].payload.areas).toEqual([]);
  });

  it("rejects an unknown area", async () => {
    const res = await POST(makeRequest({ ...VALID_BASE, areas: ["wizardry"] }));

    expect(res.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });

  it("de-duplicates repeated selections", async () => {
    await POST(makeRequest({ ...VALID_BASE, areas: ["iot", "iot"] }));

    expect(supabase.calls[0].payload.areas).toEqual(["iot"]);
  });
});

describe("optional follow-up contact", () => {
  it("stores NULL when contact is not wanted", async () => {
    await POST(makeRequest(VALID_BASE));

    expect(supabase.calls[0].payload.contact).toBeNull();
  });

  it("stores contact when explicitly wanted", async () => {
    await POST(makeRequest({ ...VALID_BASE, wants_contact: "yes", contact: "me@example.test" }));

    expect(supabase.calls[0].payload.contact).toBe("me@example.test");
  });

  it("rejects a contact value without the opt-in", async () => {
    const res = await POST(makeRequest({ ...VALID_BASE, contact: "me@example.test" }));

    expect(res.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });

  it("rejects contact over 300 characters", async () => {
    const res = await POST(
      makeRequest({ ...VALID_BASE, wants_contact: "yes", contact: "x".repeat(301) }),
    );

    expect(res.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });
});

describe("working_on free text", () => {
  it("stores NULL when left blank", async () => {
    await POST(makeRequest({ ...VALID_BASE, working_on: "   " }));

    expect(supabase.calls[0].payload.working_on).toBeNull();
  });

  it("rejects working_on over 300 characters", async () => {
    const res = await POST(makeRequest({ ...VALID_BASE, working_on: "x".repeat(301) }));

    expect(res.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });
});

describe("allow-list and honest failure", () => {
  it("rejects an unknown field", async () => {
    const res = await POST(makeRequest({ ...VALID_BASE, surprise: "x" }));

    expect(res.status).toBe(400);
    expect(supabase.calls).toHaveLength(0);
  });

  it("returns 502 and no ok:true when the insert fails", async () => {
    supabase.nextStatus = 500;

    const res = await POST(makeRequest(VALID_BASE));
    const result = await res.json();

    expect(res.status).toBe(502);
    expect(result.ok).toBe(false);
  });

  it("returns 500 when Supabase env is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const res = await POST(makeRequest(VALID_BASE));

    expect(res.status).toBe(500);
    expect((await res.json()).ok).toBe(false);
  });
});
