import Link from "next/link";

export const metadata = {
  title: "Protocols — Continuity Lab",
  description: "Canonical protocol specifications for continuity infrastructure: CPS-0001 Continuity Receipt and CPS-0002 Human Signal Assertion.",
};

const PROTOCOLS = [
  {
    id: "CPS-0001",
    name: "Continuity Receipt",
    href: "/protocols/cps-0001",
    desc: "Continuity Receipt / Motion-Signature Continuity Verification. The engine-independent protocol core that defines the Continuity Receipt.",
    status: "v1.0-RC1",
    statusColor: "rgba(52,211,153,0.85)",
    note: "Release candidate",
  },
  {
    id: "CPS-0002",
    name: "Human Signal Assertion",
    href: "/protocols/cps-0002",
    desc: "Attestation layer over the Continuity Receipt: an attester-signed, receipt-bound, evidence-digest-committed, expiry-bounded assertion.",
    status: "Protocol Core — FROZEN AS PROTOTYPE DRAFT ARTIFACT",
    statusColor: "rgba(52,211,153,0.85)",
    note: "Spec prose DRAFT / NOT FROZEN · Review target d06b907 · Trust Framework — NOT FROZEN / OUT OF SCOPE",
  },
];

export default function ProtocolsPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "80px 20px", fontFamily: "var(--font-geist-mono), monospace" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#90c8ff" }}>Protocols</h1>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.6)" }}>
        Canonical protocol specifications for continuity infrastructure.
      </p>
      <div style={{ display: "grid", gap: 14, marginTop: 36 }}>
        {PROTOCOLS.map((p) => (
          <Link
            key={p.id}
            href={p.href}
            style={{
              display: "block",
              padding: "18px 20px",
              border: "1px solid rgba(0,229,255,0.12)",
              borderRadius: 10,
              background: "rgba(0,229,255,0.02)",
              textDecoration: "none",
              transition: "border-color 0.2s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#f8feff" }}>
                {p.id} — {p.name}
              </span>
              <span style={{ fontSize: 11.5, letterSpacing: "0.08em", color: p.statusColor }}>
                {p.status}
              </span>
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.7, color: "rgba(255,255,255,0.55)", margin: "8px 0 0" }}>
              {p.desc}
            </p>
            {p.note && (
              <p style={{ fontSize: 11.5, color: "rgba(212,175,55,0.8)", margin: "8px 0 0" }}>
                {p.note}
              </p>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}
