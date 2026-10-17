"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { isAdminEmail } from "@/lib/admins";
import { getDb } from "@/lib/db";
import { getAdmin } from "@/lib/session";

// Correcting and deleting personal data, for privacy requests (Privacy Policy, "Your
// rights"). Every action re-checks the admin, because Server Actions are public endpoints.

export type AdminResult = { ok: true } | { ok: false; message: string };

/** Records that hold someone's name and contact. */
export type PersonRecord = "feedback" | "toda" | "route";

const SIGNED_OUT: AdminResult = { ok: false, message: "Your session ended. Sign in again." };
const GONE: AdminResult = { ok: false, message: "This record no longer exists. The list has been refreshed." };

const recordSchema = z.enum(["feedback", "toda", "route"]);
const idSchema = z.string().min(1).max(64);
// A blank field erases that detail; feedback emails stay optional for the same reason.
const detail = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);
const detailsSchema = z.object({ name: detail(80), contact: detail(100) });

const done = (changed: number): AdminResult => {
  refresh();
  return changed > 0 ? { ok: true } : GONE;
};

/** Corrects or erases the name and contact on one record. */
export async function updatePersonDetails(
  record: PersonRecord,
  id: string,
  details: { name: string; contact: string },
): Promise<AdminResult> {
  if (!(await getAdmin())) return SIGNED_OUT;
  const parsedRecord = recordSchema.safeParse(record);
  const parsedId = idSchema.safeParse(id);
  const parsed = detailsSchema.safeParse(details);
  if (!parsedRecord.success || !parsedId.success) return { ok: false, message: "Unknown record." };
  if (!parsed.success) return { ok: false, message: "Keep the name to 80 and the contact to 100 characters." };

  const { name, contact } = parsed.data;
  const db = getDb();
  const { data, error } =
    parsedRecord.data === "feedback"
      ? await db.from("feedback").update({ userName: name, userEmail: contact }).eq("id", parsedId.data).select("id")
      : await db
          .from(parsedRecord.data === "toda" ? "toda_submission" : "route_submission")
          .update({ submitterName: name, submitterContact: contact })
          .eq("id", parsedId.data)
          .select("id");
  if (error) throw error;
  return done(data.length);
}

/**
 * Deletes one record. A deleted TODA or route submission leaves its published entry in
 * place: published entries never hold the submitter's details.
 */
export async function deleteRecord(record: PersonRecord, id: string): Promise<AdminResult> {
  if (!(await getAdmin())) return SIGNED_OUT;
  const parsedRecord = recordSchema.safeParse(record);
  const parsedId = idSchema.safeParse(id);
  if (!parsedRecord.success || !parsedId.success) return { ok: false, message: "Unknown record." };

  const table =
    parsedRecord.data === "feedback" ? "feedback" : parsedRecord.data === "toda" ? "toda_submission" : "route_submission";
  const { data, error } = await getDb().from(table).delete().eq("id", parsedId.data).select("id");
  if (error) throw error;
  return done(data.length);
}

/** Deletes a rider's sign-in account; the database deletes their feedback with it. */
export async function deleteAccount(userId: string): Promise<AdminResult> {
  if (!(await getAdmin())) return SIGNED_OUT;
  const parsedId = z.uuid().safeParse(userId);
  if (!parsedId.success) return { ok: false, message: "Unknown account." };

  const db = getDb();
  const { data, error: getError } = await db.auth.admin.getUserById(parsedId.data);
  if (getError || !data.user) return done(0);
  // Checked on the server too, not just hidden in the page: no one deletes an admin here.
  if (isAdminEmail(data.user.email)) {
    return { ok: false, message: "This is an admin account. Remove it from ADMIN_EMAILS before deleting it." };
  }

  const { error } = await db.auth.admin.deleteUser(parsedId.data);
  if (error) throw error;
  return done(1);
}
