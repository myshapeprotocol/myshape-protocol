// ============================================================
// MyShape Protocol SDK v1.0 (§8)
//
// Usage:
//   import MyShape from "@/sdk";
//   const receipt = MyShape.requestPresence(frames, timestamps);
//   const isValid = MyShape.verifyReceipt(receipt);
// ============================================================

export { generatePresenceProof, getEntropyScore, requestPresence } from "./presence";
export type { PresenceReceipt, GeneratePresenceOptions, PresenceProofResult } from "./presence";

export { verifyLocalProof, aggregateProofs, revokeDevice } from "./proof";
export type { AggregatedProof, RevocationReceipt } from "./proof";

export { verifyPresenceProof, verifyPresenceReceipt } from "./verification";

// ── Convenience: default export ──

import { generatePresenceProof, getEntropyScore, requestPresence } from "./presence";
import { verifyLocalProof, aggregateProofs, revokeDevice } from "./proof";
import { verifyPresenceProof, verifyPresenceReceipt } from "./verification";

const MyShapeSDK = {
  // Presence (§8.2)
  generatePresenceProof,
  getEntropyScore,
  requestPresence,
  // Proof (§8.3)
  verifyLocalProof,
  aggregateProofs,
  revokeDevice,
  // Verification (§8.4)
  verifyPresenceProof,
  verifyReceipt: verifyPresenceReceipt,
};

export default MyShapeSDK;
