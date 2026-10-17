"use server";

import { refresh } from "next/cache";

import { cityBoundary } from "@/lib/data";
import { getDb } from "@/lib/db";
import { getAdmin } from "@/lib/session";
import { rejectionSchema, todaSlug } from "@/lib/toda/submission";
import { formDataToTerminals, parseTerminals } from "@/lib/toda/terminals";

export type ReviewResult = { ok: true } | { ok: false; message: string };

const ALREADY_REVIEWED = "Another admin already reviewed this submission. The list has been refreshed.";

/**
 * Marks a pending submission VERIFIED and writes it to the public TODA list in one
 * database transaction (approve_toda_submission in supabase/migrations). A submission
 * whose name matches an existing TODA updates that entry, so corrections flow through
 * the same review.
 */
export async function approveSubmission(id: string): Promise<ReviewResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, message: "Your session ended. Sign in again." };

  const db = getDb();
  const { data: submission, error } = await db
    .from("toda_submission")
    .select("name")
    .eq("id", id)
    .eq("status", "PENDING")
    .maybeSingle();
  if (error) throw error;

  refresh();
  if (!submission) return { ok: false, message: ALREADY_REVIEWED };

  const slug = todaSlug(submission.name);
  if (!slug) return { ok: false, message: "This name has no letters or numbers to file it under. Reject it instead." };

  // Returns false when another admin reviewed it since the read above.
  const { data: verified, error: approveError } = await db.rpc("approve_toda_submission", {
    submission_id: id,
    toda_id: slug,
    reviewer_email: admin.email,
  });
  if (approveError) throw approveError;
  return verified ? { ok: true } : { ok: false, message: ALREADY_REVIEWED };
}

export async function rejectSubmission(id: string, reason: string): Promise<ReviewResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, message: "Your session ended. Sign in again." };

  const parsed = rejectionSchema.safeParse(reason);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  // Conditional on PENDING so two admins reviewing at once can't both win.
  const { data, error } = await getDb()
    .from("toda_submission")
    .update({
      status: "REJECTED",
      rejectionReason: parsed.data,
      reviewedAt: new Date().toISOString(),
      reviewedByEmail: admin.email,
    })
    .eq("id", id)
    .eq("status", "PENDING")
    .select("id");
  if (error) throw error;

  refresh();
  return data.length === 1 ? { ok: true } : { ok: false, message: ALREADY_REVIEWED };
}

/**
 * Replaces every position of a listed TODA: the first posted terminal becomes the main
 * one, the rest its connected terminals. One UPDATE, so a half-saved edit can't happen.
 */
export async function saveTerminals(id: string, formData: FormData): Promise<ReviewResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, message: "Your session ended. Sign in again." };

  const parsed = parseTerminals(formDataToTerminals(formData), cityBoundary);
  if (!parsed.success) return { ok: false, message: `Terminal ${parsed.index + 1}: ${parsed.message}` };

  const { data, error } = await getDb()
    .from("toda")
    .update({ ...parsed.main, connectedTerminals: parsed.connected })
    .eq("id", id)
    .select("id");
  if (error) throw error;

  refresh();
  return data.length === 1 ? { ok: true } : { ok: false, message: "This TODA is no longer listed." };
}
