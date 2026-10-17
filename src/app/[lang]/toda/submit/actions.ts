"use server";

import { cityBoundary } from "@/lib/data";
import { getDb } from "@/lib/db";
import { formDataToInput, parseSubmission, type FieldErrors } from "@/lib/toda/submission";

export type SubmitState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: FieldErrors }
  | { status: "failed"; message: string }
  | { status: "received"; reference: string };

export async function submitToda(_previous: SubmitState, formData: FormData): Promise<SubmitState> {
  // Honeypot: people never see this field, simple bots fill it. Answer as if it worked.
  if (String(formData.get("website") ?? "") !== "") return { status: "received", reference: "------" };

  const parsed = parseSubmission(formDataToInput(formData), cityBoundary);
  if (!parsed.success) return { status: "invalid", fieldErrors: parsed.fieldErrors };

  const { data } = parsed;
  try {
    const { data: submission, error } = await getDb()
      .from("toda_submission")
      .insert({
        name: data.name,
        terminalDescription: data.terminalDescription,
        barangay: data.barangay,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        barangaysServed: data.barangaysServed,
        units: data.units ?? null,
        officialContact: data.officialContact ?? null,
        submitterName: data.submitterName ?? null,
        submitterContact: data.submitterContact ?? null,
        notes: data.notes ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { status: "received", reference: submission.id.slice(-6).toUpperCase() };
  } catch (error) {
    console.error("[toda] Could not save submission", error);
    return { status: "failed", message: "We couldn't save your submission. Please try again in a few minutes." };
  }
}
