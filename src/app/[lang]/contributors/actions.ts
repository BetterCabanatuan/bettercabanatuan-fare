"use server";

import { refresh } from "next/cache";

import { getDb } from "@/lib/db";
import { parsePublicName, type PublicNameErrorKey } from "@/lib/routes/contributors";
import { getRider } from "@/lib/session";

export type PublicNameState =
  | { status: "idle" }
  | { status: "invalid"; error: PublicNameErrorKey }
  | { status: "signedOut" }
  | { status: "failed" }
  | { status: "saved"; name: string | null };

/**
 * Sets the signed-in rider's name on the contributors board. The "Use Anonymous rider"
 * button posts `intent=clear`, which removes it.
 */
export async function setPublicName(_previous: PublicNameState, formData: FormData): Promise<PublicNameState> {
  const rider = await getRider();
  if (!rider) return { status: "signedOut" };

  const clear = formData.get("intent") === "clear";
  const parsed = clear ? null : parsePublicName(String(formData.get("publicName") ?? ""));
  if (parsed && !parsed.success) return { status: "invalid", error: parsed.error };
  const name = parsed ? parsed.name : null;

  try {
    const { error } = await getDb().from("contributor").upsert({ userId: rider.id, publicName: name });
    if (error) throw error;
  } catch (error) {
    console.error("[contributors] Could not save public name", error);
    return { status: "failed" };
  }
  refresh();
  return { status: "saved", name };
}
