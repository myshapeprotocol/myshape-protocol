import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getOrCreateBrowserSigner,
  setVaultForTest,
  isNonExtractableEd25519Supported,
  type KeyVault,
} from "@/lib/browser-keys";
import {
  canonicalSigningPayload,
  verifySignature,
  buildReceipt,
  type ContinuityReceipt,
} from "@/lib/evidence/cps0001";
import { verify } from "@/lib/crypto";

// In-memory KeyVault — node has no IndexedDB, but WebCrypto Ed25519 exists.
// Structured clone semantics are emulated: CryptoKey survives as a real
// CryptoKey object (the non-extractable flag is intrinsic to the object).
function makeMemoryVault(): KeyVault & { entries: Map<string, unknown> } {
  const entries = new Map<string, unknown>();
  return {
    entries,
    async get(n: string) {
      return entries.get(n) ?? null;
    },
    async put(n: string, v: unknown) {
      entries.set(n, v);
    },
  };
}

async function hasWebCryptoEd25519(): Promise<boolean> {
  try {
    if (!globalThis.crypto?.subtle) return false;
    await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
    return true;
  } catch {
    return false;
  }
}

describe("browser-keys: WebCrypto non-extractable identity", () => {
  beforeEach(() => {
    setVaultForTest(makeMemoryVault());
  });
  afterEach(() => setVaultForTest(undefined));

  it("produces a signer whose signature verifies via @noble verify (cross-stack compat)", async () => {
    const s = await getOrCreateBrowserSigner();
    const msg = "hello";
    const sig = await s.sign(msg);
    // The WebCrypto-produced signature must satisfy @noble's Ed25519 verifier
    // (the app's main crypto stack) — proving byte-for-byte interop.
    expect(verify(sig, msg, s.publicKey)).toBe(true);
    expect(s.publicKey).toMatch(/^[0-9a-f]{64}$/);
    expect(s.id).toMatch(/^[0-9a-f]{16}$/);
  });

  it("the persisted private key is NOT readable as a JS string (non-extractable)", async () => {
    const vault = makeMemoryVault();
    setVaultForTest(vault);
    const s = await getOrCreateBrowserSigner();
    void s;

    const storedPrivate = vault.entries.get("ed25519-private");
    const storedPublic = vault.entries.get("ed25519-public");

    // The stored private is a non-extractable CryptoKey, NOT a hex string.
    expect(storedPrivate).toBeInstanceOf(CryptoKey);
    if (storedPrivate instanceof CryptoKey) {
      expect(storedPrivate.extractable).toBe(false);
      await expect(crypto.subtle.exportKey("pkcs8", storedPrivate)).rejects.toBeTruthy();
      // 32-byte public key hex is public data — stored plainly is fine.
    }
    expect(storedPublic).toMatch(/^[0-9a-f]{64}$/);
  });

  it("persists across reload (same public key, same signer)", async () => {
    const s1 = await getOrCreateBrowserSigner();
    const s2 = await getOrCreateBrowserSigner();
    expect(s2.publicKey).toBe(s1.publicKey);
    expect(s2.id).toBe(s1.id);
  });

  it("signing yields a signature that verifies through the CPS-0001 verifier against the issuer publicKey", async () => {
    const s = await getOrCreateBrowserSigner();
    const issuer = { id: s.id, publicKey: s.publicKey };
    const subject = { id: "sha256:subject-A", type: "embodied" as const };
    const now = Date.now();
    const interval = {
      start: new Date(now - 8000).toISOString(),
      end: new Date(now - 4000).toISOString(),
      coverageMs: 8000,
    };
    const unsigned = buildReceipt({
      evidence: [],
      interval,
      subject,
      issuer,
    });
    const payload = canonicalSigningPayload(unsigned);
    const sig = await s.sign(payload);
    const signed = {
      ...unsigned,
      signature: { algorithm: "Ed25519", value: sig, signedAt: new Date(now).toISOString() },
    } as ContinuityReceipt;
    // verifySignature is V₂ (signature only) — this proves the WebCrypto key
    // produces the exact Ed25519 signature the protocol verifier expects.
    expect(verifySignature(signed)).toBeNull();
  });

  it("isNonExtractableEd25519Supported reflects runtime capability", async () => {
    const sup = await isNonExtractableEd25519Supported();
    expect(sup).toBe(await hasWebCryptoEd25519());
  });
});