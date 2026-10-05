// ============================================================
// Contract tests for the pure Research Distribution derivation.
//
// Source of truth: RESEARCH-DISTRIBUTION-STATE-TEST-MATRIX.md.
// Test IDs (G-*, D-*, X-*) below are that document's identifiers,
// so a matrix row and a test here can be checked against each
// other by eye.
//
// No database, no Supabase client, no Registry, no network, no
// clock, no filesystem. Both functions are pure, so every case is
// a plain in-memory input.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  deriveGovernanceState,
  deriveDeliveryState,
  type DeliveryAttemptInput,
  type DiagnosticCode,
  type GovernanceEventInput,
} from "./derivation";

// ---------------------------------------------------------------
// Fixtures
//
// All default to complete identity, matching matrix §1.1. Override
// only what a case is about.
// ---------------------------------------------------------------

const FP_A = "a".repeat(64);
const FP_B = "b".repeat(64);
const FP_C = "c".repeat(64);

function approved(
  event_id: number,
  approver_type: "HUMAN" | "AI_REVIEW" | "SYSTEM" = "HUMAN",
  content_fingerprint: string = FP_A,
): GovernanceEventInput {
  return {
    event_id,
    decision: "approved",
    approver_type,
    approver_id: "operator-1",
    approval_ref: `ref-${event_id}`,
    content_fingerprint,
    registry_commit: "abc1234",
  };
}

function withdrawn(event_id: number): GovernanceEventInput {
  return {
    event_id,
    decision: "withdrawn",
    approver_type: "HUMAN",
    approver_id: "operator-1",
    approval_ref: `ref-${event_id}`,
    content_fingerprint: FP_A,
    registry_commit: "abc1234",
  };
}

function rejected(event_id: number): GovernanceEventInput {
  return { ...withdrawn(event_id), decision: "rejected" };
}

function exception(event_id: number): GovernanceEventInput {
  return {
    ...withdrawn(event_id),
    decision: "exception_granted",
    reason: "legal reviewed",
  };
}

function attempt(
  attempt_id: number,
  status: DeliveryAttemptInput["status"],
  reconciliation_required = false,
): DeliveryAttemptInput {
  return { attempt_id, status, reconciliation_required };
}

const codes = (list: readonly { code: DiagnosticCode }[]): DiagnosticCode[] =>
  list.map((d) => d.code);

// ---------------------------------------------------------------
// 1. governance_state
// ---------------------------------------------------------------

describe("deriveGovernanceState", () => {
  // -- §2.1 absence and exclusion (G-01 .. G-07) ----------------

  // G-01
  it("G-01: no events yields DRAFT", () => {
    expect(deriveGovernanceState([])).toEqual({
      ok: true,
      state: "DRAFT",
      diagnostics: [],
    });
  });

  // G-02 — rejected never removes or creates an approval
  it("G-02: only a rejected event yields DRAFT", () => {
    expect(deriveGovernanceState([rejected(1)]).state).toBe("DRAFT");
  });

  // G-03
  it("G-03: only an exception yields DRAFT", () => {
    expect(deriveGovernanceState([exception(1)]).state).toBe("DRAFT");
  });

  // G-04 — SYSTEM is an evidence actor, never a governance identity
  it("G-04: only a SYSTEM approval yields DRAFT", () => {
    expect(deriveGovernanceState([approved(1, "SYSTEM")]).state).toBe("DRAFT");
  });

  // G-05
  it("G-05: an approval with empty approver_id is excluded", () => {
    const result = deriveGovernanceState([
      { ...approved(1), approver_id: "" },
    ]);
    expect(result.state).toBe("DRAFT");
    expect(codes(result.diagnostics)).toContain("EXCLUDED_MISSING_APPROVER_ID");
  });

  // G-06
  it("G-06: an approval with empty approval_ref is excluded", () => {
    const result = deriveGovernanceState([
      { ...approved(1), approval_ref: "" },
    ]);
    expect(result.state).toBe("DRAFT");
    expect(codes(result.diagnostics)).toContain("EXCLUDED_MISSING_APPROVAL_REF");
  });

  // G-07
  it("G-07: rejected, exception and SYSTEM together all yield DRAFT", () => {
    const result = deriveGovernanceState([
      rejected(1),
      exception(2),
      approved(3, "SYSTEM"),
    ]);
    expect(result.state).toBe("DRAFT");
    expect(result.ok).toBe(true);
  });

  // -- §2.2 single approval (G-08, G-09) ------------------------

  // G-08
  it("G-08: only an AI_REVIEW approval yields AI_REVIEWED", () => {
    expect(deriveGovernanceState([approved(1, "AI_REVIEW")]).state).toBe(
      "AI_REVIEWED",
    );
  });

  // G-09
  it("G-09: only a HUMAN approval yields HUMAN_APPROVED", () => {
    expect(deriveGovernanceState([approved(1)]).state).toBe("HUMAN_APPROVED");
  });

  // -- §2.3 escalation and monotonicity (G-10 .. G-13) ----------

  // G-10
  it("G-10: AI then HUMAN escalates to HUMAN_APPROVED", () => {
    expect(
      deriveGovernanceState([approved(1, "AI_REVIEW"), approved(2)]).state,
    ).toBe("HUMAN_APPROVED");
  });

  // G-11 — REQUIRED. Ordering must not matter. An implementation
  // that reads only the latest event returns AI_REVIEWED here.
  it("G-11: HUMAN then AI does not downgrade", () => {
    const aiFirst = deriveGovernanceState([
      approved(1, "AI_REVIEW"),
      approved(2),
    ]);
    const humanFirst = deriveGovernanceState([
      approved(1),
      approved(2, "AI_REVIEW"),
    ]);
    expect(aiFirst.state).toBe("HUMAN_APPROVED");
    expect(humanFirst.state).toBe("HUMAN_APPROVED");
  });

  // G-12
  it("G-12: repeated AI reviews are idempotent", () => {
    expect(
      deriveGovernanceState([
        approved(1, "AI_REVIEW"),
        approved(2, "AI_REVIEW"),
        approved(3),
      ]).state,
    ).toBe("HUMAN_APPROVED");
  });

  // G-13 — duplicate approval of identical content is not a conflict
  it("G-13: duplicate approvals of one fingerprint are not a contradiction", () => {
    const result = deriveGovernanceState([
      approved(1),
      approved(2),
      approved(3),
    ]);
    expect(result.ok).toBe(true);
    expect(result.state).toBe("HUMAN_APPROVED");
  });

  // -- §2.4 withdrawal (G-14 .. G-18) ---------------------------

  // G-14
  it("G-14: a withdrawal alone yields WITHDRAWN", () => {
    expect(deriveGovernanceState([withdrawn(1)]).state).toBe("WITHDRAWN");
  });

  // G-15
  it("G-15: withdrawal overrides an earlier approval", () => {
    expect(
      deriveGovernanceState([approved(1), withdrawn(2)]).state,
    ).toBe("WITHDRAWN");
  });

  // G-16
  it("G-16: withdrawal before approval is order-independent", () => {
    expect(
      deriveGovernanceState([withdrawn(1), approved(2)]).state,
    ).toBe("WITHDRAWN");
  });

  // G-17 — REQUIRED. Terminal: a post-withdrawal approval cannot restore.
  it("G-17: an approval after a withdrawal does not restore the record", () => {
    const result = deriveGovernanceState([
      approved(1),
      withdrawn(2),
      approved(3),
    ]);
    expect(result.state).toBe("WITHDRAWN");
    expect(codes(result.diagnostics)).toContain("WITHDRAWN_TERMINAL");
  });

  // G-18 — REQUIRED. Pins spec §3.1/§3.3: withdrawal is evaluated
  // first, so this history yields WITHDRAWN rather than failing.
  // The suppressed conflict is still reported.
  it("G-18: withdrawal short-circuits contradiction detection", () => {
    const result = deriveGovernanceState([
      withdrawn(1),
      approved(2, "HUMAN", FP_A),
      approved(3, "HUMAN", FP_B),
    ]);
    expect(result.ok).toBe(true);
    expect(result.state).toBe("WITHDRAWN");
    const reported = codes(result.diagnostics);
    expect(reported).toContain("CONTRADICTION_SUPPRESSED_BY_WITHDRAWAL");
    expect(reported).not.toContain("CONTRADICTORY_FINGERPRINTS");
  });

  // -- §2.5 contradiction (G-19 .. G-25) -----------------------

  // G-19 — REQUIRED. Must fail. It must NOT resolve to the latest.
  it("G-19: two different approved fingerprints fail the derivation", () => {
    const result = deriveGovernanceState([
      approved(1, "HUMAN", FP_A),
      approved(2, "HUMAN", FP_B),
    ]);
    expect(result.ok).toBe(false);
    expect(result.state).toBeNull();
    expect(codes(result.diagnostics)).toContain("CONTRADICTORY_FINGERPRINTS");
  });

  // The forbidden resolution, asserted directly: reversing the
  // order must not make the derivation pick the newer event.
  it("G-19b: reversal does not resolve the contradiction", () => {
    const newestFirst = deriveGovernanceState([
      approved(2, "HUMAN", FP_B),
      approved(1, "HUMAN", FP_A),
    ]);
    expect(newestFirst.ok).toBe(false);
    expect(newestFirst.state).toBeNull();
  });

  // The error must carry both fingerprints, per spec §3.2.
  it("G-19c: the contradiction diagnostic reports both fingerprints", () => {
    const result = deriveGovernanceState([
      approved(1, "HUMAN", FP_A),
      approved(2, "HUMAN", FP_B),
    ]);
    const diagnostic = result.diagnostics.find(
      (d) => d.code === "CONTRADICTORY_FINGERPRINTS",
    );
    expect(diagnostic?.detail?.content_fingerprints).toEqual([FP_A, FP_B]);
  });

  // G-20
  it("G-20: an AI approval also contributes a fingerprint", () => {
    const result = deriveGovernanceState([
      approved(1, "AI_REVIEW", FP_A),
      approved(2, "HUMAN", FP_B),
    ]);
    expect(result.ok).toBe(false);
    expect(result.state).toBeNull();
  });

  // G-21
  it("G-21: a rejected event contributes no fingerprint", () => {
    const result = deriveGovernanceState([
      { ...rejected(1), content_fingerprint: FP_B },
      approved(2, "HUMAN", FP_A),
    ]);
    expect(result.ok).toBe(true);
    expect(result.state).toBe("HUMAN_APPROVED");
  });

  // G-22
  it("G-22: an exception contributes no fingerprint", () => {
    const result = deriveGovernanceState([
      { ...exception(1), content_fingerprint: FP_B },
      approved(2, "HUMAN", FP_A),
    ]);
    expect(result.ok).toBe(true);
    expect(result.state).toBe("HUMAN_APPROVED");
  });

  // G-23
  it("G-23: a SYSTEM event contributes no fingerprint", () => {
    const result = deriveGovernanceState([
      approved(1, "SYSTEM", FP_B),
      approved(2, "HUMAN", FP_A),
    ]);
    expect(result.ok).toBe(true);
    expect(result.state).toBe("HUMAN_APPROVED");
  });

  // G-24
  it("G-24: a withdrawn fingerprint is irrelevant to contradiction", () => {
    const result = deriveGovernanceState([
      { ...withdrawn(1), content_fingerprint: FP_C },
      approved(2, "HUMAN", FP_A),
      approved(3, "HUMAN", FP_B),
    ]);
    expect(result.state).toBe("WITHDRAWN");
    expect(codes(result.diagnostics)).not.toContain("CONTRADICTORY_FINGERPRINTS");
  });

  // G-25
  it("G-25: an excluded event contributes no fingerprint", () => {
    const result = deriveGovernanceState([
      { ...approved(1, "HUMAN", FP_B), approver_id: "" },
      approved(2, "HUMAN", FP_A),
    ]);
    expect(result.ok).toBe(true);
    expect(result.state).toBe("HUMAN_APPROVED");
  });

  // -- §2.6 properties (G-26 .. G-30) --------------------------

  // G-26
  it("G-26: every permutation of a fixture set yields the same state", () => {
    const base: GovernanceEventInput[] = [
      approved(1, "AI_REVIEW"),
      approved(2, "HUMAN"),
      rejected(3),
    ];
    const permutations = [
      base,
      [...base].reverse(),
      [base[1], base[2], base[0]],
      [base[2], base[0], base[1]],
    ];
    const states = permutations.map(
      (events) => deriveGovernanceState(events).state,
    );
    expect(new Set(states)).toEqual(new Set(["HUMAN_APPROVED"]));
  });

  // G-27
  it("G-27: repeated derivation is identical", () => {
    const events = [approved(1, "AI_REVIEW"), approved(2), withdrawn(3)];
    expect(JSON.stringify(deriveGovernanceState(events))).toBe(
      JSON.stringify(deriveGovernanceState(events)),
    );
  });

  // G-28 — purity: the caller's array is not mutated.
  it("G-28: derivation does not mutate its input", () => {
    const events = [approved(1, "AI_REVIEW"), approved(2)];
    const snapshot = JSON.stringify(events);
    deriveGovernanceState(events);
    expect(JSON.stringify(events)).toBe(snapshot);
  });

  // G-29
  it("G-29: results are always one of the four states, or a failure", () => {
    const legal = ["DRAFT", "AI_REVIEWED", "HUMAN_APPROVED", "WITHDRAWN"];
    const cases: GovernanceEventInput[][] = [
      [],
      [rejected(1)],
      [approved(1, "AI_REVIEW")],
      [approved(1)],
      [withdrawn(1)],
      [approved(1, "HUMAN", FP_A), approved(2, "HUMAN", FP_B)],
    ];
    for (const events of cases) {
      const { state } = deriveGovernanceState(events);
      expect(state === null || legal.includes(state)).toBe(true);
    }
  });

  // G-30 — the pure layer reports disagreement; it cannot correct a
  // stored value, because it has no access to one. That is the
  // caller's responsibility (contract §3.6).
  it("G-30: drift is not silently absorbed — the derived value stands alone", () => {
    const derived = deriveGovernanceState([approved(1)]);
    const stored = "DRAFT" as const;
    expect(derived.state).toBe("HUMAN_APPROVED");
    expect(derived.state).not.toBe(stored);
  });

  // -- §3.5 unresolved: registry_commit split ------------------

  // Not a contradiction under the current spec, but reported. This
  // test documents the OPEN status and must be revisited when §3.5
  // is resolved.
  it("§3.5: one fingerprint across two registry_commits is reported, not failed", () => {
    const result = deriveGovernanceState([
      { ...approved(1, "HUMAN", FP_A), registry_commit: "aaaaaaa" },
      { ...approved(2, "HUMAN", FP_A), registry_commit: "bbbbbbb" },
    ]);
    expect(result.ok).toBe(true);
    expect(result.state).toBe("HUMAN_APPROVED");
    expect(codes(result.diagnostics)).toContain("REGISTRY_COMMIT_SPLIT");
  });

  // -- robustness: never throws (spec §5) -----------------------

  it("never throws on malformed history", () => {
    const junk: GovernanceEventInput[] = [
      {},
      { event_id: null, decision: null, approver_type: null },
      { ...approved(1), decision: "not_a_real_decision" },
      { ...approved(2), approver_id: "" },
      { ...approved(3), approval_ref: "" },
      { ...approved(4, "SYSTEM") },
    ];
    expect(() => deriveGovernanceState(junk)).not.toThrow();
    // Nothing here is a valid approval, so nothing authorises.
    expect(deriveGovernanceState(junk).state).toBe("DRAFT");
  });

  // An empty content_fingerprint is NOT one of the four validity
  // conditions in spec §2, so such an approval still participates.
  // The database CHECK research_distribution_fingerprint_hex makes
  // this unreachable in practice; the behaviour is pinned here so it
  // is a decision rather than an accident.
  it("an empty content_fingerprint does not exclude the approval", () => {
    const result = deriveGovernanceState([
      { ...approved(1), content_fingerprint: "" },
    ]);
    expect(result.state).toBe("HUMAN_APPROVED");
    // It contributes no fingerprint, so nothing can contradict it.
    expect(result.ok).toBe(true);
  });

  // A valid approval alongside one carrying no fingerprint cannot
  // contradict, because only one fingerprint exists.
  it("an empty fingerprint alongside a real one is not a contradiction", () => {
    const result = deriveGovernanceState([
      { ...approved(1), content_fingerprint: "" },
      approved(2, "HUMAN", FP_A),
    ]);
    expect(result.ok).toBe(true);
    expect(result.state).toBe("HUMAN_APPROVED");
  });

  it("reports an unknown decision distinctly", () => {
    const result = deriveGovernanceState([
      { ...approved(1), decision: "noted" },
    ]);
    expect(codes(result.diagnostics)).toContain("EXCLUDED_UNKNOWN_DECISION");
  });

  it("does not throw when given a non-array", () => {
    const result = deriveGovernanceState(
      undefined as unknown as GovernanceEventInput[],
    );
    expect(result.ok).toBe(false);
    expect(codes(result.diagnostics)).toContain("INVALID_INPUT");
  });
});

// ---------------------------------------------------------------
// 2. delivery_state
// ---------------------------------------------------------------

describe("deriveDeliveryState", () => {
  // -- §3.1 absence and single attempt (D-01 .. D-06) ------------

  // D-01 — REQUIRED
  it("D-01: no attempts yields NOT_ATTEMPTED", () => {
    expect(deriveDeliveryState([]).state).toBe("NOT_ATTEMPTED");
  });

  // D-02
  it("D-02: an in-flight attempt yields IN_FLIGHT", () => {
    expect(deriveDeliveryState([attempt(1, "IN_FLIGHT")]).state).toBe(
      "IN_FLIGHT",
    );
  });

  // D-03
  it("D-03: a succeeded attempt yields PUBLISHED", () => {
    expect(deriveDeliveryState([attempt(1, "SUCCEEDED")]).state).toBe(
      "PUBLISHED",
    );
  });

  // D-04
  it("D-04: a failed attempt yields FAILED", () => {
    expect(deriveDeliveryState([attempt(1, "FAILED")]).state).toBe("FAILED");
  });

  // D-05 — REQUIRED. The documented SKIPPED limitation: SKIPPED is
  // deliberate non-delivery, but delivery_state cannot say so, so it
  // derives FAILED. The fact is preserved in diagnostics.
  it("D-05: a skipped attempt yields FAILED and is reported", () => {
    const result = deriveDeliveryState([attempt(1, "SKIPPED")]);
    expect(result.state).toBe("FAILED");
    expect(codes(result.diagnostics)).toContain("ATTEMPT_SKIPPED");
  });

  // D-06
  it("D-06: an attempt requiring reconciliation yields IN_FLIGHT", () => {
    expect(deriveDeliveryState([attempt(1, "FAILED", true)]).state).toBe(
      "IN_FLIGHT",
    );
  });

  // -- §3.2 multiple attempts (D-07 .. D-12) --------------------

  // D-07
  it("D-07: one success is sufficient after an earlier failure", () => {
    expect(
      deriveDeliveryState([attempt(1, "FAILED"), attempt(2, "SUCCEEDED")])
        .state,
    ).toBe("PUBLISHED");
  });

  // D-08
  it("D-08: all attempts failed yields FAILED", () => {
    expect(
      deriveDeliveryState([attempt(1, "FAILED"), attempt(2, "FAILED")]).state,
    ).toBe("FAILED");
  });

  // D-09
  it("D-09: a current in-flight attempt outranks earlier failures", () => {
    expect(
      deriveDeliveryState([attempt(1, "FAILED"), attempt(2, "IN_FLIGHT")])
        .state,
    ).toBe("IN_FLIGHT");
  });

  // D-10
  it("D-10: repeated successes are idempotent", () => {
    expect(
      deriveDeliveryState([attempt(1, "SUCCEEDED"), attempt(2, "SUCCEEDED")])
        .state,
    ).toBe("PUBLISHED");
  });

  // D-11
  it("D-11: a later success overrides an earlier skip", () => {
    expect(
      deriveDeliveryState([attempt(1, "SKIPPED"), attempt(2, "SUCCEEDED")])
        .state,
    ).toBe("PUBLISHED");
  });

  // D-12
  it("D-12: all attempts skipped yields FAILED", () => {
    expect(
      deriveDeliveryState([attempt(1, "SKIPPED"), attempt(2, "SKIPPED")])
        .state,
    ).toBe("FAILED");
  });

  // -- §3.3 reconciliation precedence (D-13 .. D-15) -----------

  // D-13 — REQUIRED. The most consequential delivery case: an
  // unresolved attempt must mask an earlier success, or the system
  // would report a confirmed delivery it cannot confirm.
  it("D-13: reconciliation masks an earlier success", () => {
    const result = deriveDeliveryState([
      attempt(1, "SUCCEEDED"),
      attempt(2, "FAILED", true),
    ]);
    expect(result.state).toBe("IN_FLIGHT");
    expect(codes(result.diagnostics)).toContain("RECONCILIATION_REQUIRED");
  });

  // D-14
  it("D-14: reconciliation outranks an earlier failure", () => {
    expect(
      deriveDeliveryState([attempt(1, "FAILED"), attempt(2, "FAILED", true)])
        .state,
    ).toBe("IN_FLIGHT");
  });

  // D-15
  it("D-15: reconciliation alongside an in-flight attempt yields IN_FLIGHT", () => {
    expect(
      deriveDeliveryState([
        attempt(1, "IN_FLIGHT"),
        attempt(2, "FAILED", true),
      ]).state,
    ).toBe("IN_FLIGHT");
  });

  // -- §3.4 SKIPPED limitation (D-16 .. D-18) ------------------

  // D-16
  it("D-16: SKIPPED derives the same state as FAILED", () => {
    expect(deriveDeliveryState([attempt(1, "SKIPPED")]).state).toBe(
      deriveDeliveryState([attempt(1, "FAILED")]).state,
    );
  });

  // D-17 — the distinction is recoverable only from the attempt row.
  it("D-17: the skip is recoverable from the attempt row and diagnostics", () => {
    const skipped = deriveDeliveryState([attempt(1, "SKIPPED")]);
    const failed = deriveDeliveryState([attempt(1, "FAILED")]);
    expect(skipped.state).toBe(failed.state);
    expect(codes(skipped.diagnostics)).toContain("ATTEMPT_SKIPPED");
    expect(codes(failed.diagnostics)).not.toContain("ATTEMPT_SKIPPED");
  });

  // D-18 — the accepted limitation, asserted so it cannot regress
  // silently: delivery_state alone cannot distinguish the two.
  it("D-18: delivery_state alone cannot distinguish SKIPPED from FAILED", () => {
    const skipped = deriveDeliveryState([attempt(1, "SKIPPED")]);
    const failed = deriveDeliveryState([attempt(1, "FAILED")]);
    expect(skipped.state).toBe(failed.state);
    // Only the diagnostic set differs.
    expect(skipped.diagnostics).not.toEqual(failed.diagnostics);
  });

  // -- §3.5 properties (D-19 .. D-22) --------------------------

  // D-19
  it("D-19: every permutation of an attempt set yields the same state", () => {
    const base = [attempt(1, "FAILED"), attempt(2, "IN_FLIGHT")];
    const states = [base, [...base].reverse(), [base[1], base[0]]].map(
      (attempts) => deriveDeliveryState(attempts).state,
    );
    expect(new Set(states)).toEqual(new Set(["IN_FLIGHT"]));
  });

  // D-20
  it("D-20: repeated derivation is identical", () => {
    const attempts = [attempt(1, "SKIPPED"), attempt(2, "SUCCEEDED")];
    expect(JSON.stringify(deriveDeliveryState(attempts))).toBe(
      JSON.stringify(deriveDeliveryState(attempts)),
    );
  });

  // D-21 — SKIPPED must never leak into a derived state.
  it("D-21: SKIPPED is never returned as a delivery state", () => {
    const cases: DeliveryAttemptInput[][] = [
      [attempt(1, "SKIPPED")],
      [attempt(1, "SKIPPED"), attempt(2, "SKIPPED")],
      [attempt(1, "SKIPPED"), attempt(2, "IN_FLIGHT")],
      [attempt(1, "SKIPPED"), attempt(2, "SUCCEEDED")],
    ];
    const legal = ["NOT_ATTEMPTED", "IN_FLIGHT", "PUBLISHED", "FAILED"];
    for (const attempts of cases) {
      const { state } = deriveDeliveryState(attempts);
      expect(legal).toContain(state);
      expect(state).not.toBe("SKIPPED");
    }
  });

  // D-22 — same boundary as governance: the pure layer cannot see a
  // stored column, so it cannot correct one (contract §3.6).
  it("D-22: the derived value stands alone, unsilently", () => {
    expect(deriveDeliveryState([attempt(1, "SUCCEEDED")]).state).toBe(
      "PUBLISHED",
    );
  });

  // -- robustness ----------------------------------------------

  it("does not throw on a malformed attempt or a non-array", () => {
    expect(() => deriveDeliveryState([{ attempt_id: 1 }])).not.toThrow();
    const nonArray = deriveDeliveryState(
      undefined as unknown as DeliveryAttemptInput[],
    );
    expect(nonArray.state).toBe("NOT_ATTEMPTED");
    expect(codes(nonArray.diagnostics)).toContain("INVALID_INPUT");
  });
});

// ---------------------------------------------------------------
// 3. Cross-cutting (matrix §4)
// ---------------------------------------------------------------

describe("cross-cutting", () => {
  // X-01 — the two derivations share no input and no state.
  it("X-01: the two derivations are independent", () => {
    const govern = deriveGovernanceState([approved(1)]);
    const deliver = deriveDeliveryState([attempt(1, "SUCCEEDED")]);

    expect(govern.state).toBe("HUMAN_APPROVED");
    expect(deliver.state).toBe("PUBLISHED");
    expect(govern.diagnostics).toEqual([]);
    expect(deliver.diagnostics).toEqual([]);
  });

  // X-04 — every emitted state is one of the eight legal values.
  it("X-04: every emitted state is a schema-legal value", () => {
    const governanceStates = new Set([
      deriveGovernanceState([]).state,
      deriveGovernanceState([approved(1)]).state,
      deriveGovernanceState([approved(1, "AI_REVIEW")]).state,
      deriveGovernanceState([withdrawn(1)]).state,
      deriveGovernanceState([
        approved(1, "HUMAN", FP_A),
        approved(2, "HUMAN", FP_B),
      ]).state,
    ]);
    const deliveryStates = new Set([
      deriveDeliveryState([]).state,
      deriveDeliveryState([attempt(1, "SUCCEEDED")]).state,
      deriveDeliveryState([attempt(1, "IN_FLIGHT")]).state,
      deriveDeliveryState([attempt(1, "FAILED")]).state,
    ]);

    // The contradiction case contributes no state at all — it must
    // not appear here, and must not add a fifth value.
    expect(governanceStates.has(null)).toBe(true);
    expect([...governanceStates].filter((s) => s !== null).sort()).toEqual([
      "AI_REVIEWED",
      "DRAFT",
      "HUMAN_APPROVED",
      "WITHDRAWN",
    ]);
    expect([...deliveryStates].sort()).toEqual([
      "FAILED",
      "IN_FLIGHT",
      "NOT_ATTEMPTED",
      "PUBLISHED",
    ]);
  });

  // X-05 — the contradiction case yields no state at all, so there
  // is no fifth governance value and nothing to persist.
  it("X-05: a contradiction produces no state to write", () => {
    const result = deriveGovernanceState([
      approved(1, "HUMAN", FP_A),
      approved(2, "HUMAN", FP_B),
    ]);
    expect(result.state).toBeNull();
    expect(result.ok).toBe(false);
  });
});