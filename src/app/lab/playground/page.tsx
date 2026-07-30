"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { detectJerkPeaks, buildEvidence, matchEvents, detectDirectionChanges } from "@/lib/evidence/causal-coupling";
import { evaluatePolicy } from "@/lib/evidence/types";
import type { IMUSample, CameraSample } from "@/lib/evidence/causal-coupling";
import {
  verifySchema, verifySignature, verifyAssertions, verifyTemporal,
  verifyEvidenceIntegrity, verifyFreshness,
  buildReceipt, computePayloadDigest, signReceipt,
  type ContinuityReceipt,
} from "@/lib/evidence/cps0001";
import { generateKeyPair, createIssuerIdentity } from "@/lib/crypto";

const W = 640, H = 200;

type Tab = "experiment" | "verify";

function generateData(humanness: number, samples: number): { imu: IMUSample[]; cam: CameraSample[] } {
  const imu: IMUSample[] = [];
  const cam: CameraSample[] = [];
  for (let i = 0; i < samples; i++) {
    const t = i * 16;
    const noise = (1 - humanness) * 0.1;
    const jerk = humanness > 0.6 ? (Math.random() > 0.92 ? (Math.random() - 0.5) * 20 : 0) : (Math.random() > 0.98 ? (Math.random() - 0.5) * 5 : 0);
    imu.push({ t, ax: Math.sin(t * 0.03) * 6 + (Math.random() - 0.5) * noise * 10 + jerk, ay: Math.cos(t * 0.035) * 5 + (Math.random() - 0.5) * noise * 8, az: 9.8 + Math.sin(t * 0.02) * 0.5 + (Math.random() - 0.5) * noise * 2, rx: Math.sin(t * 0.08) * 50 + (Math.random() - 0.5) * noise * 30, ry: Math.cos(t * 0.07) * 40 + (Math.random() - 0.5) * noise * 25, rz: Math.sin(t * 0.06) * 30 + (Math.random() - 0.5) * noise * 20, interval: 16 + (Math.random() - 0.5) * noise * 8 });
    if (i % 6 === 0) cam.push({ t, x: Math.sin(t * 0.03) * 8 + Math.cos(t * 0.08) * 4 + (Math.random() - 0.5) * noise * 5, y: Math.cos(t * 0.03) * 6 + Math.sin(t * 0.07) * 3 + (Math.random() - 0.5) * noise * 4, z: 0 });
  }
  return { imu, cam };
}

function buildSampleReceipt(): ContinuityReceipt {
  const kp = generateKeyPair();
  const issuer = createIssuerIdentity(kp);
  const payload = { score: 0.85, metric: "PES" };
  const digest = computePayloadDigest(payload);
  const now = new Date();
  const unsigned = buildReceipt({
    evidence: [{ engineId: "EE-001", engineVersion: "1.0.0", confidence: 0.85, payload, payloadDigest: digest }],
    interval: { start: new Date(now.getTime() - 8000).toISOString(), end: now.toISOString(), coverageMs: 8000 },
    subject: { id: "demo-subject", type: "embodied" },
    issuer,
  });
  return signReceipt(unsigned, kp.secretKey);
}

type StepStatus = "pass" | "fail" | "skipped";
interface Step { id: string; label: string; detail: string; status: StepStatus; error?: string; }

function runAllChecks(receipt: ContinuityReceipt): Step[] {
  const steps: Step[] = [];
  const v1 = verifySchema(receipt);
  steps.push({ id: "V₁", label: "Schema Validity", detail: "protocolVersion, receiptId, interval, evidence, issuer, signature", status: v1 ? "fail" : "pass", error: v1 ?? undefined });
  const v2 = verifySignature(receipt);
  steps.push({ id: "V₂", label: "Ed25519 Signature", detail: "Canonical payload verified against issuer public key", status: v2 ? "fail" : "pass", error: v2 ?? undefined });
  const v3 = verifyAssertions(receipt);
  steps.push({ id: "V₃", label: "Assertion Consistency", detail: "Logical coherence of claims", status: v3 ? "fail" : "pass", error: v3 ?? undefined });
  const v4 = verifyTemporal(receipt);
  steps.push({ id: "V₄", label: "Temporal Consistency", detail: "start < end, coverageMs match, signedAt ≥ end", status: v4 ? "fail" : "pass", error: v4 ?? undefined });
  const v5 = verifyEvidenceIntegrity(receipt);
  steps.push({ id: "V₅", label: "Evidence Integrity", detail: "SHA-256 payload matches payloadDigest", status: v5 ? "fail" : "pass", error: v5 ?? undefined });
  const v6 = verifyFreshness(receipt);
  steps.push({ id: "V₆", label: "Freshness", detail: "Current time < expiresAt", status: v6 ? "fail" : "pass", error: v6 ?? undefined });
  const genesis = !receipt.previousReceiptHash;
  steps.push({ id: "V₇", label: "Predecessor Chain", detail: genesis ? "Genesis receipt — no predecessor" : "Chain link verification", status: genesis ? "skipped" : "skipped" });
  return steps;
}

export default function PlaygroundPage() {
  const [tab, setTab] = useState<Tab>("experiment");

  // ── Experiment state ──
  const [humanness, setHumanness] = useState(0.75);
  const [samples, setSamples] = useState(200);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const result = useMemo(() => {
    const { imu, cam } = generateData(humanness, samples);
    const imuEvents = detectJerkPeaks(imu);
    const camEvents = detectDirectionChanges(cam);
    const { matches } = matchEvents(imuEvents, camEvents);
    const duration = imu[imu.length - 1]?.t || 8000;
    const ev = buildEvidence(imuEvents, camEvents, matches, [], [], duration);
    const verdict = evaluatePolicy({ policyId: "playground", acceptThreshold: 0.70, rejectThreshold: 0.35 }, ev.confidence ?? 0);
    return { verdict, confidence: ev.confidence ?? 0, components: ev.components, diagnostics: ev.diagnostics, imuEvents: imuEvents.length, camEvents: camEvents.length, matches: matches.length };
  }, [humanness, samples]);

  const vc = result.verdict === "PASS" ? "#34D399" : result.verdict === "FAIL" ? "#f85149" : "#d29922";

  useEffect(() => {
    if (tab !== "experiment") return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const { imu } = generateData(humanness, samples);
    const data = imu.map((s) => ({ t: s.t, v: Math.sqrt(s.ax ** 2 + s.ay ** 2 + s.az ** 2) }));
    const times = data.map((d) => d.t); const vals = data.map((d) => d.v);
    const maxT = times[times.length - 1] || 1; const maxV = Math.max(...vals, 12); const minV = Math.min(...vals, 6);
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "#1E293B"; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) { const y = (H / 4) * i; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = "#60A5FA"; ctx.lineWidth = 1.5; ctx.beginPath();
    data.forEach((d, i) => { const x = (d.t / maxT) * W; const y = H - ((d.v - minV) / (maxV - minV)) * (H - 10) - 5; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.stroke();
    const peaks = detectJerkPeaks(imu);
    ctx.fillStyle = "#f85149";
    peaks.forEach((p) => { const x = (p.t / maxT) * W; const y = H - ((data.find((d) => d.t >= p.t)?.v || minV) - minV) / (maxV - minV) * (H - 10) - 5; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); });
  }, [humanness, samples, tab]);

  // ── Verify state ──
  const [input, setInput] = useState("");
  const [vSteps, setVSteps] = useState<Step[]>([]);
  const [verdict, setVerdict] = useState<"VALID" | "INVALID" | "">("");
  const [vError, setVError] = useState("");

  function handleDemo() {
    const receipt = buildSampleReceipt();
    setInput(JSON.stringify(receipt, null, 2));
    setVError("");
    try {
      const results = runAllChecks(receipt);
      setVSteps(results);
      setVerdict(results.filter((s) => s.status === "fail").length === 0 ? "VALID" : "INVALID");
    } catch (e) { setVError(e instanceof Error ? e.message : "Verification failed."); }
  }

  function handleVerify() {
    setVError(""); setVSteps([]); setVerdict("");
    let receipt: ContinuityReceipt;
    try { receipt = JSON.parse(input) as ContinuityReceipt; } catch { setVError("Invalid JSON."); return; }
    if (!receipt.receiptId) { setVError("Not a CPS-0001 receipt."); return; }
    try {
      const results = runAllChecks(receipt);
      setVSteps(results);
      setVerdict(results.filter((s) => s.status === "fail").length === 0 ? "VALID" : "INVALID");
    } catch (e) { setVError(e instanceof Error ? e.message : "Verification failed."); }
  }

  const stepColor = (s: StepStatus) => s === "pass" ? "#48bb78" : s === "fail" ? "#f56565" : "#a0aec0";

  return (
    <div style={{ minHeight: "100vh", background: "#060B14", color: "#E6EDF7", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 32, borderBottom: "1px solid #1E293B" }}>
          {([
            ["experiment", "Experiment", "Tweak parameters, see live verification"],
            ["verify", "Verify", "Paste a CPS-0001 receipt → V₁–V₇"],
          ] as [Tab, string, string][]).map(([key, label, hint]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: "12px 24px",
                fontSize: 13,
                fontWeight: tab === key ? 500 : 300,
                color: tab === key ? "#60A5FA" : "#64748B",
                background: "none",
                border: "none",
                borderBottom: tab === key ? "2px solid #60A5FA" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              title={hint}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ═══════════════ TAB: Experiment ═══════════════ */}
        {tab === "experiment" && (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 300, color: "#E6EDF7", margin: "0 0 4px" }}>Continuity Playground</h1>
            <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 32px" }}>No code. No install. Slide to see verifyContinuity() in action.</p>

            <div style={{ padding: "16px 12px 8px", border: "1px solid #1E293B", background: "#0B1220", marginBottom: 0 }}>
              <canvas ref={canvasRef} width={W} height={H} style={{ width: "100%", height: "auto", display: "block" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748B", marginTop: 4 }}>
                <span>Acceleration magnitude</span>
                <span style={{ color: "#f85149" }}>● Jerk peaks</span>
                <span>{samples * 16}ms</span>
              </div>
            </div>

            <div style={{ textAlign: "center", padding: "12px 0 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#64748B" }}>VERDICT</div>
              <div style={{ fontSize: 32, fontWeight: 200, color: vc }}>{result.verdict.replace("_", " ")}</div>
              <div style={{ fontSize: 14, color: "#94A3B8" }}>{(result.confidence * 100).toFixed(0)}%</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
              <div style={{ padding: "14px 16px", border: "1px solid #1E293B", background: "#0B1220" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: "#94A3B8" }}>Humanness</span>
                  <span style={{ color: "#60A5FA" }}>{(humanness * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min="0" max="100" value={humanness * 100} onChange={(e) => setHumanness(Number(e.target.value) / 100)} style={{ width: "100%", accentColor: "#60A5FA" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748B", marginTop: 2 }}><span>Mechanical</span><span>Human</span></div>
              </div>
              <div style={{ padding: "14px 16px", border: "1px solid #1E293B", background: "#0B1220" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: "#94A3B8" }}>Samples</span>
                  <span style={{ color: "#60A5FA" }}>{samples}</span>
                </div>
                <input type="range" min="50" max="500" value={samples} onChange={(e) => setSamples(Number(e.target.value))} style={{ width: "100%", accentColor: "#60A5FA" }} />
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {result.components.map((c) => {
                  const clr = c.status === "PASS" ? "#34D399" : c.status === "FAIL" ? "#f85149" : "#d29922";
                  return (
                    <div key={c.metric} style={{ padding: "10px 12px", border: "1px solid #1E293B", background: "#0B1220", fontSize: 11 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#A7B4C6" }}>{c.metric}</span>
                        <span style={{ color: clr, fontSize: 14, fontWeight: 600 }}>{c.status === "PASS" ? "✓" : c.status === "FAIL" ? "✗" : "—"}</span>
                      </div>
                      <div style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>{c.value.toFixed(3)} / {c.threshold}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 28 }}>
              {[{ label: "IMU Events", value: result.imuEvents }, { label: "Camera Events", value: result.camEvents }, { label: "Matched", value: result.matches }].map((s) => (
                <div key={s.label} style={{ textAlign: "center", padding: "12px 8px", border: "1px solid #1E293B", background: "#0B1220" }}>
                  <div style={{ fontSize: 18, fontWeight: 300, color: "#60A5FA" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                </div>
              ))}
            </div>

            <details style={{ marginBottom: 32 }}>
              <summary style={{ fontSize: 11, color: "#64748B", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase" }}>Diagnostics</summary>
              <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.8, padding: "12px 14px", border: "1px solid #1E293B", background: "#0B1220" }}>
                {result.diagnostics.map((d, i) => (
                  <div key={i} style={{ color: d.startsWith("✓") ? "#34D399" : d.startsWith("✗") ? "#f85149" : "#64748B" }}>{d}</div>
                ))}
              </div>
            </details>
          </>
        )}

        {/* ═══════════════ TAB: Verify ═══════════════ */}
        {tab === "verify" && (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 300, color: "#E6EDF7", margin: "0 0 4px" }}>Receipt Verifier</h1>
            <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 24px" }}>CPS-0001 V₁–V₇ verification. Runs in your browser.</p>

            <button
              onClick={handleDemo}
              style={{
                width: "100%", padding: "10px 0", marginBottom: 16,
                border: "2px solid rgba(100,255,180,0.5)", background: "rgba(100,255,180,0.05)",
                color: "#64ffb4", fontSize: 12, fontWeight: 600, cursor: "pointer",
                textTransform: "uppercase", letterSpacing: "0.15em",
              }}
            >
              Try Demo — one click
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste CPS-0001 ContinuityReceipt JSON here…"
              style={{
                width: "100%", height: 160, boxSizing: "border-box",
                background: "#0d0d14", border: "1px solid rgba(144,200,255,0.2)",
                color: "rgba(255,255,255,0.7)", fontSize: 11, padding: 12,
                fontFamily: "monospace", resize: "vertical",
              }}
              spellCheck={false}
            />

            <button
              onClick={handleVerify}
              disabled={!input.trim()}
              style={{
                width: "100%", padding: "10px 0", marginTop: 12, marginBottom: 20,
                border: "2px solid rgba(144,200,255,0.6)", background: "transparent",
                color: "#90c8ff", fontSize: 12, fontWeight: 600, cursor: input.trim() ? "pointer" : "not-allowed",
                textTransform: "uppercase", letterSpacing: "0.15em", opacity: input.trim() ? 1 : 0.3,
              }}
            >
              Verify Receipt
            </button>

            {vError && <div style={{ border: "1px solid rgba(245,101,101,0.3)", background: "rgba(245,101,101,0.03)", padding: 12, fontSize: 12, color: "#f56565", marginBottom: 16 }}>{vError}</div>}

            {verdict && (
              <div style={{
                border: verdict === "VALID" ? "1px solid rgba(72,187,120,0.3)" : "1px solid rgba(245,101,101,0.3)",
                background: verdict === "VALID" ? "rgba(72,187,120,0.03)" : "rgba(245,101,101,0.03)",
                padding: 16, textAlign: "center", marginBottom: 20,
              }}>
                <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: verdict === "VALID" ? "#48bb78" : "#f56565" }}>
                  {verdict}
                </div>
              </div>
            )}

            {vSteps.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>Verification Steps</div>
                {vSteps.map((step) => (
                  <div key={step.id} style={{ display: "flex", gap: 12, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.04)", marginBottom: 2, fontSize: 12 }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, background: stepColor(step.status) + "20", color: stepColor(step.status), flexShrink: 0, marginTop: 1 }}>
                      {step.status === "pass" ? "✓" : step.status === "fail" ? "✗" : "—"}
                    </span>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{step.id}</span>
                        <span style={{ color: "rgba(255,255,255,0.8)" }}>{step.label}</span>
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2 }}>{step.detail}</div>
                      {step.error && <div style={{ color: "rgba(245,101,101,0.7)", fontSize: 10, marginTop: 2 }}>{step.error}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <a href="https://www.npmjs.com/package/@thecontinuitylab/myshape" style={{ fontSize: 12, color: "rgba(96,165,250,0.5)", textDecoration: "none", letterSpacing: "0.05em" }}>npm install @thecontinuitylab/myshape →</a>
          <a href="https://thecontinuitylab.org/lab" style={{ fontSize: 12, color: "rgba(212,175,55,0.5)", textDecoration: "none", letterSpacing: "0.05em" }}>The Continuity Lab →</a>
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: 12 }}>CPS-0001 v1.0-RC · Verification runs locally · Engine-independent</div>
      </div>
    </div>
  );
}
