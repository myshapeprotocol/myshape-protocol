/**
 * Sentry Edge Runtime configuration.
 * Captures errors from Edge middleware and Edge API routes.
 * Gracefully skips initialization when DSN is not configured.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,
  });
}
