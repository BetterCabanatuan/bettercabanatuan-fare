import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// English keeps the short, existing URLs (/fare); Tagalog lives under /tl (/tl/fare).
// Both are served from app/[lang], so unprefixed paths are rewritten to /en internally.
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    // One public URL per page: send /en/... to the unprefixed address.
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  const isTagalog = pathname === "/tl" || pathname.startsWith("/tl/");
  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  // Passing `request` forwards cookies a session refresh rewrote, so the page sees them.
  const respond = () => (isTagalog ? NextResponse.next({ request }) : NextResponse.rewrite(url, { request }));

  // Admin pages and the feedback page read the Supabase session; other pages never do.
  const readsSession = /^(\/tl)?\/(admin|feedback)(\/|$)/.test(pathname);
  return readsSession ? refreshSession(request, respond) : respond();
}

/**
 * Refreshes the admin's or rider's Supabase session and saves the new tokens as cookies.
 * Server Components can't write cookies, so without this they would be signed out once
 * the access token expires. Other pages skip it and stay free of auth round trips.
 */
async function refreshSession(request: NextRequest, respond: () => NextResponse): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) return respond();

  // Reassigned when Supabase writes cookies, because the response must be built after
  // the request cookies change.
  let response = respond();
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = respond();
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  // Skip Next internals and files such as /sitemap.xml, /robots.txt and /favicon.ico.
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
