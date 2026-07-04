"use client";
import React, { useState, useCallback, useEffect } from "react";
import { playTick } from "@/utils/useAudioTick";
import { useWalletAuth } from "@/hooks/useWalletAuth";

/* ═══════════════════════════════════════════════
   ConnectWallet — Base Mainnet 标准化
   - 使用共享 useWalletAuth hook（单一 SIWE 流程）
   - 不强制 MetaMask，兼容任何 EIP-1193 钱包
   - ?mock 调试模式跳过真实钱包
   ═══════════════════════════════════════════════ */

interface Props {
  onSuccess?: (data: { address: string; skip_otp: boolean; is_genesis: boolean; node_handle?: string | null }) => void;
  email?: string;
  className?: string;
}

export default function ConnectWallet({ onSuccess, email, className = "" }: Props) {
  const { address, status, error: errorMsg, connect, disconnect } = useWalletAuth();
  const [showConfirmed, setShowConfirmed] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    setHasWallet(!!window.ethereum);
  }, []);

  // Show confirmation flash when connection succeeds
  useEffect(() => {
    if (status === "done" && address) {
      setShowConfirmed(true);
      const t = setTimeout(() => setShowConfirmed(false), 3000);
      return () => clearTimeout(t);
    }
  }, [status, address]);

  const handleConnect = useCallback(async () => {
    const result = await connect(email ? { email } : undefined);
    if (result) {
      onSuccess?.({
        address: result.address,
        skip_otp: result.skip_otp,
        is_genesis: result.is_genesis,
        node_handle: result.node_handle,
      });
    }
  }, [connect, email, onSuccess]);

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <div className={className}>
      {status === "done" && address ? (
        <div className="flex flex-col items-center gap-2">
          {showConfirmed ? (
            <div className="flex flex-col items-center gap-1 animate-[fadeIn_0.4s_ease-out]">
              <div className="flex items-center gap-2 px-4 py-2 border border-[#90c8ff]/40 bg-[#90c8ff]/[0.06]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#90c8ff] shadow-[0_0_8px_rgba(144,200,255,0.8)]" />
                <span className="text-[#90c8ff]/80 font-mono text-[10px] tracking-[0.2em] uppercase">Identity Linked</span>
              </div>
              <span className="text-white/25 text-[8px] tracking-[0.15em] uppercase font-light italic">Geometry is now verified.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 border border-[#90c8ff]/25 bg-[#90c8ff]/[0.03]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#90c8ff]/60 shadow-[0_0_4px_rgba(144,200,255,0.4)]" />
                <span className="text-[#90c8ff]/50 font-mono text-[10px] tracking-[0.1em]">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="text-white/15 hover:text-white/30 text-[8px] tracking-[0.2em] uppercase transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleConnect}
          onMouseEnter={() => playTick(650, "sine", 0.07, 0.02)}
          disabled={status === "connecting" || status === "signing" || status === "verifying"}
          className="relative group px-5 py-2.5 transition-all duration-500 overflow-hidden font-mono text-[9px] tracking-[0.3em] uppercase"
          style={{
            border: status === "error" ? "1px solid rgba(248,113,113,0.3)" : "1px solid rgba(168,221,255,0.2)",
            background: "linear-gradient(180deg, rgba(168,200,240,0.04) 0%, rgba(144,180,220,0.01) 100%)",
            color: status === "error" ? "rgba(252,165,165,0.7)" : "rgba(160,210,240,0.65)",
            clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
          }}
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30 group-hover:opacity-60 transition-opacity" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"
            style={{ boxShadow: "0 0 30px rgba(144,200,255,0.2), inset 0 1px 0 rgba(168,200,240,0.08)" }} />
          {status === "connecting" || status === "signing" || status === "verifying" ? (
            <span className="relative z-10 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#90c8ff] shadow-[0_0_6px_rgba(144,200,255,0.6)] animate-pulse" />
              {status === "connecting" ? "CONNECTING..." : status === "signing" ? "SIGNING..." : "VERIFYING..."}
            </span>
          ) : (
            <span className="relative z-10 group-hover:text-white transition-all duration-500"
              style={{ textShadow: "0 0 8px rgba(144,200,255,0.2)" }}>
              {hasWallet ? "CONNECT_WALLET" : "NO_WALLET_DETECTED"}
            </span>
          )}
        </button>
      )}
      {errorMsg && (
        <p className="text-red-300/40 text-[8px] tracking-[0.15em] mt-1.5">{errorMsg}</p>
      )}
    </div>
  );
}
