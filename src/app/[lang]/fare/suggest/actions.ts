"use server";

import { cityBoundary } from "@/lib/data";
import { getDb } from "@/lib/db";
import {
  SUBMISSION_LIMITS,
  formDataToInput,
  parseSubmission,
  routeName,
  type FieldErrors,
} from "@/lib/routes/submission";
import { getRider } from "@/lib/session";

export type SubmitState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: FieldErrors }
  | { status: "signedOut" }
  | { status: "tooMany" }
  | { status: "failed"; message: string }
  | { status: "received"; reference: string };

export async function submitRoute(_previous: SubmitState, formData: FormData): Promise<SubmitState> {
  const rider = await getRider();
  if (!rider) return { status: "signedOut" };

  const parsed = parseSubmission(formDataToInput(formData), cityBoundary);
  if (!parsed.success) return { status: "invalid", fieldErrors: parsed.fieldErrors };

  const { data } = parsed;
  try {
    const db = getDb();
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await db
      .from("route_submission")
      .select("id", { count: "exact", head: true })
      .eq("userId", rider.id)
      .gte("createdAt", hourAgo);
    if (countError) throw countError;
    if ((count ?? 0) >= SUBMISSION_LIMITS.perHour) return { status: "tooMany" };

    const { data: submission, error } = await db
      .from("route_submission")
      .insert({
        name: routeName(data.fromName, data.toName),
        fromName: data.fromName,
        fromLat: data.fromLat,
        fromLng: data.fromLng,
        toName: data.toName,
        toLat: data.toLat,
        toLng: data.toLng,
        waypoints: data.waypoints,
        via: data.via ?? null,
        jeepType: data.jeepType,
        farePaid: data.farePaid ?? null,
        // From the Google or Facebook account. Admins read them here, and the privacy
        // lookup searches them, just as it did when riders typed them in.
        userId: rider.id,
        provider: rider.provider,
        submitterName: rider.name,
        submitterContact: rider.email,
        notes: data.notes ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { status: "received", reference: submission.id.slice(-6).toUpperCase() };
  } catch (error) {
    console.error("[routes] Could not save suggestion", error);
    // The form shows this in the reader's language; the English copy is for anything
    // that reads the state without a dictionary.
    return { status: "failed", message: "We couldn't save your suggestion. Please try again in a few minutes." };
  }
}
