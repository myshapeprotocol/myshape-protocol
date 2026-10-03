// ============================================================
// MyShape Protocol — production DistributionRepository adapter
//
// The read side of the Research Distribution Service, backed by
// Supabase. This is the adapter `requestDistribution()` needs to
// run against a real database instead of a test double.
//
// READ-ONLY, BY CONSTRUCTION
//
// The client type below declares `select` and nothing else. There is
// no `insert`, `update`, `upsert`, `delete` or `rpc` on it, so this
// module cannot write even if a future edit tried to: the writes
// live in `distribution-writer.ts`, `approval-store.ts`,
// `attempt-store-supabase.ts` and `delivery-state-store.ts`.
//
// WHY `loadDistribution` RETURNS ONLY TWO FIELDS
//
// `DistributionProvenance` declares exactly `distribution_id` and
// `registry_commit`. The table also has `governance_state` and
// `delivery_state` columns, and they are deliberately NOT read.
//
// They are caches of derived values, and the governance chain
// derives both itself: `deriveGovernanceState(events)` and
// `deriveDeliveryState(attempts)` never look at the distribution
// row. `checkApprovalFreshness` reads `registry_commit` and nothing
// else. Returning the cached columns would hand the control plane a
// second, unverified source of truth — precisely what the committed
// test "never allows an empty history carrying a HUMAN_APPROVED
// cache" exists to forbid. A tampered cache must not be able to
// authorise anything, so this adapter does not surface it.
//
// NULL VS EMPTY — THE DISTINCTION THE SERVICE DEPENDS ON
//
// `readHistory` in `distribution-service.ts` treats these
// differently, and so must this adapter:
//
//   null  = the read failed, or the parent row does not exist.
//           An absence of evidence.
//   []    = the read succeeded and there are no child rows.
//           A readable empty log.
//
// A Supabase error is NEVER converted into `[]`. Doing so would
// report "this distribution has never been approved" when the truth
// is "approval history could not be read", and `readHistory` would
// then derive DRAFT from an outage instead of failing closed as
// X-04 requires.
//
// ORDERING
//
// Events and attempts are ordered by their identity column so the
// returned log matches "oldest first" in the interface contract.
// `deriveGovernanceState` and `deriveDeliveryState` each re-sort
// defensively, so this is a courtesy to callers, not a correctness
// dependency.
//
// FOLLOWING THE EXISTING CONVENTION
//
// Client construction mirrors `chain-store-supabase.ts` and the MVDS
// stores: lazy dynamic import, NEXT_PUBLIC_SUPABASE_URL plus
// SUPABASE_SERVICE_ROLE_KEY (the migration revokes anon and
// authenticated and grants service_role SELECT on these tables).
// ============================================================

import type { DistributionRepository } from "./distribution-service";
import type { DistributionProvenance } from "./approval-freshness";
import type {
  GovernanceEventInput,
  DeliveryAttemptInput,
} from "./derivation";


export interface QueryResult {
  data: unknown;
  error: unknown;
}

/**
 * A read-only Supabase-shaped client.
 *
 * `select` is the only method. Nothing in this module can express
 * a mutation through this type.
 */
export interface SupabaseReadClient {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): PromiseLike<QueryResult>;
        order(
          column: string,
          options: { ascending: boolean },
        ): PromiseLike<QueryResult>;
      };
    };
  };
}

function mapDistribution(data: unknown): DistributionProvenance | null {
  if (!data || typeof data !== "object") return null;
  const row = data as { distribution_id?: unknown; registry_commit?: unknown };
  // A row without an identity is not a usable reading. Returning null
  // keeps the caller on the "unreadable" path rather than handing it
  // an anchor it cannot trust.
  if (typeof row.distribution_id !== "number") return null;
  return {
    distribution_id: String(row.distribution_id),
    registry_commit:
      typeof row.registry_commit === "string" ? row.registry_commit : null,
  };
}

function mapEvents(data: unknown): GovernanceEventInput[] {
  if (!Array.isArray(data)) return [];
  return data.map((entry) => {
    const row = (entry ?? {}) as Record<string, unknown>;
    return {
      event_id: typeof row.event_id === "number" ? row.event_id : null,
      decision: typeof row.decision === "string" ? row.decision : null,
      approver_type:
        typeof row.approver_type === "string" ? row.approver_type : null,
      approver_id: typeof row.approver_id === "string" ? row.approver_id : null,
      approval_ref:
        typeof row.approval_ref === "string" ? row.approval_ref : null,
      content_fingerprint:
        typeof row.content_fingerprint === "string"
          ? row.content_fingerprint
          : null,
      registry_commit:
        typeof row.registry_commit === "string" ? row.registry_commit : null,
      reason: typeof row.reason === "string" ? row.reason : null,
    };
  });
}

function mapAttempts(data: unknown): DeliveryAttemptInput[] {
  if (!Array.isArray(data)) return [];
  return data.map((entry) => {
    const row = (entry ?? {}) as Record<string, unknown>;
    return {
      attempt_id: typeof row.attempt_id === "number" ? row.attempt_id : null,
      status: typeof row.status === "string" ? row.status : null,
      reconciliation_required:
        typeof row.reconciliation_required === "boolean"
          ? row.reconciliation_required
          : null,
    };
  });
}

const DISTRIBUTION_TABLE = "research_distribution";
const EVENT_TABLE = "research_distribution_event";
const ATTEMPT_TABLE = "research_distribution_attempt";


/**
 * Build the repository over an existing client.
 *
 * Exported separately from the factory so tests can drive the real
 * mapping with a plain object double and no database.
 */
export function createSupabaseDistributionRepository(
  client: SupabaseReadClient,
): DistributionRepository {
  return {
    async loadDistribution(distributionId: string) {
      const { data, error } = await client
        .from(DISTRIBUTION_TABLE)
        .select(DISTRIBUTION_COLUMNS)
        .eq("distribution_id", distributionId)
        .maybeSingle();

      // A read error is an absence of evidence, not an empty record.
      if (error) return null;
      // Zero rows is also absence: the parent record does not exist.
      return mapDistribution(data);
    },

    async loadEvents(distributionId: string) {
      const { data, error } = await client
        .from(EVENT_TABLE)
        .select(EVENT_COLUMNS)
        .eq("distribution_id", distributionId)
        .order("event_id", { ascending: true });

      // Never collapse a failed read into an empty log.
      if (error) return null;
      // A successful query with zero rows IS a readable empty log.
      return mapEvents(data);
    },

    async loadAttempts(distributionId: string) {
      const { data, error } = await client
        .from(ATTEMPT_TABLE)
        .select(ATTEMPT_COLUMNS)
        .eq("distribution_id", distributionId)
        .order("attempt_id", { ascending: true });

      if (error) return null;
      return mapAttempts(data);
    },
  };
}

/**
 * Factory: resolve service-role credentials and build the repository.
 *
 * Same convention as every other store in this layer.
 */
export async function createSupabaseDistributionRepositoryFromEnv(): Promise<DistributionRepository> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase environment not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createSupabaseDistributionRepository(
    createClient(url, key) as unknown as SupabaseReadClient,
  );
}

/**
 * Exactly the columns `DistributionProvenance` declares. Selecting
 * more would widen the interface's authority without its consent.
 */
const DISTRIBUTION_COLUMNS = "distribution_id,registry_commit";

/** Exactly the columns `GovernanceEventInput` declares. */
const EVENT_COLUMNS =
  "event_id,decision,approver_type,approver_id,approval_ref," +
  "content_fingerprint,registry_commit,reason";

/** Exactly the columns `DeliveryAttemptInput` declares. */
const ATTEMPT_COLUMNS = "attempt_id,status,reconciliation_required";
