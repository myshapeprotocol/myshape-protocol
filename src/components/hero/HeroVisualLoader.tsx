"use client";

import dynamic from "next/dynamic";

const HeroVisual = dynamic(() => import("@/components/hero/HeroVisual"), { ssr: false });

export default function HeroVisualLoader({ showCore }: { showCore?: boolean }) {
  return <HeroVisual showCore={showCore} />;
}
