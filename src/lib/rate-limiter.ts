// ============================================================
// MyShape Protocol — In-memory Rate Limiter
//
// Shared across API routes. Key design decisions:
//   1. Sliding window — entry expires when windowStart + windowMs < now
//   2. Periodic TTL cleanup — prevents unbounded memory growth
//   3. Returns remaining count — callers can set X-RateLimit-Remaining
//
// NOT suitable for multi-instance deployments (Vercel Edge).
// Production path: migrate to Upstash Redis or similar distributed store.
// ============================================================

export interface RateLimiterOptions {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** How often to run garbage collection (default: 5 minutes) */
  cleanupIntervalMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Unix timestamp (ms) when the current window resets */
  resetAt: number;
}

interface RateEntry {
  count: number;
  windowStart: number;
}

export class RateLimiter {
  private readonly map = new Map<string, RateEntry>();
  private lastCleanup = Date.now();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly cleanupIntervalMs: number;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
    this.cleanupIntervalMs = options.cleanupIntervalMs ?? 5 * 60 * 1000; // default 5 min
  }

  /** Check if an identifier (typically IP) is within rate limits */
  check(key: string): RateLimitResult {
    this.pruneExpired();
    const now = Date.now();
    const existing = this.map.get(key);

    if (!existing || now - existing.windowStart > this.windowMs) {
      this.map.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: this.maxRequests - 1, resetAt: now + this.windowMs };
    }

    if (existing.count >= this.maxRequests) {
      // Window hasn't expired yet — deny
      const resetAt = existing.windowStart + this.windowMs;
      return { allowed: false, remaining: 0, resetAt };
    }

    existing.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - existing.count,
      resetAt: existing.windowStart + this.windowMs,
    };
  }

  /** Clear all entries — exposed for testing. */
  reset(): void {
    this.map.clear();
  }

  /** Remove expired entries to prevent memory leaks */
  private pruneExpired(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupIntervalMs) return;
    this.lastCleanup = now;

    for (const [key, entry] of this.map) {
      if (now - entry.windowStart > this.windowMs) {
        this.map.delete(key);
      }
    }
  }
}

// ── Pre-configured instances ──

/** Generic API lookup rate limit: 10 req/min per IP */
export const apiLookupLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60_000, // 1 minute
});

/** Motion research upload: 5 req/24h per IP (privacy-preserving data collection) */
export const researchUploadLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
});

/** Extract client IP from request headers (works behind Vercel edge proxy) */
export function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** OTP send: 3 requests per IP per 5 minutes — prevents email spam */
export const otpSendLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 5 * 60_000,
});

/** OTP verify: 5 attempts per IP per 5 minutes — prevents brute force */
export const otpVerifyLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 5 * 60_000,
});

/** Genesis/handshake node creation: 3 per IP per hour */
export const nodeCreationLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 60 * 60_000,
});

/** Subscribe/register: 3 per IP per hour — prevents form spam */
export const formSubmitLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 60 * 60_000,
});
