// ═══════════════════════════════════════════════════════════════════
// CPS-0001 Express Middleware
//
// Drop-in continuity verification for any Express/Node.js app.
//
// Usage:
//   import { continuityMiddleware } from "continuity-protocol/verifier-plugin/middleware";
//   app.use("/api/sensitive", continuityMiddleware());
//
// The middleware:
//   1. Reads X-Continuity-Receipt header
//   2. Parses + verifies the receipt (V₁ V₃ V₄ V₅ V₆)
//   3. Computes risk score → X-Continuity-Risk response header
//   4. Allows or denies the request
//
// Zero MyShape dependencies. Engine-independent.
// ═══════════════════════════════════════════════════════════════════

import type { Request, Response, NextFunction } from "express";
import { verifyHeader, computeRiskScore, parseReceiptHeader, CONTINUITY_HEADER, CONTINUITY_RISK_HEADER } from "./index";
import type { ContinuityReceipt } from "../reference-verifier/verifier";

export interface MiddlewareOptions {
  /** Maximum acceptable risk score 0–1. Requests above this are denied. Default: 0.5 */
  maxRisk?: number;
  /** If true, add receipt to req for downstream handlers. Default: true */
  attachReceipt?: boolean;
  /** Custom denial handler */
  onDeny?: (req: Request, res: Response, reason: string, statusCode: number) => void;
}

// Extend Express Request to carry the verified receipt
declare global {
  namespace Express {
    interface Request {
      continuityReceipt?: ContinuityReceipt;
      continuityRisk?: number;
    }
  }
}

/**
 * Express middleware that verifies X-Continuity-Receipt on incoming requests.
 *
 * On success: attaches receipt + risk score to req, passes through.
 * On failure: returns 400/401/403 with JSON error.
 */
export function continuityMiddleware(opts: MiddlewareOptions = {}) {
  const { maxRisk = 0.5, attachReceipt = true } = opts;

  return async (req: Request, res: Response, next: NextFunction) => {
    const headerValue = req.headers[CONTINUITY_HEADER.toLowerCase()] as string | undefined;

    const decision = await verifyHeader(headerValue);

    // Set risk header on every response
    res.setHeader(CONTINUITY_RISK_HEADER, String(decision.riskScore));

    if (!decision.allow) {
      if (opts.onDeny) {
        opts.onDeny(req, res, decision.reason, decision.statusCode);
        return;
      }
      res.status(decision.statusCode).json({
        error: "continuity_verification_failed",
        reason: decision.reason,
        verification: decision.verification,
      });
      return;
    }

    // Parse receipt for downstream handlers
    if (attachReceipt && headerValue) {
      const receipt = parseReceiptHeader(headerValue);
      if (receipt) {
        req.continuityReceipt = receipt;
        req.continuityRisk = computeRiskScore(receipt);

        // Also check risk score
        if (req.continuityRisk !== undefined && req.continuityRisk > maxRisk) {
          res.status(403).json({
            error: "continuity_risk_too_high",
            risk: req.continuityRisk,
            maxRisk,
          });
          return;
        }
      }
    }

    next();
  };
}
