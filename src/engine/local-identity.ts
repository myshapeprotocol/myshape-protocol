// ============================================================
// MyShape Protocol — Local Identity Engine
// Derived from: Technical Specification v1.0 §7.2
//
// All identity material is generated and stored locally.
// Nothing is uploaded. No server stores keys or salt.
// ============================================================

// ── Storage keys ──

const STORAGE_PREFIX = "myshape_id_";

function storageGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_PREFIX + key) || localStorage.getItem(STORAGE_PREFIX + key);
}

function storageSet(key: string, value: string, persistent = false): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_PREFIX + key, value);
  if (persistent) localStorage.setItem(STORAGE_PREFIX + key, value);
}

// ── Device Salt (§7.2) ──
// Unique per-device, per-session. Never uploaded.
// Used to make MV_hash device-specific without revealing device identity.

export function getDeviceSalt(): string {
  const existing = storageGet("device_salt");
  if (existing) return existing;

  // Generate: entropy from timing + crypto API
  let salt = "";
  if (typeof window !== "undefined" && window.crypto) {
    const arr = new Uint32Array(4);
    window.crypto.getRandomValues(arr);
    salt = Array.from(arr).map(n => n.toString(16).padStart(8, "0")).join("");
  } else {
    salt = Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
  storageSet("device_salt", salt, true); // persistent across sessions
  return salt;
}

export function rotateDeviceSalt(): string {
  if (typeof window !== "undefined" && window.crypto) {
    const arr = new Uint32Array(4);
    window.crypto.getRandomValues(arr);
    const newSalt = Array.from(arr).map(n => n.toString(16).padStart(8, "0")).join("");
    storageSet("device_salt", newSalt, true);
    return newSalt;
  }
  return getDeviceSalt();
}

// ── Local Identity Key (§7.2) ──
// Session-scoped identity anchor. Generated once per session.
// Used to link multiple Presence Proofs to the same session identity.

export interface LocalIdentity {
  key: string;         // 32-char hex identity key
  salt: string;        // device salt
  created_at: number;  // unix timestamp
  session_id: string;  // unique per browser session
}

export function getOrCreateLocalIdentity(): LocalIdentity {
  const existing = storageGet("identity");
  if (existing) {
    try { return JSON.parse(existing); } catch { /* regenerate */ }
  }

  const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  let key = "";
  if (typeof window !== "undefined" && window.crypto) {
    const arr = new Uint32Array(8);
    window.crypto.getRandomValues(arr);
    key = Array.from(arr).map(n => n.toString(16).padStart(8, "0")).join("");
  } else {
    key = sessionId.repeat(2).slice(0, 32);
  }

  const identity: LocalIdentity = {
    key,
    salt: getDeviceSalt(),
    created_at: Math.floor(Date.now() / 1000),
    session_id: sessionId,
  };

  storageSet("identity", JSON.stringify(identity));
  return identity;
}

// ── Presence Session ──
// Links a single capture window to the local identity.

export interface PresenceSession {
  identity: LocalIdentity;
  window_start: number;
  window_end: number;
  session_nonce: string;  // anti-replay within session
}

export function createPresenceSession(windowSeconds: number): PresenceSession {
  const identity = getOrCreateLocalIdentity();
  const now = Math.floor(Date.now() / 1000);
  const nonce = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  return {
    identity,
    window_start: now,
    window_end: now + windowSeconds,
    session_nonce: nonce,
  };
}

// ── Clear identity (user-facing "forget me") ──

export function clearLocalIdentity(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_PREFIX + "identity");
  sessionStorage.removeItem(STORAGE_PREFIX + "device_salt");
  localStorage.removeItem(STORAGE_PREFIX + "device_salt");
}
