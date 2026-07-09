"use client";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import { getPrevNext } from "@/app/blog/posts";

export default function PostNavigation({ slug }: { slug: string }) {
  const { prev, next } = getPrevNext(slug);

  return (
    <nav className="mt-6 mb-4" aria-label="Post navigation">
      <div className="flex items-center justify-between gap-4">
        {prev ? (
          <Link
            href={prev.slug}
            className="group flex flex-col items-start gap-1 text-left min-w-0 flex-1 p-3 -ml-3 rounded transition-colors hover:bg-white/[0.01]"
            onMouseEnter={() => playTick(460, "sine", 0.035, 0.018)}
          >
            <span className="text-[#90c8ff]/38 text-[10px] tracking-[0.18em] uppercase group-hover:text-[#90c8ff]/55 transition-colors">
              ← Previous
            </span>
            <span className="text-white/50 text-[12px] tracking-[0.03em] leading-tight group-hover:text-white/65 transition-colors truncate max-w-full">
              {prev.title}
            </span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {next ? (
          <Link
            href={next.slug}
            className="group flex flex-col items-end gap-1 text-right min-w-0 flex-1 p-3 -mr-3 rounded transition-colors hover:bg-white/[0.01]"
            onMouseEnter={() => playTick(480, "sine", 0.035, 0.018)}
          >
            <span className="text-[#90c8ff]/38 text-[10px] tracking-[0.18em] uppercase group-hover:text-[#90c8ff]/55 transition-colors">
              Next →
            </span>
            <span className="text-white/50 text-[12px] tracking-[0.03em] leading-tight group-hover:text-white/65 transition-colors truncate max-w-full">
              {next.title}
            </span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </nav>
  );
}
