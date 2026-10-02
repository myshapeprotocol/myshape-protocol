// ============================================================
// MyShape Protocol — Research Distribution governance gate
//
// The gate is a PURE AUTHORISATION PREDICATE. It answers exactly
// one question:
//
//   "Given an already-derived governance result, may distribution
//    proceed?"
//
// It does NOT decide whether distribution should happen. It only
// reports whether the governance precondition is satisfied.
//
// PIPELINE — the gate sits strictly downstream of derivation:
//
//   events ──► deriveGovernanceState() ──► canDistribute() ──► [future]
//     raw      pure, ordered, knows      pure, stateless       service
//     history  nothing about I/O         knows nothing but the
//                                        derivation result
//
// Two rules this file exists to enforce:
//
//   1. THE GATE NEVER DERIVES. It cannot compute a state; it has
//      no events, no ordering, no participation rules. It reads
//      `result.state` and nothing else.
//
//   2. THE GATE NEVER SILENTLY ALLOWS. Every denial carries a
//      machine-readable reason. A caller that ignores `reasons`
//      still gets `allowed: false`, never a quiet pass.
//
// SCOPE. This module knows nothing about databases, Registry
// files, platforms, or delivery attempts. It has no notion of a
// row, a timestamp, or a platform. Those concerns belong to the
// layers that do have them.
//
// WHY ONLY HUMAN_APPROVED
// The frozen schema CHECK
//   research_distribution_publish_requires_human_approval
// already forbids PUBLISHED without HUMAN_APPROVED. This gate is
// the application-side mirror of that constraint. The database
// rejects a bad write; this refuses to begin a bad action. Both
// are required — the constraint cannot stop an outbound request,
// and the gate cannot protect against a direct SQL write.
// ============================================================

// ---------------------------------------------------------------
// Input type
//
// Imported as a TYPE ONLY. TypeScript erases `import type` at
// compile time, so this creates no runtime dependency and no
// circular import risk — while still making the contract exact.
// If the derivation output shape changes, this file fails to
// compile rather than silently accepting the old shape.
// ---------------------------------------------------------------

import type {
  GovernanceDerivationResult,
  GovernanceState,
} from "./derivation";
import type { ApprovalFreshness } from "./approval-freshness";

/**
 * Why the gate refused.
 *
 * These are outcomes of a check, not states of a record. None of
 * them is ever persisted, and none of them may be written to
 * `governance_state` — that column has exactly four legal values
 * and is unrelated to authorisation outcomes.
 *
 * | Code | Meaning |
 * |---|---|
 * | `DERIVATION_FAILED` | the derivation produced no state (contradiction, or unusable input). Nothing was decided, so nothing is permitted. |
 * | `NOT_APPROVED` | `DRAFT` — the record was never approved. |
 * | `HUMAN_APPROVAL_REQUIRED` | `AI_REVIEWED` — machine review is an input to the human decision and can never substitute for it. |
 * | `WITHDRAWN_TERMINAL` | `WITHDRAWN` — terminal; no later approval restores it. |
 * | `STALE_APPROVAL_PROVENANCE` | The approval exists and the derivation reached `HUMAN_APPROVED`, but it names a **different Registry snapshot** than the distribution record it would authorise (spec §3.5). The record is real and the approval was genuine; it is simply not an approval *of this decision*. Re-approval against the current snapshot is required. |
 *
 * `STALE_APPROVAL_PROVENANCE` is an AUTHORISATION outcome, not a
 * derivation outcome. It never changes `governance_state` and never
 * becomes a fifth state: the column keeps its four legal values and
 * the database CHECK is untouched. A stale record still *derives*
 * `HUMAN_APPROVED` — it is simply not permitted to distribute on it.
 */
export type GateReason =
  | "DERIVATION_FAILED"
  | "NOT_APPROVED"
  | "HUMAN_APPROVAL_REQUIRED"
  | "WITHDRAWN_TERMINAL"
  | "STALE_APPROVAL_PROVENANCE";

export type GateResult = {
  allowed: boolean;
  reasons: GateReason[];
};

const DENY: Record<
  Exclude<GovernanceState, "HUMAN_APPROVED">,
  GateReason
> = {
  DRAFT: "NOT_APPROVED",
  AI_REVIEWED: "HUMAN_APPROVAL_REQUIRED",
  WITHDRAWN: "WITHDRAWN_TERMINAL",
};

// ---------------------------------------------------------------
// The gate
// ---------------------------------------------------------------

/**
 * Decide whether distribution may proceed, given a derived result.
 *
 * ALLOWS exactly one case: `ok === true && state === "HUMAN_APPROVED"`.
 *
 * DENIES everything else, always with a reason:
 *
 * | Input | `allowed` | `reasons` |
 * |---|---|---|
 * | `ok: false` (no state — contradiction) | `false` | `["DERIVATION_FAILED"]` |
 * | `DRAFT` | `false` | `["NOT_APPROVED"]` |
 * | `AI_REVIEWED` | `false` | `["HUMAN_APPROVAL_REQUIRED"]` |
 * | `WITHDRAWN` | `false` | `["WITHDRAWN_TERMINAL"]` |
 * | `HUMAN_APPROVED` | `true` | `[]` |
 *
 * Order matters: `ok === false` is checked FIRST. A failed
 * derivation reports no state at all, so there is nothing else to
 * reason about — and reporting `DERIVATION_FAILED` is the honest
 * answer, since "not approved" would imply a decision was reached.
 *
 * The ALLOW case returns `allowed: true` with an EMPTY `reasons`
 * array. `reasons` is a denial log, not an audit trail: an empty
 * array means no objection was raised, not that the record was
 * checked against every rule. Callers needing provenance should
 * read the derivation diagnostics.
 *
 * Deterministic and pure: same input → same output, no I/O, no
 * clock, no randomness, no mutation of the argument.
 *
 * @param result Output of `deriveGovernanceState()`. Must be a
 *   derivation result — the type makes it impossible to hand this
 *   function raw events.
 */
/**
 * Decide whether distribution may proceed, given a derived result.
 *
 * ALLOWS exactly one case: `ok === true && state === "HUMAN_APPROVED"`
 * AND the approval provenance is fresh.
 *
 * DENIES everything else, always with a reason:
 *
 * | Input | `allowed` | `reasons` |
 * |---|---|---|
 * | `ok: false` (no state — contradiction) | `false` | `["DERIVATION_FAILED"]` |
 * | `DRAFT` | `false` | `["NOT_APPROVED"]` |
 * | `AI_REVIEWED` | `false` | `["HUMAN_APPROVAL_REQUIRED"]` |
 * | `WITHDRAWN` | `false` | `["WITHDRAWN_TERMINAL"]` |
 * | `HUMAN_APPROVED`, provenance stale/unprovable | `false` | `["STALE_APPROVAL_PROVENANCE"]` |
 * | `HUMAN_APPROVED`, provenance fresh (or not supplied) | `true` | `[]` |
 *
 * Order matters: `ok === false` is checked FIRST. A failed
 * derivation reports no state at all, so there is nothing else to
 * reason about — and reporting `DERIVATION_FAILED` is the honest
 * answer, since "not approved" would imply a decision was reached.
 *
 * PROVENANCE (spec §3.5). `freshness` is OPTIONAL and defaults to
 * permitting. That default is deliberate and is the one place this
 * module trusts a caller: it exists so the existing single-argument
 * contract keeps working unchanged. The service always supplies it,
 * and it fails closed on every value except an explicit `fresh`.
 *
 * Provenance is checked AFTER the derivation, not before, so a
 * contradiction is still reported as a contradiction. A record that
 * is both contradictory and stale reports `DERIVATION_FAILED`: the
 * record has no governing state at all, which is the more
 * fundamental failure.
 *
 * The ALLOW case returns `allowed: true` with an EMPTY `reasons`
 * array. `reasons` is a denial log, not an audit trail: an empty
 * array means no objection was raised, not that the record was
 * checked against every rule. Callers needing provenance should
 * read the derivation diagnostics.
 *
 * Deterministic and pure: same input → same output, no I/O, no
 * clock, no randomness, no mutation of the argument.
 *
 * @param result Output of `deriveGovernanceState()`. Must be a
 *   derivation result — the type makes it impossible to hand this
 *   function raw events.
 * @param freshness Output of `checkApprovalFreshness()`. REQUIRED.
 *   There is no default and no bypass: a caller that cannot prove
 *   approval freshness cannot obtain an ALLOW, and omitting the
 *   argument is a COMPILE ERROR rather than a silently-permitted
 *   call. This is the one trust seam the §3.5 invariant depends on,
 *   so it is closed by the type system rather than by convention.
 */
export function canDistribute(
  result: GovernanceDerivationResult,
  freshness: ApprovalFreshness,
): GateResult {
  // A derivation that failed decided nothing. Nothing decided
  // means nothing permitted — fail closed.
  if (result.ok === false) {
    return { allowed: false, reasons: ["DERIVATION_FAILED"] };
  }

  // Provenance precondition (spec §3.5). Evaluated before the allow
  // case so a stale approval can never reach ALLOW, and it denies
  // for every value except an explicit, proven `fresh` — including
  // a rejected read, because an unprovable anchor is not a current
  // one.
  //
  // `freshness` is required, so there is no "not supplied" case to
  // handle. The verdict is consulted unconditionally.
  const stale = freshness.ok === false || freshness.fresh === false;
  if (stale) {
    return { allowed: false, reasons: ["STALE_APPROVAL_PROVENANCE"] };
  }

  // The single allow case.
  if (result.state === "HUMAN_APPROVED") {
    return { allowed: true, reasons: [] };
  }

  // Exhaustiveness guard: DENY is keyed by every other legal
  // state, so adding a state to GovernanceState without adding a
  // row here is a COMPILE ERROR rather than a silent default-deny
  // that hides a forgotten review.
  return { allowed: false, reasons: [DENY[result.state]] };
}