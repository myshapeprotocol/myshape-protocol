// MyShape WASM Bindings — JavaScript-facing API.
//
// Exposes the core engine (challenge generation, motion signature extraction,
// and multi-factor verification) to JavaScript/TypeScript via WebAssembly.
//
// All functions accept and return JSON strings for maximum compatibility.

use myshape_engine::challenge::ChallengeGenerator;
use myshape_engine::motion::signature::MotionSignatureEngine;
use myshape_engine::verification::PresenceScorer;
use myshape_engine::types::*;
use myshape_engine::calibration;

use wasm_bindgen::prelude::*;

// ── Initialization ───────────────────────────────────────────────────

#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

// ── Phase E-4: Calibration Injection ─────────────────────────────────

/// Load a calibration artifact from JSON.
///
/// The artifact is produced by the TypeScript Phase E-2 calibration pipeline
/// (runCalibration()). Once loaded, the engine uses:
///   - ROC operating points for verification thresholds
///   - Population feature statistics for z-score normalization (if dims match)
///   - PCA projection matrix (if dims match)
///
/// Returns `true` if calibration was successfully parsed and activated.
/// Returns `false` if the JSON represents an empty/vacuum calibration.
/// Throws a JS error if the JSON is malformed.
#[wasm_bindgen]
pub fn load_calibration(artifact_json: &str) -> Result<bool, JsValue> {
    calibration::load_calibration(artifact_json)
        .map_err(|e| JsValue::from_str(&format!("Calibration load failed: {}", e)))
}

/// Check whether a calibration artifact is currently active.
#[wasm_bindgen]
pub fn is_calibrated() -> bool {
    calibration::is_calibrated()
}

/// Get calibration metadata as a JSON string.
/// Returns `null` (JS null) if not calibrated.
#[wasm_bindgen]
pub fn get_calibration_info() -> Option<String> {
    calibration::get_calibration_info()
}

/// Reset calibration to vacuum state (for testing).
#[wasm_bindgen]
pub fn reset_calibration() {
    calibration::reset_calibration();
}

// ── Challenge Generation ─────────────────────────────────────────────

/// Generate a challenge for presence verification.
///
/// Uses `Date.now()` from JavaScript (WASM-compatible) for the timestamp.
/// Returns a JSON string containing the Challenge object
/// with actions, timing constraints, nonce, and HMAC token.
#[wasm_bindgen]
pub fn generate_challenge(session_key_hex: &str) -> Result<String, JsValue> {
    let key = hex::decode(session_key_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid hex session key: {}", e)))?;

    let mut gen = ChallengeGenerator::new(key);
    // Use JS timestamp — SystemTime::now() is unavailable on wasm32-unknown-unknown
    let timestamp = js_sys::Date::now() / 1000.0;
    let challenge = gen.generate_with_timestamp(timestamp);

    serde_json::to_string(&challenge)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

// ── Flat types for JS-friendly serialization ──────────────────────────
// nalgebra's DVector serde produces [data, len, null] which is opaque to JS.
// These flat types use plain Vec<f32> for direct JSON array serialization.

#[derive(serde::Serialize)]
struct FlatMotionSignature {
    vector: Vec<f32>,
    version: u32,
}

#[derive(serde::Serialize)]
struct FlatEnrollment {
    user_id: String,
    signature: FlatMotionSignature,
    variance: f64,
    sample_count: u32,
    enrolled_at: f64,
    device_info: DeviceInfo,
}

impl From<MotionSignature> for FlatMotionSignature {
    fn from(sig: MotionSignature) -> Self {
        FlatMotionSignature {
            vector: sig.vector.iter().copied().collect(),
            version: sig.version,
        }
    }
}

impl From<Enrollment> for FlatEnrollment {
    fn from(enr: Enrollment) -> Self {
        FlatEnrollment {
            user_id: enr.user_id,
            signature: FlatMotionSignature::from(enr.signature),
            variance: enr.variance,
            sample_count: enr.sample_count,
            enrolled_at: enr.enrolled_at,
            device_info: enr.device_info,
        }
    }
}

impl From<FlatMotionSignature> for MotionSignature {
    fn from(flat: FlatMotionSignature) -> Self {
        MotionSignature {
            vector: nalgebra::DVector::from_vec(flat.vector),
            version: flat.version,
        }
    }
}

// Flat input types for deserialization (accept JS-friendly format)
#[derive(serde::Deserialize)]
struct FlatEnrollmentInput {
    user_id: String,
    signature: FlatMotionSignatureInput,
    variance: f64,
    sample_count: u32,
    enrolled_at: f64,
    device_info: DeviceInfo,
}

#[derive(serde::Deserialize)]
struct FlatMotionSignatureInput {
    vector: Vec<f32>,
    version: u32,
}

// Explicit conversion helpers (avoid orphan rule issues with From trait)
fn to_motion_signature(flat: FlatMotionSignatureInput) -> MotionSignature {
    MotionSignature {
        vector: nalgebra::DVector::from_vec(flat.vector),
        version: flat.version,
    }
}

fn to_enrollment(flat: FlatEnrollmentInput) -> Enrollment {
    Enrollment {
        user_id: flat.user_id,
        signature: to_motion_signature(flat.signature),
        variance: flat.variance,
        sample_count: flat.sample_count,
        enrolled_at: flat.enrolled_at,
        device_info: flat.device_info,
    }
}

// ── Motion Signature Extraction ──────────────────────────────────────

/// Extract a Motion Signature from a motion sequence.
///
/// `motion_json` should be a JSON MotionSequence:
///   { "fps": 30, "frames": [{ "t": 0.0, "keypoints": [{ "x": 0, "y": 0, "z": 0 }, ...] }, ...] }
///
/// Phase E-4: Uses calibration-aware engine. If a calibration artifact is loaded
/// with matching feature dimensions, PCA projection and population z-score
/// normalization are applied during extraction. Falls back to vacuum defaults
/// (identity projection, zero means, unit stds) if not calibrated.
///
/// Returns a JSON FlatMotionSignature: { "vector": [128 floats], "version": 1 }
#[wasm_bindgen]
pub fn extract_signature(motion_json: &str) -> Result<String, JsValue> {
    let sequence: MotionSequence = serde_json::from_str(motion_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid motion data: {}", e)))?;

    // Phase E-4: Use calibration-aware engine if available
    let engine = MotionSignatureEngine::with_calibration();
    let signature = engine.extract(&sequence);
    let flat = FlatMotionSignature::from(signature);

    serde_json::to_string(&flat)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Compute the similarity score between two motion signatures.
///
/// Uses L2-normalized distance (captures both direction and magnitude).
/// Returns a value in [0.0, 1.0] where 1.0 = identical.
/// Returns -1.0 on parse error.
#[wasm_bindgen]
pub fn similarity(enrollment_json: &str, response_json: &str) -> f64 {
    let enrollment: Option<FlatMotionSignatureInput> = serde_json::from_str(enrollment_json).ok();
    let response: Option<FlatMotionSignatureInput> = serde_json::from_str(response_json).ok();

    match (enrollment, response) {
        (Some(e), Some(r)) => {
            let e_sig = to_motion_signature(e);
            let r_sig = to_motion_signature(r);
            MotionSignatureEngine::similarity(&e_sig, &r_sig)
        }
        _ => -1.0,
    }
}

// ── Verification ─────────────────────────────────────────────────────

/// Verify a challenge response against an enrolled signature.
///
/// `enrollment_json`: JSON Enrollment object
/// `challenge_json`: JSON Challenge object (the challenge that was issued)
/// `response_json`: JSON ChallengeResponse object
/// `signature_json`: JSON MotionSignature extracted from the response
/// `risk_level`: "low" | "medium" | "high"
///
/// Returns a JSON VerificationResult with presence_score, factor breakdown, and accept/reject.
#[wasm_bindgen]
pub fn verify_intent(
    enrollment_json: &str,
    challenge_json: &str,
    response_json: &str,
    signature_json: &str,
    risk_level: &str,
) -> Result<String, JsValue> {
    // Parse inputs (accept flat JS-friendly format)
    let flat_enrollment: FlatEnrollmentInput = serde_json::from_str(enrollment_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid enrollment: {}", e)))?;
    let enrollment: Enrollment = to_enrollment(flat_enrollment);

    let _challenge: Challenge = serde_json::from_str(challenge_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid challenge: {}", e)))?;

    let response: ChallengeResponse = serde_json::from_str(response_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid response: {}", e)))?;

    let flat_sig: FlatMotionSignatureInput = serde_json::from_str(signature_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid signature: {}", e)))?;
    let signature: MotionSignature = to_motion_signature(flat_sig);

    let risk = match risk_level {
        "high" => RiskLevel::High,
        "medium" => RiskLevel::Medium,
        _ => RiskLevel::Low,
    };

    // Run verification with JS timestamp (WASM-compatible)
    let mut scorer = PresenceScorer::new(enrollment);
    let now = js_sys::Date::now() / 1000.0;
    let result = scorer.verify_with_timestamp(&response, &signature, risk, now);

    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Create an enrollment from multiple motion samples.
///
/// `signatures_json`: JSON array of MotionSignature objects
/// `user_id`: user identifier
/// `device_json`: JSON DeviceInfo for the enrolling device
///
/// Returns a JSON Enrollment object.
#[wasm_bindgen]
pub fn create_enrollment(
    signatures_json: &str,
    user_id: &str,
    device_json: &str,
) -> Result<String, JsValue> {
    let flat_sigs: Vec<FlatMotionSignatureInput> = serde_json::from_str(signatures_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid signatures: {}", e)))?;
    let signatures: Vec<MotionSignature> = flat_sigs.into_iter().map(to_motion_signature).collect();

    let device_info: DeviceInfo = serde_json::from_str(device_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid device info: {}", e)))?;

    let enrolled_sig = MotionSignatureEngine::enroll(&signatures);
    let variance = MotionSignatureEngine::compute_variance(&signatures);

    let enrollment = Enrollment {
        user_id: user_id.to_string(),
        signature: enrolled_sig,
        variance,
        sample_count: signatures.len() as u32,
        enrolled_at: js_sys::Date::now() / 1000.0,
        device_info,
    };

    let flat = FlatEnrollment::from(enrollment);
    serde_json::to_string(&flat)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

// ── Phase E Route B: 120-dim Feature Extraction ──────────────────────

/// Extract the raw 120-dimensional feature vector from a motion sequence.
///
/// This is the SAME feature vector the engine uses internally for signature
/// extraction. Exposing it allows the TypeScript calibration pipeline to
/// compute PCA and population statistics in the engine's native feature space.
///
/// Input: JSON MotionSequence (same format as extract_signature)
/// Returns: JSON number array — [120 f32 values] = [K(40) | A(25) | J(25) | J_spec(30)]
#[wasm_bindgen]
pub fn extract_feature_vector(motion_json: &str) -> Result<String, JsValue> {
    let sequence: MotionSequence = serde_json::from_str(motion_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid motion data: {}", e)))?;

    let engine = MotionSignatureEngine::new();
    let features = engine.extract_feature_vector(&sequence);

    serde_json::to_string(&features)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Get the raw feature dimension (120 for the current engine).
#[wasm_bindgen]
pub fn get_feature_dim() -> u32 {
    MotionSignatureEngine::feature_dim() as u32
}

// ── Motion Synthesis (for demo) ──────────────────────────────────────

/// Generate synthetic human-like motion data with realistic micro-tremor.
///
/// Parameters:
///   - duration_s: duration in seconds (e.g. 3.0)
///   - fps: frames per second (e.g. 30)
///   - amplitude: base motion amplitude in meters (e.g. 0.15)
///
/// Returns JSON MotionSequence with 33 keypoints per frame.
/// Includes: 8-12Hz physiological tremor, 1/f-like jerk spectrum,
/// natural acceleration noise, and biomechanical micro-perturbations.
#[wasm_bindgen]
pub fn generate_human_motion(duration_s: f32, fps: u32, amplitude: f32) -> String {
    let n_frames = (duration_s * fps as f32).ceil() as usize;
    let dt = 1.0 / fps as f32;

    // Pseudo-random state (seeded for reproducibility)
    let mut rng_state: u64 = 12345;

    let mut frames = Vec::with_capacity(n_frames);

    for i in 0..n_frames {
        let t = i as f32 * dt;
        let mut keypoints = Vec::with_capacity(33);

        for kp_idx in 0..33 {
            // Base sinusoidal motion (simulating a "draw circle" challenge)
            let phase = t * 2.0 * std::f32::consts::PI;
            let base_x = amplitude * phase.sin();
            let base_y = amplitude * phase.cos();
            let base_z = 0.02 * (t * 3.0).sin();

            // Physiological tremor: 8-12 Hz narrow-band oscillation
            let tremor_freq = 9.5 + 0.5 * pseudo_random(&mut rng_state); // 9.5-10.0 Hz
            let tremor_amp = 0.002 + 0.001 * pseudo_random(&mut rng_state); // 2-3mm
            let tremor = tremor_amp * (t * tremor_freq * 2.0 * std::f32::consts::PI).sin();

            // 1/f-like jerk noise: multi-scale perturbation
            let jerk_noise = 0.0015 * (t * 5.3).sin()
                + 0.0010 * (t * 11.7).sin()
                + 0.0007 * (t * 23.1).sin()
                + 0.0004 * (t * 37.3).sin()
                + 0.0002 * (t * 51.9).sin();

            // Micro-kinetic perturbation (non-stationary)
            let kinetic_noise = 0.0008 * pseudo_random(&mut rng_state)
                * (1.0 + 0.3 * (t * 0.7).sin());

            // Natural latency variation per keypoint
            let latency = (kp_idx as f32 * 0.0003) * (t * 2.1).cos();

            // Combine: primary motion + tremor + jerk noise + kinetic noise + latency
            let x = base_x + tremor + jerk_noise + kinetic_noise + latency;
            let y = base_y + tremor * 0.7 + jerk_noise * 0.8 + kinetic_noise * 0.9;
            let z = base_z + tremor * 0.3 + jerk_noise * 0.5;

            keypoints.push(Keypoint { x, y, z });
        }

        frames.push(PoseFrame { t, keypoints });
    }

    let sequence = MotionSequence { fps, frames };
    serde_json::to_string(&sequence).unwrap_or_default()
}

/// Generate synthetic AI-forged motion data.
///
/// The AI generates a "perfect-looking" trajectory that:
///   - Follows the challenge geometry accurately
///   - Lacks physiological tremor (8-12Hz band absent)
///   - Has over-smoothed jerk (spectral slope >2.0 or near-zero)
///   - Shows excessive temporal regularity
///   - Lacks micro-kinetic perturbations
///
/// This motion looks visually correct but fails deep kinematic verification.
#[wasm_bindgen]
pub fn generate_ai_motion(duration_s: f32, fps: u32, amplitude: f32) -> String {
    let n_frames = (duration_s * fps as f32).ceil() as usize;
    let dt = 1.0 / fps as f32;

    let mut frames = Vec::with_capacity(n_frames);

    for i in 0..n_frames {
        let t = i as f32 * dt;
        let mut keypoints = Vec::with_capacity(33);

        for _kp_idx in 0..33 {
            // Perfect sinusoidal trajectory — geometrically "correct"
            let phase = t * 2.0 * std::f32::consts::PI;
            let base_x = amplitude * phase.sin();
            let base_y = amplitude * phase.cos();
            let base_z = 0.02 * (t * 3.0).sin();

            // AI "smoothing": apply a low-pass-like attenuation
            // Real AI motion models (diffusion, VAE) inherently smooth high frequencies
            // due to L2 loss and mode-seeking behavior
            let smooth_factor = 0.98; // aggressive smoothing
            let x = base_x * smooth_factor;
            let y = base_y * smooth_factor;
            let z = base_z * smooth_factor;

            // Key difference: NO tremor, NO jerk complexity, NO kinetic noise
            // The result is "too perfect" — over-smoothed jerk spectrum,
            // missing 8-12Hz band, Hurst exponent near 0.5

            keypoints.push(Keypoint { x, y, z });
        }

        frames.push(PoseFrame { t, keypoints });
    }

    let sequence = MotionSequence { fps, frames };
    serde_json::to_string(&sequence).unwrap_or_default()
}

// ── Helpers ──────────────────────────────────────────────────────────

/// Simple pseudo-random number generator (xorshift).
/// Returns a value in [0.0, 1.0).
fn pseudo_random(state: &mut u64) -> f32 {
    *state ^= *state << 13;
    *state ^= *state >> 7;
    *state ^= *state << 17;
    (*state as f32) / (u64::MAX as f32)
}
