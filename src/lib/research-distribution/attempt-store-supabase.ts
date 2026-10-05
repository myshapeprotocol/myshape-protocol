// ============================================================
// MyShape Protocol — MVDS delivery-attempt writer
//
// Append-only persistence for `research_distribution_attempt`,
// mirroring the W1 `DistributionWriter` split: the attempt log is a
// separate write capability from the distribution row because the
// two have genuinely different shapes and lifecycles.
//
// WHY TWO CALLS AND NOT ONE
//
// The schema encodes a consistency rule the application must
// respect:
//
//   CHECK ((status = 'IN_FLIGHT' AND completed_at IS NULL)
//       OR (status <> 'IN_FLIGHT' AND completed_at IS NOT NULL))
//
// `openAttempt` writes IN_FLIGHT with no completion. `completeAttempt`
// writes a terminal status WITH a completion. Because the row is
// never updated, a crash between the two calls leaves an honest
// IN_FLIGHT record — an unresolved attempt — rather than a lost or
// falsified one. That is the correct failure mode for an audit log.
//
// WHY NOT A SINGLE "COMPLETE" UPDATE
//
// An UPDATE-based completion would overwrite `rendered_text` and
// the original `started_at`, destroying the evidence of what was
// actually sent and when the attempt began. Append-only preserves
// both. The cost is that MVDS writes two rows per delivery; that is
// the trade the schema already made.
//
// NO UPDATE / NO UPSERT / NO DELETE
//
// Identical discipline to W1. An attempt, once written, is evidence.
// ============================================================

const TABLE = "research_distribution_attempt";

/**
 * The terminal statuses the schema permits, copied exactly.
 * SKIPPED is an attempt status and is deliberately not a
 * delivery_state.
 */
export type AttemptTerminalStatus = "SUCCEEDED" | "FAILED" | "SKIPPED";

export interface AttemptOpen {
  distributionId: number;
  /**
   * The exact text handed to the provider, preserved verbatim so the
   * record is evidence of what was actually sent.
   */
  renderedText: string;
}

export interface AttemptSucceeded {
  distributionId: number;
  renderedText: string;
  /** Resend's message id, preserved for reconciliation. */
  platformPostId: string;
  /** ISO-8601 instant. Supplied by the caller so this store has no clock. */
  completedAt: string;
}

export interface AttemptFailed {
  distributionId: number;
  renderedText: string;
  /** Safe to persist; provider errors are recorded, not re-thrown. */
  error: string;
  completedAt: string;
  /**
   * Whether a human must reconcile this attempt. True when the
   * provider may have accepted the message despite the error, which
   * is exactly the case where "FAILED" is not the whole truth.
   */
  reconciliationRequired?: boolean;
}

export interface OpenAttemptRow {
  attempt_id: number;
}

export interface DistributionAttemptWriter {
  /** Insert an IN_FLIGHT attempt. */
  openAttempt(input: AttemptOpen): Promise<OpenAttemptRow>;
  /** Insert a terminal SUCCEEDED attempt. */
  succeedAttempt(input: AttemptSucceeded): Promise<OpenAttemptRow>;
  /** Insert a terminal FAILED attempt. */
  failAttempt(input: AttemptFailed): Promise<OpenAttemptRow>;
}

/** A Supabase-shaped client, structurally typed as in W1. */
export interface AttemptClient {
  from(table: string): {
    insert(row: Record<string, unknown>): {
      select(columns: string): {
        single(): PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
  };
}

function toRow(data: unknown): OpenAttemptRow {
  if (!data || typeof data !== "object") {
    throw new Error("research_distribution_attempt insert returned no row");
  }
  const id = (data as { attempt_id?: unknown }).attempt_id;
  if (typeof id !== "number") {
    throw new Error("attempt insert returned no usable attempt_id");
  }
  return { attempt_id: id };
}

/**
 * Build the writer over an existing client.
 *
 * `reconciliation_required` is always written explicitly rather
 * than relying on the column default, so the stored value is the
 * orchestrator's decision and not an accident of omission.
 */
export function createSupabaseAttemptWriter(
  client: AttemptClient,
): DistributionAttemptWriter {
  async function insert(row: Record<string, unknown>): Promise<OpenAttemptRow> {
    const { data, error } = await client
      .from(TABLE)
      .insert(row)
      .select("attempt_id")
      .single();
    if (error) throw error;
    return toRow(data);
  }

  return {
    openAttempt(input: AttemptOpen): Promise<OpenAttemptRow> {
      return insert({
        distribution_id: input.distributionId,
        status: "IN_FLIGHT",
        started_at: new Date().toISOString(),
        rendered_text: input.renderedText,
        // IN_FLIGHT requires a null completion, per the schema's
        // completion-consistency CHECK.
        completed_at: null,
        platform_post_id: null,
        error: null,
        reconciliation_required: false,
      });
    },

    succeedAttempt(input: AttemptSucceeded): Promise<OpenAttemptRow> {
      return insert({
        distribution_id: input.distributionId,
        status: "SUCCEEDED",
        started_at: new Date().toISOString(),
        completed_at: input.completedAt,
        rendered_text: input.renderedText,
        platform_post_id: input.platformPostId,
        error: null,
        reconciliation_required: false,
      });
    },

    failAttempt(input: AttemptFailed): Promise<OpenAttemptRow> {
      return insert({
        distribution_id: input.distributionId,
        status: "FAILED",
        started_at: new Date().toISOString(),
        completed_at: input.completedAt,
        rendered_text: input.renderedText,
        platform_post_id: null,
        error: input.error,
        reconciliation_required: input.reconciliationRequired ?? false,
      });
    },
  };
}

/**
 * Factory: service-role credentials, same convention as the W1 store.
 *
 * The migration grants `service_role` INSERT on this table, which is
 * what an append-only audit writer needs and nothing more.
 */
export async function createSupabaseAttemptWriterFromEnv(): Promise<DistributionAttemptWriter> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase environment not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createSupabaseAttemptWriter(
    createClient(url, key) as unknown as AttemptClient,
  );
}
