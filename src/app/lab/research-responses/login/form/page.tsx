import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Operator Sign In — Research Responses",
  robots: { index: false, follow: false },
};

const card: React.CSSProperties = {
  maxWidth: 380,
  margin: "0 auto",
  padding: "28px 24px",
  border: "1px solid rgba(96,165,250,0.25)",
  background: "rgba(96,165,250,0.04)",
  borderRadius: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0B1220",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.8)",
  fontSize: 13,
  padding: "10px 12px",
  borderRadius: 4,
  boxSizing: "border-box",
  fontFamily: "var(--font-geist-mono), monospace",
};

/**
 * Operator sign-in.
 *
 * A plain server-rendered form. No client component, no state, no secret
 * prefilled or echoed anywhere. The secret travels in the POST body to the
 * login route, which compares it server-side.
 */
export default function OperatorLoginPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#051025",
        color: "#E6EDF7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={card}>
        <h1 style={{ fontSize: 16, fontWeight: 400, margin: "0 0 6px", color: "#60A5FF" }}>
          Operator sign in
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, margin: "0 0 20px" }}>
          Read-only access to research responses.
        </p>

        <form method="post" action="/lab/research-responses/login">
          <label
            htmlFor="secret"
            style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}
          >
            Operator secret
          </label>
          <input
            id="secret"
            name="secret"
            type="password"
            required
            autoComplete="current-password"
            style={inputStyle}
          />
          <button
            type="submit"
            style={{
              width: "100%",
              marginTop: 14,
              padding: "11px 0",
              fontSize: 13,
              color: "#051025",
              background: "#60A5FA",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Sign in
          </button>
        </form>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", lineHeight: 1.6, margin: "20px 0 0" }}>
          Sessions expire after one hour. This page is not indexed.
        </p>
      </div>
    </div>
  );
}
