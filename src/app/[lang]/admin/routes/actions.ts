"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import type { LngLat } from "@/lib/geo";
import { ROUTE_LIST_TAG, routeSlug } from "@/lib/routes/queries";
import { getAdmin } from "@/lib/session";
import { rejectionSchema } from "@/lib/toda/submission";

export type ReviewResult = { ok: true } | { ok: false; message: string };

const ALREADY_REVIEWED = "Another admin already reviewed this submission. The list has been refreshed.";

/**
 * Marks a pending submission VERIFIED and publishes it as a community route in the
 * same transaction. The road line between A and B is fetched from OSRM first: a
 * route without one is never stored, since a straight line would mislead riders. A
 * submission whose name matches a published route updates that route, so
 * corrections flow through the same review.
 */
export async function approveRouteSubmission(id: string): Promise<ReviewResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, message: "Your session ended. Sign in again." };

  const submission = await db.routeSubmission.findUnique({ where: { id } });
  if (!submission || submission.status !== "PENDING") {
    refresh();
    return { ok: false, message: ALREADY_REVIEWED };
  }

  const slug = routeSlug(submission.name);
  if (!slug) return { ok: false, message: "This name has no letters or numbers to file it under. Reject it instead." };

  // Fetched before the transaction so a slow routing server never holds a DB transaction open.
  const road = await fetchRoadLine([submission.fromLng, submission.fromLat], [submission.toLng, submission.toLat]);
  if (!road.ok) return { ok: false, message: road.message };

  const outcome = await db.$transaction(async (tx) => {
    const entry = {
      name: submission.name,
      fromName: submission.fromName,
      toName: submission.toName,
      via: submission.via,
      jeepType: submission.jeepType,
      line: road.line,
      distanceKm: road.distanceKm,
      farePaid: submission.farePaid,
      verifiedOn: new Date(),
    };
    // A correction only replaces what it supplies; blank optional fields keep the published values.
    await tx.communityJeepRoute.upsert({
      where: { id: slug },
      create: { id: slug, ...entry },
      update: {
        ...entry,
        via: entry.via ?? undefined,
        jeepType: entry.jeepType === "UNKNOWN" ? undefined : entry.jeepType,
        farePaid: entry.farePaid ?? undefined,
      },
    });

    // Conditional update so two admins approving at once can't both win.
    const { count } = await tx.routeSubmission.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "VERIFIED", reviewedAt: new Date(), reviewedById: admin.id, routeId: slug },
    });
    if (count !== 1) throw new StaleReview();
    return "verified" as const;
  }).catch((error: unknown) => {
    if (error instanceof StaleReview) return "stale" as const;
    throw error;
  });

  refresh();
  if (outcome === "stale") return { ok: false, message: ALREADY_REVIEWED };

  updateTag(ROUTE_LIST_TAG);
  return { ok: true };
}

export async function rejectRouteSubmission(id: string, reason: string): Promise<ReviewResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, message: "Your session ended. Sign in again." };

  const parsed = rejectionSchema.safeParse(reason);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const { count } = await db.routeSubmission.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "REJECTED", rejectionReason: parsed.data, reviewedAt: new Date(), reviewedById: admin.id },
  });

  refresh();
  return count === 1 ? { ok: true } : { ok: false, message: ALREADY_REVIEWED };
}

class StaleReview extends Error {}

// ── Road line from OSRM ──────────────────────────────────────────────────────

// Free public server with fair-use limits, the same one the planner uses in the browser.
const OSRM_URL = "https://routing.openstreetmap.de/routed-car/route/v1/driving";
const OSRM_TIMEOUT_MS = 10_000;
// The FOSSGIS usage policy asks for a User-Agent that identifies the application.
const USER_AGENT = "Pamasahe Cabanatuan admin (community jeepney route verification)";

const osrmResponseSchema = z.object({
  code: z.string().optional(),
  routes: z
    .array(
      z.object({
        distance: z.number().nonnegative(),
        geometry: z.object({ coordinates: z.array(z.tuple([z.number(), z.number()])).min(2) }),
      }),
    )
    .optional(),
});

type RoadLine = { ok: true; line: LngLat[]; distanceKm: number } | { ok: false; message: string };

async function fetchRoadLine(from: LngLat, to: LngLat): Promise<RoadLine> {
  const url = `${OSRM_URL}/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`;
  const failed = (reason: string): RoadLine => ({
    ok: false,
    message: `The road line could not be fetched from OpenStreetMap routing (${reason}). Nothing was published; try again in a moment.`,
  });

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(OSRM_TIMEOUT_MS),
      cache: "no-store",
    });
    // OSRM answers "no route" with a 400 and a JSON body, so read the body before
    // treating the status as a failure.
    const body = osrmResponseSchema.safeParse(await response.json().catch(() => null));
    if (body.success && body.data.code === "NoRoute") {
      return { ok: false, message: "OpenStreetMap has no drivable road between these two points. Check the pins, or reject it." };
    }
    if (!response.ok || !body.success) return failed(`status ${response.status}`);

    const route = body.data.routes?.[0];
    if (!route) return failed("empty answer");
    return { ok: true, line: route.geometry.coordinates, distanceKm: route.distance / 1000 };
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return failed(timedOut ? "timed out after 10 seconds" : "network error");
  }
}
