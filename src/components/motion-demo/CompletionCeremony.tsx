"use client";
import { useState } from "react";
import ParticleBurst from "./ParticleBurst";
import CeremonySeal from "./CeremonySeal";

interface CompletionCeremonyProps {
  researchConsented: boolean;
  uploadState: "idle" | "uploading" | "success" | "error";
  genesisKey?: string | null;
  cohortFull?: boolean;
}

/** Full completion ceremony — particle burst + seal + genesis key reveal + confirmation text. */
export default function CompletionCeremony({
  researchConsented,
  uploadState,
  genesisKey,
  cohortFull,
}: CompletionCeremonyProps) {
  const [notifyState, setNotifyState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function subscribeForUpdates() {
    const email = sessionStorage.getItem("sovereign_email");
    if (!email) return;
    setNotifyState("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setNotifyState("done");
      } else {
        setNotifyState("error");
      }
    } catch {
      setNotifyState("error");
    }
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 gap-6 overflow-hidden">
      <ParticleBurst />
      {/* Halo scan ring — deepens when genesis key is present */}
      <div
        className="relative"
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: genesisKey
            ? "radial-gradient(circle, rgba(144,200,255,0.15) 0%, rgba(144,200,255,0.06) 40%, transparent 70%)"
            : "radial-gradient(circle, rgba(144,200,255,0.08) 0%, rgba(144,200,255,0.03) 40%, transparent 70%)",
          boxShadow: genesisKey
            ? "0 0 40px rgba(144,200,255,0.25), 0 0 80px rgba(144,200,255,0.1), inset 0 0 30px rgba(144,200,255,0.08)"
            : "0 0 20px rgba(144,200,255,0.1), 0 0 40px rgba(144,200,255,0.04)",
          animation: genesisKey ? "haloDeepen 2s ease-out infinite" : "haloPulse 3s ease-in-out infinite",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 4,
            borderRadius: "50%",
            border: genesisKey
              ? "2px solid rgba(144,200,255,0.4)"
              : "1px solid rgba(144,200,255,0.15)",
            animation: genesisKey ? "ringScan 1.5s linear infinite" : "ringScan 3s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 12,
            borderRadius: "50%",
            border: "1px solid rgba(144,200,255,0.08)",
            animation: "ringScan 4s linear infinite reverse",
          }}
        />
        <CeremonySeal />
      </div>

      <div className="text-center space-y-2 motion-demo__ceremony-text">
        <div
          className="text-[14px] font-light tracking-[0.2em] uppercase"
          style={{
            color: genesisKey
              ? "rgba(144,200,255,0.8)"
              : cohortFull
                ? "rgba(210,153,29,0.7)"
                : "rgba(217,179,60,0.6)",
          }}
        >
          {genesisKey
            ? "◈ Genesis Node Sealed"
            : cohortFull
              ? "◈ Genesis Phase Finalized"
              : "◈ Genesis Ritual Complete"}
        </div>

        {genesisKey ? (
          <>
            <p className="text-white/30 text-[11px] max-w-xs leading-relaxed">
              Your kinetic signature is now sealed into the sovereign identity layer.
            </p>
            <div
              className="mx-auto mt-3 px-4 py-2 font-mono text-[#90c8ff] text-[11px] tracking-[0.15em] select-all cursor-pointer"
              style={{
                background: "rgba(144,200,255,0.06)",
                border: "1px solid rgba(144,200,255,0.2)",
                borderRadius: 6,
                textShadow: "0 0 8px rgba(144,200,255,0.3)",
              }}
              title="Genesis Key — your sovereign identity proof"
            >
              Genesis Key: {genesisKey}
            </div>
            <p className="text-white/15 text-[11px] max-w-[240px] mx-auto leading-relaxed mt-1">
              This key is your proof of sovereign genesis. Store it. No one else holds it.
            </p>
            <button
              onClick={() => { window.location.href = "/genesis"; }}
              className="mt-3 px-8 py-2.5 border border-[#90c8ff]/40 text-[#90c8ff] text-[11px] tracking-[0.15em] uppercase hover:bg-[#90c8ff]/10 hover:border-[#90c8ff]/70 transition-all"
              style={{ textShadow: "0 0 6px rgba(144,200,255,0.2)" }}
            >
              ◈ Add to my Sovereign Identity
            </button>
          </>
        ) : cohortFull ? (
          <>
            <p className="text-white/30 text-[11px] max-w-xs leading-relaxed">
              The Genesis 100 cohort is now sealed. Your kinetic signature has been recorded
              as part of the protocol&apos;s next phase.
            </p>
            <div
              className="mx-auto mt-3 px-4 py-2 font-mono text-[#d2991d]/70 text-[11px] tracking-[0.15em]"
              style={{
                background: "rgba(210,153,29,0.06)",
                border: "1px solid rgba(210,153,29,0.2)",
                borderRadius: 6,
              }}
            >
              Protocol is now in Continuity Phase mode.
            </div>
            <p className="text-white/15 text-[11px] max-w-[260px] mx-auto leading-relaxed mt-1">
              Stay tuned for ZK-Identity updates. Your node remains active and sovereign.
            </p>
            <div className="flex flex-col items-center gap-2 mt-3">
              {/* Notify button — subscribe for ZK-Identity updates */}
              {notifyState === "done" ? (
                <div className="text-[#3fb950]/60 text-[11px] tracking-[0.1em]">
                  ✓ You&apos;ll be notified for ZK-Identity launch
                </div>
              ) : (
                <button
                  onClick={subscribeForUpdates}
                  disabled={notifyState === "loading"}
                  className="px-8 py-2.5 border border-[#d2991d]/30 text-[#d2991d]/70 text-[11px] tracking-[0.15em] uppercase hover:bg-[#d2991d]/10 hover:border-[#d2991d]/60 transition-all disabled:opacity-40"
                >
                  {notifyState === "loading" ? "Subscribing..." : "Get notified for ZK-Identity launch"}
                </button>
              )}
              {notifyState === "error" && (
                <button
                  onClick={subscribeForUpdates}
                  className="text-red-400/50 text-[11px] tracking-[0.1em] hover:text-red-400/80"
                >
                  ⚠ Failed — tap to retry
                </button>
              )}

              <a
                href="/dashboard"
                className="px-8 py-2.5 border border-[#d2991d]/20 text-[#d2991d]/50 text-[11px] tracking-[0.15em] uppercase hover:bg-[#d2991d]/10 hover:border-[#d2991d]/50 transition-all"
              >
                ◈ View my Node
              </a>
            </div>
          </>
        ) : (
          <p className="text-white/30 text-[11px] max-w-xs leading-relaxed">
            Your kinetic signature has been recorded.
          </p>
        )}

        {researchConsented && uploadState === "success" && (
          <p className="text-[#90c8ff]/30 text-[11px]">✓ Contributed to calibration engine</p>
        )}
        {researchConsented && uploadState === "error" && (
          <p className="text-red-400/40 text-[11px]">⚠ Research upload failed — data kept local</p>
        )}
      </div>

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes haloDeepen {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes haloPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes ringScan {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
