"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
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

function generateData(humanness: number, samples: number) {
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

type StepStatus = "pass" | "fail" | "skipped";
interface Step { id: string; label: string; detail: string; status: StepStatus; error?: string; }

function humanLabel(id: string): string {
  const m: Record<string, string> = {
    "V1": "Structure check — does this look like a valid receipt?",
    "V2": "Signature check — was it really signed by the issuer?",
    "V3": "Logic check — do the claims make sense together?",
    "V4": "Timeline check — do the timestamps add up?",
    "V5": "Evidence check — does the payload hash match?",
    "V6": "Freshness check — has the receipt expired?",
    "V7": "Chain check — is there a predecessor receipt?",
  };
  return m[id] || "";
}

function runAllChecks(receipt: ContinuityReceipt): Step[] {
  const steps: Step[] = [];
  const v1 = verifySchema(receipt);
  steps.push({ id: "V1", label: "Schema", detail: humanLabel("V1"), status: v1 ? "fail" : "pass", error: v1 ?? undefined });
  const v2 = verifySignature(receipt);
  steps.push({ id: "V2", label: "Signature", detail: humanLabel("V2"), status: v2 ? "fail" : "pass", error: v2 ?? undefined });
  const v3 = verifyAssertions(receipt);
  steps.push({ id: "V3", label: "Assertions", detail: humanLabel("V3"), status: v3 ? "fail" : "pass", error: v3 ?? undefined });
  const v4 = verifyTemporal(receipt);
  steps.push({ id: "V4", label: "Timeline", detail: humanLabel("V4"), status: v4 ? "fail" : "pass", error: v4 ?? undefined });
  const v5 = verifyEvidenceIntegrity(receipt);
  steps.push({ id: "V5", label: "Evidence", detail: humanLabel("V5"), status: v5 ? "fail" : "pass", error: v5 ?? undefined });
  const v6 = verifyFreshness(receipt);
  steps.push({ id: "V6", label: "Freshness", detail: humanLabel("V6"), status: v6 ? "fail" : "pass", error: v6 ?? undefined });
  const genesis = !receipt.previousReceiptHash;
  steps.push({ id: "V7", label: "Chain", detail: humanLabel("V7"), status: genesis ? "skipped" : "skipped" });
  return steps;
}

export default function PlaygroundPage() {
  const [tab, setTab] = useState<Tab>("experiment");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Experiment ──
  const [humanness, setHumanness] = useState(0.75);
  const [samples, setSamples] = useState(200);

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

  // ── Verify ──
  const [receiptJson, setReceiptJson] = useState("");
  const [originalReceipt, setOriginalReceipt] = useState("");
  const [receiptSource, setReceiptSource] = useState<"experiment" | "manual" | "">("");
  const [vSteps, setVSteps] = useState<Step[]>([]);
  const [verdict, setVerdict] = useState<"VALID" | "INVALID" | "">("");
  const [vError, setVError] = useState("");
  const [typingPos, setTypingPos] = useState(0);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => () => { if (typingRef.current) clearInterval(typingRef.current); }, []);

  // Typewriter effect: reveals all steps, then types detail text character by character
  function startTyping(all: Step[]) {
    // Reveal steps one at a time
    let stepIdx = 0;
    const revealStep = () => {
      if (stepIdx >= all.length) {
        // All steps revealed — start typing detail text
        const allText = all.map((s) => s.detail).join("");
        let charIdx = 0;
        setTypingPos(0);
        typingRef.current = setInterval(() => {
          charIdx++;
          setTypingPos(charIdx);
          if (charIdx >= allText.length) {
            if (typingRef.current) clearInterval(typingRef.current);
            setVerdict(all.filter((s) => s.status === "fail").length === 0 ? "VALID" : "INVALID");
          }
        }, 28);
        return;
      }
      setVSteps(all.slice(0, stepIdx + 1));
      stepIdx++;
      setTimeout(revealStep, 280);
    };
    // Show first 2 immediately
    setVSteps(all.slice(0, 2));
    stepIdx = 2;
    setTimeout(revealStep, 250);
  }

  function handleVerify(json?: string) {
    const raw = json ?? receiptJson;
    if (typingRef.current) { clearInterval(typingRef.current); typingRef.current = null; }
    setVError(""); setVSteps([]); setVerdict(""); setTypingPos(0);
    let receipt: ContinuityReceipt;
    try { receipt = JSON.parse(raw) as ContinuityReceipt; } catch { setVError("Invalid JSON — check the receipt format."); return; }
    if (!receipt.receiptId) { setVError("Missing receiptId — not a valid CPS-0001 receipt."); return; }
    try {
      startTyping(runAllChecks(receipt));
    } catch (e) { setVError(e instanceof Error ? e.message : "Verification crashed — this is a bug."); }
  }

  function handleSignAndVerify() {
    const kp = generateKeyPair();
    const issuer = createIssuerIdentity(kp);
    const payload = {
      engineId: "EE-002",
      confidence: result.confidence,
      verdict: result.verdict,
      imuEvents: result.imuEvents,
      camEvents: result.camEvents,
      matches: result.matches,
      humanness,
    };
    const digest = computePayloadDigest(payload);
    const now = new Date();
    const unsigned = buildReceipt({
      evidence: [{ engineId: "EE-002", engineVersion: "1.0.0", confidence: result.confidence, payload, payloadDigest: digest }],
      interval: { start: new Date(now.getTime() - samples * 16).toISOString(), end: now.toISOString(), coverageMs: samples * 16 },
      subject: { id: "playground-experiment", type: "embodied" },
      issuer,
    });
    const receipt = signReceipt(unsigned, kp.secretKey);
    const json = JSON.stringify(receipt, null, 2);
    setReceiptJson(json);
    setOriginalReceipt(json);
    setReceiptSource("experiment");
    setVSteps([]);
    setVerdict("");
    setTypingPos(0);
    setTab("verify");
  }

  const stepColor = (s: StepStatus) => s === "pass" ? "#48bb78" : s === "fail" ? "#f56565" : "#a0aec0";

  return (
    <div style={{ minHeight: "100vh", background: "#060B14", color: "#E6EDF7", fontFamily: "system-ui, -apple-system, sans-serif", position: "relative" }}>
      <style>{`@keyframes blink{50%{opacity:0}} @keyframes statusIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}`}</style>
      <BackgroundParticles />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 32, borderBottom: "1px solid #1E293B" }}>
          {([
            ["experiment", "Experiment", "Tweak parameters → see live verification"],
            ["verify", "Verify", "Sign experiment evidence → validate CPS-0001 receipt"],
          ] as [Tab, string, string][]).map(([key, label, hint]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: "12px 24px", fontSize: 14,
                fontWeight: tab === key ? 600 : 400,
                color: tab === key ? "#60A5FA" : "#64748B",
                background: "none", border: "none",
                borderBottom: tab === key ? "2px solid #60A5FA" : "2px solid transparent",
                cursor: "pointer", transition: "all 0.2s",
              }}
              title={hint}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ═══════════ TAB: Experiment ═══════════ */}
        {tab === "experiment" && (
          <>
            {/* Preset scenarios */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 20 }}>
              {([
                { label: "🚶 Walking", h: 0.90, desc: "Natural gait with heel strikes" },
                { label: "🪑 Sitting", h: 0.70, desc: "Subtle micro-movements" },
                { label: "🤖 AI Smooth", h: 0.25, desc: "Too regular — lacks noise" },
                { label: "🔁 Replay", h: 0.45, desc: "Repeated pattern, no variation" },
              ]).map(({ label, h, desc }) => (
                <button
                  key={label}
                  onClick={() => setHumanness(h)}
                  title={desc}
                  style={{
                    padding: "8px 10px", fontSize: 11, cursor: "pointer",
                    border: humanness === h ? "1px solid rgba(96,165,250,0.4)" : "1px solid #1E293B",
                    background: humanness === h ? "rgba(96,165,250,0.06)" : "#0B1220",
                    color: humanness === h ? "#60A5FA" : "#94A3B8",
                    borderRadius: 2, transition: "all 0.2s",
                  }}
                >
                  <div>{label}</div>
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{desc}</div>
                </button>
              ))}
            </div>

            <div style={{ padding: "16px 12px 8px", border: "1px solid #1E293B", background: "#0B1220" }}>
              <canvas ref={canvasRef} width={W} height={H} style={{ width: "100%", height: "auto", display: "block" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748B", marginTop: 4 }}>
                <span>Acceleration magnitude</span>
                <span style={{ color: "#f85149" }}>● Jerk peaks</span>
                <span>{samples * 16}ms</span>
              </div>
            </div>

            <div style={{ textAlign: "center", padding: "12px 0 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#64748B" }}>Verdict</div>
              <div style={{ fontSize: 32, fontWeight: 200, color: vc }}>{result.verdict.replace("_", " ")}</div>
              <div style={{ fontSize: 14, color: "#94A3B8" }}>{(result.confidence * 100).toFixed(0)}%</div>
            </div>
            <p style={{ textAlign: "center", fontSize: 11, color: "#64748B", margin: "0 0 20px", lineHeight: 1.6 }}>
              {result.verdict === "PASS"
                ? humanness > 0.7
                  ? "Strong biological signal — the motion has enough irregularity that it looks human."
                  : "Just above the threshold — the evidence is sufficient but a more natural motion would boost confidence."
                : result.verdict === "FAIL"
                  ? humanness < 0.3
                    ? "Too mechanical — the motion lacks the micro-variations that human bodies produce."
                    : "Not enough evidence to confirm continuity — the signal is too weak or too uniform."
                  : "Insufficient data — the sample is too short or lacks detectable events."}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
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

            {/* Evidence grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 28 }}>
              {[{ label: "IMU Events", value: result.imuEvents }, { label: "Camera Events", value: result.camEvents }, { label: "Matched", value: result.matches }].map((s) => (
                <div key={s.label} style={{ textAlign: "center", padding: "12px 8px", border: "1px solid #1E293B", background: "#0B1220" }}>
                  <div style={{ fontSize: 18, fontWeight: 300, color: "#60A5FA" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── THE KEY BUTTON ── */}
            <button
              onClick={handleSignAndVerify}
              style={{
                display: "block", width: "100%", padding: "14px 0", marginBottom: 32,
                border: "2px solid rgba(52,211,153,0.6)", background: "rgba(52,211,153,0.06)",
                color: "#34D399", fontSize: 14, fontWeight: 600, cursor: "pointer",
                letterSpacing: "0.1em",
              }}
            >
              → Sign &amp; Verify This Evidence
            </button>
            <p style={{ textAlign: "center", fontSize: 11, color: "#64748B", marginTop: -20, marginBottom: 20 }}>
              Signs the experiment result as a CPS-0001 receipt and sends it to the Verifier.
            </p>

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

        {/* ═══════════ TAB: Verify ═══════════ */}
        {tab === "verify" && (
          <>
            {(receiptSource === "experiment" || receiptSource === "manual") && originalReceipt && (
              <>
                <div style={{ padding: "12px 16px", marginBottom: 16, border: receiptSource === "experiment" ? "1px solid rgba(52,211,153,0.25)" : "1px solid rgba(245,101,101,0.2)", background: receiptSource === "experiment" ? "rgba(52,211,153,0.04)" : "rgba(245,101,101,0.03)", fontSize: 12, color: receiptSource === "experiment" ? "#34D399" : "#f56565", borderRadius: 2 }}>
                  {receiptSource === "experiment" ? "← Receipt signed from your experiment evidence" : "⚠ Receipt has been tampered — see which checks catch it"}
                </div>
                {verdict && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                  {[
                    { label: "Corrupt Signature", hint: "Tampers the Ed25519 signature → V2 fails", action: () => {
                      try { const r = JSON.parse(receiptJson); r.signature = r.signature.slice(0, -10) + "0000000000"; setReceiptJson(JSON.stringify(r, null, 2)); setReceiptSource("manual"); handleVerify(JSON.stringify(r, null, 2)); } catch {}
                    }},
                    { label: "Break Timeline", hint: "Sets coverage to 0 → V4 fails", action: () => {
                      try { const r = JSON.parse(receiptJson); r.interval.coverageMs = 0; setReceiptJson(JSON.stringify(r, null, 2)); setReceiptSource("manual"); handleVerify(JSON.stringify(r, null, 2)); } catch {}
                    }},
                    { label: "Mismatch Hash", hint: "Changes payload without updating digest → V5 fails", action: () => {
                      try { const r = JSON.parse(receiptJson); r.evidence[0].payload.humanness = 0; setReceiptJson(JSON.stringify(r, null, 2)); setReceiptSource("manual"); handleVerify(JSON.stringify(r, null, 2)); } catch {}
                    }},
                    { label: "Restore Original", hint: "Back to the valid receipt", action: () => {
                      setReceiptJson(originalReceipt); setReceiptSource("experiment"); handleVerify(originalReceipt);
                    }},
                  ].map(({ label, hint, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      title={hint}
                      style={{
                        padding: "5px 10px", fontSize: 10,
                        border: "1px solid rgba(245,101,101,0.3)", background: "transparent",
                        color: "rgba(245,101,101,0.7)", cursor: "pointer",
                        borderRadius: 2, transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,101,101,0.08)"; e.currentTarget.style.color = "#f56565"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(245,101,101,0.7)"; }}
                    >
                      🔨 {label}
                    </button>
                  ))}
                </div>
                )}
              </>
            )}
            {!originalReceipt && receiptSource !== "manual" && (
              <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 20px", lineHeight: 1.6 }}>
                Paste any CPS-0001 receipt to verify it — or <a href="#" onClick={(e) => { e.preventDefault(); setTab("experiment"); }} style={{ color: "#60A5FA" }}>go to Experiment</a> to generate one.
              </p>
            )}

            <textarea
              value={receiptJson}
              onChange={(e) => { setReceiptJson(e.target.value); setReceiptSource("manual"); }}
              placeholder="Paste CPS-0001 ContinuityReceipt JSON here…"
              style={{ width: "100%", height: 160, boxSizing: "border-box", background: "#0d0d14", border: "1px solid rgba(144,200,255,0.2)", color: "rgba(255,255,255,0.7)", fontSize: 11, padding: 12, fontFamily: "monospace", resize: "vertical" }}
              spellCheck={false}
            />

            {receiptSource === "experiment" && !verdict && (
              <p style={{ textAlign: "center", fontSize: 11, color: "#34D399", margin: "10px 0 6px" }}>
                ↓ Your receipt is ready — click below to verify it.
              </p>
            )}
            <button
              onClick={() => handleVerify()}
              disabled={!receiptJson.trim()}
              style={{
                width: "100%", padding: receiptSource === "experiment" && !verdict ? "14px 0" : "10px 0",
                marginTop: 8, marginBottom: 20,
                border: receiptSource === "experiment" && !verdict ? "2px solid rgba(52,211,153,0.6)" : "2px solid rgba(144,200,255,0.6)",
                background: receiptSource === "experiment" && !verdict ? "rgba(52,211,153,0.06)" : "transparent",
                color: receiptSource === "experiment" && !verdict ? "#34D399" : "#90c8ff",
                fontSize: receiptSource === "experiment" && !verdict ? 14 : 12,
                fontWeight: 600, cursor: receiptJson.trim() ? "pointer" : "not-allowed",
                letterSpacing: "0.1em", opacity: receiptJson.trim() ? 1 : 0.3,
                transition: "all 0.2s",
              }}
            >
              {receiptSource === "experiment" && !verdict ? "→ Verify This Receipt" : "Verify Receipt"}
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

            {verdict && (
              <div style={{ textAlign: "center", marginBottom: 28, padding: "14px 16px", border: "1px solid rgba(96,165,250,0.12)", background: "rgba(96,165,250,0.02)", borderRadius: 2 }}>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 10 }}>
                  {verdict === "VALID" ? "The receipt checks out. Want to see what a bad one looks like?" : "Something broke. See which checks caught it above."}
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                  {verdict === "VALID" && (
                    <>
                      <button onClick={() => { try { const r = JSON.parse(receiptJson); r.signature = r.signature.slice(0, -10) + "0000000000"; setReceiptJson(JSON.stringify(r, null, 2)); setReceiptSource("manual"); handleVerify(JSON.stringify(r, null, 2)); } catch {} }} style={{ padding: "5px 12px", fontSize: 10, border: "1px solid rgba(245,101,101,0.3)", background: "transparent", color: "rgba(245,101,101,0.7)", cursor: "pointer", borderRadius: 2 }}>🔨 Corrupt it</button>
                    </>
                  )}
                  <button onClick={() => setTab("experiment")} style={{ padding: "5px 12px", fontSize: 10, border: "1px solid rgba(96,165,250,0.3)", background: "transparent", color: "rgba(96,165,250,0.7)", cursor: "pointer", borderRadius: 2 }}>← Try different parameters</button>
                </div>
              </div>
            )}

            {vSteps.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>V₁–V7 Verification</div>
                {vSteps.map((step, i) => {
                  const prevChars = vSteps.slice(0, i).reduce((sum, s) => sum + s.detail.length, 0);
                  const visible = Math.max(0, Math.min(step.detail.length, typingPos - prevChars));
                  const showCursor = i === vSteps.length - 1 ? typingPos >= prevChars : (typingPos >= prevChars && typingPos < prevChars + step.detail.length);
                  return (
                  <div key={step.id} style={{ display: "flex", gap: 12, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.04)", marginBottom: 2, fontSize: 12 }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, background: stepColor(step.status) + "20", color: stepColor(step.status), flexShrink: 0, marginTop: 1 }}>
                      {step.status === "pass" ? "✓" : step.status === "fail" ? "✗" : "—"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{step.id} {step.label}</span>
                        <span style={{ color: stepColor(step.status), fontSize: 10, fontWeight: 600, animation: `statusIn 0.4s ease-out both`, animationDelay: `${i * 0.3}s` }}>{step.status.toUpperCase()}</span>
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 3 }}>
                        {step.detail.slice(0, visible)}
                        {showCursor && typingPos < prevChars + step.detail.length && <span style={{ color: "#60A5FA", animation: "blink 0.6s step-end infinite" }}>▌</span>}
                      </div>
                      {step.error && <div style={{ color: "rgba(245,101,101,0.7)", fontSize: 10, marginTop: 2 }}>{step.error}</div>}
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </>
        )}

        {/* CTA — real data */}
        {verdict && (
          <div style={{ marginTop: 32, padding: "24px", border: "1px solid rgba(212,175,55,0.15)", background: "rgba(212,175,55,0.02)", borderRadius: 2 }}>
            <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
              {/* QR */}
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <img
                  src="https://chart.googleapis.com/chart?cht=qr&chs=96x96&chl=https://thecontinuitylab.org/lab/contribute&choe=UTF-8&chld=L"
                  alt="QR code to contribute page"
                  style={{ display: "block", width: 96, height: 96, border: "1px solid #1E293B", borderRadius: 4, background: "#fff" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div style={{ fontSize: 9, color: "#64748B", marginTop: 4 }}>Scan with phone → contribute data</div>
              </div>
              {/* Copy */}
              <div style={{ minWidth: 200 }}>
                <div style={{ fontSize: 13, color: "rgba(212,175,55,0.75)", fontWeight: 500, marginBottom: 6 }}>
                  This was simulated data.
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
                  Record real motion data on your phone and help us build the benchmark.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <a href="https://www.npmjs.com/package/@thecontinuitylab/myshape" style={{ fontSize: 12, color: "rgba(96,165,250,0.5)", textDecoration: "none" }}>npm install →</a>
          <a href="/lab" style={{ fontSize: 12, color: "rgba(212,175,55,0.5)", textDecoration: "none" }}>The Continuity Lab →</a>
        </div>
      </div>
    </div>
  );
}
