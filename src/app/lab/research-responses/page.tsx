import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import {
  verifyOperatorSessionToken,
  OPERATOR_COOKIE,
  OPERATOR_COOKIE_PATH,
} from "@/lib/operator-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Research Responses — Operator",
  robots: { index: false, follow: false },
};

/** Hard ceiling. A caller cannot request more than this. */
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

/**
 * The only two tables this page may read. An instrument name maps to a table
 * through this fixed lookup — a request can never supply a table name.
 */
const INSTRUMENTS = {
  survey: {
    table: "discovery_survey",
    label: "Discovery Survey",
  },
  participation: {
    table: "research_participation",
    label: "Research Participation",
  },
} as const;

type InstrumentKey = keyof typeof INSTRUMENTS;

type Row = Record<string, unknown>;

function isInstrumentKey(value: string): value is InstrumentKey {
  return value === "survey" || value === "participation";
}

function clampLimit(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

/**
 * Read responses with the service role.
 *
 * The service key is read only here, inside a server component, and is never
 * passed to a client. If the environment is not configured this returns an
 * empty result rather than throwing — the page still renders, with no data.
 *
 * The table name comes from the INSTRUMENTS lookup, never from the request.
 * The filter is one of two fixed suffixes, also never interpolated from input.
 */
async function readResponses(
  table: string,
  limit: number,
  filter: "has_contact" | "wants_contact" | null,
): Promise<{ rows: Row[]; configured: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { rows: [], configured: false };

  let query = `${url}/rest/v1/${table}?select=*&order=created_at.desc&limit=${limit}`;
  if (filter === "has_contact") query += "&contact=not.is.null";
  if (filter === "wants_contact") query += "&wants_contact=eq.yes";

  try {
    const res = await fetch(query, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return { rows: [], configured: true };
    return { rows: (await res.json()) as Row[], configured: true };
  } catch {
    return { rows: [], configured: true };
  }
}

const cell: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 11,
  borderBottom: "1px solid rgba(255,255,255,0.04)",
  whiteSpace: "nowrap",
};

const th: React.CSSProperties = {
  ...cell,
  color: "rgba(255,255,255,0.4)",
  textAlign: "left",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};

function text(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return String(value);
}

export default async function ResearchResponsesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // ── Authorization gate ──
  // Runs before any data access. An absent, tampered, or expired session
  // produces a 404 with no query and no response data.
  const store = await cookies();
  const secret = process.env.OPERATOR_SECRET;
  const token = store.get(OPERATOR_COOKIE)?.value;
  if (!secret || !verifyOperatorSessionToken(token, secret)) {
    notFound();
  }

  const params = await searchParams;
  const rawInstrument = typeof params.instrument === "string" ? params.instrument : "";
  if (!isInstrumentKey(rawInstrument)) {
    notFound();
  }
  const instrument = INSTRUMENTS[rawInstrument];

  const limit = clampLimit(typeof params.limit === "string" ? params.limit : null);
  const wantsFilter = typeof params.wants_contact === "string" ? params.wants_contact : "";
  const hasFilter = params.has_contact === "1";
  const filter: "has_contact" | "wants_contact" | null =
    wantsFilter === "yes" && rawInstrument === "participation"
      ? "wants_contact"
      : hasFilter
        ? "has_contact"
        : null;

  const { rows, configured } = await readResponses(instrument.table, limit, filter);

  return (
    <div style={{ minHeight: "100dvh", background: "#051025", color: "#E6EDF7", fontFamily: "monospace", padding: "32px 20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ fontSize: 18, fontWeight: 300, margin: "0 0 4px", color: "#60A5FA" }}>
          {instrument.label} responses
        </h1>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 4px" }}>
          {rows.length} shown{rows.length === limit ? ` (limit ${limit})` : ""}
          {filter ? ` · filtered: ${filter}` : ""} · read-only · not cached
        </p>
        {!configured && (
          <p style={{ fontSize: 11, color: "#d29922", margin: "0 0 4px" }}>
            Database not configured on this deployment.
          </p>
        )}

        <div style={{ margin: "16px 0", display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11 }}>
          <a href="/lab/research-responses?instrument=survey" style={{ color: rawInstrument === "survey" ? "#60A5FA" : "rgba(255,255,255,0.4)" }}>
            Discovery Survey
          </a>
          <a href="/lab/research-responses?instrument=participation" style={{ color: rawInstrument === "participation" ? "#60A5FA" : "rgba(255,255,255,0.4)" }}>
            Research Participation
          </a>
          <a href={`/lab/research-responses?instrument=${rawInstrument}&has_contact=1`} style={{ color: "rgba(255,255,255,0.4)" }}>
            Has contact
          </a>
          {rawInstrument === "participation" && (
            <a href="/lab/research-responses?instrument=participation&wants_contact=yes" style={{ color: "rgba(255,255,255,0.4)" }}>
              Wants contact
            </a>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Date</th>
                {rawInstrument === "survey" ? (
                  <>
                    <th style={th}>Domain</th>
                    <th style={th}>Role</th>
                    <th style={th}>Sensor data</th>
                    <th style={th}>Pain</th>
                    <th style={th}>Interest</th>
                  </>
                ) : (
                  <>
                    <th style={th}>Role</th>
                    <th style={th}>Areas</th>
                    <th style={th}>Physical world</th>
                    <th style={th}>Interests</th>
                    <th style={th}>Wants contact</th>
                  </>
                )}
                <th style={th}>Contact</th>
                <th style={th}>Consent</th>
                <th style={th}>Consent at</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td style={{ ...cell, color: "rgba(255,255,255,0.3)" }} colSpan={10}>
                    No responses.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={String(r.id ?? i)}>
                    <td style={{ ...cell, color: "rgba(255,255,255,0.3)" }}>
                      {r.created_at ? new Date(String(r.created_at)).toLocaleString() : "—"}
                    </td>
                    {rawInstrument === "survey" ? (
                      <>
                        <td style={cell}>{text(r.domain)}</td>
                        <td style={cell}>{text(r.role)}</td>
                        <td style={cell}>{text(r.has_sensor_data)}</td>
                        <td style={cell}>{text(r.pain_point)}</td>
                        <td style={cell}>{text(r.interest)}</td>
                      </>
                    ) : (
                      <>
                        <td style={cell}>{text(r.role)}</td>
                        <td style={cell}>{text(r.areas)}</td>
                        <td style={cell}>{text(r.physical_world)}</td>
                        <td style={cell}>{text(r.interests)}</td>
                        <td style={cell}>{text(r.wants_contact)}</td>
                      </>
                    )}
                    <td style={{ ...cell, color: "#60A5FA" }}>{text(r.contact)}</td>
                    <td style={{ ...cell, color: "rgba(255,255,255,0.3)" }}>{text(r.consent_version)}</td>
                    <td style={{ ...cell, color: "rgba(255,255,255,0.3)" }}>
                      {r.consent_at ? new Date(String(r.consent_at)).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <form method="post" action="/lab/research-responses/logout" style={{ marginTop: 28 }}>
          <button type="submit" style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", padding: "8px 18px", fontSize: 11, cursor: "pointer", borderRadius: 4 }}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

