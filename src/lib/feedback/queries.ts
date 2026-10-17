import "server-only";

import { getDb } from "@/lib/db";
import type { Enums } from "@/lib/database-types";

export type FeedbackStatus = Enums<"FeedbackStatus">;

export async function listFeedback(status: FeedbackStatus) {
  const { data, error } = await getDb()
    .from("feedback")
    .select()
    .eq("status", status)
    // New feedback oldest first, so nothing waits forever; resolved newest first.
    .order("createdAt", { ascending: status === "NEW" })
    .limit(100);
  if (error) throw error;
  return data.map((feedback) => ({
    ...feedback,
    createdAt: new Date(feedback.createdAt),
    resolvedAt: feedback.resolvedAt === null ? null : new Date(feedback.resolvedAt),
  }));
}

export async function countFeedback(): Promise<Record<FeedbackStatus, number>> {
  const count = async (status: FeedbackStatus) => {
    const { count, error } = await getDb()
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .eq("status", status);
    if (error) throw error;
    return count ?? 0;
  };
  const [NEW, RESOLVED] = await Promise.all([count("NEW"), count("RESOLVED")]);
  return { NEW, RESOLVED };
}
