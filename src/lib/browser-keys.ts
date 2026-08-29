// ============================================================
// Browser identity signing — WebCrypto non-extractable Ed25519
//
// The persisted signing identity used to be a plain-text Ed25519 secret key
// in localStorage (`myshape_ed25519_sk`), readable by any JS that runs (e.g.
// XSS payload). That is the exposure this module removes.
//
// Design:
//   * The PRIVATE key is a WebCrypto CryptoKey with extractable=false.
//   * Persisted ONLY as that non-extractable CryptoKey via IndexedDB
//     (structured clone preserves the non-extractable flag across reloads).
//   * No JS string of the private key material is stored or returned. Public
//     key + issuer id are public data and may be held as strings.
//
// Compatibility:
//   * SUPPORTED: browsers with WebCrypto Ed25519 (Chrome 116+, Firefox 113+,
//     Safari 16.4+) and Node >= 20; IndexedDB on all.
//   * UNSUPPORTED: no SubtleCrypto Ed25519 / no IndexedDB → this rejects.
//     Legacy sync `getOrCreateKeyPair` (crypto.ts) stays for node SDK use but
//     keeps a JS-readable persisted key — that is a documented FALLBACK and
//     NOT equivalent protection.
// ============================================================

export type BrowserSigner = {
  /** issuer id (sha256 of public key, first 16 hex) */
  id: string;
  /** public key (hex) — public data */
  publicKey: string;
  /** sign a string message, returns hex signature */
  sign: (message: string) => Promise<string>;
};

export interface KeyVault {
  get(name: string): Promise<unknown>;
  put(name: string, value: unknown): Promise<void>;
}

const PUBLIC_NAME = "ed25519-public";
const PRIVATE_NAME = "ed25519-private";

// ── IndexedDB-backed vault (production browser) ──

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("myshape_identity", 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("keys")) {
        req.result.createObjectStore("keys");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const idbVault: KeyVault = {
  async get(name) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("keys", "readonly");
      const req = tx.objectStore("keys").get(name);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  },
  async put(name, value) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("keys", "readwrite");
      tx.objectStore("keys").put(value, name);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};

// Test seam: node has no IndexedDB — inject an in-memory KeyVault while still
// exercising the same WebCrypto priming path.
let _vaultOverride: KeyVault | undefined;
export function setVaultForTest(v: KeyVault | undefined): void {
  _vaultOverride = v;
}

function resolveVault(): KeyVault {
  if (_vaultOverride) return _vaultOverride;
  if (typeof indexedDB !== "undefined") return idbVault;
  throw new Error("KeyVault unavailable: no IndexedDB in this runtime");
}

const ALG: Algorithm = { name: "Ed25519" };

function bufToHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(data: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return bufToHex(d);
}

export async function isNonExtractableEd25519Supported(): Promise<boolean> {
  try {
    if (!globalThis.crypto?.subtle) return false;
    if (typeof indexedDB === "undefined" && !_vaultOverride) return false;
    const kp = (await crypto.subtle.generateKey(ALG, true, ["sign", "verify"])) as CryptoKeyPair;
    await crypto.subtle.exportKey("pkcs8", kp.privateKey);
    return true;
  } catch {
    return false;
  }
}
function makeSigner(publicKey: string, id: string, privateKey: CryptoKey): BrowserSigner {
  return {
    id,
    publicKey,
    sign: async (message: string) => {
      const msg = new TextEncoder().encode(message);
      const sig = await crypto.subtle.sign(ALG, privateKey, msg);
      return bufToHex(sig);
    },
  };
}

/**
 * Get or create the persistent browser signing identity.
 *
 * Returns a signer whose private key is a non-extractable CryptoKey persisted
 * in the KeyVault (IndexedDB). The signature verifies identically to the
 * @noble Ed25519 used by `signReceipt`; cross-verifier consistency is locked
 * by the browser-keys tests.
 */
export async function getOrCreateBrowserSigner(vault: KeyVault = resolveVault()): Promise<BrowserSigner> {
  // Existing persisted identity → return cache-backed signer.
  const cachedPublic = (await vault.get(PUBLIC_NAME)) as string | undefined;
  const cachedPrivate = (await vault.get(PRIVATE_NAME)) as CryptoKey | undefined;
  if (cachedPublic && cachedPrivate) {
    const id = (await sha256Hex(cachedPublic)).slice(0, 16);
    return makeSigner(cachedPublic, id, cachedPrivate);
  }

  // New key: derive an extractable pair ONCE, export pub(raw) + priv(pkcs8),
  // re-import the private as extractable=false, then discard the transient
  // bytes. Only the non-extractable CryptoKey and the public hex are persisted.
  const pair = (await crypto.subtle.generateKey(ALG, true, ["sign", "verify"])) as CryptoKeyPair;
  const publicKey = bufToHex(await crypto.subtle.exportKey("raw", pair.publicKey));
  const privPkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  const privateKey = await crypto.subtle.importKey("pkcs8", privPkcs8, ALG, false, ["sign"]);
  // Wipe the transient pkcs8 buffer (best-effort; it is never persisted).
  new Uint8Array(privPkcs8).fill(0);

  await vault.put(PUBLIC_NAME, publicKey);
  await vault.put(PRIVATE_NAME, privateKey);

  const id = (await sha256Hex(publicKey)).slice(0, 16);
  return makeSigner(publicKey, id, privateKey);
}