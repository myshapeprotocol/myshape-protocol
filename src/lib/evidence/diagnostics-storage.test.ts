// EE-003-DIAGNOSTICS-002 — focused tests for compact diagnostic storage.
// Verifies: retention limit, compact serialization (no full sample arrays),
// migration from legacy key, SSR safety, quota failure safety, and Copy/Download.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  recordDiagnosticSession,
  getDiagnosticSessions,
  copyDiagnosticSessions,
  downloadDiagnosticSessions,
  toRepresentativeSamples,
  newDiagnosticSessionId,
  MAX_DIAGNOSTIC_SESSIONS,
  type RawSensorSample,
  type CompactDiagnosticSession,
} from "../try-instrumentation";

const KEY = "myshape-diagnostic-sessions-v2";
const LEGACY_KEY = "myshape-diagnostic-sessions";

function makeStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((k: string) => (k in store ? store[k] : null)),
    setItem: vi.fn((k: string, v: string) => { store[k] = v; }),
    removeItem: vi.fn((k: string) => { delete store[k]; }),
    _store: store,
  };
}

function makeSession(n = 1): CompactDiagnosticSession {
  return {
    sessionId: `sess-${n}`,
    timestamp: `2026-01-0${n}T00:00:00.000Z`,
    userAgent: "test-agent",
    host: "localhost:3000",
    route: "/try",
    rounds: [
      {
        roundId: `sess-${n}-R1`,
        direction: "→",
        axis: "rx",
        expectedSign: 1,
        sampleCount: 100,
        representativeSamples: [],
        peakMagnitude: 120,
        signedPeakDegS: 100,
        match: true,
        orientation: 0,
      },
    ],
  };
}


describe("compact diagnostic storage", () => {
  let storage: ReturnType<typeof makeStorage>;

  beforeEach(() => {
    storage = makeStorage();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", storage);
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("new session is stored", () => {
    const ok = recordDiagnosticSession(makeSession(1));
    expect(ok).toBe(true);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    const stored = JSON.parse(storage._store[KEY]);
    expect(stored).toHaveLength(1);
    expect(stored[0].sessionId).toBe("sess-1");
  });

  it("retains only the latest MAX_DIAGNOSTIC_SESSIONS sessions", () => {
    for (let i = 1; i <= MAX_DIAGNOSTIC_SESSIONS + 2; i++) {
      recordDiagnosticSession(makeSession(i));
    }
    const stored = getDiagnosticSessions();
    expect(stored).toHaveLength(MAX_DIAGNOSTIC_SESSIONS);
    expect(stored[0].sessionId).toBe("sess-" + MAX_DIAGNOSTIC_SESSIONS);
    expect(stored[stored.length - 1].sessionId).toBe("sess-" + (MAX_DIAGNOSTIC_SESSIONS + 2));
  });

  it("compact serialization does NOT contain full raw sample arrays", () => {
    const session = makeSession(1);
    recordDiagnosticSession(session);
    const raw = storage._store[KEY];
    expect(raw).toContain("sessionId");
    expect(raw).toContain("sampleCount");
    expect(raw).toContain("signedPeakDegS");
    expect(raw).not.toMatch(/"ax"/);
    expect(raw).not.toMatch(/"beta"/);
  });

  it("toRepresentativeSamples bounds to max 3 samples", () => {
    const samples: RawSensorSample[] = [];
    for (let i = 0; i < 1000; i++) {
      samples.push({ t: i, alpha: Math.round(Math.sin(i/50)*1000), beta: -i, gamma: i * 2, ax: 0, ay: 0, az: 0, orientation: 0 });
    }
    const rep = toRepresentativeSamples(samples, "alpha");
    expect(rep.length).toBeLessThanOrEqual(3);
    expect(rep.length).toBe(3);
    expect(rep[0].role).toBe("first");
    expect(rep[rep.length - 1].role).toBe("last");
  });

  it("toRepresentativeSamples handles empty input", () => {
    expect(toRepresentativeSamples([], "alpha")).toEqual([]);
  });

  it("toRepresentativeSamples single sample returns just first", () => {
    const samples: RawSensorSample[] = [{
      t: 0, alpha: 1, beta: 2, gamma: 3, ax: 0, ay: 0, az: 0, orientation: 0,
    }];
    const rep = toRepresentativeSamples(samples, "alpha");
    expect(rep).toHaveLength(1);
    expect(rep[0].role).toBe("first");
  });

  it("legacy key is migrated on getDiagnosticSessions", () => {
    storage._store[LEGACY_KEY] = JSON.stringify([makeSession(1), makeSession(2)]);
    const sessions = getDiagnosticSessions();
    expect(storage.removeItem).toHaveBeenCalledWith(LEGACY_KEY);
    expect(sessions).toEqual([]);
  });

  it("legacy key is migrated on recordDiagnosticSession", () => {
    storage._store[LEGACY_KEY] = JSON.stringify([makeSession(1)]);
    recordDiagnosticSession(makeSession(2));
    expect(storage.removeItem).toHaveBeenCalledWith(LEGACY_KEY);
    const sessions = getDiagnosticSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].sessionId).toBe("sess-2");
  });

  it("malformed localStorage does not crash getDiagnosticSessions", () => {
    storage._store[KEY] = "{invalid json";
    expect(() => getDiagnosticSessions()).not.toThrow();
    expect(getDiagnosticSessions()).toEqual([]);
  });

  it("localStorage write failure does not crash recordDiagnosticSession", () => {
    storage.setItem.mockImplementation(() => { throw new Error("QuotaExceededError"); });
    expect(() => recordDiagnosticSession(makeSession(1))).not.toThrow();
    expect(recordDiagnosticSession(makeSession(1))).toBe(false);
  });

  it("SSR-safe without window", () => {
    vi.unstubAllGlobals();
    expect(() => getDiagnosticSessions()).not.toThrow();
    expect(getDiagnosticSessions()).toEqual([]);
    expect(() => recordDiagnosticSession(makeSession(1))).not.toThrow();
    expect(recordDiagnosticSession(makeSession(1))).toBe(false);
  });

  it("newDiagnosticSessionId produces non-empty string", () => {
    const id = newDiagnosticSessionId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("newDiagnosticSessionId fallback when crypto.randomUUID unavailable", () => {
    vi.stubGlobal("crypto", { randomUUID: undefined });
    const id = newDiagnosticSessionId();
    expect(id.startsWith("diag-")).toBe(true);
  });
});


describe("copyDiagnosticSessions", () => {
  let storage: ReturnType<typeof makeStorage>;

  beforeEach(() => {
    storage = makeStorage();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    recordDiagnosticSession(makeSession(1));
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("calls navigator.clipboard.writeText when available", async () => {
    const result = await copyDiagnosticSessions();
    expect(result).toBe("copied");
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const written = (navigator.clipboard.writeText as unknown as { mock: { calls: string[][] } }).mock.calls[0][0];
    expect(written).toContain("sessionId");
  });

  it("clipboard failure is handled gracefully", async () => {
    (navigator.clipboard.writeText as unknown as { mockRejectedValueOnce: (v: Error) => void }).mockRejectedValueOnce(new Error("denied"));
    const result = await copyDiagnosticSessions();
    expect(result).toBe("failed");
  });

  it("returns failed when clipboard unavailable", async () => {
    vi.stubGlobal("navigator", {});
    const result = await copyDiagnosticSessions();
    expect(result).toBe("failed");
  });
});

describe("downloadDiagnosticSessions", () => {
  let storage: ReturnType<typeof makeStorage>;

  beforeEach(() => {
    storage = makeStorage();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("document", { createElement: vi.fn(() => ({ style: {}, click() {}, setAttribute() {} })), body: { appendChild() {}, removeChild() {} } });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:fake"),
      revokeObjectURL: vi.fn(),
    });
    recordDiagnosticSession(makeSession(1));
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("downloads JSON file", () => {
    const spy = vi.spyOn(document, "createElement");
    downloadDiagnosticSessions();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });
});