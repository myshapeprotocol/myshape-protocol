// ============================================================
// Contract tests for the governance gate.
//
// The gate is a pure predicate over a derivation result. Every test
// below feeds it either a hand-built result or a real one produced
// by deriveGovernanceState(), so the two layers are exercised
// together as a pipeline without any I/O, database, Registry, or
// platform.
// ============================================================

import { describe, it, expect } from "vitest";
import { canDistribute, type GateReason } from "./governance-gate";
import type { ApprovalFreshness } from "./approval-freshness";
import {
  deriveGovernanceState,
  type Diagnostic,
  type GovernanceDerivationResult,
  type GovernanceEventInput,
} from "./derivation";

// ---------------------------------------------------------------
// Freshness is a REQUIRED argument (spec §3.5).
//
// Every test below supplies one explicitly. The fixture used by
// tests that are not ABOUT provenance is `FRESH`, because those
// tests assert on the governance state or the contradiction model —
// not on staleness. The staleness behaviour has its own suite at the
// bottom of this file.
// ---------------------------------------------------------------

/** A proven-fresh verdict: the anchor matches every approval. */
const FRESH: ApprovalFreshness = {
  ok: true,
  fresh: true,
  registry_commit: "abc1234",
  event_commits: ["abc1234"],
};

/** Build a successful derivation result without invoking the engine. */
function derived(
  state: "DRAFT" | "AI_REVIEWED" | "HUMAN_APPROVED" | "WITHDRAWN",
  diagnostics: Diagnostic[] = [],
): GovernanceDerivationResult {
  return { ok: true, state, diagnostics };
}

/** Build a failed derivation result — the contradiction case. */
function failed(diagnostics: Diagnostic[] = []): GovernanceDerivationResult {
  return { ok: false, state: null, diagnostics };
}

const FP_A = "a".repeat(64);
const FP_B = "b".repeat(64);

function approval(
  event_id: number,
  approver_type: "HUMAN" | "AI_REVIEW" = "HUMAN",
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

// ---------------------------------------------------------------
// Positive
// ---------------------------------------------------------------

describe("canDistribute — positive", () => {
  // T-01
  it("T-01: HUMAN_APPROVED is allowed", () => {
    expect(canDistribute(derived("HUMAN_APPROVED"), FRESH)).toEqual({
      allowed: true,
      reasons: [],
    });
  });

  // An allow must still be quiet — reasons is a denial log.
  it("T-01b: an allow carries no reasons", () => {
    const { allowed, reasons } = canDistribute(derived("HUMAN_APPROVED"), FRESH);
    expect(allowed).toBe(true);
    expect(reasons).toEqual([]);
  });

  // The gate must tolerate diagnostics on an approving result:
  // exclusions and suppressed conditions do not block a HUMAN_APPROVED
  // record.
  it("T-01c: diagnostics on an approving result do not block it", () => {
    const result = deriveGovernanceState([
      approval(1, "AI_REVIEW"),
      approval(2),
      withdrawal(3),
      { ...withdrawal(4), decision: "rejected" },
    ]);
    // Still WITHDRAWN — terminal — so this exercises diagnostics on a
    // denied result instead. The approving case:
    const approving = deriveGovernanceState([
      approval(1, "AI_REVIEW"),
      approval(2),
      { ...withdrawal(3), decision: "rejected" },
    ]);
    expect(approving.diagnostics.length).toBeGreaterThan(0);
    expect(canDistribute(approving, FRESH).allowed).toBe(true);
    expect(canDistribute(result, FRESH).allowed).toBe(false);
  });
});

// ---------------------------------------------------------------
// Negative — one case per reason code
// ---------------------------------------------------------------

describe("canDistribute — negative", () => {
  // T-02
  it("T-02: DRAFT is denied as NOT_APPROVED", () => {
    expect(canDistribute(derived("DRAFT"), FRESH)).toEqual({
      allowed: false,
      reasons: ["NOT_APPROVED"],
    });
  });

  // T-03 — the decisive AI case. AI_REVIEWED must never authorise
  // distribution, whatever else is true of the record.
  it("T-03: AI_REVIEWED is denied as HUMAN_APPROVAL_REQUIRED", () => {
    expect(canDistribute(derived("AI_REVIEWED"), FRESH)).toEqual({
      allowed: false,
      reasons: ["HUMAN_APPROVAL_REQUIRED"],
    });
  });

  // T-04
  it("T-04: WITHDRAWN is denied as WITHDRAWN_TERMINAL", () => {
    expect(canDistribute(derived("WITHDRAWN"), FRESH)).toEqual({
      allowed: false,
      reasons: ["WITHDRAWN_TERMINAL"],
    });
  });

  // T-05 — a failed derivation must fail closed, and must be
  // reported as a failed derivation rather than as "not approved".
  it("T-05: a failed derivation is denied as DERIVATION_FAILED", () => {
    expect(canDistribute(failed(), FRESH)).toEqual({
      allowed: false,
      reasons: ["DERIVATION_FAILED"],
    });
  });

  // The failure reason must not be conflated with a state-based
  // reason: "nothing was decided" is a different fact from "decided
  // it is not approved".
  it("T-05b: a failed derivation is not reported as NOT_APPROVED", () => {
    const { reasons } = canDistribute(failed(), FRESH);
    expect(reasons).not.toContain("NOT_APPROVED");
    expect(reasons).toContain("DERIVATION_FAILED");
  });
});

// ---------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------

describe("canDistribute — properties", () => {
  // T-06 — the central safety property. Sweep every reachable
  // derivation result, including diagnostics variations, and assert
  // that an allow occurs for HUMAN_APPROVED and nothing else.
  it("T-06: no input except HUMAN_APPROVED may allow", () => {
    const results: GovernanceDerivationResult[] = [
      derived("DRAFT"),
      derived("AI_REVIEWED"),
      derived("HUMAN_APPROVED"),
      derived("WITHDRAWN"),
      failed(),
      derived("DRAFT", [{ code: "EXCLUDED_DECISION", message: "x" }]),
      derived("HUMAN_APPROVED", [{ code: "EXCLUDED_DECISION", message: "x" }]),
      failed([{ code: "CONTRADICTORY_FINGERPRINTS", message: "x" }]),
    ];

    for (const result of results) {
      const gate = canDistribute(result, FRESH);
      if (result.ok && result.state === "HUMAN_APPROVED") {
        expect(gate.allowed).toBe(true);
      } else {
        expect(gate.allowed).toBe(false);
      }
    }
  });

  // T-06b — driven from raw events through the real pipeline, so
  // the property is proved end to end and not just on hand-built
  // shapes.
  it("T-06b: no real event history except a human approval may allow", () => {
    const histories: GovernanceEventInput[][] = [
      [],                                               // DRAFT
      [{ ...withdrawal(1), decision: "rejected" }],      // DRAFT
      [approval(1, "AI_REVIEW")],                       // AI_REVIEWED
      [approval(1, "AI_REVIEW"), approval(2, "AI_REVIEW")], // AI_REVIEWED
      [withdrawal(1)],                                   // WITHDRAWN
      [approval(1), withdrawal(2), approval(3)],         // WITHDRAWN
      [approval(1, "HUMAN", FP_A), approval(2, "HUMAN", FP_B)], // FAILED
      [withdrawal(1), approval(2, "HUMAN", FP_A), approval(3, "HUMAN", FP_B)], // WITHDRAWN
      [approval(1)],                                     // HUMAN_APPROVED
      [approval(1, "AI_REVIEW"), approval(2)],           // HUMAN_APPROVED
    ];

    const allowedCount = histories
      .map((events) => canDistribute(deriveGovernanceState(events), FRESH))
      .filter((gate) => gate.allowed).length;
    expect(allowedCount).toBe(2);
  });

  // T-07 — determinism. Repeated calls are byte-identical.
  it("T-07: the gate result is deterministic", () => {
    const results: GovernanceDerivationResult[] = [
      derived("DRAFT"),
      derived("AI_REVIEWED"),
      derived("HUMAN_APPROVED"),
      derived("WITHDRAWN"),
      failed(),
    ];
    for (const result of results) {
      const first = JSON.stringify(canDistribute(result, FRESH));
      for (let i = 0; i < 5; i += 1) {
        expect(JSON.stringify(canDistribute(result, FRESH))).toBe(first);
      }
    }
  });

  // An allow always pairs with an empty reason list, and a denial
  // always pairs with at least one. This is the "never silently
  // allow" property.
  it("T-07b: allowed and reasons are always consistent", () => {
    const results: GovernanceDerivationResult[] = [
      derived("DRAFT"),
      derived("AI_REVIEWED"),
      derived("HUMAN_APPROVED"),
      derived("WITHDRAWN"),
      failed(),
    ];
    for (const result of results) {
      const { allowed, reasons } = canDistribute(result, FRESH);
      if (allowed) {
        expect(reasons).toHaveLength(0);
      } else {
        expect(reasons.length).toBeGreaterThan(0);
      }
    }
  });

  // The gate must not mutate its argument.
  it("T-07c: the gate does not mutate its input", () => {
    const result = derived("DRAFT", [
      { code: "EXCLUDED_DECISION", message: "x" },
    ]);
    const snapshot = JSON.stringify(result);
    canDistribute(result, FRESH);
    expect(JSON.stringify(result)).toBe(snapshot);
  });

  // Every denial reason must be one of the four declared codes.
  it("T-07d: every emitted reason is a declared GateReason", () => {
    const legal: GateReason[] = [
      "DERIVATION_FAILED",
      "NOT_APPROVED",
      "HUMAN_APPROVAL_REQUIRED",
      "WITHDRAWN_TERMINAL",
    ];
    const results: GovernanceDerivationResult[] = [
      derived("DRAFT"),
      derived("AI_REVIEWED"),
      derived("HUMAN_APPROVED"),
      derived("WITHDRAWN"),
      failed(),
    ];
    for (const result of results) {
      for (const reason of canDistribute(result, FRESH).reasons) {
        expect(legal).toContain(reason);
      }
    }
  });
});

// ---------------------------------------------------------------
// Pipeline — gate composed with the derivation engine
// ---------------------------------------------------------------

describe("governance gate over a real derivation", () => {
  it("allows a record approved by a human", () => {
    expect(canDistribute(deriveGovernanceState([approval(1)]), FRESH).allowed).toBe(
      true,
    );
  });

  // The load-bearing case: AI review alone, however many times, and
  // however clean the history, never authorises distribution.
  it("never allows on AI review alone", () => {
    const gate = canDistribute(
      deriveGovernanceState([
        approval(1, "AI_REVIEW"),
        approval(2, "AI_REVIEW"),
      ]),
      FRESH,
    );
    expect(gate.allowed).toBe(false);
    expect(gate.reasons).toEqual(["HUMAN_APPROVAL_REQUIRED"]);
  });

  it("denies a contradictory record as a failed derivation", () => {
    const gate = canDistribute(
      deriveGovernanceState([
        approval(1, "HUMAN", FP_A),
        approval(2, "HUMAN", FP_B),
      ]),
      FRESH,
    );
    expect(gate.allowed).toBe(false);
    expect(gate.reasons).toEqual(["DERIVATION_FAILED"]);
  });

  it("denies a withdrawn record as terminal", () => {
    const gate = canDistribute(
      deriveGovernanceState([approval(1), withdrawal(2), approval(3)]),
      FRESH,
    );
    expect(gate.allowed).toBe(false);
    expect(gate.reasons).toEqual(["WITHDRAWN_TERMINAL"]);
  });

  // A withdrawal that also carries a contradiction stays WITHDRAWN,
  // and the gate reports the terminal reason — not the suppressed
  // contradiction. The gate sees only the derived state, which is
  // the whole point of the layering.
  it("reports the terminal reason for a withdrawn record", () => {
    const gate = canDistribute(
      deriveGovernanceState([
        withdrawal(1),
        approval(2, "HUMAN", FP_A),
        approval(3, "HUMAN", FP_B),
      ]),
      FRESH,
    );
    expect(gate.reasons).toEqual(["WITHDRAWN_TERMINAL"]);
  });

  it("denies an unapproved record", () => {
    expect(canDistribute(deriveGovernanceState([]), FRESH).reasons).toEqual([
      "NOT_APPROVED",
    ]);
  });

// ---------------------------------------------------------------
// Provenance (spec §3.5)
//
// These are the ONLY tests that pass a freshness verdict. Everything
// above calls canDistribute with one argument and must keep behaving
// exactly as before — the argument is optional for that reason.
// ---------------------------------------------------------------

describe("canDistribute — provenance", () => {
  // Built as real values rather than `as const` literals: the verdict
  // type carries mutable arrays, and a readonly tuple is not
  // assignable to it.
  const freshVerdict: ApprovalFreshness = {
    ok: true,
    fresh: true,
    registry_commit: "abc1234",
    event_commits: ["abc1234"],
  };

  const staleVerdict: ApprovalFreshness = {
    ok: true,
    fresh: false,
    registry_commit: "bbbbbbb",
    event_commits: ["abc1234"],
    stale: {
      registry_commit: "bbbbbbb",
      event_ids: [1],
      mismatched_commits: ["abc1234"],
    },
  };

  const unprovableVerdict: ApprovalFreshness = {
    ok: false,
    reason: "MISSING_DISTRIBUTION",
    detail: "provenance unknown",
  };

  it("denies a HUMAN_APPROVED record whose approval is stale", () => {
    // The record derives HUMAN_APPROVED — it is the ANCHOR that moved,
    // not the approval. The gate is what refuses to distribute on it.
    const result = canDistribute(derived("HUMAN_APPROVED"), staleVerdict);
    expect(result).toEqual({
      allowed: false,
      reasons: ["STALE_APPROVAL_PROVENANCE"],
    });
  });

  it("denies when freshness could not be established at all", () => {
    // An unreadable or malformed anchor is not a fresh anchor.
    expect(
      canDistribute(derived("HUMAN_APPROVED"), unprovableVerdict).reasons,
    ).toEqual(["STALE_APPROVAL_PROVENANCE"]);
  });

  it("allows a HUMAN_APPROVED record with proven-fresh provenance", () => {
    expect(canDistribute(derived("HUMAN_APPROVED"), freshVerdict)).toEqual({
      allowed: true,
      reasons: [],
    });
  });

  it("does not invent a fifth governance state", () => {
    // The derivation still says HUMAN_APPROVED; only the gate denies.
    // The record is not rewritten, and the DB enum is unchanged.
    const result = canDistribute(derived("HUMAN_APPROVED"), staleVerdict);
    expect(result.allowed).toBe(false);
    // Reasons are an explanation, never a state.
    expect(result.reasons).not.toContain("HUMAN_APPROVED");
    expect(result.reasons).toHaveLength(1);
  });

  it("reports a contradiction ahead of staleness", () => {
    // Both are true. DERIVATION_FAILED wins because a contradictory
    // record has no governing state at all — the more fundamental
    // failure — and reporting it as a freshness problem would
    // misattribute it.
    expect(canDistribute(failed(), staleVerdict).reasons).toEqual([
      "DERIVATION_FAILED",
    ]);
  });

  it("keeps a stale record from reaching ALLOW", () => {
    const staleOnly = canDistribute(derived("HUMAN_APPROVED"), staleVerdict);
    expect(staleOnly.allowed).toBe(false);
    const freshOnly = canDistribute(derived("HUMAN_APPROVED"), freshVerdict);
    expect(freshOnly.allowed).toBe(true);
    expect(staleOnly.allowed).not.toBe(freshOnly.allowed);
  });

  it("leaves every pre-existing reason unchanged when provenance is fresh", () => {
    expect(canDistribute(derived("DRAFT"), freshVerdict).reasons).toEqual([
      "NOT_APPROVED",
    ]);
    expect(canDistribute(derived("AI_REVIEWED"), freshVerdict).reasons).toEqual([
      "HUMAN_APPROVAL_REQUIRED",
    ]);
    expect(canDistribute(derived("WITHDRAWN"), freshVerdict).reasons).toEqual([
      "WITHDRAWN_TERMINAL",
    ]);
    expect(canDistribute(failed(), freshVerdict).reasons).toEqual([
      "DERIVATION_FAILED",
    ]);
  });
});

});