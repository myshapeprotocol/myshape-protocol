/**
 * API error handling utilities.
 *
 * Usage in route handlers:
 *   catch (err) {
 *     const { status, body } = sanitizedApiError(err);
 *     return NextResponse.json(body, { status });
 *   }
 */

export interface ApiErrorResponse {
  success: false;
  error: string;
  /** Only present in development — stripped in production */
  debug?: string;
}

export function sanitizedApiError(
  err: unknown,
  publicMessage = "INTERNAL_SERVER_ERROR",
): { status: number; body: ApiErrorResponse } {
  const isDev = process.env.NODE_ENV === "development";
  const message = err instanceof Error ? err.message : "Unknown error";

  console.error("[api-error]", message);

  return {
    status: 500,
    body: {
      success: false,
      error: publicMessage,
      ...(isDev && { debug: message }),
    },
  };
}

/**
 * Specialized: Supabase query error — distinguishes PGRST116 (no rows)
 * from actual database errors.
 */
export function handleSupabaseError(
  error: unknown,
  notFoundMessage = "NOT_FOUND",
): { status: number; body: ApiErrorResponse } {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code: string }).code === "PGRST116"
  ) {
    return {
      status: 404,
      body: { success: false, error: notFoundMessage },
    };
  }

  return sanitizedApiError(error);
}
