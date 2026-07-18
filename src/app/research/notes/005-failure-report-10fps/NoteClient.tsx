"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ResearchMeta from "@/components/research/ResearchMeta";

export default function NoteClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-28 pb-16">
        <article className="note-article">
          <div className="note-meta">
            <ResearchMeta artifactId="FD-001" type="Failure Report" status="Published" published="2026.07.18" />
          </div>
          <h1 className="note-title">Frame Rate Hypothesis</h1>
          <p className="note-subtitle">
            We tested whether increasing the camera sampling rate from 6.7fps to 10fps improves cross-modal verification. It made things worse. Here's why.
          </p>

          <section className="note-section" id="hypothesis">
            <h2>The Hypothesis</h2>
            <p>
              Higher sampling rate → more camera frames → finer-grained direction data → improved direction agreement.
            </p>
            <p>
              The moving-blob tracker samples at 150ms intervals (6.7fps), producing ~49 camera frames per 8-second run.
              Reducing the interval to 100ms (10fps) should yield ~65+ frames — a 33% increase in data density.
              Intuitively, more data should improve the direction agreement metric, which was ~65% at 6.7fps.
            </p>
          </section>

          <section className="note-section" id="method">
            <h2>Method</h2>
            <table className="note-table">
              <thead><tr><th>Parameter</th><th>Control (6.7fps)</th><th>Test (10fps)</th></tr></thead>
              <tbody>
                <tr><td>Sampling interval</td><td>150ms</td><td>100ms</td></tr>
                <tr><td>Tracker</td><td>moving-blob</td><td>moving-blob</td></tr>
                <tr><td>Device</td><td>iPhone + desktop camera</td><td>Same</td></tr>
                <tr><td>Runs</td><td>60 (daylight)</td><td>10 (daylight)</td></tr>
              </tbody>
            </table>
          </section>

          <section className="note-section" id="results">
            <h2>Results</h2>
            <table className="note-table">
              <thead><tr><th>Metric</th><th>6.7fps</th><th>10fps</th><th>Δ</th></tr></thead>
              <tbody>
                <tr><td>Camera frames (avg)</td><td>49</td><td>65</td><td style={{color:"#3fb950"}}>+33%</td></tr>
                <tr><td>Pass rate</td><td>87%</td><td>70%</td><td style={{color:"#f85149"}}>-17%</td></tr>
                <tr><td>Direction agreement</td><td>~65%</td><td>60%</td><td style={{color:"#f85149"}}>-5%</td></tr>
                <tr><td>Temporal alignment</td><td>100%</td><td>100%</td><td>—</td></tr>
              </tbody>
            </table>
            <p>
              Higher frame rate <strong>decreased</strong> both pass rate and direction agreement.
              Temporal alignment remained at 100% — the coupling signal survived — but the direction
              signal degraded with faster sampling.
            </p>
          </section>

          <section className="note-section" id="why">
            <h2>Why It Failed</h2>
            <p>
              At 150ms intervals, the centroid of moving blobs shifts by an average of 3–5 pixels between
              frames — enough displacement for a clean direction vector. At 100ms intervals, the displacement
              shrinks to 1.5–3 pixels.
            </p>
            <p>
              The 1.5 pixel movement threshold acts as a low-pass filter: at 10fps, a larger fraction of
              true biological motion falls <em>below</em> the noise floor. The same motion that produced
              a clear signal at 150ms produces sub-threshold noise at 100ms.
            </p>
            <p>
              <strong>Lesson:</strong> More data ≠ better data. The optimal sampling rate is determined
              by the signal amplitude, not the sensor capability. For a pixel-blob tracker with a 1.5px
              threshold, 150ms (~6.7fps) is near the optimal balance between temporal resolution and
              signal-to-noise ratio.
            </p>
          </section>

          <section className="note-section" id="next">
            <h2>What We'll Do Differently</h2>
            <ol>
              <li><strong>Test before committing.</strong> A 10-run pre-test would have caught this without wasting a full batch.</li>
              <li><strong>Adaptive threshold.</strong> The movement threshold (1.5px) should scale with the sampling interval: tighter intervals need proportionally relaxed thresholds.</li>
              <li><strong>Report failures promptly.</strong> This report was written the day after the experiment. Future failures will be published within the same session.</li>
            </ol>
          </section>

          <div className="mt-16 pt-8 border-t border-white/[0.04] text-center">
            <Link href="/research" className="text-white/35 text-[10px] tracking-[0.2em] uppercase hover:text-white/55 transition-colors">
              ← Research Hub
            </Link>
          </div>
        </article>
      </div>
      <ProtocolFooter />
    </div>
  );
}
