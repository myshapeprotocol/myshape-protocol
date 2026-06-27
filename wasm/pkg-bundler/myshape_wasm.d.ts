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
 * Extract a Motion Signature from a motion sequence.
 *
 * `motion_json` should be a JSON MotionSequence:
 *   { "fps": 30, "frames": [{ "t": 0.0, "keypoints": [{ "x": 0, "y": 0, "z": 0 }, ...] }, ...] }
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

export function init_panic_hook(): void;

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
