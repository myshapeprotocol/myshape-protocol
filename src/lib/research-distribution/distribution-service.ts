// ============================================================
// MyShape Protocol — Distribution Service (orchestration skeleton)
//
// Implements the SERVICE BOUNDARY described in
// RESEARCH-DISTRIBUTION-SERVICE-BOUNDARY.md §6.1, as far as a
// pure orchestration layer can.
//
// WHAT THIS IS
//
// A dependency-injected orchestrator. It loads governance inputs
// through an injected port, derives, gates, composes, and returns
// a typed outcome. That is the whole of it.
//
// WHAT THIS IS NOT
//
// It is not a repository, not an adapter, and not a client of
// anything. It knows no SQL, no URL, no credential, and no platform
// API. It cannot publish: on success it returns an INSTRUCTION, and
// something else — a future phase — acts on it. That separation is
// X-05, and it is why no adapter port exists here at all.
//
//   caller ──► service.request(input)
//
//            repository.loadDistribution()← injected, no SQL here
//            repository.loadEvents()      ← injected, no SQL here
//            repository.loadAttempts()    ← injected, no SQL here
//            checkApprovalFreshness()     ← pure module (§3.5)
//            deriveGovernanceState()      ← frozen pure module
//            canDistribute()              ← pure module
//            composeDistributionDecision()← frozen pure module
//            isRetryBlocked()             ← frozen pure module
//
//            ──► outcome { ALLOW | REFUSED | SKIPPED_RETRY_BLOCKED
//                          | UNKNOWN }
//
// X-01  The caller cannot supply a decision. `DistributionRequest`
//       has no field for one. The service derives internally, always.
// X-02  The caller cannot supply governance_state. It is not a
//       request field, and the service never reads it — even if a
//       repository returns it. See CACHE below.
// X-03  A reconciliation-blocked record yields its own outcome kind.
//       It is never reported as a governance refusal.
// X-04  Every indeterminate path — missing history, unusable
//       derivation, disagreement between reads, repository error —
//       yields a non-ALLOW outcome. The service cannot emit ALLOW
//       without a completed derivation and a matching re-read.
// X-05  No platform, no HTTP, no credential, no publish call.
//
// APPROVAL FRESHNESS (§3.5)
//
// The service also reads the distribution row, because it is the
// only record that knows WHICH Registry snapshot this decision is
// being made against. `checkApprovalFreshness()` compares that
// anchor against the commits named by the participating approvals,
// and the result reaches the gate as a reason.
//
// This is deliberately NOT part of the derivation. The derivation
// stays frozen and fingerprint-scoped (§3.2); freshness is an
// AUTHORISATION precondition, so a stale approval produces
// `STALE_APPROVAL_PROVENANCE` and a REFUSED outcome — not a
// contradiction, not an UNKNOWN, and never a fifth state.
//
// The distribution row is read on BOTH P5 passes, so an anchor that
// moves mid-flight is caught by `decisionsAgree`.
//
// THE CACHE IS NOT AUTHORITY
//
// Even if an injected repository returns a `governance_state` field
// on its rows, this service ignores it. Only the event history
// reaches the derivation. That is the application-side half of
// service-boundary §5; the database-side half remains open.
//
// FAIL CLOSED
//
// There is exactly one path to ALLOW: events loaded, derivation
// succeeded with HUMAN_APPROVED, gate allowed, no retry block, and
// the independent re-read agreed. Every other path terminates
// earlier. No default branch produces ALLOW.
//
// SCOPE LIMIT — READ THIS BEFORE IMPLEMENTING ON TOP
//
// Preconditions P1–P6 from the boundary document are implemented
// here. P7 (idempotency key), P8 (rendered-text fingerprint match)
// and P9 (adapter existence) are NOT, because each needs either a
// write, a renderer, or a registry — none of which belong in this
// layer. They are listed in `UNIMPLEMENTED_PRECONDITIONS` so the gap
// is explicit rather than assumed away.
// ============================================================

import {
  deriveGovernanceState,
  deriveDeliveryState,
  type DeliveryAttemptInput,
  type Diagnostic,
  type GovernanceDerivationResult,
  type GovernanceEventInput,
} from "./derivation";
import { canDistribute, type GateReason } from "./governance-gate";
import {
  checkApprovalFreshness,
  type DistributionProvenance,
} from "./approval-freshness";
import {
  composeDistributionDecision,
  isRetryBlocked,
  type DistributionDecision,
} from "./distribution-decision";

// ---------------------------------------------------------------
// Ports — the service's entire dependency surface
// ---------------------------------------------------------------

/**
 * Reads governance and delivery history.
 *
 * The service defines this interface and does NOT implement it. The
 * concrete implementation — the only place SQL appears — is a
 * later phase.
 *
 * Returning `null` means *history could not be read*. It is not an
 * empty log: `[]` is a readable log with no rows, `null` is the
 * absence of a reading. The service treats both differently, and
 * fails closed on `null`.
 */
export interface DistributionRepository {
  /**
   * The distribution row's provenance, or `null` if unreadable.
   *
   * Added for spec §3.5. The distribution record is the lifecycle
   * anchor: it is the only thing that knows which Registry snapshot
   * this distribution is being decided against. Without it the
   * freshness of an approval cannot be established.
   *
   * READ ONLY. This interface has no write method — W1 persistence is
   * a later phase, and adding one here would silently widen the
   * service's authority.
   */
  loadDistribution(
    distributionId: string,
  ): Promise<DistributionProvenance | null>;

  /** Governance events for a distribution, oldest first, or `null`. */
  loadEvents(distributionId: string): Promise<GovernanceEventInput[] | null>;

  /** Delivery attempts for a distribution, oldest first, or `null`. */
  loadAttempts(distributionId: string): Promise<DeliveryAttemptInput[] | null>;
}

// ---------------------------------------------------------------
// Request and outcome
// ---------------------------------------------------------------

/**
 * What the caller may supply.
 *
 * Deliberately minimal. There is no field for a precomputed
 * decision (X-01) and no field for `governance_state` (X-02). A
 * caller cannot authorise this call; it can only ask.
 */
export interface DistributionRequest {
  /** Identifies the distribution record to evaluate. */
  distributionId: string;
}

/** Why the service could not reach a decision. Never a governance reason. */
export type IndeterminateReason =
  | "REPOSITORY_ERROR"
  | "MISSING_DISTRIBUTION_HISTORY"
  | "MISSING_EVENT_HISTORY"
  | "MISSING_ATTEMPT_HISTORY"
  | "UNUSABLE_INPUT"
  | "RE_READ_DISAGREEMENT";

/**
 * The instruction emitted when every check passes.
 *
 * This is a description, not an action. Nothing in this module
 * performs it, and no field here carries a platform identifier, a
 * URL, or a credential.
 */
export interface DistributionInstruction {
  distributionId: string;
  governanceState: "HUMAN_APPROVED";
  decision: DistributionDecision;
}

export type DistributionOutcome =
  | { kind: "ALLOW"; instruction: DistributionInstruction }
  | { kind: "REFUSED"; reasons: GateReason[]; decision: DistributionDecision | null }
  | { kind: "SKIPPED_RETRY_BLOCKED"; decision: DistributionDecision }
  | {
      kind: "UNKNOWN";
      indeterminate: IndeterminateReason;
      detail: string;
      decision: DistributionDecision | null;
    };

/** Boundary §2, implemented here. P7–P9 are listed but not built. */
export const UNIMPLEMENTED_PRECONDITIONS = [
  "P7 idempotency key check",
  "P8 rendered-text fingerprint match",
  "P9 adapter existence",
] as const;

// ---------------------------------------------------------------
// Internals
// ---------------------------------------------------------------

/**
 * Drop any cache-shaped field a repository may have attached.
 *
 * X-02 in code rather than only in prose: even a repository that
 * helpfully returns `governance_state: 'HUMAN_APPROVED'` alongside
 * each row cannot influence the result, because the field is
 * removed before the derivation sees the row.
 */
function stripCacheFields(
  events: GovernanceEventInput[],
): GovernanceEventInput[] {
  return events.map((event) => {
    const { governance_state: _ignored, ...rest } = event as GovernanceEventInput & {
      governance_state?: unknown;
    };
    return rest;
  });
}

function isEventList(value: unknown): value is GovernanceEventInput[] {
  return Array.isArray(value);
}

function isAttemptList(value: unknown): value is DeliveryAttemptInput[] {
  return Array.isArray(value);
}

/**
 * A distribution read is usable when it is an object carrying an id.
 *
 * Deliberately permissive about `registry_commit`: a missing or
 * malformed anchor is NOT an unusable *read*, it is an unusable
 * *provenance value*, and `checkApprovalFreshness` fails closed on it
 * with `STALE_APPROVAL_PROVENANCE` — a governance refusal. Collapsing
 * the two here would report a governance problem as a read failure.
 */
function isProvenance(
  value: unknown,
): value is DistributionProvenance {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as DistributionProvenance).distribution_id === "string"
  );
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Load both logs, failing closed on anything unreadable.
 *
 * Returns a discriminated result rather than throwing, so the
 * caller cannot forget to handle the failure path.
 */
async function readHistory(
  repository: DistributionRepository,
  distributionId: string,
): Promise<
  | {
      ok: true;
      distribution: DistributionProvenance | null;
      events: GovernanceEventInput[];
      attempts: DeliveryAttemptInput[];
    }
  | { ok: false; indeterminate: IndeterminateReason; detail: string }
> {
  let rawDistribution: unknown;
  let rawEvents: unknown;
  let rawAttempts: unknown;

  try {
    rawDistribution = await repository.loadDistribution(distributionId);
    rawEvents = await repository.loadEvents(distributionId);
    rawAttempts = await repository.loadAttempts(distributionId);
  } catch (error) {
    return {
      ok: false,
      indeterminate: "REPOSITORY_ERROR",
      detail: describeError(error),
    };
  }

  // The distribution row is read on BOTH passes, not just the first.
  // P5 re-reads to catch a change made between the two reads; if the
  // anchor were only read once, a record whose registry_commit moved
  // mid-flight would compare a stale anchor against fresh events and
  // could reach ALLOW.
  //
  // `null` here means "not readable". It is NOT a record with no
  // provenance: an absent reading is an absence of evidence, and
  // absence of evidence does not authorise anything (X-04).
  if (rawDistribution === null || rawDistribution === undefined) {
    return {
      ok: false,
      indeterminate: "MISSING_DISTRIBUTION_HISTORY",
      detail: "repository returned no distribution record",
    };
  }

  // `null` means the history could not be read. This is NOT an
  // empty log, and it must never be treated as one: an absent
  // reading is an absence of evidence, and absence of evidence
  // does not authorise anything.
  if (rawEvents === null || rawEvents === undefined) {
    return {
      ok: false,
      indeterminate: "MISSING_EVENT_HISTORY",
      detail: "repository returned no event history",
    };
  }
  if (rawAttempts === null || rawAttempts === undefined) {
    return {
      ok: false,
      indeterminate: "MISSING_ATTEMPT_HISTORY",
      detail: "repository returned no attempt history",
    };
  }
  if (!isEventList(rawEvents) || !isAttemptList(rawAttempts)) {
    return {
      ok: false,
      indeterminate: "UNUSABLE_INPUT",
      detail: "repository returned a value that is not a list",
    };
  }

  if (!isProvenance(rawDistribution)) {
    return {
      ok: false,
      indeterminate: "UNUSABLE_INPUT",
      detail: "repository returned a distribution record that is not provenance-shaped",
    };
  }

  return {
    ok: true,
    distribution: rawDistribution,
    events: rawEvents,
    attempts: rawAttempts,
  };
}

/**
 * Run the frozen pipeline over one set of logs.
 *
 * Shared by the initial evaluation and the re-read, so both go
 * through identical code. Two separate implementations could drift,
 * and the drift would be invisible.
 */
function evaluate(
  distribution: DistributionProvenance | null,
  events: GovernanceEventInput[],
  attempts: DeliveryAttemptInput[],
): DistributionDecision {
  // Spec §3.5, evaluated BEFORE the gate and independently of it.
  // The derivation is untouched: it still sees only events, and its
  // fingerprint-scoped contradiction model (§3.2) is unchanged.
  // Freshness is an authorisation precondition, not a state.
  const freshness = checkApprovalFreshness({ distribution, events });

  const governance: GovernanceDerivationResult = deriveGovernanceState(
    stripCacheFields(events),
  );
  const gate = canDistribute(governance, freshness);
  return composeDistributionDecision(
    governance,
    gate,
    deriveDeliveryState(attempts),
  );
}

/**
 * Two decisions agree when the verdict, reasons and states match.
 *
 * `reasons` comparison is what closes the provenance TOCTOU gap: a
 * stale anchor on one read and a fresh one on the other yields
 * different `reasons` (`STALE_APPROVAL_PROVENANCE` present or not),
 * so the two reads disagree and the service aborts. That holds
 * because the freshness verdict reaches the gate and therefore
 * reaches `DistributionDecision.reasons` — no separate provenance
 * field is needed here, and none was added.
 */
function decisionsAgree(a: DistributionDecision, b: DistributionDecision): boolean {
  return (
    a.allowed === b.allowed &&
    a.governance.state === b.governance.state &&
    a.governance.ok === b.governance.ok &&
    a.delivery?.state === b.delivery?.state &&
    JSON.stringify(a.reasons) === JSON.stringify(b.reasons)
  );
}
// ---------------------------------------------------------------
// The service
// ---------------------------------------------------------------

/**
 * Evaluate whether a distribution request may proceed.
 *
 * This function performs NO side effect. It reads, it computes, and
 * it returns an outcome. It does not write a row, open a
 * transaction, invoke an adapter, or contact a platform. A caller
 * receiving `ALLOW` receives a description of what would be
 * authorised, not an authorisation to act performed here.
 *
 * The sequence mirrors service-boundary §6.1 steps 1–5:
 *
 *   1–4  load, derive, gate, compose        → first decision
 *   5    re-read and re-derive (P5)         → second decision
 *         compare; disagreement fails closed
 *         retry block checked before ALLOW is emitted
 *
 * P5's re-read is the TOCTOU gate. Without it, an approval withdrawn
 * between the caller's read and this call would still authorise.
 *
 * Outcome mapping:
 *
 * | Situation | Outcome |
 * |---|---|
 * | Everything passes, retry not blocked | `ALLOW` + instruction |
 * | Governance denied | `REFUSED` + the gate's own reasons |
 * | An attempt needs reconciliation | `SKIPPED_RETRY_BLOCKED` |
 * | Unreadable history, or the two reads disagree | `UNKNOWN` |
 *
 * `REFUSED` and `SKIPPED_RETRY_BLOCKED` are distinct on purpose. One
 * says "not authorised"; the other says "authorised, but the last
 * delivery is unresolved". Collapsing them would send an operator
 * looking for a missing approval that is not missing (X-03).
 *
 * @param repository Injected history reader. Never implemented here.
 * @param request    Identifier only. Cannot carry a decision (X-01).
 */
export async function requestDistribution(
  repository: DistributionRepository,
  request: DistributionRequest,
): Promise<DistributionOutcome> {
  const { distributionId } = request;

  // -- Step 1: read history, failing closed on anything unreadable --
  const history = await readHistory(repository, distributionId);
  if (!history.ok) {
    return {
      kind: "UNKNOWN",
      indeterminate: history.indeterminate,
      detail: history.detail,
      decision: null,
    };
  }

  // -- Steps 2–4: derive, gate, compose --
  const decision = evaluate(history.distribution, history.events, history.attempts);

  // A derivation that failed produced no state. That is not a
  // governance refusal — it is an absence of one — so it surfaces
  // as UNKNOWN rather than REFUSED (X-04).
  if (!decision.governance.ok) {
    return {
      kind: "UNKNOWN",
      indeterminate: "UNUSABLE_INPUT",
      detail: "governance derivation failed; no state was produced",
      decision,
    };
  }

  // -- Step 5: re-read and re-derive (P5) --
  let reRead: Awaited<ReturnType<typeof readHistory>>;
  try {
    reRead = await readHistory(repository, distributionId);
  } catch (error) {
    return {
      kind: "UNKNOWN",
      indeterminate: "REPOSITORY_ERROR",
      detail: describeError(error),
      decision,
    };
  }

  if (!reRead.ok) {
    return {
      kind: "UNKNOWN",
      indeterminate: reRead.indeterminate,
      detail: reRead.detail,
      decision,
    };
  }

  // P5's re-read includes the distribution row, so an anchor that
  // moved between reads is caught by decisionsAgree (see above).
  const second = evaluate(
    reRead.distribution,
    reRead.events,
    reRead.attempts,
  );

  // Disagreement is an error, never a tie-break. Neither value is
  // preferred and the cache is never corrected.
  if (!decisionsAgree(decision, second)) {
    return {
      kind: "UNKNOWN",
      indeterminate: "RE_READ_DISAGREEMENT",
      detail:
        "re-read of the governance history produced a different decision; aborting",
      decision,
    };
  }

  // -- Governance refusal, propagated with its own reasons --
  if (!decision.allowed) {
    return { kind: "REFUSED", reasons: decision.reasons, decision };
  }

  // -- X-03: retry block, checked before ALLOW --
  // Ordered after the governance check so that a withdrawn record
  // reports WITHDRAWN_TERMINAL rather than a delivery condition:
  // the governance answer is the more fundamental one.
  if (isRetryBlocked(decision)) {
    return { kind: "SKIPPED_RETRY_BLOCKED", decision };
  }

  // -- The single ALLOW path --
  // Reached only after a completed derivation, an allowing gate, an
  // agreeing re-read, and no retry block. `governanceState` is
  // narrowed to the literal so a future state cannot widen it.
  return {
    kind: "ALLOW",
    instruction: {
      distributionId,
      governanceState: "HUMAN_APPROVED",
      decision,
    },
  };
}