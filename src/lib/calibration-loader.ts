// ============================================================
// MyShape Protocol — Phase E-3 Calibration Loader
// ============================================================
//
// Singleton that loads the latest active CalibrationArtifact and
// injects calibrated parameters into the verification pipeline.
//
// Fallback chain (each tier is a safety net):
//   Tier 1: Supabase calibration_artifacts (latest active row)
//   Tier 2: Local file (calibration-artifact-v1.json) — dev/test
//   Tier 3: Vacuum defaults (v0.1 hardcoded 0.70/0.75/0.80)
//
// The system NEVER crashes on calibration unavailability.
// If all tiers fail, the original v0.1 behaviour is preserved.
//
// Thread safety: In-memory cache with periodic refresh. In serverless
// (Edge/Vercel), each isolate loads independently on cold start.

import type { CalibrationArtifact, PopulationFeatureStats } from "@/engine/calibration/types";
import { zScoreNormalize, weightedCosineSimilarity } from "@/engine/calibration/population-stats";
import { applyThreshold } from "@/engine/calibration/roc";

// ═══════════════════════════════════════════════════════════════════
// Vacuum Defaults (v0.1 hardcoded — always available)
// ═══════════════════════════════════════════════════════════════════

const VACUUM_THRESHOLDS = {
  low: 0.70,
  medium: 0.75,
  high: 0.80,
} as const;

const VACUUM_STATS: PopulationFeatureStats = {
  dim: 54,
  means: new Array(54).fill(0),
  stds: new Array(54).fill(1),
  mins: new Array(54).fill(-Infinity),
  maxs: new Array(54).fill(Infinity),
  medians: new Array(54).fill(0),
  mads: new Array(54).fill(1),
  discriminabilityWeights: new Array(54).fill(1 / 54),
  featureMode: "posture",
  numSamples: 0,
  numSessions: 0,
  calibratedAt: 0,
};

// ═══════════════════════════════════════════════════════════════════
// Calibration State
// ═══════════════════════════════════════════════════════════════════

export interface CalibrationState {
  /** Whether a valid calibration artifact is loaded */
  isCalibrated: boolean;
  /** Which tier provided the current parameters */
  source: "supabase" | "file" | "vacuum";
  /** Full artifact (null if vacuum) */
  artifact: CalibrationArtifact | null;
  /** Active thresholds (always valid) */
  thresholds: { low: number; medium: number; high: number };
  /** Population statistics (vacuum defaults if not calibrated) */
  stats: PopulationFeatureStats;
  /** When the current artifact was generated */
  generatedAt: number | null;
  /** Summary metadata for status display */
  metadata: {
    sessionCount: number;
    pcaOutputDim: number;
    varianceRetained: number;
    dPrime: number;
    eer: number;
    auc: number;
  } | null;
}

// ═══════════════════════════════════════════════════════════════════
// CalibrationLoader
// ═══════════════════════════════════════════════════════════════════

export class CalibrationLoader {
  private static instance: CalibrationLoader | null = null;

  private state: CalibrationState;
  private lastRefresh: number = 0;
  private refreshIntervalMs: number;
  private loading: Promise<void> | null = null;

  private constructor() {
    this.refreshIntervalMs = 5 * 60 * 1000; // 5 minutes
    this.state = this.vacuumState();
  }

  /** Get the singleton instance */
  static getInstance(): CalibrationLoader {
    if (!CalibrationLoader.instance) {
      CalibrationLoader.instance = new CalibrationLoader();
    }
    return CalibrationLoader.instance;
  }

  /** Reset singleton (for testing) */
  static reset(): void {
    CalibrationLoader.instance = null;
  }

  // ── Public API ──────────────────────────────────────────────────

  /** Get current calibration state (synchronous, always returns valid state) */
  getState(): CalibrationState {
    return this.state;
  }

  /** Check if calibration is active */
  isCalibrated(): boolean {
    return this.state.isCalibrated;
  }

  /**
   * Get the verification threshold for a given risk level.
   * Always returns a valid number — never throws.
   */
  getThreshold(riskLevel: "low" | "medium" | "high"): number {
    return this.state.thresholds[riskLevel];
  }

  /**
   * Apply calibrated threshold to a similarity/presence score.
   *
   * When calibrated:
   *   - Uses ROC operating points for target FAR levels
   *   - risk_level "low" → 10% FAR, "medium" → 5% FAR, "high" → 1% FAR
   *
   * When vacuum:
   *   - Uses original v0.1 hardcoded thresholds (0.70/0.75/0.80)
   */
  verify(
    score: number,
    riskLevel: "low" | "medium" | "high",
  ): { verified: boolean; threshold: number } {
    if (this.state.isCalibrated && this.state.artifact) {
      const result = applyThreshold(score, this.state.artifact.roc, riskLevel);
      return { verified: result.verified, threshold: result.threshold };
    }
    // Vacuum fallback
    const threshold = VACUUM_THRESHOLDS[riskLevel];
    return { verified: score >= threshold, threshold };
  }

  /**
   * Compute calibrated similarity between two raw signature vectors.
   *
   * When calibrated: z-score normalize → weighted cosine similarity
   * When vacuum: pass-through (caller uses WASM's raw similarity)
   *
   * This is the TypeScript-side post-processor that applies population
   * statistics to amplify individual differences and break the 0.97
   * Impostor bypass.
   *
   * @param rawA - First raw signature vector (e.g., 128-dim from WASM)
   * @param rawB - Second raw signature vector
   * @returns Calibrated similarity score in [0, 1]
   */
  computeSimilarity(rawA: number[], rawB: number[]): number {
    if (!this.state.isCalibrated) {
      // Fallback: unweighted cosine similarity
      return rawCosineSimilarity(rawA, rawB);
    }

    const stats = this.state.stats;
    const d = stats.dim;

    // Truncate or pad vectors to match stats dimension
    const a = alignDimension(rawA, d);
    const b = alignDimension(rawB, d);

    // Z-score normalize
    const za = zScoreNormalize(a, stats);
    const zb = zScoreNormalize(b, stats);

    // Weighted cosine similarity (amplifies individual differences)
    return weightedCosineSimilarity(za, zb, stats.discriminabilityWeights);
  }

  // ── Initialization ──────────────────────────────────────────────

  /**
   * Initialize the loader — attempts to load calibration artifact.
   * Safe to call multiple times; subsequent calls are no-ops if within
   * the refresh interval.
   */
  async initialize(): Promise<CalibrationState> {
    const now = Date.now();
    if (this.state.isCalibrated && now - this.lastRefresh < this.refreshIntervalMs) {
      return this.state;
    }

    // Prevent concurrent loads
    if (this.loading) {
      await this.loading;
      return this.state;
    }

    this.loading = this.loadFromTiers();
    await this.loading;
    this.loading = null;
    this.lastRefresh = Date.now();
    return this.state;
  }

  /** Force a refresh (bypasses cache TTL) */
  async refresh(): Promise<CalibrationState> {
    this.lastRefresh = 0;
    return this.initialize();
  }

  // ── Tier Loading ────────────────────────────────────────────────

  private async loadFromTiers(): Promise<void> {
    // Tier 1: Supabase
    try {
      const state = await this.loadFromSupabase();
      if (state) {
        this.state = state;
        console.log("[CalibrationLoader] Loaded from Supabase —", state.metadata?.sessionCount, "sessions, d'=", state.metadata?.dPrime);
        return;
      }
    } catch (err) {
      console.warn("[CalibrationLoader] Supabase load failed, falling back to file:", (err as Error).message);
    }

    // Tier 2: Local file (dev/test only)
    try {
      const state = await this.loadFromFile();
      if (state) {
        this.state = state;
        console.log("[CalibrationLoader] Loaded from local file —", state.metadata?.sessionCount, "sessions");
        return;
      }
    } catch (err) {
      console.warn("[CalibrationLoader] File load failed, falling back to vacuum:", (err as Error).message);
    }

    // Tier 3: Vacuum defaults
    this.state = this.vacuumState();
    console.log("[CalibrationLoader] Using vacuum defaults (v0.1 thresholds)");
  }

  // ── Tier 1: Supabase ────────────────────────────────────────────

  private async loadFromSupabase(): Promise<CalibrationState | null> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      console.warn("[CalibrationLoader] Missing Supabase env vars — skipping Tier 1");
      return null;
    }

    // Dynamic import to avoid bundling supabase-js in edge bundle unnecessarily
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key);

    const { data, error } = await supabase
      .from("calibration_artifacts")
      .select("artifact_json, session_count, frame_count, pca_output_dim, variance_retained, d_prime, eer, auc, threshold_low, threshold_med, threshold_high, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.warn("[CalibrationLoader] No active calibration artifact in Supabase");
      return null;
    }

    return this.buildState(data.artifact_json, "supabase", {
      sessionCount: data.session_count,
      pcaOutputDim: data.pca_output_dim,
      varianceRetained: data.variance_retained ?? 0,
      dPrime: data.d_prime ?? 0,
      eer: data.eer ?? 0,
      auc: data.auc ?? 0,
    });
  }

  // ── Tier 2: Local File ──────────────────────────────────────────

  private async loadFromFile(): Promise<CalibrationState | null> {
    // Only attempt in Node.js runtime (not Edge)
    if (typeof process === "undefined" || !process.versions?.node) {
      return null;
    }

    try {
      // Use new Function to load Node.js built-ins — completely invisible to
      // Turbopack's static analysis. This code path only runs in Node.js runtime
      // (guarded above) where `require` is available as a global.
      // eslint-disable-next-line no-new-func
      const nodeRequire = new Function("m", "return require(m)") as (name: string) => unknown;
      const fs = nodeRequire("fs") as typeof import("fs");
      const path = nodeRequire("path") as typeof import("path");

      const candidates = [
        path.join(process.cwd(), "calibration-artifact-v1.json"),
        path.join(process.cwd(), "public", "calibration-artifact-v1.json"),
      ];

      for (const filePath of candidates) {
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, "utf-8");
          const artifact = JSON.parse(raw) as CalibrationArtifact;
          return this.buildState(artifact, "file");
        }
      }
    } catch {
      // File not found or unreadable — expected in production
    }

    return null;
  }

  // ── State Builders ──────────────────────────────────────────────

  private buildState(
    artifact: CalibrationArtifact,
    source: "supabase" | "file",
    overrideMeta?: Partial<CalibrationState["metadata"] extends infer T ? T : never>,
  ): CalibrationState {
    const ops = artifact.roc.operatingPoints;
    // ops[0] = 1% FAR (high), ops[1] = 5% FAR (medium), ops[2] = 10% FAR (low)
    // See DEFAULT_CALIBRATION_CONFIG.targetFars = [0.01, 0.05, 0.10]
    const thresholdHigh = ops[0]?.threshold ?? VACUUM_THRESHOLDS.high;
    const thresholdMed = ops[1]?.threshold ?? VACUUM_THRESHOLDS.medium;
    const thresholdLow = ops[2]?.threshold ?? VACUUM_THRESHOLDS.low;

    return {
      isCalibrated: true,
      source,
      artifact,
      thresholds: {
        low: thresholdLow,
        medium: thresholdMed,
        high: thresholdHigh,
      },
      stats: artifact.stats,
      generatedAt: artifact.generatedAt,
      metadata: {
        sessionCount: artifact.totalSessions,
        pcaOutputDim: artifact.pca.outputDim,
        varianceRetained: artifact.pca.cumulativeVariance.length > 0
          ? artifact.pca.cumulativeVariance[artifact.pca.cumulativeVariance.length - 1]
          : 0,
        dPrime: artifact.roc.dPrime,
        eer: artifact.roc.eer,
        auc: artifact.roc.auc,
        ...overrideMeta,
      },
    };
  }

  private vacuumState(): CalibrationState {
    return {
      isCalibrated: false,
      source: "vacuum",
      artifact: null,
      thresholds: { ...VACUUM_THRESHOLDS },
      stats: { ...VACUUM_STATS },
      generatedAt: null,
      metadata: null,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/** Simple cosine similarity (vacuum fallback) */
function rawCosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dotP = 0, nA = 0, nB = 0;
  for (let i = 0; i < n; i++) {
    dotP += a[i] * b[i];
    nA += a[i] * a[i];
    nB += b[i] * b[i];
  }
  const denom = Math.sqrt(nA) * Math.sqrt(nB);
  return denom > 1e-15 ? dotP / denom : 0;
}

/** Align vector to target dimension by truncating or zero-padding */
function alignDimension(vec: number[], targetDim: number): Float64Array {
  const out = new Float64Array(targetDim);
  const n = Math.min(vec.length, targetDim);
  for (let i = 0; i < n; i++) out[i] = vec[i];
  return out;
}

// ═══════════════════════════════════════════════════════════════════
// Convenience singleton accessor
// ═══════════════════════════════════════════════════════════════════

let _loaderPromise: Promise<CalibrationLoader> | null = null;

/**
 * Get the initialized CalibrationLoader singleton.
 * Safe to call anywhere — API routes, middleware, etc.
 */
export async function getCalibrationLoader(): Promise<CalibrationLoader> {
  if (_loaderPromise) return _loaderPromise;

  _loaderPromise = (async () => {
    const loader = CalibrationLoader.getInstance();
    await loader.initialize();
    return loader;
  })();

  return _loaderPromise;
}

/** Reset for testing */
export function resetCalibrationLoader(): void {
  _loaderPromise = null;
  CalibrationLoader.reset();
}
