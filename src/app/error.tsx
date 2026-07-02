"use client";

import { useEffect } from "react";
import ErrorFallback from "@/components/ui/ErrorFallback";

/**
 * Root Error Boundary — catches page-level runtime errors.
 * Next.js App Router convention: error.tsx must be a Client Component.
 * Does NOT catch errors in the root layout (use global-error.tsx for that).
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ROOT_ERROR_BOUNDARY:", error);
  }, [error]);

  return (
    <ErrorFallback
      title="SIGNAL_INTERRUPTED"
      message="The protocol layer encountered an unexpected state.\nThis node can be re-initialized."
      onReset={reset}
      resetLabel="REINITIALIZE_NODE"
    />
  );
}
