import { describe, it, expect } from "vitest";
import { computePresenceValue } from "./presence-economy";

describe("computePresenceValue", () => {
  it("returns bounded pv in [0, 1]", () => {
    const result = computePresenceValue({
      pes: 0.80, pss: 0.75, prs: 0.70, isContinuous: true,
    });
    expect(result.pv).toBeGreaterThanOrEqual(0);
    expect(result.pv).toBeLessThanOrEqual(1);
  });

  it("high-quality presence produces high value", () => {
    const high = computePresenceValue({
      pes: 0.95, pss: 0.90, prs: 0.85, isContinuous: true,
    });
    const low = computePresenceValue({
      pes: 0.30, pss: 0.25, prs: 0.20, isContinuous: false,
    });
    expect(high.pv).toBeGreaterThan(low.pv);
  });

  it("continuous presence gets bonus", () => {
    const continuous = computePresenceValue({
      pes: 0.80, pss: 0.75, prs: 0.70, isContinuous: true,
    });
    const interrupted = computePresenceValue({
      pes: 0.80, pss: 0.75, prs: 0.70, isContinuous: false,
    });
    expect(continuous.pv).toBeGreaterThan(interrupted.pv);
    expect(continuous.continuity).toBe(0.30);
    expect(interrupted.continuity).toBe(0);
  });

  it("scarcity = pes × pss", () => {
    const result = computePresenceValue({
      pes: 0.80, pss: 0.75, prs: 0.70, isContinuous: false,
    });
    expect(result.scarcity).toBeCloseTo(0.80 * 0.75, 6);
  });

  it("authenticity equals prs", () => {
    const result = computePresenceValue({
      pes: 0.80, pss: 0.75, prs: 0.70, isContinuous: false,
    });
    expect(result.authenticity).toBe(0.70);
  });

  it("pv is capped at 1.0", () => {
    const result = computePresenceValue({
      pes: 1.0, pss: 1.0, prs: 1.0, isContinuous: true,
    });
    expect(result.pv).toBeLessThanOrEqual(1.0);
    // 0.35*1.0 + 0.35*1.0 + 0.15*1.0 + 0.15*0.30 = 0.895
    expect(result.pv).toBeCloseTo(0.895, 3);
  });

  it("includes timestamp", () => {
    const before = Math.floor(Date.now() / 1000);
    const result = computePresenceValue({
      pes: 0.5, pss: 0.5, prs: 0.5, isContinuous: false,
    });
    const after = Math.floor(Date.now() / 1000);
    expect(result.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.timestamp).toBeLessThanOrEqual(after);
  });
});
