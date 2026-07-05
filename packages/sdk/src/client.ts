// ═══════════════════════════════════════════════════════════════════
// MyShape Protocol SDK — Client
// ═══════════════════════════════════════════════════════════════════

import type {
  MyShapeConfig,
  MotionSequence,
  DeviceInfo,
  VerificationResult,
  Enrollment,
  Challenge,
  ValidateResponse,
  VerificationFactors,
} from "./types";
import { loadEngine } from "./wasm";

const DEFAULT_BASE_URL = "https://api.myshape.com";

export class MyShapeClient {
  readonly apiKey: string;
  readonly baseUrl: string;

  constructor(config: MyShapeConfig) {
    if (!config.apiKey) {
      throw new Error("MyShapeClient: apiKey is required");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  }

  // ── Presence Verification ────────────────────────────────────────

  /**
   * Verify human presence using motion capture.
   *
   * This is the main entry point. It:
   * 1. Generates a cryptographic challenge
   * 2. Captures user motion via camera (you provide the MotionSequence)
   * 3. Extracts a motion signature via WASM
   * 4. Verifies the signature against the challenge
   *
   * @param motion - MotionSequence captured from the camera
   * @param riskLevel - "low" (10% FAR), "medium" (5% FAR), or "high" (1% FAR)
   * @returns VerificationResult
   *
   * @example
   * ```typescript
   * const client = new MyShapeClient({ apiKey: 'ms_live_...' });
   * const motion = await captureMotion(camera); // your camera code
   * const result = await client.verifyPresence(motion, 'medium');
   * console.log(result.valid ? 'Human ✓' : `Rejected: ${result.rejectionReason}`);
   * ```
   */
  async verifyPresence(
    motion: MotionSequence,
    riskLevel: "low" | "medium" | "high" = "medium",
  ): Promise<VerificationResult> {
    const engine = await loadEngine();

    // 1. Generate challenge
    const sessionKey = generateSessionKey();
    const challengeJson = engine.generate_challenge(sessionKey);
    const challenge: Challenge = {
      sessionKey,
      data: challengeJson,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };

    // 2. Extract signature from motion
    const signatureJson = engine.extract_signature(JSON.stringify(motion));
    const signature = JSON.parse(signatureJson);

    // 3. Verify (uses vacuum thresholds if not calibrated)
    const verifyJson = engine.verify_intent(
      signatureJson, // enrollment: self-enrollment for presence check
      challenge.data,
      signatureJson, // response: same signature for presence-only
      signatureJson,
      riskLevel,
    );
    const result = JSON.parse(verifyJson);

    // 4. Build proof (signature + challenge + verification artifacts)
    const proof = JSON.stringify({
      signature: signature,
      challenge: challenge.data,
      sessionKey: challenge.sessionKey,
      verifiedAt: new Date().toISOString(),
    });

    // 5. Server-side validation (optional but recommended)
    let serverResult: ValidateResponse | null = null;
    try {
      serverResult = await this._validate({
        enrollmentId: "presence-only",
        proof,
        challenge: challenge.data,
      });
    } catch {
      // Server validation is additive — don't fail if unreachable
    }

    // Combine WASM + server results
    const pes = this._extractPes(result, signature);
    const factors = this._extractFactors(result);
    const threshold = riskLevel === "low" ? 0.70 : riskLevel === "medium" ? 0.75 : 0.80;

    return {
      valid: serverResult ? serverResult.valid : result.accept === true,
      pes,
      similarity: result.presence_score ?? 0,
      threshold,
      riskLevel,
      rejectionReason: result.reject_reason ?? undefined,
      factors,
    };
  }

  // ── Enrollment ───────────────────────────────────────────────────

  /**
   * Create an enrollment from multiple motion samples.
   *
   * @param samples - Array of MotionSequences (3-5 recommended)
   * @param userId - Your internal user identifier
   * @param device - Device info for the enrolling device
   * @returns Enrollment data (store this server-side)
   */
  async createEnrollment(
    samples: MotionSequence[],
    userId: string,
    device: DeviceInfo,
  ): Promise<Enrollment> {
    const engine = await loadEngine();

    // Extract signatures from each sample
    const signatures = samples.map((s) => {
      const json = engine.extract_signature(JSON.stringify(s));
      return JSON.parse(json);
    });

    // Create enrollment from signatures
    const enrollmentJson = engine.create_enrollment(
      JSON.stringify(signatures),
      userId,
      JSON.stringify(device),
    );
    const raw = JSON.parse(enrollmentJson);

    return {
      id: generateId("enr"),
      userId,
      device,
      signatureBlob: JSON.stringify(raw),
      createdAt: new Date().toISOString(),
      sampleCount: samples.length,
    };
  }

  // ── Server-Side Validation ───────────────────────────────────────

  /**
   * Validate a presence proof on the MyShape server.
   *
   * This performs an additional server-side check:
   * - API key authorization
   * - Rate limiting
   * - Calibrated thresholds (if available)
   * - Cross-session continuity checks
   *
   * Call this from your backend for maximum security.
   *
   * @param enrollmentId - Enrollment to verify against
   * @param proof - Proof generated by verifyPresence()
   * @returns ValidateResponse
   */
  async validate(enrollmentId: string, proof: string): Promise<ValidateResponse> {
    return this._validate({ enrollmentId, proof, challenge: "" });
  }

  // ── Utility ──────────────────────────────────────────────────────

  /**
   * Check if the WASM engine is loaded and calibrated.
   */
  async getEngineStatus(): Promise<{
    loaded: boolean;
    calibrated: boolean;
    featureDim: number;
  }> {
    try {
      const engine = await loadEngine();
      return {
        loaded: true,
        calibrated: engine.is_calibrated(),
        featureDim: engine.get_feature_dim(),
      };
    } catch {
      return { loaded: false, calibrated: false, featureDim: 120 };
    }
  }

  // ── Private ──────────────────────────────────────────────────────

  private async _validate(body: {
    enrollmentId: string;
    proof: string;
    challenge: string;
  }): Promise<ValidateResponse> {
    const res = await fetch(`${this.baseUrl}/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Validation failed (HTTP ${res.status})`);
    }

    return res.json();
  }

  private _extractPes(raw: Record<string, unknown>, signature: Record<string, unknown>): number {
    // PES is computed from factor scores
    const factors = raw.factors as Record<string, number> | undefined;
    if (factors) {
      const { kinematicScore, accelerationScore, jerkScore, jerkSpectrumScore } = factors;
      const weights = [0.25, 0.25, 0.25, 0.25];
      return (
        weights[0] * (kinematicScore ?? 0) +
        weights[1] * (accelerationScore ?? 0) +
        weights[2] * (jerkScore ?? 0) +
        weights[3] * (jerkSpectrumScore ?? 0)
      );
    }
    return raw.presence_score as number ?? 0;
  }

  private _extractFactors(raw: Record<string, unknown>): VerificationFactors {
    const f = (raw.factors ?? {}) as Record<string, number>;
    return {
      kinematicScore: f.kinematicScore ?? 0,
      accelerationScore: f.accelerationScore ?? 0,
      jerkScore: f.jerkScore ?? 0,
      jerkSpectrumScore: f.jerkSpectrumScore ?? 0,
      combinedScore: (f.kinematicScore ?? 0) + (f.accelerationScore ?? 0) + (f.jerkScore ?? 0) + (f.jerkSpectrumScore ?? 0),
    };
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function generateSessionKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateId(prefix: string): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${hex}`;
}
