"use client";

import type { ConsumeResult } from "../lib/consume-receipt";

interface Props {
  result: ConsumeResult;
}

export default function ConsumerDecision({ result }: Props) {
  const { decision, curlCommand } = result;

  return (
    <div className="space-y-3">
      {/* Gateway identity */}
      <div className="flex items-center gap-2 text-[11px] text-white/20">
        <span className="px-1.5 py-0.5 border border-white/10 text-[10px]">Gateway</span>
        <span className="text-white/30">HTTP Verifier · CPS-0001 v1.0</span>
      </div>

      {/* Decision */}
      <div className={`p-4 border-2 text-center space-y-2 ${
        decision.allowed
          ? "border-[#3fb950]/40 bg-[#3fb950]/[0.04]"
          : decision.status === "INVALID"
            ? "border-[#f85149]/40 bg-[#f85149]/[0.04]"
            : "border-[#d29922]/40 bg-[#d29922]/[0.04]"
      }`}>
        <div className="text-white/20 text-[10px] tracking-[0.2em] uppercase">
          Authorization Decision
        </div>
        <div className={`text-[36px] font-light tracking-[0.08em] ${
          decision.allowed ? "text-[#3fb950]" : "text-[#f85149]"
        }`}>
          {decision.allowed ? "ALLOW" : "DENY"}
        </div>
        {!decision.allowed && decision.reason && (
          <div className="text-[11px] text-[#f85149]/70 font-mono">
            {decision.reason}
          </div>
        )}
        <div className="text-[11px] text-white/30">
          Risk score: <span className={`font-mono ${decision.risk < 0.3 ? "text-[#3fb950]" : decision.risk < 0.7 ? "text-[#d29922]" : "text-[#f85149]"}`}>
            {(decision.risk * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* How it works */}
      <div className="text-[11px] text-white/20 leading-relaxed px-1">
        This gateway does <span className="text-white/40">not</span> run MyShape engines.
        It only verifies the receipt. Any gateway can make the same decision
        with the same receipt.
      </div>

      {/* Curl command */}
      <details className="group">
        <summary className="text-[11px] text-white/20 cursor-pointer hover:text-white/35 transition-colors">
          <span className="text-[10px]">$</span> curl — reproduce this decision
        </summary>
        <pre className="mt-2 p-3 border border-white/5 bg-black/50 text-[10px] text-white/30 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
          {curlCommand}
        </pre>
        <button
          onClick={() => navigator.clipboard.writeText(curlCommand)}
          className="mt-1 text-[10px] text-white/20 hover:text-white/40 transition-colors"
        >
          📋 Copy curl command
        </button>
      </details>
    </div>
  );
}
