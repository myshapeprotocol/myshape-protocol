import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getResponses() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return [];
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/discovery_survey?select=*&order=created_at.desc&limit=100`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function ResponsesPage() {
  // P0-HOTFIX-1: 此页面曾以 service-role key 公开渲染全部问卷回执（含 contact PII）。
  // 生产环境一律 404 —— 匿名请求不得获得任何 survey responses（service key 不得外流）。
  // guard 位于任何数据获取之前。
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const rows = await getResponses();

  return (
    <div style={{ minHeight: "100dvh", background: "#051025", color: "#E6EDF7", fontFamily: "monospace", padding: "40px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, fontWeight: 300, color: "#60A5FA", margin: "0 0 8px" }}>Survey Responses</h1>
        <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 32px" }}>
          {rows.length} response{rows.length !== 1 ? "s" : ""} · <a href="/lab" style={{ color: "rgba(255,255,255,0.4)" }}>Lab Home</a> · <a href="/lab/discovery-survey" style={{ color: "#60A5FA" }}>← Back to survey</a>
        </p>

        {rows.length === 0 ? (
          <p style={{ color: "#64748B", fontSize: 13 }}>No responses yet. The database table may need to be created — run the migration in Supabase Dashboard.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>Date</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>Domain</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>Role</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>Sensor Data</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>Pain</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>Solution</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>Interest</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>Contact</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any, i: number) => (
                  <tr key={r.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                    <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.6)" }}>{r.domain || "—"}</td>
                    <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.5)" }}>{r.role || "—"}</td>
                    <td style={{ padding: "8px 12px" }}>{r.has_sensor_data ? <span style={{ color: r.has_sensor_data.includes("extensively") ? "#34D399" : r.has_sensor_data === "No" ? "#f85149" : "#d29922" }}>{r.has_sensor_data}</span> : "—"}</td>
                    <td style={{ padding: "8px 12px" }}>{r.pain_point ? <span style={{ color: r.pain_point === "Frequently" || r.pain_point === "Occasionally" ? "#f85149" : "#64748B" }}>{r.pain_point}</span> : "—"}</td>
                    <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.5)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.solution || "—"}</td>
                    <td style={{ padding: "8px 12px" }}>{r.interest ? <span style={{ color: r.interest.includes("Yes") ? "#34D399" : "#64748B" }}>{r.interest}</span> : "—"}</td>
                    <td style={{ padding: "8px 12px", color: "#60A5FA" }}>{r.contact || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
