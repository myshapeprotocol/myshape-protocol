// ============================================================
// MyShape Engine — Phase E-4 Calibration Injection
// ============================================================
//
// Deserializes the TypeScript-generated CalibrationArtifact JSON
// and injects its parameters into the verification pipeline.
//
// Three structural fixes:
//   1. ROC operating points → replace hardcoded 0.70/0.75/0.80
//   2. Population feature statistics → replace zero means / unit stds
//   3. PCA projection matrix → replace identity-adjacent projection
//
// The artifact JSON is produced by the TypeScript Phase E-2 pipeline
// (runCalibration()) and loaded into the engine at initialization time.
//
// Thread safety: Calibration is stored in a std::sync::RwLock, allowing
// concurrent reads after initialization. WASM is single-threaded, so
// contention is not a concern.

use nalgebra::{DMatrix, DVector};
use serde::{Deserialize, Serialize};
use std::sync::RwLock;

// ═══════════════════════════════════════════════════════════════════
// Serde Structs — exact match to TypeScript CalibrationArtifact
// ═══════════════════════════════════════════════════════════════════

/// Full calibration artifact bundle.
/// JSON schema: identical to TS `CalibrationArtifact` (version 1).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalibrationArtifact {
    pub version: u32,
    pub pca: PCAParams,
    pub stats: PopulationStats,
    pub roc: ROCParams,
    #[serde(rename = "featureMode")]
    pub feature_mode: String,
    #[serde(rename = "totalSessions")]
    pub total_sessions: u32,
    #[serde(rename = "totalFrames")]
    pub total_frames: u32,
    #[serde(rename = "trainingSetHash")]
    pub training_set_hash: String,
    #[serde(rename = "generatedAt")]
    pub generated_at: f64,
    pub label: String,
}

/// PCA projection parameters.
/// Matches TS `PCAResult`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PCAParams {
    /// Number of input feature dimensions
    #[serde(rename = "inputDim")]
    pub input_dim: usize,
    /// Number of output (principal) dimensions
    #[serde(rename = "outputDim")]
    pub output_dim: usize,
    /// Projection matrix P: k × d, flat row-major array of length k*d
    #[serde(rename = "projectionMatrix")]
    pub projection_matrix: Vec<f64>,
    /// Mean vector μ: length d
    pub mean: Vec<f64>,
    /// Eigenvalues in descending order
    pub eigenvalues: Vec<f64>,
    /// Explained variance ratio per component
    #[serde(rename = "explainedVarianceRatio")]
    pub explained_variance_ratio: Vec<f64>,
    /// Cumulative explained variance
    #[serde(rename = "cumulativeVariance")]
    pub cumulative_variance: Vec<f64>,
    /// Feature mode used for this PCA
    #[serde(rename = "featureMode")]
    pub feature_mode: String,
    /// Number of samples used
    #[serde(rename = "numSamples")]
    pub num_samples: u32,
    /// Number of sessions used
    #[serde(rename = "numSessions")]
    pub num_sessions: u32,
    /// UTC timestamp of calibration (ms)
    #[serde(rename = "calibratedAt")]
    pub calibrated_at: f64,
}

/// Population feature statistics.
/// Matches TS `PopulationFeatureStats`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PopulationStats {
    /// Number of feature dimensions
    pub dim: usize,
    /// Per-dimension mean μ
    pub means: Vec<f64>,
    /// Per-dimension standard deviation σ
    pub stds: Vec<f64>,
    /// Per-dimension minimum
    pub mins: Vec<f64>,
    /// Per-dimension maximum
    pub maxs: Vec<f64>,
    /// Per-dimension median
    pub medians: Vec<f64>,
    /// Per-dimension median absolute deviation
    pub mads: Vec<f64>,
    /// Per-dimension discriminability weight w ∈ [0, 1]
    #[serde(rename = "discriminabilityWeights")]
    pub discriminability_weights: Vec<f64>,
    /// Feature mode
    #[serde(rename = "featureMode")]
    pub feature_mode: String,
    /// Number of samples
    #[serde(rename = "numSamples")]
    pub num_samples: u32,
    /// Number of sessions
    #[serde(rename = "numSessions")]
    pub num_sessions: u32,
    /// UTC timestamp
    #[serde(rename = "calibratedAt")]
    pub calibrated_at: f64,
}

/// ROC calibration parameters.
/// Matches TS `ROCCalibration`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ROCParams {
    /// ROC curve points (not used at runtime — for diagnostics)
    #[serde(default)]
    pub curve: Vec<ROCPoint>,
    /// Area Under Curve
    pub auc: f64,
    /// Equal Error Rate
    pub eer: f64,
    /// Threshold at EER
    #[serde(rename = "eerThreshold")]
    pub eer_threshold: f64,
    /// d-prime discriminability index
    #[serde(rename = "dPrime")]
    pub d_prime: f64,
    /// Operating points for target FAR levels
    #[serde(rename = "operatingPoints")]
    pub operating_points: Vec<OperatingPoint>,
    /// Number of genuine comparisons
    #[serde(rename = "genuineComparisons")]
    pub genuine_comparisons: u32,
    /// Number of impostor comparisons
    #[serde(rename = "impostorComparisons")]
    pub impostor_comparisons: u32,
    /// UTC timestamp
    #[serde(rename = "calibratedAt")]
    pub calibrated_at: f64,
}

/// A single point on the ROC curve (for diagnostics).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ROCPoint {
    pub far: f64,
    pub tar: f64,
    pub threshold: f64,
}

/// A target operating point — threshold for a specific FAR.
/// Matches TS `OperatingPoint`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperatingPoint {
    /// Target False Accept Rate
    #[serde(rename = "targetFar")]
    pub target_far: f64,
    /// Calibrated threshold at this FAR
    pub threshold: f64,
    /// Actual FAR achieved
    #[serde(rename = "actualFar")]
    pub actual_far: f64,
    /// True Accept Rate at this threshold
    pub tar: f64,
    /// False Reject Rate at this threshold
    pub frr: f64,
}

// ═══════════════════════════════════════════════════════════════════
// Global Calibration State (thread-safe singleton)
// ═══════════════════════════════════════════════════════════════════

/// Holds the active calibration state.
static CALIBRATION: RwLock<Option<ActiveCalibration>> = RwLock::new(None);

/// Parsed and validated calibration ready for engine consumption.
#[derive(Debug, Clone)]
pub struct ActiveCalibration {
    /// Original artifact for metadata
    pub artifact: CalibrationArtifact,
    /// PCA projection matrix as nalgebra DMatrix (f32 for engine compat)
    pub projection: DMatrix<f32>,
    /// PCA mean vector
    pub pca_mean: DVector<f32>,
    /// Feature means for z-score normalization
    pub feature_means: DVector<f32>,
    /// Feature standard deviations for z-score normalization
    pub feature_stds: DVector<f32>,
    /// Discriminability weights
    pub weights: Vec<f64>,
    /// ROC thresholds: [low (10% FAR), medium (5% FAR), high (1% FAR)]
    pub thresholds: [f64; 3],
    /// Calibration source label
    pub source: String,
    /// When this calibration was loaded (Unix ms)
    pub loaded_at: f64,
}

// ═══════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════

/// Load calibration from a JSON string (the TypeScript CalibrationArtifact).
///
/// Returns Ok(true) if calibration was successfully parsed and activated.
/// Returns Ok(false) if the JSON represents vacuum/default calibration.
/// Returns Err if the JSON is malformed.
pub fn load_calibration(json: &str) -> Result<bool, String> {
    let artifact: CalibrationArtifact = serde_json::from_str(json)
        .map_err(|e| format!("Failed to parse calibration artifact: {}", e))?;

    // Validate version
    if artifact.version != 1 {
        return Err(format!(
            "Unsupported calibration artifact version: {} (expected 1)",
            artifact.version
        ));
    }

    // Validate operating points — need exactly 3 (low/medium/high)
    if artifact.roc.operating_points.len() < 3 {
        return Err(format!(
            "Insufficient operating points: {} (expected ≥3 for low/medium/high)",
            artifact.roc.operating_points.len()
        ));
    }

    let active = build_active_calibration(&artifact)?;

    // Atomically swap
    match CALIBRATION.write() {
        Ok(mut guard) => {
            *guard = Some(active);
            Ok(true)
        }
        Err(e) => Err(format!("Calibration lock poisoned: {}", e)),
    }
}

/// Check whether a calibration artifact is currently loaded.
pub fn is_calibrated() -> bool {
    CALIBRATION.read().ok().map(|g| g.is_some()).unwrap_or(false)
}

/// Get calibration metadata as a JSON string (for observability).
/// Returns None if not calibrated.
pub fn get_calibration_info() -> Option<String> {
    let guard = CALIBRATION.read().ok()?;
    let active = guard.as_ref()?;

    #[derive(Serialize)]
    struct CalibrationInfo {
        source: String,
        sessions: u32,
        frames: u32,
        pca_input_dim: usize,
        pca_output_dim: usize,
        d_prime: f64,
        eer: f64,
        auc: f64,
        threshold_low: f64,
        threshold_medium: f64,
        threshold_high: f64,
        loaded_at: f64,
        label: String,
        training_set_hash: String,
    }

    let info = CalibrationInfo {
        source: active.source.clone(),
        sessions: active.artifact.total_sessions,
        frames: active.artifact.total_frames,
        pca_input_dim: active.artifact.pca.input_dim,
        pca_output_dim: active.artifact.pca.output_dim,
        d_prime: active.artifact.roc.d_prime,
        eer: active.artifact.roc.eer,
        auc: active.artifact.roc.auc,
        threshold_low: active.thresholds[0],
        threshold_medium: active.thresholds[1],
        threshold_high: active.thresholds[2],
        loaded_at: active.loaded_at,
        label: active.artifact.label.clone(),
        training_set_hash: active.artifact.training_set_hash.clone(),
    };

    serde_json::to_string(&info).ok()
}

/// Get the calibrated threshold for a given risk level.
/// Returns None if not calibrated — caller should use vacuum defaults.
pub fn get_threshold(risk_level: &str) -> Option<f64> {
    let guard = CALIBRATION.read().ok()?;
    let active = guard.as_ref()?;

    let idx = match risk_level {
        "high" => 0,    // target FAR 1% — most strict
        "medium" => 1,  // target FAR 5%
        "low" => 2,     // target FAR 10% — most permissive
        _ => return None,
    };

    Some(active.thresholds[idx])
}

/// Get the active calibration's feature normalization parameters.
/// Returns (means, stds) as nalgebra vectors, or None if not calibrated.
pub fn get_normalization_params() -> Option<(DVector<f32>, DVector<f32>)> {
    let guard = CALIBRATION.read().ok()?;
    let active = guard.as_ref()?;
    Some((active.feature_means.clone(), active.feature_stds.clone()))
}

/// Get the active calibration's PCA projection matrix and mean.
/// Returns (projection, mean) or None if not calibrated.
pub fn get_pca_params() -> Option<(DMatrix<f32>, DVector<f32>)> {
    let guard = CALIBRATION.read().ok()?;
    let active = guard.as_ref()?;
    Some((active.projection.clone(), active.pca_mean.clone()))
}

/// Reset calibration to vacuum state.
pub fn reset_calibration() {
    if let Ok(mut guard) = CALIBRATION.write() {
        *guard = None;
    }
}

// ═══════════════════════════════════════════════════════════════════
// Internal: Build ActiveCalibration from artifact
// ═══════════════════════════════════════════════════════════════════

fn build_active_calibration(artifact: &CalibrationArtifact) -> Result<ActiveCalibration, String> {
    // ── Build PCA projection matrix ──
    let k = artifact.pca.output_dim;
    let d = artifact.pca.input_dim;

    let expected_len = k * d;
    if artifact.pca.projection_matrix.len() != expected_len {
        return Err(format!(
            "PCA projection matrix size mismatch: got {} elements, expected {} ({} × {})",
            artifact.pca.projection_matrix.len(),
            expected_len,
            k,
            d,
        ));
    }

    // Build nalgebra DMatrix from flat row-major vec<f64>
    let projection = DMatrix::from_row_iterator(k, d, artifact.pca.projection_matrix.iter().map(|&v| v as f32));

    // Build PCA mean vector
    if artifact.pca.mean.len() != d {
        return Err(format!(
            "PCA mean vector size mismatch: got {}, expected {}",
            artifact.pca.mean.len(),
            d,
        ));
    }
    let pca_mean = DVector::from_iterator(d, artifact.pca.mean.iter().map(|&v| v as f32));

    // ── Build feature normalization vectors ──
    let stats_dim = artifact.stats.dim;

    if artifact.stats.means.len() != stats_dim || artifact.stats.stds.len() != stats_dim {
        return Err(format!(
            "Population stats size mismatch: means={}, stds={}, expected dim={}",
            artifact.stats.means.len(),
            artifact.stats.stds.len(),
            stats_dim,
        ));
    }

    let feature_means = DVector::from_iterator(
        stats_dim,
        artifact.stats.means.iter().map(|&v| v as f32),
    );
    let feature_stds = DVector::from_iterator(
        stats_dim,
        artifact.stats.stds.iter().map(|&v| {
            let s = v as f32;
            if s < 1e-8 { 1e-6 } else { s } // floor to prevent div-by-zero
        }),
    );

    // ── Build ROC thresholds ──
    // operating_points[0] = target FAR 1% (high security)
    // operating_points[1] = target FAR 5% (medium security)
    // operating_points[2] = target FAR 10% (low security)
    let op = &artifact.roc.operating_points;
    let thresholds: [f64; 3] = [
        op[0].threshold, // high (1% FAR)
        op[1].threshold, // medium (5% FAR)
        op[2].threshold, // low (10% FAR)
    ];

    // Validate threshold ordering: high ≥ medium ≥ low
    if thresholds[0] < thresholds[1] || thresholds[1] < thresholds[2] {
        // Non-monotonic thresholds can happen with limited data.
        // Clamp to enforce ordering: high = max, low = min
        let hi = thresholds[0].max(thresholds[1]).max(thresholds[2]);
        let lo = thresholds[0].min(thresholds[1]).min(thresholds[2]);
        let mi = (thresholds[0] + thresholds[1] + thresholds[2]) / 3.0;
        // Re-assign with ordering enforced
        let thresholds_fixed: [f64; 3] = [hi, mi, lo];
        return build_active_calibration_with_thresholds(artifact, projection, pca_mean, feature_means, feature_stds, thresholds_fixed);
    }

    // Get JS timestamp for loaded_at
    let now = get_js_timestamp();

    Ok(ActiveCalibration {
        artifact: artifact.clone(),
        projection,
        pca_mean,
        feature_means,
        feature_stds,
        weights: artifact.stats.discriminability_weights.clone(),
        thresholds,
        source: "wasm_loader".to_string(),
        loaded_at: now,
    })
}

fn build_active_calibration_with_thresholds(
    artifact: &CalibrationArtifact,
    projection: DMatrix<f32>,
    pca_mean: DVector<f32>,
    feature_means: DVector<f32>,
    feature_stds: DVector<f32>,
    thresholds: [f64; 3],
) -> Result<ActiveCalibration, String> {
    let now = get_js_timestamp();
    Ok(ActiveCalibration {
        artifact: artifact.clone(),
        projection,
        pca_mean,
        feature_means,
        feature_stds,
        weights: artifact.stats.discriminability_weights.clone(),
        thresholds,
        source: "wasm_loader".to_string(),
        loaded_at: now,
    })
}

/// Get current timestamp in milliseconds.
/// On native: uses SystemTime. On WASM: returns 0 (caller provides timestamp).
fn get_js_timestamp() -> f64 {
    #[cfg(not(target_arch = "wasm32"))]
    {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as f64
    }
    #[cfg(target_arch = "wasm32")]
    {
        // On WASM, SystemTime is unavailable. The WASM bindings layer
        // provides the timestamp via a separate path if needed.
        0.0
    }
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;

    /// Build a minimal valid calibration artifact JSON for testing.
    fn make_test_artifact_json() -> String {
        r#"{
            "version": 1,
            "pca": {
                "inputDim": 54,
                "outputDim": 8,
                "projectionMatrix": [
                    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                    0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                    0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                    0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                    0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                    0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                    0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                    0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                ],
                "mean": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                "eigenvalues": [1,0.5,0.3,0.2,0.1,0.05,0.02,0.01],
                "explainedVarianceRatio": [0.4,0.2,0.12,0.08,0.04,0.02,0.008,0.004],
                "cumulativeVariance": [0.4,0.6,0.72,0.8,0.84,0.86,0.868,0.872],
                "featureMode": "posture",
                "numSamples": 9000,
                "numSessions": 300,
                "calibratedAt": 1710000000000
            },
            "stats": {
                "dim": 54,
                "means": [320,240,0,320,200,10,320,180,20,320,300,-5,320,300,5,320,150,0,320,150,0,320,100,0,320,100,5,320,350,-10,320,350,-10,320,400,0,320,400,0,320,480,0,320,480,0,320,280,-20,320,280,0,320,240,0],
                "stds": [50,40,20,45,35,15,40,30,18,35,25,12,35,25,12,55,45,8,55,45,8,50,40,6,50,40,6,30,25,10,30,25,10,35,30,8,35,30,8,40,35,10,40,35,10,25,20,15,30,25,5,50,40,0],
                "mins": [100,100,-50,100,80,-40,120,60,-30,150,150,-30,150,150,-30,100,50,-20,100,50,-20,80,30,-20,80,30,-20,200,200,-40,200,200,-40,250,280,-30,250,280,-30,300,350,-30,300,350,-30,200,150,-50,200,200,-30,150,150,0],
                "maxs": [500,400,50,500,350,50,480,300,60,480,450,30,480,450,40,480,300,30,480,300,30,480,250,30,480,250,40,450,500,30,450,500,30,400,550,30,400,550,30,380,600,30,380,600,30,400,400,30,400,350,30,500,400,0],
                "medians": [320,240,0,320,200,10,320,180,20,320,300,-5,320,300,5,320,150,0,320,150,0,320,100,0,320,100,5,320,350,-10,320,350,-10,320,400,0,320,400,0,320,480,0,320,480,0,320,280,-20,320,280,0,320,240,0],
                "mads": [20,15,8,18,14,6,16,12,7,14,10,5,14,10,5,22,18,3,22,18,3,20,16,2,20,16,2,12,10,4,12,10,4,14,12,3,14,12,3,16,14,4,16,14,4,10,8,6,12,10,2,20,16,0],
                "discriminabilityWeights": [0.8,0.5,0.3,0.7,0.6,0.4,0.6,0.5,0.4,0.5,0.4,0.3,0.5,0.4,0.3,0.9,0.7,0.5,0.9,0.7,0.5,0.8,0.6,0.5,0.8,0.6,0.5,0.6,0.5,0.4,0.6,0.5,0.4,0.5,0.4,0.3,0.5,0.4,0.3,0.4,0.3,0.2,0.4,0.3,0.2,0.5,0.4,0.3,0.6,0.4,0.2,0.3,0.2,0.1],
                "featureMode": "posture",
                "numSamples": 9000,
                "numSessions": 300,
                "calibratedAt": 1710000000000
            },
            "roc": {
                "curve": [],
                "auc": 0.95,
                "eer": 0.08,
                "eerThreshold": 0.72,
                "dPrime": 2.85,
                "operatingPoints": [
                    {"targetFar": 0.01, "threshold": 0.83, "actualFar": 0.009, "tar": 0.92, "frr": 0.08},
                    {"targetFar": 0.05, "threshold": 0.77, "actualFar": 0.048, "tar": 0.95, "frr": 0.05},
                    {"targetFar": 0.10, "threshold": 0.71, "actualFar": 0.097, "tar": 0.97, "frr": 0.03}
                ],
                "genuineComparisons": 500,
                "impostorComparisons": 1500,
                "calibratedAt": 1710000000000
            },
            "featureMode": "posture",
            "totalSessions": 300,
            "totalFrames": 9000,
            "trainingSetHash": "abc12345",
            "generatedAt": 1710000000000,
            "label": "Phase E-4 Test Artifact"
        }"#.to_string()
    }

    #[test]
    fn test_artifact_json_is_valid() {
        reset_calibration();
        let json = make_test_artifact_json();
        let parsed: Result<serde_json::Value, _> = serde_json::from_str(&json);
        assert!(parsed.is_ok(), "JSON should be valid: {:?}", parsed.err());
        let val = parsed.unwrap();
        assert!(val["stats"]["featureMode"].as_str().is_some(), "stats.featureMode should exist");
    }

    #[test]
    fn test_parse_stats_directly() {
        reset_calibration();
        // Test parsing just the PopulationStats struct
        let stats_json = r#"{
            "dim": 54,
            "means": [1.0, 2.0],
            "stds": [0.5, 0.3],
            "mins": [0.0, 0.0],
            "maxs": [2.0, 3.0],
            "medians": [1.0, 2.0],
            "mads": [0.3, 0.2],
            "discriminabilityWeights": [0.8, 0.5],
            "featureMode": "posture",
            "numSamples": 100,
            "numSessions": 10,
            "calibratedAt": 1710000000000
        }"#;
        let stats: Result<PopulationStats, _> = serde_json::from_str(stats_json);
        assert!(stats.is_ok(), "Stats parse should succeed: {:?}", stats.err());
        let s = stats.unwrap();
        assert_eq!(s.dim, 54);
        assert_eq!(s.feature_mode, "posture");
    }

    #[test]
    fn test_load_calibration_minimal() {
        reset_calibration();
        // Minimal valid artifact with small arrays
        let json = r#"{
            "version": 1,
            "pca": {
                "inputDim": 3,
                "outputDim": 2,
                "projectionMatrix": [1,0,0,0,1,0],
                "mean": [0,0,0],
                "eigenvalues": [0.5,0.3],
                "explainedVarianceRatio": [0.5,0.3],
                "cumulativeVariance": [0.5,0.8],
                "featureMode": "posture",
                "numSamples": 100,
                "numSessions": 10,
                "calibratedAt": 0
            },
            "stats": {
                "dim": 3,
                "means": [1,2,3],
                "stds": [0.5,0.5,0.5],
                "mins": [0,0,0],
                "maxs": [2,4,6],
                "medians": [1,2,3],
                "mads": [0.3,0.3,0.3],
                "discriminabilityWeights": [0.8,0.5,0.3],
                "featureMode": "posture",
                "numSamples": 100,
                "numSessions": 10,
                "calibratedAt": 0
            },
            "roc": {
                "curve": [],
                "auc": 0.95,
                "eer": 0.08,
                "eerThreshold": 0.72,
                "dPrime": 2.85,
                "operatingPoints": [
                    {"targetFar": 0.01, "threshold": 0.83, "actualFar": 0.01, "tar": 0.92, "frr": 0.08},
                    {"targetFar": 0.05, "threshold": 0.77, "actualFar": 0.05, "tar": 0.95, "frr": 0.05},
                    {"targetFar": 0.10, "threshold": 0.71, "actualFar": 0.10, "tar": 0.97, "frr": 0.03}
                ],
                "genuineComparisons": 500,
                "impostorComparisons": 1500,
                "calibratedAt": 0
            },
            "featureMode": "posture",
            "totalSessions": 10,
            "totalFrames": 100,
            "trainingSetHash": "abc",
            "generatedAt": 0,
            "label": "Test"
        }"#;
        let result = load_calibration(json);
        assert!(result.is_ok(), "Minimal load should succeed: {:?}", result.err());
        assert!(result.unwrap());
        assert!(is_calibrated());
    }

    #[test]
    fn test_load_calibration_success() {
        let json = make_test_artifact_json();
        let result = load_calibration(&json);
        assert!(result.is_ok(), "Load should succeed: {:?}", result.err());
        assert!(result.unwrap(), "Should return true (calibrated)");
        assert!(is_calibrated(), "Should be calibrated after load");
    }

    #[test]
    fn test_get_thresholds() {
        reset_calibration();
        let json = make_test_artifact_json();
        load_calibration(&json).unwrap();

        let high = get_threshold("high").unwrap();
        let medium = get_threshold("medium").unwrap();
        let low = get_threshold("low").unwrap();

        assert!((high - 0.83).abs() < 0.001, "High threshold should be ~0.83, got {}", high);
        assert!((medium - 0.77).abs() < 0.001, "Medium threshold should be ~0.77, got {}", medium);
        assert!((low - 0.71).abs() < 0.001, "Low threshold should be ~0.71, got {}", low);
        assert!(high >= medium, "High should be >= medium");
        assert!(medium >= low, "Medium should be >= low");
    }

    #[test]
    fn test_normalization_params() {
        let json = make_test_artifact_json();
        load_calibration(&json).unwrap();

        let (means, stds) = get_normalization_params().unwrap();
        assert_eq!(means.len(), 54);
        assert_eq!(stds.len(), 54);
        // Check that stds are floored above zero
        assert!(stds.iter().all(|&s| s > 0.0), "All stds should be > 0");
    }

    #[test]
    fn test_pca_params() {
        let json = make_test_artifact_json();
        load_calibration(&json).unwrap();

        let (proj, mean) = get_pca_params().unwrap();
        assert_eq!(proj.nrows(), 8);
        assert_eq!(proj.ncols(), 54);
        assert_eq!(mean.len(), 54);
    }

    #[test]
    fn test_reset_calibration() {
        let json = make_test_artifact_json();
        load_calibration(&json).unwrap();
        assert!(is_calibrated());

        reset_calibration();
        assert!(!is_calibrated());
        assert!(get_threshold("medium").is_none());
    }

    #[test]
    fn test_invalid_json() {
        reset_calibration();
        let result = load_calibration("not valid json");
        assert!(result.is_err(), "Invalid JSON should return Err");
        // Note: is_calibrated() may be true if another test concurrently loaded
        // calibration. Global state tests are inherently racy in parallel test
        // runners. The important assertion is that THIS load attempt failed.
    }

    #[test]
    fn test_wrong_version() {
        reset_calibration();
        let result = load_calibration(r#"{"version": 99, "pca": {}, "stats": {}, "roc": {}}"#);
        assert!(result.is_err());
    }

    #[test]
    fn test_calibration_info() {
        let json = make_test_artifact_json();
        load_calibration(&json).unwrap();

        let info = get_calibration_info();
        assert!(info.is_some());
        let info_str = info.unwrap();
        assert!(info_str.contains("d_prime"), "Info should contain d_prime field");
        assert!(info_str.contains("2.85"), "Info should contain d'=2.85");
    }

    #[test]
    fn test_missing_operating_points() {
        // Only 1 operating point — should fail
        let bad_json = r#"{
            "version": 1,
            "pca": {"inputDim": 54, "outputDim": 8, "projectionMatrix": [], "mean": [], "eigenvalues": [], "explainedVarianceRatio": [], "cumulativeVariance": [], "featureMode": "posture", "numSamples": 0, "numSessions": 0, "calibratedAt": 0},
            "stats": {"dim": 54, "means": [], "stds": [], "mins": [], "maxs": [], "medians": [], "mads": [], "discriminabilityWeights": [], "featureMode": "posture", "numSamples": 0, "numSessions": 0, "calibratedAt": 0},
            "roc": {"curve": [], "auc": 0, "eer": 0, "eerThreshold": 0, "dPrime": 0, "operatingPoints": [{"targetFar": 0.01, "threshold": 0.8, "actualFar": 0.01, "tar": 0.9, "frr": 0.1}], "genuineComparisons": 0, "impostorComparisons": 0, "calibratedAt": 0},
            "featureMode": "posture",
            "totalSessions": 0,
            "totalFrames": 0,
            "trainingSetHash": "",
            "generatedAt": 0,
            "label": ""
        }"#;
        let result = load_calibration(bad_json);
        assert!(result.is_err(), "Should reject artifact with <3 operating points");
    }
}
