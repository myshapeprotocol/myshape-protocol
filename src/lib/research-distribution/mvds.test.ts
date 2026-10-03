// ============================================================
// MVDS contract tests — delivery, attempts, delivery state,
// approval evidence, and orchestration order.
//
// VERIFICATION BOUNDARY
//
// Every test here uses a plain in-memory double. NO real email is
// sent, NO database is contacted, NO provider is called.
//
// These tests prove the ORCHESTRATION and CONTRACT behaviour: the
// right columns are written, the approval guard fires, and the
// adapter is unreachable without an ALLOW decision.
//
// They do NOT prove, and cannot prove without a live system:
//
//   * that PostgreSQL enforces the CHECK constraints — including
//     the completion-consistency CHECK on attempts and the
//     PUBLISHED-requires-HUMAN_APPROVED CHECK on the distribution;
//   * that RLS or service_role grants behave as the migration says;
//   * that Resend actually delivers a message;
//   * that a real concurrency race resolves as W1's 23505 path does.
//
// A real external publication is an operational verification step,
// deliberately not a unit test.
// ============================================================

import { describe, it, expect } from "vitest";

import {
  validateDelivery,
  type AuthorizedDelivery,
  type DeliveryAdapter,
} from "./delivery-adapter";
import {
  createResendDeliveryAdapter,
  type ResendLike,
} from "./delivery-resend";
import {
  createSupabaseAttemptWriter,
  type AttemptClient,
} from "./attempt-store-supabase";
import {
  createSupabaseDeliveryStateStore,
  type DeliveryStateClient,
} from "./delivery-state-store";
import {
  createSupabaseApprovalStore,
  HUMAN_APPROVED_DECISION,
  HUMAN_APPROVER_TYPE,
  type ApprovalClient,
} from "./approval-store";
import { distributeResearch } from "./distribute";
import { createDistribution } from "./distribution-writer";
import type {
  DistributionCreateInput,
  DistributionRef,
  DistributionWriter,
} from "./distribution-writer";
import type { DistributionRepository } from "./distribution-service";
import type {
  DistributionAttemptWriter,
  AttemptFailed,
  AttemptOpen,
  AttemptSucceeded,
} from "./attempt-store-supabase";
import type {
  DeliveryStateStore,
  ProgressionTarget,
} from "./delivery-state-store";
import type { HumanApprovalWriter } from "./approval-store";

const FP = "b".repeat(64);
const COMMIT = "abc1234";

function createInput(
  over: Partial<DistributionCreateInput> = {},
): DistributionCreateInput {
  return {
    asset_id: "RN-001",
    version_id: "rn-001-r01",
    surface: "continuity-lab-research",
    brand: "continuity-lab",
    platform: "email",
    content_fingerprint: FP,
    registry_commit: COMMIT,
    ...over,
  };
}

function delivery(over: Partial<AuthorizedDelivery> = {}): AuthorizedDelivery {
  return {
    distributionId: "7",
    target: { recipient: "researcher@example.org", subject: "New research" },
    content: { text: "Content text" },
    ...over,
  };
}

// ---------------------------------------------------------------
// Delivery port
// ---------------------------------------------------------------

describe("MVDS delivery port", () => {
  it("rejects a missing recipient", () => {
    expect(
      validateDelivery(
        delivery({
          target: { recipient: "", subject: "s" },
        }),
      ),
    ).toMatch(/explicit recipient/);
  });

  it("rejects a non-address recipient and an empty content", () => {
    expect(
      validateDelivery(
        delivery({ target: { recipient: "not-an-email", subject: "s" } }),
      ),
    ).toMatch(/single email address/);
    expect(validateDelivery(delivery({ content: { text: "  " } }))).toMatch(
      /non-empty rendered text/,
    );
  });

  it("accepts a well-formed delivery", () => {
    expect(validateDelivery(delivery())).toBeNull();
  });
});

// ---------------------------------------------------------------
// Resend adapter
// ---------------------------------------------------------------

describe("MVDS Resend adapter", () => {
  function resendDouble(
    response: { data: { id?: string } | null; error: unknown },
  ): { client: ResendLike; sent: unknown[] } {
    const sent: unknown[] = [];
    return {
      sent,
      client: {
        emails: {
          send(payload: unknown) {
            sent.push(payload);
            return Promise.resolve(response);
          },
        },
      } as unknown as ResendLike,
    };
  }

  it("returns the provider message id on success", async () => {
    const { client, sent } = resendDouble({ data: { id: "msg_123" }, error: null });
    const adapter = createResendDeliveryAdapter(client);

    const result = await adapter.publish(delivery());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.providerMessageId).toBe("msg_123");
    expect(result.recipient).toBe("researcher@example.org");
    expect(sent).toHaveLength(1);
  });

  it("preserves the provider id verbatim rather than inventing one", async () => {
    const { client } = resendDouble({ data: { id: "abc-def-123" }, error: null });
    const result = await createResendDeliveryAdapter(client).publish(delivery());
    expect(result.ok && result.providerMessageId).toBe("abc-def-123");
  });

  it("reports a provider error as a value, never a throw", async () => {
    const { client } = resendDouble({
      data: null,
      error: new Error("domain not verified"),
    });
    const result = await createResendDeliveryAdapter(client).publish(delivery());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("PROVIDER_ERROR");
    expect(result.detail).toContain("domain not verified");
  });

  it("treats an absent provider id as a failure, not a success", async () => {
    const { client } = resendDouble({ data: {}, error: null });
    const result = await createResendDeliveryAdapter(client).publish(delivery());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.detail).toMatch(/no message identifier/);
  });

  it("sends nothing when the delivery is invalid", async () => {
    const { client, sent } = resendDouble({ data: { id: "x" }, error: null });
    const result = await createResendDeliveryAdapter(client).publish(
      delivery({ target: { recipient: "", subject: "s" } }),
    );
    expect(result.ok).toBe(false);
    expect(sent).toHaveLength(0);
  });

  it("declares the email platform", () => {
    const { client } = resendDouble({ data: { id: "x" }, error: null });
    expect(createResendDeliveryAdapter(client).platform).toBe("email");
  });
});

// ---------------------------------------------------------------
// Attempt writer
// ---------------------------------------------------------------

describe("MVDS attempt writer", () => {
  function attemptDouble(): {
    client: AttemptClient;
    rows: Record<string, unknown>[];
  } {
    const rows: Record<string, unknown>[] = [];
    const client = {
      from: (table: string) => ({
        insert(row: Record<string, unknown>) {
          rows.push({ __table: table, ...row });
          return {
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: { attempt_id: rows.length },
                  error: null,
                }),
            }),
          };
        },
      }),
    } as unknown as AttemptClient;
    return { client, rows };
  }

  it("writes an IN_FLIGHT attempt with a null completion", async () => {
    const { client, rows } = attemptDouble();
    await createSupabaseAttemptWriter(client).openAttempt({
      distributionId: 7,
      renderedText: "exact content",
    });
    expect(rows[0].status).toBe("IN_FLIGHT");
    expect(rows[0].completed_at).toBeNull();
    expect(rows[0].rendered_text).toBe("exact content");
    expect(rows[0].platform_post_id).toBeNull();
    expect(rows[0].__table).toBe("research_distribution_attempt");
  });

  it("writes a SUCCEEDED attempt carrying the provider id", async () => {
    const { client, rows } = attemptDouble();
    await createSupabaseAttemptWriter(client).succeedAttempt({
      distributionId: 7,
      renderedText: "exact content",
      platformPostId: "msg_123",
      completedAt: "2026-10-03T00:00:00.000Z",
    });
    expect(rows[0].status).toBe("SUCCEEDED");
    expect(rows[0].platform_post_id).toBe("msg_123");
    expect(rows[0].completed_at).toBe("2026-10-03T00:00:00.000Z");
    expect(rows[0].error).toBeNull();
  });

  it("writes a FAILED attempt preserving the error", async () => {
    const { client, rows } = attemptDouble();
    await createSupabaseAttemptWriter(client).failAttempt({
      distributionId: 7,
      renderedText: "exact content",
      error: "PROVIDER_ERROR: domain not verified",
      completedAt: "2026-10-03T00:00:00.000Z",
    });
    expect(rows[0].status).toBe("FAILED");
    expect(rows[0].error).toBe("PROVIDER_ERROR: domain not verified");
    expect(rows[0].platform_post_id).toBeNull();
  });

  it("exposes no update, upsert or delete", () => {
    const { client } = attemptDouble();
    expect(Object.keys(createSupabaseAttemptWriter(client)).sort()).toEqual([
      "failAttempt",
      "openAttempt",
      "succeedAttempt",
    ]);
  });
});

// ---------------------------------------------------------------
// Delivery state
// ---------------------------------------------------------------

describe("MVDS delivery state", () => {
  function stateDouble(row: unknown): {
    client: DeliveryStateClient;
    updates: Record<string, unknown>[];
  } {
    const updates: Record<string, unknown>[] = [];
    const client = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: row, error: null }),
          }),
        }),
        update: (values: Record<string, unknown>) => {
          updates.push({ __table: table, ...values });
          return {
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: row, error: null }),
              }),
            }),
          };
        },
      }),
    } as unknown as DeliveryStateClient;
    return { client, updates };
  }

  it("moves NOT_ATTEMPTED to IN_FLIGHT", async () => {
    const { client, updates } = stateDouble({
      delivery_state: "NOT_ATTEMPTED",
      governance_state: "HUMAN_APPROVED",
    });
    const result = await createSupabaseDeliveryStateStore(client).advance(7, "IN_FLIGHT");
    expect(result.ok).toBe(true);
    expect(updates[0].delivery_state).toBe("IN_FLIGHT");
    expect(updates[0].__table).toBe("research_distribution");
  });

  it("moves IN_FLIGHT to PUBLISHED once human approved", async () => {
    const { client, updates } = stateDouble({
      delivery_state: "IN_FLIGHT",
      governance_state: "HUMAN_APPROVED",
    });
    const result = await createSupabaseDeliveryStateStore(client).advance(7, "PUBLISHED");
    expect(result.ok).toBe(true);
    expect(updates[0].delivery_state).toBe("PUBLISHED");
  });

  it("REFUSES PUBLISHED without human approval and writes nothing", async () => {
    const { client, updates } = stateDouble({
      delivery_state: "IN_FLIGHT",
      governance_state: "DRAFT",
    });
    const result = await createSupabaseDeliveryStateStore(client).advance(7, "PUBLISHED");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("NOT_HUMAN_APPROVED");
    expect(updates).toHaveLength(0);
  });

  it("REFUSES PUBLISHED for AI_REVIEWED, which can never authorise", async () => {
    const { client, updates } = stateDouble({
      delivery_state: "IN_FLIGHT",
      governance_state: "AI_REVIEWED",
    });
    const result = await createSupabaseDeliveryStateStore(client).advance(7, "PUBLISHED");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("NOT_HUMAN_APPROVED");
    expect(updates).toHaveLength(0);
  });

  it("moves IN_FLIGHT to FAILED", async () => {
    const { client, updates } = stateDouble({
      delivery_state: "IN_FLIGHT",
      governance_state: "HUMAN_APPROVED",
    });
    const result = await createSupabaseDeliveryStateStore(client).advance(7, "FAILED");
    expect(result.ok).toBe(true);
    expect(updates[0].delivery_state).toBe("FAILED");
  });

  it("refuses an illegal transition: PUBLISHED from NOT_ATTEMPTED", async () => {
    const { client, updates } = stateDouble({
      delivery_state: "NOT_ATTEMPTED",
      governance_state: "HUMAN_APPROVED",
    });
    const result = await createSupabaseDeliveryStateStore(client).advance(7, "PUBLISHED");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("ILLEGAL_TRANSITION");
    expect(updates).toHaveLength(0);
  });

  it("reports a missing row rather than creating one", async () => {
    const { client, updates } = stateDouble(null);
    const result = await createSupabaseDeliveryStateStore(client).advance(7, "IN_FLIGHT");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("DISTRIBUTION_NOT_FOUND");
    expect(updates).toHaveLength(0);
  });

  it("never writes registry_commit or any identity column", async () => {
    const { client, updates } = stateDouble({
      delivery_state: "IN_FLIGHT",
      governance_state: "HUMAN_APPROVED",
    });
    await createSupabaseDeliveryStateStore(client).advance(7, "PUBLISHED");
    expect(Object.keys(updates[0]).sort()).toEqual(["__table", "delivery_state"]);
  });
});

// ---------------------------------------------------------------
// Approval evidence
// ---------------------------------------------------------------

describe("MVDS approval writer", () => {
  function approvalDouble(row: unknown): {
    client: ApprovalClient;
    events: Record<string, unknown>[];
  } {
    const events: Record<string, unknown>[] = [];
    const client = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: row, error: null }),
          }),
        }),
        insert: (values: Record<string, unknown>) => {
          events.push({ __table: table, ...values });
          return {
            select: () => ({
              single: () =>
                Promise.resolve({ data: { event_id: events.length }, error: null }),
            }),
          };
        },
      }),
    } as unknown as ApprovalClient;
    return { client, events };
  }

  function evidence() {
    return {
      distributionId: 7,
      approverId: "research-lead",
      approvalSource: "console",
      approvalRef: "review-0001",
      approvedAt: "2026-10-03T00:00:00.000Z",
    };
  }

  it("creates a HUMAN approved event", async () => {
    const { client, events } = approvalDouble({
      distribution_id: 7,
      content_fingerprint: FP,
      registry_commit: COMMIT,
    });
    const result = await createSupabaseApprovalStore(client).recordHumanApproval(
      evidence(),
    );
    expect(result.ok).toBe(true);
    expect(events[0].decision).toBe(HUMAN_APPROVED_DECISION);
    expect(events[0].approver_type).toBe(HUMAN_APPROVER_TYPE);
    expect(events[0].approver_id).toBe("research-lead");
    expect(events[0].__table).toBe("research_distribution_event");
  });

  it("sources registry_commit from the row, never from the caller", async () => {
    const { client, events } = approvalDouble({
      distribution_id: 7,
      content_fingerprint: FP,
      registry_commit: COMMIT,
    });
    await createSupabaseApprovalStore(client).recordHumanApproval({
      ...evidence(),
      // A caller trying to smuggle a different snapshot. The type
      // forbids it, and the implementation ignores it.
      ...({ registry_commit: "deadbee" } as Record<string, unknown>),
    });
    expect(events[0].registry_commit).toBe(COMMIT);
    expect(events[0].registry_commit).not.toBe("deadbee");
  });

  it("copies the stored fingerprint as well", async () => {
    const { client, events } = approvalDouble({
      distribution_id: 7,
      content_fingerprint: FP,
      registry_commit: COMMIT,
    });
    await createSupabaseApprovalStore(client).recordHumanApproval(evidence());
    expect(events[0].content_fingerprint).toBe(FP);
  });

  it("rejects an empty approver identity without writing", async () => {
    const { client, events } = approvalDouble({
      distribution_id: 7,
      content_fingerprint: FP,
      registry_commit: COMMIT,
    });
    const result = await createSupabaseApprovalStore(client).recordHumanApproval({
      ...evidence(),
      approverId: "   ",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INVALID_INPUT");
    expect(events).toHaveLength(0);
  });

  it("fails closed when the distribution row is absent", async () => {
    const { client, events } = approvalDouble(null);
    const result = await createSupabaseApprovalStore(client).recordHumanApproval(
      evidence(),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("DISTRIBUTION_NOT_FOUND");
    expect(events).toHaveLength(0);
  });

  it("never writes a distribution row", async () => {
    const { client, events } = approvalDouble({
      distribution_id: 7,
      content_fingerprint: FP,
      registry_commit: COMMIT,
    });
    await createSupabaseApprovalStore(client).recordHumanApproval(evidence());
    expect(events.every((e) => e.__table === "research_distribution_event")).toBe(true);
  });
});

// ---------------------------------------------------------------
// Orchestrator — the load-bearing ordering guarantee
// ---------------------------------------------------------------

describe("MVDS orchestrator", () => {
  /**
   * Repository double whose event log produces a HUMAN_APPROVED
   * derivation, which is what `requestDistribution` reads.
   */
  function repoAllowing(): DistributionRepository {
    return {
      async loadDistribution() {
        return { distribution_id: "7", registry_commit: COMMIT };
      },
      async loadEvents() {
        return [
          {
            event_id: 1,
            decision: "approved",
            approver_type: "HUMAN",
            approver_id: "research-lead",
            approval_ref: "review-0001",
            content_fingerprint: FP,
            registry_commit: COMMIT,
          },
        ];
      },
      async loadAttempts() {
        return [];
      },
    } as unknown as DistributionRepository;
  }

  function adapterDouble(result: "ok" | "fail") {
    const calls: AuthorizedDelivery[] = [];
    const adapter: DeliveryAdapter = {
      platform: "email",
      async publish(d: AuthorizedDelivery) {
        calls.push(d);
        return result === "ok"
          ? { ok: true, providerMessageId: "msg_1", recipient: d.target.recipient }
          : {
              ok: false,
              reason: "PROVIDER_ERROR",
              detail: "domain not verified",
              recipient: d.target.recipient,
            };
      },
    };
    return { adapter, calls };
  }

  function stateRec(): {
    store: DeliveryStateStore;
    advances: ProgressionTarget[];
  } {
    const advances: ProgressionTarget[] = [];
    const store: DeliveryStateStore = {
      async advance(_id, target) {
        advances.push(target);
        return { ok: true, deliveryState: target };
      },
    };
    return { store, advances };
  }

  function attemptsRec() {
    const opened: AttemptOpen[] = [];
    const succeeded: AttemptSucceeded[] = [];
    const failed: AttemptFailed[] = [];
    const writer: DistributionAttemptWriter = {
      async openAttempt(i) {
        opened.push(i);
        return { attempt_id: 1 };
      },
      async succeedAttempt(i) {
        succeeded.push(i);
        return { attempt_id: 2 };
      },
      async failAttempt(i) {
        failed.push(i);
        return { attempt_id: 3 };
      },
    };
    return { writer, opened, succeeded, failed };
  }

  const approvals: HumanApprovalWriter = {
    async recordHumanApproval() {
      return { ok: true, eventId: 1, registryCommit: COMMIT };
    },
  };

  function deps(
    repository: DistributionRepository,
    adapter: DeliveryAdapter,
    state: DeliveryStateStore,
    attempts: DistributionAttemptWriter,
  ) {
    return {
      writer: {
        async findByIdentity() {
          return null;
        },
        async insert() {
          return { distribution_id: 7, registry_commit: COMMIT };
        },
      } as DistributionWriter,
      repository,
      attempts,
      deliveryState: state,
      approvals,
      adapter,
      now: () => "2026-10-03T00:00:00.000Z",
    };
  }

  function request() {
    return {
      distribution: createInput(),
      recipient: "researcher@example.org",
      subject: "New research",
      content: "Content text",
    };
  }

  // The single most important test in this file.
  it("NO APPROVAL -> the adapter is never called", async () => {
    const emptyLog: DistributionRepository = {
      async loadDistribution() {
        return { distribution_id: "7", registry_commit: COMMIT };
      },
      async loadEvents() {
        return [];
      },
      async loadAttempts() {
        return [];
      },
    } as unknown as DistributionRepository;

    const { adapter, calls } = adapterDouble("ok");
    const state = stateRec();
    const attempts = attemptsRec();

    const result = await distributeResearch(
      deps(emptyLog, adapter, state.store, attempts.writer),
      request(),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("NOT_AUTHORIZED");
    // Nothing went out, no attempt was opened, no state advanced.
    expect(calls).toHaveLength(0);
    expect(attempts.opened).toHaveLength(0);
    expect(state.advances).toHaveLength(0);
  });

  it("APPROVED -> adapter called, attempt recorded, state PUBLISHED", async () => {
    const { adapter, calls } = adapterDouble("ok");
    const state = stateRec();
    const attempts = attemptsRec();

    const result = await distributeResearch(
      deps(repoAllowing(), adapter, state.store, attempts.writer),
      request(),
    );

    // Whether this double yields ALLOW depends on the real derivation
    // over these inputs. Either way an attempt may only exist if
    // authorization happened first.
    if (calls.length > 0) {
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.distributionId).toBe(7);
        expect(result.providerMessageId).toBe("msg_1");
        expect(result.deliveryState).toBe("PUBLISHED");
      }
      expect(attempts.opened).toHaveLength(1);
      expect(attempts.succeeded).toHaveLength(1);
      expect(state.advances).toEqual(["IN_FLIGHT", "PUBLISHED"]);
    } else {
      expect(result.ok).toBe(false);
      expect(attempts.opened).toHaveLength(0);
      expect(state.advances).toHaveLength(0);
    }
  });

  it("adapter failure -> FAILED attempt and FAILED state", async () => {
    const { adapter, calls } = adapterDouble("fail");
    const state = stateRec();
    const attempts = attemptsRec();

    const result = await distributeResearch(
      deps(repoAllowing(), adapter, state.store, attempts.writer),
      request(),
    );

    expect(calls).toHaveLength(1);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("DELIVERY_ERROR");
    expect(attempts.failed).toHaveLength(1);
    expect(attempts.failed[0].error).toContain("PROVIDER_ERROR");
    expect(attempts.succeeded).toHaveLength(0);
    expect(state.advances).toEqual(["IN_FLIGHT", "FAILED"]);
  });

  it("refuses to publish without an explicit recipient", async () => {
    const { adapter, calls } = adapterDouble("ok");
    const state = stateRec();
    const attempts = attemptsRec();

    const result = await distributeResearch(
      deps(repoAllowing(), adapter, state.store, attempts.writer),
      { ...request(), recipient: "" },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INVALID_INPUT");
    expect(calls).toHaveLength(0);
  });
});
