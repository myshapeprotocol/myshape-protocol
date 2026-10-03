// ============================================================
// Contract tests for the production DistributionRepository adapter.
//
// VERIFICATION BOUNDARY
//
// No database, no network, no Supabase client. Every case is a
// plain object double driving the real mapping code.
//
// These tests prove the adapter's FIELD MAPPING and its NULL-VS-
// EMPTY semantics — that a failed read stays distinguishable from a
// successful read with zero rows, which is the distinction
// `readHistory` and X-04 depend on.
//
// They do NOT prove that PostgREST, RLS or the service-role grants
// actually return what this adapter asks for, nor that the columns
// named here exist in a deployed database. Those need a live
// database and are a pre-application check, exactly as the
// migration's own comments state.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  createSupabaseDistributionRepository,
  type SupabaseReadClient,
} from "./distribution-repository-supabase";

/** What a stubbed query returns, per table. */
interface Stubbed {
  data?: unknown;
  error?: unknown;
}

/**
 * Read-only client double.
 *
 * Records every call so a test can assert not only what was returned
 * but what was asked for — and can prove no mutation verb was used,
 * because none exists on this object to be used.
 */
function readDouble(tables: Record<string, Stubbed>) {
  const calls: Array<{ table: string; columns: string; order?: string }> = [];

  const client = {
    from(table: string) {
      const stub = tables[table] ?? { data: null, error: null };
      const record = (columns: string, order?: string) => {
        calls.push({ table, columns, order });
      };
      return {
        select(columns: string) {
          return {
            eq(_column: string, _value: string) {
              return {
                maybeSingle() {
                  record(columns);
                  return Promise.resolve({
                    data: stub.data ?? null,
                    error: stub.error ?? null,
                  });
                },
                order(column: string) {
                  record(columns, column);
                  return Promise.resolve({
                    data: stub.data ?? null,
                    error: stub.error ?? null,
                  });
                },
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseReadClient;

  return { client, calls };
}

const DIST = "research_distribution";
const EVENT = "research_distribution_event";
const ATTEMPT = "research_distribution_attempt";


// ---------------------------------------------------------------
// loadDistribution
// ---------------------------------------------------------------

describe("loadDistribution", () => {
  it("maps an existing row to DistributionProvenance", async () => {
    const { client } = readDouble({
      [DIST]: { data: { distribution_id: 7, registry_commit: "abc1234" } },
    });
    const repo = createSupabaseDistributionRepository(client);

    const provenance = await repo.loadDistribution("7");
    expect(provenance).toEqual({
      distribution_id: "7",
      registry_commit: "abc1234",
    });
  });

  it("returns null for a missing row, not an empty object", async () => {
    const { client } = readDouble({ [DIST]: { data: null } });
    const repo = createSupabaseDistributionRepository(client);
    expect(await repo.loadDistribution("7")).toBeNull();
  });

  it("returns null on a read error", async () => {
    const { client } = readDouble({
      [DIST]: { data: null, error: new Error("connection reset") },
    });
    const repo = createSupabaseDistributionRepository(client);
    expect(await repo.loadDistribution("7")).toBeNull();
  });

  it("returns null when a row carries no usable identity", async () => {
    // A reading we cannot identify is not a trustworthy anchor.
    const { client } = readDouble({
      [DIST]: { data: { registry_commit: "abc1234" } },
    });
    const repo = createSupabaseDistributionRepository(client);
    expect(await repo.loadDistribution("7")).toBeNull();
  });

  it("never selects the cached governance or delivery columns", async () => {
    // Those are derived values. Surfacing them would give the control
    // plane a second, unverified source of truth.
    const { client, calls } = readDouble({
      [DIST]: { data: { distribution_id: 7, registry_commit: "abc1234" } },
    });
    await createSupabaseDistributionRepository(client).loadDistribution("7");

    const asked = calls[0].columns.split(",").sort();
    expect(asked).toEqual(["distribution_id", "registry_commit"]);
    expect(calls[0].columns).not.toContain("governance_state");
    expect(calls[0].columns).not.toContain("delivery_state");
  });
});

// ---------------------------------------------------------------
// loadEvents
// ---------------------------------------------------------------

describe("loadEvents", () => {
  it("maps existing events to GovernanceEventInput", async () => {
    const { client } = readDouble({
      [EVENT]: {
        data: [
          {
            event_id: 1,
            decision: "approved",
            approver_type: "HUMAN",
            approver_id: "research-lead",
            approval_ref: "review-0001",
            content_fingerprint: "f".repeat(64),
            registry_commit: "abc1234",
            reason: null,
          },
        ],
      },
    });
    const events = await createSupabaseDistributionRepository(
      client,
    ).loadEvents("7");

    expect(events).toHaveLength(1);
    expect(events?.[0]).toEqual({
      event_id: 1,
      decision: "approved",
      approver_type: "HUMAN",
      approver_id: "research-lead",
      approval_ref: "review-0001",
      content_fingerprint: "f".repeat(64),
      registry_commit: "abc1234",
      reason: null,
    });
  });

  it("returns [] when there are genuinely no events", async () => {
    const { client } = readDouble({ [EVENT]: { data: [] } });
    const events = await createSupabaseDistributionRepository(
      client,
    ).loadEvents("7");
    expect(events).toEqual([]);
  });

  it("returns null on a read error and NEVER converts it to []", async () => {
    // This is the distinction X-04 depends on: an unreadable history
    // must not look like an empty one.
    const { client } = readDouble({
      [EVENT]: { data: null, error: new Error("permission denied") },
    });
    const events = await createSupabaseDistributionRepository(
      client,
    ).loadEvents("7");
    expect(events).toBeNull();
  });

  it("orders oldest first by event_id", async () => {
    const { client, calls } = readDouble({ [EVENT]: { data: [] } });
    await createSupabaseDistributionRepository(client).loadEvents("7");
    expect(calls[0].order).toBe("event_id");
  });
});


// ---------------------------------------------------------------
// loadAttempts
// ---------------------------------------------------------------

describe("loadAttempts", () => {
  it("maps existing attempts to DeliveryAttemptInput", async () => {
    const { client } = readDouble({
      [ATTEMPT]: {
        data: [
          { attempt_id: 1, status: "SUCCEEDED", reconciliation_required: false },
          { attempt_id: 2, status: "IN_FLIGHT", reconciliation_required: true },
        ],
      },
    });
    const attempts = await createSupabaseDistributionRepository(
      client,
    ).loadAttempts("7");

    expect(attempts).toEqual([
      { attempt_id: 1, status: "SUCCEEDED", reconciliation_required: false },
      { attempt_id: 2, status: "IN_FLIGHT", reconciliation_required: true },
    ]);
  });

  it("returns [] when there are genuinely no attempts", async () => {
    const { client } = readDouble({ [ATTEMPT]: { data: [] } });
    const attempts = await createSupabaseDistributionRepository(
      client,
    ).loadAttempts("7");
    expect(attempts).toEqual([]);
  });

  it("returns null on a read error and NEVER converts it to []", async () => {
    const { client } = readDouble({
      [ATTEMPT]: { data: null, error: new Error("timeout") },
    });
    const attempts = await createSupabaseDistributionRepository(
      client,
    ).loadAttempts("7");
    expect(attempts).toBeNull();
  });

  it("orders oldest first by attempt_id", async () => {
    const { client, calls } = readDouble({ [ATTEMPT]: { data: [] } });
    await createSupabaseDistributionRepository(client).loadAttempts("7");
    expect(calls[0].order).toBe("attempt_id");
  });
});

// ---------------------------------------------------------------
// Read-only boundary
// ---------------------------------------------------------------

describe("repository is read-only", () => {
  it("exposes only the three read methods", () => {
    const { client } = readDouble({});
    const repo = createSupabaseDistributionRepository(client);
    expect(Object.keys(repo).sort()).toEqual([
      "loadAttempts",
      "loadDistribution",
      "loadEvents",
    ]);
  });

  it("has no mutation verb on its client query builder", () => {
    // The double defines only `from(...).select(...)`. If the adapter
    // needed to write, it could not type-check.
    const { client } = readDouble({});
    const from = (client as unknown as { from: (t: string) => object }).from;
    const query = from("x") as Record<string, unknown>;
    expect(Object.keys(query)).toEqual(["select"]);
    for (const verb of ["insert", "update", "upsert", "delete", "rpc"]) {
      expect(query).not.toHaveProperty(verb);
    }
  });

  it("queries only the three distribution tables", async () => {
    const { client, calls } = readDouble({
      [DIST]: { data: { distribution_id: 7, registry_commit: "abc1234" } },
      [EVENT]: { data: [] },
      [ATTEMPT]: { data: [] },
    });
    const repo = createSupabaseDistributionRepository(client);
    await repo.loadDistribution("7");
    await repo.loadEvents("7");
    await repo.loadAttempts("7");

    expect(calls.map((c) => c.table)).toEqual([DIST, EVENT, ATTEMPT]);
  });
});
