import { NextResponse, type NextRequest } from "next/server";

import { createAuthClient } from "@/lib/auth";
import { sameSiteUrl } from "@/lib/same-site-url";

/**
 * Google and Facebook send riders back here through Supabase Auth with a PKCE `code`,
 * which is traded for a session cookie. The code verifier was saved as a cookie when
 * sign-in started, so this only works in the browser that started it. A rider who
 * cancels at the provider arrives with `error` instead of a code.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const next = sameSiteUrl(searchParams.get("next") ?? "/feedback", request.url, "/feedback");
  const code = searchParams.get("code");

  const { error } = code
    ? await (await createAuthClient()).auth.exchangeCodeForSession(code)
    : { error: new Error(searchParams.get("error_description") ?? "The sign-in link has no code.") };

  if (error) {
    console.error("[auth] Rider sign-in failed", error.message);
    next.searchParams.set("error", "signin");
  }
  return NextResponse.redirect(next);
}
