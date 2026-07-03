/**
 * Sentry server-side configuration.
 * Captures errors from API routes, Server Components, and server actions.
 * Gracefully skips initialization when DSN is not configured (CI, local dev).
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    includeLocalVariables: true,
    ignoreErrors: [
      "PGRST116",
      "ResendRateLimit",
    ],
  });
}
