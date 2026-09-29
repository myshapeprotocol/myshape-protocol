"use client";

import { useState } from "react";

// Consent wording version. Must match a version the server accepts
// (SUPPORTED_CONSENT_VERSIONS in src/app/api/research/participate/route.ts).
// Bump only when the wording below changes.
const CONSENT_VERSION = "participation-consent-v1";

// Same project governance as the Discovery Questionnaire.
const RETENTION_DAYS = 180;
const WITHDRAWAL_EMAIL = "protocol@myshape.com";

const ROLES = [
  { value: "researcher", label: "Researcher" },
  { value: "developer", label: "Developer / Engineer" },
  { value: "founder", label: "Founder" },
  { value: "student", label: "Student" },
  { value: "other", label: "Other" },
] as const;

const AREAS = [
  { value: "ai", label: "AI / AI Agents" },
  { value: "robotics", label: "Robotics" },
  { value: "sensors", label: "Sensors / Wearables" },
  { value: "iot", label: "IoT" },
  { value: "digital-twins", label: "Digital Twins / Simulation" },
  { value: "crypto", label: "Cryptography / Security" },
  { value: "distributed-systems", label: "Distributed Systems" },
  { value: "data-infra", label: "Data / Infrastructure" },
  { value: "other", label: "Other" },
] as const;

const PHYSICAL_WORLD = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not-directly", label: "Not directly" },
] as const;

const INTERESTS = [
  { value: "learn", label: "Learn about the research" },
  { value: "test-cps-0001", label: "Test CPS-0001" },
  { value: "challenge-assumptions", label: "Challenge the assumptions" },
  { value: "reproduce-experiments", label: "Reproduce the experiments" },
  { value: "independent-implementation", label: "Build an independent implementation" },
  { value: "discuss-use-case", label: "Discuss a potential use case" },
  { value: "other", label: "Other" },
] as const;

const CONTACT_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

const panel: React.CSSProperties = {
  padding: "14px 16px",
  border: "1px solid rgba(96,165,250,0.25)",
  background: "rgba(96,165,250,0.04)",
  borderRadius: 4,
  marginBottom: 32,
};

const panelHeading: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "#60A5FA",
  margin: "0 0 12px",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: "rgba(255,255,255,0.6)",
  fontSize: 12,
  lineHeight: 1.8,
};

const qLabel: React.CSSProperties = {
  display: "block",
  color: "rgba(255,255,255,0.75)",
  fontSize: 13,
  marginBottom: 8,
};

const optionRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "rgba(255,255,255,0.6)",
  fontSize: 12,
  padding: "3px 0",
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0B1220",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.75)",
  fontSize: 13,
  padding: "10px 12px",
  borderRadius: 4,
  boxSizing: "border-box",
};

const fieldBlock: React.CSSProperties = { marginBottom: 24 };

export default function ParticipationClient() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);

  const [role, setRole] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [physicalWorld, setPhysicalWorld] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [workingOn, setWorkingOn] = useState("");
  const [wantsContact, setWantsContact] = useState("");
  const [contact, setContact] = useState("");

  function toggle(list: string[], value: string, set: (next: string[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!consented) {
      setSubmitError("Please agree to the research consent before submitting.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/research/participate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          areas,
          physical_world: physicalWorld,
          interests,
          working_on: workingOn,
          wants_contact: wantsContact,
          contact: wantsContact === "yes" ? contact : "",
          consent_version: CONSENT_VERSION,
        }),
      });

      if (!res.ok) {
        setSubmitError("Your response could not be saved. Please try again.");
        return;
      }
      const result = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (!result || result.ok !== true) {
        setSubmitError("Your response could not be saved. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError("Your response could not be saved. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100dvh", background: "#051025", color: "#E6EDF7", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: 460 }}>
          <div style={{ fontSize: 40, marginBottom: 16, textAlign: "center" }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 300, margin: "0 0 10px", color: "#60A5FA", textAlign: "center" }}>
            Thank you
          </h2>
          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.7, marginBottom: 20, textAlign: "center" }}>
            Your interest has been recorded. This does not enroll you in anything.
          </p>
          <div style={panel}>
            <p style={{ ...panelHeading, margin: "0 0 10px" }}>What happens next</p>
            <ul style={listStyle}>
              <li>This is an expression of interest — not a registration, an account, an enrollment, or a place in any cohort.</li>
              <li>Your response is retained for {RETENTION_DAYS} days from submission, then deleted according to the research data-handling policy.</li>
              <li>
                You can ask us to stop contacting you, or ask us to delete this response. They are two different requests. Email{" "}
                <a href={`mailto:${WITHDRAWAL_EMAIL}`} style={{ color: "#60A5FA" }}>{WITHDRAWAL_EMAIL}</a>{" "}
                and tell us which you mean.
              </li>
            </ul>
          </div>
          <a href="/lab" style={{ display: "inline-block", padding: "10px 28px", border: "1px solid rgba(96,165,250,0.3)", color: "rgba(96,165,250,0.7)", fontSize: 13, textDecoration: "none", borderRadius: 4 }}>
            ← Back to The Continuity Lab
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#051025", color: "#E6EDF7", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 24px 80px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 300, margin: "0 0 4px", color: "#fff" }}>
          Participate in the Research
        </h1>
        <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 32px", lineHeight: 1.7 }}>
          One or two minutes. Tell us what you are working on and what would be useful to
          you — reading, testing, challenging, reproducing, or implementing independently.
        </p>

        <form onSubmit={submit}>
          <div style={panel}>
            <p style={panelHeading}>What this is</p>
            <ul style={listStyle}>
              <li>This is an expression of interest in the research programme.</li>
              <li>It is not product registration, an account, a participant ID, an enrollment, or a recruitment application.</li>
              <li>Submitting does not place you in any cohort or study, and does not verify your identity.</li>
              <li>We store what you enter here, the submission time, and the consent below.</li>
              <li>Your response is retained for {RETENTION_DAYS} days from submission, then deleted according to the research data-handling policy.</li>
              <li>
                You can ask us to stop contacting you, or ask us to delete this response. Email{" "}
                <a href={`mailto:${WITHDRAWAL_EMAIL}`} style={{ color: "#60A5FA" }}>{WITHDRAWAL_EMAIL}</a>.
              </li>
            </ul>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 1.6, marginTop: 12 }}>
              <input type="checkbox" checked={consented} onChange={(e) => { setConsented(e.target.checked); setSubmitError(null); }} style={{ marginTop: 2, width: 14, height: 14, accentColor: "#60A5FA", flexShrink: 0 }} />
              <span>I have read the above and consent to this being collected and used as described.</span>
            </label>
          </div>

          <div style={fieldBlock}>
            <span style={qLabel}>1. I am a…</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} required style={inputStyle}>
              <option value="">—</option>
              {ROLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div style={fieldBlock}>
            <span style={qLabel}>2. I work in… <span style={{ color: "rgba(255,255,255,0.35)" }}>(select any)</span></span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0 16px" }}>
              {AREAS.map((o) => (
                <label key={o.value} style={optionRow}>
                  <input type="checkbox" checked={areas.includes(o.value)} onChange={() => toggle(areas, o.value, setAreas)} style={{ accentColor: "#60A5FA" }} />
                  {o.label}
                </label>
              ))}
            </div>
          </div>

          <div style={fieldBlock}>
            <span style={qLabel}>3. Do you work with physical-world data or evidence?</span>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {PHYSICAL_WORLD.map((o) => (
                <label key={o.value} style={optionRow}>
                  <input type="radio" name="physical_world" checked={physicalWorld === o.value} onChange={() => setPhysicalWorld(o.value)} style={{ accentColor: "#60A5FA" }} required />
                  {o.label}
                </label>
              ))}
            </div>
          </div>

          <div style={fieldBlock}>
            <span style={qLabel}>4. I am interested in… <span style={{ color: "rgba(255,255,255,0.35)" }}>(select any)</span></span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 16px" }}>
              {INTERESTS.map((o) => (
                <label key={o.value} style={optionRow}>
                  <input type="checkbox" checked={interests.includes(o.value)} onChange={() => toggle(interests, o.value, setInterests)} style={{ accentColor: "#60A5FA" }} />
                  {o.label}
                </label>
              ))}
            </div>
            {interests.length === 0 && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "6px 0 0" }}>Select at least one.</p>}
          </div>

          <div style={fieldBlock}>
            <label style={qLabel} htmlFor="working_on">5. Briefly describe what you&apos;re working on.</label>
            <textarea id="working_on" value={workingOn} onChange={(e) => setWorkingOn(e.target.value)} maxLength={300} rows={3} placeholder="Optional" style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <div style={fieldBlock}>
            <span style={qLabel}>6. Would you like us to contact you about research participation?</span>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {CONTACT_OPTIONS.map((o) => (
                <label key={o.value} style={optionRow}>
                  <input type="radio" name="wants_contact" checked={wantsContact === o.value} onChange={() => { setWantsContact(o.value); if (o.value === "no") setContact(""); }} style={{ accentColor: "#60A5FA" }} required />
                  {o.label}
                </label>
              ))}
            </div>
          </div>

          {wantsContact === "yes" && (
            <div style={fieldBlock}>
              <label style={qLabel} htmlFor="contact">7. Contact</label>
              <input id="contact" type="text" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={300} placeholder="Email, GitHub, or other handle" style={inputStyle} />
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "6px 0 0", lineHeight: 1.6 }}>
                Optional. Used only to contact you about the research. It is not a participant
                ID, an account, or an enrollment, and it gives you no status.
              </p>
            </div>
          )}

          {submitError && (
            <div role="alert" style={{ marginBottom: 16, padding: "12px 14px", border: "1px solid rgba(248,81,73,0.4)", background: "rgba(248,81,73,0.08)", borderRadius: 4, color: "#f85149", fontSize: 12, lineHeight: 1.6 }}>
              {submitError}
            </div>
          )}

          <button type="submit" disabled={submitting} style={{ width: "100%", padding: "14px 0", fontSize: 14, color: "#051025", background: submitting ? "rgba(96,165,250,0.5)" : "#60A5FA", border: "none", borderRadius: 6, cursor: submitting ? "not-allowed" : "pointer", fontWeight: 500 }}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 11, color: "rgba(255,255,255,0.15)", textAlign: "center" }}>
          The Continuity Lab · Research Participation · 2026
        </div>
      </div>
    </div>
  );
}

