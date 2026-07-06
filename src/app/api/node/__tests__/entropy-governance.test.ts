/**
 * Genesis Governance — State Machine Tests
 *
 * Verifies the admission rules defined in docs/genesis-governance.md.
 * Tests the eligibility matrix, PES threshold, cohort cap, and key minting
 * as pure functions, plus HTTP-level input validation.
 *
 * Coverage: docs/genesis-governance.md §2 Eligibility Matrix + §3 Decision Algorithm
 */
import { describe, it, expect, beforeEach } from "vitest";

// ── Pure Decision Logic (extracted for testability) ──

/** Statuses that CANNOT be upgraded to GENESIS_NODE */
const EXCLUSION_SET = ["GENESIS_NODE", "AGENT_ACTIVE", "TEST_ACCOUNT"] as const;

function isEligible(currentStatus: string): boolean {
  return !EXCLUSION_SET.includes(currentStatus as (typeof EXCLUSION_SET)[number]);
}

function determineNodeStatus(
  currentStatus: string,
  pesScore: number,
  verifiedCount: number,
): {
  eligible: boolean;
  passesThreshold: boolean;
  newNodeStatus: string | null;
  cohortFull: boolean;
  slotsRemaining: number;
} {
  const passesThreshold = pesScore > 0.5;
  const eligible = isEligible(currentStatus);

  if (!eligible || !passesThreshold) {
    return {
      eligible,
      passesThreshold,
      newNodeStatus: null,
      cohortFull: false,
      slotsRemaining: Math.max(0, 100 - verifiedCount),
    };
  }

  const cohortFull = verifiedCount >= 100;
  return {
    eligible,
    passesThreshold,
    newNodeStatus: cohortFull ? "ACTIVE" : "GENESIS_NODE",
    cohortFull,
    slotsRemaining: Math.max(0, 100 - verifiedCount),
  };
}

// ── Eligibility Matrix (§2) ──

describe("Eligibility Matrix", () => {
  const eligibleStatuses = [
    "PENDING_VERIFICATION",
    "ACTIVE",
    "GENESIS_CONNECTED",
    "SUBSCRIBED",
  ];

  const ineligibleStatuses = [
    "GENESIS_NODE",
    "AGENT_ACTIVE",
    "TEST_ACCOUNT",
  ];

  it.each(eligibleStatuses)("%s is eligible for Genesis minting", (status) => {
    expect(isEligible(status)).toBe(true);
  });

  it.each(ineligibleStatuses)("%s is EXCLUDED from Genesis minting", (status) => {
    expect(isEligible(status)).toBe(false);
  });

  it("ACTIVE is eligible — OTP users can upgrade via motion scan", () => {
    // Regression: ACTIVE was previously excluded, blocking OTP-verified users
    expect(isEligible("ACTIVE")).toBe(true);
  });

  it("TEST_ACCOUNT is excluded — sandbox accounts cannot mint", () => {
    expect(isEligible("TEST_ACCOUNT")).toBe(false);
  });
});

// ── Decision Algorithm (§3) ──

describe("Decision Algorithm", () => {
  it("eligible + PES > 0.5 + slots available → GENESIS_NODE", () => {
    const result = determineNodeStatus("ACTIVE", 0.72, 42);
    expect(result.eligible).toBe(true);
    expect(result.passesThreshold).toBe(true);
    expect(result.newNodeStatus).toBe("GENESIS_NODE");
    expect(result.cohortFull).toBe(false);
    expect(result.slotsRemaining).toBe(58);
  });

  it("eligible + PES > 0.5 + cohort full → ACTIVE + cohortFull", () => {
    const result = determineNodeStatus("GENESIS_CONNECTED", 0.88, 100);
    expect(result.newNodeStatus).toBe("ACTIVE");
    expect(result.cohortFull).toBe(true);
    expect(result.slotsRemaining).toBe(0);
  });

  it("eligible + PES > 0.5 + cohort full at 101 → ACTIVE", () => {
    const result = determineNodeStatus("SUBSCRIBED", 0.65, 101);
    expect(result.newNodeStatus).toBe("ACTIVE");
    expect(result.cohortFull).toBe(true);
  });

  it("eligible + PES ≤ 0.5 → no mint (below threshold)", () => {
    const result = determineNodeStatus("ACTIVE", 0.5, 10);
    expect(result.passesThreshold).toBe(false);
    expect(result.newNodeStatus).toBeNull();
  });

  it("eligible + PES = 0.49 → no mint", () => {
    const result = determineNodeStatus("PENDING_VERIFICATION", 0.49, 0);
    expect(result.passesThreshold).toBe(false);
    expect(result.newNodeStatus).toBeNull();
  });

  it("eligible + PES = 0.51 → mint triggered", () => {
    const result = determineNodeStatus("PENDING_VERIFICATION", 0.51, 0);
    expect(result.passesThreshold).toBe(true);
    expect(result.newNodeStatus).toBe("GENESIS_NODE");
  });

  it("GENESIS_NODE → ineligible, never re-minted", () => {
    const result = determineNodeStatus("GENESIS_NODE", 0.99, 5);
    expect(result.eligible).toBe(false);
    expect(result.newNodeStatus).toBeNull();
  });

  it("AGENT_ACTIVE → ineligible (separate identity class)", () => {
    const result = determineNodeStatus("AGENT_ACTIVE", 0.91, 20);
    expect(result.eligible).toBe(false);
    expect(result.newNodeStatus).toBeNull();
  });

  // ── Edge cases ──

  it("slot 99 → last GENESIS_NODE minted", () => {
    const result = determineNodeStatus("ACTIVE", 0.8, 99);
    expect(result.newNodeStatus).toBe("GENESIS_NODE");
    expect(result.slotsRemaining).toBe(1);
  });

  it("slot 100 → cohort full boundary", () => {
    const result = determineNodeStatus("ACTIVE", 0.8, 100);
    expect(result.newNodeStatus).toBe("ACTIVE");
    expect(result.cohortFull).toBe(true);
    expect(result.slotsRemaining).toBe(0);
  });

  it("zero verified nodes → fresh Genesis", () => {
    const result = determineNodeStatus("GENESIS_CONNECTED", 0.75, 0);
    expect(result.newNodeStatus).toBe("GENESIS_NODE");
    expect(result.slotsRemaining).toBe(100);
  });

  it("extremely high PES in full cohort → still ACTIVE only", () => {
    const result = determineNodeStatus("ACTIVE", 0.999, 100);
    expect(result.newNodeStatus).toBe("ACTIVE");
    expect(result.cohortFull).toBe(true);
  });
});

// ── Cohort Cap Invariants ──

describe("Cohort Cap Invariants", () => {
  it("slots remaining + genesis count = 100 (pre-full)", () => {
    const result = determineNodeStatus("ACTIVE", 0.7, 67);
    expect(result.slotsRemaining).toBe(33);
    expect(result.slotsRemaining + 67).toBe(100);
  });

  it("slots remaining never goes negative", () => {
    for (const count of [100, 150, 999]) {
      const result = determineNodeStatus("ACTIVE", 0.7, count);
      expect(result.slotsRemaining).toBeGreaterThanOrEqual(0);
    }
  });

  it("GENESIS_NODE only assigned when cohort is NOT full", () => {
    // Brute-force: verify across all eligible statuses
    const statuses = ["PENDING_VERIFICATION", "ACTIVE", "GENESIS_CONNECTED", "SUBSCRIBED"];
    for (const status of statuses) {
      const under = determineNodeStatus(status, 0.8, 50);
      expect(under.newNodeStatus).toBe("GENESIS_NODE");
      expect(under.cohortFull).toBe(false);

      const full = determineNodeStatus(status, 0.8, 100);
      expect(full.newNodeStatus).toBe("ACTIVE");
      expect(full.cohortFull).toBe(true);
    }
  });
});

// ── HTTP-level validation (no Supabase required) ──

describe("Entropy API — HTTP validation", () => {
  it("returns 400 for missing email", async () => {
    const { POST } = await import("../entropy/route");
    const req = new Request("http://localhost/api/node/entropy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pesScore: 0.8 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.error).toBe("MISSING_FIELDS");
  });

  it("returns 400 for missing pesScore", async () => {
    const { POST } = await import("../entropy/route");
    const req = new Request("http://localhost/api/node/entropy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@myshape.com" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(payload.error).toBe("MISSING_FIELDS");
  });

  it("returns 400 for empty request payload", async () => {
    const { POST } = await import("../entropy/route");
    const req = new Request("http://localhost/api/node/entropy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
