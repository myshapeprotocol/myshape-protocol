// ============================================================
// MyShape Protocol — W1 Supabase adapter (the only SQL for W1)
//
// Implements the `DistributionWriter` port from
// `distribution-writer.ts` against `research_distribution`.
//
// This is the ONLY module in W1 that performs database I/O. It
// deliberately contains no governance logic: it does not derive a
// state, call the gate, resolve Registry provenance, compute a
// fingerprint, publish, or write approval events. It stores a row
// and reads a row.
//
// INSERT-ONLY BY CONSTRUCTION
//
// The adapter exposes `findByIdentity` and `insert`. There is no
// update, no upsert, no delete. `registry_commit` is therefore
// written once, at creation, and cannot be rewritten through W1 —
// which is how the lifecycle anchor stays stable for §3.5.
//
// FOLLOWING THE REPOSITORY CONVENTION
//
// Client construction mirrors `chain-store-supabase.ts`: a lazy
// dynamic import of `@supabase/supabase-js`, service-role
// credentials, and throwing the raw Supabase error so the caller
// can classify SQLSTATE 23505 in one place.
//
// ENVIRONMENT
//
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// The service role is required: the migration revokes anon and
// authenticated and grants `service_role` DML on this table.
// ============================================================

import {
  isUniqueViolation,
  type DistributionCreateInput,
  type DistributionIdentity,
  type DistributionRef,
  type DistributionWriter,
} from "./distribution-writer";

const TABLE = "research_distribution";

/**
 * The exact identity columns, matching
 * `research_distribution_idempotency_key`.
 *
 * `registry_commit` is NOT among them. That is deliberate and is the
 * behaviour §3.5 depends on: an unrelated commit must not fork a
 * second lifecycle for the same content, surface and platform.
 */
const IDENTITY_COLUMNS = [
  "distribution_id",
  "registry_commit",
] as const;

interface DistributionRow {
  distribution_id: number;
  registry_commit: string;
}

/** One `eq(...)` step in a PostgREST filter chain. */
export interface SupabaseFilter {
  eq(column: string, value: string): SupabaseFilter;
  maybeSingle(): PromiseLike<QueryResult>;
}

/** One terminal step of an insert. */
export interface SupabaseInsertReturning {
  select(columns: string): {
    single(): PromiseLike<QueryResult>;
  };
}

export interface QueryResult {
  data: unknown;
  error: unknown;
}

/**
 * A Supabase-shaped client.
 *
 * Structurally typed rather than importing the full generated
 * Database type, so this module stays decoupled from
 * `@supabase/supabase-js` types and remains unit-testable with a
 * plain object double. The filter is recursive because a real
 * PostgREST query chains one `.eq()` per identity column.
 */
export interface SupabaseLike {
  from(table: string): {
    select(columns: string): SupabaseFilter;
    insert(row: DistributionCreateInput): SupabaseInsertReturning;
  };
}

function toRef(data: unknown): DistributionRef | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Partial<DistributionRow>;
  if (typeof row.distribution_id !== "number") return null;
  return {
    distribution_id: row.distribution_id,
    registry_commit:
      typeof row.registry_commit === "string" ? row.registry_commit : "",
  };
}


/**
 * Build the `DistributionWriter` over an existing client.
 *
 * Exported separately from the factory so a test can inject a plain
 * object double and exercise the real query construction without a
 * database or a network.
 */
export function createSupabaseDistributionWriter(
  client: SupabaseLike,
): DistributionWriter {
  return {
    async findByIdentity(
      identity: DistributionIdentity,
    ): Promise<DistributionRef | null> {
      const { data, error } = await client
        .from(TABLE)
        .select(IDENTITY_COLUMNS.join(","))
        .eq("version_id", identity.version_id)
        .eq("surface", identity.surface)
        .eq("platform", identity.platform)
        .eq("content_fingerprint", identity.content_fingerprint)
        .maybeSingle();

      if (error) throw error;
      return toRef(data);
    },

    async insert(input: DistributionCreateInput): Promise<DistributionRef> {
      // `governance_state` and `delivery_state` are intentionally
      // OMITTED so the database defaults apply (DRAFT /
      // NOT_ATTEMPTED). Reproducing them here would let an
      // application bug pre-approve a record.
      const { data, error } = await client
        .from(TABLE)
        .insert(input)
        .select(IDENTITY_COLUMNS.join(","))
        .single();

      if (error) {
        // Re-thrown unchanged: `createDistribution` classifies 23505
        // and performs the read-after-conflict. Swallowing it here
        // would lose the only signal that a race occurred.
        throw error;
      }

      const ref = toRef(data);
      if (ref === null) {
        throw new Error("research_distribution insert returned no usable row");
      }
      return ref;
    },
  };
}

/**
 * Factory: resolve service-role credentials and build the writer.
 *
 * Mirrors `createSupabaseReceiptWriter()` in
 * `chain-store-supabase.ts` — lazy dynamic import, same environment
 * variables, same failure mode.
 */
export async function createSupabaseDistributionWriterFromEnv(): Promise<DistributionWriter> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase environment not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(url, key) as unknown as SupabaseLike;
  return createSupabaseDistributionWriter(client);
}

/** Re-exported so callers need not import two modules to classify a race. */
export { isUniqueViolation };
