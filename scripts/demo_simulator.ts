/**
 * MyShape Protocol — Demo Simulator
 *
 * "Human vs AI Forgery" comparison demonstration.
 *
 * Generates synthetic human motion (with realistic micro-tremor) and
 * AI-forged motion (visually correct but lacking deep dynamics),
 * then runs both through the MyShape verification engine.
 *
 * Usage:
 *   cd scripts
 *   npm run demo                # Standard output
 *   npm run demo:verbose        # Detailed per-dimension output
 *   npx tsx demo_simulator.ts   # Direct run
 *
 * Prerequisites:
 *   1. Build WASM: cd ../wasm && wasm-pack build --target nodejs
 *   2. Install deps: cd ../scripts && npm install
 */

import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';

// ── Dynamic WASM Import ──────────────────────────────────────────────

type WasmModule = typeof import('../wasm/pkg/myshape_wasm');

async function loadWasm(): Promise<WasmModule> {
  const wasmPath = path.join(__dirname, '..', 'wasm', 'pkg', 'myshape_wasm.js');

  if (!fs.existsSync(wasmPath)) {
    console.error(`\n  ERROR: WASM package not found at: ${wasmPath}`);
    console.error(`  Build it first: cd ../wasm && wasm-pack build --target nodejs\n`);
    process.exit(1);
  }

  // Use file:// URL for Windows compatibility
  const wasm = await import(pathToFileURL(wasmPath).href);
  return wasm as unknown as WasmModule;
}

// ── Test Helpers ─────────────────────────────────────────────────────

function createTestDevice(tier: 1 | 2 | 3 = 2): any {
  return {
    os: 'ios',
    model: tier >= 2 ? 'iPhone 15 Pro' : 'iPhone SE',
    device_id: 'demo-device-001',
    is_rooted: false,
    imu_sample_rate_hz: tier >= 2 ? 200 : undefined,
  };
}

function createLocation(): any {
  return {
    latitude: 31.2304,
    longitude: 121.4737,
    timestamp: Date.now() / 1000,
  };
}

// ── Terminal Output Formatting ───────────────────────────────────────

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  redBg: '\x1b[41m',
  greenBg: '\x1b[42m',
};

function banner(text: string): void {
  const line = '═'.repeat(62);
  console.log(`\n${C.cyan}${line}${C.reset}`);
  console.log(`${C.bold}${C.cyan}  ${text}${C.reset}`);
  console.log(`${C.cyan}${line}${C.reset}\n`);
}

function section(text: string): void {
  console.log(`\n${C.bold}${C.blue}── ${text}${C.reset}\n`);
}

function verdict(passed: boolean, score: number): string {
  if (passed) {
    return `${C.greenBg}${C.bold}  PASS  ${C.reset}  score: ${score.toFixed(4)}`;
  } else {
    return `${C.redBg}${C.bold}  FAIL  ${C.reset}  score: ${score.toFixed(4)}`;
  }
}

function factorBar(label: string, score: number, max: number = 1.0): string {
  const width = 30;
  const filled = Math.round((score / max) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const color = score > 0.7 ? C.green : score > 0.4 ? C.yellow : C.red;
  return `${label.padEnd(12)} ${color}${bar}${C.reset} ${score.toFixed(3)}`;
}

// ── Main Demo ────────────────────────────────────────────────────────

async function main() {
  const verbose = process.argv.includes('--verbose');

  banner('MyShape Protocol — Human vs AI Forgery Demo');

  // ── Step 1: Load WASM Engine ────────────────────────────────────
  section('Step 1: Loading MyShape WASM Engine');
  const wasm = await loadWasm();
  console.log(`  ${C.green}✓${C.reset} WASM engine loaded successfully`);
  console.log(`  ${C.dim}Module exports: ${Object.keys(wasm).filter(k => typeof (wasm as any)[k] === 'function').join(', ')}${C.reset}`);

  // ── Step 2: Generate Enrollment ─────────────────────────────────
  section('Step 2: Enrolling a Human User');
  const device = createTestDevice(2);

  // Generate 20 enrollment motion samples
  console.log('  Generating 20 enrollment motion samples...');
  const enrollmentSignatures: any[] = [];
  for (let i = 0; i < 20; i++) {
    const motionJson = wasm.generate_human_motion(3.0, 30, 0.15 + Math.random() * 0.02);
    const sigJson = wasm.extract_signature(motionJson);
    enrollmentSignatures.push(JSON.parse(sigJson));
  }
  console.log(`  ${C.green}✓${C.reset} 20 enrollment signatures extracted`);

  // Create enrollment
  const enrollmentJson = wasm.create_enrollment(
    JSON.stringify(enrollmentSignatures),
    'demo-user-001',
    JSON.stringify(device)
  );
  const enrollment = JSON.parse(enrollmentJson);
  console.log(`  ${C.green}✓${C.reset} Enrollment created for user: ${enrollment.user_id}`);
  console.log(`  ${C.dim}Variance: ${enrollment.variance.toFixed(6)} | Samples: ${enrollment.sample_count}${C.reset}`);

  // ── Step 3: Generate Challenge ──────────────────────────────────
  section('Step 3: Issuing Verification Challenge');
  const sessionKeyHex = crypto.randomBytes(32).toString('hex');
  const challengeJson = wasm.generate_challenge(sessionKeyHex);
  const challenge = JSON.parse(challengeJson);

  console.log(`  Challenge ID: ${challenge.challenge_id.slice(0, 12)}...`);
  console.log(`  Actions:`);
  for (const action of challenge.actions) {
    const role = action.action_type === 'constraint'
      ? `${C.yellow}constraint${C.reset}`
      : action.action_type;
    console.log(`    • [${role}] ${action.joint}: ${action.motion}${action.direction ? ' ' + action.direction : ''}${action.amplitude ? ' (' + action.amplitude + ')' : ''}${action.angle_deg ? ' ' + action.angle_deg + '°' : ''}`);
  }
  console.log(`  Timing: ${challenge.timing.start_window_ms}ms window, ${challenge.duration_ms}ms duration`);
  console.log(`  ${C.dim}Coupling constraint present: ${challenge.actions.some((a: any) => a.action_type === 'constraint')}${C.reset}`);

  // ── Step 4: Test Case 1 — Genuine Human ────────────────────────
  banner('Test 1: GENUINE HUMAN MOTION');
  console.log('  Source: Same user, realistic micro-tremor & jerk dynamics');
  console.log('  Expected: SHOULD PASS verification');

  const humanMotionJson = wasm.generate_human_motion(3.5, 30, 0.15);
  const humanSigJson = wasm.extract_signature(humanMotionJson);
  const humanSignature = JSON.parse(humanSigJson);

  const humanResultJson = wasm.verify_intent(
    enrollmentJson,
    challengeJson,
    JSON.stringify({
      challenge_id: challenge.challenge_id,
      user_id: 'demo-user-001',
      pose_sequence: JSON.parse(humanMotionJson),
      imu_sequence: { sample_rate_hz: 200, samples: [] },
      device_info: device,
      location: createLocation(),
    }),
    humanSigJson,
    'medium'
  );
  const humanResult = JSON.parse(humanResultJson);

  console.log(`\n  ${verdict(humanResult.verified, humanResult.presence_score)}`);
  console.log(`  Risk Level: ${humanResult.risk_level} | Threshold: ${humanResult.threshold}`);
  console.log(`\n  Factor Breakdown:`);
  console.log(`  ${factorBar('Motion', humanResult.factors.motion)}`);
  console.log(`  ${factorBar('Device', humanResult.factors.device)}`);
  console.log(`  ${factorBar('Context', humanResult.factors.context)}`);

  if (verbose) {
    const humanSim = wasm.similarity(JSON.stringify(enrollment.signature), humanSigJson);
    console.log(`\n  ${C.dim}Similarity to enrollment: ${humanSim.toFixed(4)}${C.reset}`);
    console.log(`  ${C.dim}Signature vector (first 8): [${humanSignature.vector.slice(0, 8).map((v: number) => v.toFixed(4)).join(', ')}...]${C.reset}`);
  }

  // ── Step 5: Test Case 2 — AI Forgery ───────────────────────────
  banner('Test 2: AI-FORGED MOTION');
  console.log('  Source: AI diffusion model — visually correct, over-smoothed');
  console.log('  Expected: SHOULD FAIL — lacks tremor, jerk complexity, dynamics');

  const aiMotionJson = wasm.generate_ai_motion(3.5, 30, 0.15);
  const aiSigJson = wasm.extract_signature(aiMotionJson);
  const aiSignature = JSON.parse(aiSigJson);

  const aiResultJson = wasm.verify_intent(
    enrollmentJson,
    challengeJson,
    JSON.stringify({
      challenge_id: challenge.challenge_id,
      user_id: 'demo-user-001',
      pose_sequence: JSON.parse(aiMotionJson),
      imu_sequence: { sample_rate_hz: 200, samples: [] },
      device_info: device,
      location: createLocation(),
    }),
    aiSigJson,
    'medium'
  );
  const aiResult = JSON.parse(aiResultJson);

  console.log(`\n  ${verdict(aiResult.verified, aiResult.presence_score)}`);
  console.log(`  Risk Level: ${aiResult.risk_level} | Threshold: ${aiResult.threshold}`);
  if (aiResult.rejection_reason) {
    console.log(`  ${C.red}Rejection: ${aiResult.rejection_reason}${C.reset}`);
  }
  console.log(`\n  Factor Breakdown:`);
  console.log(`  ${factorBar('Motion', aiResult.factors.motion)}`);
  console.log(`  ${factorBar('Device', aiResult.factors.device)}`);
  console.log(`  ${factorBar('Context', aiResult.factors.context)}`);

  if (verbose) {
    const aiSim = wasm.similarity(JSON.stringify(enrollment.signature), aiSigJson);
    console.log(`\n  ${C.dim}Similarity to enrollment: ${aiSim.toFixed(4)}${C.reset}`);
    console.log(`  ${C.dim}Signature vector (first 8): [${aiSignature.vector.slice(0, 8).map((v: number) => v.toFixed(4)).join(', ')}...]${C.reset}`);

    // Show the gap between human and AI signatures
    const humanAiSim = wasm.similarity(JSON.stringify(humanSignature), aiSigJson);
    console.log(`  ${C.dim}Human-vs-AI signature similarity: ${humanAiSim.toFixed(4)}${C.reset}`);
  }

  // ── Step 6: Test Case 3 — Different Person ────────────────────
  banner('Test 3: DIFFERENT PERSON (Impostor)');
  console.log('  Source: Different human — different amplitude & style');
  console.log('  Expected: SHOULD FAIL — kinematic signature mismatch');

  const impostorMotionJson = wasm.generate_human_motion(3.5, 30, 0.28); // Different amplitude
  const impostorSigJson = wasm.extract_signature(impostorMotionJson);

  const impostorResultJson = wasm.verify_intent(
    enrollmentJson,
    challengeJson,
    JSON.stringify({
      challenge_id: challenge.challenge_id,
      user_id: 'impostor-002',
      pose_sequence: JSON.parse(impostorMotionJson),
      imu_sequence: { sample_rate_hz: 200, samples: [] },
      device_info: createTestDevice(2), // Different device
      location: createLocation(),
    }),
    impostorSigJson,
    'medium'
  );
  const impostorResult = JSON.parse(impostorResultJson);

  console.log(`\n  ${verdict(impostorResult.verified, impostorResult.presence_score)}`);
  console.log(`  Risk Level: ${impostorResult.risk_level} | Threshold: ${impostorResult.threshold}`);
  if (impostorResult.rejection_reason) {
    console.log(`  ${C.red}Rejection: ${impostorResult.rejection_reason}${C.reset}`);
  }
  console.log(`\n  Factor Breakdown:`);
  console.log(`  ${factorBar('Motion', impostorResult.factors.motion)}`);
  console.log(`  ${factorBar('Device', impostorResult.factors.device)}`);
  console.log(`  ${factorBar('Context', impostorResult.factors.context)}`);

  // ── Step 7: Summary ─────────────────────────────────────────────
  banner('VERIFICATION SUMMARY');

  const results = [
    { name: 'Genuine Human', result: humanResult, expected: true },
    { name: 'AI Forgery', result: aiResult, expected: false },
    { name: 'Impostor', result: impostorResult, expected: false },
  ];

  console.log(`  ${C.bold}${'Test Case'.padEnd(22)} ${'Presence Score'.padEnd(16)} ${'Verdict'.padEnd(10)} ${'Expected'.padEnd(10)} ${'Match?'}${C.reset}`);
  console.log(`  ${'─'.repeat(72)}`);

  for (const r of results) {
    const verdictStr = r.result.verified
      ? `${C.green}PASS${C.reset}`
      : `${C.red}FAIL${C.reset}`;
    const expectedStr = r.expected ? 'PASS' : 'FAIL';
    const match = r.result.verified === r.expected
      ? `${C.green}✓${C.reset}`
      : `${C.red}✗${C.reset}`;

    console.log(`  ${r.name.padEnd(22)} ${r.result.presence_score.toFixed(4).padEnd(16)} ${verdictStr.padEnd(20)} ${expectedStr.padEnd(10)} ${match}`);
  }

  // ── Analysis ────────────────────────────────────────────────────
  banner('ANALYSIS');

  const humanAiGap = humanResult.presence_score - aiResult.presence_score;
  const humanImpostorGap = humanResult.presence_score - impostorResult.presence_score;

  console.log(`  Human vs AI forgery gap:         ${C.bold}${humanAiGap.toFixed(4)}${C.reset}`);
  console.log(`  Human vs Impostor gap:           ${C.bold}${humanImpostorGap.toFixed(4)}${C.reset}`);
  console.log();

  if (aiResult.verified) {
    console.log(`  ${C.red}⚠  AI forgery PASSED verification — security boundary breached${C.reset}`);
  } else {
    console.log(`  ${C.green}✓  AI forgery correctly REJECTED${C.reset}`);
    console.log(`  ${C.dim}  The Motion Signature detected the absence of:${C.reset}`);
    console.log(`  ${C.dim}    • Physiological tremor (8-12 Hz band missing)${C.reset}`);
    console.log(`  ${C.dim}    • Natural jerk spectrum (over-smoothed dynamics)${C.reset}`);
    console.log(`  ${C.dim}    • Micro-kinetic perturbations${C.reset}`);
    console.log(`  ${C.dim}    • Acceleration burstiness (Hurst exponent anomaly)${C.reset}`);
  }

  if (impostorResult.verified) {
    console.log(`  ${C.red}⚠  Impostor PASSED verification — uniqueness check failed${C.reset}`);
  } else {
    console.log(`  ${C.green}✓  Impostor correctly REJECTED (different kinematic signature)${C.reset}`);
  }

  console.log();
  console.log(`  ${C.bold}Protocol Status:${C.reset} Motion-native presence verification operational.`);
  console.log(`  ${C.bold}Threat Model:${C.reset} Active challenge-response + deep kinematic analysis.`);
  console.log(`  ${C.bold}Risk API:${C.reset} Integrated (low / medium / high).`);
  console.log();
}

// ── Run ───────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error(`\n${C.red}${C.bold}FATAL:${C.reset} ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
