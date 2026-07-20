"use client";

import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import "@/app/blog/blog.css";

export default function PostClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />
      <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 pt-28 pb-16">
        <article style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
          <div className="text-[10px] text-white/25 tracking-[0.3em] uppercase mb-6">July 20, 2026 · SDK Release</div>
          <h1 className="text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight text-white leading-[1.1] mb-4">Continuity Verification Becomes Programmable</h1>
          <p className="text-white/35 text-lg mb-12 leading-relaxed">
            The Continuity Lab releases @thecontinuitylab/myshape v0.1.2 — the first open SDK for programmable continuity verification.
          </p>

          <div className="prose prose-invert max-w-none space-y-8 text-white/50 text-[17px] leading-[1.85]">

            {/* Opening */}
            <p>The internet has protocols for identity, data, and value. It has never had a protocol for <strong className="text-white/70">continuity</strong> — the property that a digital subject is the same physically embodied entity across time.</p>
            <p>Today, that changes.</p>

            {/* Code block */}
            <pre className="!bg-[#0B1220] !border !border-[#1E293B] !p-5 !text-sm overflow-x-auto">
              <code>{`npm install @thecontinuitylab/myshape

import { verifyContinuity } from "@thecontinuitylab/myshape";

const result = await verifyContinuity({
  imuSamples: deviceMotionEvents,
  cameraSamples: videoMotionFrames,
});
// → { verdict, confidence, evidence }`}</code>
            </pre>

            <p><strong className="text-white/70">One function. Sensor data in → verification result out.</strong></p>

            {/* Why Now */}
            <h2 className="text-white/80 text-xl font-semibold mt-16 mb-4">Why Continuity Matters Now</h2>
            <p>AI systems can now generate identities, conversations, images, and actions at scale. The next trust problem is no longer <em>"is this information authentic?"</em> — it is <em>"is this entity continuous?"</em></p>
            <ul>
              <li><strong className="text-white/60">AI agents</strong> — was the agent at T₂ hijacked from the agent at T₁?</li>
              <li><strong className="text-white/60">Decentralized governance</strong> — is the entity voting now the same entity that voted before?</li>
              <li><strong className="text-white/60">Remote systems</strong> — is the operator the same entity throughout the session?</li>
            </ul>

            {/* What It Is */}
            <h2 className="text-white/80 text-xl font-semibold mt-16 mb-4">What This Is — and What It Is Not</h2>
            <p><code>verifyContinuity()</code> introduces a new verification primitive: <strong className="text-white/70">continuity verification.</strong> It answers a question no other API asks: <em>"Are you still the same entity, continuously, across time?"</em></p>

            <table className="w-full my-6 border-collapse text-sm">
              <thead><tr className="border-b border-white/10"><th className="text-left py-2 text-white/40">Traditional Identity</th><th className="text-left py-2 text-white/40">MyShape Continuity</th></tr></thead>
              <tbody>
                <tr className="border-b border-white/5"><td className="py-2">Who are you?</td><td className="py-2">Are you still the same entity?</td></tr>
                <tr className="border-b border-white/5"><td className="py-2">Identity verification</td><td className="py-2">Continuity verification</td></tr>
                <tr className="border-b border-white/5"><td className="py-2">Static credentials</td><td className="py-2">Temporal evidence chain</td></tr>
                <tr className="border-b border-white/5"><td className="py-2">Snapshot</td><td className="py-2">Trajectory</td></tr>
              </tbody>
            </table>

            {/* How It Works */}
            <h2 className="text-white/80 text-xl font-semibold mt-16 mb-4">How It Works</h2>
            <table className="w-full my-6 border-collapse text-sm">
              <thead><tr className="border-b border-white/10"><th className="text-left py-2 text-white/40">Layer</th><th className="text-left py-2 text-white/40">Engine</th><th className="text-left py-2 text-white/40">What It Checks</th></tr></thead>
              <tbody>
                <tr className="border-b border-white/5"><td className="py-2">Presence</td><td className="py-2">EE-001 · Presence Entropy</td><td className="py-2">Human-generated motion entropy in IMU data</td></tr>
                <tr className="border-b border-white/5"><td className="py-2">Events</td><td className="py-2">EE-002 · Motion Event Binding</td><td className="py-2">Jerk peak detection via dynamic MAD threshold</td></tr>
                <tr className="border-b border-white/5"><td className="py-2">Binding</td><td className="py-2">EE-002 · Cross-Modal</td><td className="py-2">Camera + IMU event matching ±500ms</td></tr>
                <tr className="border-b border-white/5"><td className="py-2">Continuity</td><td className="py-2">RFC-0002</td><td className="py-2">Hash-chained evidence receipts</td></tr>
              </tbody>
            </table>

            {/* Foundation */}
            <h2 className="text-white/80 text-xl font-semibold mt-16 mb-4">Built On</h2>
            <ul>
              <li><strong className="text-white/60">576 controlled experimental runs</strong> across 4 independent evidence engines</li>
              <li><strong className="text-white/60">2 open RFC specifications</strong> (Motion Signature Format, Continuity Proof Format)</li>
              <li><strong className="text-white/60">121 automated tests</strong> in the reference implementation</li>
              <li><strong className="text-white/60">MIT License</strong> — use it, build on it, challenge it</li>
            </ul>

            {/* Roadmap */}
            <h2 className="text-white/80 text-xl font-semibold mt-16 mb-4">What's Next</h2>
            <table className="w-full my-6 border-collapse text-sm">
              <thead><tr className="border-b border-white/10"><th className="text-left py-2 text-white/40">Milestone</th><th className="text-left py-2 text-white/40">Status</th></tr></thead>
              <tbody>
                <tr className="border-b border-white/5"><td className="py-2">verifyContinuity() SDK</td><td className="py-2 text-[#3fb950]">v0.1.2</td></tr>
                <tr className="border-b border-white/5"><td className="py-2">Challenge-response anti-spoof</td><td className="py-2 text-[#d29922]">v0.2.0 planned</td></tr>
                <tr className="border-b border-white/5"><td className="py-2">Cross-device continuity</td><td className="py-2 text-[#d29922]">Design phase</td></tr>
                <tr className="border-b border-white/5"><td className="py-2">External replication study</td><td className="py-2 text-[#64748B]">Planned</td></tr>
              </tbody>
            </table>

            {/* CTA */}
            <div className="mt-16 p-8 border border-[#1E293B] bg-[#0B1220] text-center">
              <p className="text-white/60 mb-4">This is not a finished product. It is an open protocol in active development.</p>
              <p className="text-white/40 text-sm">
                <strong className="text-white/60">Researchers</strong> — reproduce our experiments. Challenge our RFCs.<br/>
                <strong className="text-white/60">Engineers</strong> — build compatible verifiers. Submit issues.<br/>
                <strong className="text-white/60">Security practitioners</strong> — break it. <strong className="text-[#f85149]">We publish failures.</strong>
              </p>
            </div>

            <div className="mt-16 pt-8 border-t border-white/[0.04] text-center">
              <Link href="/blog" className="text-white/35 text-[10px] tracking-[0.2em] uppercase hover:text-white/55 transition-colors">← Blog</Link>
            </div>
          </div>
        </article>
      </div>
      <ProtocolFooter />
    </div>
  );
}
