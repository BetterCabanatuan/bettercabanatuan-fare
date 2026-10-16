import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { SubmissionStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/** Cache tag for the public list; admin approvals expire it. */
export const TODA_LIST_TAG = "todas";

export type TodaListItem = {
  id: string;
  name: string;
  terminalDescription: string;
  barangay: string;
  lat: number | null;
  lng: number | null;
  barangaysServed: string[];
  units: number | null;
  officialContact: string | null;
  source: string;
  lastVerified: string;
};

/** Verified TODAs for the public directory. */
export async function listVerifiedTodas(): Promise<TodaListItem[]> {
  "use cache";
  cacheTag(TODA_LIST_TAG);
  cacheLife("hours");

  const rows = await db.toda.findMany({
    orderBy: { name: "asc" },
    omit: { createdAt: true, updatedAt: true },
  });
  return rows.map(({ lastVerified, ...toda }) => ({
    ...toda,
    lastVerified: lastVerified.toISOString().slice(0, 10),
  }));
}

/** Review queue for admins. Not cached: admins need to see new submissions at once. */
export async function listSubmissions(status: SubmissionStatus) {
  const submissions = await db.todaSubmission.findMany({
    where: { status },
    orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
    take: 100,
    include: { reviewedBy: { select: { email: true } } },
  });
  const existingIds = new Set(
    (await db.toda.findMany({ select: { id: true } })).map((toda) => toda.id),
  );
  return { submissions, existingIds };
}

export async function countSubmissions() {
  const groups = await db.todaSubmission.groupBy({ by: ["status"], _count: true });
  const counts: Record<SubmissionStatus, number> = { PENDING: 0, VERIFIED: 0, REJECTED: 0 };
  for (const group of groups) counts[group.status] = group._count;
  return counts;
}
