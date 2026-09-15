// ═══════════════════════════════════════════════════════════════════
// PHASE 2B — Hero CTA capability-aware routing
//
// Covers the /try vs /motion-demo routing decision used by HeroTrail:
//   - desktop / no sensor capability       → /motion-demo
//   - capable mobile / sensor environment  → /try
//   - SSR / hydration safety (null window → fallback href)
//   - desktop browsers that expose DeviceMotionEvent without a physical
//     IMU are NOT routed into the deep flow (never UA-only, never
//     interface-presence-only)
//
// vitest runs in the node environment (vitest.config.ts), so the browser
// globals are stubbed manually per test and restored afterwards.
// ═══════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  canRunTryFlow,
  detectTryCapability,
  HERO_TRY_FALLBACK_HREF,
  HERO_TRY_HREF,
  resolveHeroTryHref,
  type TryCapability,
} from "@/lib/try-capability";

// ── minimal window stub (no jsdom in this project) ──────────────────

interface FakeNavigator {
  userAgent?: string;
  maxTouchPoints?: number;
  userAgentData?: { mobile?: boolean };
}

interface FakeWindow {
  DeviceMotionEvent?: unknown;
  isSecureContext?: boolean;
  navigator?: FakeNavigator;
  matchMedia?: (query: string) => { matches: boolean };
}

function installWindow(fake: FakeWindow | undefined): void {
  if (fake === undefined) {
    Reflect.deleteProperty(globalThis, "window");
    return;
  }
  (globalThis as { window?: unknown }).window = fake;
}

/** Desktop-class baseline: secure, fine primary pointer, desktop UA, no IMU. */
function desktopWindow(overrides: FakeWindow = {}): FakeWindow {
  return {
    isSecureContext: true,
    navigator: {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      maxTouchPoints: 0,
    },
    matchMedia: () => ({ matches: false }),
    ...overrides,
  };
}

/** Capable phone: DeviceMotion + coarse pointer + mobile UA + HTTPS. */
function androidPhoneWindow(overrides: FakeWindow = {}): FakeWindow {
  return desktopWindow({
    DeviceMotionEvent: class DeviceMotionEvent {},
    navigator: {
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
      maxTouchPoints: 5,
    },
    matchMedia: (q) => ({ matches: q === "(pointer: coarse)" }),
    ...overrides,
  });
}

afterEach(() => {
  installWindow(undefined);
  vi.unstubAllEnvs();
});

// ── SSR / hydration safety ──────────────────────────────────────────

describe("detectTryCapability — SSR safety", () => {
  it("returns null without a window (server render) and never throws", () => {
    installWindow(undefined);
    expect(detectTryCapability()).toBeNull();
  });

  it("resolveHeroTryHref falls back to /motion-demo when capability is unknown (SSR / first client render)", () => {
    expect(resolveHeroTryHref(null)).toBe(HERO_TRY_FALLBACK_HREF);
    expect(resolveHeroTryHref(null)).toBe("/motion-demo");
  });
});

// ── desktop / no sensor capability → /motion-demo ───────────────────

describe("desktop routing", () => {
  it("routes desktop with no DeviceMotionEvent (e.g. Firefox/Linux) to /motion-demo", () => {
    installWindow(desktopWindow());
    const cap = detectTryCapability();
    expect(cap).not.toBeNull();
    expect(cap!.hasDeviceMotion).toBe(false);
    expect(resolveHeroTryHref(cap)).toBe(HERO_TRY_FALLBACK_HREF);
  });

  it("routes desktop that merely exposes the DeviceMotionEvent interface (Chrome/Windows, Safari/macOS) to /motion-demo", () => {
    // Interface presence alone is NOT a plausible /try environment —
    // this is why the decision is never UA-only OR presence-only.
    installWindow(desktopWindow({ DeviceMotionEvent: class DeviceMotionEvent {} }));
    const cap = detectTryCapability();
    expect(cap!.hasDeviceMotion).toBe(true);
    expect(cap!.hasCoarsePointer).toBe(false);
    expect(cap!.mobileHint).toBe(false);
    expect(cap!.hasMotionPermissionAPI).toBe(false);
    expect(resolveHeroTryHref(cap)).toBe(HERO_TRY_FALLBACK_HREF);
  });

  it("routes a touch-screen laptop (touch points but fine primary pointer) to /motion-demo", () => {
    installWindow(
      desktopWindow({
        DeviceMotionEvent: class DeviceMotionEvent {},
        navigator: {
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          maxTouchPoints: 10,
        },
      }),
    );
    expect(resolveHeroTryHref(detectTryCapability())).toBe(HERO_TRY_FALLBACK_HREF);
  });

  it("never routes to /try on a mobile UA alone when DeviceMotion is missing", () => {
    // UA hints corroborate the decision; they can never qualify a device
    // by themselves.
    installWindow(
      desktopWindow({
        navigator: {
          userAgent:
            "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
          maxTouchPoints: 5,
        },
        matchMedia: (q) => ({ matches: q === "(pointer: coarse)" }),
      }),
    );
    const cap = detectTryCapability();
    expect(cap!.mobileHint).toBe(true);
    expect(cap!.hasDeviceMotion).toBe(false);
    expect(resolveHeroTryHref(cap)).toBe(HERO_TRY_FALLBACK_HREF);
  });
});

// ── capable mobile / sensor environment → /try ──────────────────────

describe("capable mobile routing", () => {
  it("routes an Android phone (DeviceMotion + coarse pointer + mobile UA, HTTPS) to /try", () => {
    installWindow(androidPhoneWindow());
    const cap = detectTryCapability();
    expect(cap!.hasDeviceMotion).toBe(true);
    expect(resolveHeroTryHref(cap)).toBe(HERO_TRY_HREF);
  });

  it("routes iPhone Safari (DeviceMotion.requestPermission) to /try", () => {
    installWindow(
      desktopWindow({
        DeviceMotionEvent: class {
          static requestPermission(): Promise<string> {
            return Promise.resolve("granted");
          }
        },
        navigator: {
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
          maxTouchPoints: 5,
        },
        matchMedia: (q) => ({ matches: q === "(pointer: coarse)" }),
      }),
    );
    const cap = detectTryCapability();
    expect(cap!.hasMotionPermissionAPI).toBe(true);
    expect(resolveHeroTryHref(cap)).toBe(HERO_TRY_HREF);
  });

  it("routes iPad with desktop-mode UA (Macintosh + coarse pointer + requestPermission) to /try", () => {
    installWindow(
      desktopWindow({
        DeviceMotionEvent: class {
          static requestPermission(): Promise<string> {
            return Promise.resolve("granted");
          }
        },
        navigator: {
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
          maxTouchPoints: 5,
        },
        matchMedia: (q) => ({ matches: q === "(pointer: coarse)" }),
      }),
    );
    const cap = detectTryCapability();
    expect(cap!.mobileHint).toBe(false); // desktop UA does not match — pointer/permission carry the decision
    expect(resolveHeroTryHref(cap)).toBe(HERO_TRY_HREF);
  });

  it("routes via UA-CH mobile hint even without coarse pointer (DeviceMotion present)", () => {
    installWindow(
      desktopWindow({
        DeviceMotionEvent: class DeviceMotionEvent {},
        navigator: {
          userAgent:
            "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
          maxTouchPoints: 5,
          userAgentData: { mobile: true },
        },
      }),
    );
    const cap = detectTryCapability();
    expect(cap!.hasCoarsePointer).toBe(false);
    expect(cap!.mobileHint).toBe(true);
    expect(resolveHeroTryHref(cap)).toBe(HERO_TRY_HREF);
  });
});

// ── secure-context gate (mirrors TryClient.tsx) ─────────────────────

describe("secure-context gate", () => {
  it("routes an insecure-origin phone to /motion-demo in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    installWindow(androidPhoneWindow({ isSecureContext: false }));
    expect(resolveHeroTryHref(detectTryCapability())).toBe(HERO_TRY_FALLBACK_HREF);
  });

  it("keeps the dev/bench insecure-LAN flow reachable (NODE_ENV=development, mirrors TryClient)", () => {
    vi.stubEnv("NODE_ENV", "development");
    installWindow(androidPhoneWindow({ isSecureContext: false }));
    expect(resolveHeroTryHref(detectTryCapability())).toBe(HERO_TRY_HREF);
  });

  it("treats localhost (implicitly a secure context) as capable in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    installWindow(androidPhoneWindow({ isSecureContext: true }));
    expect(resolveHeroTryHref(detectTryCapability())).toBe(HERO_TRY_HREF);
  });
});

// ── pure decision logic (branch coverage) ───────────────────────────

describe("canRunTryFlow — decision branches", () => {
  const base: TryCapability = {
    hasDeviceMotion: true,
    hasMotionPermissionAPI: false,
    hasCoarsePointer: false,
    mobileHint: false,
    isSecure: true,
  };

  it("passes when DeviceMotion + (coarse pointer | mobile hint | permission API)", () => {
    expect(canRunTryFlow({ ...base, hasCoarsePointer: true })).toBe(true);
    expect(canRunTryFlow({ ...base, mobileHint: true })).toBe(true);
    expect(canRunTryFlow({ ...base, hasMotionPermissionAPI: true })).toBe(true);
  });

  it("fails without DeviceMotion", () => {
    expect(canRunTryFlow({ ...base, hasCoarsePointer: true, hasDeviceMotion: false })).toBe(false);
  });

  it("fails without any mobile-environment corroboration", () => {
    expect(canRunTryFlow(base)).toBe(false);
  });

  it("fails when insecure in production but not in development", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(canRunTryFlow({ ...base, hasCoarsePointer: true, isSecure: false })).toBe(false);
    vi.stubEnv("NODE_ENV", "development");
    expect(canRunTryFlow({ ...base, hasCoarsePointer: true, isSecure: false })).toBe(true);
  });
});

// ── HeroTrail SSR baseline (hydration safety + BATCH-005A mobile-only CTA) ───

describe("HeroTrail SSR render", () => {
  beforeEach(() => {
    installWindow(undefined);
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    installWindow(undefined);
    vi.unstubAllEnvs();
  });
  it("SSR renders NO verification CTA (mobile-only, no capability on server)", async () => {
    installWindow(undefined); // simulate server render (no window)
    const React = (await import("react")).default;
    const { renderToString } = await import("react-dom/server");
    const { default: HeroTrail } = await import("@/components/hero-trail/HeroTrail");
    const html = renderToString(React.createElement(HeroTrail));
    // BATCH-005A: the verification CTA is a mobile-only action. SSR must not
    // render it at all — desktop never sees a CTA it cannot complete, and the
    // server payload always matches the first client render (hydration-safe).
    expect(html).not.toContain("RUN A VERIFICATION");
    expect(html).not.toContain("Run a verification");
    expect(html).not.toContain('href="/try"');
  });

  it("after mount, a capable device renders the CTA and upgrades it to /try", () => {
    vi.stubEnv("NODE_ENV", "development");
    installWindow(androidPhoneWindow());
    // This is exactly what the HeroTrail mount effect computes.
    expect(resolveHeroTryHref(detectTryCapability())).toBe(HERO_TRY_HREF);
  });
});