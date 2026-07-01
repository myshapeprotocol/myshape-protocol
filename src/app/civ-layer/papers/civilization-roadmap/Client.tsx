"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ProtocolFooter from "@/components/footer/footer";
import contentData from "./content.json";

interface Section { id: string; title: string; lines: string[]; }

const sections: { id: string; anchor: string; title: string }[] =
  (contentData as Section[]).map((s) => ({ id: s.id, anchor: "sec-" + s.id, title: s.title }));

const content: Record<string, string[]> = {};
(contentData as Section[]).forEach((s) => { content[s.id] = s.lines; });

export default function Client() {
  const [activeId, setActiveId] = useState(sections[0]?.anchor || "");
  const [tocShow, setTocShow] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => { for (const e of entries) { if (e.isIntersecting) setActiveId(e.target.id); } },
      { rootMargin: "-15% 0% -75% 0%", threshold: 0 }
    );
    document.querySelectorAll("section[id]").forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const check = () => { const f = document.querySelector("footer"); if (f) setTocShow(f.getBoundingClientRect().top > window.innerHeight * 0.5); };
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <BackgroundParticles />
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, rgba(144,200,255,0.4) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
      <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-black/80 backdrop-blur-md px-6 md:px-10 py-5 flex justify-between items-center text-[10px] tracking-[0.4em]">
        <Link href="/papers" className="text-[#90c8ff]/70 hover:text-[#90c8ff] transition-colors uppercase">← EXIT_PAPER</Link>
        <div className="text-white/20 uppercase font-bold tracking-[0.5em] hidden sm:block">PAPER_10 // V1.0</div>
      </nav>
      <main className="relative z-10 pt-48 md:pt-56 px-6 md:px-10 max-w-7xl mx-auto flex flex-col md:flex-row gap-24">
        <div className="md:w-64 shrink-0 hidden md:block" />
        <aside className="hidden md:block border-l border-white/5 pl-6" style={{
          position: "fixed", top: "128px", width: "256px",
          left: "calc((100vw - 1280px) / 2 + 40px)",
          opacity: tocShow ? 1 : 0, pointerEvents: tocShow ? "auto" : "none",
          transition: "opacity 0.3s", zIndex: 10,
        }}>
          <div className="text-[10px] text-[#90c8ff]/40 mb-10 tracking-[0.4em] uppercase font-bold">PAPER_INDEX</div>
          <ul className="space-y-6">
            {sections.map((s) => {
              const isActive = s.anchor === activeId;
              return (<li key={s.id} className="group cursor-pointer"><a href={"#" + s.anchor} className="block"><div className={`text-[10px] font-bold mb-1 transition-colors duration-300 ${isActive ? "text-[#90c8ff]" : "text-white/10 group-hover:text-[#90c8ff]"}`}>{s.id}</div><div className={`text-[12px] uppercase tracking-[0.2em] transition-all duration-300 ${isActive ? "text-[#90c8ff]" : "text-white/20 group-hover:text-[#90c8ff]"}`}>{s.title}</div></a></li>);
            })}
          </ul>
        </aside>
        <div className="flex-1 space-y-32 pb-48">
          <div className="space-y-6">
            <div className="text-[#90c8ff]/60 text-[10px] tracking-[0.5em] uppercase">PAPER_10 — CIVILIZATION_CORE</div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white uppercase cursor-default transition-all duration-700 hover:text-[#4fd1ed] hover:drop-shadow-[0_0_25px_rgba(79,209,237,0.8)]">Civilization Roadmap</h1>
            <div className="flex items-center gap-4 text-white/30 text-[9px] tracking-[0.3em]"><span>REV_V1.0</span><span className="text-white/10">|</span><span>FOUR EPOCHS OF IDENTITY EVOLUTION</span></div>
          </div>
          {sections.map((s) => (
            <section key={s.id} id={s.anchor} className="group max-w-[750px] scroll-mt-32">
              {content[s.id]?.map((para, i) => {
                const isMajorHeader = /^\d+\.\s+[A-Z]/.test(para);
                const isSubHeader = /^\d+\.\d+\s+[A-Z]/.test(para);
                if (isMajorHeader) return (<div key={i} className="flex items-center gap-6 mb-12 mt-4"><span className="text-[#90c8ff]/50 text-[10px] tracking-[0.6em] font-bold group-hover:text-[#90c8ff] transition-colors duration-700">{para}</span><div className="h-[1px] flex-1 bg-white/10 group-hover:bg-[#90c8ff]/30 transition-colors duration-700" /></div>);
                if (isSubHeader) return (<h3 key={i} className="text-[#90c8ff]/60 text-[11px] tracking-[0.3em] font-bold uppercase mt-8 mb-3">{para}</h3>);
                return (<p key={i} className="text-white/50 text-[18px] leading-[1.85] font-light text-justify tracking-normal opacity-80 group-hover:opacity-100 transition-all duration-700 mb-3">{para}</p>);
              })}
            </section>
          ))}
          <div className="mt-40 border-t border-white/5 pt-24"><ProtocolFooter /></div>
        </div>
      </main>
    </div>
  );
}
