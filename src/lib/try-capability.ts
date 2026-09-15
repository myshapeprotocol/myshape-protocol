// ═══════════════════════════════════════════════════════════════════
// Try-flow capability probe — PHASE 2B (Hero CTA routing only)
//
// Client-side UX routing helper. It decides where the Hero CTA sends the
// user:
//   /try          — deep verification (EE-001 camera pose + EE-003
//                   DeviceMotion challenge-response; needs a mobile-class
//                   IMU stack)
//   /motion-demo  — accessible Research Preview (webcam-based EE-001/PES,
//                   works on desktop)
//
// This module does NOT touch /try or /motion-demo behavior, the evidence
// engines (EE-001/EE-002/EE-003, VS-001, CPS-0001/0002), signing, auth,
// OTP, Supabase, or any security boundary. It only picks a link target.
//
// Decision contract:
//   1. DeviceMotionEvent must exist — hard requirement. TryClient.tsx
//      hard-fails without it ("Motion sensors are not available...").
//   2. Secure context — mirrors TryClient.tsx: the strict HTTPS gate is
//      production-only (dev/bench LAN flows stay reachable).
//   3. Some desktop browsers expose the DeviceMotionEvent interface with
//      no physical IMU behind it (Chrome/Edge on Windows, Safari on
//      macOS), so a mobile-class sensor environment must be corroborated
//      by at least one independent signal:
//        - primary pointer is coarse (phones/tablets)
//        - UA-CH mobile hint or UA string (corroboration only — never
//          sufficient on its own)
//        - DeviceMotionEvent.requestPermission (iOS/iPadOS 13+ only)
//
// Hydration safety: detectTryCapability() returns null on the server and
// resolveHeroTryHref() falls back to /motion-demo. Callers must render
// the fallback during SSR and the first client render, then upgrade to
// /try in an effect after mount (see HeroTrail.tsx).
// ═══════════════════════════════════════════════════════════════════

/** Deep verification flow — full EE-003 challenge-response. */
export const HERO_TRY_HREF = "/try";

/** Accessible Research Preview — default when capability is unknown. */
export const HERO_TRY_FALLBACK_HREF = "/motion-demo";

/** Client-side capability snapshot relevant to the /try sensor flow. */
export interface TryCapability {
  /** window.DeviceMotionEvent exists (EE-003 samples rotation/acceleration) */
  hasDeviceMotion: boolean;
  /** iOS 13+ gated permission API — strong mobile-IMU signal */
  hasMotionPermissionAPI: boolean;
  /** primary pointer is coarse — phone/tablet-class input */
  hasCoarsePointer: boolean;
  /** UA-CH / UA-string mobile hint — corroboration only */
  mobileHint: boolean;
  /** window.isSecureContext — required by camera + iOS motion permission */
  isSecure: boolean;
}

/**
 * Probe the current browser for /try sensor capabilities.
 * Returns null outside a browser (SSR / first client render).
 * Never throws — every accessor degrades to "not capable".
 */
export function detectTryCapability(): TryCapability | null {
  if (typeof window === "undefined") return null;

  // Narrow structural view over the globals we need. Kept local so the
  // probe stays testable against stubbed globals (vitest runs in node).
  const w = window as Window & {
    DeviceMotionEvent?: { requestPermission?: unknown };
    navigator: Navigator & { userAgentData?: { mobile?: boolean } };
  };

  let hasCoarsePointer = false;
  try {
    hasCoarsePointer =
      typeof w.matchMedia === "function" &&
      w.matchMedia("(pointer: coarse)").matches;
  } catch {
    hasCoarsePointer = false; // matchMedia unavailable — treat as unknown
  }

  const ua = w.navigator?.userAgent ?? "";
  const mobileHint =
    w.navigator?.userAgentData?.mobile === true ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

  return {
    hasDeviceMotion: "DeviceMotionEvent" in w,
    hasMotionPermissionAPI: typeof w.DeviceMotionEvent?.requestPermission === "function",
    hasCoarsePointer,
    mobileHint,
    isSecure: w.isSecureContext === true,
  };
}

/**
 * Whether this browser can plausibly execute the /try sensor flow
 * (EE-001 camera pose + EE-003 DeviceMotion challenge-response).
 */
export function canRunTryFlow(cap: TryCapability): boolean {
  // Hard requirement — TryClient hard-fails without DeviceMotion samples.
  if (!cap.hasDeviceMotion) return false;

  // Mirror TryClient.tsx: the strict HTTPS gate is production-only
  // (dev/bench LAN flows intentionally stay reachable).
  const enforceSecure = process.env.NODE_ENV === "production";
  if (enforceSecure && !cap.isSecure) return false;

  // Disambiguate desktop browsers that expose the DeviceMotionEvent
  // interface without physical sensors behind it.
  return cap.hasCoarsePointer || cap.mobileHint || cap.hasMotionPermissionAPI;
}

/**
 * Hero CTA target for a capability snapshot.
 * null (unknown / SSR) → accessible fallback, so the server and the first
 * client render always agree (hydration-safe).
 */
export function resolveHeroTryHref(cap: TryCapability | null): string {
  return cap !== null && canRunTryFlow(cap)
    ? HERO_TRY_HREF
    : HERO_TRY_FALLBACK_HREF;
}