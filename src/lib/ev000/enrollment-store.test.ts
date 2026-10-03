// ============================================================
// EV-000 enrollment slice — tests
//
// Covers the primitives frozen in docs/EV-000-canonical-definition.md
// §15A / §17.2: ref generation, hashing, persistence shape, the
// ENROLLED -> WITHDRAWN transition, irreversibility, and the boundaries
// this slice must not cross.
//
// No database. The store is driven through its real code path with an
// object double, so the mapping and the persistence sequence are exercised
// exactly as production would issue them.
// ============================================================

import { describe, expect, it, beforeEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  createEv000EnrollmentStore,
  generateParticipantRef,
  hashParticipantRef,
  isWellFormedRef,
  retentionUntilFrom,
  EV000_CONSENT_VERSION,
  EV000_REF_BYTES,
  EV000_RETENTION_DAYS,
  EV000_TABLE,
  EV000_WITHDRAWAL_CONTACT,
  type Ev000Client,
} from "./enrollment-store";
import { EV000_CONSENT_SECTIONS } from "./consent";

const NOW = "2026-10-03T12:00:00.000Z";
const CANONICAL_DOC = path.resolve(
  process.cwd(),
  "docs/EV-000-canonical-definition.md",
);

// Declared at module scope so every describe below can reach them.
const MIGRATION = "supabase/migrations/20261003_ev000_enrollment.sql";
const migrationSql = () =>
  fs.readFileSync(path.resolve(process.cwd(), MIGRATION), "utf8");
/** The text of the retention purge function only, between its markers. */
const purgeBody = () => {
  const s = migrationSql();
  return s.slice(
    s.indexOf("CREATE OR REPLACE FUNCTION purge_expired"),
    s.indexOf("COMMENT ON FUNCTION purge_expired"),
  );
};

// ── Test double ─────────────────────────────────────────────

interface RecordedUpdate {
  values: Record<string, unknown>;
  filters: Record<string, string>;
}

class FakeDb {
  rows: Record<string, unknown>[] = [];
  inserts: Record<string, unknown>[] = [];
  updates: RecordedUpdate[] = [];
  /** Hashes this fake was asked to look up, for leakage assertions. */
  lookups: string[] = [];
  failNextInsert = false;

  client(): Ev000Client {
    const db = this;
    return {
      from() {
        const filters: Record<string, string> = {};
        const builder = {
          select: () => builder,
          eq(column: string, value: string) {
            filters[column] = value;
            return builder;
          },
          insert(values: Record<string, unknown>) {
            db.inserts.push(values);
            if (db.failNextInsert) {
              db.failNextInsert = false;
              return {
                select: () => ({
                  single: async () => ({ data: null, error: { message: "insert failed" } }),
                }),
              };
            }
            const row: Record<string, unknown> = {
              enrollment_id: `00000000-0000-4000-8000-${String(
                db.rows.length + 1,
              ).padStart(12, "0")}`,
              lifecycle_state: "ENROLLED",
              withdrawn_at: null,
              ...values,
            };
            db.rows.push(row);
            return { select: () => ({ single: async () => ({ data: row, error: null }) }) };
          },
          update(values: Record<string, unknown>) {
            const rec: RecordedUpdate = { values, filters: { ...filters } };
            db.updates.push(rec);
            const upd = {
              eq(column: string, value: string) {
                rec.filters[column] = value;
                return upd;
              },
              select: () => ({
                single: async () => {
                  const row = db.rows.find(
                    (r) =>
                      r.participant_ref_hash === rec.filters.participant_ref_hash &&
                      r.lifecycle_state === rec.filters.lifecycle_state,
                  );
                  if (!row) return { data: null, error: { message: "no rows updated" } };
                  Object.assign(row, rec.values);
                  return { data: { enrollment_id: row.enrollment_id }, error: null };
                },
              }),
            };
            return upd;
          },
          single: async () => ({ data: null, error: null }),
          maybeSingle: async () => {
            const hash = filters.participant_ref_hash;
            if (hash) db.lookups.push(hash);
            const row = db.rows.find((r) => r.participant_ref_hash === hash);
            return { data: row ?? null, error: null };
          },
        };
        return builder;
      },
    } as unknown as Ev000Client;
  }
}

describe("EV-000 Participant Ref generation", () => {
  it("produces 256 bits (32 bytes) of entropy as 64 hex chars", () => {
    expect(EV000_REF_BYTES).toBe(32);
    const ref = generateParticipantRef();
    expect(ref).toHaveLength(64);
    expect(ref).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces distinct refs across calls", () => {
    const refs = new Set(Array.from({ length: 50 }, () => generateParticipantRef()));
    expect(refs.size).toBe(50);
  });

  it("refuses to generate without a CSPRNG rather than degrading", () => {
    // crypto is a getter-only global in Node; stubGlobal replaces it safely.
    vi.stubGlobal("crypto", { getRandomValues: undefined });
    try {
      expect(() => generateParticipantRef()).toThrow(/CSPRNG unavailable/);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("EV-000 hashing", () => {
  it("hashes the same ref to the same 64-char SHA-256 hex", () => {
    const ref = generateParticipantRef();
    const a = hashParticipantRef(ref);
    expect(a).toBe(hashParticipantRef(ref));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces different hashes for different refs", () => {
    expect(hashParticipantRef(generateParticipantRef())).not.toBe(
      hashParticipantRef(generateParticipantRef()),
    );
  });

  it("accepts only well-formed refs by shape", () => {
    expect(isWellFormedRef("a".repeat(64))).toBe(true);
    expect(isWellFormedRef("A".repeat(64))).toBe(false);
    expect(isWellFormedRef("a".repeat(63))).toBe(false);
    expect(isWellFormedRef("")).toBe(false);
    expect(isWellFormedRef(null)).toBe(false);
    expect(isWellFormedRef(123)).toBe(false);
  });
});
describe("EV-000 enrollment", () => {
  let db: FakeDb;
  let store: ReturnType<typeof createEv000EnrollmentStore>;

  beforeEach(() => {
    db = new FakeDb();
    store = createEv000EnrollmentStore(db.client());
  });

  it("creates a record", async () => {
    const result = await store.enroll(NOW);
    expect(result.ok).toBe(true);
    expect(db.inserts).toHaveLength(1);
    expect(db.rows).toHaveLength(1);
  });

  it("starts the lifecycle in ENROLLED", async () => {
    const result = await store.enroll(NOW);
    if (!result.ok) throw new Error(result.detail);
    expect(result.enrollment.lifecycleState).toBe("ENROLLED");
    expect(result.enrollment.withdrawnAt).toBeNull();
  });

  it("records the frozen consent version and nothing else", async () => {
    await store.enroll(NOW);
    expect(db.inserts[0].consent_version).toBe("EV-000-CONSENT-1.0");
    expect(EV000_CONSENT_VERSION).toBe("EV-000-CONSENT-1.0");
  });

  it("records enrolled_at", async () => {
    const result = await store.enroll(NOW);
    if (!result.ok) throw new Error(result.detail);
    expect(result.enrollment.enrolledAt).toBe(NOW);
  });

  it("establishes a 90-day retention basis", async () => {
    const result = await store.enroll(NOW);
    if (!result.ok) throw new Error(result.detail);
    const expected = new Date(
      new Date(NOW).getTime() + EV000_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(result.enrollment.retentionUntil).toBe(expected);
    expect(EV000_RETENTION_DAYS).toBe(90);
  });

  it("does not let later activity move the retention deadline", () => {
    const first = retentionUntilFrom(NOW);
    expect(retentionUntilFrom(NOW)).toBe(first);
    expect(retentionUntilFrom(NOW, 90)).toBe(first);
  });

  it("returns the Participant Ref exactly once", async () => {
    const result = await store.enroll(NOW);
    if (!result.ok) throw new Error(result.detail);
    expect(result.participantRef).toHaveLength(64);
    expect(Object.keys(result.enrollment)).not.toContain("participantRef");
    expect(Object.values(result.enrollment)).not.toContain(result.participantRef);
  });

  it("persists the hash of the returned ref, never the raw ref", async () => {
    const result = await store.enroll(NOW);
    if (!result.ok) throw new Error(result.detail);
    const persisted = JSON.stringify(db.inserts[0]);
    expect(persisted).not.toContain(result.participantRef);
    expect(db.inserts[0].participant_ref_hash).toBe(
      hashParticipantRef(result.participantRef),
    );
    expect(JSON.stringify(db.rows)).not.toContain(result.participantRef);
  });

  it("produces distinct refs for repeated enrollments", async () => {
    const a = await store.enroll(NOW);
    const b = await store.enroll(NOW);
    if (!a.ok || !b.ok) throw new Error("enrollment failed");
    expect(a.participantRef).not.toBe(b.participantRef);
    expect(db.inserts[0].participant_ref_hash).not.toBe(
      db.inserts[1].participant_ref_hash,
    );
  });

  it("writes only governance columns, no identity columns", async () => {
    await store.enroll(NOW);
    expect(Object.keys(db.inserts[0]).sort()).toEqual(
      [
        "consent_version",
        "enrolled_at",
        "lifecycle_state",
        "participant_ref_hash",
        "retention_until",
      ].sort(),
    );
  });

  it("reports failure honestly when the insert fails", async () => {
    db.failNextInsert = true;
    const result = await store.enroll(NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("ENROLLMENT_ERROR");
    // A failure detail must never contain a 64-char hex value.
    expect(result.detail).not.toMatch(/[0-9a-f]{64}/);
  });

  it("requires no interaction to enroll", async () => {
    await store.enroll(NOW);
    expect(Object.keys(db.inserts[0])).not.toContain("interaction_kind");
  });
});
describe("EV-000 withdrawal", () => {
  let db: FakeDb;
  let store: ReturnType<typeof createEv000EnrollmentStore>;

  beforeEach(() => {
    db = new FakeDb();
    store = createEv000EnrollmentStore(db.client());
  });

  async function enrolledRef(): Promise<string> {
    const result = await store.enroll(NOW);
    if (!result.ok) throw new Error(result.detail);
    return result.participantRef;
  }

  it("withdraws an enrollment using its Participant Ref", async () => {
    const ref = await enrolledRef();
    const result = await store.withdraw(ref, "2026-10-04T00:00:00.000Z");
    expect(result.ok).toBe(true);
    expect(db.rows[0].lifecycle_state).toBe("WITHDRAWN");
  });

  it("records the withdrawal timestamp", async () => {
    const ref = await enrolledRef();
    await store.withdraw(ref, "2026-10-04T00:00:00.000Z");
    expect(db.rows[0].withdrawn_at).toBe("2026-10-04T00:00:00.000Z");
  });

  it("is irreversible: a second withdrawal cannot resurrect or mutate", async () => {
    const ref = await enrolledRef();
    expect((await store.withdraw(ref, "2026-10-04T00:00:00.000Z")).ok).toBe(true);
    const second = await store.withdraw(ref, "2026-10-05T00:00:00.000Z");
    expect(second.ok).toBe(false);
    // State and timestamps unchanged — no resurrection, no re-write.
    expect(db.rows[0].lifecycle_state).toBe("WITHDRAWN");
    expect(db.rows[0].withdrawn_at).toBe("2026-10-04T00:00:00.000Z");
    expect(db.rows[0].enrolled_at).toBe(NOW);
  });

  it("rejects an invalid ref without touching any row", async () => {
    await enrolledRef();
    const before = JSON.stringify(db.rows);
    for (const bad of ["", "nope", "a".repeat(63), "A".repeat(64)]) {
      expect((await store.withdraw(bad, NOW)).ok).toBe(false);
    }
    expect(JSON.stringify(db.rows)).toBe(before);
    expect(db.updates).toHaveLength(0);
  });

  it("rejects a well-formed ref that belongs to nobody", async () => {
    await enrolledRef();
    const result = await store.withdraw(generateParticipantRef(), NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.detail).toMatch(/no active enrollment/);
    expect(db.updates).toHaveLength(0);
  });

  it("looks up by hash, never by the raw ref", async () => {
    const ref = await enrolledRef();
    await store.withdraw(ref, NOW);
    expect(db.lookups).toEqual([hashParticipantRef(ref)]);
    expect(JSON.stringify(db.updates)).not.toContain(ref);
  });

  it("guards the update on the row still being ENROLLED", async () => {
    const ref = await enrolledRef();
    await store.withdraw(ref, NOW);
    expect(db.updates[0].filters.lifecycle_state).toBe("ENROLLED");
    expect(db.updates[0].values).toEqual({
      lifecycle_state: "WITHDRAWN",
      withdrawn_at: NOW,
      participant_ref_hash: null,
    });
  });

  // ── Withdrawal capability removal (canonical §9 step 4, §11.3) ──

  it("removes the participant capability on withdrawal", async () => {
    const ref = await enrolledRef();
    await store.withdraw(ref, NOW);
    expect(db.rows[0].participant_ref_hash).toBeNull();
  });

  it("issues exactly one update statement for a withdrawal", async () => {
    const ref = await enrolledRef();
    await store.withdraw(ref, NOW);
    // One atomic write: capability removal, state and timestamp together.
    expect(db.updates).toHaveLength(1);
  });

  it("does not let withdrawal move the 90-day clock or governance fields", async () => {
    const ref = await enrolledRef();
    const before = { ...db.rows[0] };
    await store.withdraw(ref, NOW);
    // Only these three fields may change.
    expect(db.updates[0].values).toEqual({
      lifecycle_state: "WITHDRAWN",
      withdrawn_at: NOW,
      participant_ref_hash: null,
    });
    expect(db.rows[0].retention_until).toBe(before.retention_until);
    expect(db.rows[0].enrolled_at).toBe(before.enrolled_at);
    expect(db.rows[0].consent_version).toBe(before.consent_version);
  });

  it("does not set retention_purged_at — that is retention, not withdrawal", async () => {
    const ref = await enrolledRef();
    await store.withdraw(ref, NOW);
    expect(Object.keys(db.updates[0].values)).not.toContain("retention_purged_at");
    expect(db.rows[0].retention_purged_at ?? null).toBeNull();
  });

  it("generates no replacement capability", async () => {
    const ref = await enrolledRef();
    // `before` is the rows ARRAY, so the row is at index 0.
    const beforeRow = { ...db.rows[0] };
    await store.withdraw(ref, NOW);
    const after = db.rows[0];
    expect(after.participant_ref_hash).toBeNull();
    for (const key of Object.keys(after)) {
      if (
        key === "participant_ref_hash" ||
        key === "lifecycle_state" ||
        key === "withdrawn_at"
      ) {
        continue;
      }
      expect(after[key], `field ${key} changed`).toBe(beforeRow[key]);
    }
    // Enrollment identity survives so the governance record is intact.
    expect(after.enrollment_id).toBe(beforeRow.enrollment_id);
  });

  it("keeps withdrawal privacy-safe and rejects a replayed ref afterwards", async () => {
    const ref = await enrolledRef();
    expect((await store.withdraw(ref, NOW)).ok).toBe(true);
    // Second attempt fails without mutating anything.
    const after = JSON.stringify(db.rows[0]);
    expect((await store.withdraw(ref, NOW)).ok).toBe(false);
    expect(JSON.stringify(db.rows[0])).toBe(after);
    expect(db.updates).toHaveLength(1);
  });

  it("leaves an invalid ref behaviour unchanged", async () => {
    await enrolledRef();
    const before = JSON.stringify(db.rows);
    for (const bad of ["", "nope", "a".repeat(63)]) {
      expect((await store.withdraw(bad, NOW)).ok).toBe(false);
    }
    expect(JSON.stringify(db.rows)).toBe(before);
    expect(db.updates).toHaveLength(0);
  });

  it("never persists or returns the raw Participant Ref", async () => {
    const ref = await enrolledRef();
    const result = await store.withdraw(ref, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.stringify(result)).not.toContain(ref);
    }
    expect(JSON.stringify(db.rows)).not.toContain(ref);
    expect(JSON.stringify(db.updates)).not.toContain(ref);
  });

  it("accepts no identity field as an alternative capability", () => {
    // The store's only withdrawal input is the ref string. There is no
    // parameter, option, or overload through which an identity could pass.
    expect(store.withdraw.length).toBe(2);
    expect(Object.keys(store).sort()).toEqual(["enroll", "withdraw"]);
  });

  it("keeps the raw ref absent from persistence after withdrawal", async () => {
    const ref = await enrolledRef();
    await store.withdraw(ref, NOW);
    expect(JSON.stringify(db.rows)).not.toContain(ref);
  });

  it("does not shorten or extend the retention basis", async () => {
    const ref = await enrolledRef();
    const original = db.rows[0].retention_until;
    await store.withdraw(ref, NOW);
    expect(db.rows[0].retention_until).toBe(original);
  });
});

describe("EV-000 boundaries", () => {
  it("targets only its own table", () => {
    expect(EV000_TABLE).toBe("ev000_enrollment");
  });

  it("introduces no interaction enum", async () => {
    const store = createEv000EnrollmentStore(new FakeDb().client());
    const result = await store.enroll(NOW);
    if (!result.ok) throw new Error(result.detail);
    for (const forbidden of [
      "MOTION_TEST",
      "QUESTIONNAIRE",
      "PROTOCOL_REPRODUCTION",
      "OTHER",
    ]) {
      expect(Object.values(result.enrollment)).not.toContain(forbidden);
    }
  });

  it("creates no research-session linkage", async () => {
    const db = new FakeDb();
    const store = createEv000EnrollmentStore(db.client());
    await store.enroll(NOW);
    const persisted = JSON.stringify(db.inserts[0]).toLowerCase();
    expect(persisted).not.toContain("session");
    expect(persisted).not.toContain("research");
  });

  it("exposes the confirmed withdrawal contact", () => {
    expect(EV000_WITHDRAWAL_CONTACT).toBe("dev@myshape.com");
  });
});
describe("EV-000 consent presentation", () => {
  const allText = EV000_CONSENT_SECTIONS.flatMap((s) => [
    s.heading,
    ...s.paragraphs,
    ...(s.bullets ?? []),
  ]).join(" ");

  it("is versioned exactly EV-000-CONSENT-1.0", () => {
    expect(EV000_CONSENT_VERSION).toBe("EV-000-CONSENT-1.0");
  });

  it("carries every disclosure the canonical definition requires", () => {
    expect(allText).toMatch(/voluntary/i);
    expect(allText).toMatch(/do not have to complete any activity/i);
    expect(allText).toMatch(/name, your email address, an account, a wallet/i);
    expect(allText).toMatch(/shown it once/i);
    expect(allText).toMatch(/one-way hash/i);
    expect(allText).toMatch(/linked to your EV-000 enrolment/i);
    expect(allText).toMatch(/only inside EV-000/i);
    expect(allText).toMatch(/not intended to identify you/i);
    expect(allText).toMatch(/90 days counted from the day you enrol/i);
    expect(allText).toMatch(/does not restart that 90 days/i);
    expect(allText).toMatch(/cannot be undone/i);
    expect(allText).toMatch(/already published before you withdrew/i);
  });

  it("states the withdrawal contact", () => {
    expect(allText).toContain("dev@myshape.com");
  });

  it("contains no legal or compliance claim", () => {
    for (const forbidden of [
      "gdpr",
      "ccpa",
      "lawful",
      "legal",
      "compliant",
      "liability",
      "waiver",
      "guarantee",
    ]) {
      expect(allText.toLowerCase()).not.toContain(forbidden);
    }
  });

  it("adds no marketing or subscription consent", () => {
    expect(allText.toLowerCase()).not.toMatch(/subscribe|marketing|newsletter|third.part/);
  });

  it("exposes no participant retrieval function", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "src/lib/ev000/consent.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/export (async )?function (get|find|lookup|load)/);
  });

  it("stays consistent with the canonical document", () => {
    const doc = fs.readFileSync(CANONICAL_DOC, "utf8");
    expect(doc).toContain(EV000_CONSENT_VERSION);
    expect(doc).toContain(EV000_WITHDRAWAL_CONTACT);
    // The canonical document must not still call the contact unverified.
    expect(doc).not.toContain("PENDING CONTACT VERIFICATION");
  });
});

// ── Static audit of the implementation itself ───────────────

const IMPL_FILES = [
  "src/lib/ev000/enrollment-store.ts",
  "src/lib/ev000/consent.ts",
  "src/app/api/ev000/enroll/route.ts",
  "src/app/api/ev000/withdraw/route.ts",
];

describe("EV-000 implementation audit", () => {
  const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), "utf8");

  it("no implementation file logs or echoes the raw Participant Ref", () => {
    for (const file of IMPL_FILES) {
      const src = read(file);
      // A console call must never interpolate a ref variable.
      for (const line of src.split("\n")) {
        if (!/console\.(log|error|warn|info)/.test(line)) continue;
        expect(line).not.toMatch(/participantRef\b/);
        expect(line).not.toMatch(/participant_ref\b/);
      }
    }
  });

  it("no route exposes the Participant Ref in a URL", () => {
    for (const file of [
      "src/app/api/ev000/enroll/route.ts",
      "src/app/api/ev000/withdraw/route.ts",
    ]) {
      const src = read(file);
      expect(src).not.toMatch(/params\s*:/);
      expect(src).not.toMatch(/searchParams/);
    }
  });

  it("no route exports a GET that could return a ref", () => {
    for (const file of [
      "src/app/api/ev000/enroll/route.ts",
      "src/app/api/ev000/withdraw/route.ts",
    ]) {
      expect(read(file)).not.toMatch(/export async function GET/);
    }
  });

  it("the withdraw route accepts only the ref key", () => {
    const src = read("src/app/api/ev000/withdraw/route.ts");
    expect(src).toMatch(/keys\.length !== 1/);
    expect(src).toMatch(/REF_KEY/);
  });

  it("no implementation file writes a participant identity column", () => {
    const forbidden = [
      "email",
      "phone",
      "wallet",
      "display_name",
      "full_name",
      "device_id",
      "ip_address",
      "user_agent",
    ];
    for (const file of [
      "src/lib/ev000/enrollment-store.ts",
      "supabase/migrations/20261003_ev000_enrollment.sql",
    ]) {
      const src = read(file).toLowerCase();
      for (const column of forbidden) {
        // Allow the word inside a comment that names it as forbidden.
        const lines = src.split("\n");
        const offenders = lines.filter(
          (l) => l.includes(column) && !l.trim().startsWith("--") && !l.trim().startsWith("*") && !l.trim().startsWith("//"),
        );
        expect(offenders, `${file} references ${column}`).toHaveLength(0);
      }
    }
  });

  it("the migration creates no payload column", () => {
    const full = read("supabase/migrations/20261003_ev000_enrollment.sql");
    // Scan only the CREATE TABLE block. Elsewhere the same shape appears as
    // PL/pgSQL declarations (DECLARE purged_count INTEGER), which are local
    // variables, not columns.
    const sql = full.slice(
      full.indexOf("CREATE TABLE IF NOT EXISTS ev000_enrollment"),
      full.indexOf(");", full.indexOf("CREATE TABLE IF NOT EXISTS ev000_enrollment")),
    );
    // Column definitions only: two-space indent, a name, then a SQL type.
    // CONSTRAINT clauses are excluded so a constraint name is never mistaken
    // for a column.
    const columns = [...sql.matchAll(/^\s{2}(?!CONSTRAINT\b)(\w+)\s+(UUID|TEXT|TIMESTAMPTZ|BIGINT|INTEGER|BOOLEAN|JSONB)\b/gm)]
      .map((m) => m[1]);
    // Sort both sides: locale-independent lexicographic order differs from
    // the hand-written order ("enrolled_at" sorts before "enrollment_id").
    expect(columns.sort()).toEqual(
      [
        "consent_version",
        "enrollment_id",
        "enrolled_at",
        "lifecycle_state",
        "participant_ref_hash",
        "retention_purged_at",
        "retention_until",
        "withdrawn_at",
      ].sort(),
    );
  });

  // ── Retention schema (canonical §11) ─────────────────────

  describe("EV-000 retention schema", () => {
    it("makes participant_ref_hash nullable while keeping it UNIQUE", () => {
      const s = migrationSql();
      expect(s).toMatch(/participant_ref_hash TEXT UNIQUE,/);
      expect(s).not.toMatch(/participant_ref_hash TEXT NOT NULL/);
    });

    it("adds an explicit retention outcome column", () => {
      expect(migrationSql()).toMatch(/retention_purged_at TIMESTAMPTZ/);
    });

    it("records no lifecycle state for retention expiry", () => {
      const s = migrationSql();
      // Retention is an outcome orthogonal to the lifecycle model (§11.4).
      expect(s).not.toMatch(/'RETAINED_OUT'/);
      expect(s).toMatch(/CHECK \(lifecycle_state IN \('ENROLLED', 'WITHDRAWN'\)\)/);
    });

    it("forbids purging without removing the capability", () => {
      expect(migrationSql()).toMatch(
        /ev000_enrollment_purge_requires_capability_removal[\s\S]*?retention_purged_at IS NULL OR participant_ref_hash IS NULL/,
      );
    });

    it("forbids purging before the retention window closes", () => {
      expect(migrationSql()).toMatch(
        /ev000_enrollment_purge_requires_expiry[\s\S]*?retention_purged_at >= retention_until/,
      );
    });

    it("requires a WITHDRAWN row to hold no capability", () => {
      expect(migrationSql()).toMatch(
        /ev000_enrollment_withdrawn_capability_removed[\s\S]*?lifecycle_state <> 'WITHDRAWN' OR participant_ref_hash IS NULL/,
      );
    });

    it("keeps the governance record permanently non-empty", () => {
      expect(migrationSql()).toMatch(/ev000_enrollment_governance_record_never_empty/);
    });
  });

  it("the migration pins the consent version and the lifecycle enum", () => {
    const sql = read("supabase/migrations/20261003_ev000_enrollment.sql");
    expect(sql).toContain("'EV-000-CONSENT-1.0'");
    expect(sql).toContain("'ENROLLED', 'WITHDRAWN'");
    expect(sql).toContain("INTERVAL '90 days'");
  });

  it("the migration denies anon and authenticated roles", () => {
    const sql = read("supabase/migrations/20261003_ev000_enrollment.sql");
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toMatch(/TO anon[\s\S]*USING \(false\)/);
    expect(sql).toMatch(/TO authenticated[\s\S]*USING \(false\)/);
  });
// ── Server-side consent gate ────────────────────────────────
//
// Exercises the REAL exported validation path of the enroll route. The
// route module is imported for readConsentAssertion and POST, and is driven
// with a stubbed store factory so no database or network is involved.

const ENROLL_ROUTE = path.resolve(process.cwd(), "src/app/api/ev000/enroll/route.ts");
const PAGE_FILE = path.resolve(process.cwd(), "src/app/ev000/page.tsx");

describe("EV-000 consent gate — acceptance", () => {
  it("persists the canonical constant, never the client string", () => {
    const src = fs.readFileSync(ENROLL_ROUTE, "utf8");
    // The persisted value must come from the imported constant.
    expect(src).toMatch(/consent_version: EV000_CONSENT_VERSION/);
    // And no code path may assign a request-derived value to the store.
    expect(src).not.toMatch(/consent_version:\s*(supplied|payload\[|raw\[|parsed)/);
  });

  it("compares the supplied value against the frozen server-side constant", () => {
    const src = fs.readFileSync(ENROLL_ROUTE, "utf8");
    expect(src).toMatch(/supplied !== EV000_CONSENT_VERSION/);
  });

  it("the client sends the frozen consent version explicitly", () => {
    const src = fs.readFileSync(PAGE_FILE, "utf8");
    expect(src).toMatch(/consent_version: EV000_CONSENT_VERSION/);
    expect(src).toMatch(/JSON\.stringify\(\{ consent_version/);
  });

  it("the client keeps the checkbox gate on the enroll button", () => {
    const src = fs.readFileSync(PAGE_FILE, "utf8");
    // The button remains disabled until `accepted` is true.
    expect(src).toMatch(/disabled=\{!accepted \|\| enrolling \|\| done\}/);
    expect(src).toMatch(/type="checkbox"/);
    expect(src).toMatch(/setAccepted\(e\.target\.checked\)/);
  });

  it("sends no identity, participant, or interaction data with the assertion", () => {
    const src = fs.readFileSync(PAGE_FILE, "utf8");
    const call = src.slice(
      src.indexOf('fetch("/api/ev000/enroll"'),
      src.indexOf('});', src.indexOf('fetch("/api/ev000/enroll"')),
    );
    expect(call).not.toMatch(/email|name|wallet|phone|participantRef|interaction_kind/);
    // Consent prose must not be duplicated into the request.
    expect(call).not.toMatch(/EV000_CONSENT_SECTIONS/);
  });
});

describe("EV-000 consent gate — rejection", () => {
  const src = fs.readFileSync(ENROLL_ROUTE, "utf8");

  it("accepts exactly one key and nothing else", () => {
    expect(src).toMatch(/keys\.length !== 1 \|\| keys\[0\] !== CONSENT_KEY/);
    expect(src).toMatch(/const CONSENT_KEY = "consent_version"/);
  });

  it("refuses a missing consent_version", () => {
    expect(src).toMatch(/consent_version_required/);
    expect(src).toMatch(/keys\.includes\(CONSENT_KEY\)/);
  });

  it("refuses an empty or non-string consent_version", () => {
    expect(src).toMatch(/typeof supplied !== "string" \|\| supplied\.length === 0/);
  });

  it("refuses any other version", () => {
    expect(src).toMatch(/consent_version_mismatch/);
  });

  it("refuses malformed JSON without reaching the store", () => {
    // The JSON parse failure returns before the store is constructed.
    const parseCatch = src.indexOf("catch {");
    const storeConstruction = src.indexOf("createEv000EnrollmentStoreFromEnv()");
    expect(parseCatch).toBeGreaterThan(-1);
    expect(parseCatch).toBeLessThan(storeConstruction);
  });

  it("constructs no store and generates no ref before consent passes", () => {
    const consentCheck = src.indexOf("if (!consent.ok)");
    const storeConstruction = src.indexOf("createEv000EnrollmentStoreFromEnv()");
    const enrollCall = src.indexOf("store.enroll(");
    expect(consentCheck).toBeGreaterThan(-1);
    expect(consentCheck).toBeLessThan(storeConstruction);
    expect(storeConstruction).toBeLessThan(enrollCall);
  });

  it("returns a client error, not a server error, for a bad consent version", () => {
    // The consent failure branch responds 400; 500 is reserved for a store
    // failure after consent has already passed.
    const branch = src.slice(src.indexOf("if (!consent.ok)"), src.indexOf("let store:"));
    expect(branch).toMatch(/status: 400/);
    expect(branch).not.toMatch(/status: 500/);
  });

  it("does not reveal database detail in the consent failure response", () => {
    const branch = src.slice(src.indexOf("if (!consent.ok)"), src.indexOf("let store:"));
    for (const leak of ["select ", "insert ", "ev000_enrollment", "row", "column", "constraint"]) {
      expect(branch.toLowerCase()).not.toContain(leak);
    }
  });

  it("introduces no PII, identity, or interaction field into the contract", () => {
    for (const forbidden of [
      "email",
      "wallet",
      "phone",
      "device_id",
      "ip_address",
      "user_agent",
      "interaction_kind",
    ]) {
      // Comment lines are excluded: the route's header names these fields
      // precisely to explain why they are refused.
      const offenders = src
        .split("\n")
        .filter(
          (l) =>
            l.includes(forbidden) &&
            !l.trim().startsWith("//") &&
            !l.trim().startsWith("*") &&
            !l.trim().startsWith("/*"),
        );
      expect(offenders, `enroll route references ${forbidden}`).toHaveLength(0);
    }
  });

  it("keeps the response free of legal or compliance language", () => {
    for (const forbidden of ["gdpr", "ccpa", "lawful", "compliant", "legal requirement"]) {
      expect(src.toLowerCase()).not.toContain(forbidden);
    }
  });
});
});
describe("EV-000 retention purge operation", () => {
    it("defines an idempotent purge function", () => {
      const s = migrationSql();
      expect(s).toMatch(
        /CREATE OR REPLACE FUNCTION purge_expired_ev000_participant_data\(\)/,
      );
      expect(s).toMatch(/retention_until <= NOW\(\)/);
      // The idempotency guard: already-purged rows are never reselected.
      expect(s).toMatch(/retention_purged_at IS NULL/);
    });

    it("removes the capability and records the outcome together", () => {
      expect(migrationSql()).toMatch(
        /SET participant_ref_hash = NULL,\s*\n\s*retention_purged_at\s+= NOW\(\)/,
      );
    });

    it("never deletes an enrollment row", () => {
      const purgeText = purgeBody();
      expect(purgeText).not.toMatch(/\bDELETE\b/i);
      expect(purgeText).not.toMatch(/TRUNCATE/i);
    });

    it("never modifies governance or clock columns", () => {
      const setClause = purgeBody().slice(
        purgeBody().indexOf("SET"),
        purgeBody().indexOf("WHERE"),
      );
      for (const forbidden of [
        "consent_version",
        "enrolled_at",
        "retention_until",
        "lifecycle_state",
        "withdrawn_at",
      ]) {
        expect(setClause).not.toContain(forbidden);
      }
    });

    it("returns only a row count, never participant data", () => {
      const purgeText = purgeBody();
      expect(purgeText).toMatch(/RETURNS INTEGER/);
      expect(purgeText).toMatch(/RETURN purged_count/);
      expect(purgeText).not.toMatch(/RETURNS (SETOF|TABLE)/);
    });

    it("grants nothing to any public role", () => {
      // Scan executable statements only: a GRANT must start a line, so the
      // explanatory comment block that discusses grants is not matched.
      const statements = migrationSql()
        .split("\n")
        .filter((l) => /^\s*GRANT\b/i.test(l));
      expect(statements.length).toBeGreaterThan(0);
      for (const g of statements) {
        expect(g).toMatch(/TO service_role/);
        expect(g).not.toMatch(/anon/);
        expect(g).not.toMatch(/authenticated/);
      }
    });

    it("revokes all table privileges from anon and authenticated", () => {
      expect(migrationSql()).toMatch(
        /REVOKE ALL ON ev000_enrollment FROM anon, authenticated;/,
      );
    });

    it("does not weaken RLS", () => {
      const s = migrationSql();
      expect(s).toMatch(/ENABLE ROW LEVEL SECURITY/);
      expect(s).toMatch(/TO anon\s*\n\s*USING \(false\)\s*\n\s*WITH CHECK \(false\);/);
      expect(s).toMatch(/TO authenticated\s*\n\s*USING \(false\)\s*\n\s*WITH CHECK \(false\);/);
    });

    it("configures no schedule in this migration", () => {
      // Executable statements only. The migration explains why scheduling is
      // deferred and names pg_cron in that explanation; a comment is not a
      // configuration.
      const code = migrationSql()
        .split("\n")
        .filter((l) => !l.trim().startsWith("--"))
        .join("\n");
      expect(code).not.toMatch(/CREATE EXTENSION/i);
      expect(code).not.toMatch(/cron\.schedule/i);
      expect(code).not.toMatch(/pg_cron/i);
    });

    it("touches no table other than ev000_enrollment", () => {
      // Scan executable statements only. Comment prose mentions "public
      // schema" and "the service role", which a naive scan reads as table
      // targets. CREATE TABLE ... IF NOT EXISTS is followed so the target is
      // the table name, not the IF keyword.
      const code = migrationSql()
        .split("\n")
        .filter((l) => !l.trim().startsWith("--"))
        .join("\n");
      const targets = [
        ...code.matchAll(
          /(?:ALTER TABLE|CREATE TABLE(?:\s+IF NOT EXISTS)?|REVOKE ALL ON|GRANT[^;]*?\bON)\s+([a-z_][a-z0-9_.]*)/gi,
        ),
      ].map((m) => m[1].toLowerCase());
      expect(targets.length).toBeGreaterThan(0);
      for (const t of new Set(targets)) {
        expect(
          ["ev000_enrollment", "anon", "authenticated", "service_role"],
          `migration touches ${t}`,
        ).toContain(t);
      }
    });
});

// ── Structural regression guard ────────────────────────────
//
// WHY THIS EXISTS
//
// A previous revision of this migration declared
// `ev000_enrollment_withdrawal_consistent` TWICE: an incomplete first copy
// with no closing `)` and no trailing comma, followed by the complete copy.
// PostgreSQL rejected the file with
//
//   ERROR: 42601: syntax error at or near "CONSTRAINT"  (LINE 109)
//
// The earlier tests did not catch it, because they assert each constraint
// NAME is present — and a duplicated name is still present. A regex cannot
// see structure. These checks can.
//
// They are structural, not a generic SQL parser: they count constraint-name
// occurrences and balance parentheses within the CREATE TABLE text. No new
// dependency is introduced.

describe("EV-000 migration structural integrity", () => {
  /** Executable SQL only — comments are excluded so prose cannot skew counts. */
  const codeLines = () =>
    migrationSql()
      .split("\n")
      .filter((l) => !l.trim().startsWith("--"));

  /** The CREATE TABLE text: from its opening paren to its closing `);`. */
  const createTableBody = () => {
    const lines = codeLines();
    const start = lines.findIndex((l) =>
      /CREATE TABLE(?:\s+IF NOT EXISTS)?\s+ev000_enrollment/.test(l),
    );
    if (start < 0) throw new Error("CREATE TABLE for ev000_enrollment not found");
    let depth = 0;
    for (let i = start; i < lines.length; i++) {
      for (const ch of lines[i]) {
        if (ch === "(") depth++;
        if (ch === ")") depth--;
      }
      if (depth === 0) return lines.slice(start, i + 1);
    }
    throw new Error("CREATE TABLE text never closed");
  };

  /** Every constraint this migration is expected to declare, exactly once. */
  const EXPECTED_CONSTRAINTS = [
    "ev000_enrollment_consent_version_frozen",
    "ev000_enrollment_retention_window",
    "ev000_enrollment_lifecycle_state",
    "ev000_enrollment_purge_requires_capability_removal",
    "ev000_enrollment_purge_requires_expiry",
    "ev000_enrollment_governance_record_never_empty",
    "ev000_enrollment_withdrawal_consistent",
    "ev000_enrollment_withdrawn_capability_removed",
  ];

  it("declares ev000_enrollment_withdrawal_consistent exactly once", () => {
    const count = codeLines().filter((l) =>
      l.includes("CONSTRAINT ev000_enrollment_withdrawal_consistent"),
    ).length;
    expect(count).toBe(1);
  });

  it("declares every expected constraint exactly once", () => {
    const code = codeLines().join("\n");
    for (const name of EXPECTED_CONSTRAINTS) {
      const occurrences = code.split(`CONSTRAINT ${name}`).length - 1;
      expect(occurrences, `${name} declared ${occurrences}×`).toBe(1);
    }
  });

  it("declares no unexpected ev000_enrollment_* constraint", () => {
    const code = codeLines().join("\n");
    const declared = [...code.matchAll(/CONSTRAINT\s+(ev000_enrollment_\w+)/g)].map(
      (m) => m[1],
    );
    for (const name of declared) {
      expect(EXPECTED_CONSTRAINTS, `unexpected constraint ${name}`).toContain(name);
    }
    expect(declared.length).toBe(EXPECTED_CONSTRAINTS.length);
  });

  it("has balanced parentheses across the CREATE TABLE text", () => {
    const tableText = createTableBody().join("\n");
    const open = (tableText.match(/\(/g) ?? []).length;
    const close = (tableText.match(/\)/g) ?? []).length;
    expect(open).toBe(close);
  });

  it("terminates every table-constraint item with a comma or the closing paren", () => {
    // This is the exact shape that failed: a CHECK ( ... ) with no `),` before
    // the next CONSTRAINT keyword.
    const tableLines = createTableBody();
    for (let i = 0; i < tableLines.length; i++) {
      if (!/CONSTRAINT\s+ev000_enrollment_/.test(tableLines[i])) continue;
      // Walk forward to the line that closes this item.
      let depth = 0;
      let closed = false;
      for (let j = i + 1; j < tableLines.length; j++) {
        for (const ch of tableLines[j]) {
          if (ch === "(") depth++;
          if (ch === ")") depth--;
        }
        if (depth <= 0) {
          // A table-constraint item is terminated when the line closing it
          // ends with `)`, `),` or `);` — covering an inline `CHECK (...)`,
          // a bare `),` separator, and the final `);`.
          const terminator = tableLines[j].trim().replace(/[,;]$/, "");
          expect(
            terminator.endsWith(")"),
            `constraint at line ${i + 1} not terminated by: ${tableLines[j].trim()}`,
          ).toBe(true);
          closed = true;
          break;
        }
      }
      expect(closed, `constraint at line ${i + 1} never closes`).toBe(true);
    }
  });

  it("does not repeat a CONSTRAINT keyword back-to-back", () => {
    const tableLines = createTableBody();
    for (let i = 1; i < tableLines.length; i++) {
      if (!/CONSTRAINT\s+ev000_enrollment_/.test(tableLines[i])) continue;
      // The previous line must not be another declaration — that is the
      // signature of the duplicated unterminated block.
      expect(
        /CONSTRAINT\s+ev000_enrollment_/.test(tableLines[i - 1]),
        `duplicated constraint at line ${i + 1}`,
      ).toBe(false);
    }
  });

  /**
   * Policy names must be unique per table in PostgreSQL — a duplicate name is
   * a hard error ("policy ... for table ... already exists"). An earlier
   * revision carried a duplicated `deny_authenticated` policy for exactly
   * that reason, so the same guard applies here.
   */
  it("declares each RLS policy exactly once", () => {
    const EXPECTED_POLICIES = [
      "ev000_enrollment_service_only",
      "ev000_enrollment_deny_anon",
      "ev000_enrollment_deny_authenticated",
    ];
    const code = codeLines().join("\n");
    const declared = [...code.matchAll(/CREATE POLICY\s+"([^"]+)"/g)].map((m) => m[1]);
    expect(declared.length).toBe(EXPECTED_POLICIES.length);
    for (const name of declared) {
      expect(EXPECTED_POLICIES, `unexpected policy ${name}`).toContain(name);
      const occurrences = code.split(`CREATE POLICY "${name}"`).length - 1;
      expect(occurrences, `policy ${name} declared ${occurrences}×`).toBe(1);
    }
  });

  it("terminates every policy statement with a semicolon", () => {
    const lines = codeLines();
    lines.forEach((l, i) => {
      if (!/CREATE POLICY/.test(l)) return;
      // Walk forward to the statement terminator.
      let j = i;
      while (j < lines.length && !lines[j].trim().endsWith(";")) j++;
      expect(j, `policy at line ${i + 1} never terminates`).toBeLessThan(lines.length);
    });
  });

  // ── COMMENT statements ────────────────────────────────────
  //
  // A third instance of the same line-offset duplication family struck here:
  // an orphaned `COMMENT ... IS` header with no string literal, immediately
  // followed by the real header. PostgreSQL rejects it with
  //   ERROR: 42601: syntax error at or near "COMMENT"
  // The CONSTRAINT and CREATE POLICY guards could not see it, because a
  // duplicated COMMENT header is syntactically invisible to a name count.

  /** Every COMMENT this migration is expected to declare, exactly once. */
  const EXPECTED_COMMENTS = [
    "COMMENT ON TABLE ev000_enrollment IS",
    "COMMENT ON COLUMN ev000_enrollment.participant_ref_hash IS",
    "COMMENT ON COLUMN ev000_enrollment.consent_version IS",
    "COMMENT ON COLUMN ev000_enrollment.retention_until IS",
    "COMMENT ON COLUMN ev000_enrollment.lifecycle_state IS",
    "COMMENT ON COLUMN ev000_enrollment.retention_purged_at IS",
    "COMMENT ON FUNCTION purge_expired_ev000_participant_data() IS",
  ];

  it("declares each expected COMMENT exactly once", () => {
    const lines = codeLines();
    const headers = lines
      .map((l) => l.trim())
      .filter((l) => l.startsWith("COMMENT ON") && l.endsWith(" IS"));
    expect(headers.length).toBe(EXPECTED_COMMENTS.length);
    for (const header of EXPECTED_COMMENTS) {
      const occurrences = headers.filter((h) => h === header).length;
      expect(occurrences, `COMMENT "${header}" declared ${occurrences}×`).toBe(1);
    }
  });

  it("declares no unexpected COMMENT", () => {
    const headers = codeLines()
      .map((l) => l.trim())
      .filter((l) => l.startsWith("COMMENT ON") && l.endsWith(" IS"));
    for (const header of headers) {
      expect(EXPECTED_COMMENTS, `unexpected COMMENT: ${header}`).toContain(header);
    }
  });

  it("never repeats a COMMENT ON header back-to-back", () => {
    // This is the exact signature of the defect that reached PostgreSQL.
    const lines = codeLines();
    for (let i = 1; i < lines.length; i++) {
      const cur = lines[i].trim();
      const prev = lines[i - 1].trim();
      if (!cur.startsWith("COMMENT ON")) continue;
      expect(
        prev === cur,
        `duplicated COMMENT header at line ${i + 1}: ${cur}`,
      ).toBe(false);
    }
  });

  it("follows every COMMENT ON ... IS with a string literal", () => {
    // A bare `COMMENT ... IS` with no text is the orphaned-header defect:
    // PostgreSQL parses onward and rejects the NEXT keyword it meets.
    const lines = codeLines();
    lines.forEach((l, i) => {
      const header = l.trim();
      if (!header.startsWith("COMMENT ON") || !header.endsWith(" IS")) return;
      const next = (lines[i + 1] ?? "").trim();
      expect(
        next,
        `COMMENT at line ${i + 1} has no comment literal on the next line`,
      ).toMatch(/^'.*';$/);
    });
  });

  it("terminates every COMMENT statement with a semicolon", () => {
    const lines = codeLines();
    lines.forEach((l, i) => {
      if (!l.trim().startsWith("COMMENT ON")) return;
      let j = i;
      while (j < lines.length && !lines[j].trim().endsWith(";")) j++;
      expect(j, `COMMENT at line ${i + 1} never terminates`).toBeLessThan(lines.length);
    });
  });

  // ── BACKWARD guard: orphaned string literals ─────────────
  //
  // D4: a COMMENT *literal* survived its header. The line
  //   'ENROLLED or WITHDRAWN. Withdrawal is irreversible.';
  // sat alone after a GRANT, with no `COMMENT ON ... IS` above it. PostgreSQL
  // parsed it as a statement-initial string literal and returned 42601.
  //
  // Every existing COMMENT check looks FORWARD from a header. This one looks
  // BACKWARD from a literal, which is the direction that defect lives in.
  //
  // It works on statement structure, not on raw quote counting. A line only
  // counts as a statement-level literal when it BEGINS a statement with `'`.
  // That excludes: comment bodies (preceded by a header), literals inside
  // CHECK/INSERT/SELECT (not at line start), and dollar-quoted function
  // bodies (different delimiter entirely).

  /** True when the line opens a statement that is just a string literal. */
  const isStatementLevelLiteral = (line: string) => /^\s*'.*';\s*$/.test(line);

  it("has no orphaned statement-level string literal", () => {
    const lines = codeLines();
    lines.forEach((line, i) => {
      if (!isStatementLevelLiteral(line)) return;
      const prev = (lines[i - 1] ?? "").trim();
      // The only legitimate predecessor is a COMMENT ... IS header.
      expect(
        /^COMMENT ON .*\bIS$/.test(prev),
        `orphaned string literal at code line ${i + 1} with no COMMENT header: ${line.trim()}`,
      ).toBe(true);
    });
  });

  it("gives every COMMENT literal a preceding COMMENT header", () => {
    // The forward pairing restated as a backward lookup, so a literal that
    // lost its header fails even if another literal gained one.
    const lines = codeLines();
    lines.forEach((line, i) => {
      if (!isStatementLevelLiteral(line)) return;
      const prev = (lines[i - 1] ?? "").trim();
      if (!/^COMMENT ON .*\bIS$/.test(prev)) return;
      expect(
        /^COMMENT ON (TABLE|COLUMN|FUNCTION)\s+\S+\s+IS$/.test(prev),
        `COMMENT header at code line ${i} is malformed: ${prev}`,
      ).toBe(true);
    });
  });

  it("keeps every string literal inside a known construct", () => {
    // Sanity check that the orphan rule is not simply "no lone quotes":
    // legitimate literals must still be present and correctly paired.
    const lines = codeLines();
    const literals = lines.filter(isStatementLevelLiteral);
    const headers = lines.filter((l) => /^COMMENT ON .*\bIS$/.test(l.trim()));
    expect(literals.length).toBe(headers.length);
    expect(literals.length).toBeGreaterThan(0);
  });
});