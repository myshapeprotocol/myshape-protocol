// MyShape Engine — Shared Types
//
// Defines the foundational data structures used across all engine modules.
// Corresponds to MVP spec §2 (Challenge Structure), §3 (Motion Signature), §4 (Multi-Factor).

use nalgebra::{DVector, Vector3};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ── Challenge Types (§2) ────────────────────────────────────────────

/// A motion challenge issued by the verifier.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Challenge {
    pub challenge_id: Uuid,
    /// Unix timestamp (seconds) when the challenge was created.
    pub timestamp: f64,
    /// Maximum response window in milliseconds (default: 3500).
    pub duration_ms: u32,
    /// The actions the user must perform.
    pub actions: Vec<ChallengeAction>,
    /// Timing constraints.
    pub timing: TimingConstraints,
    /// Cryptographic nonce binding this challenge to the session.
    pub nonce: [u8; 16],
    /// HMAC of the challenge using the session key.
    pub challenge_token: Vec<u8>,
}

/// A single action within a challenge.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChallengeAction {
    /// Role of this action in the challenge.
    pub action_type: ActionType,
    /// Which body joint performs the action.
    pub joint: Joint,
    /// The type of motion to perform.
    pub motion: MotionType,
    /// Direction parameter (if applicable).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub direction: Option<Direction>,
    /// Amplitude: "small" | "medium" | "large".
    #[serde(skip_serializing_if = "Option::is_none")]
    pub amplitude: Option<Amplitude>,
    /// For tilt/rotate constraints: angle in degrees.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub angle_deg: Option<f64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ActionType {
    /// The primary motion the user must perform.
    Primary,
    /// A secondary motion performed simultaneously.
    Secondary,
    /// A coupling constraint — shares kinetic chain with primary/secondary.
    Constraint,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Joint {
    RightHand,
    LeftHand,
    RightElbow,
    LeftElbow,
    RightShoulder,
    LeftShoulder,
    Head,
    Torso,
    RightKnee,
    LeftKnee,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MotionType {
    Circle,
    Line,
    Triangle,
    UpDown,
    LeftRight,
    Tilt,
    KeepStill,
    Rotate,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Direction {
    Clockwise,
    Counterclockwise,
    Up,
    Down,
    Left,
    Right,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Amplitude {
    Small,
    Medium,
    Large,
}

/// Timing constraints for challenge execution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimingConstraints {
    /// Maximum time (ms) from challenge display to response start.
    pub start_window_ms: u32,
    /// Hold time (ms) at a specific position.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hold_ms: Option<u32>,
    /// Random perturbation description.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub perturbation: Option<String>,
}

impl Default for TimingConstraints {
    fn default() -> Self {
        Self {
            start_window_ms: 100,
            hold_ms: Some(300),
            perturbation: Some("random_pause_50_200ms".into()),
        }
    }
}

// ── Motion Data Types (§3) ──────────────────────────────────────────

/// Raw 3D keypoint at a single timestamp.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Keypoint {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

impl From<Vector3<f32>> for Keypoint {
    fn from(v: Vector3<f32>) -> Self {
        Self {
            x: v.x,
            y: v.y,
            z: v.z,
        }
    }
}

impl From<Keypoint> for Vector3<f32> {
    fn from(k: Keypoint) -> Self {
        Vector3::new(k.x, k.y, k.z)
    }
}

/// A single frame of pose data: N keypoints at time t.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoseFrame {
    /// Timestamp in seconds from sequence start.
    pub t: f32,
    /// Keypoints indexed by joint order (0..N).
    /// Standard MediaPipe order: 33 keypoints.
    pub keypoints: Vec<Keypoint>,
}

/// Full motion capture sequence for a challenge response.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MotionSequence {
    /// Frames per second.
    pub fps: u32,
    /// Sequence of pose frames.
    pub frames: Vec<PoseFrame>,
}

/// IMU data packet.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImuSample {
    /// Timestamp in seconds from sequence start.
    pub t: f32,
    /// Acceleration in m/s² (3-axis).
    pub accel: [f32; 3],
    /// Angular velocity in rad/s (3-axis).
    pub gyro: [f32; 3],
}

/// Full IMU sequence for a challenge response.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImuSequence {
    /// Sampling rate in Hz.
    pub sample_rate_hz: u32,
    /// Sequence of IMU samples.
    pub samples: Vec<ImuSample>,
}

// ── Motion Signature Types (§3.3) ────────────────────────────────────

/// The Motion Signature vector (128-dim for MVP).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MotionSignature {
    /// 128-dimensional signature vector.
    pub vector: DVector<f32>,
    /// Version of the signature extraction pipeline.
    pub version: u32,
}

// ── Device & Context Types (§4) ──────────────────────────────────────

/// Device information for attestation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    /// Operating system: "ios", "android".
    pub os: String,
    /// Device model string.
    pub model: String,
    /// Unique device identifier (not hardware ID).
    pub device_id: String,
    /// Whether the device is jailbroken/rooted.
    pub is_rooted: bool,
    /// IMU sample rate in Hz, if available.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub imu_sample_rate_hz: Option<u32>,
}

/// Location information for context verification.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocationInfo {
    /// Latitude in degrees.
    pub latitude: f64,
    /// Longitude in degrees.
    pub longitude: f64,
    /// Unix timestamp of the location fix.
    pub timestamp: f64,
}

/// Combined response from the client.
/// TEMPORARY (MVP ONLY): Contains raw pose and IMU data for E-phase data collection.
/// v1.0+: Raw data stays on-device. Only ZK proof is transmitted.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChallengeResponse {
    pub challenge_id: Uuid,
    pub user_id: String,
    /// TEMPORARY: Raw pose sequence for data collection.
    pub pose_sequence: MotionSequence,
    /// TEMPORARY: Raw IMU sequence for data collection.
    pub imu_sequence: ImuSequence,
    pub device_info: DeviceInfo,
    pub location: Option<LocationInfo>,
}

// ── Verification Types (§5–7) ────────────────────────────────────────

/// Risk level for the operation being verified.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RiskLevel {
    Low,
    Medium,
    High,
}

impl RiskLevel {
    /// Returns the presence score threshold for this risk level.
    ///
    /// Phase E-4: Checks calibration first. If a calibration artifact
    /// has been loaded with ROC operating points, those thresholds
    /// replace the v0.1 hardcoded values. Falls back to vacuum defaults
    /// if not calibrated.
    pub fn threshold(&self) -> f64 {
        // Try calibration first
        if let Some(calibrated) = self.calibrated_threshold() {
            return calibrated;
        }
        // Vacuum defaults
        match self {
            RiskLevel::Low => 0.70,
            RiskLevel::Medium => 0.75,
            RiskLevel::High => 0.80,
        }
    }

    /// Get the ROC-calibrated threshold for this risk level.
    /// Returns None if no calibration is loaded.
    pub fn calibrated_threshold(&self) -> Option<f64> {
        let risk_str = match self {
            RiskLevel::High => "high",
            RiskLevel::Medium => "medium",
            RiskLevel::Low => "low",
        };
        crate::calibration::get_threshold(risk_str)
    }
}

/// Individual factor scores.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FactorScores {
    /// Motion Signature score: L2-normalized distance to enrollment.
    pub motion: f64,
    /// Device attestation score.
    pub device: f64,
    /// Context score.
    pub context: f64,
}

/// The final verification result.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationResult {
    /// Whether presence was verified.
    pub verified: bool,
    /// Composite presence score (0.0–1.0).
    pub presence_score: f64,
    /// Individual factor scores.
    pub factors: FactorScores,
    /// Risk level used for this verification.
    pub risk_level: RiskLevel,
    /// Threshold applied.
    pub threshold: f64,
    /// Reason for rejection (if not verified).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rejection_reason: Option<String>,
}

// ── Enrollment Types ─────────────────────────────────────────────────

/// Enrolled user data.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Enrollment {
    pub user_id: String,
    /// Mean Motion Signature across enrollment challenges.
    pub signature: MotionSignature,
    /// Intra-person variance (for threshold calibration).
    pub variance: f64,
    /// Number of enrollment samples.
    pub sample_count: u32,
    /// Enrollment timestamp.
    pub enrolled_at: f64,
    /// Device info at enrollment time.
    pub device_info: DeviceInfo,
}
