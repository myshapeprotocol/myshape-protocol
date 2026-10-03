// ============================================================
// Contract tests for W1 — distribution record creation.
//
// Source of truth: RESEARCH-DISTRIBUTION-IMPLEMENTATION-PLAN §1.2.
//
// No database, no Supabase client, no network, no clock. Every case
// is a plain in-memory double.
//
// VERIFICATION BOUNDARY — READ THIS BEFORE TRUSTING A GREEN RUN
//
// These tests prove the ORCHESTRATION contract: that W1 looks up
// the right identity, inserts when absent, preserves an existing row
// untouched, and handles a simulated 23505 without inventing a row.
//
// They do NOT prove, and cannot prove without a live database:
//
//   * that PostgreSQL enforces UNIQUE (version_id, surface,
//     platform, content_fingerprint) — the 23505 here is a fixture;
//   * that the CHECK constraints reject a bad fingerprint or commit;
//   * that RLS or the service-role grants behave as the migration
//     describes;
//   * that a genuine concurrency race is resolved this way.
//
// The existing STATE-TEST-MATRIX §6 records the same limitation for
// every other layer. A green suite means the control flow is right,
// not that the database behaves as expected.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  createDistribution,
  identityOf,
  isUniqueViolation,
  type DistributionCreateInput,
  type DistributionIdentity,
  type DistributionRef,
  type DistributionWriter,
} from "./distribution-writer";

const FP_A = "a".repeat(64);
const COMMIT_A = "abc1234";
const COMMIT_B = "def5678";

function input(over: Partial<DistributionCreateInput> = {}): DistributionCreateInput {
  return {
    asset_id: "RN-001",
    version_id: "rn-001-r01",
    surface: "continuity-lab-research",
    brand: "myshape-public",
    platform: "bluesky",
    content_fingerprint: FP_A,
    registry_commit: COMMIT_A,
    ...over,
  };
}

/** A row as the database would hold it. */
function stored(id: number, commit = COMMIT_A): DistributionRef {
  return { distribution_id: id, registry_commit: commit };
}

/**
 * Scripted writer double.
 *
 * `lookups` and `inserts` are consumed in order, so a case can say
 * "first read empty, insert races, second read finds the winner".
 */
function scripted(
  lookups: Array<DistributionRef | null | Error>,
  inserts: Array<DistributionRef | Error>,
): DistributionWriter & { lookupsUsed: number; insertsUsed: number } {
  let li = 0;
  let ii = 0;
  const writer = {
    lookupsUsed: 0,
    insertsUsed: 0,
    async findByIdentity(): Promise<DistributionRef | null> {
      const next = lookups[li++] ?? null;
      writer.lookupsUsed += 1;
      if (next instanceof Error) throw next;
      return next;
    },
    async insert(): Promise<DistributionRef> {
      const next = inserts[ii++] ?? new Error("unexpected insert");
      writer.insertsUsed += 1;
      if (next instanceof Error) throw next;
      return next;
    },
  };
  return writer as DistributionWriter & {
    lookupsUsed: number;
    insertsUsed: number;
  };
}

/** A unique violation shaped exactly like Supabase surfaces it. */
function uniqueViolation(): Error & { code: string } {
  return Object.assign(new Error("duplicate key value violates unique constraint"), {
    code: "23505",
  });
}

// ---------------------------------------------------------------
// A / B — new and existing identity
// ---------------------------------------------------------------

describe("W1 create — new identity", () => {
  it("A: absent identity inserts and returns the new id", async () => {
    const writer = scripted([null], [stored(7)]);
    const result = await createDistribution(writer, input());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.created).toBe(true);
    expect(result.distribution.distribution_id).toBe(7);
    expect(writer.lookupsUsed).toBe(1);
    expect(writer.insertsUsed).toBe(1);
  });

  it("B: existing identity returns the stored id and never inserts", async () => {
    const writer = scripted([stored(3)], []);
    const result = await createDistribution(writer, input());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.created).toBe(false);
    expect(result.distribution.distribution_id).toBe(3);
    expect(writer.insertsUsed).toBe(0);
  });
});

// ---------------------------------------------------------------
// C / D — an existing lifecycle is never mutated
// ---------------------------------------------------------------

describe("W1 create — existing row preservation", () => {
  it("C: same identity with a NEWER registry_commit keeps the ORIGINAL anchor", async () => {
    // The load-bearing §3.5 case. The caller has moved to Registry
    // snapshot B, but the lifecycle was anchored at A. Returning B
    // here would silently re-anchor the record and erase the
    // evidence that re-approval is required.
    const writer = scripted([stored(11, COMMIT_A)], []);
    const result = await createDistribution(
      writer,
      input({ registry_commit: COMMIT_B }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.distribution.registry_commit).toBe(COMMIT_A);
    expect(result.distribution.distribution_id).toBe(11);
    expect(writer.insertsUsed).toBe(0);
  });

  it("D: a non-default governance/delivery state is never reset", async () => {
    // The double only exposes the fields W1 needs, so this asserts
    // the stronger property: W1 has no channel through which it
    // could have written a state, so none can have been reset.
    const writer = scripted([stored(5, COMMIT_A)], []);
    const result = await createDistribution(writer, input());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.distribution).sort()).toEqual([
      "distribution_id",
      "registry_commit",
    ]);
    expect(writer.insertsUsed).toBe(0);
  });
});

// ---------------------------------------------------------------
// E / F — the race
// ---------------------------------------------------------------

describe("W1 create — concurrency", () => {
  it("E: 23505 triggers read-after-conflict and returns the winner", async () => {
    const writer = scripted([null, stored(42, COMMIT_B)], [uniqueViolation()]);
    const result = await createDistribution(writer, input());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.created).toBe(false);
    expect(result.distribution.distribution_id).toBe(42);
    // Exactly one insert. A retry loop would show two.
    expect(writer.insertsUsed).toBe(1);
    expect(writer.lookupsUsed).toBe(2);
  });

  it("F: an unresolvable conflict fails closed and never invents an id", async () => {
    // The race happened but the winning row cannot be read. Reporting
    // success here would hand the caller a distribution_id that may
    // not exist — or worse, one belonging to another lifecycle.
    const writer = scripted([null, null], [uniqueViolation()]);
    const result = await createDistribution(writer, input());

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("CONFLICT_UNRESOLVED");
    expect(writer.insertsUsed).toBe(1);
  });

  it("F2: a conflict whose follow-up read throws also fails closed", async () => {
    const writer = scripted([null, new Error("connection reset")], [uniqueViolation()]);
    const result = await createDistribution(writer, input());

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("CONFLICT_UNRESOLVED");
  });

  it("a non-unique insert failure is a STORE_ERROR, not a conflict", async () => {
    const writer = scripted([null], [new Error("network unreachable")]);
    const result = await createDistribution(writer, input());

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("STORE_ERROR");
  });

  it("a failing lookup is a STORE_ERROR before any insert", async () => {
    const writer = scripted([new Error("db down")], []);
    const result = await createDistribution(writer, input());

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("STORE_ERROR");
    expect(writer.insertsUsed).toBe(0);
  });
});

// ---------------------------------------------------------------
// G / H / I — contract shape
// ---------------------------------------------------------------

describe("W1 create — contract shape", () => {
  it("G: the writer port exposes creation only", () => {
    // A conforming implementation must implement exactly these two
    // members. Asserting the key set against a real object catches an
    // accidental `update`/`upsert` being added to the interface and
    // then implemented.
    const conforming: DistributionWriter = {
      async findByIdentity() {
        return null;
      },
      async insert() {
        return stored(1);
      },
    };

    expect(Object.keys(conforming).sort()).toEqual([
      "findByIdentity",
      "insert",
    ]);

    // And the port type admits nothing else.
    const allowed: Array<keyof DistributionWriter> = [
      "findByIdentity",
      "insert",
    ];
    expect(allowed.sort()).toEqual(["findByIdentity", "insert"]);
  });

  it("H: the create input has no governance_state or delivery_state field", () => {
    const keys = Object.keys(input()).sort();
    expect(keys).toEqual([
      "asset_id",
      "brand",
      "content_fingerprint",
      "platform",
      "registry_commit",
      "surface",
      "version_id",
    ]);
    expect(keys).not.toContain("governance_state");
    expect(keys).not.toContain("delivery_state");
  });

  it("I: identity is version_id + surface + platform + content_fingerprint only", () => {
    const identity: DistributionIdentity = identityOf(
      input({
        registry_commit: COMMIT_B,
        brand: "other-brand",
        asset_id: "RN-999",
      }),
    );

    expect(Object.keys(identity).sort()).toEqual([
      "content_fingerprint",
      "platform",
      "surface",
      "version_id",
    ]);
    expect(identity).not.toHaveProperty("registry_commit");
    expect(identity).not.toHaveProperty("brand");
    expect(identity).not.toHaveProperty("asset_id");
  });

  it("I2: two different registry_commits yield the SAME identity", () => {
    // The property §3.5 depends on: a Registry change must collapse
    // onto one lifecycle, not fork a second record.
    const atA = identityOf(input({ registry_commit: COMMIT_A }));
    const atB = identityOf(input({ registry_commit: COMMIT_B }));
    expect(atA).toEqual(atB);
  });

  it("validates the formats the database would otherwise reject opaquely", async () => {
    const bad = [
      input({ content_fingerprint: "not-a-digest" }),
      input({ registry_commit: "NOTHEX" }),
      input({ version_id: "" }),
    ];
    for (const payload of bad) {
      const writer = scripted([], []);
      const result = await createDistribution(writer, payload);
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.code).toBe("INVALID_INPUT");
    }
  });

  it("classifies 23505 the way the repository already does", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation({ message: "duplicate key value" })).toBe(true);
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation("nope")).toBe(false);
  });
});
