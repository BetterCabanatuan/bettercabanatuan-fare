import { NextResponse, type NextRequest } from "next/server";

import { createAuthClient } from "@/lib/auth";

/**
 * The sign-in link lands here and trades its token for a session cookie. The magic-link
 * template in docs/deploy/supabase.md sends a `token_hash`, which works on any device.
 * Supabase's default template sends a PKCE `code` instead, which only works in the
 * browser that asked for the link; both are accepted.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const code = searchParams.get("code");
  const supabase = await createAuthClient();

  const { error } = tokenHash
    ? await supabase.auth.verifyOtp({ type: "email", token_hash: tokenHash })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("The link has no token.") };

  if (error) return NextResponse.redirect(new URL("/admin/login?error=link", request.url));
  return NextResponse.redirect(sameSite(searchParams.get("next") ?? "/admin/todas", request.url));
}

// Resolved and checked rather than string-matched: "//evil.example" and "/\evil.example"
// both leave the site. Falling back keeps the link from becoming an open redirect.
function sameSite(next: string, base: string): URL {
  const url = new URL(next, base);
  return url.origin === new URL(base).origin ? url : new URL("/admin/todas", base);
}
