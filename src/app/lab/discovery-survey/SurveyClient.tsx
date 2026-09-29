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

function Select({ label, options, value, onChange, required }: { label: string; options: string[]; value: string; onChange: (v: string) => void; required?: boolean }) {/* same as before */
  return (
    <div className="mb-4">
      <label className="block text-white/60 text-[12px] mb-1.5 tracking-[0.03em]">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full bg-[#0B1220] border border-white/10 text-white/70 text-[12px] px-3 py-2.5 rounded outline-none focus:border-[#60A5FA]/50 transition-colors appearance-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2360A5FA'%3E%3Cpath d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: "32px" }}>
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

// Consent wording version. Must match a version the server accepts
// (SUPPORTED_CONSENT_VERSIONS in src/app/api/research/survey/route.ts).
// Bump only when the wording below changes — the stored value is what proves
// which text a respondent agreed to.
const CONSENT_VERSION = "survey-consent-v1";

// Project governance decision for the current research phase. This is a
// project policy for this survey — not a scientific standard, and not a
// legal requirement.
const RETENTION_DAYS = 180;

const WITHDRAWAL_EMAIL = "protocol@myshape.com";

export default function SurveyClient() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
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
    if (submitting) return;
    // Client-side gate. The server independently rejects a submission whose
    // consent_version is missing or unrecognised, so this is UX, not the
    // enforcement point.
    if (!consented) {
      setSubmitError("Please agree to the research consent before submitting.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      // P0 fix — transport through the server route, not the Supabase REST
      // endpoint directly from the browser. The route is the source of truth:
      // it applies the rate limiter (5/IP/hr), the request-size guard, the field
      // allow-list, the per-field length caps and the required-field check,
      // none of which were enforced by a direct browser insert. The Supabase
      // anon key no longer needs to be referenced by this component.
      const res = await fetch("/api/research/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain, role, other_domain: otherDomain, has_sensor_data: hasSensorData,
          frequency: freq, duration, data_flow: dataFlow, provenance,
          pain_point: pain, solution, standard_wish: standard, interest, contact,
          consent_version: CONSENT_VERSION,
        }),
      });

      if (!res.ok) {
        // Transport-level failure (429 rate limit, 400 validation, 5xx persistence).
        // Never report success — a false "Thank you" would mean the response
        // was never recorded.
        setSubmitError("Your response could not be saved. Please try again.");
        return;
      }

      const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (!body || body.ok !== true) {
        setSubmitError("Your response could not be saved. Please try again.");
        return;
      }

      // Only an explicit { ok: true } from the route reaches this point.
      setSent(true);
    } catch {
      // Network error — same honest-failure rule as above.
      setSubmitError("Your response could not be saved. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div style={{ minHeight: "100dvh", background: "#051025", color: "#E6EDF7", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 300, margin: "0 0 8px", color: "#60A5FA" }}>Thank you</h2>
          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.7, marginBottom: 20 }}>
            Your response helps us understand whether this problem is real — or isn&apos;t.
          </p>
          <div style={{ textAlign: "left", padding: "14px 16px", border: "1px solid rgba(96,165,250,0.2)", background: "rgba(96,165,250,0.04)", borderRadius: 4, marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.8, margin: "0 0 10px" }}>
              <strong style={{ color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>What happens next</strong>
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.8 }}>
              <li>This was a research questionnaire. Submitting it does not enroll you in anything — it is not a registration, recruitment or enrollment application, or participation in EV-000 or any other study.</li>
              <li>Your response is retained for {RETENTION_DAYS} days from submission, then deleted according to the questionnaire&apos;s data-handling policy.</li>
              <li>You can ask us to stop contacting you, or ask us to delete this response. Email <a href={`mailto:${WITHDRAWAL_EMAIL}`} style={{ color: "#60A5FA" }}>{WITHDRAWAL_EMAIL}</a> and tell us which you mean. If you did not leave contact details, include anything you remember about the submission and we will locate it.</li>
            </ul>
          </div>
          <a href="/lab" style={{ display: "inline-block", padding: "10px 28px", border: "1px solid rgba(96,165,250,0.3)", color: "rgba(96,165,250,0.7)", fontSize: 13, textDecoration: "none", borderRadius: 4 }}>← Back to The Continuity Lab</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#051025", color: "#E6EDF7", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 24px 80px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 300, margin: "0 0 4px", color: "#fff" }}>Discovery Survey</h1>
        <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 32px", lineHeight: 1.7 }}>
          5-minute survey. Pure research. No sales pitch.<br />
          We're studying whether teams working with sensor data have encountered a specific pain point.
        </p>

        <form onSubmit={submit}>
          {/* Research consent — required before any answer is submitted.
              The wording below is the text that CONSENT_VERSION refers to. */}
          <div style={{ marginBottom: 32, padding: "16px", border: "1px solid rgba(96,165,250,0.25)", background: "rgba(96,165,250,0.04)", borderRadius: 4 }}>
            <h3 style={{ fontSize: 13, fontWeight: 500, color: "#60A5FA", margin: "0 0 12px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Research consent</h3>
            <ul style={{ margin: "0 0 14px", paddingLeft: 18, color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.8 }}>
              <li>This is a research questionnaire. It is not a registration, not a recruitment or enrollment application, and not participation in EV-000 or any other study.</li>
              <li>We collect the answers you give in this questionnaire, plus the submission time.</li>
              <li>Your answers are used for continuity research and research analysis.</li>
              <li>Responses are retained for {RETENTION_DAYS} days from submission, then deleted according to the questionnaire&apos;s data-handling policy.</li>
              <li>You can ask us to stop contacting you.</li>
              <li>You can ask us to delete a questionnaire response you already submitted. To reach us, email <a href={`mailto:${WITHDRAWAL_EMAIL}`} style={{ color: "#60A5FA" }}>{WITHDRAWAL_EMAIL}</a>. These are two different requests — tell us which one you mean.</li>
              <li>If you leave the optional follow-up contact blank, your answers are still recorded; we just will not be able to contact you about them.</li>
            </ul>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 1.6 }}>
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => { setConsented(e.target.checked); setSubmitError(null); }}
                style={{ marginTop: 2, width: 14, height: 14, accentColor: "#60A5FA", flexShrink: 0 }}
              />
              <span>I have read the above and consent to my answers being collected and used as described.</span>
            </label>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 13, fontWeight: 500, color: "#60A5FA", margin: "0 0 12px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Part 1 — Your Domain</h3>
            <Select label="1. What domain do you work in?" options={DOMAINS} value={domain} onChange={setDomain} required />
            {domain === "Other" && <TextInput label="Please specify" value={otherDomain} onChange={setOtherDomain} />}
            <Select label="2. Your role?" options={ROLES} value={role} onChange={setRole} />
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 13, fontWeight: 500, color: "#60A5FA", margin: "0 0 12px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Part 2 — Your Data</h3>
            <Select label="3. Do you work with continuous sensor data?" options={["Yes, extensively", "Yes, occasionally", "No"]} value={hasSensorData} onChange={setHasSensorData} required />
            <Select label="4. How fast does data arrive?" options={FREQS} value={freq} onChange={setFreq} />
            <Select label="5. Typical session or task duration?" options={DURATIONS} value={duration} onChange={setDuration} />
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 13, fontWeight: 500, color: "#60A5FA", margin: "0 0 12px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Part 3 — Data Flow</h3>
            <Select label="6. Does sensor data stay in one system or move?" options={FLOW} value={dataFlow} onChange={setDataFlow} />
            <Select label="7. When data moves, what happens to source information?" options={PROVENANCE} value={provenance} onChange={setProvenance} />
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 13, fontWeight: 500, color: "#60A5FA", margin: "0 0 12px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Part 4 — The Pain Point</h3>
            <Select label="8. Have you needed to prove data at time A and B = same source?" options={PAIN} value={pain} onChange={setPain} required />
            <Select label="9. How do you prove it today?" options={SOLUTION} value={solution} onChange={setSolution} />
            <Select label='10. Ever wanted a standard way to package sensor evidence + time + integrity?' options={STANDARD} value={standard} onChange={setStandard} />
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 13, fontWeight: 500, color: "#60A5FA", margin: "0 0 12px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Part 5 — Curiosity</h3>
            <Select label="11. Curious enough to read a one-page protocol spec?" options={INTEREST} value={interest} onChange={setInterest} />
            <TextInput label="12. Optional follow-up contact — Email, WeChat, or DM. Used only to contact you about this questionnaire. It is not a registration, participant ID, enrollment, membership, or EV-000 signup." value={contact} onChange={setContact} />
          </div>

          {submitError && (
            <div role="alert" style={{ marginBottom: 16, padding: "12px 14px", border: "1px solid rgba(248, 81, 73, 0.4)", background: "rgba(248, 81, 73, 0.08)", borderRadius: 4, color: "#f85149", fontSize: 12, lineHeight: 1.6 }}>
              {submitError}
            </div>
          )}

          <button type="submit" disabled={submitting}
            style={{ width: "100%", padding: "14px 0", fontSize: 14, color: "#051025", background: submitting ? "rgba(96,165,250,0.5)" : "#60A5FA", border: "none", borderRadius: 6, cursor: submitting ? "not-allowed" : "pointer", fontWeight: 500 }}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 11, color: "rgba(255,255,255,0.15)", textAlign: "center" }}>
          The Continuity Lab · Research Discovery · 2026
        </div>
      </div>
    </div>
  );
}
