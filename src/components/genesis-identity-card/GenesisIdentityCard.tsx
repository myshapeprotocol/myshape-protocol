"use client";
import { motion } from "framer-motion";

interface GenesisIdentityCardProps {
  email: string;
  nodeHandle?: string | null;
  positionNumber?: number;
  entropyScore?: number;
  particleLevel?: number;
  timestamp?: string;
}

export default function GenesisIdentityCard({
  email,
  nodeHandle,
  positionNumber,
  entropyScore = 0,
  particleLevel = 1,
  timestamp,
}: GenesisIdentityCardProps) {
  const timeStr = timestamp
    ? new Date(timestamp).toISOString().replace("T", " ").slice(0, 19)
    : new Date().toISOString().replace("T", " ").slice(0, 19);

  const particleLabel =
    particleLevel < 4 ? "DATA_OUTLINE"
    : particleLevel < 6 ? "CORE_ACTIVE"
    : particleLevel < 8 ? "FIELD_SOVEREIGN"
    : "PROTOCOL_ELDER";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.7, ease: [0, 0.6, 0.3, 1] }}
      className="relative w-full max-w-md"
    >
      {/* Outer glow */}
      <div className="absolute -inset-[1px] rounded-sm genesis-card-glow" />

      <div
        className="relative px-6 py-4 md:px-8 md:py-5 text-center"
        style={{
          border: "1px solid rgba(144,200,255,0.2)",
          background: "rgba(4,14,28,0.92)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* ── Position Number — Hero ── */}
        {positionNumber && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6, ease: [0, 0.7, 0.2, 1] }}
            className="mb-1"
          >
            <span
              className="font-mono font-light tracking-tight"
              style={{
                fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
                color: "rgba(200,230,255,0.9)",
                textShadow: "0 0 40px rgba(144,200,255,0.5), 0 0 80px rgba(144,200,255,0.2)",
                lineHeight: 1,
              }}
            >
              {String(positionNumber).padStart(3, "0")}
            </span>
            <div className="text-white/20 font-mono text-[10px] tracking-[0.3em] uppercase mt-0.5">
              of 100
            </div>
          </motion.div>
        )}

        {/* ── Title ── */}
        <div
          className="font-mono tracking-[0.35em] uppercase mb-2"
          style={{
            fontSize: "clamp(0.7rem, 1.6vw, 0.85rem)",
            color: "rgba(180,220,255,0.8)",
            textShadow: "0 0 16px rgba(144,200,255,0.35)",
          }}
        >
          GENESIS_COHORT
        </div>

        <div className="w-20 h-[1px] mx-auto mb-3 bg-gradient-to-r from-transparent via-[#90c8ff]/50 to-transparent" />

        {/* ── Identity Stats — 2-column grid ── */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-left mb-3">
          <div>
            <div className="text-white/25 text-[10px] tracking-[0.15em] uppercase mb-0.5">
              NODE
            </div>
            <div className="text-white/70 font-mono text-[12px] tracking-[0.05em]">
              {nodeHandle || "UNASSIGNED"}
            </div>
          </div>
          <div>
            <div className="text-white/25 text-[10px] tracking-[0.15em] uppercase mb-0.5">
              PARTICLE
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#90c8ff]/70 text-[13px] tracking-[0.15em]">
                {"●".repeat(Math.min(particleLevel, 8))}
              </span>
              <span className="text-white/30 text-[10px] tracking-[0.1em]">
                Lv.{particleLevel}
              </span>
            </div>
          </div>
          <div>
            <div className="text-white/25 text-[10px] tracking-[0.15em] uppercase mb-0.5">
              ENTROPY
            </div>
            <div className="text-white/70 font-mono text-[12px]">
              {entropyScore.toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-white/25 text-[10px] tracking-[0.15em] uppercase mb-0.5">
              SIG
            </div>
            <div className="text-white/40 font-mono text-[10px] tracking-[0.05em]">
              {email ? email.slice(0, 3) + "···" + email.slice(-4) : "—"}
            </div>
          </div>
        </div>

        <div className="w-20 h-[1px] mx-auto mb-2 bg-gradient-to-r from-transparent via-[#90c8ff]/30 to-transparent" />

        {/* ── Status line ── */}
        <div className="text-white/20 font-mono text-[10px] tracking-[0.15em] mb-0.5">
          {particleLabel}
        </div>
        <div className="text-white/12 font-mono text-[9px] tracking-[0.1em]">
          {timeStr} UTC
        </div>

        {/* ── Declaration ── */}
        <div className="mt-2 pt-2 border-t border-white/[0.06]">
          <p className="text-white/25 text-[10px] leading-relaxed max-w-xs mx-auto">
            Permanent founding entity. Cryptographically anchored.
            Never offered again.
          </p>
        </div>

        {/* Corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#90c8ff]/60 genesis-card-corner" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#90c8ff]/60 genesis-card-corner-tr" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#90c8ff]/60 genesis-card-corner-bl" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#90c8ff]/60 genesis-card-corner" />
      </div>
    </motion.div>
  );
}
