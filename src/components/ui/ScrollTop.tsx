"use client";

import { useState, useEffect } from "react";

export default function ScrollTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-[9999] w-9 h-9 flex items-center justify-center border border-cyan-400/20 bg-black/60 hover:border-cyan-400/50 hover:bg-black/80 transition-all duration-500 group"
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
      aria-label="Scroll to top"
    >
      <span className="text-cyan-400/40 group-hover:text-cyan-300/80 text-[14px] transition-colors duration-500 leading-none">↑</span>
    </button>
  );
}
