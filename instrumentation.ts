/**
 * Next.js instrumentation hook.
 * Only registers Sentry when DSN is configured (skipped in CI).
 */
export async function register() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      await import("./sentry.server.config");
    }
    if (process.env.NEXT_RUNTIME === "edge") {
      await import("./sentry.edge.config");
    }
  }
}
