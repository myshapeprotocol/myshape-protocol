"use client";
import React from "react";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

const EVIDENCE = [
  { value: "CPS-0001", label: "Continuity Receipt Protocol", meta: "Ed25519 signatures · SHA-256 integrity · engine-independent" },
  { value: "281", label: "Open Benchmark Samples", meta: "4 evidence engines · Cohen's d = 2.1 · reproducible" },
  { value: "5/5", label: "External Verification", meta: "First clean-machine test passed · zero-config install" },
  { value: "SDK", label: "Developer SDK", meta: "One function call → generate a Continuity Receipt" },
];

export default function EvidenceStrip() {
  return (
    <section className="relative pt-16 md:pt-32 pb-12 md:pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-white/35 text-[11px] tracking-[0.6em] uppercase mb-4">
            Evidence
          </div>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 200,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: "#fff",
              margin: 0,
            }}
          >
            Not a whitepaper.{" "}
            <span style={{ color: "rgba(144, 200, 255, 0.8)" }}>Not a promise.</span>
          </h2>
          <p
            style={{
              fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
              fontWeight: 300,
              color: "rgba(255,255,255,0.7)",
              marginTop: "1.8rem",
              maxWidth: "550px",
              lineHeight: 1.7,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Built from open research. No black box.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
          {EVIDENCE.map((item) => (
            <div
              key={item.value}
              className="group p-6 transition-all duration-500"
              style={{
                border: "1px solid rgba(144,200,255,0.1)",
                borderRadius: "12px",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                playTick(600, "sine", 0.08, 0.02);
                e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)";
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="font-mono text-[11px] shrink-0"
                  style={{
                    color: "rgba(144,200,255,0.5)",
                    textShadow: "0 0 6px rgba(144,200,255,0.15)",
                  }}
                >
                  {item.value}
                </span>
              </div>
              <p className="text-white/55 text-[15px] font-light leading-relaxed mb-2 group-hover:text-white/80 transition-colors duration-500">
                {item.label}
              </p>
              <div
                className="inline-block px-2 py-0.5 font-mono text-[11px] tracking-[0.1em] rounded border border-[#90c8ff]/15 text-[#90c8ff]/40 bg-[#90c8ff]/[0.03] group-hover:border-[#90c8ff]/35 group-hover:text-[#90c8ff]/70 transition-all duration-500"
              >
                {item.meta}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="https://thecontinuitylab.org"
            className="inline-flex items-center gap-2 px-6 py-3 border text-[11px] tracking-[0.1em] uppercase transition-all"
            style={{
              borderColor: "rgba(144,200,255,0.15)",
              color: "rgba(144,200,255,0.4)",
              borderRadius: "4px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(144,200,255,0.4)";
              e.currentTarget.style.color = "rgba(144,200,255,0.8)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(144,200,255,0.15)";
              e.currentTarget.style.color = "rgba(144,200,255,0.4)";
            }}
          >
            All research, benchmarks, and protocols are public at The Continuity Lab →
          </Link>
        </div>
      </div>
    </section>
  );
}
