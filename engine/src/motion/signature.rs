// Motion Signature Engine — main entry point.
//
// Composes features from all four dimensions (K, A, J, J_spec)
// and produces the final 128-dimensional Motion Signature vector.
//
// Corresponds to: Motion Signature Formalization §2, MVP spec §3.

use crate::types::{MotionSequence, MotionSignature};
use nalgebra::DVector;
use super::{kinematics, dynamics, spectral};

/// Feature dimensions from each module.
const DIM_K: usize = 40;     // Kinematics (14 skeletal ratios + 6 joint angles + 10 velocity stats + 10 accel stats)
const DIM_A: usize = 25;     // Acceleration
const DIM_J: usize = 25;     // Jerk
const DIM_JSPEC: usize = 30; // Jerk Spectrum
const DIM_RAW: usize = DIM_K + DIM_A + DIM_J + DIM_JSPEC; // 120

/// Target signature dimension after PCA-like projection.
const DIM_SIGNATURE: usize = 128;

/// The Motion Signature Engine.
///
/// Extracts the four MVP feature dimensions from a motion sequence
/// and produces a 128-dimensional signature vector suitable for
/// similarity comparison.
pub struct MotionSignatureEngine {
    /// Projection matrix for dimensionality expansion (112 → 128).
    /// In production, this would be learned via PCA on a training dataset.
    /// For MVP, we use a fixed pseudo-random orthonormal projection.
    projection: nalgebra::DMatrix<f32>,
    /// Per-feature mean vectors (for normalization).
    feature_means: DVector<f32>,
    /// Per-feature standard deviations (for normalization).
    feature_stds: DVector<f32>,
}

impl MotionSignatureEngine {
    /// Create a new engine with default (identity-like) projection.
    ///
    /// In MVP, we use a fixed projection. When E-phase data becomes available,
    /// this should be replaced with a PCA projection learned from real data.
    pub fn new() -> Self {
        // Initialize with identity-adjacent projection
        // Pad 120 → 128: append 8 zero dimensions (reserved for future features)
        let mut projection = nalgebra::DMatrix::zeros(DIM_SIGNATURE, DIM_RAW);
        for i in 0..DIM_RAW {
            projection[(i, i)] = 1.0;
        }
        // The extra 8 dimensions (120..128) remain zero — reserved for
        // Tremor Spectrum, Coordination Matrix, Sensor Consistency in v1.1+

        Self {
            projection,
            feature_means: DVector::zeros(DIM_RAW),
            feature_stds: DVector::from_element(DIM_RAW, 1.0),
        }
    }

    /// Create an engine with calibration parameters loaded from a
    /// TypeScript-generated CalibrationArtifact.
    ///
    /// Phase E-4: If the calibration artifact's feature dimension matches
    /// DIM_RAW (120), the PCA projection matrix and population normalization
    /// parameters are applied. If dimensions don't match (e.g., 54-dim posture
    /// calibration), falls back to vacuum defaults with a diagnostic reason.
    ///
    /// ROC thresholds are handled separately via `RiskLevel::threshold()`
    /// and don't require dimension alignment.
    pub fn with_calibration() -> Self {
        // Try to get calibration params
        if let Some((proj, _pca_mean)) = crate::calibration::get_pca_params() {
            if let Some((means, stds)) = crate::calibration::get_normalization_params() {
                let calib_dim = means.len();

                if calib_dim == DIM_RAW {
                    // Full calibration: use PCA projection + population stats
                    // Check projection dimensions
                    if proj.ncols() == DIM_RAW && proj.nrows() == DIM_SIGNATURE {
                        return Self {
                            projection: proj,
                            feature_means: means,
                            feature_stds: stds,
                        };
                    }
                    // PCA dims differ from engine dims — use normalization only
                    let mut projection = nalgebra::DMatrix::zeros(DIM_SIGNATURE, DIM_RAW);
                    for i in 0..DIM_RAW {
                        projection[(i, i)] = 1.0;
                    }
                    return Self {
                        projection,
                        feature_means: means,
                        feature_stds: stds,
                    };
                }

                // Calibration dimension mismatch — fall through to vacuum
                // This is expected when using 54-dim posture calibration
                // with the 120-dim motion feature engine.
            }
        }

        // Fallback: vacuum defaults (same as new())
        Self::new()
    }

    /// Create an engine with normalization parameters learned from enrollment data.
    pub fn with_normalization(
        projection: nalgebra::DMatrix<f32>,
        means: DVector<f32>,
        stds: DVector<f32>,
    ) -> Self {
        Self {
            projection,
            feature_means: means,
            feature_stds: stds,
        }
    }

    /// Extract the Motion Signature from a challenge response sequence.
    ///
    /// Pipeline:
    ///   1. Extract raw features: K(32) + A(25) + J(25) + J_spec(30) = 112-dim
    ///   2. Normalize: (x - μ) / σ
    ///   3. Project: 112 → 128 via projection matrix
    ///   4. L2-normalize the final vector
    pub fn extract(&self, sequence: &MotionSequence) -> MotionSignature {
        // Step 1: Extract raw features
        let raw = self.extract_raw_features(sequence);

        // Step 2: Normalize
        let normalized = self.normalize(&raw);

        // Step 3: Project to signature space
        let projected = &self.projection * normalized;

        // Step 4: L2-normalize
        let norm = projected.norm();
        let vector = if norm > 1e-8 {
            projected / norm
        } else {
            projected
        };

        MotionSignature {
            vector,
            version: 1,
        }
    }

    /// Compute the similarity score between two signatures.
    ///
    /// Uses L2-normalized distance (Patch from MVP v0.2):
    ///   score = 1 - ||z_enroll - z_response|| / (||z_enroll|| + ||z_response||)
    ///
    /// This captures both direction AND magnitude differences,
    /// which is critical for detecting AI-generated jerk/acceleration mismatch.
    ///
    /// Rationale: Cosine similarity (MVP v0.1) only compares direction.
    /// AI motion generation frequently produces "directionally correct but
    /// magnitude-wrong" jerk profiles. L2-normalized distance catches this.
    pub fn similarity(enrollment: &MotionSignature, response: &MotionSignature) -> f64 {
        let diff = &enrollment.vector - &response.vector;
        let diff_norm = diff.norm();
        let sum_norm = enrollment.vector.norm() + response.vector.norm();

        if sum_norm < 1e-8 {
            return 1.0; // Both zero vectors → identical
        }

        let score = 1.0 - diff_norm as f64 / sum_norm as f64;
        score.clamp(0.0, 1.0)
    }

    /// Compute the enrollment signature as the mean of multiple samples.
    pub fn enroll(signatures: &[MotionSignature]) -> MotionSignature {
        if signatures.is_empty() {
            return MotionSignature {
                vector: DVector::zeros(DIM_SIGNATURE),
                version: 1,
            };
        }

        let n = signatures.len() as f32;
        let mut mean = DVector::zeros(DIM_SIGNATURE);

        for sig in signatures {
            mean += &sig.vector;
        }
        mean /= n;

        // L2-normalize
        let norm = mean.norm();
        if norm > 1e-8 {
            mean /= norm;
        }

        MotionSignature {
            vector: mean,
            version: 1,
        }
    }

    /// Compute intra-person variance from enrollment samples.
    pub fn compute_variance(signatures: &[MotionSignature]) -> f64 {
        if signatures.len() < 2 {
            return 0.0;
        }

        let mean = Self::enroll(signatures);
        let n = signatures.len() as f64;
        let var: f64 = signatures
            .iter()
            .map(|s| {
                let diff = &s.vector - &mean.vector;
                diff.norm_squared() as f64
            })
            .sum::<f64>()
            / (n - 1.0);

        var
    }

    /// Phase E Route B: Extract the raw 120-dimensional feature vector.
    ///
    /// This is the same feature vector used internally by `extract()`.
    /// Exposing it allows the TypeScript calibration pipeline to compute
    /// PCA and population statistics on the exact feature space the engine uses.
    ///
    /// Returns a 120-dim f32 vector: [K(40) | A(25) | J(25) | J_spec(30)].
    pub fn extract_feature_vector(&self, sequence: &MotionSequence) -> Vec<f32> {
        let raw = self.extract_raw_features(sequence);
        raw.iter().copied().collect()
    }

    /// Dimension of the raw feature vector.
    pub fn feature_dim() -> usize {
        DIM_RAW
    }

    // ── Private helpers ──────────────────────────────────────────────

    /// Extract raw 120-dimensional feature vector.
    fn extract_raw_features(&self, sequence: &MotionSequence) -> DVector<f32> {
        let k = kinematics::extract_kinematics(sequence);
        let dyn_features = dynamics::extract_dynamics(sequence);
        let a = DVector::from_vec(dyn_features.as_slice()[..25].to_vec());
        let j = DVector::from_vec(dyn_features.as_slice()[25..].to_vec());
        let jspec = spectral::extract_jerk_spectrum(sequence);

        // Concatenate: [K | A | J | J_spec]
        let mut raw = Vec::with_capacity(DIM_RAW);
        raw.extend_from_slice(k.as_slice());
        raw.extend_from_slice(a.as_slice());
        raw.extend_from_slice(j.as_slice());
        raw.extend_from_slice(jspec.as_slice());

        DVector::from_vec(raw)
    }

    /// Z-score normalize the feature vector.
    fn normalize(&self, raw: &DVector<f32>) -> DVector<f32> {
        let mut normalized = raw.clone();
        for i in 0..DIM_RAW {
            if self.feature_stds[i] > 1e-8 {
                normalized[i] = (raw[i] - self.feature_means[i]) / self.feature_stds[i];
            }
        }
        normalized
    }
}

impl Default for MotionSignatureEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Keypoint, PoseFrame};

    fn make_test_sequence() -> MotionSequence {
        let mut frames = Vec::new();
        for i in 0..60 {
            let t = i as f32 / 30.0;
            let mut kps = vec![Keypoint { x: 0.0, y: 0.0, z: 0.0 }; 33];
            let phase = t * 2.0 * std::f32::consts::PI;
            kps[16] = Keypoint {
                x: 0.5 + 0.1 * phase.sin(),
                y: 0.5 + 0.1 * phase.cos(),
                z: 0.002 * (t * 50.0).sin(),
            };
            kps[15] = Keypoint {
                x: -0.3 + 0.08 * phase.cos(),
                y: 0.5 + 0.08 * phase.sin(),
                z: 0.0,
            };
            kps[11] = Keypoint { x: 0.3, y: 0.6, z: 0.0 };
            kps[23] = Keypoint { x: 0.3, y: 0.3, z: 0.0 };
            frames.push(PoseFrame { t, keypoints: kps });
        }
        MotionSequence { fps: 30, frames }
    }

    #[test]
    fn test_extract_signature_dimensions() {
        let engine = MotionSignatureEngine::new();
        let seq = make_test_sequence();
        let sig = engine.extract(&seq);
        assert_eq!(sig.vector.len(), 128);
        assert_eq!(sig.version, 1);
    }

    #[test]
    fn test_similarity_self_is_one() {
        let engine = MotionSignatureEngine::new();
        let seq = make_test_sequence();
        let sig1 = engine.extract(&seq);
        let sig2 = engine.extract(&seq);
        let score = MotionSignatureEngine::similarity(&sig1, &sig2);
        assert!((score - 1.0).abs() < 0.001,
            "Self-similarity should be ~1.0, got {}", score);
    }

    #[test]
    fn test_similarity_different_sequences() {
        let engine = MotionSignatureEngine::new();

        // Sequence 1: normal motion
        let seq1 = make_test_sequence();

        // Sequence 2: different motion (larger amplitude, different phase)
        let mut frames = Vec::new();
        for i in 0..60 {
            let t = i as f32 / 30.0;
            let mut kps = vec![Keypoint { x: 0.0, y: 0.0, z: 0.0 }; 33];
            let phase = t * 3.0; // different frequency
            kps[16] = Keypoint {
                x: 0.5 + 0.3 * phase.sin(), // larger amplitude
                y: 0.5 + 0.05 * phase.cos(), // different pattern
                z: 0.0,
            };
            kps[15] = Keypoint {
                x: -0.3 + 0.02 * (t * 10.0).sin(),
                y: 0.5,
                z: 0.0,
            };
            kps[11] = Keypoint { x: 0.3, y: 0.6, z: 0.0 };
            kps[23] = Keypoint { x: 0.3, y: 0.3, z: 0.0 };
            frames.push(PoseFrame { t, keypoints: kps });
        }
        let seq2 = MotionSequence { fps: 30, frames };

        let sig1 = engine.extract(&seq1);
        let sig2 = engine.extract(&seq2);
        let score = MotionSignatureEngine::similarity(&sig1, &sig2);

        // Different motions should have score < 1.0
        assert!(score < 1.0, "Different motions should not be identical, got {}", score);
        assert!(score >= 0.0, "Score should be non-negative, got {}", score);
    }

    #[test]
    fn test_enrollment_mean() {
        let engine = MotionSignatureEngine::new();
        let mut sigs = Vec::new();
        for _ in 0..5 {
            let seq = make_test_sequence();
            sigs.push(engine.extract(&seq));
        }
        let enrolled = MotionSignatureEngine::enroll(&sigs);
        assert_eq!(enrolled.vector.len(), 128);

        // Enrolled signature should be similar to each individual signature
        for sig in &sigs {
            let score = MotionSignatureEngine::similarity(&enrolled, sig);
            assert!(score > 0.9, "Enrollment should be similar to samples, got {}", score);
        }
    }

    #[test]
    fn test_variance_non_negative() {
        let engine = MotionSignatureEngine::new();
        let mut sigs = Vec::new();
        for _ in 0..5 {
            let seq = make_test_sequence();
            sigs.push(engine.extract(&seq));
        }
        let var = MotionSignatureEngine::compute_variance(&sigs);
        assert!(var >= 0.0, "Variance must be non-negative");
    }

    #[test]
    fn test_l2_vs_cosine_distinction() {
        // This test verifies that L2-normalized distance captures
        // magnitude differences that cosine similarity would miss.
        // Two vectors: same direction, different magnitudes
        let v1 = DVector::from_vec(vec![1.0f32, 2.0, 3.0, 4.0]);
        let v2 = DVector::from_vec(vec![0.5f32, 1.0, 1.5, 2.0]); // half magnitude, same direction

        let sig1 = MotionSignature { vector: v1.clone(), version: 1 };
        let sig2 = MotionSignature { vector: v2.clone(), version: 1 };

        let l2_score = MotionSignatureEngine::similarity(&sig1, &sig2);

        // Cosine similarity would give 1.0 (parallel vectors)
        let cos_score = v1.dot(&v2) / (v1.norm() * v2.norm());
        assert!((cos_score - 1.0).abs() < 0.001, "Cosine should be 1.0 for parallel vectors");

        // L2 distance should give < 1.0 (different magnitudes)
        assert!(l2_score < 1.0,
            "L2 score should be < 1.0 for same-direction different-magnitude vectors, got {}",
            l2_score
        );
    }
}
