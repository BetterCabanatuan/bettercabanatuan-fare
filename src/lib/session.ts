import "server-only";

import type { JwtPayload } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { isAdminEmail, startedWithOAuth } from "@/lib/admins";
import { createAuthClient } from "@/lib/auth";

export type Admin = { id: string; email: string };

/** A rider signed in to send feedback. Name and email come from Google or Facebook. */
export type Rider = { id: string; email: string | null; name: string | null; provider: string };

async function getClaims(): Promise<JwtPayload | null> {
  const supabase = await createAuthClient();
  // getClaims verifies the session token's signature; getSession would trust the cookie.
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
}

/** The signed-in admin, or null. Re-checks ADMIN_EMAILS on every call. */
export async function getAdmin(): Promise<Admin | null> {
  const claims = await getClaims();
  const email = claims?.email;
  // A Google or Facebook session never counts, even with an admin's address (see startedWithOAuth).
  if (!claims || !email || !isAdminEmail(email) || startedWithOAuth(claims.amr)) return null;
  return { id: claims.sub, email };
}

/** For admin pages and actions: sends anyone else to the sign-in page. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** Whoever is signed in, admin or rider, or null. */
export async function getRider(): Promise<Rider | null> {
  const claims = await getClaims();
  if (!claims) return null;
  // Google sends full_name, Facebook sends name; both are optional in the token.
  const name: unknown = claims.user_metadata?.full_name ?? claims.user_metadata?.name;
  const provider: unknown = claims.app_metadata?.provider;
  return {
    id: claims.sub,
    email: claims.email || null,
    name: typeof name === "string" && name.trim() ? name.trim() : null,
    provider: typeof provider === "string" ? provider : "unknown",
  };
}
