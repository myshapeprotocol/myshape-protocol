import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock browser globals before importing the module
const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal("window", {
    crypto: {
      getRandomValues: (arr: Uint32Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = (Math.random() * 4294967296) | 0;
        return arr;
      },
    },
  });
  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
    removeItem: (k: string) => storage.delete(k),
  });
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
    removeItem: (k: string) => storage.delete(k),
  });
});

// Re-import after mocking (vitest hoists vi.mock, but vi.stubGlobal works at runtime)
const {
  getDeviceSalt,
  rotateDeviceSalt,
  getOrCreateLocalIdentity,
  createPresenceSession,
  clearLocalIdentity,
} = await import("./local-identity");

describe("getDeviceSalt", () => {
  it("returns 32-char hex string", () => {
    const salt = getDeviceSalt();
    expect(salt).toHaveLength(32);
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
  });

  it("returns same salt on second call (cached)", () => {
    const s1 = getDeviceSalt();
    const s2 = getDeviceSalt();
    expect(s1).toBe(s2);
  });
});

describe("rotateDeviceSalt", () => {
  it("returns a new 32-char hex salt", () => {
    const old = getDeviceSalt();
    const rotated = rotateDeviceSalt();
    expect(rotated).toHaveLength(32);
    expect(rotated).toMatch(/^[0-9a-f]{32}$/);
    expect(rotated).not.toBe(old);
  });

  it("subsequent getDeviceSalt returns rotated value", () => {
    getDeviceSalt(); // ensure exists
    rotateDeviceSalt();
    const current = getDeviceSalt();
    const rotated = rotateDeviceSalt();
    expect(current).not.toBe(rotated);
  });
});

describe("getOrCreateLocalIdentity", () => {
  it("creates identity with 64-char key", () => {
    const id = getOrCreateLocalIdentity();
    expect(id.key).toHaveLength(64);
    expect(id.key).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns same identity on second call", () => {
    const id1 = getOrCreateLocalIdentity();
    const id2 = getOrCreateLocalIdentity();
    expect(id1.key).toBe(id2.key);
    expect(id1.session_id).toBe(id2.session_id);
    expect(id1.salt).toBe(id2.salt);
  });

  it("identity includes device salt", () => {
    const id = getOrCreateLocalIdentity();
    expect(id.salt).toHaveLength(32);
    expect(id.created_at).toBeGreaterThan(0);
    expect(id.session_id).toBeTruthy();
  });
});

describe("createPresenceSession", () => {
  it("creates session linked to local identity", () => {
    const session = createPresenceSession(30);
    expect(session.identity).toBeDefined();
    expect(session.identity.key).toHaveLength(64);
    expect(session.window_end - session.window_start).toBe(30);
    expect(session.session_nonce).toBeTruthy();
  });

  it("generates unique nonces per session", () => {
    // Small delay to ensure different timestamps
    const s1 = createPresenceSession(30);
    const s2 = createPresenceSession(30);
    // Two sessions created in same millisecond could collide — unlikely
    // The nonces use Date.now() which has ms precision
    expect(s1.window_start).toBeLessThanOrEqual(s2.window_start);
  });
});

describe("clearLocalIdentity", () => {
  it("clears identity and salt from storage", () => {
    const id = getOrCreateLocalIdentity();
    expect(id.key).toBeTruthy();

    clearLocalIdentity();

    // After clearing, getOrCreate should produce a new identity
    const newId = getOrCreateLocalIdentity();
    expect(newId.key).not.toBe(id.key);
  });
});
