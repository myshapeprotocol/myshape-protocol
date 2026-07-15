// ═══════════════════════════════════════════════════════════════
// PE-001 Session API — shared session storage
// Phone POSTs IMU data, desktop GETs it by session ID.
// In-memory only — clears on server restart. Max 50 sessions.
// ═══════════════════════════════════════════════════════════════

interface IMUSample {
  t: number; ax: number; ay: number; az: number; rx: number; ry: number; rz: number; interval: number;
}

interface SessionData {
  imuSamples: IMUSample[];
  uploadedAt: number;
}

const store = new Map<string, SessionData>();

// Cleanup old sessions (>5 min)
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store) {
    if (now - v.uploadedAt > 300_000) store.delete(k);
  }
}, 60_000);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  // If no specific ID, return the most recent upload
  if (!id) {
    if (store.size === 0) return Response.json({ ready: false });
    const newest = [...store.entries()].sort((a, b) => b[1].uploadedAt - a[1].uploadedAt)[0];
    if (!newest) return Response.json({ ready: false });
    store.delete(newest[0]);
    return Response.json({ ready: true, imuSamples: newest[1].imuSamples });
  }

  const data = store.get(id);
  if (!data) return Response.json({ ready: false });

  store.delete(id);
  return Response.json({ ready: true, imuSamples: data.imuSamples });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { id, imuSamples } = payload;
    if (!id || !imuSamples || !Array.isArray(imuSamples)) {
      return Response.json({ error: "missing id or imuSamples" }, { status: 400 });
    }
    if (store.size >= 50) {
      // evict oldest
      const oldest = [...store.entries()].sort((a, b) => a[1].uploadedAt - b[1].uploadedAt)[0];
      if (oldest) store.delete(oldest[0]);
    }
    store.set(id, { imuSamples, uploadedAt: Date.now() });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
}
