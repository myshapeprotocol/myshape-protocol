/**
 * B2 Security Regression  /api/matrix/publish imagePath removal
 *
 * Security invariant: no request payload field may drive a filesystem read.
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

// Unique client IP per call: the route rate-limits 5 requests / 15 min / IP.
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
    "hostile path %j: no fs read, no image upload, post still publishes",
    async (hostilePath, index) => {
      const { POST } = await import("./route");
      const res = await POST(
        post(
          {
            platform: "linkedin",
            content: "invariant check",
            title: "invariant check",
            imagePath: hostilePath,
          },
          "10.0.0." + String(index + 1),
        ),
      );

      expect(res.status).toBe(200);
      const payload = (await res.json()) as {
        success?: boolean;
        status?: string;
      };
      expect(payload.success).toBe(true);
      expect(payload.status).toBe("PUBLISHED");

      expect(state.fsReads).toBe(0);
      const imageCalls = state.linkedinUrls.filter((u) =>
        u.includes("/v2/images"),
      );
      expect(imageCalls).toHaveLength(0);
      expect(state.linkedinUrls).toEqual([
        "https://api.linkedin.com/v2/posts",
      ]);
    },
  );
});

describe("B2 - existing publish behaviour preserved", () => {
  it("publishes without any image field and never imports node:fs", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      post(
        { platform: "linkedin", content: "plain text post", title: "plain" },
        "10.1.0.1",
      ),
    );

    expect(res.status).toBe(200);
    const payload = (await res.json()) as {
      success?: boolean;
      status?: string;
    };
    expect(payload.success).toBe(true);
    expect(payload.status).toBe("PUBLISHED");
    expect(state.fsReads).toBe(0);
    expect(state.linkedinUrls).toEqual([
      "https://api.linkedin.com/v2/posts",
    ]);
  });

  it("ignores an unknown imagePath silently rather than erroring", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      post(
        {
          platform: "linkedin",
          content: "unknown field tolerated",
          title: "unknown",
          imagePath: "some/other/field.json",
        },
        "10.1.0.2",
      ),
    );

    expect(res.status).toBe(200);
    const payload = (await res.json()) as { status?: string };
    expect(payload.status).toBe("PUBLISHED");
    expect(state.fsReads).toBe(0);
  });

  it("still rejects unauthenticated callers", async () => {
    const { POST } = await import("./route");
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
    const res = await POST(unauthenticated);

    expect(res.status).toBe(401);
    expect(state.fsReads).toBe(0);
  });
});