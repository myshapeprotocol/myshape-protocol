/**
 * Sentry Edge Runtime configuration.
 * Captures errors from Edge middleware and Edge API routes.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,
});
