"use client";

import { useState } from "react";

const DOMAINS = ["Robotics", "XR / Spatial Computing", "Wearables", "Industrial IoT", "Autonomous Vehicles", "AI Agent / Multi-Agent", "Security / Zero Trust", "Medical / Healthcare", "Other"];
const ROLES = ["Engineer", "Researcher", "Architect", "Product", "Other"];
const FREQS = ["< 1 Hz", "1–10 Hz", "10–100 Hz", "> 100 Hz"];
const DURATIONS = ["< 1 min", "1–10 min", "10 min – 1 hr", "> 1 hr"];
const FLOW = ["Stays in one system", "Moves between systems", "Sometimes"];
const PROVENANCE = ["Full provenance preserved", "Some — timestamps + device ID", "Most source context is lost", "Never thought about it", "N/A — data doesn't cross systems"];
const PAIN = ["Frequently", "Occasionally", "Rarely", "Never"];
const SOLUTION = ["Built our own internal format", "Database / ledger / timestamp chain", "Trust transport layer (TLS/VPN)", "We don't prove it — we trust", "N/A"];
const STANDARD = ["Yes — and we looked for one", "Yes — but never looked", "Never thought about it", "Already use something that does this"];
const INTEREST = ["Yes, I'd read it", "Maybe", "No"];

function Select({ label, options, value, onChange, required }: { label: string; options: string[]; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div className="mb-4">
      <label className="block text-white/60 text-[12px] mb-1.5 tracking-[0.03em]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full bg-[#0B1220] border border-white/10 text-white/70 text-[12px] px-3 py-2.5 rounded outline-none focus:border-[#60A5FA]/50 transition-colors appearance-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2360A5FA'%3E%3Cpath d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: "32px" }}
      >
        <option value="">—</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-4">
      <label className="block text-white/60 text-[12px] mb-1.5 tracking-[0.03em]">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0B1220] border border-white/10 text-white/70 text-[12px] px-3 py-2.5 rounded outline-none focus:border-[#60A5FA]/50 transition-colors" />
    </div>
  );
}

export default function SurveyClient() {
  const [sent, setSent] = useState(false);
  const [domain, setDomain] = useState("");
  const [role, setRole] = useState("");
  const [otherDomain, setOtherDomain] = useState("");
  const [hasSensorData, setHasSensorData] = useState("");
  const [freq, setFreq] = useState("");
  const [duration, setDuration] = useState("");
  const [dataFlow, setDataFlow] = useState("");
  const [provenance, setProvenance] = useState("");
  const [pain, setPain] = useState("");
  const [solution, setSolution] = useState("");
  const [standard, setStandard] = useState("");
  const [interest, setInterest] = useState("");
  const [contact, setContact] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch("/api/research/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, role, otherDomain, hasSensorData, freq, duration, dataFlow, provenance, pain, solution, standard, interest, contact }),
      });
    } catch { /* ok — try Supabase, fail silently */ }
    setSent(true);
  }

  if (sent) {
    return (
      <div style={{ minHeight: "100dvh", background: "#060B14", color: "#E6EDF7", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 300, margin: "0 0 8px", color: "#60A5FA" }}>Thank you</h2>
          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.7 }}>
            Your response helps us understand whether this problem is real — or isn't.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#060B14", color: "#E6EDF7", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 24px 80px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 300, margin: "0 0 4px", color: "#fff" }}>Discovery Survey</h1>
        <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 32px", lineHeight: 1.7 }}>
          5-minute survey. Pure research. No sales pitch.<br />
          We're studying whether teams working with sensor data have encountered a specific pain point.
        </p>

        <form onSubmit={submit}>
          {/* Part 1 */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 13, fontWeight: 500, color: "#60A5FA", margin: "0 0 12px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Part 1 — Your Domain</h3>
            <Select label="1. What domain do you work in?" options={DOMAINS} value={domain} onChange={setDomain} required />
            {domain === "Other" && <TextInput label="Please specify" value={otherDomain} onChange={setOtherDomain} />}
            <Select label="2. Your role?" options={ROLES} value={role} onChange={setRole} />
          </div>

          {/* Part 2 */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 13, fontWeight: 500, color: "#60A5FA", margin: "0 0 12px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Part 2 — Your Data</h3>
            <Select label="3. Do you work with continuous sensor data?" options={["Yes, extensively", "Yes, occasionally", "No"]} value={hasSensorData} onChange={setHasSensorData} required />
            <Select label="4. How fast does data arrive?" options={FREQS} value={freq} onChange={setFreq} />
            <Select label="5. Typical session or task duration?" options={DURATIONS} value={duration} onChange={setDuration} />
          </div>

          {/* Part 3 */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 13, fontWeight: 500, color: "#60A5FA", margin: "0 0 12px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Part 3 — Data Flow</h3>
            <Select label="6. Does sensor data stay in one system or move?" options={FLOW} value={dataFlow} onChange={setDataFlow} />
            <Select label="7. When data moves, what happens to source information?" options={PROVENANCE} value={provenance} onChange={setProvenance} />
          </div>

          {/* Part 4 */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 13, fontWeight: 500, color: "#60A5FA", margin: "0 0 12px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Part 4 — The Pain Point</h3>
            <Select label="8. Have you needed to prove data at time A and B = same source?" options={PAIN} value={pain} onChange={setPain} required />
            <Select label="9. How do you prove it today?" options={SOLUTION} value={solution} onChange={setSolution} />
            <Select label='10. Ever wanted a standard way to package sensor evidence + time + integrity?' options={STANDARD} value={standard} onChange={setStandard} />
          </div>

          {/* Part 5 */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 13, fontWeight: 500, color: "#60A5FA", margin: "0 0 12px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Part 5 — Curiosity</h3>
            <Select label="11. Curious enough to read a one-page protocol spec?" options={INTEREST} value={interest} onChange={setInterest} />
            <TextInput label="12. Contact (optional) — Email, WeChat, or DM" value={contact} onChange={setContact} />
          </div>

          <button type="submit"
            style={{ width: "100%", padding: "14px 0", fontSize: 14, color: "#060B14", background: "#60A5FA", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}>
            Submit
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 11, color: "rgba(255,255,255,0.15)", textAlign: "center" }}>
          The Continuity Lab · Research Discovery · 2026
        </div>
      </div>
    </div>
  );
}
