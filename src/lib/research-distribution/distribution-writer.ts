// ============================================================
// MyShape Protocol — W1 distribution record creation (port)
//
// Creates the persistent `research_distribution` lifecycle record.
// Implements RESEARCH-DISTRIBUTION-IMPLEMENTATION-PLAN §1.2 step 4.
//
// WHAT W1 IS — AND IS NOT
//
// W1 establishes a record. It does NOT authorise anything.
//
//   W1 creation == authorization      NOT VALID
//   W1 creation before approval       VALID and expected
//
// A newly created row carries the DATABASE DEFAULTS:
//
//   governance_state = 'DRAFT'
//   delivery_state   = 'NOT_ATTEMPTED'
//
// This module deliberately has no governance vocabulary at all: no
// state, no approval, no gate, no delivery. Whether the record may
// ever be distributed is answered by the control pipeline in
// `distribution-service.ts`, which reads this row afterwards. W1
// never consults or predicts that answer.
//
// WHY A SEPARATE PORT
//
// `DistributionRepository` is read-only and is asserted to be so by
// its own test. Widening it would give the control plane a write
// capability it has no use for. This is the same split the evidence
// layer already uses: `ReceiptWriter.insert()` beside
// `PredecessorLookup.get()`. The write surface is separate AND
// insert-only, which is what makes the provenance anchor immutable
// by construction rather than by convention.
//
// IMMUTABILITY, ACCURATELY STATED
//
// `registry_commit` is the lifecycle anchor (DERIVATION-SPEC §3.5/§3.6).
// Database-level immutability is NOT independently enforced by the
// migration: `service_role` retains UPDATE on `research_distribution`
// and that table carries no UPDATE trigger. W1 preserves the anchor
// by exposing ONLY insert and never issuing an UPDATE. This is an
// application-level guarantee, not a database one.
//
// PROVENANCE
//
// `registry_commit` MUST be supplied by the caller, already resolved
// through `resolveRegistryCommit()` (the decision-time provenance
// boundary). This module never runs Git, never reads the Registry,
// and never derives the value. That algorithm lives in exactly one
// place and duplicating it here would be a second source of truth.
//
// Pure and deterministic: no I/O, no clock, no randomness. All
// database access is behind the injected port.
// ============================================================

// ---------------------------------------------------------------
// Input
// ---------------------------------------------------------------

/**
 * Everything needed to create one distribution lifecycle record.
 *
 * These are exactly the columns `research_distribution` requires
 * from a writer. `governance_state` and `delivery_state` are
 * absent by design: the database owns their initial values.
 */
export interface DistributionCreateInput {
  asset_id: string;
  version_id: string;
  surface: string;
  brand: string;
  platform: string;
  content_fingerprint: string;
  /**
   * The decision-time Registry provenance, already resolved by
   * `resolveRegistryCommit()`. Never derived here.
   */
  registry_commit: string;
}

/**
 * The idempotency identity.
 *
 * Exactly the database constraint
 * `research_distribution_idempotency_key`. `registry_commit` is
 * deliberately EXCLUDED: a Registry change must collapse onto the
 * SAME lifecycle, which is precisely what makes §3.5 freshness fire
 * on the next decision instead of forking a duplicate record.
 */
export interface DistributionIdentity {
  version_id: string;
  surface: string;
  platform: string;
  content_fingerprint: string;
}

/** The minimum stored projection W1 needs. */
export interface DistributionRef {
  distribution_id: number;
  /**
   * The anchor as STORED. Not necessarily the caller's value — when
   * a row already existed, its original anchor is preserved.
   */
  registry_commit: string;
}


/**
 * INSERT-ONLY persistence capability.
 *
 * There is no `update`, no `upsert`, no `delete`, and no way to run
 * arbitrary SQL. That omission is the contract: an existing
 * lifecycle can never be mutated by this port, which is what keeps
 * `registry_commit` stable for the life of the record.
 *
 * The two methods are the minimum needed to be race-tolerant:
 * look up by identity, and insert.
 */
export interface DistributionWriter {
  /** The stored row for this identity, or null when absent. */
  findByIdentity(
    identity: DistributionIdentity,
  ): Promise<DistributionRef | null>;

  /**
   * Insert a new row. MUST raise a unique violation when one already
   * exists for the identity rather than updating it.
   */
  insert(
    input: DistributionCreateInput,
  ): Promise<DistributionRef>;
}

// ---------------------------------------------------------------
// Result
// ---------------------------------------------------------------

export type DistributionCreateFailure =
  /** The identity was not fully specified. */
  | "INVALID_INPUT"
  /** The store could not be read or written. */
  | "STORE_ERROR"
  /**
   * A concurrent writer won the race and the follow-up read could
   * not establish the winning row. Never fabricate an id here.
   */
  | "CONFLICT_UNRESOLVED";

export type DistributionCreateResult =
  | {
      ok: true;
      /** The row this call may now use — created or pre-existing. */
      distribution: DistributionRef;
      /** True only when this call inserted the row. */
      created: boolean;
    }
  | { ok: false; code: DistributionCreateFailure; detail: string };

// ---------------------------------------------------------------
// Validation
// ---------------------------------------------------------------

/**
 * Validate only what THIS layer can legitimately guarantee.
 *
 * The column shapes and formats are checked because the database
 * enforces them with CHECK constraints and a violation would be an
 * opaque error. Provenance is NOT re-derived or re-verified here:
 * `resolveRegistryCommit()` already did that, and repeating it would
 * duplicate the §3.6 algorithm in a second place.
 */
function validate(input: DistributionCreateInput): string | null {
  const required = [
    input.asset_id,
    input.version_id,
    input.surface,
    input.brand,
    input.platform,
    input.content_fingerprint,
    input.registry_commit,
  ];
  if (required.some((v) => typeof v !== "string" || v === "")) {
    return "every distribution field must be a non-empty string";
  }
  if (!/^[0-9a-f]{64}$/.test(input.content_fingerprint)) {
    return "content_fingerprint must be a 64-character lowercase hex digest";
  }
  if (!/^[0-9a-f]{7,40}$/.test(input.registry_commit)) {
    return "registry_commit must be a 7-40 character lowercase hex commit SHA";
  }
  return null;
}

// ---------------------------------------------------------------
// W1 — create or resolve
// ---------------------------------------------------------------

/**
 * Establish the distribution lifecycle record, or return the one that
 * already exists.
 *
 * THE SEQUENCE
 *
 *   1. validate the input
 *   2. SELECT by the unique identity
 *        found     -> return it, untouched
 *   3. INSERT
 *        ok        -> return the new row
 *        23505     -> SELECT again (read-after-conflict)
 *                       found -> return the winner, untouched
 *                       absent/error -> CONFLICT_UNRESOLVED
 *
 * The 23505 branch is the whole reason this is safe concurrently.
 * It performs exactly ONE further read: the insert is never retried,
 * because retrying against a constraint you already lost is how a
 * caller ends up overwriting a live lifecycle.
 *
 * EXISTING ROWS ARE NEVER MUTATED
 *
 * When a row exists, its stored `registry_commit` is returned as-is —
 * even when the caller's value differs. Overwriting it would
 * silently re-anchor the lifecycle and destroy the §3.5 evidence
 * that a re-approval is required. The mismatch is then detected on
 * the read path by `checkApprovalFreshness()`.
 *
 * FAIL CLOSED
 *
 * Every unrecoverable path returns a discriminated failure. Nothing
 * invents a `distribution_id`, and no failure is reported as success.
 */
export async function createDistribution(
  writer: DistributionWriter,
  input: DistributionCreateInput,
): Promise<DistributionCreateResult> {
  const invalid = validate(input);
  if (invalid !== null) {
    return { ok: false, code: "INVALID_INPUT", detail: invalid };
  }

  const identity = identityOf(input);

  let existing: DistributionRef | null;
  try {
    existing = await writer.findByIdentity(identity);
  } catch (error) {
    return {
      ok: false,
      code: "STORE_ERROR",
      detail: describe(error),
    };
  }

  // The lifecycle already exists. Return it exactly as stored.
  if (existing !== null) {
    return { ok: true, distribution: existing, created: false };
  }

  try {
    const created = await writer.insert(input);
    return { ok: true, distribution: created, created: true };
  } catch (error) {
    if (!isUniqueViolation(error)) {
      return { ok: false, code: "STORE_ERROR", detail: describe(error) };
    }

    // A concurrent writer won the race. One read establishes the
    // winner; a second insert is never attempted.
    let winner: DistributionRef | null;
    try {
      winner = await writer.findByIdentity(identity);
    } catch (readError) {
      return {
        ok: false,
        code: "CONFLICT_UNRESOLVED",
        detail: `a concurrent writer inserted this identity, but the follow-up read failed: ${describe(readError)}`,
      };
    }

    if (winner === null) {
      return {
        ok: false,
        code: "CONFLICT_UNRESOLVED",
        detail:
          "a concurrent writer reported a unique violation, but no row could be read for this identity",
      };
    }

    return { ok: true, distribution: winner, created: false };
  }
}

/** Never throws — a failure becomes a value the caller must handle. */
function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}


/** The unique-identity projection. Note: no `registry_commit`. */
export function identityOf(
  input: DistributionCreateInput,
): DistributionIdentity {
  return {
    version_id: input.version_id,
    surface: input.surface,
    platform: input.platform,
    content_fingerprint: input.content_fingerprint,
  };
}

/**
 * Is this error a unique violation? PostgreSQL SQLSTATE 23505.
 *
 * Matches the repository's existing convention in `trusted-writer.ts`,
 * which also accepts a message fallback.
 */
export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string };
  return err.code === "23505" || (err.message?.includes("duplicate") ?? false);
}
