/* tslint:disable */
/* eslint-disable */

/**
 * Create an enrollment from multiple motion samples.
 *
 * `signatures_json`: JSON array of MotionSignature objects
 * `user_id`: user identifier
 * `device_json`: JSON DeviceInfo for the enrolling device
 *
 * Returns a JSON Enrollment object.
 */
export function create_enrollment(signatures_json: string, user_id: string, device_json: string): string;

/**
 * Extract the raw 120-dimensional feature vector from a motion sequence.
 *
 * This is the SAME feature vector the engine uses internally for signature
 * extraction. Exposing it allows the TypeScript calibration pipeline to
 * compute PCA and population statistics in the engine's native feature space.
 *
 * Input: JSON MotionSequence (same format as extract_signature)
 * Returns: JSON number array — [120 f32 values] = [K(40) | A(25) | J(25) | J_spec(30)]
 */
export function extract_feature_vector(motion_json: string): string;

/**
 * Extract a Motion Signature from a motion sequence.
 *
 * `motion_json` should be a JSON MotionSequence:
 *   { "fps": 30, "frames": [{ "t": 0.0, "keypoints": [{ "x": 0, "y": 0, "z": 0 }, ...] }, ...] }
 *
 * Phase E-4: Uses calibration-aware engine. If a calibration artifact is loaded
 * with matching feature dimensions, PCA projection and population z-score
 * normalization are applied during extraction. Falls back to vacuum defaults
 * (identity projection, zero means, unit stds) if not calibrated.
 *
 * Returns a JSON FlatMotionSignature: { "vector": [128 floats], "version": 1 }
 */
export function extract_signature(motion_json: string): string;

/**
 * Generate synthetic AI-forged motion data.
 *
 * The AI generates a "perfect-looking" trajectory that:
 *   - Follows the challenge geometry accurately
 *   - Lacks physiological tremor (8-12Hz band absent)
 *   - Has over-smoothed jerk (spectral slope >2.0 or near-zero)
 *   - Shows excessive temporal regularity
 *   - Lacks micro-kinetic perturbations
 *
 * This motion looks visually correct but fails deep kinematic verification.
 */
export function generate_ai_motion(duration_s: number, fps: number, amplitude: number): string;

/**
 * Generate a challenge for presence verification.
 *
 * Uses `Date.now()` from JavaScript (WASM-compatible) for the timestamp.
 * Returns a JSON string containing the Challenge object
 * with actions, timing constraints, nonce, and HMAC token.
 */
export function generate_challenge(session_key_hex: string): string;

/**
 * Generate synthetic human-like motion data with realistic micro-tremor.
 *
 * Parameters:
 *   - duration_s: duration in seconds (e.g. 3.0)
 *   - fps: frames per second (e.g. 30)
 *   - amplitude: base motion amplitude in meters (e.g. 0.15)
 *
 * Returns JSON MotionSequence with 33 keypoints per frame.
 * Includes: 8-12Hz physiological tremor, 1/f-like jerk spectrum,
 * natural acceleration noise, and biomechanical micro-perturbations.
 */
export function generate_human_motion(duration_s: number, fps: number, amplitude: number): string;

/**
 * Get calibration metadata as a JSON string.
 * Returns `null` (JS null) if not calibrated.
 */
export function get_calibration_info(): string | undefined;

/**
 * Get the raw feature dimension (120 for the current engine).
 */
export function get_feature_dim(): number;

export function init_panic_hook(): void;

/**
 * Check whether a calibration artifact is currently active.
 */
export function is_calibrated(): boolean;

/**
 * Load a calibration artifact from JSON.
 *
 * The artifact is produced by the TypeScript Phase E-2 calibration pipeline
 * (runCalibration()). Once loaded, the engine uses:
 *   - ROC operating points for verification thresholds
 *   - Population feature statistics for z-score normalization (if dims match)
 *   - PCA projection matrix (if dims match)
 *
 * Returns `true` if calibration was successfully parsed and activated.
 * Returns `false` if the JSON represents an empty/vacuum calibration.
 * Throws a JS error if the JSON is malformed.
 */
export function load_calibration(artifact_json: string): boolean;

/**
 * Reset calibration to vacuum state (for testing).
 */
export function reset_calibration(): void;

/**
 * Compute the similarity score between two motion signatures.
 *
 * Uses L2-normalized distance (captures both direction and magnitude).
 * Returns a value in [0.0, 1.0] where 1.0 = identical.
 * Returns -1.0 on parse error.
 */
export function similarity(enrollment_json: string, response_json: string): number;

/**
 * Verify a challenge response against an enrolled signature.
 *
 * `enrollment_json`: JSON Enrollment object
 * `challenge_json`: JSON Challenge object (the challenge that was issued)
 * `response_json`: JSON ChallengeResponse object
 * `signature_json`: JSON MotionSignature extracted from the response
 * `risk_level`: "low" | "medium" | "high"
 *
 * Returns a JSON VerificationResult with presence_score, factor breakdown, and accept/reject.
 */
export function verify_intent(enrollment_json: string, challenge_json: string, response_json: string, signature_json: string, risk_level: string): string;
