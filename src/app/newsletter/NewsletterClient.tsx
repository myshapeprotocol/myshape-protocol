"use client";
import { useState, useEffect } from "react";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "./newsletter.css";

const FEATURES = [
  "Monthly protocol research reports",
  "New research paper alerts",
  "Motion-signature technical deep-dives",
  "Proof of Continuity milestones",
  "Agent Economy analysis",
  "Opt-in only. Unsubscribe any time. Pure signal.",
];

export default function NewsletterClient() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "already" | "notSignal" | "error">("idle");
  const [cursorOn, setCursorOn] = useState(true);
  useEffect(() => { const t = setInterval(() => setCursorOn((v) => !v), 600); return () => clearInterval(t); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "FAILED");
      // P1-C6: three distinct outcomes. Only a new contact or an existing
      // Research Signal contact counts as a Signal subscription. An existing
      // protocol identity (alreadySubscribed === false) is NOT subscribed, and
      // no Signal record was written for it.
      const next =
        data.alreadySubscribed === true ? "already"
          : data.alreadySubscribed === false ? "notSignal"
            : "success";
      setStatus(next); setEmail("");
      setTimeout(() => setStatus("idle"), 4000);
    } catch { setStatus("error"); setTimeout(() => setStatus("idle"), 3000); }
  };

  const btnClass = [
    "nl-submit-btn",
    status === "success" || status === "already" ? "nl-submit-btn-success" : "",
    status === "error" ? "nl-submit-btn-error" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="bg-[#051025] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader />
      <main className="flex-1 relative">
        <BackgroundParticles />
        <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 text-center" style={{ paddingTop: "10rem", paddingBottom: "6rem" }}>
          <div className="space-y-4 mb-12">
            <div className="text-[#90c8ff]/40 text-[11px] tracking-[0.3em] uppercase">RESEARCH SIGNAL — OPT-IN CONTACT</div>
            <h1 className="text-2xl md:text-3xl font-light tracking-[0.06em] text-white leading-tight">Research<br /><span className="text-[#90c8ff]">Signal</span></h1>
            <p className="text-white/30 text-[11px] tracking-[0.08em] leading-relaxed max-w-lg mx-auto">Technical deep-dives on sovereign continuity, motion-signature verification, zero-knowledge presence, and the Agent Economy. No spam. Pure signal.</p>
            <p className="text-white/15 text-[10px] tracking-[0.08em] leading-relaxed max-w-lg mx-auto">An opt-in contact list for research updates. This is separate from protocol node registration, identity verification, and Genesis allocation.</p>
          </div>

          <div className="mb-12">
            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={status === "sending" ? "SUBSCRIBING..." : `ENTER_EMAIL_ADDR${cursorOn ? "█" : ""}`} disabled={status !== "idle"} className="nl-input" required />
              <button type="submit" onMouseEnter={() => playTick(600, "sine", 0.08, 0.02)} className={btnClass}>
                {status === "idle" && "[ SUBSCRIBE TO RESEARCH UPDATES ]"}
                {status === "sending" && "[ ... ]"}
                {status === "success" && "[ ✓ RESEARCH SIGNAL SUBSCRIBED ]"}
                {status === "already" && "[ ✓ ALREADY A RESEARCH SIGNAL CONTACT ]"}
                {status === "notSignal" && "[ — PROTOCOL RECORD — SIGNAL NOT ADDED ]"}
                {status === "error" && "[ ✗ RETRY ]"}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg mx-auto mb-16">
            {FEATURES.map((f, i) => (
              <div key={i} className="nl-feature-card" onMouseEnter={() => playTick(350, "sine", 0.03, 0.006)}>
                <span className="nl-feature-bullet">◈</span>{f}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3">
            <Link href="/blog" className="nl-footer-link">← Protocol Log</Link>
            <span className="text-white/10">|</span>
            <Link href="/" className="nl-footer-link">Home →</Link>
          </div>
        </div>
      </main>
      <ProtocolFooter />
    </div>
  );
}
