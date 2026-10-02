// ============================================================
// MyShape Protocol — Approval freshness (Registry provenance)
//
// Implements RESEARCH-DISTRIBUTION-DERIVATION-SPEC §3.5, which is
// a GOVERNANCE DECISION (closed) and not a derivation rule:
//
//   within one distribution_id, the distribution record and every
//   participating approval event MUST name the same registry_commit;
//   an approval naming a different one does not authorise the
//   current distribution decision, and re-approval is required.
//
// WHY THIS IS A SEPARATE MODULE
//
// §3.5 is an AUTHORISATION PRECONDITION, not part of the
// content/governance state machine. `deriveGovernanceState()` is
// frozen and takes only `GovernanceEventInput[]`; it has no way to
// observe `distribution.registry_commit`. Widening it would drag
// provenance into contradiction detection (§3.2), which is
// fingerprint-scoped by design.
//
// So the comparison lives here, is pure, and feeds the GATE — which
// already exists to answer "may distribution proceed?" — a reason it
// did not previously have.
//
// WHAT THIS IS NOT
//
//   * NOT a content contradiction. Two different fingerprints are a
//     contradiction (§3.2). The SAME fingerprint under a different
//     Registry snapshot is not.
//   * NOT a Registry validation. It never reads a file or Git. The
//     value's provenance is settled at §3.6 when it is recorded.
//   * NOT persistence. Writes nothing and knows no row.
//
// DETERMINISM / PURITY
//
// Same inputs -> same output. No I/O, no clock, no randomness, no
// mutation of arguments, type-only import.
// ============================================================

import type { GovernanceEventInput } from "./derivation";

// ---------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------

/**
 * The distribution row's provenance fields — the lifecycle anchor.
 *
 * Only `distribution_id` and `registry_commit` are read. This is the
 * read capability added for §3.5; the W1 writer is a later phase.
 */
export interface DistributionProvenance {
  distribution_id: string;
  registry_commit: string | null | undefined;
}

// ---------------------------------------------------------------
// Output
// ---------------------------------------------------------------

/**
 * Why freshness could not be established at all.
 *
 * These are NOT "stale". They mean the anchor was unreadable or
 * unusable, and the module fails closed rather than assuming the
 * approval is current.
 */
export type FreshnessRejection =
  | "MISSING_DISTRIBUTION"
  | "MALFORMED_DISTRIBUTION"
  | "MALFORMED_EVENT_PROVENANCE";

export type ApprovalFreshness =
  | {
      ok: true;
      /** True only when every participating approval names the anchor. */
      fresh: boolean;
      /** The lifecycle anchor that was compared against. */
      registry_commit: string;
      /** Distinct event commits observed, sorted, for diagnostics. */
      event_commits: string[];
      /** Present only when `fresh` is false. */
      stale?: {
        registry_commit: string;
        /** Events naming a commit other than the anchor. */
        event_ids: number[];
        /** The commits those events named, sorted. */
        mismatched_commits: string[];
      };
    }
  | { ok: false; reason: FreshnessRejection; detail: string };

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

/**
 * A usable commit SHA.
 *
 * Mirrors the database constraint
 * `research_distribution_registry_commit_hex`
 * (`^[0-9a-f]{7,40}$`), so a value this accepts is one the database
 * could have stored. Anything else is malformed and fails closed —
 * it is never silently coerced.
 */
function isCommitSha(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{7,40}$/.test(value);
}

/**
 * Does this event participate in governance, per spec §2?
 *
 * Deliberately the SAME predicate `deriveGovernanceState()` uses, so
 * the two layers judge the same set of events. A `rejected`,
 * `exception_granted` or `withdrawn` event carries no authorisation
 * and no freshness obligation; a `SYSTEM` approver never authorises.
 *
 * Mirrored rather than imported because `classifyEvent` is not
 * exported by the frozen derivation module. The duplication is
 * narrow, documented, and covered by tests.
 */
function participates(event: GovernanceEventInput): boolean {
  const { decision, approver_id, approval_ref, approver_type } = event;
  if (decision !== "approved") return false;
  if (typeof approver_id !== "string" || approver_id === "") return false;
  if (typeof approval_ref !== "string" || approval_ref === "") return false;
  return approver_type === "HUMAN" || approver_type === "AI_REVIEW";
}

// ---------------------------------------------------------------
// The check
// ---------------------------------------------------------------

/**
 * Decide whether the approval history still authorises THIS
 * distribution's Registry snapshot.
 *
 * Fails closed. The only non-stale outcomes are:
 *
 *   * every participating approval names the anchor  -> fresh
 *   * there are no participating approvals            -> fresh
 *     (an unapproved record is refused by the gate on its own
 *      merits; freshness has nothing to compare)
 *
 * Everything else — a missing row, an unusable anchor, an event
 * whose commit is absent or malformed — is a rejection, never a
 * pass. Absence of evidence does not authorise.
 *
 * Note what this does NOT do: it does not compare content
 * fingerprints and does not call them contradictory. A record can
 * be perfectly consistent in content and still be stale here.
 */
export function checkApprovalFreshness(
  input: ApprovalFreshnessInput,
): ApprovalFreshness {
  const { distribution, events } = input;

  if (distribution === null || distribution === undefined) {
    return {
      ok: false,
      reason: "MISSING_DISTRIBUTION",
      detail: "the distribution record could not be read; provenance is unknown",
    };
  }

  const anchor = distribution.registry_commit;
  if (!isCommitSha(anchor)) {
    return {
      ok: false,
      reason: "MALFORMED_DISTRIBUTION",
      detail:
        "the distribution record carries no usable registry_commit; provenance cannot be established",
    };
  }

  const approved = events.filter(participates);

  const seen = new Set<string>();
  const mismatched = new Set<string>();
  const staleIds: number[] = [];

  for (const event of approved) {
    const commit = event.registry_commit;

    // A participating approval with no usable commit cannot be shown
    // to match the anchor. That is a failure to prove freshness,
    // which is not proof of freshness.
    if (!isCommitSha(commit)) {
      return {
        ok: false,
        reason: "MALFORMED_EVENT_PROVENANCE",
        detail:
          "a participating approval event carries no usable registry_commit; the approval cannot be tied to the current Registry snapshot",
      };
    }

    seen.add(commit);

    if (commit !== anchor) {
      mismatched.add(commit);
      const id = event.event_id;
      if (typeof id === "number" && !staleIds.includes(id)) staleIds.push(id);
    }
  }

  const event_commits = [...seen].sort();

  if (mismatched.size > 0) {
    return {
      ok: true,
      fresh: false,
      registry_commit: anchor,
      event_commits,
      stale: {
        registry_commit: anchor,
        event_ids: [...staleIds].sort((a, b) => a - b),
        mismatched_commits: [...mismatched].sort(),
      },
    };
  }

  return {
    ok: true,
    fresh: true,
    registry_commit: anchor,
    event_commits,
  };
}

export interface ApprovalFreshnessInput {
  /** The distribution row, as read from storage. */
  distribution: DistributionProvenance | null | undefined;
  /** The participating approval events for that distribution. */
  events: readonly GovernanceEventInput[];
}
