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
    const data = `PRESENCE_PROOF\nProtocol: MyShape V1.0_GENESIS\nPresence_ID: ${presenceId}\nPES: ${pesPct}%\nTimestamp: ${now}\nZK_Hash: ${proof.zkpHash}\nPoP: ${proof.popHash}\nMP: ${proof.mpHash}\nEP: ${proof.epHash}\nDevice: Local Generation\nRaw Data: Zero Upload\n—————————————\nVerified by MyShape Protocol\nmyshape.com`;
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `presence-proof-${presenceId}.txt`; a.click();
    URL.revokeObjectURL(url);
    playTick(800, "sine", 0.10, 0.025);
  };

  const handleShare = () => {
    const text = `My Presence has been verified.\nPES: ${pesPct}% | Protocol: MyShape V1.0_GENESIS\nGenerated locally. Zero data uploaded. ZK-verified.\nmyshape.com/motion-demo`;
    if (navigator.share) {
      navigator.share({ title: "MyShape Presence Proof", text });
    } else {
      navigator.clipboard.writeText(text).then(() => playTick(700, "sine", 0.08, 0.02));
    }
  };

  return (
    <div className="border border-cyan-400/20 bg-gradient-to-b from-cyan-400/[0.04] to-transparent p-6 font-mono space-y-4"
      onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
          <span className="text-cyan-300/70 text-[10px] tracking-[0.3em] uppercase font-bold">Presence Signature</span>
        </div>
        <span className="text-white/10 text-[7px] tracking-[0.15em]">V1.0_GENESIS</span>
      </div>

      {/* 核心数据 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="border border-cyan-400/10 p-3">
          <div className="text-white/15 text-[7px] tracking-[0.2em] uppercase mb-1">Presence ID</div>
          <div className="text-cyan-300/60 font-mono text-[9px] tracking-[0.05em]">{presenceId}</div>
        </div>
        <div className="border border-cyan-400/10 p-3">
          <div className="text-white/15 text-[7px] tracking-[0.2em] uppercase mb-1">PES Score</div>
          <div className="text-cyan-300/70 font-mono text-[16px] font-light">{pesPct}%</div>
        </div>
        <div className="border border-cyan-400/10 p-3">
          <div className="text-white/15 text-[7px] tracking-[0.2em] uppercase mb-1">Verified At</div>
          <div className="text-white/40 font-mono text-[8px]">{now.slice(11, 19)} UTC</div>
        </div>
        <div className="border border-cyan-400/10 p-3">
          <div className="text-white/15 text-[7px] tracking-[0.2em] uppercase mb-1">ZK Hash</div>
          <div className="text-white/25 font-mono text-[7px]">{proof.zkpHash.slice(0, 12)}</div>
        </div>
      </div>

      {/* 验证清单 */}
      <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
        <div className="flex items-center gap-2 text-[8px]">
          <span className="text-green-400/50">✓</span>
          <span className="text-white/25">Generated Locally — no cloud processing</span>
        </div>
        <div className="flex items-center gap-2 text-[8px]">
          <span className="text-green-400/50">✓</span>
          <span className="text-white/25">Zero-Knowledge Verified — proof without exposure</span>
        </div>
        <div className="flex items-center gap-2 text-[8px]">
          <span className="text-green-400/50">✓</span>
          <span className="text-white/25">Raw motion data never left your device</span>
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-2 pt-2">
        <button onClick={handleDownload}
          onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
          className="flex-1 py-2 border border-cyan-400/25 text-cyan-300/50 text-[8px] tracking-[0.2em] uppercase hover:bg-cyan-400/[0.04] hover:text-cyan-200 transition-all">
          Download Proof
        </button>
        <button onClick={handleShare}
          onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
          className="flex-1 py-2 border border-cyan-400/15 text-white/20 text-[8px] tracking-[0.2em] uppercase hover:border-cyan-400/30 hover:text-white/40 transition-all">
          Share Presence
        </button>
      </div>

      <p className="text-white/[0.04] text-[6px] text-center tracking-[0.1em] uppercase">
        Powered by MyShape Protocol — myshape.com
      </p>
    </div>
  );
}
