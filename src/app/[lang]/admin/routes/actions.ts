"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { getDb } from "@/lib/db";
import type { LngLat } from "@/lib/geo";
import { routeSlug } from "@/lib/routes/queries";
import { getAdmin } from "@/lib/session";
import { rejectionSchema } from "@/lib/toda/submission";

export type ReviewResult = { ok: true } | { ok: false; message: string };

const ALREADY_REVIEWED = "Another admin already reviewed this submission. The list has been refreshed.";

/**
 * Marks a pending submission VERIFIED and publishes it as a community route in one
 * database transaction (approve_route_submission in supabase/migrations). The road line
 * from A through the rider's stops to B is fetched from OSRM first: a route without one
 * is never stored, since a straight line would mislead riders. A submission whose name
 * matches a published route updates that route, so corrections flow through the same review.
 */
export async function approveRouteSubmission(id: string): Promise<ReviewResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, message: "Your session ended. Sign in again." };

  const db = getDb();
  const { data: submission, error } = await db
    .from("route_submission")
    .select("name, fromLat, fromLng, toLat, toLng, waypoints")
    .eq("id", id)
    .eq("status", "PENDING")
    .maybeSingle();
  if (error) throw error;
  if (!submission) {
    refresh();
    return { ok: false, message: ALREADY_REVIEWED };
  }

  const slug = routeSlug(submission.name);
  if (!slug) return { ok: false, message: "This name has no letters or numbers to file it under. Reject it instead." };

  // Checked when the rider sent it; checked again because it is stored as plain JSON.
  const stops = waypointsSchema.safeParse(submission.waypoints);
  if (!stops.success) return { ok: false, message: "This submission's stops are malformed. Reject it instead." };

  // Fetched before the transaction so a slow routing server never holds one open.
  const road = await fetchRoadLine([
    [submission.fromLng, submission.fromLat],
    ...stops.data,
    [submission.toLng, submission.toLat],
  ]);
  if (!road.ok) return { ok: false, message: road.message };

  // Returns false when another admin reviewed it while the road line was loading.
  const { data: verified, error: approveError } = await db.rpc("approve_route_submission", {
    submission_id: id,
    route_id: slug,
    road_line: road.line,
    distance_km: road.distanceKm,
    reviewer_email: admin.email,
  });
  if (approveError) throw approveError;

  refresh();
  return verified ? { ok: true } : { ok: false, message: ALREADY_REVIEWED };
}

export async function rejectRouteSubmission(id: string, reason: string): Promise<ReviewResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, message: "Your session ended. Sign in again." };

  const parsed = rejectionSchema.safeParse(reason);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  // Conditional on PENDING so two admins reviewing at once can't both win.
  const { data, error } = await getDb()
    .from("route_submission")
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

const waypointsSchema = z.array(z.tuple([z.number(), z.number()]));

type RoadLine = { ok: true; line: LngLat[]; distanceKm: number } | { ok: false; message: string };

/** The road through every point in order: A, the rider's stops, then B. */
async function fetchRoadLine(points: LngLat[]): Promise<RoadLine> {
  const coordinates = points.map(([lng, lat]) => `${lng},${lat}`).join(";");
  const url = `${OSRM_URL}/${coordinates}?overview=full&geometries=geojson`;
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
      return { ok: false, message: "OpenStreetMap has no drivable road through these points. Check the pins and stops, or reject it." };
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
