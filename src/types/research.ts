// ============================================================
// MyShape Protocol — Research Data Collection Types
// Phase E-1: Anonymous motion landmark ingestion
// Privacy: SST-18 joints only. No PII, no video, no face.
// ============================================================

import type { JointPosition, SSTJointId } from "./motion-vector";

// ── Device info (coarse, non-fingerprintable) ──

export interface ResearchDeviceInfo {
  os: "Windows" | "macOS" | "Linux" | "Android" | "iOS" | "Unknown";
  browser: "Firefox" | "Chrome" | "Safari" | "Edge" | "Unknown";
  viewportWidth: number;
  viewportHeight: number;
  imuAvailable: boolean;
}

// ── Lighting condition — user-reported, coarse category ──

export type LightingCondition =
  | "indoor_day"
  | "indoor_night"
  | "outdoor_day"
  | "outdoor_night";

// ── Per-phase motion metadata (for population calibration) ──

export interface PhaseMetadata {
  phase: 1 | 2 | 3 | 4 | 5;
  frameCount: number;
  meanWristVelocity: number | null;   // m/s — Phase 3 dominant
  meanHeadAngularVelocity: number | null; // deg/s — Phase 2 dominant
  meanTorsoVelocity: number | null;   // m/s — Phase 1/5 stillness check
}

// ── Single landmark frame (what gets stored) ──

/** A single SST-18 frame at a point in time — stripped of all non-SST data */
export interface LandmarkFrameEntry {
  /** Elapsed ms from capture start */
  t: number;
  /** SST-18 joint positions. Key = SSTJointId (0-17), Value = { x, y, z } */
  joints: Record<SSTJointId, JointPosition>;
}

// ── Upload payload (client → server) ──

export interface ResearchUploadPayload {
  /** Client-generated UUID v4 — unlinkable to any identity */
  session_id: string;
  /** Optional: Genesis node_handle for identity-bound ROC (Route C).
   *  NULL = anonymous. Non-NULL = identity-verified session. */
  node_handle?: string | null;
  /** Coarse device metadata */
  device: ResearchDeviceInfo;
  /** User-reported lighting category */
  lighting: LightingCondition;
  /** Actual capture duration in ms */
  duration_ms: number;
  /** SST-18 landmark frames (positions only, no raw video) */
  landmarks: LandmarkFrameEntry[];
  /** Computed Presence Entropy Score (0–1) */
  pes_score: number;
  /** §3.5.1 Micro-timing variance */
  pes_micro_timing: number;
  /** §3.5.2 Noise residual */
  pes_noise_residual: number;
  /** §3.5.3 Frequency entropy */
  pes_freq_entropy: number;
  /** §3.5.4 Biological perturbation */
  pes_bio_perturb: number;
  /** Total SST frames captured */
  total_frames: number;
  /** Frames where all 9 mandatory anchors visible */
  valid_frames: number;
  /** Per-phase metadata for calibration */
  phases: PhaseMetadata[];
}

// ── API response ──

export interface ResearchUploadResponse {
  success: boolean;
  session_id: string;
  error?: string;
}

// ── Privacy validation constants ──

/** Maximum landmark entries per upload (30s × 30fps + buffer) */
export const MAX_LANDMARK_ENTRIES = 1200;

/** Maximum upload payload size (approximate — enforced server-side) */
export const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

/** Rate limit: max uploads per IP per 24h */
export const RESEARCH_UPLOAD_RATE_LIMIT = 5;
