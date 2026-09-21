"use client";

import React from "react";
import Link from "next/link";

export default function ResearchClient() {
    return (
    <div className="lab-page">
      <style>{`
        .lab-page { min-height: 100vh; background: #051025; color: #e6edf7; font-family: var(--font-geist-sans), system-ui, sans-serif; position: relative; overflow: hidden; }
        .lab-main { max-width: 1080px; margin: 0 auto; padding: clamp(88px,12vw,148px) 24px clamp(4rem,5vw,5rem); }
        .lab-hero h1 { font-size: clamp(28px,4vw,40px); font-weight: 200; letter-spacing: -0.02em; color: #fff; margin: 0; }
        .lab-hero .lab-subtitle { max-width: 640px; margin: clamp(14px,2vw,20px) auto 0; font-size: clamp(12px,1.6vw,14px); font-weight: 300; line-height: 1.6; color: rgba(255,255,255,0.42); }
        .lab-section { margin-top: clamp(2.5rem,4vw,3.5rem); }
        .lab-section h2 { font-size: clamp(15px,2vw,18px); font-weight: 600; letter-spacing: 0.08em; color: rgba(0,229,255,0.6); text-transform: uppercase; margin-bottom: clamp(12px,1.6vw,18px); }
        .lab-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap: clamp(12px,2vw,20px); }
        .lab-card { display: block; padding: clamp(14px,2vw,20px); border: 1px solid rgba(0,229,255,0.08); background: rgba(5,16,37,0.45); border-radius: 12px; color: #e6edf7; text-decoration: none; transition: all 0.3s ease; }
        .lab-card:hover { border-color: rgba(0,229,255,0.35); box-shadow: 0 0 24px rgba(0,229,255,0.08); transform: translateY(-2px); }
        .lab-card h3 { font-size: clamp(13px,1.4vw,15px); font-weight: 500; margin: 0 0 4px; color: #fff; }
        .lab-card p { font-size: 11px; color: rgba(255,255,255,0.35); line-height: 1.4; margin: 0; }
      `}</style>
      <main className="lab-main">
        <section className="lab-hero">
          <h1>Research</h1>
          <p className="lab-subtitle">
            Open research on continuity infrastructure.
          </p>
        </section>

                <section className="lab-section">
          <h2>Research Notes</h2>
          <div className="lab-card-grid">
            <Link href="/lab/research/notes/001-the-continuity-problem" className="lab-card">
              <h3>001 — The Continuity Question</h3>
              <p>Foundational research question.</p>
            </Link>
            <Link href="/lab/research/notes/002-pes-benchmark" className="lab-card">
              <h3>002 — PES Benchmark</h3>
              <p>Benchmark results.</p>
            </Link>
            <Link href="/lab/research/notes/003-cross-modal-binding" className="lab-card">
              <h3>003 — Cross-Modal Coupling</h3>
              <p>Experiment results.</p>
            </Link>
            <Link href="/lab/research/notes/004-motion-signature-rfc" className="lab-card">
              <h3>004 — RFC-0001</h3>
              <p>Research RFC.</p>
            </Link>
            <Link href="/lab/research/notes/005-failure-report-10fps" className="lab-card">
              <h3>005 — Failure Report</h3>
              <p>Negative results.</p>
            </Link>
            <Link href="/lab/research/notes/006-continuity-proof-rfc" className="lab-card">
              <h3>006 — RFC-0002</h3>
              <p>Research RFC.</p>
            </Link>
            <Link href="/lab/research/notes/007-ee003-direction-asymmetry" className="lab-card">
              <h3>007 — DL-001</h3>
              <p>Research note.</p>
            </Link>
            <Link href="/lab/research/notes/009-two-stage-continuity-verification" className="lab-card">
              <h3>009 — Two-Stage Verification</h3>
              <p>Research note.</p>
            </Link>
          </div>
        </section>

        <section className="lab-section">
          <h2>Research Infrastructure</h2>
          <div className="lab-card-grid">
            <Link href="/lab/research/benchmarks" className="lab-card">
              <h3>Benchmarks</h3>
              <p>Research dashboard.</p>
            </Link>
            <Link href="/lab/research/dataset" className="lab-card">
              <h3>Dataset</h3>
              <p>Research dataset info.</p>
            </Link>
            <Link href="/lab/research/agenda" className="lab-card">
              <h3>Research Agenda</h3>
              <p>Research planning.</p>
            </Link>
            <Link href="/lab/research/open-questions/001" className="lab-card">
              <h3>Open Question 001</h3>
              <p>Research question.</p>
            </Link>
          </div>
        </section>

        <section className="lab-section">
          <h2>Experiments</h2>
          <div className="lab-card-grid">
            <Link href="/lab/research/challenge" className="lab-card">
              <h3>Challenge</h3>
              <p>Experiment tool.</p>
            </Link>
            <Link href="/lab/research/challenge-response" className="lab-card">
              <h3>Challenge Response</h3>
              <p>Experiment tool.</p>
            </Link>
            <Link href="/lab/research/causal-coupling" className="lab-card">
              <h3>Causal Coupling</h3>
              <p>Experiment tool.</p>
            </Link>
            <Link href="/lab/research/fusion" className="lab-card">
              <h3>Fusion</h3>
              <p>Experiment tool.</p>
            </Link>
            <Link href="/lab/research/mobile" className="lab-card">
              <h3>Mobile</h3>
              <p>Experiment tool.</p>
            </Link>
            <Link href="/lab/research/pe001-phone" className="lab-card">
              <h3>PE001 Phone</h3>
              <p>Experiment tool.</p>
            </Link>
            <Link href="/lab/research/pe001-v2" className="lab-card">
              <h3>PE001 v2</h3>
              <p>Experiment tool.</p>
            </Link>
            <Link href="/lab/research/action-password" className="lab-card">
              <h3>Action Password</h3>
              <p>Experiment tool.</p>
            </Link>
            <Link href="/lab/research/protocol-verify" className="lab-card">
              <h3>Protocol Verify</h3>
              <p>Experiment tool.</p>
            </Link>
            <Link href="/lab/research/real-001-capture" className="lab-card">
              <h3>REAL-001 Capture</h3>
              <p>Experiment tool.</p>
            </Link>
            <Link href="/lab/research/real-try-004-export" className="lab-card">
              <h3>REAL-TRY-004 Export</h3>
              <p>Data export.</p>
            </Link>
          </div>
        </section>

        <section className="lab-section">
          <h2>Research Participation</h2>
          <div className="lab-card-grid">
            <Link href="/lab/research/apply" className="lab-card">
              <h3>Apply</h3>
              <p>Research participation form.</p>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}