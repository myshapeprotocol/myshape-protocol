// ============================================================
// MyShape Protocol — MVDS delivery port
//
// The single seam between the governance plane and the outside
// world. Everything external passes through here, and nothing
// external happens without passing through here.
//
// WHAT AN ADAPTER IS NOT
//
// An adapter does not decide whether distribution is allowed. That
// question is answered by `requestDistribution()` before this port
// is ever reached. An adapter that could answer it would be a
// second governance mechanism, which the migration forbids by
// design (locked decision 4):
//
//   CHECK (delivery_state <> 'PUBLISHED'
//       OR governance_state = 'HUMAN_APPROVED')
//
// An adapter also does not write governance state, does not create
// approval evidence, does not touch Registry provenance, and does
// not write the distribution row. It receives content that is
// already authorized and performs exactly one external action.
//
// WHY THE INPUT CARRIES NO AUTHORIZATION FLAG
//
// There is deliberately no `approved: true` parameter. An adapter
// cannot be handed permission by its own caller; it is only ever
// invoked after the governance chain returned ALLOW. Authorization
// lives in the record and in the decision, not in a value the
// adapter could be handed without the record.
//
// NO DATABASE ACCESS
//
// This port is pure shape. Implementations must not mutate
// anything — the orchestrator owns attempt and delivery-state
// persistence, so that an adapter cannot record its own success.
// ============================================================

/** Where a delivered artifact can be inspected afterwards. */
export interface DeliveryTarget {
  recipient: string;
  subject: string;
}

/** Exactly the content that was handed to the provider, verbatim. */
export interface DeliveryContent {
  /** Plain-text content. Persisted as `rendered_text`, unmodified. */
  text: string;
  /** Optional HTML alternative. */
  html?: string;
}

/**
 * One authorized delivery.
 *
 * `distributionId` is carried for audit correlation only. It is
 * NOT a licence: receiving this object proves nothing, because the
 * orchestrator is the only component that constructs one.
 */
export interface AuthorizedDelivery {
  distributionId: string;
  target: DeliveryTarget;
  content: DeliveryContent;
}

export type DeliveryFailureReason =
  /** The provider rejected or could not deliver the message. */
  | "PROVIDER_ERROR"
  /** Required configuration was absent. */
  | "NOT_CONFIGURED"
  /** The input itself was unusable before any network call. */
  | "INVALID_INPUT";

/**
 * The outcome of one external delivery attempt.
 *
 * A failure is a VALUE, never a throw: a provider outage is an
 * ordinary, expected event that must be recorded as FAILED rather
 * than crashing the orchestration and losing the audit trail.
 */
export type DeliveryResult =
  | {
      ok: true;
      /** Provider-assigned identifier, preserved verbatim for audit. */
      providerMessageId: string;
      recipient: string;
    }
  | {
      ok: false;
      reason: DeliveryFailureReason;
      /** Human-readable, safe to persist in the attempt's `error`. */
      detail: string;
      recipient: string;
    };

/**
 * The one method MVDS needs from a platform.
 *
 * No `supports()`, no `preview()`, no `retry()`. Each would be an
 * abstraction for a problem the first publication does not have.
 */
export interface DeliveryAdapter {
  /** Identifies the channel in the attempt row. */
  readonly platform: string;

  /**
   * Perform the external delivery.
   *
   * Implementations MUST NOT throw for provider failures. Returning
   * `{ ok: false }` is how a failed publication is represented.
   */
  publish(delivery: AuthorizedDelivery): Promise<DeliveryResult>;
}

/**
 * Validate the delivery before any provider call.
 *
 * Kept here, not in the adapter, so every adapter inherits the same
 * floor and none can be the component that decides what counts as
 * deliverable content.
 */
export function validateDelivery(
  delivery: AuthorizedDelivery,
): string | null {
  const { recipient, subject } = delivery.target ?? ({} as DeliveryTarget);
  const { text } = delivery.content ?? ({} as DeliveryContent);

  if (typeof recipient !== "string" || recipient.trim() === "") {
    return "a delivery requires an explicit recipient";
  }
  // The cheapest real check that an address is an address. Not a
  // deliverability proof — that is what the provider is for.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.trim())) {
    return "recipient is not a single email address";
  }
  if (typeof subject !== "string" || subject.trim() === "") {
    return "a delivery requires a subject";
  }
  if (typeof text !== "string" || text.trim() === "") {
    return "a delivery requires non-empty rendered text";
  }
  return null;
}
