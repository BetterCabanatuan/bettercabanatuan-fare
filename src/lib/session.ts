import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admins";
import { auth } from "@/lib/auth";

export type Admin = { id: string; email: string; name: string };

/** The signed-in admin, or null. Re-checks ADMIN_EMAILS on every call. */
export async function getAdmin(): Promise<Admin | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdminEmail(session.user.email)) return null;
  return { id: session.user.id, email: session.user.email, name: session.user.name };
}

/** For admin pages and actions: sends anyone else to the sign-in page. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
