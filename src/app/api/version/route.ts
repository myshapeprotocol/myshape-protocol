export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ commit: "c591188", time: Date.now() });
}
