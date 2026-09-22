// ═══════════════════════════════════════════════════════════════════
// Phase C — Consumer
//
// POSTs a CPS-0001 Continuity Receipt to the HTTP Verifier Plugin
// and returns the gateway's allow/deny decision.
//
// The gateway does NOT run MyShape engines. It only verifies the
// receipt. Any gateway can make the same decision with the same
// receipt.
// ═══════════════════════════════════════════════════════════════════

import type { ContinuityReceipt } from "@/lib/evidence/cps0001";

export interface ConsumerDecision {
  allowed: boolean;
  status: "VALID" | "INVALID";
  reason?: string;
  risk: number;
  receiptId: string;
  coverageMs: number;
  verifiedAt: string;
}

export interface ConsumeResult {
  decision: ConsumerDecision;
  curlCommand: string;
}

/**
 * Submit a receipt to the HTTP Verifier Plugin for a gateway decision.
 *
 * The gateway independently verifies V₁-V₆, computes a risk score,
 * and returns ALLOW (VALID + risk < 1.0) or DENY.
 *
 * This is a real API call — not a simulation. The verifier is
 * engine-independent and does not inspect evidence payload content.
 */
export async function consumeReceipt(
  receipt: ContinuityReceipt,
): Promise<ConsumeResult> {
  const receiptJson = JSON.stringify(receipt);
  const base64Receipt = btoa(receiptJson);

  const response = await fetch("/api/verify-receipt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: receiptJson,
  });

  const data = await response.json();

  const decision: ConsumerDecision = {
    allowed: data.status === "VALID",
    status: data.status,
    reason: data.reason,
    risk: data.risk ?? 1.0,
    receiptId: data.receiptId ?? receipt.receiptId,
    coverageMs: data.interval ?? receipt.interval.coverageMs,
    verifiedAt: data.verifiedAt ?? new Date().toISOString(),
  };

  const curlCommand = `curl -X POST \\
  https://myshape.org/api/verify-receipt \\
  -H "Content-Type: application/json" \\
  -d '${receiptJson.replace(/'/g, "'\\''")}'`;

  return { decision, curlCommand };
}
