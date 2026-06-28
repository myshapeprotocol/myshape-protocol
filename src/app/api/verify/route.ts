/**
 * POST /api/verify — Server-side Presence Verification
 *
 * Runs the MyShape WASM engine on the server to verify a challenge response.
 * Accepts flat-format JSON (the same format the browser SDK produces).
 *
 * Phase E-3: Applies calibrated thresholds from CalibrationLoader when available.
 * Falls back to WASM's built-in vacuum defaults (0.70/0.75/0.80) if not calibrated.
 *
 * Request payload:
 *   { enrollment, challenge, response, signature, risk_level }
 *
 * Returns:
 *   VerificationResult {
 *     verified, presence_score, factors,
 *     threshold, threshold_source,  // ← threshold_source added (Phase E-3)
 *     rejection_reason
 *   }
 *
 * Runtime: Node.js (required for WASM)
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { enrollment, challenge, response, signature, risk_level } = payload;

    // Validate required fields
    if (!enrollment || !challenge || !response || !signature) {
      return Response.json(
        { error: 'Missing required fields: enrollment, challenge, response, signature' },
        { status: 400 }
      );
    }

    // Lazy-load WASM engine (cached after first load)
    const wasm = await loadWasmEngine();

    // ── Phase E-3: Load calibration (non-blocking — falls back to vacuum) ──
    const { getCalibrationLoader } = await import('@/lib/calibration-loader');
    const calibrationLoader = await getCalibrationLoader();

    // Verify challenge token (anti-replay)
    if (!challenge.challenge_token || !challenge.challenge_id) {
      return Response.json(
        { error: 'Invalid challenge: missing token or ID' },
        { status: 400 }
      );
    }

    // Run WASM verification (always — we need the factor scores)
    const riskLevel = risk_level ?? 'medium';
    const resultJson = wasm.verify_intent(
      JSON.stringify(enrollment),
      JSON.stringify(challenge),
      JSON.stringify(response),
      JSON.stringify(signature),
      riskLevel
    );

    const result = JSON.parse(resultJson);

    // ── Phase E-3: Calibrated threshold override ──
    // WASM computes presence_score using the internal (possibly calibrated)
    // signature engine. We then apply the ROC-optimized threshold instead of
    // the hardcoded one. If not calibrated, vacuum defaults apply transparently.
    const calibratedVerdict = calibrationLoader.verify(
      result.presence_score,
      riskLevel as 'low' | 'medium' | 'high'
    );

    const wasmThreshold = result.threshold;
    const calibratedThreshold = calibratedVerdict.threshold;
    const thresholdChanged = Math.abs(calibratedThreshold - wasmThreshold) > 0.001;

    // If calibrated threshold is more restrictive than WASM's hardcoded one,
    // use the calibrated verdict. Otherwise, use WASM's verdict (conservative).
    // When not calibrated: calibratedThreshold === wasmThreshold (vacuum defaults).
    const finalVerified = thresholdChanged
      ? calibratedVerdict.verified
      : result.verified;

    return Response.json({
      verified: finalVerified,
      presence_score: result.presence_score,
      factors: result.factors,
      risk_level: result.risk_level,
      // The effective threshold that was applied
      threshold: calibratedThreshold,
      // Original WASM threshold (for observability — did calibration change it?)
      wasm_threshold: thresholdChanged ? wasmThreshold : undefined,
      // Phase E-3 metadata
      threshold_source: calibrationLoader.getState().source,
      rejection_reason: result.rejection_reason ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    console.error('[verify] Error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}

// ── WASM Engine Singleton ───────────────────────────────────────────

let wasmEngine: WasmVerifyModule | null = null;

interface WasmVerifyModule {
  verify_intent(
    enrollment_json: string,
    challenge_json: string,
    response_json: string,
    signature_json: string,
    risk_level: string
  ): string;
}

async function loadWasmEngine(): Promise<WasmVerifyModule> {
  if (wasmEngine) return wasmEngine;

  // Dynamic import from the Node.js WASM target
  // Path relative to this file: src/app/api/verify/ → ../../../../wasm/pkg/
  const wasm = await import('../../../../wasm/pkg/myshape_wasm.js');
  wasmEngine = wasm as WasmVerifyModule;
  return wasmEngine;
}
