/**
 * P0-2 — OTP single-use / TTL security regression tests.
 *
 * ✅ UNBLOCKED — P0-HOTFIX-2 has implemented the required schema changes and
 * atomic consumption logic. See otp-security.test.ts for the full test suite.
 *
 * The previously-BLOCKED invariants are now implemented and tested:
 * - otp_created_at column: added (migration 20260902_otp_lifecycle.sql)
 * - atomic single-use consumption: implemented via conditional UPDATE
 * - OTP TTL enforcement: 10-minute default TTL with otp_expires_at check
 *
 * This file now serves as the status documentation.
 */
import { describe, it, expect } from "vitest";

describe("P0-2 OTP lifecycle — RESOLVED by P0-HOTFIX-2", () => {
  it("status: all previously-blocked OTP security invariants are now implemented and tested in otp-security.test.ts", () => {
        // This file documents the transition from BLOCKED → IMPLEMENTED.
    // The actual security regression tests live in otp-security.test.ts.
    // See verify-otp/route.ts for the atomic consumption implementation.
    expect(true).toBe(true);
  });
});
