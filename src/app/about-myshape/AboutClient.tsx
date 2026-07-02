"use client";
import React, { useEffect, useRef, useState } from 'react';
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import { playTick } from "@/utils/useAudioTick";
import "./AboutClient.css";

export default function About() {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const principlesRef = useRef<(HTMLDivElement | null)[]>([]);

  const organizationalPrinciples = [
    {
      label: "PRINCIPLE_01",
      title: "Sovereign Essence",
      content: "WE BELIEVE THAT IDENTITY IS AN INHERENT HUMAN RIGHT, NOT A GRANTED PRIVILEGE BY CENTRALIZED PLATFORMS. OUR ARCHITECTURE IS DESIGNED TO PROTECT THIS ESSENCE AT ALL COSTS."
    },
    {
      label: "PRINCIPLE_02",
      title: "Algorithmic Integrity",
      content: "EVERY LINE OF CODE IN THE MOTION-PIPELINE IS AUDITABLE AND DETERMINISTIC. WE REPLACE HUMAN INTERMEDIARIES WITH MATHEMATICAL CERTAINTY."
    },
    {
      label: "PRINCIPLE_03",
      title: "Civilizational Scale",
      content: "MYSHAPE IS NOT A PRODUCT; IT IS A UTILITY FOR THE NEXT PHASE OF HUMAN CIVILIZATION. WE BUILD FOR THE CENTURY, NOT THE QUARTER."
    }
  ];

  // IntersectionObserver — 解密动效
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-idx'));
            if (!isNaN(idx)) {
              setVisibleCards(prev => new Set(prev).add(idx));
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3, rootMargin: "0px 0px -40px 0px" }
    );

    principlesRef.current.forEach((el, i) => {
      if (el) { el.setAttribute('data-idx', String(i)); observer.observe(el); }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <ProtocolLayout
      refId="009"
      category="SYS_COMP"
      title="ABOUT_MYSHAPE"
      secLevel="CLASS_GAMMA"
      systemStatus="INTERNAL_REC"
    >
      <div className="space-y-32">
        {/* --- 1. 深层叙事 --- */}
        <section className="max-w-4xl">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4 flex items-center gap-4">
            <span className="w-12 h-[1px] bg-[#90c8ff]/30" />
            ORGANIZATION_ETHOS
          </h2>
          <div className="space-y-8">
            <p className="text-xl md:text-3xl font-extralight tracking-widest text-white leading-tight uppercase">
              RECLAIMING THE <span className="text-[#90c8ff]">HUMAN GEOMETRY</span> FROM THE SILICON VOID.
            </p>
            <p className="text-white/60 text-base md:text-lg tracking-[0.2em] leading-relaxed font-light">
              MyShape was founded in 2025 with a singular obsession: to solve the identity crisis of the AI era.
              As artificial intelligence begins to dominate the digital landscape, the distinction between
              authentic human presence and synthetic simulation becomes the most critical problem of our time.
            </p>
            <p className="text-white/40 text-sm tracking-[0.15em] leading-loose font-light italic">
              "We observed that while the world was busy digitizing faces and fingerprints—vulnerable,
              static data—the true signature of life remained untapped: the unique, irreducible rhythm of
              human movement."
            </p>
          </div>
        </section>

        {/* --- 2. 核心原则 — 滚动解密动效 --- */}
        <section className="space-y-12">
          <h3 className="text-white/20 text-[9px] tracking-[0.6em] uppercase text-center">
            // CORE_VALUES_CONSTITUTION
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {organizationalPrinciples.map((principle, i) => {
              const isVisible = visibleCards.has(i);
              return (
                <div
                  key={principle.label}
                  ref={el => { principlesRef.current[i] = el; }}
                  onMouseEnter={() => playTick(600, "sine", 0.08, 0.015)}
                  className={`decrypt-card p-8 border transition-all duration-700 group relative overflow-hidden ${isVisible ? "visible" : ""}`}
                  style={{ transitionDelay: `${i * 0.2}s` }}
                >
                  {/* 解密扫描线 */}
                  <div className="decrypt-scan absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#90c8ff]/60 to-transparent pointer-events-none" />

                  <div className="decrypt-content relative z-10">
                    <div className="text-[#90c8ff]/70 text-[9px] tracking-[0.4em] font-mono mb-6 group-hover:text-[#90c8ff] transition-colors">
                      {principle.label}
                    </div>
                    <h4 className="text-white/70 text-[11px] tracking-[0.2em] uppercase mb-6 group-hover:text-white/90 transition-colors">
                      {principle.title}
                    </h4>
                    <p className="text-white/30 text-[10px] tracking-widest leading-relaxed uppercase group-hover:text-white/50 transition-colors">
                      {principle.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* --- 3. THE_LABORATORY — 强化冷色调粒子感 --- */}
        <section
          className="relative group"
          onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}
        >
          {/* 外围粒子辉光 */}
          <div className="absolute -inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none about-lab-glow" />
          {/* 冷色调粒子点阵 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => {
              // Deterministic pseudo-random from index — avoids SSR hydration mismatch
              const seed = (i * 2654435761) & 0xFFFFFFFF;
              const rand1 = ((seed * 1103515245 + 12345) & 0x7FFFFFFF) / 0x7FFFFFFF;
              const rand2 = ((rand1 * 1103515245 + 12345) & 0x7FFFFFFF) / 0x7FFFFFFF;
              const rand3 = ((rand2 * 1103515245 + 12345) & 0x7FFFFFFF) / 0x7FFFFFFF;
              const rand4 = ((rand3 * 1103515245 + 12345) & 0x7FFFFFFF) / 0x7FFFFFFF;
              return (
                <div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-[#90c8ff]/30"
                  style={{
                    left: `${10 + rand1 * 80}%`,
                    top: `${rand2 * 100}%`,
                    animation: `particleDrift ${2 + rand3 * 3}s ease-out infinite`,
                    animationDelay: `${rand4 * 2}s`,
                  }}
                />
              );
            })}
          </div>

          <div className="absolute inset-0 border scale-[1.02] group-hover:scale-100 transition-transform duration-700 about-lab-border" />

          <div className="p-12 border relative z-10 transition-all duration-500 about-lab-panel">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                <h3 className="text-white/80 text-sm tracking-[0.5em] uppercase font-bold">
                  THE_LABORATORY
                </h3>
                <p className="text-white/40 text-xs tracking-widest leading-loose uppercase">
                  OPERATING FROM DECENTRALIZED NODES ACROSS THE GLOBE, OUR TEAM CONSISTS OF CRYPTOGRAPHERS,
                  COMPUTER VISION ENGINEERS, AND SOCIOLOGISTS. WE ARE ANONYMOUS BY DESIGN, SOVEREIGN BY CHOICE,
                  AND DRIVEN BY THE NECESSITY OF THE PROTOCOL.
                </p>
              </div>

              <div className="w-px h-24 bg-gradient-to-b from-transparent via-[#90c8ff]/20 to-transparent hidden md:block" />

              <div className="flex flex-col gap-4 text-right min-w-[220px]">
                {/* LOCATION: [ENCRYPTED] — 强化视觉权重 */}
                <div className="relative">
                  <div className="absolute inset-0 bg-[#90c8ff]/5 blur-md rounded" />
                  <span className="relative text-[#90c8ff]/80 text-[12px] tracking-[0.5em] font-bold italic about-location-text">
                    LOCATION: [ENCRYPTED]
                  </span>
                </div>
                <span className="text-white/20 text-[8px] tracking-[0.2em]">EST. TIMESTAMP: 2024.09.12</span>
                {/* 频谱条 — 更冷的色调 */}
                <div className="flex justify-end gap-1">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-sm transition-all duration-700 group-hover:shadow-[0_0_6px_rgba(144,200,255,0.4)]"
                      style={{
                        height: `${8 + Math.sin(i * 0.8) * 6 + 6}px`,
                        background: `rgba(144,200,255,${0.15 + i * 0.06})`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ProtocolLayout>
  );
}
