"use client";
import { useState } from "react";
import {
  verifySchema,
  verifySignature,
  verifyAssertions,
  verifyTemporal,
  verifyEvidenceIntegrity,
  verifyFreshness,
  buildReceipt,
  computePayloadDigest,
  signReceipt,
  type ContinuityReceipt,
} from "@/lib/evidence/cps0001";
import { generateKeyPair, createIssuerIdentity } from "@/lib/crypto";

// ── Types ──

type StepStatus = "pass" | "fail" | "skipped" | "error";

interface Step {
  id: string;
  label: string;
  detail: string;
  status: StepStatus;
  error?: string;
}

// ── Helpers ──

function buildSampleReceipt(): ContinuityReceipt {
  const kp = generateKeyPair();
  const issuer = createIssuerIdentity(kp);
  const payload = { score: 0.85, metric: "PES" };
  const digest = computePayloadDigest(payload);

  const now = new Date();
  const unsigned = buildReceipt({
    evidence: [{
      engineId: "EE-001",
      engineVersion: "1.0.0",
      confidence: 0.85,
      payload,
      payloadDigest: digest,
    }],
    interval: {
      start: new Date(now.getTime() - 8000).toISOString(),
      end: now.toISOString(),
      coverageMs: 8000,
    },
    subject: { id: "sample-subject", type: "embodied" },
    issuer,
  });

  return signReceipt(unsigned, kp.secretKey);
}

function runAllChecks(receipt: ContinuityReceipt): Step[] {
  const steps: Step[] = [];

  // V₁
  const v1 = verifySchema(receipt);
  steps.push({ id: "V₁", label: "Schema Validity", detail: "protocolVersion, receiptId, interval, subject, evidence, issuer, signature", status: v1 ? "fail" : "pass", error: v1 ?? undefined });

  // V₂
  const v2 = verifySignature(receipt);
  steps.push({ id: "V₂", label: "Signature (Ed25519)", detail: "Canonical signing payload verified against issuer public key", status: v2 ? "fail" : "pass", error: v2 ?? undefined });

  // V₃
  const v3 = verifyAssertions(receipt);
  steps.push({ id: "V₃", label: "Assertion Consistency", detail: "continuityMaintained → observationOccurred must be true", status: v3 ? "fail" : "pass", error: v3 ?? undefined });

  // V₄
  const v4 = verifyTemporal(receipt);
  steps.push({ id: "V₄", label: "Temporal Consistency", detail: "start < end, coverageMs match, signedAt ≥ end", status: v4 ? "fail" : "pass", error: v4 ?? undefined });

  // V₅
  const v5 = verifyEvidenceIntegrity(receipt);
  steps.push({ id: "V₅", label: "Evidence Integrity", detail: "SHA-256 of each payload matches payloadDigest", status: v5 ? "fail" : "pass", error: v5 ?? undefined });

  // V₆
  const v6 = verifyFreshness(receipt);
  steps.push({ id: "V₆", label: "Freshness", detail: "Current time < expiresAt", status: v6 ? "fail" : "pass", error: v6 ?? undefined });

  // V₇
  const genesis = !receipt.previousReceiptHash;
  steps.push({ id: "V₇", label: "Predecessor Chain", detail: genesis ? "Genesis receipt — no predecessor to verify" : "Chain link verification requires predecessor receipt", status: genesis ? "skipped" : "skipped" });

  return steps;
}

// ── Page ──

export default function VerifyReceiptPage() {
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [verdict, setVerdict] = useState<"VALID" | "INVALID" | "">("");
  const [error, setError] = useState("");
  const [receiptId, setReceiptId] = useState("");

  function handleVerify() {
    setError("");
    setSteps([]);
    setVerdict("");
    setReceiptId("");

    let receipt: ContinuityReceipt;
    try {
      receipt = JSON.parse(input) as ContinuityReceipt;
    } catch {
      setError("Invalid JSON — please paste a valid CPS-0001 ContinuityReceipt.");
      return;
    }

    if (!receipt.receiptId || !receipt.protocolVersion) {
      setError("Not a CPS-0001 ContinuityReceipt — missing receiptId or protocolVersion.");
      return;
    }

    setReceiptId(receipt.receiptId);

    try {
      const results = runAllChecks(receipt);
      setSteps(results);
      const failed = results.filter((s) => s.status === "fail");
      setVerdict(failed.length === 0 ? "VALID" : "INVALID");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed unexpectedly.");
    }
  }

  function handleLoadSample() {
    const receipt = buildSampleReceipt();
    setInput(JSON.stringify(receipt, null, 2));
    setError("");
    setSteps([]);
    setVerdict("");
  }

  function handleDemo() {
    const receipt = buildSampleReceipt();
    setInput(JSON.stringify(receipt, null, 2));

    if (!receipt.receiptId || !receipt.protocolVersion) {
      setError("Sample receipt generation failed.");
      return;
    }
    setReceiptId(receipt.receiptId);
    try {
      const results = runAllChecks(receipt);
      setSteps(results);
      const failed = results.filter((s) => s.status === "fail");
      setVerdict(failed.length === 0 ? "VALID" : "INVALID");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed unexpectedly.");
    }
  }

  const statusColor = (s: StepStatus) =>
    s === "pass" ? "#48bb78" : s === "fail" ? "#f56565" : s === "skipped" ? "#a0aec0" : "#f56565";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-mono">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-2xl tracking-[0.3em] uppercase text-[#90c8ff] mb-2">
            CPS-0001 Receipt Verification
          </h1>
          <p className="text-white/30 text-xs tracking-wider mb-4">
            Paste any CPS-0001 ContinuityReceipt to verify V₁–V₇
          </p>
          <button
            onClick={handleDemo}
            className="px-6 py-2.5 border-2 border-[#64ffb4]/50 text-[#64ffb4] text-xs tracking-[0.15em] uppercase font-bold hover:bg-[#64ffb4]/10 transition-all"
          >
            Try Demo — one click
          </button>
        </div>

        <div className="space-y-6">
          {/* Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-white/30 tracking-wider uppercase">Receipt JSON</span>
              <button
                onClick={handleLoadSample}
                className="text-xs text-[#90c8ff]/60 hover:text-[#90c8ff] transition-colors"
              >
                Load sample receipt →
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Paste CPS-0001 ContinuityReceipt JSON here…'
              className="w-full h-40 bg-[#0d0d14] border border-[#90c8ff]/20 text-white/70 text-xs p-4 resize-y font-mono focus:outline-none focus:border-[#90c8ff]/50"
              spellCheck={false}
            />
          </div>

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={!input.trim()}
            className="w-full py-3 border-2 border-[#90c8ff]/60 text-[#90c8ff] text-xs tracking-[0.2em] uppercase font-bold hover:bg-[#90c8ff]/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Verify Receipt
          </button>

          {/* Error */}
          {error && (
            <div className="border border-red-400/30 bg-red-400/[0.03] p-4 text-sm text-red-400">{error}</div>
          )}

          {/* Verdict banner */}
          {verdict && (
            <div
              className={`border p-4 text-center ${verdict === "VALID" ? "border-green-400/30 bg-green-400/[0.03]" : "border-red-400/30 bg-red-400/[0.03]"}`}
            >
              <div className={`text-lg tracking-[0.2em] uppercase font-bold ${verdict === "VALID" ? "text-green-400" : "text-red-400"}`}>
                {verdict}
              </div>
              {receiptId && (
                <div className="text-[10px] text-white/20 mt-1">Receipt: {receiptId}</div>
              )}
            </div>
          )}

          {/* Steps */}
          {steps.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-white/30 tracking-wider uppercase mb-3">Verification Steps</div>
              {steps.map((step) => (
                <div
                  key={step.id}
                  className="border border-white/[0.04] p-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0"
                    style={{ backgroundColor: statusColor(step.status) + "20", color: statusColor(step.status) }}
                  >
                    {step.status === "pass" ? "✓" : step.status === "fail" ? "✗" : "—"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-[10px] tracking-wider">{step.id}</span>
                      <span className="text-white/80 text-xs">{step.label}</span>
                    </div>
                    <div className="text-white/30 text-[10px] mt-0.5">{step.detail}</div>
                    {step.error && (
                      <div className="text-red-400/70 text-[10px] mt-1 font-mono">{step.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 text-center text-[10px] text-white/20 tracking-wider">
          MyShape Protocol · CPS-0001 v1.0 · Verification runs locally · Engine-independent
        </div>
      </div>
    </div>
  );
}
