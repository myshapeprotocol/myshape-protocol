// ============================================================
// Contract tests for the approval freshness check.
//
// Pure: no database, no Registry, no Git, no clock, no filesystem.
// Every case is a plain in-memory input.
//
// Source of truth: RESEARCH-DISTRIBUTION-DERIVATION-SPEC §3.5.
// The A–F labels below are the cases named in
// RESEARCH-DISTRIBUTION-STATE-TEST-MATRIX.md §7.1, which this file
// now makes executable.
//
// THE POINT OF THIS SUITE: a stale approval is a PROVENANCE
// failure, not a content contradiction. Several cases below hold the
// content fingerprint constant while moving registry_commit, and
// must never be reported as a contradiction.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  checkApprovalFreshness,
  type DistributionProvenance,
} from "./approval-freshness";
import type { GovernanceEventInput } from "./derivation";

const FP_A = "a".repeat(64);

const COMMIT_A = "aaaaaaa";
const COMMIT_B = "bbbbbbb";

function dist(
  registry_commit: string | null,
  distribution_id = "dist-1",
): DistributionProvenance {
  return { distribution_id, registry_commit };
}

function approval(
  event_id: number,
  registry_commit: string | null = COMMIT_A,
  fingerprint = FP_A,
): GovernanceEventInput {
  return {
    event_id,
    decision: "approved",
    approver_type: "HUMAN",
    approver_id: "operator-1",
    approval_ref: `ref-${event_id}`,
    content_fingerprint: fingerprint,
    registry_commit,
  };
}

// ---------------------------------------------------------------
// A–F — the semantic cases
// ---------------------------------------------------------------

describe("§3.5 cases A-F", () => {
  // A
  it("A: distribution = A, events = [A] is fresh", () => {
    const result = checkApprovalFreshness({
      distribution: dist(COMMIT_A),
      events: [approval(1)],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fresh).toBe(true);
    expect(result.registry_commit).toBe(COMMIT_A);
    expect(result.event_commits).toEqual([COMMIT_A]);
  });

  // B — the case that was previously unobservable
  it("B: distribution = B, events = [A] is STALE_APPROVAL_PROVENANCE", () => {
    const result = checkApprovalFreshness({
      distribution: dist(COMMIT_B),
      events: [approval(1)],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fresh).toBe(false);
    expect(result.stale?.registry_commit).toBe(COMMIT_B);
    expect(result.stale?.mismatched_commits).toEqual([COMMIT_A]);
    expect(result.stale?.event_ids).toEqual([1]);
  });

  // C
  it("C: repeated matching approvals are fresh", () => {
    const result = checkApprovalFreshness({
      distribution: dist(COMMIT_A),
      events: [approval(1), approval(2), approval(3)],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fresh).toBe(true);
  });

  // D — event-level split against the anchor
  it("D: events = [A, A, B] against anchor A is stale", () => {
    const result = checkApprovalFreshness({
      distribution: dist(COMMIT_A),
      events: [approval(1), approval(2, COMMIT_B)],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fresh).toBe(false);
    expect(result.stale?.mismatched_commits).toEqual([COMMIT_B]);
    expect(result.stale?.event_ids).toEqual([2]);
  });

  // E — independent lifecycles, evaluated independently
  it("E: two lifecycles with different anchors are each valid", () => {
    const one = checkApprovalFreshness({
      distribution: dist(COMMIT_A, "dist-1"),
      events: [approval(1)],
    });
    const two = checkApprovalFreshness({
      distribution: dist(COMMIT_B, "dist-2"),
      events: [approval(1, COMMIT_B)],
    });
    expect(one.ok && one.fresh).toBe(true);
    expect(two.ok && two.fresh).toBe(true);
  });

  // F — same fingerprint, different provenance: NOT a contradiction
  it("F: same fingerprint + split provenance is a freshness failure only", () => {
    const result = checkApprovalFreshness({
      distribution: dist(COMMIT_B),
      events: [approval(1, COMMIT_A), approval(2, COMMIT_B)],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fresh).toBe(false);
    // The fingerprint never appears in a freshness verdict at all:
    // this module has no contradiction concept to express.
    expect(JSON.stringify(result)).not.toContain(FP_A);
  });
});


// ---------------------------------------------------------------
// Fail closed
// ---------------------------------------------------------------

describe("fails closed", () => {
  it("rejects a missing distribution record", () => {
    const result = checkApprovalFreshness({
      distribution: null,
      events: [approval(1)],
    });
    expect(result).toMatchObject({ ok: false, reason: "MISSING_DISTRIBUTION" });
  });

  it("rejects a distribution with no registry_commit", () => {
    const result = checkApprovalFreshness({
      distribution: dist(null),
      events: [approval(1)],
    });
    expect(result).toMatchObject({ ok: false, reason: "MALFORMED_DISTRIBUTION" });
  });

  it("rejects a non-SHA anchor rather than coercing it", () => {
    const result = checkApprovalFreshness({
      distribution: dist("not-a-commit"),
      events: [approval(1)],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an approval carrying no usable commit", () => {
    const result = checkApprovalFreshness({
      distribution: dist(COMMIT_A),
      events: [approval(1, null)],
    });
    expect(result).toMatchObject({
      ok: false,
      reason: "MALFORMED_EVENT_PROVENANCE",
    });
  });

  it("is fresh with no approvals at all — the gate refuses on its own merits", () => {
    const result = checkApprovalFreshness({
      distribution: dist(COMMIT_A),
      events: [],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fresh).toBe(true);
    expect(result.event_commits).toEqual([]);
  });

  it("ignores non-participating events entirely", () => {
    // A withdrawal or rejection carries no authorisation, so it can
    // never make an otherwise fresh record stale.
    const result = checkApprovalFreshness({
      distribution: dist(COMMIT_A),
      events: [
        approval(1),
        { ...approval(2, COMMIT_B), decision: "rejected" },
        { ...approval(3, COMMIT_B), decision: "withdrawn" },
        { ...approval(4, COMMIT_B), approver_type: "SYSTEM" },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fresh).toBe(true);
  });

  it("is deterministic across repeated calls", () => {
    const input = { distribution: dist(COMMIT_A), events: [approval(1, COMMIT_B)] };
    expect(JSON.stringify(checkApprovalFreshness(input))).toBe(
      JSON.stringify(checkApprovalFreshness(input)),
    );
  });

  it("does not mutate its inputs", () => {
    const events = [approval(1, COMMIT_B)];
    const snapshot = JSON.stringify(events);
    checkApprovalFreshness({ distribution: dist(COMMIT_A), events });
    expect(JSON.stringify(events)).toBe(snapshot);
  });
});
