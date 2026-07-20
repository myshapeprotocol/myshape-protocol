import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") || "";

  // Route thecontinuitylab.org → /lab
  if (host === "thecontinuitylab.org" || host === "www.thecontinuitylab.org") {
    const url = req.nextUrl.clone();
    if (url.pathname === "/") {
      url.pathname = "/lab";
      return NextResponse.rewrite(url);
    }
    // For all other paths on the lab domain, also map to /lab
    return NextResponse.rewrite(new URL("/lab", req.url));
  }

  return NextResponse.next();
}

export const config = {
  proxy: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|identity-sigil.jpg).*)"],
};
