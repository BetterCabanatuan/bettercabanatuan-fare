"use server";

import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admins";
import { createAuthClient } from "@/lib/auth";
import { siteUrl } from "@/lib/site";

export type SignInResult = { ok: true } | { ok: false; message: string };

/**
 * Emails a one-time sign-in link through Supabase Auth. Only ADMIN_EMAILS get one, and
 * only they get an account created on first sign-in.
 */
export async function sendSignInLink(email: string): Promise<SignInResult> {
  const address = email.trim();
  if (!/^\S+@\S+\.\S+$/.test(address)) return { ok: false, message: "Enter the email address you use as an admin." };

  // Non-admins get the same "check your email" answer but nothing is sent, so the form
  // doesn't reveal which addresses are admins.
  if (!isAdminEmail(address)) return { ok: true };

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: address,
    options: { emailRedirectTo: new URL("/api/auth/confirm?next=/admin/todas", siteUrl).href },
  });
  if (error) {
    console.error("[auth] Could not send the sign-in link", error);
    return {
      ok: false,
      message:
        error.status === 429
          ? "Too many tries. Wait a minute, then try again."
          : "We couldn't send the link. Try again in a moment.",
    };
  }
  return { ok: true };
}

export async function signOut(): Promise<never> {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
