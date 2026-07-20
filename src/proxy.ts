import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") || "";

  // Force HTTPS redirect
  if (req.headers.get("x-forwarded-proto") === "http") {
    const httpsUrl = req.url.replace("http://", "https://");
    return NextResponse.redirect(httpsUrl, 301);
  }

  // Route thecontinuitylab.org → /lab (only for page requests, not static files)
  if (host === "thecontinuitylab.org" || host === "www.thecontinuitylab.org") {
    const path = req.nextUrl.pathname;
    // Don't rewrite static assets
    if (/\.(png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?|ttf|eot|css|js|json|xml|txt|map)$/i.test(path)) {
      return NextResponse.next();
    }
    // Don't rewrite sub-paths under /lab (like /lab/playground)
    if (path.startsWith("/lab/")) {
      const url = req.nextUrl.clone();
      url.pathname = path;
      return NextResponse.rewrite(url);
    }
    // Everything else → /lab
    const url = req.nextUrl.clone();
    url.pathname = "/lab";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  proxy: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|identity-sigil.jpg).*)"],
};
