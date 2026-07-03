"use client";
import { useState, useEffect } from "react";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

export default function NewsletterClient() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"sending"|"success"|"error">("idle");
  const [cursorOn, setCursorOn] = useState(true);
  useEffect(() => { const t = setInterval(() => setCursorOn(v => !v), 600); return () => clearInterval(t); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }) });
      const data = await res.json();
      if (!res.ok && !data.alreadySubscribed) throw new Error(data.error || "FAILED");
      setStatus("success"); setEmail("");
      setTimeout(() => setStatus("idle"), 4000);
    } catch { setStatus("error"); setTimeout(() => setStatus("idle"), 3000); }
  };

  const FEATURES = ["Monthly protocol status reports", "New research paper alerts", "Motion-signature technical deep-dives", "Genesis Cohort milestones", "Agent Economy analysis", "Zero early-access spam. Pure signal."];

  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader />
      <main className="flex-1 relative">
        <BackgroundParticles />
        <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 text-center" style={{ paddingTop: "10rem", paddingBottom: "6rem" }}>
          <div className="space-y-4 mb-12">
            <div className="text-[#90c8ff]/40 text-[9px] tracking-[0.3em] uppercase">SIGNAL_SUBSCRIPTION</div>
            <h1 className="text-2xl md:text-3xl font-light tracking-[0.06em] text-white leading-tight">Protocol<br /><span className="text-[#90c8ff]">Newsletter</span></h1>
            <p className="text-white/30 text-[11px] tracking-[0.08em] leading-relaxed max-w-lg mx-auto">Technical deep-dives on sovereign identity, motion-signature verification, zero-knowledge presence, and the Agent Economy. No spam. Pure signal.</p>
          </div>
          <div className="mb-12">
            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={status === "sending" ? "TRANSMITTING..." : `ENTER_EMAIL_ADDR${cursorOn ? "█" : ""}`} disabled={status !== "idle"} className="w-full max-w-md bg-transparent border-b border-white/10 py-4 text-[12px] text-[#90c8ff]/60 placeholder:text-white/15 focus:outline-none focus:border-[#90c8ff]/50 transition-all tracking-[0.15em] uppercase font-mono text-center" required />
              <button type="submit" onMouseEnter={() => playTick(600, "sine", 0.08, 0.02)} className="px-10 py-3 border border-[#90c8ff]/25 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase hover:bg-[#90c8ff]/[0.05] hover:text-white hover:border-[#90c8ff]/50 transition-all">
                {status === "idle" && "[ SUBSCRIBE ]"}
                {status === "sending" && "[ ... ]"}
                {status === "success" && "[ ✓ UPLINK ESTABLISHED ]"}
                {status === "error" && "[ ✗ RETRY ]"}
              </button>
            </form>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg mx-auto mb-16">
            {FEATURES.map((f, i) => (
              <div key={i} className="p-3 border border-white/[0.04] text-white/20 text-[9px] tracking-[0.08em] text-left"><span className="text-[#90c8ff]/30 mr-2">◈</span>{f}</div>
            ))}
          </div>
          <div className="text-white/15 text-[9px] tracking-[0.1em]">
            <Link href="/blog" className="hover:text-white/30 transition-colors">← Protocol Log</Link>
            <span className="mx-3">|</span>
            <Link href="/" className="hover:text-white/30 transition-colors">Home →</Link>
          </div>
        </div>
      </main>
      <ProtocolFooter />
    </div>
  );
}
