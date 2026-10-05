// ============================================================
// MyShape Protocol — MVDS human-approval writer
//
// Append-only evidence of a real human approving a real
// distribution.
//
// WHY THIS EXISTS AT ALL
//
// `governance_state` is DERIVED, never written. `deriveGovernanceState`
// reaches HUMAN_APPROVED only by reading a HUMAN_APPROVED-shaped
// event in `research_distribution_event`. So to make a first
// publication possible, someone has to be able to write that event —
// and nothing in the repository currently can. This is that writer.
//
// IT DOES NOT APPROVE ANYTHING
//
// It records that a human said so. Authority was the human's, before
// this function ran. The function's job is to make that fact
// legible to the existing derivation, not to confer it. That is why
// it writes the event log and nothing else: no state columns, no
// delivery, no Registry.
//
// PROVENANCE CANNOT BE SUBSTITUTED
//
// The event carries its own copy of `content_fingerprint` and
// `registry_commit`. If a caller could pass those in freely, an
// approval recorded against snapshot A could be replayed against
// snapshot B and `checkApprovalFreshness()` would have nothing to
// compare. So this writer READS the distribution row and copies its
// stored provenance into the event. The caller names WHO approved
// and WHY; it never names WHICH snapshot was approved.
//
// WRITES ONE TABLE, APPEND-ONLY
//
// The migration marks this table append-only and the derivation
// treats the log as the audit record. There is no update or delete
// here, by the same reasoning as W1.
//
// APPROVER IDENTITY IS CALLER-SUPPLIED AND EXPLICIT
//
// The schema requires `approver_id` but nothing in the repository
// defines an approver-identity authority. Inventing one would be a
// governance decision, which is outside MVDS. Instead the caller
// supplies the identity and this writer only refuses to accept an
// empty one. Who is permitted to CALL this function is an
// authorization concern for the orchestration layer, not something
// a database writer can decide.
// ============================================================

const EVENT_TABLE = "research_distribution_event";
const DISTRIBUTION_TABLE = "research_distribution";

/** The decision value that derives HUMAN_APPROVED. Copied from schema. */
export const HUMAN_APPROVED_DECISION = "approved" as const;

/** The approver type that authorises. Copied from schema. */
export const HUMAN_APPROVER_TYPE = "HUMAN" as const;

export interface ApprovalEvidence {
  /** The distribution being approved. Its provenance is read, not given. */
  distributionId: number;
  /** Who approved. Must be non-empty; authority is the caller's to hold. */
  approverId: string;
  /** Where the approval was given, e.g. a console or a review ticket. */
  approvalSource: string;
  /** Stable external reference for the approval act. */
  approvalRef: string;
  /** Free-text justification. Optional for 'approved' by schema. */
  reason?: string;
  /** ISO-8601 instant. Caller-supplied so this store has no clock. */
  approvedAt: string;
}

export type ApprovalFailure =
  | "INVALID_INPUT"
  | "STORE_ERROR"
  | "DISTRIBUTION_NOT_FOUND";

export type ApprovalResult =
  | { ok: true; eventId: number; registryCommit: string }
  | { ok: false; code: ApprovalFailure; detail: string };

/**
 * The row read to source provenance. Deliberately the smallest read
 * that can produce a non-substitutable event.
 */
export interface ApprovalProvenanceRow {
  distribution_id: number;
  content_fingerprint: string;
  registry_commit: string;
}

export interface ApprovalClient {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string | number): {
        maybeSingle(): PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
    insert(row: Record<string, unknown>): {
      select(columns: string): {
        single(): PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
  };
}

export interface HumanApprovalWriter {
  /**
   * Record a human approval, sourcing provenance from the
   * distribution row itself.
   */
  recordHumanApproval(input: ApprovalEvidence): Promise<ApprovalResult>;
}

/**
 * Build the writer over an existing client.
 */
export function createSupabaseApprovalStore(
  client: ApprovalClient,
): HumanApprovalWriter {
  return {
    async recordHumanApproval(
      input: ApprovalEvidence,
    ): Promise<ApprovalResult> {
      // ---- Validate what this layer can guarantee ----
      if (
        typeof input.approverId !== "string" ||
        input.approverId.trim() === "" ||
        typeof input.approvalSource !== "string" ||
        input.approvalSource.trim() === "" ||
        typeof input.approvalRef !== "string" ||
        input.approvalRef.trim() === "" ||
        typeof input.approvedAt !== "string" ||
        input.approvedAt === ""
      ) {
        return {
          ok: false,
          code: "INVALID_INPUT",
          detail:
            "an approval needs a non-empty approverId, approvalSource, approvalRef and approvedAt",
        };
      }

      // ---- Read the row: provenance comes from HERE, not the caller ----
      const { data, error } = await client
        .from(DISTRIBUTION_TABLE)
        .select("distribution_id,content_fingerprint,registry_commit")
        .eq("distribution_id", input.distributionId)
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
          detail: `no research_distribution row with distribution_id ${input.distributionId}`,
        };
      }

      const row = data as Partial<ApprovalProvenanceRow>;
      if (
        typeof row.registry_commit !== "string" ||
        typeof row.content_fingerprint !== "string"
      ) {
        return {
          ok: false,
          code: "STORE_ERROR",
          detail:
            "the distribution row has no usable provenance to approve against",
        };
      }

      // The stored anchor, copied verbatim. This is the whole point:
      // the event cannot claim a snapshot the record was not anchored to.
      const registryCommit = row.registry_commit;

      const { data: inserted, error: insertError } = await client
        .from(EVENT_TABLE)
        .insert({
          distribution_id: input.distributionId,
          decision: HUMAN_APPROVED_DECISION,
          approver_type: HUMAN_APPROVER_TYPE,
          approver_id: input.approverId,
          approval_source: input.approvalSource,
          approval_ref: input.approvalRef,
          approved_at: input.approvedAt,
          content_fingerprint: row.content_fingerprint,
          registry_commit: registryCommit,
          reason: input.reason ?? null,
        })
        .select("event_id")
        .single();

      if (insertError) {
        return {
          ok: false,
          code: "STORE_ERROR",
          detail:
            insertError instanceof Error ? insertError.message : String(insertError),
        };
      }

      const eventId = (inserted as { event_id?: unknown } | null)?.event_id;
      if (typeof eventId !== "number") {
        return {
          ok: false,
          code: "STORE_ERROR",
          detail: "approval insert returned no usable event_id",
        };
      }

      return { ok: true, eventId, registryCommit };
    },
  };
}

/** Factory: service-role credentials, same convention as the W1 store. */
export async function createSupabaseApprovalStoreFromEnv(): Promise<HumanApprovalWriter> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase environment not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createSupabaseApprovalStore(
    createClient(url, key) as unknown as ApprovalClient,
  );
}
