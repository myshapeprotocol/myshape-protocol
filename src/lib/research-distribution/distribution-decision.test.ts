// ============================================================
// Contract tests for the distribution decision composer.
//
// Test IDs U-01 … U-08 are those of
// RESEARCH-DISTRIBUTION-DECISION-TEST-MATRIX.md, so a matrix row
// and a test here can be checked against each other by eye.
//
// Every case composes the REAL derivation and the REAL gate. Nothing
// is stubbed: if an upstream rule changes, these tests change with
// it, which is the point — the composer must track the frozen
// contracts rather than restate them.
//
// No database, no Registry, no platform, no network, no clock.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  deriveGovernanceState,
  deriveDeliveryState,
  type DeliveryAttemptInput,
  type Diagnostic,
  type GovernanceDerivationResult,
  type GovernanceEventInput,
} from "./derivation";
import { canDistribute, type GateReason } from "./governance-gate";
import type { ApprovalFreshness } from "./approval-freshness";
import {
  composeDistributionDecision,
  isRetryBlocked,
  type DistributionDecision,
} from "./distribution-decision";

// ---------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------

const FP_A = "a".repeat(64);
const FP_B = "b".repeat(64);
const FP_C = "c".repeat(64);

function approval(
  event_id: number,
  approver_type: "HUMAN" | "AI_REVIEW" | "SYSTEM" = "HUMAN",
  fingerprint = FP_A,
): GovernanceEventInput {
  return {
    event_id,
    decision: "approved",
    approver_type,
    approver_id: "operator-1",
    approval_ref: `ref-${event_id}`,
    content_fingerprint: fingerprint,
    registry_commit: "abc1234",
  };
}

function withdrawal(event_id: number): GovernanceEventInput {
  return { ...approval(event_id), decision: "withdrawn" };
}

function rejection(event_id: number): GovernanceEventInput {
  return { ...approval(event_id), decision: "rejected" };
}

function exception(event_id: number): GovernanceEventInput {
  return { ...approval(event_id), decision: "exception_granted", reason: "ok" };
}

function attempt(
  attempt_id: number,
  status: DeliveryAttemptInput["status"],
  reconciliation_required = false,
): DeliveryAttemptInput {
  return { attempt_id, status, reconciliation_required };
}

/**
 * A proven-fresh approval-freshness verdict (spec §3.5).
 *
 * REQUIRED by `canDistribute()`. These tests exercise the composer,
 * not provenance, so the anchor matches the `approval()` fixture.
 */
const FRESH: ApprovalFreshness = {
  ok: true,
  fresh: true,
  registry_commit: "abc1234",
  event_commits: ["abc1234"],
};

/**
 * The full pipeline, exactly as a service would call it.
 *
 * Composed through the real upstream functions so no test can pass
 * by hand-building a result that the engine would never produce.
 *
 * `canDistribute()` requires a freshness verdict (spec §3.5). These
 * fixtures assert composer behaviour, not staleness, so they pass a
 * proven-fresh verdict that matches the `approval()` fixture's
 * `registry_commit` of "abc1234". Provenance behaviour itself is
 * covered in governance-gate.test.ts.
 */
function decide(
  events: GovernanceEventInput[],
  attempts?: DeliveryAttemptInput[],
): DistributionDecision {
  const derivation = deriveGovernanceState(events);
  const gate = canDistribute(derivation, FRESH);
  return composeDistributionDecision(
    derivation,
    gate,
    attempts === undefined ? undefined : deriveDeliveryState(attempts),
  );
}

const codes = (list: readonly { code: string }[]): string[] =>
  list.map((d) => d.code);

// ---------------------------------------------------------------
// U-01 … U-05 — governance outcomes
// ---------------------------------------------------------------

describe("composeDistributionDecision — U-01 … U-05", () => {
  // U-01 — the ONLY allow case. An over-restrictive composer is
  // safe but useless; if it denied here, nothing could ever ship.
  it("U-01: HUMAN_APPROVED with no attempts allows distribution", () => {
    const decision = decide([approval(1)], []);
    expect(decision.allowed).toBe(true);
    expect(decision.governance).toEqual({ ok: true, state: "HUMAN_APPROVED" });
    expect(decision.reasons).toEqual([]);
    // NOT_ATTEMPTED is a normal pre-delivery state, not a blocker.
    expect(decision.delivery).toEqual({ state: "NOT_ATTEMPTED" });
    expect(isRetryBlocked(decision)).toBe(false);
  });

  // Delivery input is optional; omitting it must yield null rather
  // than a fabricated state.
  it("U-01b: omitting delivery yields a null delivery provenance", () => {
    const decision = decide([approval(1)]);
    expect(decision.delivery).toBeNull();
    expect(decision.allowed).toBe(true);
  });

  // U-02 — the locked decision. AI_REVIEWED must never authorise.
  it("U-02: AI_REVIEWED is denied with the gate's own reason", () => {
    const decision = decide([approval(1, "AI_REVIEW")], []);
    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toEqual(["HUMAN_APPROVAL_REQUIRED"]);
    expect(decision.governance.state).toBe("AI_REVIEWED");
  });

  // The reason must be propagated, not replaced by a generic denial.
  it("U-02b: the gate reason is forwarded verbatim", () => {
    const reasons = decide([approval(1, "AI_REVIEW")]).reasons;
    const legal: GateReason[] = [
      "DERIVATION_FAILED",
      "NOT_APPROVED",
      "HUMAN_APPROVAL_REQUIRED",
      "WITHDRAWN_TERMINAL",
    ];
    expect(reasons).toHaveLength(1);
    expect(legal).toContain(reasons[0]);
  });

  // U-03
  it("U-03: a withdrawn record is denied as terminal", () => {
    const decision = decide([approval(1), withdrawal(2)], []);
    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toEqual(["WITHDRAWN_TERMINAL"]);
  });

  // U-03b — withdrawal is terminal through the composer too.
  it("U-03b: an approval after withdrawal does not restore the record", () => {
    const decision = decide([approval(1), withdrawal(2), approval(3)], []);
    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toEqual(["WITHDRAWN_TERMINAL"]);
  });

  // U-03c — withdrawal precedes contradiction, so the terminal reason
  // is reported, not DERIVATION_FAILED. The composer must not reach
  // back around the gate and re-derive.
  it("U-03c: a suppressed contradiction reports the terminal reason", () => {
    const decision = decide(
      [withdrawal(1), approval(2, "HUMAN", FP_A), approval(3, "HUMAN", FP_B)],
      [],
    );
    expect(decision.governance.state).toBe("WITHDRAWN");
    expect(decision.reasons).toEqual(["WITHDRAWN_TERMINAL"]);
    // The suppressed conflict remains visible as provenance.
    expect(codes(decision.diagnostics)).toContain(
      "CONTRADICTION_SUPPRESSED_BY_WITHDRAWAL",
    );
  });

  // U-04 — the case most likely to be implemented wrongly. Nothing
  // was decided, so nothing is permitted.
  it("U-04: a derivation failure is denied as DERIVATION_FAILED", () => {
    const decision = decide(
      [approval(1, "HUMAN", FP_A), approval(2, "HUMAN", FP_B)],
      [],
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toEqual(["DERIVATION_FAILED"]);
    // state is null — the composer must not substitute a default.
    expect(decision.governance).toEqual({ ok: false, state: null });
    expect(codes(decision.diagnostics)).toContain("CONTRADICTORY_FINGERPRINTS");
  });

  // U-04b — "nothing was decided" is not "decided it is not approved".
  it("U-04b: a failed derivation is not reported as NOT_APPROVED", () => {
    const { reasons } = decide([
      approval(1, "HUMAN", FP_A),
      approval(2, "HUMAN", FP_B),
    ]);
    expect(reasons).not.toContain("NOT_APPROVED");
    expect(reasons).toContain("DERIVATION_FAILED");
  });

  // U-05 — a rejection is not an approval.
  it("U-05: a rejected-only history is denied as NOT_APPROVED", () => {
    const decision = decide([rejection(1)], []);
    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toEqual(["NOT_APPROVED"]);
    expect(decision.governance.state).toBe("DRAFT");
  });

  // U-05b … U-05f — the remaining DRAFT histories, each of which a
  // naive implementation is most likely to let through.
  it("U-05b: an empty history is denied", () => {
    expect(decide([], []).reasons).toEqual(["NOT_APPROVED"]);
  });

  it("U-05c: an exception is not an approval", () => {
    expect(decide([exception(1)], []).allowed).toBe(false);
  });

  // U-05d / U-05e — full decision and approver type, failing ONLY
  // on identity completeness. An implementation checking `decision`
  // but not identity would allow these.
  it("U-05d: an approval with empty approver_id is denied", () => {
    const decision = decide([{ ...approval(1), approver_id: "" }], []);
    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toEqual(["NOT_APPROVED"]);
    expect(codes(decision.diagnostics)).toContain("EXCLUDED_MISSING_APPROVER_ID");
  });

  it("U-05e: an approval with empty approval_ref is denied", () => {
    const decision = decide([{ ...approval(1), approval_ref: "" }], []);
    expect(decision.allowed).toBe(false);
    expect(codes(decision.diagnostics)).toContain("EXCLUDED_MISSING_APPROVAL_REF");
  });

  it("U-05f: a SYSTEM approval is denied", () => {
    const decision = decide([approval(1, "SYSTEM")], []);
    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toEqual(["NOT_APPROVED"]);
  });
});

// ---------------------------------------------------------------
// U-06 — delivery uncertainty (option C: reported, not enforced)
// ---------------------------------------------------------------

describe("composeDistributionDecision — U-06", () => {
  // Under option C the composer does NOT convert a delivery problem
  // into a governance refusal. The governance verdict stands; the
  // delivery state travels alongside for a caller to act on.
  it("U-06: delivery uncertainty is reported but does not deny governance", () => {
    const decision = decide(
      [approval(1)],
      [attempt(1, "FAILED", true)],
    );
    // Governance allowed it — the record is properly approved.
    expect(decision.governance.state).toBe("HUMAN_APPROVED");
    expect(decision.allowed).toBe(true);
    expect(decision.reasons).toEqual([]);

    // The uncertainty is visible as provenance.
    expect(decision.delivery).toEqual({ state: "IN_FLIGHT" });
    expect(codes(decision.diagnostics)).toContain("RECONCILIATION_REQUIRED");

    // And a caller enforcing contract §7.3 can see the retry ban.
    expect(isRetryBlocked(decision)).toBe(true);
  });

  // The separation matters: allowed answers "may governance
  // authorise?", isRetryBlocked answers "may we retry?". Collapsing
  // them would misattribute a delivery fault to governance.
  it("U-06b: the retry block is a separate question from allowed", () => {
    const decision = decide([approval(1)], [attempt(1, "FAILED", true)]);
    expect(decision.allowed).toBe(true);
    expect(isRetryBlocked(decision)).toBe(true);
  });

  // Every non-IN_FLIGHT delivery state must leave retry permitted,
  // including a completed failure that needs no reconciliation.
  it("U-06c: only IN_FLIGHT blocks a retry", () => {
    const cases: [DeliveryAttemptInput[], boolean][] = [
      [[], false],
      [[attempt(1, "SUCCEEDED")], false],
      [[attempt(1, "FAILED")], false],
      [[attempt(1, "SKIPPED")], false],
      [[attempt(1, "IN_FLIGHT")], true],
      [[attempt(1, "FAILED", true)], true],
      [[attempt(1, "SUCCEEDED"), attempt(2, "FAILED", true)], true],
    ];
    for (const [attempts, expectedBlocked] of cases) {
      expect(isRetryBlocked(decide([approval(1)], attempts))).toBe(expectedBlocked);
    }
  });

  // With no delivery input at all there is nothing to block.
  it("U-06d: an absent delivery result blocks nothing", () => {
    expect(isRetryBlocked(decide([approval(1)]))).toBe(false);
  });
});

// ---------------------------------------------------------------
// U-07 — determinism
// ---------------------------------------------------------------

describe("composeDistributionDecision — U-07", () => {
  // U-07a — repeated evaluation is byte-identical.
  it("U-07a: repeated composition is identical", () => {
    const cases: [GovernanceEventInput[], DeliveryAttemptInput[]][] = [
      [[approval(1)], []],
      [[approval(1, "AI_REVIEW")], []],
      [[approval(1), withdrawal(2)], []],
      [[approval(1, "HUMAN", FP_A), approval(2, "HUMAN", FP_B)], []],
      [[approval(1)], [attempt(1, "SUCCEEDED")]],
      [[approval(1)], [attempt(1, "FAILED", true)]],
    ];
    for (const [events, attempts] of cases) {
      const first = JSON.stringify(decide(events, attempts));
      for (let i = 0; i < 5; i += 1) {
        expect(JSON.stringify(decide(events, attempts))).toBe(first);
      }
    }
  });

  // U-07b — permuting the input logs yields the same decision. The
  // derivation already sorts by identity; the composer must not
  // reintroduce order sensitivity.
  it("U-07b: permuting the logs yields the same decision", () => {
    const events = [
      approval(1, "AI_REVIEW"),
      approval(2),
      rejection(3),
    ];
    const attempts = [attempt(1, "FAILED"), attempt(2, "SUCCEEDED")];

    const forward = decide(events, attempts);
    const reversed = decide([...events].reverse(), [...attempts].reverse());
    expect(reversed.allowed).toBe(forward.allowed);
    expect(reversed.governance.state).toBe(forward.governance.state);
    expect(reversed.delivery).toEqual(forward.delivery);
    expect(reversed.reasons).toEqual(forward.reasons);
  });

  // U-07c — the decision must not hold a reference to the caller's
  // arrays, so later mutation of those arrays cannot retroactively
  // change a verdict that has already been returned.
  it("U-07c: the decision holds no reference to the input arrays", () => {
    const events = [approval(1, "AI_REVIEW")];
    const decision = decide(events, []);
    const snapshot = JSON.stringify(decision);

    events.push(approval(2));
    expect(JSON.stringify(decision)).toBe(snapshot);
  });

  // U-07d — reasons and diagnostics are copied, not aliased.
  it("U-07d: reasons and diagnostics are copies", () => {
    const derivation = deriveGovernanceState([approval(1, "AI_REVIEW")]);
    const gate = canDistribute(derivation, FRESH);
    const decision = composeDistributionDecision(derivation, gate);

    decision.reasons.length = 0;
    decision.diagnostics.length = 0;
    expect(gate.reasons.length).toBe(1);
    expect(derivation.diagnostics.length).toBe(0);
  });
});

// ---------------------------------------------------------------
// U-08 — purity, and the narrowing invariant
// ---------------------------------------------------------------

describe("composeDistributionDecision — U-08", () => {
  // U-08a — inputs are never mutated.
  it("U-08a: composition does not mutate its inputs", () => {
    const events = [approval(1, "AI_REVIEW"), rejection(2)];
    const attempts = [attempt(1, "FAILED")];
    const derivation = deriveGovernanceState(events);
    const gate = canDistribute(derivation, FRESH);
    const delivery = deriveDeliveryState(attempts);

    const snapshot = JSON.stringify({
      events,
      attempts,
      derivation,
      gate,
      delivery,
    });
    composeDistributionDecision(derivation, gate, delivery);
    expect(
      JSON.stringify({ events, attempts, derivation, gate, delivery }),
    ).toBe(snapshot);
  });

  // U-08b — the central safety invariant, swept across a broad grid
  // of histories and attempt logs:
  //
  //     final.allowed  ≤  gate.allowed
  //
  // The composer may narrow but never widen. If this fails, some
  // input granted permission that governance never did.
  it("U-08b: allowed never exceeds the gate's own verdict", () => {
    const histories: GovernanceEventInput[][] = [
      [],
      [rejection(1)],
      [exception(1)],
      [approval(1, "AI_REVIEW")],
      [approval(1, "SYSTEM")],
      [approval(1)],
      [{ ...approval(1), approver_id: "" }],
      [{ ...approval(1), approval_ref: "" }],
      [approval(1), withdrawal(2)],
      [approval(1), withdrawal(2), approval(3)],
      [withdrawal(1), approval(2, "HUMAN", FP_A), approval(3, "HUMAN", FP_B)],
      [approval(1, "HUMAN", FP_A), approval(2, "HUMAN", FP_B)],
      [approval(1, "AI_REVIEW"), approval(2, "HUMAN", FP_B)],
      [approval(1, "AI_REVIEW"), approval(2)],
      [{ ...withdrawal(1), content_fingerprint: FP_C }, approval(2)],
    ];
    const attemptLogs: (DeliveryAttemptInput[] | undefined)[] = [
      undefined,
      [],
      [attempt(1, "SUCCEEDED")],
      [attempt(1, "IN_FLIGHT")],
      [attempt(1, "FAILED")],
      [attempt(1, "SKIPPED")],
      [attempt(1, "FAILED", true)],
      [attempt(1, "SUCCEEDED"), attempt(2, "FAILED", true)],
    ];

    for (const events of histories) {
      for (const attempts of attemptLogs) {
        const derivation = deriveGovernanceState(events);
        const gate = canDistribute(derivation, FRESH);
        const decision = composeDistributionDecision(
          derivation,
          gate,
          attempts === undefined ? undefined : deriveDeliveryState(attempts),
        );

        if (!gate.allowed) {
          expect(decision.allowed).toBe(false);
          expect(decision.reasons.length).toBeGreaterThan(0);
        }
      }
    }
  });

  // U-08c — allowed and reasons can never disagree.
  it("U-08c: allowed and reasons are always consistent", () => {
    const histories: GovernanceEventInput[][] = [
      [],
      [approval(1, "AI_REVIEW")],
      [approval(1)],
      [approval(1), withdrawal(2)],
      [approval(1, "HUMAN", FP_A), approval(2, "HUMAN", FP_B)],
    ];
    for (const events of histories) {
      const { allowed, reasons } = decide(events, []);
      if (allowed) {
        expect(reasons).toEqual([]);
      } else {
        expect(reasons.length).toBeGreaterThan(0);
      }
    }
  });

  // U-08d — the composer reports no governance state the derivation
  // did not produce. This is what "does not duplicate governance
  // logic" means operationally.
  it("U-08d: governance state is forwarded, never recomputed", () => {
    const histories: GovernanceEventInput[][] = [
      [],
      [approval(1, "AI_REVIEW")],
      [approval(1)],
      [approval(1), withdrawal(2)],
      [approval(1, "HUMAN", FP_A), approval(2, "HUMAN", FP_B)],
    ];
    for (const events of histories) {
      const derivation = deriveGovernanceState(events);
      const decision = decide(events, []);
      expect(decision.governance.state).toBe(derivation.state);
      expect(decision.governance.ok).toBe(derivation.ok);
    }
  });

  // U-08e — the composer never invents a governance state. The union
  // is closed at four values plus null.
  it("U-08e: no invented governance state can appear", () => {
    const legal = [
      "DRAFT",
      "AI_REVIEWED",
      "HUMAN_APPROVED",
      "WITHDRAWN",
    ];
    const histories: GovernanceEventInput[][] = [
      [],
      [approval(1, "AI_REVIEW")],
      [approval(1)],
      [approval(1), withdrawal(2)],
    ];
    for (const events of histories) {
      const { state } = decide(events, []).governance;
      expect(state === null || legal).toContain(state);
    }
  });

  // U-08f — the composer emits no reason code the gate did not
  // produce. Guards against the fork this module must never make.
  it("U-08f: every reason came from the gate", () => {
    const legal: GateReason[] = [
      "DERIVATION_FAILED",
      "NOT_APPROVED",
      "HUMAN_APPROVAL_REQUIRED",
      "WITHDRAWN_TERMINAL",
    ];
    const histories: GovernanceEventInput[][] = [
      [],
      [approval(1, "AI_REVIEW")],
      [approval(1)],
      [approval(1), withdrawal(2)],
      [approval(1, "HUMAN", FP_A), approval(2, "HUMAN", FP_B)],
    ];
    for (const events of histories) {
      const derivation = deriveGovernanceState(events);
      const gate = canDistribute(derivation, FRESH);
      const decision = composeDistributionDecision(derivation, gate);
      for (const reason of decision.reasons) {
        expect(legal).toContain(reason);
        expect(gate.reasons).toContain(reason);
      }
    }
  });

  // U-08g — an explicitly passed undefined delivery is treated as
  // absent, not as a fabricated default state.
  it("U-08g: an explicit undefined delivery is treated as absent", () => {
    const decision = decide([approval(1)], undefined);
    expect(decision.delivery).toBeNull();
    expect(decision.allowed).toBe(true);
  });
});