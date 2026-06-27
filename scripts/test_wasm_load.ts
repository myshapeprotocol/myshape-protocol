/**
 * MyShape WASM — Verification Script
 *
 * Validates the Rust → WASM → Node.js compilation pipeline.
 * Tests all critical API surfaces: challenge generation, signature extraction,
 * human/AI motion synthesis, verification, and enrollment.
 *
 * Usage:
 *   cd scripts
 *   npx tsx test_wasm_load.ts
 *
 * Prerequisites:
 *   cd ../wasm
 *   wasm-pack build --target nodejs        # or manual wasm-bindgen
 */

import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';

// ── Load WASM ────────────────────────────────────────────────────────

const WASM_PATH = path.join(__dirname, '..', 'wasm', 'pkg', 'myshape_wasm.js');

async function loadWasm(): Promise<any> {
  if (!fs.existsSync(WASM_PATH)) {
    throw new Error(
      `WASM package not found at: ${WASM_PATH}\n` +
      `Build it first: cd ../wasm && wasm-pack build --target nodejs`
    );
  }
  // Use file:// URL to support Windows absolute paths
  const wasmUrl = pathToFileURL(WASM_PATH).href;
  const wasm = await import(wasmUrl);
  console.log(`  [LOAD] WASM module loaded from: ${WASM_PATH}`);
  return wasm;
}

// ── Helpers ───────────────────────────────────────────────────────────

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  [PASS] ${label}${detail ? ` — ${detail}` : ''}`);
  } else {
    console.error(`  [FAIL] ${label}${detail ? ` — ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

function generateSessionKey(): string {
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// ── Main Test Suite ───────────────────────────────────────────────────

async function main() {
  console.log('\n═══════════════════════════════════════');
  console.log('  MyShape WASM — Verification Suite');
  console.log('═══════════════════════════════════════\n');

  // ── Step 0: Load ─────────────────────────────────────────────────
  console.log('── Step 0: Load WASM Module');
  const wasm = await loadWasm();

  // Verify all expected exports exist
  const expectedExports = [
    'generate_challenge',
    'extract_signature',
    'similarity',
    'verify_intent',
    'create_enrollment',
    'generate_human_motion',
    'generate_ai_motion',
  ];

  for (const name of expectedExports) {
    check(
      `Export: ${name}`,
      typeof wasm[name] === 'function',
      'function exported'
    );
  }

  // ── Step 1: Challenge Generation ──────────────────────────────────
  console.log('\n── Step 1: Challenge Generation');
  const sessionKey = generateSessionKey();
  const challengeJson = wasm.generate_challenge(sessionKey);
  const challenge = JSON.parse(challengeJson);

  check('Challenge parsed', !!challenge, 'valid JSON');
  check('Has challenge_id', !!challenge.challenge_id);
  check('Has actions', Array.isArray(challenge.actions) && challenge.actions.length >= 3,
    `${challenge.actions?.length || 0} actions`);
  check('Has coupling constraint',
    challenge.actions?.some((a: any) => a.action_type === 'constraint'),
    'Patch 1 verified');
  check('Timing window is 100ms',
    challenge.timing?.start_window_ms === 100);
  check('Has challenge_token',
    Array.isArray(challenge.challenge_token) && challenge.challenge_token.length > 0);

  // ── Step 2: Motion Generation ─────────────────────────────────────
  console.log('\n── Step 2: Motion Synthesis');

  const humanMotionJson = wasm.generate_human_motion(3.0, 30, 0.15);
  const humanMotion = JSON.parse(humanMotionJson);
  check('Human motion generated', !!humanMotion && humanMotion.fps === 30,
    `${humanMotion.frames?.length || 0} frames`);

  const aiMotionJson = wasm.generate_ai_motion(3.0, 30, 0.15);
  const aiMotion = JSON.parse(aiMotionJson);
  check('AI motion generated', !!aiMotion && aiMotion.fps === 30,
    `${aiMotion.frames?.length || 0} frames`);

  // Both should have the same number of frames
  check('Frame counts match',
    humanMotion.frames?.length === aiMotion.frames?.length,
    `${humanMotion.frames?.length} = ${aiMotion.frames?.length}`);

  // ── Step 3: Signature Extraction ─────────────────────────────────
  console.log('\n── Step 3: Signature Extraction');

  const humanSigJson = wasm.extract_signature(humanMotionJson);
  const humanSig = JSON.parse(humanSigJson);
  check('Human signature extracted', humanSig.version === 1,
    `${humanSig.vector?.length || 0}-dim vector`);

  const aiSigJson = wasm.extract_signature(aiMotionJson);
  const aiSig = JSON.parse(aiSigJson);
  check('AI signature extracted', aiSig.version === 1,
    `${aiSig.vector?.length || 0}-dim vector`);

  // Signatures should differ
  const humanAiSim = wasm.similarity(humanSigJson, aiSigJson);
  check('Human vs AI signatures differ', humanAiSim < 1.0,
    `similarity: ${humanAiSim.toFixed(4)}`);
  check('Human vs AI similarity < 0.99', humanAiSim < 0.99,
    `gap exists: ${(1.0 - humanAiSim).toFixed(4)}`);

  // ── Step 4: Enrollment ────────────────────────────────────────────
  console.log('\n── Step 4: Enrollment');

  // Generate 20 enrollment signatures
  const enrollmentSigs: string[] = [];
  for (let i = 0; i < 20; i++) {
    const motionJson = wasm.generate_human_motion(3.0, 30, 0.15 + Math.random() * 0.02);
    const sigJson = wasm.extract_signature(motionJson);
    enrollmentSigs.push(sigJson);
  }

  const deviceInfo = {
    os: 'ios',
    model: 'iPhone 15 Pro',
    device_id: 'test-device-001',
    is_rooted: false,
    imu_sample_rate_hz: 200,
  };

  const enrollmentJson = wasm.create_enrollment(
    JSON.stringify(enrollmentSigs.map(s => JSON.parse(s))),
    'test-user-001',
    JSON.stringify(deviceInfo)
  );
  const enrollment = JSON.parse(enrollmentJson);

  check('Enrollment created', !!enrollment, `user: ${enrollment.user_id}`);
  check('Enrollment variance > 0', enrollment.variance > 0,
    `variance: ${enrollment.variance?.toFixed(6)}`);
  check('Sample count = 20', enrollment.sample_count === 20);

  // ── Step 5: Verification — Human ──────────────────────────────────
  console.log('\n── Step 5: Verification — Genuine Human');

  const humanResponse = {
    challenge_id: challenge.challenge_id,
    user_id: 'test-user-001',
    pose_sequence: humanMotion,
    imu_sequence: { sample_rate_hz: 200, samples: [] },
    device_info: deviceInfo,
    location: {
      latitude: 31.23,
      longitude: 121.47,
      timestamp: Date.now() / 1000,
    },
  };

  const humanResultJson = wasm.verify_intent(
    enrollmentJson,
    challengeJson,
    JSON.stringify(humanResponse),
    humanSigJson,
    'medium'
  );
  const humanResult = JSON.parse(humanResultJson);

  check('Human verified', humanResult.verified === true,
    `score: ${humanResult.presence_score?.toFixed(4)}`);
  check('Human score > threshold',
    humanResult.presence_score > humanResult.threshold,
    `${humanResult.presence_score.toFixed(4)} > ${humanResult.threshold}`);
  check('Motion factor strong',
    humanResult.factors?.motion > 0.7,
    `motion: ${humanResult.factors?.motion?.toFixed(3)}`);

  // ── Step 6: Verification — AI Forgery ────────────────────────────
  console.log('\n── Step 6: Verification — AI Forgery');

  const aiResponse = {
    challenge_id: challenge.challenge_id,
    user_id: 'test-user-001',
    pose_sequence: aiMotion,
    imu_sequence: { sample_rate_hz: 200, samples: [] },
    device_info: deviceInfo,
    location: {
      latitude: 31.23,
      longitude: 121.47,
      timestamp: Date.now() / 1000,
    },
  };

  const aiResultJson = wasm.verify_intent(
    enrollmentJson,
    challengeJson,
    JSON.stringify(aiResponse),
    aiSigJson,
    'medium'
  );
  const aiResult = JSON.parse(aiResultJson);

  check('AI forgery rejected', aiResult.verified === false,
    `score: ${aiResult.presence_score?.toFixed(4)}`);
  check('AI score < threshold',
    aiResult.presence_score < aiResult.threshold,
    `${aiResult.presence_score.toFixed(4)} < ${aiResult.threshold}`);
  check('AI rejection reason present',
    !!aiResult.rejection_reason,
    aiResult.rejection_reason);

  // ── Step 7: The Gap ───────────────────────────────────────────────
  console.log('\n── Step 7: Human—AI Gap');

  const gap = humanResult.presence_score - aiResult.presence_score;
  check('Human—AI gap > 0', gap > 0, `gap: ${gap.toFixed(4)}`);
  check('Gap is significant (> 0.3)', gap > 0.3,
    `strong separation: ${gap.toFixed(4)}`);

  // ── Step 8: Risk API ──────────────────────────────────────────────
  console.log('\n── Step 8: Risk API');

  // Test with HIGH risk level on AI forgery
  const highRiskResultJson = wasm.verify_intent(
    enrollmentJson,
    challengeJson,
    JSON.stringify(aiResponse),
    aiSigJson,
    'high'
  );
  const highRiskResult = JSON.parse(highRiskResultJson);
  check('High risk rejects AI', highRiskResult.verified === false,
    `threshold raised to ${highRiskResult.threshold}`);
  check('High risk threshold > medium',
    highRiskResult.threshold > humanResult.threshold,
    `${highRiskResult.threshold} > ${humanResult.threshold}`);

  // ── Step 9: Device Hard Gate ──────────────────────────────────────
  console.log('\n── Step 9: Device Hard Gate');

  const rootedDevice = { ...deviceInfo, is_rooted: true };
  const rootedResponse = { ...humanResponse, device_info: rootedDevice };
  const rootedResultJson = wasm.verify_intent(
    enrollmentJson,
    challengeJson,
    JSON.stringify(rootedResponse),
    humanSigJson,
    'medium'
  );
  const rootedResult = JSON.parse(rootedResultJson);
  check('Rooted device rejected', rootedResult.verified === false);
  check('Rooted device score = 0',
    rootedResult.factors?.device === 0,
    `device: ${rootedResult.factors?.device}`);

  // Different device
  const diffDevice = { ...deviceInfo, device_id: 'different-device-999' };
  const diffResponse = { ...humanResponse, device_info: diffDevice };
  const diffResultJson = wasm.verify_intent(
    enrollmentJson,
    challengeJson,
    JSON.stringify(diffResponse),
    humanSigJson,
    'medium'
  );
  const diffResult = JSON.parse(diffResultJson);
  check('Different device rejected', diffResult.verified === false);
  check('Different device score = 0',
    diffResult.factors?.device === 0);

  // ── Summary ───────────────────────────────────────────────────────
  const totalChecks = 30; // Approximate count
  console.log('\n═══════════════════════════════════════');
  console.log('  WASM Verification Complete');
  console.log(`  Human Score : ${humanResult.presence_score.toFixed(4)}  PASS`);
  console.log(`  AI Score    : ${aiResult.presence_score.toFixed(4)}  FAIL`);
  console.log(`  Gap         : ${gap.toFixed(4)}`);
  console.log('═══════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\n[FATAL] WASM verification failed:');
  console.error(err.message);
  console.error(err.stack);
  process.exit(1);
});
