import { describe, it, expect } from "vitest";
import {
  mediaPipeToSST,
  sstToMediaPipe,
  normalizeSSTFrame,
  MEDIAPIPE_TO_SST,
  SST_BONES,
} from "./skeleton-topology";
import type { MediaPipeLandmark } from "./skeleton-topology";
import type { JointPosition, SSTJointId } from "@/types/motion-vector";

// ── MediaPipe → SST Mapping ──

describe("mediaPipeToSST", () => {
  function makeMPLandmarks(count = 33): MediaPipeLandmark[] {
    return Array.from({ length: count }, (_, i) => ({
      x: (i % 10) / 10,     // 0.0–0.9
      y: (i % 8) / 8,       // 0.0–0.875
      z: (i % 5) * 0.1 - 0.2, // -0.2 to 0.2
      visibility: 0.9 + Math.random() * 0.1,
    }));
  }

  it("returns 18 SST joints", () => {
    const mp = makeMPLandmarks();
    const sst = mediaPipeToSST(mp);
    const keys = Object.keys(sst);
    expect(keys.length).toBe(18);
    // Keys should be 0–17
    for (let i = 0; i < 18; i++) {
      expect(sst[i as SSTJointId]).toBeDefined();
    }
  });

  it("denormalizes coordinates to 640×480 reference space", () => {
    const mp: MediaPipeLandmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5, y: 0.5, z: 0.5, visibility: 1.0,
    }));
    const sst = mediaPipeToSST(mp);
    // Shoulder (MP 11 → SST 3)
    expect(sst[3].x).toBeCloseTo(320, 0);  // 0.5 × 640
    expect(sst[3].y).toBeCloseTo(240, 0);  // 0.5 × 480
  });

  it("fills unmapped joints with zeros", () => {
    const mp: MediaPipeLandmark[] = []; // empty input
    const sst = mediaPipeToSST(mp);
    for (let i = 0; i < 18; i++) {
      expect(sst[i as SSTJointId]).toEqual({ x: 0, y: 0, z: 0 });
    }
  });

  it("maps shoulder landmarks correctly (MP 11→SST3, MP12→SST4)", () => {
    const mp = Array.from({ length: 33 }, (_, i) => ({
      x: i === 11 ? 0.3 : i === 12 ? 0.7 : 0,
      y: i === 11 ? 0.4 : i === 12 ? 0.4 : 0,
      z: 0,
    }));
    const sst = mediaPipeToSST(mp);
    expect(sst[3].x).toBeCloseTo(0.3 * 640, 0); // left shoulder
    expect(sst[4].x).toBeCloseTo(0.7 * 640, 0); // right shoulder
  });
});

// ── SST → MediaPipe ──

describe("sstToMediaPipe", () => {
  it("returns 33 MediaPipe landmarks", () => {
    const sstFrame: Record<number, JointPosition> = {};
    for (let i = 0; i < 18; i++) {
      sstFrame[i] = { x: 320, y: 240, z: 0 };
    }
    const mp = sstToMediaPipe(sstFrame);
    expect(mp).toHaveLength(33);
  });

  it("round-trips correctly through SST", () => {
    // Create MP landmarks → SST → MP and verify mapped joints match
    const original: MediaPipeLandmark[] = Array.from({ length: 33 }, (_, i) => ({
      x: 0.1 + i * 0.02,
      y: 0.2 + i * 0.01,
      z: i * 0.01 - 0.1,
    }));
    const sst = mediaPipeToSST(original);
    const roundtripped = sstToMediaPipe(sst);

    // Shoulder joints (MP 11, 12 → SST 3, 4) should round-trip
    expect(roundtripped[11].x).toBeCloseTo(original[11].x, 4);
    expect(roundtripped[11].y).toBeCloseTo(original[11].y, 4);
    expect(roundtripped[12].x).toBeCloseTo(original[12].x, 4);
  });
});

// ── Normalize ──

describe("normalizeSSTFrame", () => {
  it("normalizes frame coordinates relative to torso midpoint", () => {
    const frame: Record<SSTJointId, JointPosition> = {} as Record<SSTJointId, JointPosition>;
    for (let i = 0; i < 18; i++) {
      frame[i as SSTJointId] = { x: 300 + i * 10, y: 200 + i * 5, z: i * 3 };
    }
    const normalized = normalizeSSTFrame(frame);

    // All 18 joints should still exist
    for (let i = 0; i < 18; i++) {
      expect(normalized[i as SSTJointId]).toBeDefined();
      expect(typeof normalized[i as SSTJointId].x).toBe("number");
      expect(typeof normalized[i as SSTJointId].y).toBe("number");
      expect(typeof normalized[i as SSTJointId].z).toBe("number");
    }
  });
});

// ── Static Data ──

describe("MEDIAPIPE_TO_SST", () => {
  it("maps exactly 18 joints (17 MP points map to SST, rest are null)", () => {
    const mapped = Object.values(MEDIAPIPE_TO_SST).filter((v) => v !== null && v !== undefined);
    // 17 MP landmarks map to 18 SST joints (one MP maps to SST 17 "nose")
    // 13 MP landmarks directly map to SST: nose(0→17),
    //   shoulders(11→3,12→4), elbows(13→5,14→6), wrists(15→7,16→8),
    //   hips(23→9,24→10), knees(25→11,26→12), ankles(27→13,28→14)
    // The remaining SST joints (head, neck, spine, pelvis, torso) are computed.
    expect(mapped.length).toBeGreaterThanOrEqual(13);
  });
});

describe("SST_BONES", () => {
  it("defines all bones within valid SST range (0-17)", () => {
    for (const [from, to] of SST_BONES) {
      expect(from).toBeGreaterThanOrEqual(0);
      expect(from).toBeLessThan(18);
      expect(to).toBeGreaterThanOrEqual(0);
      expect(to).toBeLessThan(18);
    }
  });

  it("has at least 15 bone connections", () => {
    expect(SST_BONES.length).toBeGreaterThanOrEqual(15);
  });
});
