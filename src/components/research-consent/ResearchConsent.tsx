"use client";

/**
 * ResearchConsent — Opt-in anonymous motion research contribution UI.
 *
 * Phase E-1: Real-world data collection for engine calibration.
 * Default: OFF. User must explicitly opt in.
 *
 * Privacy: landmarks only (SST-18 joint positions). No video, no face, no PII.
 */

import { useState, useCallback } from "react";
import type { LightingCondition } from "@/types/research";
import type { UploadState } from "@/hooks/useResearchUpload";

interface ResearchConsentProps {
  /** Whether user has consented to research upload */
  consented: boolean;
  /** Called when consent checkbox toggles */
  onConsentChange: (consented: boolean) => void;
  /** Selected lighting condition */
  lighting: LightingCondition;
  /** Called when lighting selection changes */
  onLightingChange: (lighting: LightingCondition) => void;
  /** Current upload state */
  uploadState: UploadState;
  /** Upload error message (if any) */
  uploadError: string | null;
  /** Session UUID (shown after successful upload) */
  sessionId?: string;
  /** Whether capture has started (disables consent change after start) */
  captureActive: boolean;
  /** Whether upload was triggered and completed */
  uploadDone: boolean;
}

const LIGHTING_OPTIONS: { value: LightingCondition; label: string; desc: string }[] = [
  { value: "indoor_day", label: "Indoor — Day", desc: "Natural light through windows" },
  { value: "indoor_night", label: "Indoor — Night", desc: "Artificial room lighting" },
  { value: "outdoor_day", label: "Outdoor — Day", desc: "Direct or overcast daylight" },
  { value: "outdoor_night", label: "Outdoor — Night", desc: "Streetlights or low ambient light" },
];

export default function ResearchConsent({
  consented,
  onConsentChange,
  lighting,
  onLightingChange,
  uploadState,
  uploadError,
  sessionId,
  captureActive,
  uploadDone,
}: ResearchConsentProps) {
  const [expanded, setExpanded] = useState(false);

  const handleCheckbox = useCallback(() => {
    if (captureActive) return; // lock during capture
    const next = !consented;
    onConsentChange(next);
    if (next) setExpanded(true);
  }, [consented, captureActive, onConsentChange]);

  return (
    <div className="border border-white/15 bg-black/30" style={{ borderRadius: 4 }}>
      {/* ── Consent Toggle Row ── */}
      <button
        type="button"
        onClick={handleCheckbox}
        disabled={captureActive}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ borderRadius: 4 }}
      >
        {/* Custom checkbox */}
        <div
          className="w-5 h-5 flex items-center justify-center border transition-all shrink-0"
          style={{
            borderRadius: 2,
            borderColor: consented ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.15)",
            background: consented ? "rgba(34,211,238,0.08)" : "transparent",
            boxShadow: consented ? "0 0 8px rgba(34,211,238,0.15)" : "none",
          }}
        >
          {consented && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path
                d="M1 4l2.5 2.5L9 1"
                stroke="rgba(34,211,238,0.9)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-white/80 text-[13px] tracking-[0.12em] font-mono">
            Contribute to Anonymous Research
          </span>
          <span className="text-white/40 text-[10px] tracking-[0.06em] ml-2 hidden sm:inline">
            Help calibrate the motion-signature engine
          </span>
        </div>

        {/* Expand/collapse indicator */}
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M1 1l4 4 4-4" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      </button>

      {/* ── Expanded Details ── */}
      {expanded && consented && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/15 pt-3">
          {/* Privacy notice */}
          <div className="flex items-start gap-2">
            <svg className="w-3 h-3 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="rgba(34,211,238,0.4)" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              <circle cx="12" cy="16" r="1" />
            </svg>
            <p className="text-white/25 text-[9px] leading-relaxed tracking-[0.04em]">
              Only joint-position data (18-point wireframe outline) is uploaded.
              No camera images, no face data, no personal identifiers.
              Your contribution helps calibrate the engine across diverse devices and environments.
            </p>
          </div>

          {/* Lighting selector */}
          <div className="space-y-2">
            <label className="text-white/25 text-[8px] tracking-[0.15em] uppercase font-mono">
              Lighting Environment
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {LIGHTING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={captureActive}
                  onClick={() => onLightingChange(opt.value)}
                  className="text-left px-2.5 py-2 border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    borderRadius: 3,
                    borderColor:
                      lighting === opt.value
                        ? "rgba(34,211,238,0.35)"
                        : "rgba(255,255,255,0.06)",
                    background:
                      lighting === opt.value
                        ? "rgba(34,211,238,0.04)"
                        : "transparent",
                  }}
                >
                  <div
                    className="text-[9px] tracking-[0.06em]"
                    style={{
                      color:
                        lighting === opt.value
                          ? "rgba(34,211,238,0.7)"
                          : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {opt.label}
                  </div>
                  <div className="text-white/15 text-[7px] tracking-[0.03em] mt-0.5">
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Upload status */}
          {uploadDone && (
            <div className="space-y-2">
              <div
                className="flex items-center gap-2 px-2.5 py-2 border transition-all"
                style={{
                  borderRadius: 3,
                  borderColor:
                    uploadState === "success"
                      ? "rgba(34,211,238,0.25)"
                      : uploadState === "error"
                      ? "rgba(239,68,68,0.25)"
                      : "rgba(250,204,21,0.2)",
                  background:
                    uploadState === "success"
                      ? "rgba(34,211,238,0.03)"
                      : uploadState === "error"
                      ? "rgba(239,68,68,0.03)"
                      : "rgba(250,204,21,0.02)",
                }}
              >
                {/* Status icon */}
                {uploadState === "uploading" && (
                  <div className="w-2.5 h-2.5 rounded-full border border-cyan-400/40 border-t-transparent animate-spin shrink-0" />
                )}
                {uploadState === "success" && (
                  <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 10 10" fill="none">
                    <circle cx="5" cy="5" r="4" stroke="rgba(34,211,238,0.6)" strokeWidth="1" />
                    <path d="M3 5l1.5 1.5L7 4" stroke="rgba(34,211,238,0.8)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {uploadState === "error" && (
                  <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 10 10" fill="none">
                    <circle cx="5" cy="5" r="4" stroke="rgba(239,68,68,0.6)" strokeWidth="1" />
                    <path d="M3.5 3.5l3 3M6.5 3.5l-3 3" stroke="rgba(239,68,68,0.8)" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                )}

                <span
                  className="text-[8px] tracking-[0.08em] font-mono"
                  style={{
                    color:
                      uploadState === "success"
                        ? "rgba(34,211,238,0.6)"
                        : uploadState === "error"
                        ? "rgba(239,68,68,0.6)"
                        : "rgba(250,204,21,0.6)",
                  }}
                >
                  {uploadState === "uploading" && "Uploading motion data..."}
                  {uploadState === "success" && "Research contribution recorded — thank you."}
                  {uploadState === "error" && (uploadError ?? "Upload failed — network error")}
                </span>
              </div>

              {/* Session reference (for transparency — user can reference if needed) */}
              {uploadState === "success" && sessionId && (
                <div className="text-white/10 text-[7px] tracking-[0.05em] font-mono px-1 truncate">
                  Ref: {sessionId.slice(0, 8)}...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
