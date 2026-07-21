"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";

/* ═══════════════════════════════════════════════
   useWalletAuth — Shared SIWE wallet auth hook
   Used by both Header and ConnectWallet.
   Single source of truth for wallet connection flow.
   ═══════════════════════════════════════════════ */

const SIWE_STATEMENT = "MyShape Protocol — Sovereign Identity Initialization";
const BASE_MAINNET = 8453;
const BASE_MAINNET_HEX = "0x2105";

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

export type WalletStatus = "idle" | "connecting" | "signing" | "verifying" | "done" | "error";

export interface WalletConnectResult {
  address: string;
  skip_otp: boolean;
  is_genesis: boolean;
  node_handle: string | null;
  email: string | null;
  status: string;
}

export interface WalletAuthState {
  address: string | null;
  status: WalletStatus;
  error: string;
  connect: (opts?: { email?: string }) => Promise<WalletConnectResult | null>;
  disconnect: () => void;
}

function isMockMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("mock");
}

function mockAddress(): string {
  return "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

async function ensureBaseChain(): Promise<void> {
  if (!window.ethereum) return;
  try {
    const currentChainId = (await window.ethereum.request({ method: "eth_chainId" })) as string;
    if (parseInt(currentChainId, 16) !== BASE_MAINNET) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BASE_MAINNET_HEX }],
        });
      } catch (switchError: unknown) {
        const err = switchError as { code?: number };
        if (err.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: BASE_MAINNET_HEX,
                chainName: "Base Mainnet",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://mainnet.base.org"],
                blockExplorerUrls: ["https://basescan.org"],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    }
  } catch {
    console.warn("[useWalletAuth] Could not switch to Base. Proceeding on current chain.");
  }
}

export function useWalletAuth(): WalletAuthState {
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [error, setError] = useState("");

  // Restore from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("wallet_address");
    if (saved) {
      setAddress(saved);
      setStatus("done");
    }
  }, []);

  const connect = useCallback(async (opts?: { email?: string }): Promise<WalletConnectResult | null> => {
    const isMock = isMockMode();
    try {
      setStatus("connecting");
      setError("");

      if (isMock) {
        await new Promise((r) => setTimeout(r, 600));
        setStatus("signing");
        await new Promise((r) => setTimeout(r, 500));
        const addr = mockAddress();

        setStatus("verifying");
        const domain = window.location.host;
        const now = new Date().toISOString();
        const message = `${domain} wants you to sign in with your Ethereum account:\n${addr}\n\n${SIWE_STATEMENT}\n\nURI: https://${domain}\nVersion: 1\nChain ID: ${BASE_MAINNET}\nNonce: ${Date.now()}\nIssued At: ${now}`;
        const mockSig = "0x" + Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

        let siweData: Record<string, unknown> = { skip_otp: true, is_genesis: false };
        try {
          const res = await fetch("/api/auth/siwe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, signature: mockSig, address: addr, email: opts?.email || undefined }),
          });
          siweData = await res.json();
        } catch { /* fallback to defaults */ }
        return finalizeConnection(addr, siweData, opts?.email);
      }

      if (!window.ethereum) {
        setError("No EIP-1193 wallet detected. Install any Web3 wallet.");
        setStatus("error");
        return null;
      }

      await ensureBaseChain();

      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts?.length) {
        setError("No accounts authorized.");
        setStatus("error");
        return null;
      }
      const addr = accounts[0];

      setStatus("signing");
      const domain = window.location.host;
      const now = new Date().toISOString();
      const message = `${domain} wants you to sign in:\n${addr}\n\n${SIWE_STATEMENT}\n\nURI: https://${domain}\nVersion: 1\nChain ID: ${BASE_MAINNET}\nNonce: ${Date.now()}\nIssued At: ${now}`;

      const provider = new ethers.BrowserProvider(window.ethereum as unknown as ethers.Eip1193Provider);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      setStatus("verifying");
      const res = await fetch("/api/auth/siwe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature, address: addr, email: opts?.email || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signature verification failed");
        setStatus("error");
        return null;
      }

      return finalizeConnection(addr, data, opts?.email);
    } catch (err: unknown) {
      setError((err as Error).message?.slice(0, 100) || "Connection failed");
      setStatus("error");
      return null;
    }
  }, []);

  const finalizeConnection = (addr: string, data: Record<string, unknown>, email?: string): WalletConnectResult => {
    setAddress(addr);
    setStatus("done");
    sessionStorage.setItem("wallet_address", addr);

    if (data.is_genesis) {
      sessionStorage.setItem("sovereign_enrolled", "1");
    }
    if (email && !sessionStorage.getItem("sovereign_email")) {
      sessionStorage.setItem("sovereign_email", email);
    }
    if (data.node_handle) {
      sessionStorage.setItem("sovereign_node_handle", data.node_handle as string);
    }
    if (data.status) {
      sessionStorage.setItem("sovereign_status", data.status as string);
    }
    window.dispatchEvent(new CustomEvent("wallet:connected"));

    return {
      address: addr,
      skip_otp: (data.skip_otp as boolean) || false,
      is_genesis: (data.is_genesis as boolean) || false,
      node_handle: (data.node_handle as string) ?? null,
      email: (data.email as string) ?? null,
      status: (data.status as string) || "ACTIVE",
    };
  };

  const disconnect = useCallback(() => {
    setAddress(null);
    setStatus("idle");
    setError("");
    sessionStorage.removeItem("wallet_address");
    window.dispatchEvent(new CustomEvent("wallet:disconnected"));
  }, []);

  return { address, status, error, connect, disconnect };
}
