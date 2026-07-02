/**
 * Root Loading UI — global loading state during route transitions.
 * Next.js App Router: loading.tsx wraps all page.tsx Suspense boundaries.
 */
import "./loading.css";

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#02040a] gap-6">
      {/* Pulse indicator — brand-consistent Ice Blue glow */}
      <div
        className="w-1 h-1 rounded-full bg-[#90c8ff]"
        style={{
          boxShadow: "0 0 12px #90c8ff, 0 0 24px rgba(144, 200, 255, 0.5)",
          animation: "myshape-loading-pulse 1.2s ease-in-out infinite",
        }}
      />
      <span className="font-mono text-[9px] tracking-[0.6em] text-[#90c8ff]/40 uppercase">
        SYNCHRONIZING
      </span>
    </div>
  );
}
