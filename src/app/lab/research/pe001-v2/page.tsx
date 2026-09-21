"use client";

import { useState, useRef } from "react";
import {
  type IMUSample,
  type CameraSample,
  detectJerkPeaks,
  detectDirectionChanges,
  matchEvents,
  buildEvidence,
} from "@/lib/evidence/causal-coupling";
import { hashEvidence, evaluatePolicy } from "@/lib/evidence/types";
import type { EngineEvidence, Verdict } from "@/lib/evidence/types";

const W = 320, H = 240, DUR = 8;

function round(v: number): number { return Math.round(v * 1000) / 1000; }

export default function Page() {
  const [msg, setMsg] = useState("Ready");
  const [camCount, setCamCount] = useState(0);
  const [imuCount, setImuCount] = useState(0);
  const [evidence, setEvidence] = useState<EngineEvidence | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [copyStatus, setCopyStatus] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const camSamplesRef = useRef<CameraSample[]>([]);
  const imuSamplesRef = useRef<IMUSample[]>([]);

  async function go() {
    setMsg("Starting camera...");
    setEvidence(null); setVerdict(null);
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: W, height: H } });
    if (!videoRef.current) return;
    streamRef.current = stream;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();

    setMsg("Recording 8s... Move hand in front of camera");
    camSamplesRef.current = [];
    imuSamplesRef.current = [];
    const ctx = canvasRef.current!.getContext("2d", { willReadFrequently: true })!;
    let prevCx = -1, prevCy = -1;
    let motionFrames = 0;
    let frameCount = 0;
    const t0 = performance.now();
    let prevData: Uint8ClampedArray | null = null;

    function isBlob(r: number, g: number, b: number): boolean {
      return r > 95 && g > 40 && b > 20 && r > g && r > b && (r - g) > 15;
    }

    await new Promise<void>((resolve) => {
      const iv = setInterval(() => {
        if (!videoRef.current) return;
        ctx.drawImage(videoRef.current, 0, 0, W, H);
        frameCount++;
        const now = performance.now() - t0;
        const data = ctx.getImageData(0, 0, W, H);
        let sx = 0, sy = 0, movingBlobPx = 0, totalBlobPx = 0;

        // Only track blob pixels that are MOVING (color + frame difference)
        for (let y = 0; y < H; y += 3) {
          for (let x = 0; x < W; x += 3) {
            const i = (y * W + x) * 4;
            if (isBlob(data.data[i], data.data[i+1], data.data[i+2])) {
              totalBlobPx++;
              if (prevData) {
                const d = Math.abs(data.data[i] - prevData[i]) + Math.abs(data.data[i+1] - prevData[i+1]) + Math.abs(data.data[i+2] - prevData[i+2]);
                if (d > 20) {
                  sx += x; sy += y; movingBlobPx++;
                }
              }
            }
          }
        }

        if (movingBlobPx > 15) {
          const cx = sx / movingBlobPx;
          const cy = sy / movingBlobPx;
          if (prevCx >= 0 && prevCy >= 0) {
            const dx = cx - prevCx;
            const dy = cy - prevCy;
            const movement = Math.sqrt(dx * dx + dy * dy);
            if (movement > 1.5) {
              motionFrames++;
              camSamplesRef.current.push({ t: Math.round(now), x: round(dx), y: round(dy), z: 0 });
              if (camSamplesRef.current.length > 600) camSamplesRef.current.shift();
              setCamCount(motionFrames);
            }
          }
          prevCx = cx; prevCy = cy;
        }
        prevData = new Uint8ClampedArray(data.data);

        setMsg(`${motionFrames} moving-blob / ${frameCount} scans (blob:${totalBlobPx} moving:${movingBlobPx})`);

        if (now > DUR * 1000) { clearInterval(iv); resolve(); }
      }, 150);
    });

    setMsg(`Camera: ${motionFrames} frames. Fetching phone IMU...`);

    // Fetch phone IMU from API
    const startPoll = Date.now();
    let fetched = false;
    while (!fetched && Date.now() - startPoll < 30000) {
      try {
        const res = await fetch("/api/pe001/session");
        const data = await res.json();
        if (data.ready) {
          imuSamplesRef.current = data.imuSamples;
          setImuCount(data.imuSamples.length);
          fetched = true;
        }
      } catch { /* retry */ }
      if (!fetched) await new Promise((r) => setTimeout(r, 1000));
    }

    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (!fetched) { setMsg("✗ Phone timeout"); return; }

    setMsg(`Analyzing: ${camSamplesRef.current.length} cam + ${imuSamplesRef.current.length} IMU...`);

    // ── Analysis ──
    const imuEvents = detectJerkPeaks(imuSamplesRef.current);
    const camEvents = detectDirectionChanges(camSamplesRef.current);
    const { matches, unmatchedIMU, unmatchedCam } = matchEvents(imuEvents, camEvents);
    const lastImuT = imuEvents.length > 0 ? imuEvents[imuEvents.length - 1].t : 0;
    const lastCamT = camEvents.length > 0 ? camEvents[camEvents.length - 1].t : 0;
    const totalDuration = Math.max(lastImuT, lastCamT, DUR * 1000);

    const ev = buildEvidence(imuEvents, camEvents, matches, unmatchedIMU, unmatchedCam, totalDuration);
    setEvidence(ev);
    hashEvidence(ev).then((d) => { if (d) setEvidence((prev) => (prev ? { ...prev, evidenceDigest: d } : prev)); });
    const v = evaluatePolicy({ policyId: "EE-002", acceptThreshold: 0.70, rejectThreshold: 0.35 }, ev.confidence ?? 0);
    setVerdict(v);
    setMsg("✓ Done");
  }

  function sc(s: string) { return s === "PASS" ? "#3fb950" : s === "FAIL" ? "#f85149" : "#d29922"; }
  function si(s: string) { return s === "PASS" ? "✓" : s === "FAIL" ? "✗" : "—"; }

  return (
    <div style={{ padding: 20, color: "white", background: "black", minHeight: "100vh", fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>PE-001 — Independent Camera Bridge</h1>

      <video ref={videoRef} style={{ width: W, height: H, border: "1px solid #333", marginBottom: 16 }} playsInline muted />
      <canvas ref={canvasRef} width={W} height={H} style={{ position: "absolute", left: -9999 }} />

      <div style={{ fontSize: 14, color: "#90c8ff", marginBottom: 16 }}>{msg}</div>

      <button onClick={go} style={{ padding: "16px 48px", fontSize: 18, background: "#111", color: "white", border: "1px solid #333", cursor: "pointer", marginBottom: 24 }}>
        Start
      </button>

      {evidence && verdict && (
        <div style={{ maxWidth: 500 }}>
          <button onClick={() => {
            const lines = [`Verdict: ${verdict}`, `Camera: ${camCount} frames, IMU: ${imuCount} samples`, ...evidence.diagnostics];
            navigator.clipboard.writeText(lines.join("\n")).then(() => { setCopyStatus("✓ Copied!"); setTimeout(() => setCopyStatus(""), 2000); });
          }} style={{ width: "100%", padding: "10px 0", background: "#1a1a1a", color: "#d29922", border: "1px solid #d29922", fontSize: 12, cursor: "pointer", marginBottom: 16 }}>
            {copyStatus || "📋 Copy Results"}
          </button>

          <div style={{ textAlign: "center", padding: 20, border: `2px solid ${verdict === "PASS" ? "#3fb950" : "#f85149"}`, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Cross-Modal Confidence</div>
            <div style={{ fontSize: 36, color: sc(verdict), fontWeight: 300 }}>{evidence.confidence ? `${(evidence.confidence * 100).toFixed(0)}%` : "—"}</div>
          </div>

          {evidence.components.map((comp) => (
            <div key={comp.metric} style={{ display: "flex", justifyContent: "space-between", padding: 8, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 4, fontSize: 12 }}>
              <span style={{ color: "#888" }}>{comp.metric}: <span style={{ color: "#bbb" }}>{comp.value.toFixed(3)}</span></span>
              <span style={{ color: sc(comp.status) }}>{si(comp.status)}</span>
            </div>
          ))}

          <div style={{ marginTop: 12 }}>
            {evidence.diagnostics.map((d, i) => (
              <div key={i} style={{ fontSize: 11, marginBottom: 2, color: d.startsWith("✓") ? "#3fb950" : d.startsWith("✗") ? "#f85149" : "#666" }}>
                {d}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
