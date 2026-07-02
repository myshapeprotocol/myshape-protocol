"use client";
import ParticleBurst from "./ParticleBurst";
import CeremonySeal from "./CeremonySeal";

interface CompletionCeremonyProps {
  researchConsented: boolean;
  uploadState: "idle" | "uploading" | "success" | "error";
}

/** Full completion ceremony — particle burst + seal + confirmation text. */
export default function CompletionCeremony({
  researchConsented,
  uploadState,
}: CompletionCeremonyProps) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 gap-6 overflow-hidden">
      <ParticleBurst />
      <CeremonySeal />
      <div className="text-center space-y-2 motion-demo__ceremony-text">
        <div className="text-amber-300/60 text-[14px] font-light tracking-[0.2em] uppercase">
          ◈ Genesis Ritual Complete
        </div>
        <p className="text-white/30 text-[11px] max-w-xs leading-relaxed">
          Your kinetic signature is now sealed into the sovereign identity layer.
        </p>
        {researchConsented && uploadState === "success" && (
          <p className="text-[#90c8ff]/30 text-[9px]">✓ Contributed to calibration engine</p>
        )}
        {researchConsented && uploadState === "error" && (
          <p className="text-red-400/40 text-[9px]">⚠ Research upload failed — data kept local</p>
        )}
      </div>
    </div>
  );
}
