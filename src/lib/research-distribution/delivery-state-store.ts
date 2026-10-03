// ============================================================
// MyShape Protocol — MVDS delivery-state store
//
// The ONE deliberate exception to W1's insert-only rule, and it is
// kept in its own file so the exception is visible rather than
// smuggled into the insert path.
//
// WHY IT EXISTS
//
// W1 creates a record and never touches it again. Delivery cannot
// work that way: the schema has a lifecycle
//
//   NOT_ATTEMPTED → IN_FLIGHT → PUBLISHED | FAILED
//
// and something has to advance it. This store is that something, and
// it is the only code in MVDS permitted to UPDATE
// `research_distribution`.
//
// THE ONLY COLUMN IT WRITES
//
// `delivery_state`. Nothing else. Not `governance_state` — that is
// DERIVED by `deriveGovernanceState()` from the event log, and
// writing it directly would forge approval. Not the identity
// columns, and above all not `registry_commit`: the lifecycle anchor
// is written once by W1 and is immutable for the life of the row.
//
//   UPDATE research_distribution
//      SET delivery_state = $1
//    WHERE distribution_id = $2
//
// No upsert: a missing row is an error to surface, never a row to
// create. An upsert here could resurrect a deleted distribution with
// a fabricated identity.
//
// THE PUBLISHED GUARD
//
// The migration already enforces
//
//   CHECK (delivery_state <> 'PUBLISHED'
//       OR governance_state = 'HUMAN_APPROVED')
//
// so the database refuses PUBLISHED without human approval even if
// this code were wrong. This store re-checks the same condition
// first and fails closed without issuing the UPDATE. The database
// constraint is the backstop; this is the deliberate gate that
// avoids relying on a constraint violation as normal control flow.
//
// AUTHORIZATION IS NOT DECIDED HERE
//
// This store does not ask whether distribution is allowed. It is
// only ever called with a distribution_id that already passed
// `requestDistribution()`. The PUBLISHED guard is a safety
// interlock, not an authorization decision.
// ============================================================

const TABLE = "research_distribution";

/** The delivery lifecycle, copied exactly from the schema enum. */
export type ProgressionTarget = "IN_FLIGHT" | "PUBLISHED" | "FAILED";

export type DeliveryStateFailure =
  /** The distribution row could not be read. */
  | "STORE_ERROR"
  /** The row does not exist. */
  | "DISTRIBUTION_NOT_FOUND"
  /**
   * PUBLISHED was requested without human approval. Refused without
   * issuing any UPDATE.
   */
  | "NOT_HUMAN_APPROVED"
  /** The row's current state cannot legally move to the target. */
  | "ILLEGAL_TRANSITION";

export type DeliveryStateResult =
  | { ok: true; deliveryState: ProgressionTarget }
  | { ok: false; code: DeliveryStateFailure; detail: string };

/**
 * The terminal step of an UPDATE: `.select()` resolves to a promise.
 * Split out so the builder chain and the result stay distinguishable.
 */
export interface DeliveryStateUpdateTerminal {
  single(): PromiseLike<{ data: unknown; error: unknown }>;
}

/**
 * The minimum a store must implement: read the two state columns,
 * then write only `delivery_state`.
 */
export interface DeliveryStateClient {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string | number): {
        maybeSingle(): PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
    update(values: Record<string, unknown>): {
      eq(column: string, value: string | number): {
        select(columns: string): DeliveryStateUpdateTerminal;
      };
    };
  };
}

export interface DeliveryStateStore {
  /**
   * Advance the delivery lifecycle, refusing PUBLISHED unless the row
   * is HUMAN_APPROVED.
   */
  advance(
    distributionId: number,
    target: ProgressionTarget,
  ): Promise<DeliveryStateResult>;
}

/**
 * Legal predecessor states per target.
 *
 * NOT_ATTEMPTED → IN_FLIGHT, and IN_FLIGHT → PUBLISHED or FAILED.
 * Nothing else. A PUBLISHED row cannot be re-published, which is
 * what keeps a duplicate send from looking like a success.
 */
const ALLOWED_FROM: Record<ProgressionTarget, readonly string[]> = {
  IN_FLIGHT: ["NOT_ATTEMPTED", "FAILED"],
  FAILED: ["IN_FLIGHT"],
  PUBLISHED: ["IN_FLIGHT"],
};

/**
 * Build the store over an existing client.
 *
 * Deliberately narrow: `.update()` is reachable only through
 * `advance`, and the values object it receives is constructed here,
 * never forwarded from a caller. There is no path by which a caller
 * can choose which columns change.
 */
export function createSupabaseDeliveryStateStore(
  client: DeliveryStateClient,
): DeliveryStateStore {
  return {
    async advance(
      distributionId: number,
      target: ProgressionTarget,
    ): Promise<DeliveryStateResult> {
      const { data, error } = await client
        .from(TABLE)
        .select("distribution_id,delivery_state,governance_state")
        .eq("distribution_id", distributionId)
        .maybeSingle();

      if (error) {
        return {
          ok: false,
          code: "STORE_ERROR",
          detail: error instanceof Error ? error.message : String(error),
        };
      }
      if (!data || typeof data !== "object") {
        return {
          ok: false,
          code: "DISTRIBUTION_NOT_FOUND",
          detail: `no research_distribution row with distribution_id ${distributionId}`,
        };
      }

      const row = data as {
        delivery_state?: unknown;
        governance_state?: unknown;
      };

      // The interlock. Checked BEFORE any write so a refusal leaves
      // the row untouched.
      if (target === "PUBLISHED" && row.governance_state !== "HUMAN_APPROVED") {
        return {
          ok: false,
          code: "NOT_HUMAN_APPROVED",
          detail:
            `refusing PUBLISHED: governance_state is ` +
            `${String(row.governance_state)}, not HUMAN_APPROVED`,
        };
      }

      const current = row.delivery_state;
      if (
        typeof current !== "string" ||
        !ALLOWED_FROM[target].includes(current)
      ) {
        return {
          ok: false,
          code: "ILLEGAL_TRANSITION",
          detail: `cannot move delivery_state from ${String(current)} to ${target}`,
        };
      }

      // The single UPDATE. Values are fixed here; a caller cannot
      // name a column, and registry_commit is not among them.
      const { error: updateError } = await client
        .from(TABLE)
        .update({ delivery_state: target })
        .eq("distribution_id", distributionId)
        .select("distribution_id")
        .single();

      if (updateError) {
        return {
          ok: false,
          code: "STORE_ERROR",
          detail:
            updateError instanceof Error
              ? updateError.message
              : String(updateError),
        };
      }

      return { ok: true, deliveryState: target };
    },
  };
}

/** Factory: service-role credentials, same convention as the W1 store. */
export async function createSupabaseDeliveryStateStoreFromEnv(): Promise<DeliveryStateStore> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase environment not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createSupabaseDeliveryStateStore(
    createClient(url, key) as unknown as DeliveryStateClient,
  );
}

//
