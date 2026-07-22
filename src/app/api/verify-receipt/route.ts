import { NextResponse } from "next/server";
import { verifyReceipt, type ContinuityReceipt } from "@/../continuity-protocol/reference-verifier/verifier";

/**
 * POST /api/verify-receipt
 *
 * Continuity Verification API endpoint.
 * Accepts a CPS-0001 Continuity Receipt as JSON body.
 * Returns V₁-V₆ verification result + risk score.
 *
 * Engine-independent. No MyShape SDK required on the client side.
 * The verifier does not inspect evidence payload content.
 *
 * Request:
 *   POST /api/verify-receipt
 *   Content-Type: application/json
 *   Body: ContinuityReceipt (CPS-0001 JSON)
 *
 * Response 200:
 *   { "status": "VALID", "risk": 0.05 }
 *
 * Response 4xx:
 *   { "status": "INVALID", "reason": "EXPIRED", "detail": "...", "risk": 1.0 }
 */
export async function POST(req: Request) {
  try {
    const receipt = await req.json() as ContinuityReceipt;

    const result = await verifyReceipt(receipt);

    if (result.status === "VALID") {
      return NextResponse.json({
        status: "VALID",
        risk: computeRisk(receipt),
        receiptId: receipt.receiptId,
        subject: receipt.subject.id,
        interval: receipt.interval.coverageMs,
        verifiedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      status: "INVALID",
      reason: result.reason,
      detail: result.detail,
      risk: 1.0,
      verifiedAt: new Date().toISOString(),
    }, { status: result.reason === "EXPIRED" || result.reason === "EVIDENCE_TAMPERED" ? 403 : 400 });
  } catch {
    return NextResponse.json({
      status: "INVALID",
      reason: "INVALID_SCHEMA",
      detail: "Failed to parse receipt. Ensure valid CPS-0001 JSON.",
      risk: 1.0,
    }, { status: 400 });
  }
}

function computeRisk(receipt: ContinuityReceipt): number {
  let risk = 0;
  if (receipt.interval.coverageMs < 3000) risk += 0.3;
  const conf = receipt.assertions.continuityMaintained.confidence;
  if (conf < 0.5) risk += 0.4;
  else if (conf < 0.7) risk += 0.2;
  if (receipt.interval.end) {
    const ageMs = Date.now() - new Date(receipt.interval.end).getTime();
    if (ageMs > 300_000) risk += 0.3;
    else if (ageMs > 60_000) risk += 0.1;
  }
  return Math.min(risk, 1.0);
}
