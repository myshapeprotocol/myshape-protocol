// ============================================================
// MyShape Protocol — API Contract Validation Helpers
// ============================================================
// Runtime enforcement of compile-time contracts.
// Used by integration tests AND available for production gate checks.
// ============================================================

import type { z, ZodSchema, ZodIssue } from "zod";
import { ApiErrorSchema } from "./schemas";
import type { ApiError } from "@/types/api";

// ── Structured validation result ──

export interface ValidationSuccess<T> {
  ok: true;
  data: T;
}

export interface ValidationFailure {
  ok: false;
  error: string;
  issues: ZodIssue[];
  /** True when the response is a valid ApiError (not a schema mismatch) */
  isApiError: boolean;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// ── Core validate function ──

/**
 * Validate an API response body against a Zod schema.
 *
 * First tries the target schema. If that fails, checks whether the
 * body is a valid ApiError (intentional error response). Only reports
 * a contract violation when NEITHER schema matches.
 *
 * Usage:
 *   const result = validateApiResponse(json, PrivilegesResponseSchema);
 *   if (!result.ok) {
 *     if (result.isApiError) { // intentional 4xx/5xx }
 *     else { // CONTRACT VIOLATION — schema drift detected }
 *   }
 */
export function validateApiResponse<T>(
  data: unknown,
  schema: ZodSchema<T>,
): ValidationResult<T> {
  // 1. Try target schema
  const parsed = schema.safeParse(data);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }

  // 2. Try ApiError schema — intentional error responses are valid
  const errorParsed = ApiErrorSchema.safeParse(data);
  if (errorParsed.success) {
    return {
      ok: false,
      error: `ApiError: ${errorParsed.data.error}`,
      issues: parsed.error.issues,
      isApiError: true,
    };
  }

  // 3. Neither matched — CONTRACT VIOLATION
  return {
    ok: false,
    error: "CONTRACT_VIOLATION: response matches neither success nor error schema",
    issues: parsed.error.issues,
    isApiError: false,
  };
}

// ── Format issues for human-readable output ──

export function formatValidationFailure(failure: ValidationFailure, path?: string): string {
  const header = failure.isApiError
    ? `[API ERROR · ${path ?? "?"}] ${failure.error}`
    : `[CONTRACT VIOLATION · ${path ?? "?"}] ${failure.error}`;

  if (failure.issues.length === 0) return header;

  const issueLines = failure.issues.slice(0, 8).map((i) => {
    const field = i.path.length > 0 ? i.path.join(".") : "(root)";
    return `  · ${field}: ${i.message}`;
  });

  if (failure.issues.length > 8) {
    issueLines.push(`  … and ${failure.issues.length - 8} more issues`);
  }

  return [header, ...issueLines].join("\n");
}

// ── HTTP status → expected error check ──

/**
 * Verify that an HTTP error status code is consistent with an ApiError payload.
 * 4xx/5xx MUST have a valid ApiError payload. 2xx MUST have a valid success payload.
 */
export function validateStatusBodyConsistency(
  status: number,
  body: unknown,
): { ok: boolean; message: string } {
  const isErrorStatus = status >= 400;
  const isApiErrorBody = ApiErrorSchema.safeParse(body).success;

  if (isErrorStatus && !isApiErrorBody) {
    return {
      ok: false,
      message: `HTTP ${status} but body is not a valid ApiError`,
    };
  }

  if (!isErrorStatus && isApiErrorBody) {
    return {
      ok: false,
      message: `HTTP ${status} but body is an ApiError (expected success schema)`,
    };
  }

  return { ok: true, message: "consistent" };
}

// Re-export ApiError type for convenience
export type { ApiError };
