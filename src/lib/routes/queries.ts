import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import type { CommunityJeepRoute, SubmissionStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { LngLat } from "@/lib/geo";
import type { JeepRoute } from "@/lib/jeep-routes";
import { todaSlug } from "@/lib/toda/submission";

/** Cache tag for the public route list; admin approvals expire it. */
export const ROUTE_LIST_TAG = "jeep-routes";

/** Prefix that keeps community ids apart from the preset ids in data/jeepney/routes.json. */
export const COMMUNITY_ROUTE_ID_PREFIX = "community-";

/** Map id for a route: "Cabanatuan – Talavera" → "cabanatuan-talavera". Same rules as TODAs. */
export const routeSlug = (name: string): string => todaSlug(name);

// `line` is stored as JSON, so it is checked before anything draws it.
const lineSchema = z.array(z.tuple([z.number(), z.number()])).min(2);

/**
 * Verified community routes, in the same shape as the presets so the planner and map
 * treat them alike. Returns [] when the database is unreachable so /fare still renders.
 */
export async function listVerifiedRoutes(): Promise<JeepRoute[]> {
  try {
    return await cachedVerifiedRoutes();
  } catch (error) {
    // Caught outside the cached function so an outage is retried on the next request
    // instead of being cached as an empty list for hours.
    console.error("Could not load community jeepney routes", error);
    return [];
  }
}

async function cachedVerifiedRoutes(): Promise<JeepRoute[]> {
  "use cache";
  cacheTag(ROUTE_LIST_TAG);
  cacheLife("hours");

  const rows = await db.communityJeepRoute.findMany({ orderBy: { name: "asc" } });
  return rows.flatMap((row) => {
    const parsed = lineSchema.safeParse(row.line);
    if (!parsed.success) {
      console.error(`Community route ${row.id} has a malformed line; skipping it`);
      return [];
    }
    return [toJeepRoute(row, parsed.data)];
  });
}

function toJeepRoute(row: CommunityJeepRoute, line: LngLat[]): JeepRoute {
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
    verifiedOn: row.verifiedOn.toISOString().slice(0, 10),
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
  const submissions = await db.routeSubmission.findMany({
    where: { status },
    orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
    take: 100,
    include: { reviewedBy: { select: { email: true } } },
  });
  const existingIds = new Set(
    (await db.communityJeepRoute.findMany({ select: { id: true } })).map((route) => route.id),
  );
  return { submissions, existingIds };
}

export async function countRouteSubmissions() {
  const groups = await db.routeSubmission.groupBy({ by: ["status"], _count: true });
  const counts: Record<SubmissionStatus, number> = { PENDING: 0, VERIFIED: 0, REJECTED: 0 };
  for (const group of groups) counts[group.status] = group._count;
  return counts;
}
