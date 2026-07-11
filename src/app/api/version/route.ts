import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    build_time: new Date().toISOString(),
    commit: "0c8c96a",
  });
}
