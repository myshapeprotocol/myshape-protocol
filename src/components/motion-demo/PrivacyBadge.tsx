"use client";

/** Privacy badge — reassures users all processing is local. */
export default function PrivacyBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border border-[#90c8ff]/20 bg-[#90c8ff]/[0.04] rounded-full">
      <svg className="w-3 h-3 text-[#90c8ff]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <circle cx="12" cy="16" r="1" />
      </svg>
      <span className="text-[#90c8ff]/60 text-[8px] tracking-[0.15em] uppercase">
        100% Local Processing — Nothing Uploaded
      </span>
    </div>
  );
}
