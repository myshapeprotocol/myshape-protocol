import { describe, it, expect } from "vitest";
import { analyzeTrace } from "./agent-trace-engine";
import {
  buildReceipt, signReceipt, verifyReceipt,
} from "./noble-verifier";
import { generateKeyPair, createIssuerIdentity } from "@/lib/crypto";

/**
 * Deterministic recent interval — derives BOTH endpoints from ONE clock read.
 * Independent Date.now() calls can straddle a wall-clock tick (Windows timer
 * granularity up to ~15ms), making the ISO-parsed `end - start` differ from
 * coverageMs and tripping the strict V₄ equality intermittently.
 */
function recentInterval(coverageMs: number): { start: string; end: string; coverageMs: number } {
  const endT = Date.now();
  return { start: new Date(endT - coverageMs).toISOString(), end: new Date(endT).toISOString(), coverageMs };
}

function makeTrace(overrides?: { duration?: number; gap?: number }) {
  const duration = overrides?.duration ?? 60;
  const gap = overrides?.gap ?? 0;
  const snapshots = [];
  const startTime = Date.now();
  const baseMem = 512;
  for (let i = 0; i < duration; i++) {
    // Insert a suspicious gap if specified
    const offset = i >= duration / 2 && gap > 0 ? gap * 1000 : 0;
    snapshots.push({
      timestamp: startTime + i * 1000 + offset + Math.floor((Math.random() - 0.5) * 100),
      processCount: 12 + Math.floor(Math.random() * 3),
      memoryMB: baseMem + Math.sin(i * 0.1) * 20 + (Math.random() - 0.5) * 5,
      cpuPercent: 15 + Math.random() * 25,
    });
  }
  return analyzeTrace(snapshots);
}

describe("EE-002 Agent Execution Trace Engine", () => {
  it("produces a valid EvidenceBlock", () => {
    const { evidence } = makeTrace();
    expect(evidence.engineId).toBe("EE-002");
    expect(evidence.confidence).toBeGreaterThan(0.5);
    expect(evidence.confidence).toBeLessThanOrEqual(1);
    expect(evidence.payloadDigest).toMatch(/^[0-9a-f]{64}$/);
  });

  it("normal trace has high confidence", () => {
    const { evidence } = makeTrace({ duration: 60 });
    expect(evidence.confidence).toBeGreaterThan(0.7);
  });

  it("trace with suspicious gap has lower confidence", () => {
    const { evidence } = makeTrace({ duration: 60, gap: 5 }); // 5-second gap
    expect(evidence.confidence).toBeLessThan(0.8); // lower due to gap
  });

  it("short trace has lower coverage", () => {
    const normal = makeTrace({ duration: 60 });
    const short = makeTrace({ duration: 10 });
    expect(short.analysis.coverageScore).toBeLessThan(normal.analysis.coverageScore);
  });

  it("rejects too few snapshots", () => {
    expect(() => analyzeTrace([{ timestamp: 1 }, { timestamp: 2 }])).toThrow();
  });

  it("produces a Receipt that passes Noble Verifier", () => {
    const { evidence } = makeTrace();
    const kp = generateKeyPair();
    const issuer = createIssuerIdentity(kp);
    const unsigned = buildReceipt({
      evidence: [evidence],
      interval: recentInterval(60000),
      subject: { id: "agent-test", type: "agent" },
      issuer,
    });
    const receipt = signReceipt(unsigned, kp.secretKey);
    expect(verifyReceipt(receipt).status).toBe("VALID");
  });

  it("produces a Receipt that passes MyShape Verifier", async () => {
    const { verifyReceipt: mv, buildReceipt: mb, signReceipt: ms } = await import("@/lib/evidence/cps0001");
    const { evidence } = makeTrace();
    const kp = generateKeyPair();
    const issuer = createIssuerIdentity(kp);
    const u = mb({
      evidence: [evidence],
      interval: recentInterval(60000),
      subject: { id: "agent-cross", type: "agent" },
      issuer,
    });
    const r = ms(u, kp.secretKey);
    expect(mv(r).status).toBe("VALID");
  });
});
