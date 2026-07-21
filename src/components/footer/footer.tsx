"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "./footer.css";

export default function ProtocolFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("IDLE");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 600);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("SENDING");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok && !data.alreadySubscribed) throw new Error(data.error || "SUBSCRIBE_FAILED");
      setStatus("SUCCESS");
      setEmail("");
      setTimeout(() => setStatus("IDLE"), 3000);
    } catch {
      setStatus("ERROR");
      setTimeout(() => setStatus("IDLE"), 3000);
    }
  };

  // 注意：這裡的所有鏈接必須使用 href 鍵名
  const navGroups = [
    {
      title: "PROTOCOL",
      links: [
        { name: "OVERVIEW", href: "/protocol" },
        { name: "VERIFY", href: "/verify" },
        { name: "EVIDENCE", href: "/evidence" },
        { name: "PLAYGROUND", href: "https://thecontinuitylab.org/lab/playground" },
        { name: "NPM_SDK", href: "https://www.npmjs.com/package/@thecontinuitylab/myshape" }
      ]
    },
    {
      title: "BUILD",
      links: [
        { name: "DEVELOPERS", href: "/developers" },
        { name: "MOTION_DEMO", href: "/motion-demo" },
        { name: "GITHUB", href: "https://github.com/myshapeprotocol" },
        { name: "THE_CONTINUITY_LAB", href: "https://thecontinuitylab.org" }
      ]
    },
    {
      title: "RESEARCH",
      links: [
        { name: "RESEARCH_HUB", href: "/research" },
        { name: "CPS-0001", href: "/research/notes/008-continuity-protocol-core" },
        { name: "RESEARCH_AGENDA", href: "/research/agenda" },
        { name: "WHITEPAPER", href: "/whitepaper" },
        { name: "BLOG", href: "/blog" }
      ]
    },
    {
      title: "SYS_COMPANY",
      links: [
        { name: "VISION", href: "/vision" },
        { name: "ROADMAP", href: "/roadmap" },
        { name: "CONTACT", href: "/contact" },
        { name: "NEWSLETTER", href: "/newsletter" }
      ]
    },
    { 
      title: "CONNECT_NODES", 
      links: [
		{ name: "X_PROTOCOL", href: "https://x.com/myshapeprotocol" },
		{ name: "LINKED_IN", href: "https://www.linkedin.com/company/111557251/" },
			{ name: "GITHUB / PROTOCOL_SPECS", href: "https://github.com/myshapeprotocol" },
		{ name: "DISCORD", href: "https://discord.gg/zr8Tczard" },
      ]
    }
  ];

  return (
    <footer className="relative z-10 w-full bg-transparent font-mono pt-20 md:pt-32 pb-12 md:pb-20">
      {/* 导航链接组 */}
      <div className="max-w-6xl mx-auto px-4 md:px-10 grid grid-cols-2 md:grid-cols-5 gap-y-8 md:gap-y-16 gap-x-2 md:gap-x-6">
        {navGroups.map((group) => (
          <div key={group.title} className={`flex justify-start md:justify-center ${group.title !== "CONNECT_NODES" ? "hidden md:flex" : ""}`}>
            <div className="flex flex-col items-start min-w-[160px]">
              <div className="mb-8 group cursor-default">
                <h4 className="text-white text-[12px] font-bold tracking-[0.2em] mb-2 uppercase group-hover:text-[#90c8ff] transition-colors">
                  {group.title}
                </h4>
                <div className="w-4 h-[1px] bg-[#90c8ff]/50 group-hover:w-10 transition-all duration-700 ease-in-out shadow-[0_0_8px_#90c8ff]" />
              </div>

              {group.links.map((link) => {
                // 防禦性處理：如果 href 不存在，跳退到 "#" 避免報錯
                const safeHref = link.href || "#";
                const isExternal = safeHref.startsWith('http');
                const linkClass = "text-white/45 text-[11px] mb-4 hover:text-[#90c8ff] hover:translate-x-1 transition-all duration-300 tracking-[0.12em] uppercase block";
                
                return (
                  <span key={link.name} onMouseEnter={() => playTick(500, "sine", 0.10, 0.025)}>
                    {isExternal ? (
                      <a href={safeHref} target="_blank" rel="noopener noreferrer" className={linkClass}>{link.name}</a>
                    ) : (
                      <Link href={safeHref} className={linkClass}>{link.name}</Link>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 2. 狀態條 & 訂閱區 — desktop only */}
      <div className="hidden md:block max-w-6xl mx-auto px-4 md:px-10 border-t border-white/5 pt-6 md:pt-12 mt-12 md:mt-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#90c8ff] rounded-full animate-pulse shadow-[0_0_10px_#90c8ff]" />
              <span className="text-[#90c8ff]/70 text-[11px] tracking-[0.2em] uppercase font-mono font-bold">
                CPS-0001 v1.0-RC
              </span>
              <span className="text-white/15">|</span>
              <span className="text-white/40 text-[11px] tracking-[0.15em] uppercase font-mono">
                ENGINE-INDEPENDENT
              </span>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] text-white/45 tracking-[0.15em] leading-relaxed uppercase font-mono">
                CONTINUITY PROTOCOL LAYER
              </p>
              <p className="text-[11px] text-white/35 tracking-[0.15em] leading-relaxed uppercase font-mono">
                ENGINE-INDEPENDENT • CONTINUITY-VERIFIED
              </p>
              <p className="text-[11px] text-[#d4af37]/35 tracking-[0.15em] leading-relaxed uppercase font-mono mt-2">
                Research by <span className="text-[#d4af37]/50">The Continuity Lab</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end">
            <div className="flex items-center gap-2 mb-4">
               <span className="text-[11px] text-white/50 tracking-[0.2em] uppercase font-bold">
                {status === "SENDING" ? "⋯ TRANSMITTING" :
                 status === "SUCCESS" ? "✓ UPLINK_ESTABLISHED" :
                 status === "ERROR" ? "✗ TRANSMISSION_FAILED" :
                 "SIGNAL_SUBSCRIPTION"}
              </span>
            </div>
            <form onSubmit={handleSubscribe} className="relative w-full max-w-[320px] group">
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={status === "SENDING" ? "TRANSMITTING..." : `ENTER_EMAIL_ADDR${cursorVisible ? '█' : ' '}`}
                disabled={status !== "IDLE"}
                className="w-full bg-transparent border-b border-white/10 py-3 text-[11px] text-[#90c8ff]/70 placeholder:text-white/30 focus:outline-none focus:border-[#90c8ff]/50 transition-all tracking-[0.15em] uppercase font-mono"
                required
              />
              <button 
                type="submit"
                className="absolute right-0 bottom-3 text-[11px] font-normal text-[#90c8ff]/35 hover:text-[#90c8ff]/70 transition-all tracking-[0.15em]"
              >
                {status === "IDLE" && "[ CONNECT ]"}
                {status === "SENDING" && "[ ... ]"}
                {status === "SUCCESS" && "[ ✓ ]"}
                {status === "ERROR" && "[ ✗ ]"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-10 mt-3 md:mt-16 pt-3 md:pt-6 border-t border-white/5 text-center space-y-1">
        <div className="hidden md:flex items-center justify-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-[#90c8ff]/60 shadow-[0_0_4px_rgba(144,200,255,0.5)]" />
          <span className="text-[11px] text-white/35 tracking-[0.15em] uppercase font-mono">CPS-0001 v1.0-RC · 4 Engines · 192 Tests · 576 Runs</span>
        </div>
        <span className="text-[11px] text-white/40 tracking-[0.15em] uppercase font-mono block">
          &copy; {new Date().getFullYear()} MYSHAPE PROTOCOL
        </span>
      </div>
    </footer>
  );
}