// ============================================================
// MyShape Protocol — Motion Vector Type System v1.0
// Derived from: Technical Specification v1.0 §1–§6
// ============================================================

// ── §2.2 — Standardized Skeleton Topology (SST) ──

/** Standard 18-point skeleton topology — device/model-agnostic */
export type SSTJointId =
  | 0  // Head
  | 1  // Neck
  | 2  // Spine
  | 3  // Left Shoulder
  | 4  // Right Shoulder
  | 5  // Left Elbow
  | 6  // Right Elbow
  | 7  // Left Wrist
  | 8  // Right Wrist
  | 9  // Left Hip
  | 10 // Right Hip
  | 11 // Left Knee
  | 12 // Right Knee
  | 13 // Left Ankle
  | 14 // Right Ankle
  | 15 // Pelvis
  | 16 // Torso
  | 17 // Nose (optional, for MediaPipe compat)

export const SST_JOINT_COUNT = 18;

export const SST_JOINT_NAMES: Record<SSTJointId, string> = {
  0: "Head", 1: "Neck", 2: "Spine",
  3: "Left Shoulder", 4: "Right Shoulder",
  5: "Left Elbow", 6: "Right Elbow",
  7: "Left Wrist", 8: "Right Wrist",
  9: "Left Hip", 10: "Right Hip",
  11: "Left Knee", 12: "Right Knee",
  13: "Left Ankle", 14: "Right Ankle",
  15: "Pelvis", 16: "Torso", 17: "Nose",
};

// ── §1.2, §2.5 — Motion Vector primitives ──

/** A single joint's 3D position at time t */
export interface JointPosition {
  x: number;
  y: number;
  z: number;
}

/** Full skeleton frame: one timestamp's worth of joint data */
export type MotionFrame = Record<SSTJointId, JointPosition>;

// ── §2.3-2.9 — Raw & Processed Motion Vector ──

export interface MotionVectorRaw {
  version: 1;
  fps: number;               // §2.3: 20-60 Hz
  window: number;             // §2.4: 0.5-2.0 s, default 1.0
  nodes: number;              // joint count, typically 18
  frames: MotionFrame[];      // sequential frames
}

export interface MotionVectorNormalized {
  version: 1;
  fps: number;
  window: number;
  nodes: number;
  frames: MotionFrame[];      // pelvis-centered, scale/orientation normalized
}

export interface MotionVectorFeatures {
  version: 1;
  fps: number;
  window: number;
  nodes: number;
  // Temporal features §3.3
  deltas: Float64Array[];     // Δpos per joint
  velocities: Float64Array[]; // v(t) per joint
  accelerations: Float64Array[]; // a(t) per joint
  jerks: Float64Array[];      // j(t) per joint — key AI-detectable signal
  // Kinematic features §3.4
  jointAngles: Float64Array[];     // θ(t) per joint pair
  angularVelocities: Float64Array[];
  angularAccelerations: Float64Array[];
  kinematicConsistency: number;    // §3.4.4 — unnatural smoothness detector
  // Entropy features §3.5
  microTimingVariance: number;      // §3.5.1 Var(Δt)
  noiseResidual: number;            // §3.5.2 ε(t)
  frequencyEntropy: number;         // §3.5.3 H_f
  biologicalPerturbationScore: number; // §3.5.4
  presenceEntropyScore: number;     // §3.5.5 PES — aggregate security metric
}

// ── §2.11 — Final Motion Vector (transmitted format) ──

export interface MotionVectorFinal {
  version: 1;
  fps: number;
  window: number;
  nodes: number;
  mv_hash: string;           // 32-byte Poseidon or Blake3 hash
  entropy_score: number;     // PES
  timestamp: number;         // unix time
  device_salt?: string;      // optional, for anti-replay
}

// ── §1.6-1.7 — Proof primitives ──

export interface ProofOfPresence {
  mv_hash: string;
  pes: number;               // above threshold → real presence
  timestamp: number;
  window: number;
}

export interface ZKPresenceProof {
  proof: Uint8Array;         // 128-512 bytes
  public_inputs: string[];   // mv_hash, timestamp range
  verified: boolean;
}

// ── §5 — Threat classification ──

export type ThreatCategory =
  | "generative"    // AI-generated motion
  | "replay"        // recorded motion replay
  | "imitation"     // human imitation of target
  | "sensor_spoof"  // fake sensor input
  | "sybil";        // mass identity creation

export interface ThreatAssessment {
  category: ThreatCategory;
  detected: boolean;
  confidence: number;  // 0-1
  evidence: string[];
}

// ── §6 — Proof system enums ──

export type ProofType = "ZK-MG" | "ZK-MIP";

export interface ProofRequest {
  type: ProofType;
  mv: MotionVectorFinal;
  threshold_pes: number;     // minimum entropy score
  challenge?: string;        // optional nonce
}

export interface ProofResponse {
  type: ProofType;
  zkp: ZKPresenceProof;
  mv_hash: string;
  verified_at: number;
  verifier_node: string;
}

// ── §2.11 — JSON Schema compliant MV constructor ──

export function createMotionVectorFinal(
  features: MotionVectorFeatures,
  hash: string,
  deviceSalt?: string,
): MotionVectorFinal {
  return {
    version: 1,
    fps: features.fps,
    window: features.window,
    nodes: features.nodes,
    mv_hash: hash,
    entropy_score: features.presenceEntropyScore,
    timestamp: Math.floor(Date.now() / 1000),
    ...(deviceSalt ? { device_salt: deviceSalt } : {}),
  };
}
