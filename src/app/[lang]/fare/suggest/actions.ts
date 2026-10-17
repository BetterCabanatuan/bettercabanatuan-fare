"use server";

import { cityBoundary } from "@/lib/data";
import { getDb } from "@/lib/db";
import { formDataToInput, parseSubmission, routeName, type FieldErrors } from "@/lib/routes/submission";

export type SubmitState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: FieldErrors }
  | { status: "failed"; message: string }
  | { status: "received"; reference: string };

export async function submitRoute(_previous: SubmitState, formData: FormData): Promise<SubmitState> {
  // Honeypot: people never see this field, simple bots fill it. Answer as if it worked.
  if (String(formData.get("website") ?? "") !== "") return { status: "received", reference: "------" };

  const parsed = parseSubmission(formDataToInput(formData), cityBoundary);
  if (!parsed.success) return { status: "invalid", fieldErrors: parsed.fieldErrors };

  const { data } = parsed;
  try {
    const { data: submission, error } = await getDb()
      .from("route_submission")
      .insert({
        name: routeName(data.fromName, data.toName),
        fromName: data.fromName,
        fromLat: data.fromLat,
        fromLng: data.fromLng,
        toName: data.toName,
        toLat: data.toLat,
        toLng: data.toLng,
        via: data.via ?? null,
        jeepType: data.jeepType,
        farePaid: data.farePaid ?? null,
        submitterName: data.submitterName ?? null,
        submitterContact: data.submitterContact ?? null,
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
