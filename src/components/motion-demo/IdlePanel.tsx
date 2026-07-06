"use client";
import { playTick } from "@/utils/useAudioTick";
import ChromiumWarning from "./ChromiumWarning";
import PrivacyBadge from "./PrivacyBadge";
import ResearchConsent from "@/components/research-consent/ResearchConsent";
import type { LightingCondition } from "@/types/research";

interface IdlePanelProps {
  isChromium: boolean;
  researchConsented: boolean;
  onConsentChange: (v: boolean) => void;
  lighting: LightingCondition;
  onLightingChange: (v: LightingCondition) => void;
  uploadState: "idle" | "uploading" | "success" | "error";
  uploadError: string | null;
  sessionId: string;
  uploadDone: boolean;
  onStartCapture: () => void;
}

/** Idle state — camera activation UI with research consent. */
export default function IdlePanel({
  isChromium,
  researchConsented,
  onConsentChange,
  lighting,
  onLightingChange,
  uploadState,
  uploadError,
  sessionId,
  uploadDone,
  onStartCapture,
}: IdlePanelProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30 z-10 overflow-y-auto py-4">
      {isChromium && <ChromiumWarning />}
      <PrivacyBadge />
      <p className="text-white/30 text-[13px] tracking-[0.12em] text-center max-w-md leading-relaxed">
        Activate your camera to generate a real-time<br />
        Presence Entropy Score from your motion geometry.
      </p>
      <p className="text-white/20 text-[11px] tracking-[0.08em] text-center max-w-xs mt-1">
        Face the camera. Stand naturally.<br />No specific pose or movement needed.
      </p>
      <div className="w-full max-w-xs mt-2">
        <ResearchConsent
          consented={researchConsented}
          onConsentChange={onConsentChange}
          lighting={lighting}
          onLightingChange={onLightingChange}
          uploadState={uploadState}
          uploadError={uploadError}
          sessionId={sessionId}
          captureActive={false}
          uploadDone={uploadDone}
        />
      </div>
      <div className="flex flex-col items-center gap-3 mt-3">
        <button
          onClick={onStartCapture}
          onMouseEnter={() => playTick(800, "sine", 0.1, 0.025)}
          className="px-10 py-5 border border-[#90c8ff]/40 text-[#90c8ff]/80 text-[13px] tracking-[0.25em] uppercase hover:bg-[#90c8ff]/10 hover:text-white transition-all"
        >
          Activate_Camera
        </button>
      </div>
    </div>
  );
}
