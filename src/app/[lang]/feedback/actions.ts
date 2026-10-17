"use server";

import { redirect } from "next/navigation";

import { createAuthClient } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { feedbackPath, formDataToInput, parseFeedback, sitePath, type FieldErrors } from "@/lib/feedback/submission";
import { hasLocale, type Locale } from "@/lib/i18n/locales";
import { getRider } from "@/lib/session";
import { siteUrl } from "@/lib/site";

export type FeedbackState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: FieldErrors }
  | { status: "signedOut" }
  | { status: "tooMany" }
  | { status: "failed" }
  | { status: "received"; reference: string };

// Enough for a rider with a real problem; stops one account from flooding the admins.
const MAX_PER_HOUR = 5;

const PROVIDERS = ["google", "facebook"] as const;
type Provider = (typeof PROVIDERS)[number];

const isProvider = (value: string): value is Provider => PROVIDERS.some((provider) => provider === value);

// Root params don't reach Server Actions, so the form posts the locale and it is checked here.
const localeFrom = (formData: FormData): Locale => {
  const locale = String(formData.get("locale") ?? "");
  return hasLocale(locale) ? locale : "en";
};

// Where a rider lands after signing in or out: the page whose form they used (`returnTo`,
// e.g. /tl/fare/suggest), or else the feedback page with the page they came from.
const backFrom = (formData: FormData): string =>
  sitePath(String(formData.get("returnTo") ?? "")) ??
  feedbackPath(localeFrom(formData), String(formData.get("from") ?? ""));

/**
 * Starts Google or Facebook sign-in through Supabase Auth. The PKCE code verifier is saved
 * as a cookie here; /api/auth/callback trades the returned code for a session and sends
 * the rider back to the page they started from.
 */
export async function signInWithProvider(formData: FormData): Promise<never> {
  const back = backFrom(formData);
  const provider = String(formData.get("provider") ?? "");
  if (!isProvider(provider)) redirect(back);

  const callback = new URL("/api/auth/callback", siteUrl);
  callback.searchParams.set("next", back);
  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: callback.href },
  });
  if (error || !data.url) {
    console.error("[auth] Could not start rider sign-in", error);
    redirect(`${back}${back.includes("?") ? "&" : "?"}error=signin`);
  }
  redirect(data.url);
}

export async function signOutRider(formData: FormData): Promise<never> {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect(backFrom(formData));
}

export async function submitFeedback(_previous: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const rider = await getRider();
  if (!rider) return { status: "signedOut" };

  const parsed = parseFeedback(formDataToInput(formData));
  if (!parsed.success) return { status: "invalid", fieldErrors: parsed.fieldErrors };

  try {
    const db = getDb();
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await db
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("userId", rider.id)
      .gte("createdAt", hourAgo);
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_PER_HOUR) return { status: "tooMany" };

    const { data, error } = await db
      .from("feedback")
      .insert({
        userId: rider.id,
        userEmail: rider.email,
        userName: rider.name,
        provider: rider.provider,
        topic: parsed.data.topic,
        message: parsed.data.message,
        pagePath: parsed.data.pagePath ?? null,
        locale: localeFrom(formData),
      })
      .select("id")
      .single();
    if (error) throw error;
    return { status: "received", reference: data.id.slice(-6).toUpperCase() };
  } catch (error) {
    console.error("[feedback] Could not save feedback", error);
    return { status: "failed" };
  }
}
