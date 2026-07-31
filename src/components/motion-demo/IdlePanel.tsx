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

export default function IdlePanel({
  isChromium, researchConsented, onConsentChange,
  lighting, onLightingChange, uploadState, uploadError, sessionId, uploadDone, onStartCapture,
}: IdlePanelProps) {
  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 12,
      background: "rgba(2,8,24,0.50)", zIndex: 10, overflowY: "auto", padding: "clamp(16px,3vw,24px)",
    }}>
      {isChromium && <ChromiumWarning />}
      <PrivacyBadge />

      <p style={{
        color: "rgba(255,255,255,0.35)", fontSize: "clamp(12px,1.2vw,14px)",
        letterSpacing: "0.08em", textAlign: "center", maxWidth: 420, lineHeight: 1.6,
      }}>
        Activate your camera to generate a real-time
        Presence Entropy Score from your motion geometry.
      </p>
      <p style={{
        color: "rgba(255,255,255,0.18)", fontSize: 11, letterSpacing: "0.06em",
        textAlign: "center", maxWidth: 320, marginTop: 2,
      }}>
        Face the camera. Stand naturally. No specific pose needed.
      </p>

      <div style={{ width: "100%", maxWidth: 360, marginTop: 4 }}>
        <ResearchConsent
          consented={researchConsented} onConsentChange={onConsentChange}
          lighting={lighting} onLightingChange={onLightingChange}
          uploadState={uploadState} uploadError={uploadError}
          sessionId={sessionId} captureActive={false} uploadDone={uploadDone}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 12 }}>
        {/* Start button — lab instrument style */}
        <button onClick={onStartCapture}
          onMouseEnter={(e) => { playTick(800, "sine", 0.1, 0.025); e.currentTarget.style.borderColor = "rgba(0,229,255,0.7)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(0,229,255,0.1)"; e.currentTarget.style.boxShadow = "0 0 32px rgba(0,229,255,0.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,229,255,0.35)"; e.currentTarget.style.color = "rgba(0,229,255,0.8)"; e.currentTarget.style.background = "rgba(0,229,255,0.03)"; e.currentTarget.style.boxShadow = "none"; }}
          style={{
            padding: "clamp(14px,2.5vw,20px) clamp(32px,5vw,48px)",
            border: "2px solid rgba(0,229,255,0.35)",
            color: "rgba(0,229,255,0.8)", fontSize: "clamp(12px,1.5vw,14px)",
            fontFamily: "var(--font-geist-mono), monospace",
            letterSpacing: "0.2em", textTransform: "uppercase",
            background: "rgba(0,229,255,0.03)", borderRadius: 8,
            cursor: "pointer", transition: "all 0.35s",
          }}
        >
          Activate Camera
        </button>
      </div>
    </div>
  );
}
