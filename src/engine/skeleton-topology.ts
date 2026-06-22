// ============================================================
// MyShape Protocol — Skeleton Topology Mapper
// Derived from: Technical Specification v1.0 §2.2
//
// Maps between the Standardized Skeleton Topology (SST, 18 pts)
// and common pose-detection models (MediaPipe 33-pt, etc.)
// ============================================================

import type { SSTJointId, JointPosition } from "@/types/motion-vector";

// ── MediaPipe Pose → SST mapping ──
// MediaPipe Pose landmarks: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker

export const MEDIAPIPE_TO_SST: Record<number, SSTJointId | null> = {
  // Head region
  0: 17,   // nose → SST nose (aux)
  1: null, // left eye inner
  2: null, // left eye
  3: null, // left eye outer
  4: null, // right eye inner
  5: null, // right eye
  6: null, // right eye outer
  7: null, // left ear
  8: null, // right ear
  9: null, // mouth left
  10: null, // mouth right

  // Torso
  11: 3,   // left shoulder → SST Left Shoulder
  12: 4,   // right shoulder → SST Right Shoulder
  13: 5,   // left elbow → SST Left Elbow
  14: 6,   // right elbow → SST Right Elbow
  15: 7,   // left wrist → SST Left Wrist
  16: 8,   // right wrist → SST Right Wrist
  17: null, // left pinky
  18: null, // right pinky
  19: null, // left index
  20: null, // right index
  21: null, // left thumb
  22: null, // right thumb

  // Lower limbs
  23: 9,   // left hip → SST Left Hip
  24: 10,  // right hip → SST Right Hip
  25: 11,  // left knee → SST Left Knee
  26: 12,  // right knee → SST Right Knee
  27: 13,  // left ankle → SST Left Ankle
  28: 14,  // right ankle → SST Right Ankle
  29: null, // left heel
  30: null, // right heel
  31: null, // left foot index
  32: null, // right foot index
};

// ── SST joint connectivity (bones for visualization) ──

export const SST_BONES: Array<[SSTJointId, SSTJointId]> = [
  // Torso
  [17, 0],  // nose → head
  [0, 1],   // head → neck
  [1, 16],  // neck → torso
  [16, 2],  // torso → spine
  [2, 15],  // spine → pelvis
  // Shoulders + arms
  [16, 3],  // torso → left shoulder
  [16, 4],  // torso → right shoulder
  [3, 5],   // left shoulder → left elbow
  [4, 6],   // right shoulder → right elbow
  [5, 7],   // left elbow → left wrist
  [6, 8],   // right elbow → right wrist
  // Hips + legs
  [15, 9],  // pelvis → left hip
  [15, 10], // pelvis → right hip
  [9, 11],  // left hip → left knee
  [10, 12], // right hip → right knee
  [11, 13], // left knee → left ankle
  [12, 14], // right knee → right ankle
];

// ── Mapping function ──

export interface MediaPipeLandmark {
  x: number;  // normalized 0-1
  y: number;  // normalized 0-1
  z: number;  // normalized depth
  visibility?: number;
}

/**
 * Convert a MediaPipe Pose result frame to SST-18 format.
 * Unmapped joints are omitted; missing joints get {0,0,0}.
 */
export function mediaPipeToSST(
  mpLandmarks: MediaPipeLandmark[],
): Record<SSTJointId, JointPosition> {
  const sst = {} as Record<SSTJointId, JointPosition>;

  for (let sstId = 0; sstId < 18; sstId++) {
    sst[sstId as SSTJointId] = { x: 0, y: 0, z: 0 };
  }

  for (let mpId = 0; mpId < mpLandmarks.length; mpId++) {
    const sstId = MEDIAPIPE_TO_SST[mpId];
    if (sstId !== null && sstId !== undefined && mpLandmarks[mpId]) {
      const lm = mpLandmarks[mpId];
      sst[sstId] = {
        x: lm.x * 640,   // denormalize to 640×480 reference space
        y: lm.y * 480,
        z: lm.z * 640,
      };
    }
  }

  return sst;
}

/**
 * Normalize SST frame to pelvis-centered coordinates (§2.7).
 */
export function normalizeSSTFrame(
  frame: Record<SSTJointId, JointPosition>,
): Record<SSTJointId, JointPosition> {
  const pelvis = frame[15]; // SST pelvis
  const normalized = {} as Record<SSTJointId, JointPosition>;
  for (let id = 0; id < 18; id++) {
    const j = frame[id as SSTJointId];
    normalized[id as SSTJointId] = {
      x: j.x - pelvis.x,
      y: j.y - pelvis.y,
      z: j.z - pelvis.z,
    };
  }
  return normalized;
}
