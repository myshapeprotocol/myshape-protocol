"use client";

// ============================================================
// EV-000 — participant enrollment and withdrawal
//
// The minimum presentation required for an actual enrollment flow
// (canonical §15A.2): the frozen consent must be reviewable BEFORE
// enrollment is accepted.
//
// PRESENTATION LOCATION
//
// A single self-contained route. It adds no entry to any navigation menu,
// footer, sitemap, or existing page, so it introduces no new public
// information architecture — it is reachable only by URL. Wiring it into
// site navigation is a separate decision.
//
// THE CONSENT IS FROZEN
//
// The wording is rendered from `EV000_CONSENT_SECTIONS`, which mirrors
// canonical §15A.1. It is not editable here, and no control can present
// different terms. Changing the wording requires a new consent_version.
//
// THE PARTICIPANT REF
//
// Shown once, after enrollment, in a panel the participant must copy. The
// page keeps no copy of it, stores nothing, and cannot show it again.
// ============================================================

import { useState } from "react";
import {
  EV000_CONSENT_SECTIONS,
  EV000_CONSENT_TITLE,
  EV000_CONSENT_VERSION_PRESENTED,
} from "@/lib/ev000/consent";
import { EV000_CONSENT_VERSION } from "@/lib/ev000/enrollment-store";

type EnrollResponse = {
  ok: boolean;
  participantRef?: string;
  consentVersion?: string;
  retentionDays?: number;
  withdrawalContact?: string;
  notice?: string;
  error?: string;
};

type WithdrawResponse = {
  ok: boolean;
  withdrawn?: boolean;
  withdrawnAt?: string;
  withdrawalContact?: string;
  error?: string;
};

const card: React.CSSProperties = {
  background: "rgba(15,23,42,0.6)",
  border: "1px solid rgba(148,163,184,0.25)",
  borderRadius: 12,
  padding: 24,
  marginBottom: 32,
};

export default function Ev000Page() {
  const [accepted, setAccepted] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollResult, setEnrollResult] = useState<EnrollResponse | null>(null);
  const [refInput, setRefInput] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawResult, setWithdrawResult] = useState<WithdrawResponse | null>(null);

  async function handleEnroll() {
    setEnrolling(true);
    setEnrollResult(null);
    try {
      // The frozen version is sent as an explicit acceptance assertion. The
      // server compares it against its own constant and persists its own
      // value, never this one. No consent prose is duplicated here, and no
      // identity or participant data is transmitted.
      const res = await fetch("/api/ev000/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent_version: EV000_CONSENT_VERSION }),
      });
      setEnrollResult((await res.json()) as EnrollResponse);
    } catch {
      setEnrollResult({ ok: false, error: "Enrollment could not be completed." });
    } finally {
      setEnrolling(false);
    }
  }

  async function handleWithdraw() {
    setWithdrawing(true);
    setWithdrawResult(null);
    try {
      const res = await fetch("/api/ev000/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantRef: refInput.trim() }),
      });
      setWithdrawResult((await res.json()) as WithdrawResponse);
    } catch {
      setWithdrawResult({ ok: false, error: "We could not process that request." });
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px", color: "#e2e8f0" }}>
      <h1 style={{ fontSize: 28, fontWeight: 300, marginBottom: 8 }}>
        Taking part in Continuity Lab research
      </h1>
      <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 32 }}>
        Consent version {EV000_CONSENT_VERSION_PRESENTED}
      </p>

      <section style={card}>
        <h2 style={{ fontSize: 20, fontWeight: 400, marginBottom: 16 }}>
          {EV000_CONSENT_TITLE}
        </h2>
        {EV000_CONSENT_SECTIONS.map((section) => (
          <div key={section.heading} style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>
              {section.heading}
            </h3>
            {section.paragraphs.map((paragraph, i) => (
              <p key={i} style={{ lineHeight: 1.6, opacity: 0.9 }}>
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul style={{ lineHeight: 1.6, opacity: 0.9, paddingLeft: 20 }}>
                {section.bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>

      <ENROLL_SECTION
        accepted={accepted}
        setAccepted={setAccepted}
        enrolling={enrolling}
        onEnroll={handleEnroll}
        result={enrollResult}
      />

      <WITHDRAW_SECTION
        refInput={refInput}
        setRefInput={setRefInput}
        withdrawing={withdrawing}
        onWithdraw={handleWithdraw}
        result={withdrawResult}
      />
    </main>
  );
}
// ── Enrol section ───────────────────────────────────────────
//
// Split out so the enrollment logic above stays readable. Purely
// presentational; it holds no state of its own beyond the checkbox.

function ENROLL_SECTION({
  accepted,
  setAccepted,
  enrolling,
  onEnroll,
  result,
}: {
  accepted: boolean;
  setAccepted: (v: boolean) => void;
  enrolling: boolean;
  onEnroll: () => void;
  result: EnrollResponse | null;
}) {
  const done = result?.ok === true;
  return (
    <section style={card}>
      <h2 style={{ fontSize: 20, fontWeight: 400, marginBottom: 12 }}>Enrol</h2>
      {!accepted && (
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span style={{ lineHeight: 1.5 }}>
            I have read the consent above and I agree to take part in Continuity Lab
            research under these terms.
          </span>
        </label>
      )}
      <button
        onClick={onEnroll}
        disabled={!accepted || enrolling || done}
        style={{
          padding: "10px 20px",
          cursor: accepted && !enrolling && !done ? "pointer" : "not-allowed",
        }}
      >
        {enrolling ? "Enrolling…" : "Enrol now"}
      </button>

      {result && !result.ok && (
        <p style={{ marginTop: 12, color: "#f87171" }}>{result.error}</p>
      )}

      {result?.ok && result.participantRef && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            border: "1px solid #f59e0b",
            borderRadius: 8,
            background: "rgba(245,158,11,0.08)",
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: 8 }}>
            Your Participant Ref — shown only once
          </p>
          <code
            style={{ display: "block", wordBreak: "break-all", fontSize: 13, marginBottom: 12 }}
          >
            {result.participantRef}
          </code>
          <p style={{ fontSize: 14, opacity: 0.9 }}>{result.notice}</p>
          <p style={{ fontSize: 14, opacity: 0.9 }}>
            If you need to withdraw and cannot use this code, contact{" "}
            <strong>{result.withdrawalContact}</strong>.
          </p>
        </div>
      )}
    </section>
  );
}

// ── Withdraw section ────────────────────────────────────────

function WITHDRAW_SECTION({
  refInput,
  setRefInput,
  withdrawing,
  onWithdraw,
  result,
}: {
  refInput: string;
  setRefInput: (v: string) => void;
  withdrawing: boolean;
  onWithdraw: () => void;
  result: WithdrawResponse | null;
}) {
  return (
    <section style={card}>
      <h2 style={{ fontSize: 20, fontWeight: 400, marginBottom: 12 }}>Withdraw</h2>
      <p style={{ opacity: 0.85, marginBottom: 12 }}>
        Enter the Participant Ref you received when you enrolled.
      </p>
      <input
        value={refInput}
        onChange={(e) => setRefInput(e.target.value)}
        placeholder="Your Participant Ref"
        style={{ width: "100%", padding: 10, marginBottom: 12, boxSizing: "border-box" }}
      />
      <button
        onClick={onWithdraw}
        disabled={refInput.trim().length === 0 || withdrawing}
        style={{ padding: "10px 20px" }}
      >
        {withdrawing ? "Withdrawing…" : "Withdraw"}
      </button>

      {result?.ok && (
        <p style={{ marginTop: 12, color: "#4ade80" }}>
          You have withdrawn. Collection has stopped and your data has been removed.
          This cannot be undone.
        </p>
      )}
      {result && !result.ok && (
        <p style={{ marginTop: 12, color: "#f87171" }}>{result.error}</p>
      )}
      <p style={{ marginTop: 16, fontSize: 14, opacity: 0.8 }}>
        If you cannot use your Participant Ref, contact <strong>dev@myshape.com</strong>{" "}
        and ask to withdraw.
      </p>
    </section>
  );
}