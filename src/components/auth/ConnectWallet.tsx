"use client";
import React, { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { playTick } from "@/utils/useAudioTick";

/* ═══════════════════════════════════════════════
   ConnectWallet — Base Mainnet 标准化
   - chainId 固定 8453 (Base)
   - 自动检测并切换至 Base
   - 不强制 MetaMask，兼容任何 EIP-1193 钱包
   - ?mock 调试模式跳过真实钱包
   ═══════════════════════════════════════════════ */

interface Props {
  onSuccess?: (data: { address: string; skip_otp: boolean; is_genesis: boolean; node_handle?: string | null }) => void;
  email?: string;
  className?: string;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, cb: (...args: unknown[]) => void) => void;
      removeListener: (event: string, cb: (...args: unknown[]) => void) => void;
      selectedAddress?: string;
      chainId?: string;
      isMetaMask?: boolean;
    };
  }
}

const SIWE_STATEMENT = "MyShape Protocol — Sovereign Identity Initialization";
const BASE_MAINNET = 8453;
const BASE_MAINNET_HEX = "0x2105";

function isMockMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("mock");
}

function mockAddress(): string {
  return "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

/** 检查当前链并切换到 Base（如需要） */
async function ensureBaseChain(): Promise<void> {
  if (!window.ethereum) return;

  try {
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" }) as string;
    const currentChain = parseInt(currentChainId, 16);

    if (currentChain !== BASE_MAINNET) {
      // 尝试切换到 Base
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BASE_MAINNET_HEX }],
        });
      } catch (switchError: unknown) {
        // 如果 Base 不在钱包网络中，尝试添加
        const err = switchError as { code?: number };
        if (err.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: BASE_MAINNET_HEX,
              chainName: "Base Mainnet",
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://mainnet.base.org"],
              blockExplorerUrls: ["https://basescan.org"],
            }],
          });
        } else {
          throw switchError;
        }
      }
    }
  } catch {
    // 静默失败——用户可能拒绝了切换，仍然允许继续
    console.warn("[ConnectWallet] Could not switch to Base. Proceeding on current chain.");
  }
}

export default function ConnectWallet({ onSuccess, email, className = "" }: Props) {
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "signing" | "verifying" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showConfirmed, setShowConfirmed] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  const [isMock] = useState(() => isMockMode());

  useEffect(() => {
    // 仅检测是否有 EIP-1193 钱包，不检测特定品牌
    setHasWallet(!!window.ethereum);
  }, []);

  /* ── 调试模拟 ── */
  const handleMockConnect = useCallback(async () => {
    setStatus("connecting");
    await new Promise(r => setTimeout(r, 600));
    const addr = mockAddress();
    setAddress(addr);

    setStatus("signing");
    await new Promise(r => setTimeout(r, 500));

    setStatus("verifying");
    const domain = window.location.host;
    const now = new Date().toISOString();
    const message = `${domain} wants you to sign in with your Ethereum account:\n${addr}\n\n${SIWE_STATEMENT}\n\nURI: https://${domain}\nVersion: 1\nChain ID: ${BASE_MAINNET}\nNonce: ${Date.now()}\nIssued At: ${now}`;
    const mockSig = "0x" + Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

    try {
      const res = await fetch("/api/auth/siwe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature: mockSig, address: addr, email: email || undefined }),
      });
      const data = await res.json();
      setStatus("done");
      setShowConfirmed(true);
      setTimeout(() => setShowConfirmed(false), 3000);
      onSuccess?.({ address: addr, skip_otp: data.skip_otp || true, is_genesis: data.is_genesis || false, node_handle: data.node_handle ?? null });
    } catch {
      setStatus("done");
      setShowConfirmed(true);
      setTimeout(() => setShowConfirmed(false), 3000);
      onSuccess?.({ address: addr, skip_otp: true, is_genesis: false, node_handle: null });
    }
  }, [email, onSuccess]);

  /* ── 真实连接 ── */
  const handleConnect = useCallback(async () => {
    if (isMock) { handleMockConnect(); return; }

    try {
      setStatus("connecting");
      setErrorMsg("");

      if (!window.ethereum) {
        setErrorMsg("No EIP-1193 wallet detected. Install any Web3 wallet (Rainbow, MetaMask, Coinbase Wallet, etc).");
        setStatus("error");
        return;
      }

      // 强制切换至 Base Mainnet
      await ensureBaseChain();

      // 请求账户
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts || accounts.length === 0) {
        setErrorMsg("No accounts authorized.");
        setStatus("error");
        return;
      }
      const addr = accounts[0];
      setAddress(addr);

      // 构造 SIWE 消息 — chainId 固定 8453
      setStatus("signing");
      const domain = window.location.host;
      const now = new Date().toISOString();
      const message = `${domain} wants you to sign in with your Ethereum account:\n${addr}\n\n${SIWE_STATEMENT}\n\nURI: https://${domain}\nVersion: 1\nChain ID: ${BASE_MAINNET}\nNonce: ${Date.now()}\nIssued At: ${now}`;

      const provider = new ethers.BrowserProvider(window.ethereum as unknown as ethers.Eip1193Provider);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // 验证签名
      setStatus("verifying");
      const res = await fetch("/api/auth/siwe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature, address: addr, email: email || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Signature verification failed");
        setStatus("error");
        return;
      }

      setStatus("done");
      setShowConfirmed(true);
      setTimeout(() => setShowConfirmed(false), 3000);
      onSuccess?.({ address: addr, skip_otp: data.skip_otp || false, is_genesis: data.is_genesis || false, node_handle: data.node_handle ?? null });
    } catch (err: unknown) {
      setErrorMsg((err as Error).message?.slice(0, 100) || "Connection failed");
      setStatus("error");
    }
  }, [email, onSuccess, isMock, handleMockConnect]);

  const handleDisconnect = () => {
    setAddress(null);
    setStatus("idle");
    setErrorMsg("");
  };

  return (
    <div className={className}>
      {status === "done" && address ? (
        <div className="flex flex-col items-center gap-2">
          {showConfirmed ? (
            <div className="flex flex-col items-center gap-1 animate-[fadeIn_0.4s_ease-out]">
              <div className="flex items-center gap-2 px-4 py-2 border border-cyan-400/40 bg-cyan-400/[0.06]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span className="text-cyan-300/80 font-mono text-[10px] tracking-[0.2em] uppercase">Identity Linked</span>
              </div>
              <span className="text-white/25 text-[8px] tracking-[0.15em] uppercase font-light italic">Geometry is now verified.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 border border-cyan-400/25 bg-cyan-400/[0.03]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 shadow-[0_0_4px_rgba(34,211,238,0.4)]" />
                <span className="text-cyan-300/50 font-mono text-[10px] tracking-[0.1em]">
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
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)] animate-pulse" />
              {status === "connecting" ? "CONNECTING..." : status === "signing" ? "SIGNING..." : "VERIFYING..."}
            </span>
          ) : (
            <span className="relative z-10 group-hover:text-white transition-all duration-500"
              style={{ textShadow: "0 0 8px rgba(144,200,255,0.2)" }}>
              {isMock ? "DEBUG_MOCK_WALLET" : hasWallet ? "CONNECT_WALLET" : "NO_WALLET_DETECTED"}
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
