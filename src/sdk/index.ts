// ============================================================
// MyShape Protocol SDK v2
//
// Three-function public API:
//   import MyShape from "@/sdk";
//
//   const result  = MyShape.verify(frames, timestamps);
//   const receipt = MyShape.getReceipt(result);
//   const status  = MyShape.checkContinuity([receipt]);
//
// CPS-0001 ContinuityReceipt is the protocol object.
// Engine-independent. Zero-knowledge. Browser-native.
// ============================================================

export {
  verify,
  getReceipt,
  getEntropyScore,
  buildReceiptFromPES,
  verifyReceiptFn as verifyReceipt,
} from "../lib/continuity/presence-adapter";
export type {
  ContinuityResult,
  GenerateOptions,
  ContinuityReceipt,
  VerificationResult,
} from "../lib/continuity/presence-adapter";

export { checkContinuity } from "./continuity";
export type { ContinuityStatus, ContinuityTrend, ContinuityOptions } from "./continuity";

// ── Default export ──

import { verify, getReceipt, getEntropyScore, buildReceiptFromPES, verifyReceiptFn } from "../lib/continuity/presence-adapter";
import { checkContinuity } from "./continuity";

const MyShapeSDK = {
  verify,
  getReceipt,
  getEntropyScore,
  buildReceiptFromPES,
  verifyReceipt: verifyReceiptFn,
  checkContinuity,
};

export default MyShapeSDK;
