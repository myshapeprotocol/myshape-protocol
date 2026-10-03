/**
 * B2 Security Regression  /api/matrix/publish imagePath removal
 *
 * Security invariant: no request payload field may drive a filesystem read,
 * and the disabled publisher never contacts a platform.
 *
 * The route previously destructured `imagePath` out of the request JSON and
 * fed it to path.resolve(process.cwd(), imagePath) -> readFileSync. Because
 * path.resolve() honours absolute paths, and ".." segments walk out of cwd,
 * any caller holding x-api-key could read arbitrary local files and have the
 * bytes uploaded to the public MyShape organization page on LinkedIn.
 *
 * The field was removed outright rather than sanitised: no repo caller ever
 * supplied it, and the documented payload contract never included it.
 *
 * These tests assert the *mechanism* is gone rather than asserting a status
 * code  node:fs is never imported and no image-upload call is ever issued to
 * LinkedIn, even when the caller supplies a hostile path.
 *
 * Current contract (2G-Z0-R1): `POST()` takes ZERO arguments and
 * unconditionally returns HTTP 403 with DIRECT_PUBLISH_DISABLED /
 * MIGRATION_REQUIRED — before any rate limiter, credential check,
 * filesystem access, or platform call. A payload, hostile or not, is
 * never delivered to handler logic. These tests therefore assert 403
 * (the obsolete active-publisher 200/401 expectations were adapted),
 * while keeping the original mechanism assertions: node:fs is never
 * read from and no outbound platform call is ever issued.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const state = vi.hoisted(() => ({
  fsReads: 0,
  linkedinUrls: [] as string[],
}));

vi.mock("node:fs", () => ({
  readFileSync: (target: unknown) => {
    state.fsReads += 1;
    throw new Error("UNEXPECTED FILESYSTEM READ: " + String(target));
  },
  existsSync: () => false,
  readdirSync: () => [],
}));

vi.mock("child_process", () => ({
  execSync: () => {
    throw new Error("no netstat in test env");
  },
}));

vi.mock("undici", () => ({
  ProxyAgent: class {},
  fetch: async (url: string) => {
    state.linkedinUrls.push(String(url));
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-restli-id": "urn:li:share:test-1",
      },
    });
  },
}));

const ENV_KEYS = ["MATRIX_API_KEY", "LINKEDIN_USER_ACCESS_TOKEN"] as const;
let savedEnv: Record<string, string | undefined> = {};

// Builds the request a caller would send (unique client IP per call to mirror
// real traffic). The current handler accepts no request argument, so this
// body is never parsed by the route — construction only documents the
// scenarios being refused.
function post(payload: Record<string, unknown>, ip: string): Request {
  return new Request("http://localhost/api/matrix/publish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "test-matrix-key",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(payload),
  });
}

beforeEach(() => {
  // The route holds module-level rate-limiter state. Reset modules so every
  // test gets a fresh limiter and results never depend on execution order.
  vi.resetModules();
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.MATRIX_API_KEY = "test-matrix-key";
  process.env.LINKEDIN_USER_ACCESS_TOKEN = "test-linkedin-user-token";
  state.fsReads = 0;
  state.linkedinUrls = [];
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

const HOSTILE_PATHS = [
  "../../.env.local",
  "/etc/passwd",
  "C:\\Windows\\win.ini",
  "..\\..\\package.json",
  "../../../../etc/shadow",
  "./src/app/api/matrix/publish/route.ts",
];

describe("B2 - imagePath cannot reach the filesystem", () => {
  it.each(HOSTILE_PATHS)(
    "hostile path %j: no fs read, no platform call, route stays 403",
    async (hostilePath, index) => {
      // The payload a hostile caller would send. POST() takes no arguments
      // (2G-Z0-R1), so this body never reaches handler logic; the route
      // must refuse before it could be parsed.
      const request = post(
        {
          platform: "linkedin",
          content: "invariant check",
          title: "invariant check",
          imagePath: hostilePath,
        },
        "10.0.0." + String(index + 1),
      );
      const sent = (await request.json()) as { imagePath?: string };
      expect(sent.imagePath).toBe(hostilePath);

      const { POST, DIRECT_PUBLISH_DISABLED, MIGRATION_REQUIRED } =
        await import("./route");
      const res = await POST();

      expect(res.status).toBe(403);
      const payload = (await res.json()) as {
        success?: boolean;
        error?: string;
        migration?: string;
      };
      expect(payload.success).toBe(false);
      expect(payload.error).toBe(DIRECT_PUBLISH_DISABLED);
      expect(payload.migration).toBe(MIGRATION_REQUIRED);

      expect(state.fsReads).toBe(0);
      expect(state.linkedinUrls).toHaveLength(0);
    },
  );
});

describe("B2 - disabled-route contract (2G-Z0-R1)", () => {
  it("refuses a payload with no image field: 403, no fs read, no platform call", async () => {
    const request = post(
      { platform: "linkedin", content: "plain text post", title: "plain" },
      "10.1.0.1",
    );
    expect(request.method).toBe("POST");

    const { POST, DIRECT_PUBLISH_DISABLED, MIGRATION_REQUIRED } =
      await import("./route");
    const res = await POST();

    expect(res.status).toBe(403);
    const payload = (await res.json()) as {
      success?: boolean;
      error?: string;
      migration?: string;
    };
    expect(payload.success).toBe(false);
    expect(payload.error).toBe(DIRECT_PUBLISH_DISABLED);
    expect(payload.migration).toBe(MIGRATION_REQUIRED);
    expect(state.fsReads).toBe(0);
    expect(state.linkedinUrls).toHaveLength(0);
  });

  it("treats a supplied imagePath as inert: 403 before any parse, no fs read", async () => {
    const request = post(
      {
        platform: "linkedin",
        content: "unknown field tolerated",
        title: "unknown",
        imagePath: "some/other/field.json",
      },
      "10.1.0.2",
    );
    const sent = (await request.json()) as { imagePath?: string };
    expect(sent.imagePath).toBe("some/other/field.json");

    const { POST } = await import("./route");
    const res = await POST();

    expect(res.status).toBe(403);
    expect(state.fsReads).toBe(0);
    expect(state.linkedinUrls).toHaveLength(0);
  });

  it("refuses unauthenticated callers with the same 403 (no credential check)", async () => {
    const { POST, DIRECT_PUBLISH_DISABLED } = await import("./route");
    const unauthenticated = new Request(
      "http://localhost/api/matrix/publish",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "linkedin",
          content: "no key",
          imagePath: "../../.env.local",
        }),
      },
    );
    expect(unauthenticated.headers.get("x-api-key")).toBeNull();

    const res = await POST();

    // The refusal precedes authentication: callers without a key get the
    // same policy 403, not the legacy 401 credential error.
    expect(res.status).toBe(403);
    const payload = (await res.json()) as { error?: string };
    expect(payload.error).toBe(DIRECT_PUBLISH_DISABLED);
    expect(state.fsReads).toBe(0);
    expect(state.linkedinUrls).toHaveLength(0);
  });
});