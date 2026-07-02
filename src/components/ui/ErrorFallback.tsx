"use client";

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onReset?: () => void;
  resetLabel?: string;
}

/**
 * Protocol-branded error fallback UI.
 * Used by both error.tsx and global-error.tsx.
 */
export default function ErrorFallback({
  title = "SIGNAL_INTERRUPTED",
  message = "The protocol layer encountered an unexpected state.\nThis node can be re-initialized.",
  onReset,
  resetLabel = "REINITIALIZE_NODE",
}: ErrorFallbackProps) {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#02040a] gap-8 px-6">
      <div className="text-center">
        <div className="font-mono text-[10px] tracking-[0.5em] text-white/30 uppercase mb-4">
          {title}
        </div>
        <div className="font-mono text-[8px] tracking-[0.2em] text-[#90c8ff]/30 uppercase max-w-[400px] leading-relaxed whitespace-pre-line">
          {message}
        </div>
      </div>

      {onReset && (
        <button
          onClick={onReset}
          className="font-mono text-[9px] tracking-[0.3em] bg-transparent border border-[#90c8ff]/30 text-[#90c8ff] px-8 py-3 uppercase hover:bg-[#90c8ff]/10 hover:border-[#90c8ff] transition-all duration-400 cursor-pointer"
        >
          {resetLabel}
        </button>
      )}
    </div>
  );
}
