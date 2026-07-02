"use client";

import { useEffect } from "react";
import ErrorFallback from "@/components/ui/ErrorFallback";

/**
 * Global Error Boundary — catches errors in the root layout itself.
 * This is the last-resort safety net. If the layout crashes,
 * the user sees this instead of a blank white screen.
 *
 * Note: global-error.tsx must define its own <html> and <body> tags
 * because the root layout itself may have failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("GLOBAL_ERROR_BOUNDARY:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#02040a" }}>
        <ErrorFallback
          title="PROTOCOL_LAYER_UNREACHABLE"
          message="A critical protocol error has occurred.\nThe identity layer cannot be rendered.\n\nRe-initialization may restore the connection."
          onReset={reset}
          resetLabel="REINITIALIZE_PROTOCOL"
        />
      </body>
    </html>
  );
}
