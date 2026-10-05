// ============================================================
// MyShape Protocol — MVDS Resend delivery adapter
//
// The one external channel MVDS needs to reach the outside world.
//
// WHY EMAIL FIRST
//
// `resend` is already a production dependency, already configured
// via RESEND_API_KEY / RESEND_FROM_EMAIL, and already proven by
// `api/subscribe/route.ts` and `api/send-otp/route.ts`. Choosing
// it adds no dependency and no credential. The six social adapters
// in `api/matrix/publish/route.ts` were disabled by governance
// (2G-Z0-R1) precisely because they bypassed the chain; they stay
// disabled. This adapter is the governed replacement for exactly
// one of them, reached only after ALLOW.
//
// FOLLOWING THE EXISTING CONVENTION
//
// Client construction and environment handling mirror
// `api/subscribe/route.ts`: construct with the key, read
// RESEND_FROM_EMAIL with the same fallback, and read
// `{ data, error }` from `emails.send()` rather than throwing.
//
// THE ONE RULE
//
// This module performs delivery and nothing else. It writes no row,
// sets no state, creates no approval, and reads no Registry. Its
// only outputs are the values the orchestrator records. If it could
// mark a distribution published, a provider success would become
// authorization by side effect — exactly the failure mode
// governance removed.
// ============================================================

import {
  validateDelivery,
  type AuthorizedDelivery,
  type DeliveryAdapter,
  type DeliveryResult,
} from "./delivery-adapter";

/**
 * The subset of the Resend client this adapter uses.
 *
 * Structurally typed so unit tests can inject a plain object double
 * and so the adapter is not coupled to the SDK's full surface.
 */
export interface ResendLike {
  emails: {
    send(payload: {
      from: string;
      to: string | string[];
      subject: string;
      text: string;
      html?: string;
    }): PromiseLike<{ data: { id?: string } | null; error: unknown }>;
  };
}

/** Match the established project default from `api/subscribe`. */
const FALLBACK_FROM = "MyShape Protocol <onboarding@resend.dev>";

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Build the adapter over an already-constructed client.
 *
 * Exported separately from the factory so tests never touch the
 * network or a real API key.
 */
export function createResendDeliveryAdapter(
  client: ResendLike,
): DeliveryAdapter {
  return {
    platform: "email",

    async publish(delivery: AuthorizedDelivery): Promise<DeliveryResult> {
      const invalid = validateDelivery(delivery);
      if (invalid !== null) {
        // Refused locally. Nothing was sent, so this is an invalid
        // input rather than a provider failure.
        return {
          ok: false,
          reason: "INVALID_INPUT",
          detail: invalid,
          recipient: delivery?.target?.recipient ?? "",
        };
      }

      const { recipient, subject } = delivery.target;
      const { text, html } = delivery.content;

      const { data, error } = await client.emails.send({
        from: process.env.RESEND_FROM_EMAIL || FALLBACK_FROM,
        to: recipient,
        subject,
        text,
        ...(html === undefined ? {} : { html }),
      });

      if (error) {
        // Resend reports rejection in-band rather than throwing.
        return {
          ok: false,
          reason: "PROVIDER_ERROR",
          detail: describe(error),
          recipient,
        };
      }

      const providerMessageId = data?.id;
      if (typeof providerMessageId !== "string" || providerMessageId === "") {
        // Accepted but unidentifiable. Reporting success here would
        // leave PUBLISHED with no way to trace what was sent, so it
        // is recorded as a failure and stays reconcilable.
        return {
          ok: false,
          reason: "PROVIDER_ERROR",
          detail: "the provider returned no message identifier",
          recipient,
        };
      }

      return { ok: true, providerMessageId, recipient };
    },
  };
}

/**
 * Factory: construct the client from the project's established
 * environment variables and return the adapter.
 */
export async function createResendDeliveryAdapterFromEnv(): Promise<DeliveryAdapter> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    throw new Error(
      "Resend not configured (RESEND_API_KEY).",
    );
  }

  const { Resend } = await import("resend");
  const client = new Resend(resendKey) as unknown as ResendLike;
  return createResendDeliveryAdapter(client);
}
