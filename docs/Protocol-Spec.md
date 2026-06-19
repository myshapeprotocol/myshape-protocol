# MyShape Protocol — Technical Specification v0.1

> **Status**: Draft for Implementation  
> **Target**: Define the minimum viable protocol layer that MyShape.com demonstrates.  
> **Audience**: Engineers, protocol implementers, technical reviewers.

---

## 1. Overview

MyShape Protocol defines a system for creating, storing, and verifying a **Data-Body** — a cryptographic identity primitive derived from human motion, without storing or transmitting raw biometric data.

### 1.1 Design Goals

| Goal | Description |
|:---|:---|
| **Sovereignty** | The user holds the only copy of their raw motion data. The protocol never sees it. |
| **Zero-Knowledge Presence** | Prove you are a specific human without revealing who you are or what you look like. |
| **Non-Biometric** | No fingerprints, face scans, iris patterns, or DNA. Only motion geometry. |
| **Platform Agnostic** | A Data-Body is a portable data structure, not tied to any server or chain. |
| **Post-Quantum Ready** | Signature scheme is hash-based; no elliptic curve dependency for core identity. |

### 1.2 Non-Goals

- MyShape is NOT a biometric identification system.
- MyShape does NOT store or process images of humans.
- MyShape is NOT a blockchain — it may use chains for anchoring but is chain-agnostic.

---

## 2. Core Data Structures

### 2.1 Data-Body

The fundamental identity primitive.

```typescript
interface DataBody {
  /** Immutable genesis identifier — generated once at creation time. */
  genesis_id: string; // Format: "GNS_" + 6-char hex timestamp + "_" + 8-char hex random

  /** Motion signature vector — 66 floats from MediaPipe pose landmarks. */
  motion_signature: number[]; // length: 66 (33 landmarks × 2 normalized coordinates)

  /** Hash of motion_signature — the public, shareable identity commitment. */
  energy_field_hash: string; // SHA-256 hex digest

  /** Timestamp of genesis creation (Unix ms). */
  created_at: number;

  /** Optional: external proof of sovereignty (e.g., a signature from user's wallet). */
  sovereignty_proof: string | null;

  /** Version of the motion extraction pipeline used. */
  pipeline_version: string;
}
```

### 2.2 Motion Signature

Extracted from a single frame of MediaPipe Pose inference.

```typescript
interface MotionSignature {
  /** Landmarks normalized to [0, 1] relative to frame dimensions. */
  landmarks: number[][]; // 33 × 2 (x, y per landmark)

  /** Timestamp of capture (Unix ms). */
  captured_at: number;

  /** Pipeline version. */
  version: string; // e.g., "mediapipe-pose-0.5"
}
```

**Landmark Mapping** (MediaPipe Pose topology):

```
0:  nose            11: left_shoulder    23: left_hip
1:  left_eye_inner  12: right_shoulder   24: right_hip
2:  left_eye        13: left_elbow       25: left_knee
3:  left_eye_outer  14: right_elbow      26: right_knee
4:  right_eye_inner 15: left_wrist       27: left_ankle
5:  right_eye       16: right_wrist      28: right_ankle
6:  right_eye_outer 17: left_pinky       29: left_heel
7:  left_ear        18: right_pinky      30: right_heel
8:  right_ear       19: left_index       31: left_foot_index
9:  left_mouth      20: right_index      32: right_foot_index
10: right_mouth     21: left_thumb
                     22: right_thumb
```

### 2.3 Genesis Node (Database Record)

The minimal persistent record stored on the server side.

```typescript
interface ProtocolNode {
  email: string;           // User contact (hashed in future versions)
  genesis_id: string;      // FK → DataBody.genesis_id
  energy_field_hash: string; // The public commitment
  status: "PENDING_VERIFICATION" | "ACTIVE" | "REVOKED";
  created_at: string;      // ISO 8601
}
```

---

## 3. The Motion Pipeline

### 3.1 Architecture

```
┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
│  Camera Feed │───▶│  MediaPipe Pose  │───▶│  Landmark Export  │
│  (Client)    │    │  (Client/WASM)   │    │  33×2 normalized  │
└──────────────┘    └─────────────────┘    └────────┬─────────┘
                                                     │
                                                     ▼
                    ┌─────────────────┐    ┌──────────────────┐
                    │  Energy Field   │◀───│  Signature Hash   │
                    │  Hash (SHA-256) │    │  (Client-local)   │
                    └────────┬────────┘    └──────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Protocol Node  │
                    │  (Supabase)     │
                    │  hash + email   │
                    └─────────────────┘
```

### 3.2 Pipeline Steps

1. **Capture**: Browser requests camera access. Single frame or short burst captured.
2. **Infer**: MediaPipe Pose (WASM, client-side) extracts 33 pose landmarks.
3. **Normalize**: Landmark coordinates normalized to [0, 1] relative to frame dimensions.
4. **Flatten**: 33 × 2 matrix → 66-element flat array.
5. **Hash**: SHA-256 of the 66-element array → `energy_field_hash`.
6. **Commit**: Hash + email + genesis_id → POST to `/api/uplink`.
7. **Verify**: OTP sent to email. On verification, node status → ACTIVE.

### 3.3 Privacy Guarantees

- **The server never sees raw landmarks.** Only the SHA-256 hash is transmitted.
- **The server never sees camera frames.** All MediaPipe inference runs client-side.
- **The hash cannot be reversed** to reconstruct the original motion signature.
- **Different captures of the same person produce different hashes** — this is intentional. Identity verification uses similarity matching, not exact hash comparison.

---

## 4. Identity Verification (Future)

### 4.1 Similarity Matching

Two motion signatures from the same person will produce *similar* but not *identical* hashes. Verification uses:

```
similarity = cosine_similarity(motion_signature_A, motion_signature_B)

if similarity > THRESHOLD → same entity, high confidence
if similarity < THRESHOLD → different entity or adversarial attempt
```

The threshold is TBD via empirical testing.

### 4.2 Zero-Knowledge Upgrade Path

The current hash-based approach provides privacy but not full zero-knowledge properties. Future upgrade:

- **Pedersen Commitment**: Replace SHA-256 with a homomorphic commitment scheme.
- **Groth16 Circuit**: Prove `cosine_similarity(signature, commitment) > THRESHOLD` without revealing the signature.
- **On-Chain Verification**: The proof can be submitted to any EVM-compatible chain.

---

## 5. API Reference

### 5.1 `POST /api/uplink`

Register a new genesis node.

**Request**:
```json
{
  "email": "entity@example.com",
  "node_handle": "GNS_A1B2C3_D4E5F6G7"
}
```

**Response (200)**:
```json
{ "success": true }
```

### 5.2 `POST /api/send-otp`

Request a verification code.

**Request**:
```json
{
  "email": "entity@example.com"
}
```

**Response (200)**:
```json
{ "success": true }
```

### 5.3 `POST /api/verify-otp`

Verify code and activate node.

**Request**:
```json
{
  "email": "entity@example.com",
  "otp": "123456"
}
```

**Response (200)**:
```json
{ "success": true }
```

---

## 6. Implementation Status

| Component | Status | Notes |
|:---|:---|:---|
| Motion Signature Extraction | 🟡 Prototype | MediaPipe integrated, landmark→hash pipeline WIP |
| Data-Body Genesis | ✅ MVP | Email + OTP → node creation |
| Energy Field Hash | ❌ Not implemented | Currently stores email directly, no hash |
| Zero-Knowledge Layer | ❌ Spec only | Roadmap item |
| Similarity Verification | ❌ Spec only | Roadmap item |
| On-Chain Anchoring | ❌ Not started | Roadmap item |

---

## 7. References

- [MediaPipe Pose](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
- [SHA-256 (FIPS 180-4)](https://csrc.nist.gov/pubs/fips/180-4/upd1/final)
- [Pedersen Commitments](https://link.springer.com/chapter/10.1007/3-540-46766-1_9)
- [Groth16 zkSNARK](https://eprint.iacr.org/2016/260.pdf)

---

*This specification is version 0.1 — a living document that co-evolves with the codebase.*
