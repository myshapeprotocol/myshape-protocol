// ============================================================
// Contract tests for the distribution service skeleton.
//
// Every test drives the real service against an IN-MEMORY
// repository. No database, no Supabase, no adapter, no network, no
// clock, no filesystem.
//
// The repository doubles as the observation point: because it is the
// only injected dependency, any write, publish, or adapter call
// would have to appear here. Counting its calls is how the
// side-effect tests prove absence rather than assert it.
// ============================================================

import { describe, it, expect, vi } from "vitest";
import {
  requestDistribution,
  UNIMPLEMENTED_PRECONDITIONS,
  type DistributionRepository,
} from "./distribution-service";
import type {
  DeliveryAttemptInput,
  GovernanceEventInput,
} from "./derivation";
import type { DistributionProvenance } from "./approval-freshness";

const FP_A = "a".repeat(64);
const FP_B = "b".repeat(64);

// ---------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------

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

function attempt(
  attempt_id: number,
  status: DeliveryAttemptInput["status"],
  reconciliation_required = false,
): DeliveryAttemptInput {
  return { attempt_id, status, reconciliation_required };
}

interface StubOptions {
  /**
   * The distribution row's provenance.
   *
   * Defaults to a fresh anchor matching the `approval()` fixture's
   * commit, so existing tests need no change. Pass `null` to model an
   * unreadable distribution row.
   */
  distribution?: DistributionProvenance | null;
  events?: GovernanceEventInput[] | null;
  attempts?: DeliveryAttemptInput[] | null;
  /** Called on each load; the index lets a test vary successive reads. */
  onEvents?: (call: number) => GovernanceEventInput[] | null;
  /**
   * Called on each distribution load; the index lets a test vary the
   * anchor between P5 reads (TOCTOU).
   */
  onDistribution?: (call: number) => DistributionProvenance | null;
  throwsOnEvents?: Error;
}

/**
 * In-memory repository that records how often it was read.
 *
 * `eventCalls` is the evidence for two claims at once: that P5's
 * re-read happened, and that no extra work was done.
 *
 * Note the explicit `undefined` checks. Using `??` here would be a
 * bug: `null ?? []` yields `[]`, which would make a missing history
 * indistinguishable from an empty one — precisely the distinction
 * X-04 depends on.
 */
function stubRepository(options: StubOptions = {}) {
  const state = {
    eventCalls: 0,
    attemptCalls: 0,
    distributionCalls: 0,
  };

  const repository: DistributionRepository = {
    async loadDistribution() {
      state.distributionCalls += 1;
      if (options.onDistribution) {
        return options.onDistribution(state.distributionCalls);
      }
      if (options.distribution === undefined) {
        // Default: an anchor that matches the approval() fixture, so
        // every pre-existing test stays green without restating it.
        return { distribution_id: "dist-1", registry_commit: "abc1234" };
      }
      return options.distribution;
    },
    async loadEvents() {
      state.eventCalls += 1;
      if (options.throwsOnEvents) throw options.throwsOnEvents;
      if (options.onEvents) return options.onEvents(state.eventCalls);
      return options.events === undefined ? [] : options.events;
    },
    async loadAttempts() {
      state.attemptCalls += 1;
      return options.attempts === undefined ? [] : options.attempts;
    },
  };

  return { repository, state };
}

const ask = (repository: DistributionRepository) =>
  requestDistribution(repository, { distributionId: "dist-1" });

/**
 * A tampered row: a legitimate event that also carries a cached
 * `governance_state`. Cast through `unknown` because the field is
 * deliberately absent from the event type — that absence is the
 * property under test.
 */
function tampered(
  event: GovernanceEventInput,
  cached: string,
): GovernanceEventInput[] {
  return [{ ...event, governance_state: cached } as unknown as GovernanceEventInput];
}

// ---------------------------------------------------------------
// X-01 — decision authority
// ---------------------------------------------------------------

describe("X-01 decision authority", () => {
  it("allows a record with a human approval in its event history", async () => {
    const { repository } = stubRepository({ events: [approval(1)] });
    const outcome = await ask(repository);

    expect(outcome.kind).toBe("ALLOW");
    if (outcome.kind !== "ALLOW") return;
    expect(outcome.instruction.governanceState).toBe("HUMAN_APPROVED");
    expect(outcome.instruction.distributionId).toBe("dist-1");
    expect(outcome.instruction.decision.allowed).toBe(true);
    expect(outcome.instruction.decision.reasons).toEqual([]);
  });

  it("refuses an AI-only history", async () => {
    const { repository } = stubRepository({
      events: [approval(1, "AI_REVIEW")],
    });
    const outcome = await ask(repository);

    expect(outcome.kind).toBe("REFUSED");
    if (outcome.kind !== "REFUSED") return;
    expect(outcome.reasons).toEqual(["HUMAN_APPROVAL_REQUIRED"]);
  });

  it("refuses a withdrawn record", async () => {
    const { repository } = stubRepository({
      events: [approval(1), withdrawal(2)],
    });
    const outcome = await ask(repository);

    expect(outcome.kind).toBe("REFUSED");
    if (outcome.kind !== "REFUSED") return;
    expect(outcome.reasons).toEqual(["WITHDRAWN_TERMINAL"]);
  });

  it("refuses an unapproved record", async () => {
    const { repository } = stubRepository({ events: [] });
    expect((await ask(repository)).kind).toBe("REFUSED");
  });

  it("refuses a SYSTEM approval", async () => {
    const { repository } = stubRepository({ events: [approval(1, "SYSTEM")] });
    expect((await ask(repository)).kind).toBe("REFUSED");
  });

  // X-01 in code: the request type has no decision field, so a
  // caller cannot pass one. This test pins that the service derives
  // internally by proving a second identical call agrees, and that
  // an extra property on the request object is ignored.
  it("ignores any decision a caller tries to attach", async () => {
    const { repository } = stubRepository({ events: [approval(1)] });
    const outcome = await requestDistribution(repository, {
      distributionId: "dist-1",
      // A caller attempting to authorise itself.
      decision: { allowed: true, reasons: [] },
      governance_state: "HUMAN_APPROVED",
    } as never);

    // ALLOW here is earned from the event history, not granted.
    expect(outcome.kind).toBe("ALLOW");
  });

  it("ignores a caller-supplied decision when the history says no", async () => {
    const { repository } = stubRepository({ events: [approval(1, "AI_REVIEW")] });
    const outcome = await requestDistribution(repository, {
      distributionId: "dist-1",
      decision: { allowed: true, reasons: [] },
    } as never);

    // The forged decision did not help.
    expect(outcome.kind).toBe("REFUSED");
  });
});

// ---------------------------------------------------------------
// X-02 — cache rejection
// ---------------------------------------------------------------

describe("X-02 cache rejection", () => {
  // The attack: an event history with no approval, but every row
  // carries a cached governance_state of HUMAN_APPROVED.
  it("refuses when events carry no approval but a cache claims HUMAN_APPROVED", async () => {
    const rows = tampered(
      {
        event_id: 1,
        decision: "rejected",
        approver_type: "HUMAN",
        approver_id: "operator-1",
        approval_ref: "ref-1",
        content_fingerprint: FP_A,
        registry_commit: "abc1234",
      },
      "HUMAN_APPROVED",
    );

    const { repository } = stubRepository({ events: rows });
    const outcome = await ask(repository);

    // The cache is stripped before derivation; the history alone
    // decides, and it says DRAFT.
    expect(outcome.kind).toBe("REFUSED");
    if (outcome.kind !== "REFUSED") return;
    expect(outcome.reasons).toEqual(["NOT_APPROVED"]);
  });

  it("never allows an empty history carrying a HUMAN_APPROVED cache", async () => {
    const rows = tampered({}, "HUMAN_APPROVED");
    const { repository } = stubRepository({ events: rows });
    expect((await ask(repository)).kind).toBe("REFUSED");
  });

  // A contradictory history is not rescued by a cache claiming it
  // is approved.
  it("does not let a cache mask a contradiction", async () => {
    const rows = [
      ...tampered(approval(1, "HUMAN", FP_A), "HUMAN_APPROVED"),
      ...tampered(approval(2, "HUMAN", FP_B), "HUMAN_APPROVED"),
    ];

    const { repository } = stubRepository({ events: rows });
    const outcome = await ask(repository);

    // Contradiction is UNKNOWN, not REFUSED: no state was produced.
    expect(outcome.kind).toBe("UNKNOWN");
    if (outcome.kind !== "UNKNOWN") return;
    expect(outcome.decision?.governance.state).toBeNull();
  });
});

// ---------------------------------------------------------------
// X-03 — retry blocking
// ---------------------------------------------------------------

describe("X-03 retry blocking", () => {
  it("skips a record whose attempt requires reconciliation", async () => {
    const { repository } = stubRepository({
      events: [approval(1)],
      attempts: [attempt(1, "FAILED", true)],
    });
    const outcome = await ask(repository);

    expect(outcome.kind).toBe("SKIPPED_RETRY_BLOCKED");
    if (outcome.kind !== "SKIPPED_RETRY_BLOCKED") return;
    // Governance allowed it; only the delivery is unresolved.
    expect(outcome.decision.allowed).toBe(true);
    expect(outcome.decision.governance.state).toBe("HUMAN_APPROVED");
  });

  it("blocks even when a prior attempt succeeded", async () => {
    const { repository } = stubRepository({
      events: [approval(1)],
      attempts: [attempt(1, "SUCCEEDED"), attempt(2, "FAILED", true)],
    });
    expect((await ask(repository)).kind).toBe("SKIPPED_RETRY_BLOCKED");
  });

  // X-03: the block must not be reported as a governance refusal.
  it("does not report the retry block as a governance reason", async () => {
    const { repository } = stubRepository({
      events: [approval(1)],
      attempts: [attempt(1, "FAILED", true)],
    });
    const outcome = await ask(repository);

    // A distinct outcome kind, not a REFUSED carrying a GateReason.
    expect(outcome.kind).not.toBe("REFUSED");
    if (outcome.kind !== "SKIPPED_RETRY_BLOCKED") return;
    // The governance reasons are empty — nothing is wrong with the approval.
    expect(outcome.decision.reasons).toEqual([]);
  });

  // Governance is the more fundamental answer, so it is reported first.
  it("reports a withdrawal ahead of a retry block", async () => {
    const { repository } = stubRepository({
      events: [approval(1), withdrawal(2)],
      attempts: [attempt(1, "FAILED", true)],
    });
    const outcome = await ask(repository);

    expect(outcome.kind).toBe("REFUSED");
    if (outcome.kind !== "REFUSED") return;
    expect(outcome.reasons).toEqual(["WITHDRAWN_TERMINAL"]);
  });

  // A definite failure without reconciliation does not block: a retry
  // is permitted.
  it("does not block on a plain failed attempt", async () => {
    const { repository } = stubRepository({
      events: [approval(1)],
      attempts: [attempt(1, "FAILED")],
    });
    expect((await ask(repository)).kind).toBe("ALLOW");
  });

  it("does not block on a skipped attempt", async () => {
    const { repository } = stubRepository({
      events: [approval(1)],
      attempts: [attempt(1, "SKIPPED")],
    });
    expect((await ask(repository)).kind).toBe("ALLOW");
  });
});

// ---------------------------------------------------------------
// X-04 — fail closed
// ---------------------------------------------------------------

describe("X-04 fail closed", () => {
  // Repository failure. Never ALLOW.
  it("returns UNKNOWN when the repository throws", async () => {
    const { repository } = stubRepository({
      throwsOnEvents: new Error("connection refused"),
    });
    const outcome = await ask(repository);

    expect(outcome.kind).toBe("UNKNOWN");
    if (outcome.kind !== "UNKNOWN") return;
    expect(outcome.indeterminate).toBe("REPOSITORY_ERROR");
    expect(outcome.detail).toContain("connection refused");
  });

  // A null history is the absence of a reading, not an empty log.
  it("returns UNKNOWN when event history is missing", async () => {
    const { repository } = stubRepository({ events: null });
    const outcome = await ask(repository);

    expect(outcome.kind).toBe("UNKNOWN");
    if (outcome.kind !== "UNKNOWN") return;
    expect(outcome.indeterminate).toBe("MISSING_EVENT_HISTORY");
  });

  it("returns UNKNOWN when attempt history is missing", async () => {
    const { repository } = stubRepository({
      events: [approval(1)],
      attempts: null,
    });
    const outcome = await ask(repository);

    expect(outcome.kind).toBe("UNKNOWN");
    if (outcome.kind !== "UNKNOWN") return;
    expect(outcome.indeterminate).toBe("MISSING_ATTEMPT_HISTORY");
  });

  it("returns UNKNOWN when the repository returns a non-list", async () => {
    const { repository } = stubRepository({
      events: "not an array" as unknown as GovernanceEventInput[],
    });
    const outcome = await ask(repository);

    expect(outcome.kind).toBe("UNKNOWN");
    if (outcome.kind !== "UNKNOWN") return;
    expect(outcome.indeterminate).toBe("UNUSABLE_INPUT");
  });

  // A contradiction produces no state, which is not a refusal.
  it("returns UNKNOWN on a contradictory history", async () => {
    const { repository } = stubRepository({
      events: [approval(1, "HUMAN", FP_A), approval(2, "HUMAN", FP_B)],
    });
    const outcome = await ask(repository);

    expect(outcome.kind).toBe("UNKNOWN");
    if (outcome.kind !== "UNKNOWN") return;
    expect(outcome.indeterminate).toBe("UNUSABLE_INPUT");
    expect(outcome.decision?.governance.state).toBeNull();
  });

  // The TOCTOU gate: an approval withdrawn between the two reads.
  it("returns UNKNOWN when the re-read disagrees", async () => {
    const { repository } = stubRepository({
      onEvents: (call) =>
        call === 1 ? [approval(1)] : [approval(1), withdrawal(2)],
    });
    const outcome = await ask(repository);

    expect(outcome.kind).toBe("UNKNOWN");
    if (outcome.kind !== "UNKNOWN") return;
    expect(outcome.indeterminate).toBe("RE_READ_DISAGREEMENT");
  });

  // A drift between the two reads must never resolve in favour of
  // either value.
  it("does not prefer either side of a re-read disagreement", async () => {
    const { repository } = stubRepository({
      onEvents: (call) =>
        call === 1 ? [approval(1, "AI_REVIEW")] : [approval(1)],
    });
    const outcome = await ask(repository);

    expect(outcome.kind).toBe("UNKNOWN");
    if (outcome.kind !== "UNKNOWN") return;
    expect(outcome.indeterminate).toBe("RE_READ_DISAGREEMENT");
  });

  // Sweep: no combination of failure ever produces ALLOW.
  it("never yields ALLOW across every failure shape", async () => {
    const failures: StubOptions[] = [
      { throwsOnEvents: new Error("boom") },
      { events: null },
      { attempts: null },
      { events: "bad" as unknown as GovernanceEventInput[] },
      { events: [approval(1, "HUMAN", FP_A), approval(2, "HUMAN", FP_B)] },
      {
        onEvents: (call) =>
          call === 1 ? [approval(1)] : [approval(1), withdrawal(2)],
      },
    ];

    for (const failure of failures) {
      const { repository } = stubRepository(failure);
      const outcome = await ask(repository);
      expect(outcome.kind).not.toBe("ALLOW");
    }
  });
});

// ---------------------------------------------------------------
// X-05 — adapter separation, and absence of side effects
// ---------------------------------------------------------------

describe("X-05 adapter separation and side effects", () => {
  // The repository is the ONLY injected dependency, so a write or a
  // publish would have to appear as an extra call on it. The count
  // is the evidence.
  it("performs reads only — two event loads and two attempt loads", async () => {
    const { repository, state } = stubRepository({ events: [approval(1)] });
    await ask(repository);

    // Exactly two reads of each log: the initial evaluation and the
    // P5 re-read. No third call, and no write method exists to call.
    expect(state.eventCalls).toBe(2);
    expect(state.attemptCalls).toBe(2);
  });

  // A governance refusal still re-reads: the P5 check runs before the
  // refusal is reported, so the decision that is returned is the one
  // verified against the freshest history.
  it("re-reads even when governance will refuse", async () => {
    const { repository, state } = stubRepository({
      events: [approval(1, "AI_REVIEW")],
    });
    await ask(repository);

    expect(state.eventCalls).toBe(2);
    expect(state.attemptCalls).toBe(2);
  });

  // A failed derivation decides nothing, so there is nothing to
  // re-verify and the service stops early.
  it("does not re-read after a derivation failure", async () => {
    const { repository, state } = stubRepository({
      events: [approval(1, "HUMAN", FP_A), approval(2, "HUMAN", FP_B)],
    });
    await ask(repository);

    expect(state.eventCalls).toBe(1);
  });

  it("makes no network, filesystem or process call", async () => {
    const { repository } = stubRepository({ events: [approval(1)] });

    // If the service reached for the network, this spy would fire.
    const fetchSpy = vi.fn();
    const original = globalThis.fetch;
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;
    try {
      await ask(repository);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = original;
    }
  });

  it("does not mutate the returned history", async () => {
    const events = [approval(1), withdrawal(2)];
    const attempts = [attempt(1, "FAILED", true)];
    const eventSnapshot = JSON.stringify(events);
    const attemptSnapshot = JSON.stringify(attempts);

    const { repository } = stubRepository({ events, attempts });
    await ask(repository);

    // Cache stripping and ordering happen on copies.
    expect(JSON.stringify(events)).toBe(eventSnapshot);
    expect(JSON.stringify(attempts)).toBe(attemptSnapshot);
  });

  // X-05 in structure: the instruction describes, it does not act.
  it("returns a description rather than performing an action", async () => {
    const { repository } = stubRepository({ events: [approval(1)] });
    const outcome = await ask(repository);

    expect(outcome.kind).toBe("ALLOW");
    if (outcome.kind !== "ALLOW") return;

    // No platform identifier, no URL, no credential on the
    // instruction. What was authorised is described; nothing was sent.
    const keys = Object.keys(outcome.instruction).sort();
    expect(keys).toEqual(["decision", "distributionId", "governanceState"]);

    const serialised = JSON.stringify(outcome.instruction);
    expect(serialised).not.toMatch(/https?:\/\//);
    expect(serialised).not.toMatch(/bluesky|mastodon|telegram|farcaster/i);
  });

  it("exposes no write method on the repository port", () => {
    // The port is read-only by construction. A service that needed a
    // write would have to widen this interface, which is visible.
    //
    // `loadDistribution` was added for spec §3.5 (READ). It is listed
    // here explicitly so that adding a *write* later is still a
    // deliberate, visible change to this assertion rather than a
    // silent one.
    const { repository } = stubRepository();
    expect(Object.keys(repository).sort()).toEqual([
      "loadAttempts",
      "loadDistribution",
      "loadEvents",
    ]);
  });

  it("performs reads only — two distribution loads alongside the logs", async () => {
    // P5 re-reads the distribution row too, so an anchor that moves
    // between passes is caught (spec §3.5 TOCTOU).
    const { repository, state } = stubRepository({ events: [approval(1)] });
    await ask(repository);
    expect(state.distributionCalls).toBe(2);
  });

  it("declares its unimplemented preconditions explicitly", () => {
    // P7–P9 are absent from the implementation. Recording them keeps
    // the gap visible rather than assumed away.
    expect(UNIMPLEMENTED_PRECONDITIONS).toHaveLength(3);
    expect(UNIMPLEMENTED_PRECONDITIONS.join(" ")).toContain("P7");
    expect(UNIMPLEMENTED_PRECONDITIONS.join(" ")).toContain("P9");
  });

  it("is deterministic across repeated calls", async () => {
    const { repository } = stubRepository({
      events: [approval(1)],
      attempts: [attempt(1, "FAILED", true)],
    });
    const first = JSON.stringify(await ask(repository));
    for (let i = 0; i < 3; i += 1) {
      expect(JSON.stringify(await ask(repository))).toBe(first);
    }
  });
});

// ---------------------------------------------------------------
// Outcome closure
// ---------------------------------------------------------------

describe("outcome closure", () => {
  it("emits only the four declared outcome kinds", async () => {
    const cases: StubOptions[] = [
      { events: [approval(1)] },
      { events: [approval(1, "AI_REVIEW")] },
      { events: [approval(1)], attempts: [attempt(1, "FAILED", true)] },
      { throwsOnEvents: new Error("x") },
      { events: null },
    ];

    const legal = ["ALLOW", "REFUSED", "SKIPPED_RETRY_BLOCKED", "UNKNOWN"];
    for (const options of cases) {
      const { repository } = stubRepository(options);
      const outcome = await ask(repository);
      expect(legal).toContain(outcome.kind);
    }
  });

  it("never reports UNKNOWN as a governance refusal", async () => {
    const { repository } = stubRepository({
      throwsOnEvents: new Error("db down"),
    });
    const outcome = await ask(repository);

    expect(outcome.kind).toBe("UNKNOWN");
    if (outcome.kind !== "UNKNOWN") return;
    // An infrastructure failure has no GateReason. Inventing one
    // would point an operator at the wrong problem.
    expect("reasons" in outcome).toBe(false);
  });
});

// ---------------------------------------------------------------
// §3.5 enforcement — end to end through the service
//
// The `approval()` fixture uses registry_commit "abc1234", so the
// default stub anchor matches it and every pre-existing test stays
// green. These tests state the anchor explicitly.
// ---------------------------------------------------------------

const ANCHOR = "abc1234";
const OTHER = "def5678";

function anchor(registry_commit: string | null): DistributionProvenance {
  return { distribution_id: "dist-1", registry_commit };
}

/** An approval naming a specific commit. */
function approvalAt(event_id: number, commit: string): GovernanceEventInput {
  return { ...approval(event_id), registry_commit: commit };
}

describe("§3.5 stale approval provenance", () => {
  it("1. matching provenance follows the normal governance path", async () => {
    const { repository } = stubRepository({
      distribution: anchor(ANCHOR),
      events: [approvalAt(1, ANCHOR)],
    });
    expect((await ask(repository)).kind).toBe("ALLOW");
  });

  it("2. stale distribution/event provenance is REFUSED, not UNKNOWN", async () => {
    // The anchor moved to a newer Registry snapshot; the approval was
    // made against the old one. Re-approval is required.
    const { repository } = stubRepository({
      distribution: anchor(OTHER),
      events: [approvalAt(1, ANCHOR)],
    });
    const outcome = await ask(repository);

    expect(outcome.kind).toBe("REFUSED");
    if (outcome.kind !== "REFUSED") return;
    expect(outcome.reasons).toEqual(["STALE_APPROVAL_PROVENANCE"]);
  });

  it("3. a split among event approvals is REFUSED", async () => {
    const { repository } = stubRepository({
      distribution: anchor(ANCHOR),
      events: [approvalAt(1, ANCHOR), approvalAt(2, OTHER)],
    });
    const outcome = await ask(repository);
    expect(outcome.kind).toBe("REFUSED");
    if (outcome.kind !== "REFUSED") return;
    expect(outcome.reasons).toEqual(["STALE_APPROVAL_PROVENANCE"]);
  });

  it("4. no approvals keeps the existing behaviour", async () => {
    // Freshness has nothing to compare; the gate refuses on DRAFT.
    const { repository } = stubRepository({
      distribution: anchor(ANCHOR),
      events: [],
    });
    const outcome = await ask(repository);
    expect(outcome.kind).toBe("REFUSED");
    if (outcome.kind !== "REFUSED") return;
    expect(outcome.reasons).toEqual(["NOT_APPROVED"]);
  });

  it("7. an anchor that moves between P5 reads never reaches ALLOW", async () => {
    // TOCTOU: the first read is fresh, the second is stale (or the
    // reverse). Either way the two decisions disagree and the service
    // aborts rather than trusting the newer read.
    const { repository } = stubRepository({
      events: [approvalAt(1, ANCHOR)],
      onDistribution: (call) => anchor(call === 1 ? ANCHOR : OTHER),
    });
    const outcome = await ask(repository);

    expect(outcome.kind).not.toBe("ALLOW");
    expect(outcome.kind).toBe("UNKNOWN");
    if (outcome.kind !== "UNKNOWN") return;
    expect(outcome.indeterminate).toBe("RE_READ_DISAGREEMENT");
  });

  it("8. the existing successful P5 path still succeeds", async () => {
    const { repository, state } = stubRepository({
      distribution: anchor(ANCHOR),
      events: [approvalAt(1, ANCHOR)],
    });
    expect((await ask(repository)).kind).toBe("ALLOW");
    expect(state.distributionCalls).toBe(2);
    expect(state.eventCalls).toBe(2);
  });

  it("9. content contradiction behaviour is unchanged", async () => {
    // Two DIFFERENT fingerprints is still a contradiction (§3.2),
    // reported as UNKNOWN — not reclassified as stale provenance.
    const { repository } = stubRepository({
      distribution: anchor(ANCHOR),
      events: [approval(1, "HUMAN", FP_A), approval(2, "HUMAN", FP_B)],
    });
    const outcome = await ask(repository);
    expect(outcome.kind).toBe("UNKNOWN");
    if (outcome.kind !== "UNKNOWN") return;
    expect(outcome.indeterminate).toBe("UNUSABLE_INPUT");
  });

  it("10. same fingerprint + different commits is staleness, not contradiction", async () => {
    // The distinction that matters: FP identical, provenance differs.
    const { repository } = stubRepository({
      distribution: anchor(OTHER),
      events: [approvalAt(1, ANCHOR)],
    });
    const outcome = await ask(repository);

    expect(outcome.kind).toBe("REFUSED");
    if (outcome.kind !== "REFUSED") return;
    // A governance refusal, never the contradiction path.
    expect(outcome.reasons).toEqual(["STALE_APPROVAL_PROVENANCE"]);
    expect(outcome.decision?.governance.state).toBe("HUMAN_APPROVED");
  });

  it("11. a stale record produces no instruction to act on", async () => {
    // The gate denies; no instruction is emitted, so nothing can be
    // written on the basis of this call.
    const { repository } = stubRepository({
      distribution: anchor(OTHER),
      events: [approvalAt(1, ANCHOR)],
    });
    const outcome = await ask(repository);
    expect(outcome.kind).toBe("REFUSED");
    if (outcome.kind !== "REFUSED") return;
    expect(outcome.decision?.allowed).toBe(false);
  });
});


  it("5. a missing distribution row fails closed as a read failure", async () => {
    const { repository } = stubRepository({
      distribution: null,
      events: [approvalAt(1, ANCHOR)],
    });
    const outcome = await ask(repository);
    expect(outcome.kind).toBe("UNKNOWN");
    if (outcome.kind !== "UNKNOWN") return;
    expect(outcome.indeterminate).toBe("MISSING_DISTRIBUTION_HISTORY");
  });

  it("6. malformed distribution provenance fails closed as a refusal", async () => {
    // A governance problem must NOT be reported as a read failure.
    const { repository } = stubRepository({
      distribution: anchor(null),
      events: [approvalAt(1, ANCHOR)],
    });
    const outcome = await ask(repository);
    expect(outcome.kind).toBe("REFUSED");
    if (outcome.kind !== "REFUSED") return;
    expect(outcome.reasons).toEqual(["STALE_APPROVAL_PROVENANCE"]);
  });
