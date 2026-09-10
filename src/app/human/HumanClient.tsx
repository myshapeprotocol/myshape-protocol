"use client";

import { useEffect } from "react";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import QRCodeSVG from "./QRCodeSVG";

const TRY_URL = "https://www.myshape.com/try";

export default function HumanClient() {
  useEffect(() => {
    // Lightweight mobile detection only — no motion/sensor capability checks.
    // Mobile users go directly to /try; desktop users see the bridge page.
    const userAgent = navigator.userAgent || navigator.vendor || "";
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
    if (isMobile) {
      window.location.href = "/try";
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#051025] text-[#f8feff]">
      <ProtocolHeader />
      <main className="flex items-center justify-center min-h-[calc(100vh-60px)] pt-[60px] px-4">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="text-[#90c8ff]/30 text-[11px] tracking-[0.5em] uppercase font-mono">
              Experience MyShape
            </div>
            <h1 className="text-3xl md:text-4xl font-light text-white tracking-tight">
              Human
            </h1>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm mx-auto">
              Full continuity verification requires a mobile device with motion
              sensors.
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg inline-block">
              <QRCodeSVG
                value={TRY_URL}
                size={180}
                bgColor="#ffffff"
                fgColor="#051025"
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3 text-[11px] tracking-[0.15em] text-white/30 font-mono uppercase">
            <div>Scan with your phone camera</div>
            <div className="text-white/20">or</div>
            <a
              href={TRY_URL}
              className="inline-block text-[#90c8ff]/50 hover:text-[#90c8ff] transition-colors border-b border-[#90c8ff]/20 hover:border-[#90c8ff]/50 pb-1"
            >
              Open on mobile browser →
            </a>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 max-w-xs mx-auto">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-white/20 text-[10px] tracking-[0.2em] uppercase">
              Explore
            </span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Alternative actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/motion-demo"
              className="px-6 py-3 border border-white/10 text-white/40 text-[11px] tracking-[0.15em] uppercase hover:bg-white/5 hover:text-white/60 transition-all font-mono"
            >
              Explore PES →
            </a>
            <a
              href="/continuity"
              className="px-6 py-3 border border-white/10 text-white/40 text-[11px] tracking-[0.15em] uppercase hover:bg-white/5 hover:text-white/60 transition-all font-mono"
            >
              Learn More →
            </a>
          </div>
        </div>
      </main>
      <ProtocolFooter />
    </div>
  );
}
