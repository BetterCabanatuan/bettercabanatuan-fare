import "server-only";

import { z } from "zod";

import type { Json, Tables } from "@/lib/database-types";
import { getDb, type SubmissionStatus } from "@/lib/db";
import type { LngLat } from "@/lib/geo";
import type { JeepRoute } from "@/lib/jeep-routes";
import type { RouteStop } from "@/lib/routes/waypoints";
import { todaSlug } from "@/lib/toda/submission";

/** Prefix that keeps community ids apart from the preset ids in data/jeepney/routes.json. */
export const COMMUNITY_ROUTE_ID_PREFIX = "community-";

/** Map id for a route: "Cabanatuan – Talavera" → "cabanatuan-talavera". Same rules as TODAs. */
export const routeSlug = (name: string): string => todaSlug(name);

// `line` is stored as JSON, so it is checked before anything draws it.
const lineSchema = z.array(z.tuple([z.number(), z.number()])).min(2);

/**
 * Verified community routes, in the same shape as the presets so the planner and map
 * treat them alike. Read on every request so an approval shows at once. Returns [] when
 * the database is unreachable so /fare still renders.
 */
export async function listVerifiedRoutes(): Promise<JeepRoute[]> {
  try {
    const { data: rows, error } = await getDb().from("community_jeep_route").select().order("name");
    if (error) throw error;
    return rows.flatMap((row) => {
      const parsed = lineSchema.safeParse(row.line);
      if (!parsed.success) {
        console.error(`Community route ${row.id} has a malformed line; skipping it`);
        return [];
      }
      return [toJeepRoute(row, parsed.data)];
    });
  } catch (error) {
    // Also catches a missing key, which getDb() throws before any request is made.
    console.error("Could not load community jeepney routes", error);
    return [];
  }
}

function toJeepRoute(row: Tables<"community_jeep_route">, line: LngLat[]): JeepRoute {
  const start = line[0];
  const end = line[line.length - 1];
  return {
    id: COMMUNITY_ROUTE_ID_PREFIX + row.id,
    name: row.name,
    via: row.via ?? "",
    // Fares differ by jeep type and the planner needs one; UNKNOWN is priced as
    // traditional, the cheaper and more common kind.
    type: row.jeepType === "MODERN" ? "modern" : "traditional",
    terminal: row.fromName,
    terminalPosition: start,
    source: "Resident submission, verified by an admin",
    origin: "community",
    status: "approximate",
    verifiedOn: new Date(row.verifiedOn).toISOString().slice(0, 10),
    reportedFare: row.farePaid ?? undefined,
    directions: [
      { id: "outbound", label: `To ${row.toName}`, line },
      { id: "return", label: `To ${row.fromName}`, line: [...line].reverse() },
    ],
    stops: [
      { name: row.fromName, km: 0, position: start },
      { name: row.toName, km: row.distanceKm, position: end },
    ],
  };
}

/** Review queue for admins. Not cached: admins need to see new submissions at once. */
export async function listRouteSubmissions(status: SubmissionStatus) {
  const db = getDb();
  const [submissions, routes] = await Promise.all([
    db
      .from("route_submission")
      .select()
      .eq("status", status)
      .order("createdAt", { ascending: status === "PENDING" })
      .limit(100),
    db.from("community_jeep_route").select("id"),
  ]);
  if (submissions.error) throw submissions.error;
  if (routes.error) throw routes.error;
  const records = await senderRecords(submissions.data.flatMap((submission) => submission.userId ?? []));
  return {
    submissions: submissions.data.map((submission) => ({
      ...submission,
      stops: toStops(submission.id, submission.waypoints),
      senderRecord: submission.userId ? records.get(submission.userId) : undefined,
      createdAt: new Date(submission.createdAt),
      reviewedAt: submission.reviewedAt === null ? null : new Date(submission.reviewedAt),
    })),
    existingIds: new Set(routes.data.map((route) => route.id)),
  };
}

export type SenderRecord = Record<SubmissionStatus, number>;

/** How each sender's route suggestions went so far, so admins can weigh a new one. */
async function senderRecords(userIds: string[]): Promise<Map<string, SenderRecord>> {
  if (userIds.length === 0) return new Map();
  const { data, error } = await getDb()
    .from("route_submission")
    .select("userId, status")
    .in("userId", [...new Set(userIds)]);
  if (error) throw error;
  return data.reduce((records, { userId, status }) => {
    if (!userId) return records;
    const record = records.get(userId) ?? { PENDING: 0, VERIFIED: 0, REJECTED: 0 };
    return records.set(userId, { ...record, [status]: record[status] + 1 });
  }, new Map<string, SenderRecord>());
}

/**
 * A submission's stops for the review page. A malformed list shows as no stops; approving
 * checks it again and refuses. Stops have no id of their own, and a stored list never
 * changes order, so the submission id and position make one.
 */
function toStops(submissionId: string, waypoints: Json): RouteStop[] {
  const parsed = z.array(z.tuple([z.number(), z.number()])).safeParse(waypoints);
  return parsed.success ? parsed.data.map((position, index) => ({ id: `${submissionId}-${index}`, position })) : [];
}

export async function countRouteSubmissions(): Promise<Record<SubmissionStatus, number>> {
  const count = async (status: SubmissionStatus) => {
    const { count, error } = await getDb()
      .from("route_submission")
      .select("*", { count: "exact", head: true })
      .eq("status", status);
    if (error) throw error;
    return count ?? 0;
  };
  const [PENDING, VERIFIED, REJECTED] = await Promise.all([count("PENDING"), count("VERIFIED"), count("REJECTED")]);
  return { PENDING, VERIFIED, REJECTED };
}
