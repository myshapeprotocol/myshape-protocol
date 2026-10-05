// ============================================================
// MyShape Protocol — Research Distribution state derivation
//
// Pure derivation layer. Implements RESEARCH-DISTRIBUTION-
// DERIVATION-SPEC.md §3 (governance) and §4 (delivery).
//
// This module has NO imports. That is deliberate and load-bearing:
// with no import graph it cannot reach a database, a Registry file,
// the filesystem, the clock, or a platform adapter. The only way to
// get a non-deterministic answer is to change this file.
//
// It performs no I/O and writes nothing. It reads two in-memory
// arrays and returns a value. Callers are responsible for persistence,
// and persistence is a later phase.
//
// Derivation FAILS (not throws) on a contradiction: see §0 of the
// spec. "Contradiction" is an outcome of the derivation, never a
// value of governance_state — the column is frozen at four values.
// ============================================================

// ---------------------------------------------------------------
// Inputs
//
// Every field is optional and nullable. The engine must not throw
// for invalid history, so a malformed row is a value it can
// examine rather than a crash it must survive. Real rows are typed
// more tightly at the database boundary; this shape is what the
// pure layer is willing to look at.
// ---------------------------------------------------------------

/** A row of research_distribution_event, as the derivation sees it. */
export interface GovernanceEventInput {
  event_id?: number | null;
  decision?: string | null;
  approver_type?: string | null;
  approver_id?: string | null;
  approval_ref?: string | null;
  content_fingerprint?: string | null;
  registry_commit?: string | null;
  /** Retained on the table for exception_granted; not a derivation input. */
  reason?: string | null;
}

/** A row of research_distribution_attempt, as the derivation sees it. */
export interface DeliveryAttemptInput {
  attempt_id?: number | null;
  status?: string | null;
  reconciliation_required?: boolean | null;
}

// ---------------------------------------------------------------
// Outputs
//
// The four governance values and the four delivery values are the
// frozen schema enums, copied exactly. SKIPPED is an attempt
// status and is deliberately NOT a delivery_state (spec §4.2).
// ---------------------------------------------------------------

export type GovernanceState =
  | "DRAFT"
  | "AI_REVIEWED"
  | "HUMAN_APPROVED"
  | "WITHDRAWN";

export type DeliveryState =
  | "NOT_ATTEMPTED"
  | "IN_FLIGHT"
  | "PUBLISHED"
  | "FAILED";

export type DiagnosticCode =
  // governance — exclusions (spec §2)
  | "EXCLUDED_DECISION"
  | "EXCLUDED_APPROVER_TYPE"
  | "EXCLUDED_MISSING_APPROVER_ID"
  | "EXCLUDED_MISSING_APPROVAL_REF"
  | "EXCLUDED_UNKNOWN_DECISION"
  // governance — outcomes (spec §3)
  | "WITHDRAWN_TERMINAL"
  | "CONTRADICTION_SUPPRESSED_BY_WITHDRAWAL"
  | "CONTRADICTORY_FINGERPRINTS"
  | "REGISTRY_COMMIT_SPLIT"
  // delivery (spec §4)
  | "ATTEMPT_SKIPPED"
  | "RECONCILIATION_REQUIRED"
  // input guard
  | "INVALID_INPUT";

/**
 * A non-fatal observation, or the reason a derivation failed.
 *
 * Exclusions are recorded rather than silently dropped (spec §2):
 * a rejection or an exception is a fact worth preserving, and an
 * operator reading diagnostics must be able to see why an approval
 * did not count.
 */
export interface Diagnostic {
  code: DiagnosticCode;
  message: string;
  event_id?: number;
  attempt_id?: number;
  detail?: Record<string, string | string[]>;
}

/**
 * Governance result.
 *
 * `ok: false` means the derivation produced NO state — the only
 * cause is a contradiction. Callers must treat `state: null` as
 * "refuse distribution, do not write", never as a default value.
 *
 * The narrowing is intentional: modelling failure as a fifth
 * GovernanceState would contradict the frozen CHECK constraint.
 */
export type GovernanceDerivationResult =
  | { ok: true; state: GovernanceState; diagnostics: Diagnostic[] }
  | { ok: false; state: null; diagnostics: Diagnostic[] };

/** Delivery result. Never fails — every attempt log yields a state. */
export type DeliveryDerivationResult = {
  ok: true;
  state: DeliveryState;
  diagnostics: Diagnostic[];
};

// ---------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------

/** Type guard, so that filtering a nullable field narrows it to string. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

/** Normalize a nullable identity column for a Diagnostic field. */
function eventIdOf(event: GovernanceEventInput): number | undefined {
  return event.event_id ?? undefined;
}

/**
 * Deterministic order for diagnostics.
 *
 * Spec §1.1 makes event_id the authoritative order key, and §1.2
 * notes it is not guaranteed to equal commit order — but that
 * ambiguity affects only which record was written last, never which
 * state is derived. Sorting by event_id anyway keeps the diagnostic
 * list stable for identical inputs (spec §6).
 */
function byEventId(a: GovernanceEventInput, b: GovernanceEventInput): number {
  return (a.event_id ?? 0) - (b.event_id ?? 0);
}

function byAttemptId(a: DeliveryAttemptInput, b: DeliveryAttemptInput): number {
  return (a.attempt_id ?? 0) - (b.attempt_id ?? 0);
}

/**
 * Spec §2 — decide whether an event participates.
 *
 * An event participates only if ALL hold:
 *   1. decision is 'approved' or 'withdrawn'
 *   2. approver_id is non-empty
 *   3. approval_ref is non-empty
 *   4. 'approved' implies approver_type is HUMAN or AI_REVIEW
 *
 * Excluded events do not affect the outcome but ARE reported.
 */
function classifyEvent(
  event: GovernanceEventInput,
): { participates: boolean; diagnostic?: Diagnostic } {
  const id = eventIdOf(event);
  const decision = event.decision;

  const exclude = (code: DiagnosticCode, message: string): Diagnostic => ({
    code,
    message,
    ...(id === undefined ? {} : { event_id: id }),
  });

  if (decision !== "approved" && decision !== "withdrawn") {
    // Covers 'rejected' and 'exception_granted' by name, and any
    // unexpected value the CHECK constraint would normally stop.
    return {
      participates: false,
      diagnostic: exclude(
        isNonEmptyString(decision) &&
          decision !== "rejected" &&
          decision !== "exception_granted"
          ? "EXCLUDED_UNKNOWN_DECISION"
          : "EXCLUDED_DECISION",
        `decision '${String(decision)}' does not participate (spec §2; only 'approved' and 'withdrawn' do)`,
      ),
    };
  }

  if (!isNonEmptyString(event.approver_id)) {
    return {
      participates: false,
      diagnostic: exclude(
        "EXCLUDED_MISSING_APPROVER_ID",
        "approver_id is empty; an unnamed approver cannot authorise",
      ),
    };
  }

  if (!isNonEmptyString(event.approval_ref)) {
    return {
      participates: false,
      diagnostic: exclude(
        "EXCLUDED_MISSING_APPROVAL_REF",
        "approval_ref is empty; an unauditable approval cannot authorise",
      ),
    };
  }

  if (decision === "approved" && event.approver_type !== "HUMAN" && event.approver_type !== "AI_REVIEW") {
    return {
      participates: false,
      diagnostic: exclude(
        "EXCLUDED_APPROVER_TYPE",
        `approver_type '${String(event.approver_type)}' never authorises (spec §2.3)`,
      ),
    };
  }

  return { participates: true };
}

// ---------------------------------------------------------------
// 1. governance_state  (spec §3)
// ---------------------------------------------------------------

/**
 * Derive `governance_state` from the governance event log.
 *
 * Precedence (spec §3.1), in order:
 *   1. WITHDRAWN — terminal, evaluated FIRST
 *   2. contradiction across participating approved events → fails
 *   3. highest achieved approval level
 *   4. DRAFT
 *
 * Steps 1 and 2 are mutually exclusive: a withdrawn record short
 * circuits, so the same history that would fail step 2 returns
 * WITHDRAWN instead. This is intentional and is pinned by the
 * withdrawal-overrides-contradiction case.
 *
 * NEVER throws. Every rejection of the input is reported through
 * `diagnostics`; the only non-ok return is the contradiction.
 *
 * Pure: reads `events`, allocates nothing external, writes nothing.
 */
export function deriveGovernanceState(
  events: readonly GovernanceEventInput[],
): GovernanceDerivationResult {
  if (!Array.isArray(events)) {
    return {
      ok: false,
      state: null,
      diagnostics: [
        {
          code: "INVALID_INPUT",
          message: "events must be an array; derivation cannot proceed",
        },
      ],
    };
  }

  const ordered = [...events].sort(byEventId);
  const diagnostics: Diagnostic[] = [];

  const participating: GovernanceEventInput[] = [];

  for (const event of ordered) {
    const { participates, diagnostic } = classifyEvent(event);
    if (participates) {
      participating.push(event);
    } else if (diagnostic) {
      diagnostics.push(diagnostic);
    }
  }

  const withdrawals = participating.filter((e) => e.decision === "withdrawn");
  const approvals = participating.filter((e) => e.decision === "approved");

  // -- Step 1: WITHDRAWN, terminal, evaluated first (spec §3.3) ---
  if (withdrawals.length > 0) {
    diagnostics.push({
      code: "WITHDRAWN_TERMINAL",
      message:
        "A withdrawal exists. Derivation is WITHDRAWN and no later approval restores it (spec §3.3).",
      ...(eventIdOf(withdrawals[0]) === undefined
        ? {}
        : { event_id: eventIdOf(withdrawals[0]) }),
    });

    // Contradiction is NOT evaluated past this point, but the
    // suppressed condition is reported rather than hidden, so an
    // operator can still see that the history is also ambiguous.
    const fingerprints = distinctFingerprints(approvals);
    if (fingerprints.length > 1) {
      diagnostics.push({
        code: "CONTRADICTION_SUPPRESSED_BY_WITHDRAWAL",
        message:
          "Conflicting approved fingerprints exist but were not evaluated: withdrawal is terminal and a withdrawn record cannot be distributed (spec §3.1, §3.3).",
        detail: { content_fingerprints: fingerprints },
      });
    }

    return { ok: true, state: "WITHDRAWN", diagnostics };
  }

  // -- Step 2: contradiction (spec §3.2) ---
  const fingerprints = distinctFingerprints(approvals);

  if (fingerprints.length > 1) {
    diagnostics.push({
      code: "CONTRADICTORY_FINGERPRINTS",
      message:
        "Two or more different contents were approved for this record. The derivation fails; selecting the latest event is forbidden (spec §3.2).",
      detail: { content_fingerprints: fingerprints },
    });

    // ok: false — no state produced. Callers must refuse
    // distribution and leave any stored governance_state unchanged.
    return { ok: false, state: null, diagnostics };
  }

  // Spec §3.5: unresolved. A single fingerprint approved against
  // differing registry_commit values is NOT a contradiction under
  // this document, but it is an open question and is surfaced
  // rather than decided here.
  const commits = [
    ...new Set(
      approvals
        .map((e) => e.registry_commit)
        .filter(isNonEmptyString),
    ),
  ];
  if (fingerprints.length === 1 && commits.length > 1) {
    diagnostics.push({
      code: "REGISTRY_COMMIT_SPLIT",
      message:
        "One content fingerprint was approved against more than one registry_commit. Unresolved by the spec (§3.5); reported, not decided. Not treated as a contradiction.",
      detail: { registry_commits: commits },
    });
  }

  // -- Step 3: highest achieved approval level (spec §3.4) ---
  // Monotonic: the highest level ever validly reached is kept, so
  // a later AI_REVIEW event can never downgrade a HUMAN_APPROVED
  // record.
  const humanApproved = approvals.some((e) => e.approver_type === "HUMAN");
  const aiReviewed = approvals.some((e) => e.approver_type === "AI_REVIEW");

  if (humanApproved) {
    return { ok: true, state: "HUMAN_APPROVED", diagnostics };
  }
  if (aiReviewed) {
    return { ok: true, state: "AI_REVIEWED", diagnostics };
  }

  // -- Step 4: default (spec §3.4) ---
  // Missing approval history is not an error; it is the expected
  // state of an unapproved record (spec §5).
  return { ok: true, state: "DRAFT", diagnostics };
}

/** Distinct non-empty fingerprints, sorted for deterministic output. */
function distinctFingerprints(
  approvals: readonly GovernanceEventInput[],
): string[] {
  return [
    ...new Set(
      approvals
        .map((e) => e.content_fingerprint)
        .filter(isNonEmptyString),
    ),
  ].sort();
}

// ---------------------------------------------------------------
// 2. delivery_state  (spec §4)
// ---------------------------------------------------------------

/**
 * Derive `delivery_state` from the delivery attempt log.
 *
 * Precedence (spec §4.1):
 *   1. no attempt                                   → NOT_ATTEMPTED
 *   2. any attempt with reconciliation_required      → IN_FLIGHT
 *   3. any SUCCEEDED                                → PUBLISHED
 *   4. any IN_FLIGHT                                → IN_FLIGHT
 *   5. otherwise                                    → FAILED
 *
 * Step 2 precedes step 3 deliberately: an unresolved outcome must
 * not be masked by an earlier success. Until a human determines
 * what happened, the record is not PUBLISHED.
 *
 * SKIPPED is neither success nor failure and is never returned as
 * a state — see the limitation recorded below.
 *
 * NEVER throws, and never fails: every attempt log yields a state.
 */
export function deriveDeliveryState(
  attempts: readonly DeliveryAttemptInput[],
): DeliveryDerivationResult {
  if (!Array.isArray(attempts)) {
    return {
      ok: true,
      state: "NOT_ATTEMPTED",
      diagnostics: [
        {
          code: "INVALID_INPUT",
          message: "attempts must be an array; treating as no attempts",
        },
      ],
    };
  }

  const ordered = [...attempts].sort(byAttemptId);
  const diagnostics: Diagnostic[] = [];

  if (ordered.length === 0) {
    return { ok: true, state: "NOT_ATTEMPTED", diagnostics };
  }

  for (const attempt of ordered) {
    // Recorded so the SKIPPED fact survives into diagnostics, since
    // the derived state cannot carry it.
    if (attempt.status === "SKIPPED") {
      diagnostics.push({
        code: "ATTEMPT_SKIPPED",
        message:
          "Attempt was SKIPPED (deliberate non-delivery). It is not a success and not a failure; the derived state cannot express this (spec §4.2).",
        ...(attempt.attempt_id == null
          ? {}
          : { attempt_id: attempt.attempt_id }),
      });
    }
  }

  // -- Step 2: reconciliation outranks everything below (spec §4.1)
  const uncertain = ordered.filter((a) => a.reconciliation_required === true);
  if (uncertain.length > 0) {
    diagnostics.push({
      code: "RECONCILIATION_REQUIRED",
      message:
        "At least one attempt has an unresolved outcome. The delivery is not confirmed PUBLISHED, even if an earlier attempt succeeded (spec §4.1 step 2).",
      detail: {
        attempt_ids: uncertain
          .map((a) => a.attempt_id)
          .filter((id): id is number => typeof id === "number")
          .map(String),
      },
    });
    return { ok: true, state: "IN_FLIGHT", diagnostics };
  }

  // -- Step 3: any success is sufficient (spec §4.1)
  if (ordered.some((a) => a.status === "SUCCEEDED")) {
    return { ok: true, state: "PUBLISHED", diagnostics };
  }

  // -- Step 4: any in-progress attempt (spec §4.1)
  if (ordered.some((a) => a.status === "IN_FLIGHT")) {
    return { ok: true, state: "IN_FLIGHT", diagnostics };
  }

  // -- Step 5: otherwise FAILED (spec §4.1)
  //
  // KNOWN LIMITATION (spec §4.2). FAILED conflates two different
  // realities — the platform rejected the post, and delivery was
  // deliberately not attempted (SKIPPED). The delivery_state enum
  // has no value that separates them, so both derive FAILED. The
  // distinction survives only in the attempt log, via status =
  // SKIPPED and the ATTEMPT_SKIPPED diagnostic above.
  //
  // Any surface that reports only delivery_state = FAILED is
  // therefore misleading for a skipped record. Resolving this
  // requires a schema change and is out of scope.
  return { ok: true, state: "FAILED", diagnostics };
}