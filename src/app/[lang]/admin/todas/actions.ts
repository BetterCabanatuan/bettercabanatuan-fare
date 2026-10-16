"use server";

import { refresh, updateTag } from "next/cache";

import { db } from "@/lib/db";
import { getAdmin } from "@/lib/session";
import { TODA_LIST_TAG } from "@/lib/toda/queries";
import { rejectionSchema, todaSlug } from "@/lib/toda/submission";

export type ReviewResult = { ok: true } | { ok: false; message: string };

const ALREADY_REVIEWED = "Another admin already reviewed this submission. The list has been refreshed.";

/**
 * Marks a pending submission VERIFIED and writes it to the public TODA list in the
 * same transaction. A submission whose name matches an existing TODA updates that
 * entry, so corrections flow through the same review.
 */
export async function approveSubmission(id: string): Promise<ReviewResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, message: "Your session ended. Sign in again." };

  const outcome = await db.$transaction(async (tx) => {
    const submission = await tx.todaSubmission.findUnique({ where: { id } });
    if (!submission || submission.status !== "PENDING") return "stale" as const;

    const slug = todaSlug(submission.name);
    if (!slug) return "unnamed" as const;

    const entry = {
      name: submission.name,
      terminalDescription: submission.terminalDescription,
      barangay: submission.barangay,
      lat: submission.lat,
      lng: submission.lng,
      barangaysServed: submission.barangaysServed,
      units: submission.units,
      officialContact: submission.officialContact,
      lastVerified: new Date(),
    };
    // A correction only replaces what it supplies; blank optional fields keep the listed values.
    await tx.toda.upsert({
      where: { id: slug },
      create: { id: slug, ...entry },
      update: {
        ...entry,
        lat: entry.lat ?? undefined,
        lng: entry.lng ?? undefined,
        barangaysServed: entry.barangaysServed.length ? entry.barangaysServed : undefined,
        units: entry.units ?? undefined,
        officialContact: entry.officialContact ?? undefined,
      },
    });

    // Conditional update so two admins approving at once can't both win.
    const { count } = await tx.todaSubmission.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "VERIFIED", reviewedAt: new Date(), reviewedById: admin.id, todaId: slug },
    });
    if (count !== 1) throw new StaleReview();
    return "verified" as const;
  }).catch((error: unknown) => {
    if (error instanceof StaleReview) return "stale" as const;
    throw error;
  });

  refresh();
  if (outcome === "stale") return { ok: false, message: ALREADY_REVIEWED };
  if (outcome === "unnamed") return { ok: false, message: "This name has no letters or numbers to file it under. Reject it instead." };

  updateTag(TODA_LIST_TAG);
  return { ok: true };
}

export async function rejectSubmission(id: string, reason: string): Promise<ReviewResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, message: "Your session ended. Sign in again." };

  const parsed = rejectionSchema.safeParse(reason);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const { count } = await db.todaSubmission.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "REJECTED", rejectionReason: parsed.data, reviewedAt: new Date(), reviewedById: admin.id },
  });

  refresh();
  return count === 1 ? { ok: true } : { ok: false, message: ALREADY_REVIEWED };
}

class StaleReview extends Error {}
