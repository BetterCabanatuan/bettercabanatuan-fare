import "server-only";

import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admins";
import { createAuthClient } from "@/lib/auth";

export type Admin = { id: string; email: string };

/** The signed-in admin, or null. Re-checks ADMIN_EMAILS on every call. */
export async function getAdmin(): Promise<Admin | null> {
  const supabase = await createAuthClient();
  // getClaims verifies the session token's signature; getSession would trust the cookie.
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email;
  if (!data || !email || !isAdminEmail(email)) return null;
  return { id: data.claims.sub, email };
}

/** For admin pages and actions: sends anyone else to the sign-in page. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
