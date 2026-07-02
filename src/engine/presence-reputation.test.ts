import { describe, it, expect } from "vitest";
import { computeReputationScore } from "./presence-reputation";

describe("computeReputationScore", () => {
  const baseParams = {
    avgPes: 0.75,
    avgPss: 0.80,
    totalProofs: 100,
    dropRate: 0.05,
    deviceDiversity: 3,
    lastSeen: Math.floor(Date.now() / 1000) - 60, // 1 minute ago
  };

  it("returns PRS in [0, 1] range", () => {
    const result = computeReputationScore(baseParams);
    expect(result.prs).toBeGreaterThanOrEqual(0);
    expect(result.prs).toBeLessThanOrEqual(1);
  });

  it("returns a valid tier", () => {
    const result = computeReputationScore(baseParams);
    expect(["genesis", "established", "regular", "new", "untrusted"]).toContain(result.tier);
  });

  it("high entropy + stability yields high score", () => {
    const high = computeReputationScore({ ...baseParams, avgPes: 0.95, avgPss: 0.95 });
    const low = computeReputationScore({ ...baseParams, avgPes: 0.30, avgPss: 0.30 });
    expect(high.prs).toBeGreaterThan(low.prs);
  });

  it("low totalProofs limits score", () => {
    const few = computeReputationScore({ ...baseParams, totalProofs: 1 });
    const many = computeReputationScore({ ...baseParams, totalProofs: 1000 });
    expect(many.prs).toBeGreaterThan(few.prs);
  });

  it("high drop rate penalizes score", () => {
    const clean = computeReputationScore({ ...baseParams, dropRate: 0.01 });
    const flaky = computeReputationScore({ ...baseParams, dropRate: 0.30 });
    expect(clean.prs).toBeGreaterThan(flaky.prs);
  });

  it("decay reduces score for long-inactive nodes", () => {
    const recent = computeReputationScore({ ...baseParams, lastSeen: Math.floor(Date.now() / 1000) - 60 });
    const old = computeReputationScore({ ...baseParams, lastSeen: Math.floor(Date.now() / 1000) - 30 * 86400 });
    expect(recent.prs).toBeGreaterThan(old.prs);
  });

  it("device diversity adds bonus", () => {
    const singleDevice = computeReputationScore({ ...baseParams, deviceDiversity: 1 });
    const multiDevice = computeReputationScore({ ...baseParams, deviceDiversity: 5 });
    expect(multiDevice.prs).toBeGreaterThanOrEqual(singleDevice.prs);
  });
});
