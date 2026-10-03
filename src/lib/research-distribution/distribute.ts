// ============================================================
// MyShape Protocol — MVDS distribution orchestrator
//
// The single place where governance and delivery meet, and the only
// component that is allowed to call both.
//
// THE ORDER IS THE FEATURE
//
//   create/reuse record  →  human approval  →  requestDistribution()
//                                              →  ALLOW?
//                                                 yes → deliver + record
//                                                 no  → STOP
//
// The adapter is unreachable unless `requestDistribution()` returned
// `kind: "ALLOW"`. That is enforced structurally: the adapter is
// stored in a local variable and only ever read inside the branch
// that ALLOW opens. There is no fallback path, no "publish anyway"
// flag, and no default outcome — a non-ALLOW result returns before
// any delivery object is constructed.
//
// GOVERNANCE IS NOT REIMPLEMENTED HERE
//
// `requestDistribution()` already performs read → derive → freshness
// → canDistribute → compose. This orchestrator calls it and trusts
// its verdict. Duplicating any of those checks here would create a
// second governance mechanism that could drift from the first.
//
// WHAT THE ORCHESTRATOR DOES NOT DO
//
// * it does not approve — `recordApproval` only exists so the real
//   workflow has a seam, and it delegates entirely to the approval
//   writer;
// * it does not derive governance state;
// * it does not resolve provenance — the caller supplies an
//   already-resolved `registry_commit` from `resolveRegistryCommit()`;
// * it does not send anything itself;
// * it does not write approval or attempt rows directly.
//
// RECIPIENTS ARE ALWAYS EXPLICIT
//
// `recipient` is a required input with no default, no list lookup
// and no broadcast option. The repository has no mailing list — the
// `subscribe` route writes to `protocol_nodes`, not to a research
// distribution audience — so inventing one here would fabricate an
// audience the operator never chose. An absent recipient is an
// INVALID_INPUT, not a reason to fall back to anyone.
// ============================================================

import type { DeliveryAdapter, DeliveryContent, DeliveryTarget } from "./delivery-adapter";
import type { DistributionAttemptWriter } from "./attempt-store-supabase";
import type { DeliveryStateStore } from "./delivery-state-store";
import type { HumanApprovalWriter, ApprovalEvidence } from "./approval-store";
import {
  createDistribution,
  type DistributionCreateInput,
  type DistributionCreateResult,
  type DistributionRef,
  type DistributionWriter,
} from "./distribution-writer";
import {
  requestDistribution,
  type DistributionRepository,
} from "./distribution-service";

/** Everything the orchestrator needs, all injected. */
export interface MvdsDependencies {
  writer: DistributionWriter;
  repository: DistributionRepository;
  attempts: DistributionAttemptWriter;
  deliveryState: DeliveryStateStore;
  approvals: HumanApprovalWriter;
  adapter: DeliveryAdapter;
  /**
   * Injected so the orchestrator is deterministic under test. Never
   * `Date.now()` inline.
   */
  now: () => string;
}

/** The canonical research to distribute. */
export interface MvdsPublishRequest {
  /** Exactly the W1 create input; provenance already resolved. */
  distribution: DistributionCreateInput;
  /** Explicit external recipient. No default, no discovery. */
  recipient: string;
  subject: string;
  /** Rendered content. Persisted verbatim as `rendered_text`. */
  content: string;
  html?: string;
}

export type MvdsFailure =
  | "INVALID_INPUT"
  | "RECORD_NOT_PERSISTED"
  /** The governance path returned anything other than ALLOW. */
  | "NOT_AUTHORIZED"
  | "DELIVERY_STATE_ERROR"
  | "ATTEMPT_ERROR"
  | "DELIVERY_ERROR";

export type MvdsOutcome =
  | {
      ok: true;
      distributionId: number;
      distribution: DistributionRef;
      providerMessageId: string;
      deliveryState: "PUBLISHED";
    }
  | {
      ok: false;
      code: MvdsFailure;
      detail: string;
      distributionId?: number;
      /** Present only after an attempt was actually opened. */
      deliveryState?: string;
    };

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Record a human approval for an existing distribution.
 *
 * A thin delegation on purpose. It exists so the real workflow has a
 * named seam, but it performs no approval logic: the approval writer
 * sources provenance from the row and appends the event. Nothing here
 * sets governance_state — the derivation will, from the event.
 */
export async function recordApproval(
  approvals: HumanApprovalWriter,
  evidence: ApprovalEvidence,
): Promise<{ ok: true; eventId: number; registryCommit: string } | { ok: false; code: string; detail: string }> {
  return approvals.recordHumanApproval(evidence);
}

/**
 * Run one governed publication.
 *
 * Returns a value in every case; it does not throw for governance or
 * provider outcomes, because those are ordinary results that must be
 * recorded rather than exceptions that erase the audit trail.
 */
export async function distributeResearch(
  deps: MvdsDependencies,
  request: MvdsPublishRequest,
): Promise<MvdsOutcome> {
  const { writer, repository, attempts, deliveryState, adapter, now } = deps;

  // ---- 0. Input floor. No defaults, no inferred audience. ----
  if (typeof request.recipient !== "string" || request.recipient.trim() === "") {
    return {
      ok: false,
      code: "INVALID_INPUT",
      detail: "a publication requires an explicit recipient",
    };
  }

  // ---- 1. Create or reuse the lifecycle record (W1) ----
  const created: DistributionCreateResult = await createDistribution(
    writer,
    request.distribution,
  );
  if (!created.ok) {
    return {
      ok: false,
      code: created.code === "INVALID_INPUT" ? "INVALID_INPUT" : "RECORD_NOT_PERSISTED",
      detail: created.detail,
    };
  }

  const distributionId = created.distribution.distribution_id;

  // ---- 2. The existing governance path decides. Not reimplemented. ----
  const outcome = await requestDistribution(repository, {
    distributionId: String(distributionId),
  });

  if (outcome.kind !== "ALLOW") {
    // The adapter is not read on this path. Nothing was sent, no
    // attempt was opened, and delivery_state is untouched.
    return {
      ok: false,
      code: "NOT_AUTHORIZED",
      detail:
        outcome.kind === "REFUSED"
          ? `governance refused: ${outcome.reasons.join(", ")}`
          : outcome.kind === "SKIPPED_RETRY_BLOCKED"
            ? "a retry is blocked by the existing decision"
            : outcome.kind === "UNKNOWN"
              ? `governance was indeterminate: ${outcome.indeterminate} — ${outcome.detail}`
              : "governance did not authorize distribution",
      distributionId,
    };
  }

  // ---- 3. Authorized. From here delivery may proceed. ----
  const renderedText = request.content;

  const inFlight = await deliveryState.advance(distributionId, "IN_FLIGHT");
  if (!inFlight.ok) {
    return {
      ok: false,
      code: "DELIVERY_STATE_ERROR",
      detail: inFlight.detail,
      distributionId,
    };
  }

  try {
    await attempts.openAttempt({ distributionId, renderedText });
  } catch (error) {
    // The attempt log is the audit trail. If it cannot be opened the
    // delivery must not proceed — an unrecorded send is unsendable.
    await deliveryState.advance(distributionId, "FAILED");
    return {
      ok: false,
      code: "ATTEMPT_ERROR",
      detail: `could not open a delivery attempt: ${describe(error)}`,
      distributionId,
      deliveryState: "FAILED",
    };
  }

  const target: DeliveryTarget = {
    recipient: request.recipient,
    subject: request.subject,
  };
  const content: DeliveryContent = {
    text: renderedText,
    ...(request.html === undefined ? {} : { html: request.html }),
  };

  const delivered = await adapter.publish({
    distributionId: String(distributionId),
    target,
    content,
  });

  if (!delivered.ok) {
    try {
      await attempts.failAttempt({
        distributionId,
        renderedText,
        error: `${delivered.reason}: ${delivered.detail}`,
        completedAt: now(),
        reconciliationRequired: false,
      });
    } catch {
      // The provider failure stands even if the audit row could not
      // be written; the delivery state still records the failure.
    }
    const failed = await deliveryState.advance(distributionId, "FAILED");
    return {
      ok: false,
      code: "DELIVERY_ERROR",
      detail: `${delivered.reason}: ${delivered.detail}`,
      distributionId,
      deliveryState: failed.ok ? "FAILED" : failed.detail,
    };
  }

  try {
    await attempts.succeedAttempt({
      distributionId,
      renderedText,
      platformPostId: delivered.providerMessageId,
      completedAt: now(),
    });
  } catch (error) {
    // The message WAS accepted. Reporting FAILED would be false, and
    // re-sending would duplicate it. The record is left IN_FLIGHT for
    // human reconciliation — the one honest description.
    return {
      ok: false,
      code: "ATTEMPT_ERROR",
      detail:
        `the provider accepted the message (${delivered.providerMessageId}) ` +
        `but the attempt could not be recorded; it must be reconciled: ${describe(error)}`,
      distributionId,
      deliveryState: "IN_FLIGHT",
    };
  }

  const published = await deliveryState.advance(distributionId, "PUBLISHED");
  if (!published.ok) {
    // Sent and recorded, but the row could not advance. Never
    // re-send on this outcome: the message exists externally.
    return {
      ok: false,
      code: "DELIVERY_STATE_ERROR",
      detail: `delivered as ${delivered.providerMessageId} but: ${published.detail}`,
      distributionId,
      deliveryState: "IN_FLIGHT",
    };
  }

  return {
    ok: true,
    distributionId,
    distribution: created.distribution,
    providerMessageId: delivered.providerMessageId,
    deliveryState: "PUBLISHED",
  };
}
