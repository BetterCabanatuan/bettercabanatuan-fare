import "server-only";

import { getDb, type SubmissionStatus } from "@/lib/db";

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

/**
 * Verified TODAs for the public directory, read on every request so an approval shows at
 * once. Returns [] when the database is unreachable so /toda renders its empty state
 * instead of an error page.
 */
export async function listVerifiedTodas(): Promise<TodaListItem[]> {
  try {
    const { data, error } = await getDb()
      .from("toda")
      .select("id, name, terminalDescription, barangay, lat, lng, barangaysServed, units, officialContact, source, lastVerified")
      .order("name");
    if (error) throw error;
    return data.map(({ lastVerified, barangaysServed, ...toda }) => ({
      ...toda,
      barangaysServed: barangaysServed ?? [],
      lastVerified: new Date(lastVerified).toISOString().slice(0, 10),
    }));
  } catch (error) {
    // Also catches a missing key, which getDb() throws before any request is made.
    console.error("Could not load the TODA directory", error);
    return [];
  }
}

/** Review queue for admins. Not cached: admins need to see new submissions at once. */
export async function listSubmissions(status: SubmissionStatus) {
  const db = getDb();
  const [submissions, todas] = await Promise.all([
    db
      .from("toda_submission")
      .select()
      .eq("status", status)
      .order("createdAt", { ascending: status === "PENDING" })
      .limit(100),
    db.from("toda").select("id"),
  ]);
  if (submissions.error) throw submissions.error;
  if (todas.error) throw todas.error;
  return {
    submissions: submissions.data.map((submission) => ({
      ...submission,
      barangaysServed: submission.barangaysServed ?? [],
      createdAt: new Date(submission.createdAt),
      reviewedAt: submission.reviewedAt === null ? null : new Date(submission.reviewedAt),
    })),
    existingIds: new Set(todas.data.map((toda) => toda.id)),
  };
}

export async function countSubmissions(): Promise<Record<SubmissionStatus, number>> {
  const count = async (status: SubmissionStatus) => {
    const { count, error } = await getDb()
      .from("toda_submission")
      .select("*", { count: "exact", head: true })
      .eq("status", status);
    if (error) throw error;
    return count ?? 0;
  };
  const [PENDING, VERIFIED, REJECTED] = await Promise.all([count("PENDING"), count("VERIFIED"), count("REJECTED")]);
  return { PENDING, VERIFIED, REJECTED };
}
