import "server-only";

import { getDb, type SubmissionStatus } from "@/lib/db";
import type { Tables } from "@/lib/database-types";
import { connectedTerminalsSchema, type ConnectedTerminal } from "@/lib/toda/terminals";

export type TodaListItem = {
  id: string;
  name: string;
  terminalDescription: string;
  barangay: string;
  lat: number | null;
  lng: number | null;
  connectedTerminals: ConnectedTerminal[];
  barangaysServed: string[];
  units: number | null;
  officialContact: string | null;
  source: string;
  lastVerified: string;
};

const TODA_COLUMNS =
  "id, name, terminalDescription, barangay, lat, lng, connectedTerminals, barangaysServed, units, officialContact, source, lastVerified";

type TodaRow = Omit<Tables<"toda">, "createdAt" | "updatedAt">;

function toListItem({ lastVerified, barangaysServed, connectedTerminals, ...toda }: TodaRow): TodaListItem {
  // JSONB arrives untyped. A malformed list is dropped rather than shown half-read.
  const terminals = connectedTerminalsSchema.safeParse(connectedTerminals);
  if (!terminals.success) console.error(`[toda] Ignoring malformed connectedTerminals on ${toda.id}`, terminals.error);
  return {
    ...toda,
    connectedTerminals: terminals.success ? terminals.data : [],
    barangaysServed: barangaysServed ?? [],
    lastVerified: new Date(lastVerified).toISOString().slice(0, 10),
  };
}

/**
 * Verified TODAs for the public directory, read on every request so an approval shows at
 * once. Returns [] when the database is unreachable so /toda renders its empty state
 * instead of an error page.
 */
export async function listVerifiedTodas(): Promise<TodaListItem[]> {
  try {
    const { data, error } = await getDb().from("toda").select(TODA_COLUMNS).order("name");
    if (error) throw error;
    return data.map(toListItem);
  } catch (error) {
    // Also catches a missing key, which getDb() throws before any request is made.
    console.error("Could not load the TODA directory", error);
    return [];
  }
}

/** One listed TODA, or null when there is no TODA with this id. */
export async function getToda(id: string): Promise<TodaListItem | null> {
  const { data, error } = await getDb().from("toda").select(TODA_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data && toListItem(data);
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

/** The admin TODA page's tabs: the review queue by status, plus the published list. */
export type AdminTodaTab = SubmissionStatus | "PUBLISHED";

export async function countAdminTabs(): Promise<Record<AdminTodaTab, number>> {
  const count = async (status: SubmissionStatus) => {
    const { count, error } = await getDb()
      .from("toda_submission")
      .select("*", { count: "exact", head: true })
      .eq("status", status);
    if (error) throw error;
    return count ?? 0;
  };
  const countPublished = async () => {
    const { count, error } = await getDb().from("toda").select("*", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  };
  const [PENDING, VERIFIED, REJECTED, PUBLISHED] = await Promise.all([
    count("PENDING"),
    count("VERIFIED"),
    count("REJECTED"),
    countPublished(),
  ]);
  return { PENDING, VERIFIED, REJECTED, PUBLISHED };
}
