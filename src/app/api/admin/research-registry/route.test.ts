/**
 * Phase 1.5.3 — /api/admin/research-registry verification consumer.
 *
 * The handler resolves the record through the real reader against the real
 * file on disk (process.cwd()/research-assets/registry/RN-002.json), so these
 * tests exercise the same static path the production route would.
 *
 * Two invariants are asserted beyond the happy path:
 *   - the response is a fixed six-field projection, so a future contract
 *     addition cannot widen the endpoint's surface unnoticed;
 *   - auth follows the admin convention (x-admin-secret vs ADMIN_SECRET).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { GET, runtime, dynamic } from "./route";

const SECRET = "test-admin-secret";

function request(headers: Record<string, string> = {}): Request {
  return new Request("https://example.invalid/api/admin/research-registry", {
    headers,
  });
}

describe("/api/admin/research-registry", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_SECRET", SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is declared as a Node-runtime, dynamically rendered route", () => {
    expect(runtime).toBe("nodejs");
    expect(dynamic).toBe("force-dynamic");
  });

  it("resolves RN-002 in the Node runtime and returns only verification metadata", async () => {
    const res = await GET(request({ "x-admin-secret": SECRET }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      asset_id: "RN-002",
      asset_type: "research_note",
      version: "v0.2",
      canonical_source: "papers/rn-002/pes-benchmark-v0.2-article.md",
      declared_state: "IN_REVIEW",
      runtime: "nodejs",
    });
  });

  it("exposes exactly six fields — no content, title, URL or approval data", async () => {
    const res = await GET(request({ "x-admin-secret": SECRET }));
    const payload = (await res.json()) as Record<string, unknown>;

    expect(Object.keys(payload).sort()).toEqual([
      "asset_id",
      "asset_type",
      "canonical_source",
      "declared_state",
      "runtime",
      "version",
    ]);
    expect(JSON.stringify(payload)).not.toMatch(
      /content|title|canonical_url|approval|published/i,
    );
  });

  it("rejects a request without the admin secret", async () => {
    const res = await GET(request());

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "UNAUTHORIZED" });
  });

  it("rejects a request with a wrong admin secret", async () => {
    const res = await GET(request({ "x-admin-secret": "wrong" }));

    expect(res.status).toBe(401);
  });

  it("is closed when ADMIN_SECRET is unset outside development", async () => {
    vi.stubEnv("ADMIN_SECRET", "");
    vi.stubEnv("NODE_ENV", "test");

    const res = await GET(request());

    expect(res.status).toBe(401);
  });
});

/**
 * Leak guard: the reader is mocked to hand back a record carrying fields the
 * Phase 1.4D contract forbids. If the endpoint ever stopped projecting
 * field-by-field and started spreading the record, these would surface.
 */
describe("/api/admin/research-registry field projection", () => {
  const CONTRACT_FIELDS = [
    "asset_id",
    "asset_type",
    "canonical_source",
    "declared_state",
    "version",
  ];

  const FORBIDDEN = {
    title: "LEAK_TITLE_MARKER",
    content: "LEAK_CONTENT_MARKER",
    canonical_url: "LEAK_URL_MARKER",
    approval_state: "LEAK_APPROVAL_MARKER",
    publication_state: "LEAK_PUBLICATION_MARKER",
    author: "LEAK_AUTHOR_MARKER",
  } as const;

  beforeEach(() => {
    vi.stubEnv("ADMIN_SECRET", "test-admin-secret");
  });

  afterEach(() => {
    vi.doUnmock("@/lib/research-registry");
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  async function getWithForbiddenFields() {
    vi.resetModules();
    vi.doMock("@/lib/research-registry", () => ({
      getRegistryRecord: () => ({
        asset_id: "RN-002",
        asset_type: "research_note",
        version: "v0.2",
        canonical_source: "papers/rn-002/pes-benchmark-v0.2-article.md",
        declared_state: "IN_REVIEW",
        ...FORBIDDEN,
      }),
    }));
    const mod = await import("./route");
    const res = await mod.GET(
      new Request("https://example.invalid/api/admin/research-registry", {
        headers: { "x-admin-secret": "test-admin-secret" },
      }),
    );
    return res;
  }

  it("does not leak additional JSON fields through the endpoint", async () => {
    const res = await getWithForbiddenFields();
    expect(res.status).toBe(200);

    const payload = (await res.json()) as Record<string, unknown>;
    const serialised = JSON.stringify(payload);

    for (const marker of Object.values(FORBIDDEN)) {
      expect(serialised).not.toContain(marker);
    }
    expect(payload).not.toHaveProperty("title");
    expect(payload).not.toHaveProperty("canonical_url");
    expect(payload).not.toHaveProperty("approval_state");
    expect(payload).not.toHaveProperty("publication_state");
  });

  it("exposes the five contract fields plus only the runtime marker", async () => {
    const res = await getWithForbiddenFields();
    const payload = (await res.json()) as Record<string, unknown>;

    // `runtime` is a constant the endpoint adds, not contract data.
    expect(Object.keys(payload).sort()).toEqual([...CONTRACT_FIELDS, "runtime"].sort());
    for (const field of CONTRACT_FIELDS) {
      expect(payload).toHaveProperty(field);
    }
    expect(payload.runtime).toBe("nodejs");
  });

  it("sources every contract field from the record, not from a literal", async () => {
    vi.resetModules();
    vi.doMock("@/lib/research-registry", () => ({
      getRegistryRecord: () => ({
        asset_id: "BM-001",
        asset_type: "benchmark",
        version: "v9.9",
        canonical_source: "papers/bm-001/other.md",
        declared_state: "DRAFT",
      }),
    }));
    const mod = await import("./route");
    const res = await mod.GET(
      new Request("https://example.invalid/api/admin/research-registry", {
        headers: { "x-admin-secret": "test-admin-secret" },
      }),
    );
    const payload = (await res.json()) as Record<string, unknown>;

    expect(payload.asset_id).toBe("BM-001");
    expect(payload.asset_type).toBe("benchmark");
    expect(payload.version).toBe("v9.9");
    expect(payload.canonical_source).toBe("papers/bm-001/other.md");
    expect(payload.declared_state).toBe("DRAFT");
    expect(payload.runtime).toBe("nodejs");
  });
});
