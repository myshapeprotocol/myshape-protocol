"use client";

import { useState, useRef } from "react";
import { buildReceipt, createReceiptId, computePayloadDigest, signReceipt } from "@/lib/evidence/cps0001";
import type { ContinuityInterval } from "@/lib/evidence/cps0001";
import { getOrCreateKeyPair, createIssuerIdentity } from "@/lib/crypto";

export default function Page() {
  const [phase, setPhase] = useState<"idle" | "go" | "done">("idle");
  const [msg, setMsg] = useState("");
  const [samples, setSamples] = useState(0);
  const [verdict, setVerdict] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [details, setDetails] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [receiptJson, setReceiptJson] = useState("");
  const [receiptHash, setReceiptHash] = useState("");
  const ref = useRef<Array<{ t: number; ax: number; ay: number; az: number }>>([]);
  const capRef = useRef(false);

  async function go() {
    setError(""); setVerdict(""); setConfidence(0); setDetails([]); setReceiptJson(""); setReceiptHash("");

    if (!("DeviceMotionEvent" in window)) { setError("No motion sensor."); return; }

    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const p = await (DeviceMotionEvent as any).requestPermission();
        if (p !== "granted") { setError("Motion access needed."); return; }
      } catch { setError("Permission error."); return; }
    }

    setPhase("go");
    setMsg("3");
    await new Promise(r => setTimeout(r, 1000)); setMsg("2");
    await new Promise(r => setTimeout(r, 1000)); setMsg("1");
    await new Promise(r => setTimeout(r, 1000));

    const startTime = new Date();
    ref.current = [];
    capRef.current = true;
    const t0 = performance.now();

    const handler = (e: DeviceMotionEvent) => {
      if (!capRef.current) return;
      ref.current.push({ t: performance.now() - t0, ax: e.acceleration?.x ?? e.accelerationIncludingGravity?.x ?? 0, ay: e.acceleration?.y ?? e.accelerationIncludingGravity?.y ?? 0, az: e.acceleration?.z ?? e.accelerationIncludingGravity?.z ?? 0 });
    };
    window.addEventListener("devicemotion", handler);

    setMsg("Move naturally...");
    await new Promise(r => setTimeout(r, 8000));

    capRef.current = false;
    window.removeEventListener("devicemotion", handler);
    const endTime = new Date();
    setSamples(ref.current.length);

    const data = ref.current;
    if (data.length < 10) { setVerdict("Not enough data"); setPhase("done"); return; }
    const n = data.length;

    let si = 0; for (let i = 1; i < n; i++) si += data[i].t - data[i - 1].t;
    const mi = si / (n - 1);
    let sv = 0; for (let i = 1; i < n; i++) { const d = data[i].t - data[i - 1].t; sv += (d - mi) * (d - mi); }
    const cv = Math.sqrt(sv / (n - 1)) / Math.max(mi, 1);

    let sm = 0; for (const d of data) sm += Math.sqrt(d.ax * d.ax + d.ay * d.ay + d.az * d.az);
    const mm = sm / n;
    let mv = 0; for (const d of data) { const m = Math.sqrt(d.ax * d.ax + d.ay * d.ay + d.az * d.az); mv += (m - mm) * (m - mm); }
    const mvv = mv / n;

    const sc = Math.min(cv / 0.25, 1) * 0.5 + Math.min(mvv / 1.5, 1) * 0.5;
    const timingOk = cv > 0.08;
    const intensityOk = mvv > 0.25;
    const ok = timingOk && intensityOk;

    setVerdict(ok ? "Physical motion detected" : "Uncertain — weak signal");
    setConfidence(Math.round(sc * 100));
    setDetails([timingOk ? "✓ Natural timing" : "✗ Too regular", intensityOk ? "✓ Good intensity" : "✗ Too weak"]);

    // Build CPS-0001 ContinuityReceipt
    const prev = typeof window !== "undefined" ? localStorage.getItem("vfy-prev") ?? null : null;

    const payload = {
      cv,
      mvv,
      n: data.length,
      meanInterval: Math.round(mi * 100) / 100,
    };
    const payloadDigest = computePayloadDigest(payload);

    const interval: ContinuityInterval = {
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      coverageMs: endTime.getTime() - startTime.getTime(),
    };

    // Opaque subject ID
    let devId = typeof window !== "undefined" ? localStorage.getItem("vfy-dev") : null;
    if (!devId && typeof window !== "undefined") {
      devId = createReceiptId();
      localStorage.setItem("vfy-dev", devId);
    }

    // Ed25519 keypair for signing
    const kp = getOrCreateKeyPair();
    const issuer = createIssuerIdentity(kp);

    const unsigned = buildReceipt({
      evidence: [{
        engineId: "EE-001",
        engineVersion: "1.2.0",
        confidence: sc,
        payload,
        payloadDigest,
      }],
      interval,
      subject: { id: devId ?? "unknown", type: "embodied" },
      issuer,
      previousReceiptHash: prev,
      verdict: ok ? "PASS" : "FAIL",
    });

    // Sign with Ed25519
    const receipt = signReceipt(unsigned, kp.secretKey);

    // Chain link: SHA-256 of full receipt
    const receiptStr = JSON.stringify(receipt);
    const fullHash = computePayloadDigest({ receipt: receiptStr } as Record<string, unknown>);
    const shortHash = fullHash.slice(0, 16);
    setReceiptJson(JSON.stringify(receipt, null, 2));
    setReceiptHash(shortHash);
    if (typeof window !== "undefined") localStorage.setItem("vfy-prev", fullHash);

    setPhase("done");

    // Save to research
    try { await fetch("/api/pe001/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: "vfy-" + Date.now(), imuSamples: data }) }); } catch { /* ok */ }
  }

  const isPass = verdict === "Physical motion detected";

  return (
    <div style={{ minHeight: "100dvh", background: "#051025", color: "#E6EDF7", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div style={{ maxWidth: 380, width: "100%" }}>

        {phase === "idle" && (
          <>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "radial-gradient(circle, rgba(96,165,250,0.2) 0%, transparent 70%)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#60A5FA", boxShadow: "0 0 10px rgba(96,165,250,0.6)" }} />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 300, margin: "0 0 8px" }}>Physical Motion Check</h1>
            <p style={{ fontSize: 14, color: "#94A3B8", margin: "0 0 32px", lineHeight: 1.6 }}>This verifies sensor data comes from a physically moving device — not a script. It does not identify you.</p>
            {error && <div style={{ fontSize: 12, color: "#f85149", marginBottom: 16, padding: 10, background: "rgba(248,81,73,0.06)", border: "1px solid rgba(248,81,73,0.2)", borderRadius: 6 }}>{error}</div>}
            <button onClick={go} style={{ width: "100%", padding: "16px 0", fontSize: 17, color: "#051025", background: "#60A5FA", border: "none", borderRadius: 8, cursor: "pointer" }}>
              Start
            </button>
          </>
        )}

        {phase === "go" && (
          <div style={{ fontSize: msg === "Move naturally..." ? 18 : 64, fontWeight: 200, color: "#60A5FA", padding: msg === "Move naturally..." ? 32 : 48 }}>
            {msg}
          </div>
        )}

        {phase === "done" && (
          <>
            <div style={{ fontSize: 48, width: 72, height: 72, borderRadius: "50%", background: isPass ? "rgba(52,211,153,0.1)" : "rgba(210,153,34,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", border: `2px solid ${isPass ? "rgba(52,211,153,0.3)" : "rgba(210,153,34,0.2)"}` }}>
              {isPass ? "✓" : "?"}
            </div>
            <div style={{ fontSize: 22, fontWeight: 300, color: isPass ? "#34D399" : "#d29922", marginBottom: 4 }}>{verdict}</div>
            <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 16 }}>{confidence}% confidence</div>

            <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.8, marginBottom: 16, padding: "12px 14px", background: "#0B1220", border: "1px solid #1E293B", borderRadius: 8, textAlign: "left" }}>
              {details.map((d, i) => <div key={i} style={{ color: d.startsWith("✓") ? "#34D399" : "#f85149" }}>{d}</div>)}
            </div>

            {/* CPS-0001 Receipt */}
            {receiptHash && (
              <div style={{ marginBottom: 20, padding: "12px 14px", background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: 8, textAlign: "left", fontSize: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#60A5FA", fontWeight: 500 }}>CPS-0001 Receipt</span>
                  <button onClick={() => navigator.clipboard.writeText(receiptJson).then(() => { const b = document.activeElement as HTMLButtonElement; if (b) { b.textContent = "✓ Copied"; setTimeout(() => b.textContent = "Copy", 1500); } })} style={{ fontSize: 11, color: "#60A5FA", background: "none", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}>Copy</button>
                </div>
                <div style={{ color: "#64748B", fontSize: 11, fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.6, maxHeight: 80, overflow: "hidden" }}>
                  {receiptJson.split("\n").slice(0, 6).join("\n")}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "rgba(96,165,250,0.5)", fontFamily: "monospace" }}>
                  Chain: {receiptHash}...
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.12)" }}>
                  Continuity Receipt · CPS-0001 v1.0-RC1 · independent receipt (no signed chain link)
                </div>
              </div>
            )}

            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.1)", marginBottom: 20 }}>{samples} samples · anonymized for research</div>

            <button onClick={() => setPhase("idle")} style={{ width: "100%", padding: "14px 0", fontSize: 15, color: "#60A5FA", background: "transparent", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 8, cursor: "pointer" }}>Try again</button>
          </>
        )}
      </div>
    </div>
  );
}
