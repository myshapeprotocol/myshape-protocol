/** @experimental ZK subsystem — under active research. Not production-grade. */
"use client";
import React from "react";
import { playTick } from "@/utils/useAudioTick";

interface ProofData {
  pesScore: number;
  timing: number;
  noise: number;
  freq: number;
  bio: number;
  zkpHash: string;
  popHash: string;
  mpHash: string;
  epHash: string;
  timestamp: number;
}

export default function PresenceSignature({ proof }: { proof: ProofData }) {
  const presenceId = proof.zkpHash.slice(0, 16);
  const now = new Date(proof.timestamp).toISOString();
  const pesPct = Math.round(proof.pesScore * 100);

  const handleDownload = () => {
    const data = `PRESENCE_PROOF\nProtocol: MyShape CPS-0001 v1.0-RC\nPresence_ID: ${presenceId}\nPES: ${pesPct}%\nTimestamp: ${now}\nZK_Hash: ${proof.zkpHash}\nPoP: ${proof.popHash}\nMP: ${proof.mpHash}\nEP: ${proof.epHash}\nDevice: Local Generation\nRaw Data: Zero Upload\n—————————————\nVerified by MyShape Protocol\nmyshape.com`;
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `presence-proof-${presenceId}.txt`; a.click();
    URL.revokeObjectURL(url);
    playTick(800, "sine", 0.10, 0.025);
  };

  const [shared, setShared] = React.useState(false);
  const handleShare = () => {
    playTick(700, "sine", 0.08, 0.02);
    const text = "MyShape PES: " + pesPct + "% | Verified by MyShape Protocol";
    navigator.clipboard.writeText(text).then(() => { setShared(true); setTimeout(() => setShared(false), 2000); });
  };

  return (
    <div className="border border-[#90c8ff]/20 bg-gradient-to-b from-[#90c8ff]/[0.04] to-transparent p-4 font-mono space-y-2.5"
      onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#90c8ff] shadow-[0_0_8px_rgba(144,200,255,0.8)] animate-pulse" />
          <span className="text-[#90c8ff]/90 text-[11px] tracking-[0.3em] uppercase font-bold">Presence Signature</span>
        </div>
        <span className="text-white/30 text-[11px] tracking-[0.15em]">CPS-0001 v1.0-RC</span>
      </div>

      {/* 核心数据 */}
      <div className="space-y-2">
        <div className="border-b border-white/[0.04] pb-1.5 flex justify-between items-center group hover:scale-[1.02] hover:bg-[#90c8ff]/[0.04] hover:border-[#90c8ff]/15 transition-all hover:text-white/80 duration-300 cursor-default rounded-sm px-1 -mx-1">
          <div className="text-white/50 text-[11px] tracking-[0.2em] group-hover:text-white/80 uppercase mb-1">Presence ID</div>
          <div className="text-[#90c8ff]/90 font-mono text-[11px] group-hover:text-[#90c8ff] tracking-[0.05em]">{presenceId}</div>
        </div>
        <div className="border-b border-white/[0.04] pb-1.5 flex justify-between items-center group hover:scale-[1.02] hover:bg-[#90c8ff]/[0.04] hover:border-[#90c8ff]/15 transition-all hover:text-white/80 duration-300 cursor-default rounded-sm px-1 -mx-1">
          <div className="text-white/50 text-[11px] tracking-[0.2em] group-hover:text-white/80 uppercase mb-1">Verified At</div>
          <div className="text-white/60 font-mono group-hover:text-white/90 text-[11px]">{now.slice(11, 19)} UTC</div>
        </div>
        <div className="border-b border-white/[0.04] pb-1.5 flex justify-between items-center group hover:scale-[1.02] hover:bg-[#90c8ff]/[0.04] hover:border-[#90c8ff]/15 transition-all hover:text-white/80 duration-300 cursor-default rounded-sm px-1 -mx-1">
          <div className="text-white/50 text-[11px] tracking-[0.2em] group-hover:text-white/80 uppercase mb-1">ZK Hash</div>
          <div className="text-white/50 font-mono text-[11px]">{proof.zkpHash.slice(0, 12)}</div>
        </div>
      </div>

      {/* 验证清单 */}
      <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-green-400/50">✓</span>
          <span className="text-white/50">Generated Locally — no cloud processing</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-green-400/50">✓</span>
          <span className="text-white/50">Zero-Knowledge Verified — proof without exposure</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-green-400/50">✓</span>
          <span className="text-white/50">Raw motion data never left your device</span>
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-1.5 pt-2">
        <button onClick={handleDownload}
          onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
          className="flex-1 py-2 border border-[#90c8ff]/25 text-[#90c8ff]/70 text-[11px] tracking-[0.2em] uppercase hover:scale-[1.02] hover:bg-[#90c8ff]/[0.04] hover:text-[#90c8ff] transition-all hover:text-white/80">
          Download Proof
        </button>
        <button onClick={handleShare}
          onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
          className="flex-1 py-2 border border-[#90c8ff]/15 text-white/40 text-[11px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/30 hover:text-white/60 transition-all hover:text-white/80">
          {shared ? "✓ Copied" : "Share Presence"}
        </button>
      </div>

      <p className="text-white/25 text-[11px] text-center tracking-[0.1em] uppercase">
        Powered by MyShape Protocol — myshape.com
      </p>
    </div>
  );
}
