import { NextResponse, type NextRequest } from "next/server";

// English keeps the short, existing URLs (/fare); Tagalog lives under /tl (/tl/fare).
// Both are served from app/[lang], so unprefixed paths are rewritten to /en internally.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/tl" || pathname.startsWith("/tl/")) return NextResponse.next();

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    // One public URL per page: send /en/... to the unprefixed address.
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals and files such as /sitemap.xml, /robots.txt and /favicon.ico.
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
