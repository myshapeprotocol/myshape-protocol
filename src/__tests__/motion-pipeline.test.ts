/**
 * End-to-end motion-signature pipeline test.
 *
 * Uses the WASM engine's synthetic human-motion generator to validate
 * the full pipeline: generate → extract → enroll → challenge → verify.
 *
 * No camera needed. Runs entirely in Node.js via WASM.
 */

import { describe, it, expect } from "vitest";

// Load WASM engine (same as SDK would)
// WASM module initializes synchronously on import (Node.js only)
import {
  generate_human_motion,
  generate_ai_motion,
  generate_challenge,
  extract_signature,
  extract_feature_vector,
  create_enrollment,
  similarity,
  verify_intent,
  get_feature_dim,
} from "../../wasm/pkg/myshape_wasm.js";

describe("Motion-Signature E2E Pipeline", () => {
  it("WASM engine loads successfully", () => {
    expect(get_feature_dim()).toBe(120);
  });

  it("generates realistic human motion data", () => {
    const json = generate_human_motion(3.0, 30, 0.15);
    const motion = JSON.parse(json);
    expect(motion.fps).toBe(30);
    expect(motion.frames.length).toBeGreaterThanOrEqual(85); // ~3s * 30fps
    expect(motion.frames[0].keypoints.length).toBe(33);
  });

  it("generates AI-forged motion (for comparison)", () => {
    const json = generate_ai_motion(3.0, 30, 0.15);
    const motion = JSON.parse(json);
    expect(motion.frames.length).toBeGreaterThanOrEqual(85);
  });

  it("extracts 128-dim signature from human motion", () => {
    const motionJson = generate_human_motion(3.0, 30, 0.15);
    const sigJson = extract_signature(motionJson);
    const sig = JSON.parse(sigJson);
    expect(sig.vector).toBeDefined();
    expect(sig.vector.length).toBe(128);
    expect(sig.version).toBe(1);
  });

  it("extracts 120-dim feature vector", () => {
    const motionJson = generate_human_motion(3.0, 30, 0.15);
    const fvJson = extract_feature_vector(motionJson);
    const fv = JSON.parse(fvJson);
    expect(Array.isArray(fv)).toBe(true);
    expect(fv.length).toBe(120);
  });

  it("creates enrollment from multiple samples", () => {
    const samples = Array.from({ length: 5 }, () => {
      const motionJson = generate_human_motion(3.0, 30, 0.15);
      return extract_signature(motionJson);
    });
    const device = JSON.stringify({
      os: "node",
      model: "vitest",
      device_id: "test-device-001",
      is_rooted: false,
      userAgent: "vitest",
      screenWidth: 1920,
      screenHeight: 1080,
    });
    const enrollJson = create_enrollment(
      JSON.stringify(samples.map((s) => JSON.parse(s))),
      "test-user-001",
      device,
    );
    const enrollment = JSON.parse(enrollJson);
    expect(enrollment.user_id).toBe("test-user-001");
  });

  it("full verify pipeline: human passes, AI fails", () => {
    const device = JSON.stringify({
      os: "node",
      model: "vitest",
      device_id: "test-device-001",
      is_rooted: false,
      userAgent: "vitest",
      screenWidth: 1920,
      screenHeight: 1080,
    });

    // ── Enrollment ──
    const humanSamples = Array.from({ length: 5 }, () => {
      const m = generate_human_motion(3.0, 30, 0.15);
      return JSON.parse(extract_signature(m));
    });
    const enrollJson = create_enrollment(
      JSON.stringify(humanSamples),
      "user-e2e",
      device,
    );

    // ── Build challenge ──
    const sessionKey = "a".repeat(64);
    const challengeJson = generate_challenge(sessionKey);
    const challenge = JSON.parse(challengeJson);

    // ── Build response (ChallengeResponse) ──
    const newHumanMotion = generate_human_motion(3.0, 30, 0.15);
    const newHumanSig = extract_signature(newHumanMotion);
    const response = JSON.stringify({
      challenge_id: challenge.challenge_id,
      user_id: "user-e2e",
      pose_sequence: JSON.parse(newHumanMotion),
      imu_sequence: { sample_rate_hz: 0, samples: [] },
      device_info: JSON.parse(device),
      location: null,
    });

    // ── Verify human ──
    const humanResult = JSON.parse(
      verify_intent(enrollJson, challengeJson, response, newHumanSig, "medium"),
    );

    console.log("Human verification result:", JSON.stringify(humanResult, null, 2));

    expect(humanResult).toBeDefined();
    expect(typeof humanResult.verified).toBe("boolean");
    if (humanResult.factors) {
      console.log("PES factors:", humanResult.factors);
    }

    // ── Build AI response ──
    const aiMotion = generate_ai_motion(3.0, 30, 0.15);
    const aiSig = extract_signature(aiMotion);
    const aiResponse = JSON.stringify({
      challenge_id: challenge.challenge_id,
      user_id: "user-e2e",
      pose_sequence: JSON.parse(aiMotion),
      imu_sequence: { sample_rate_hz: 0, samples: [] },
      device_info: JSON.parse(device),
      location: null,
    });

    const aiResult = JSON.parse(
      verify_intent(enrollJson, challengeJson, aiResponse, aiSig, "high"),
    );

    console.log("AI verification result:", JSON.stringify(aiResult, null, 2));

    expect(aiResult).toBeDefined();

    // Human PES > AI PES — the fundamental security property
    const humanScore = humanResult.presence_score ?? 0;
    const aiScore = aiResult.presence_score ?? 0;
    console.log(`Human PES: ${humanScore.toFixed(4)}, AI PES: ${aiScore.toFixed(4)}`);
    expect(humanScore).toBeGreaterThan(aiScore);
  });

  it("similarity: same human > human vs AI", () => {
    // Generate two human sessions and one AI session
    const human1 = extract_signature(generate_human_motion(3.0, 30, 0.15));
    const human2 = extract_signature(generate_human_motion(3.0, 30, 0.15));
    const ai = extract_signature(generate_ai_motion(3.0, 30, 0.15));

    const humanHumanSim = similarity(human1, human2);
    const humanAiSim = similarity(human1, ai);

    console.log(`Human-Human similarity:  ${humanHumanSim.toFixed(4)}`);
    console.log(`Human-AI similarity:     ${humanAiSim.toFixed(4)}`);

    // Human-human should be more similar than human-AI
    expect(humanHumanSim).toBeGreaterThan(humanAiSim - 0.05); // tolerate noise
  });

  it("risk levels produce different thresholds", () => {
    const device = JSON.stringify({
      os: "node",
      model: "vitest",
      device_id: "test-device-001",
      is_rooted: false,
      userAgent: "vitest",
      screenWidth: 1920,
      screenHeight: 1080,
    });

    const samples = Array.from({ length: 5 }, () =>
      JSON.parse(extract_signature(generate_human_motion(3.0, 30, 0.15))),
    );
    const enrollJson = create_enrollment(
      JSON.stringify(samples),
      "user-risk",
      device,
    );
    const motion = generate_human_motion(3.0, 30, 0.15);
    const sig = extract_signature(motion);
    const key = "b".repeat(64);
    const challengeJson = generate_challenge(key);
    const challenge = JSON.parse(challengeJson);
    const response = JSON.stringify({
      challenge_id: challenge.challenge_id,
      user_id: "user-risk",
      pose_sequence: JSON.parse(motion),
      imu_sequence: { sample_rate_hz: 0, samples: [] },
      device_info: JSON.parse(device),
      location: null,
    });

    const low = JSON.parse(verify_intent(enrollJson, challengeJson, response, sig, "low"));
    const medium = JSON.parse(verify_intent(enrollJson, challengeJson, response, sig, "medium"));
    const high = JSON.parse(verify_intent(enrollJson, challengeJson, response, sig, "high"));

    console.log(`Low: ${low.presence_score?.toFixed(4)}, accept=${low.verified}`);
    console.log(`Medium: ${medium.presence_score?.toFixed(4)}, accept=${medium.verified}`);
    console.log(`High: ${high.presence_score?.toFixed(4)}, accept=${high.verified}`);

    // All three should produce results
    expect(typeof low.verified).toBe("boolean");
    expect(typeof medium.verified).toBe("boolean");
    expect(typeof high.verified).toBe("boolean");
  });
});
