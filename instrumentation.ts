/**
 * Next.js instrumentation hook — required by @sentry/nextjs for
 * server-side error monitoring, performance tracing, and
 * automatic span collection for API routes.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
