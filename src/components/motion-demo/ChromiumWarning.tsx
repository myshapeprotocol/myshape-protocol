"use client";

/** Warning banner for Chromium-based browsers that may have WebGL webcam issues. */
export default function ChromiumWarning() {
  return (
    <div className="px-4 py-3 border border-amber-400/30 bg-amber-400/[0.06] text-center max-w-sm motion-demo__chromium-warning">
      <p className="text-amber-300/80 text-[11px] leading-relaxed">
        Green screen or no camera? Chromium browsers (Chrome/Edge) often have WebGL webcam issues.
      </p>
      <p className="text-white/50 text-[10px] mt-1.5">
        <span className="text-[#90c8ff]">Firefox</span> is recommended — it works reliably with MediaPipe.
      </p>
      <p className="text-white/20 text-[8px] mt-1">
        On Chrome, try <span className="text-white/30">chrome://flags/#use-angle → OpenGL → Relaunch</span>
      </p>
    </div>
  );
}
