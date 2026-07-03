/**
 * Sentry server-side configuration.
 * Captures errors from API routes, Server Components, and server actions.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Reduce sample rate for production cost control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable source maps in production for readable stack traces
  includeLocalVariables: true,

  // Ignore common non-actionable errors
  ignoreErrors: [
    "PGRST116", // Supabase "no rows" — handled at application level
    "ResendRateLimit", // Email rate limit — expected under load
  ],
});
