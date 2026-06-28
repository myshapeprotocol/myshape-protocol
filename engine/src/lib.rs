// MyShape Engine — Core Protocol Library
//
// Presence Protocol MVP implementation.
//
// Modules:
//   types        — Shared data structures
//   challenge    — Challenge generation (B stage)
//   motion       — Motion Signature extraction (C stage)
//   verification — Multi-factor presence scoring (D stage)
//
// Usage:
//   ```rust
//   use myshape_engine::challenge::ChallengeGenerator;
//   use myshape_engine::motion::MotionSignatureEngine;
//   use myshape_engine::verification::PresenceScorer;
//   ```

pub mod types;
pub mod challenge;
pub mod motion;
pub mod verification;
pub mod calibration;

/// Engine version.
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Re-export commonly used types.
pub use types::{
    Challenge, ChallengeAction, ChallengeResponse, DeviceInfo, Enrollment,
    FactorScores, ImuSequence, Keypoint, LocationInfo, MotionSequence,
    MotionSignature, PoseFrame, RiskLevel, VerificationResult,
};
