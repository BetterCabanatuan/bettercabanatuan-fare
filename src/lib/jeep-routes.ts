import { jeepFare, type JeepFare, type JeepFareRules, type JeepType } from "@/lib/fare";
import { projectOntoLine, type LineProjection, type LngLat } from "@/lib/geo";

export type JeepStop = { name: string; barangay?: string; km?: number; position: LngLat };

/** One direction of travel; outbound and return can use different streets. */
export type RouteDirection = { id: string; label: string; line: LngLat[] };

export type JeepRoute = {
  id: string;
  name: string;
  via: string;
  type: JeepType;
  terminal?: string;
  source: string;
  status: "active" | "suspended" | "unverified";
  verifiedOn?: string;
  directions: RouteDirection[];
  stops: JeepStop[];
};

/** Only routes with a confirmed line and a verification date are drawn or matched. */
export const isMapped = (route: JeepRoute): boolean =>
  route.status === "active" && route.directions.length > 0 && Boolean(route.verifiedOn);

export type JeepTrip = {
  route: JeepRoute;
  direction: RouteDirection;
  board: LineProjection;
  alight: LineProjection;
  rideKm: number;
  walkKm: number;
  fare: JeepFare;
};

export type TripSearch = {
  trips: JeepTrip[];
  /** Closest route to point A when no trip fits within walking distance. */
  nearest?: { route: JeepRoute; offsetKm: number };
};

/**
 * Riders board and get off anywhere along the line (spec option A): A and B are
 * projected onto each direction's line, and a trip counts when both are within
 * walking distance and B comes after A in the direction of travel.
 */
export function findTrips(
  routes: JeepRoute[],
  rules: JeepFareRules,
  a: LngLat,
  b: LngLat,
  maxWalkKm: number,
): TripSearch {
  const candidates = routes.filter(isMapped).flatMap((route) =>
    route.directions.map((direction) => {
      const board = projectOntoLine(a, direction.line);
      const alight = projectOntoLine(b, direction.line);
      const rideKm = alight.alongKm - board.alongKm;
      return {
        route,
        direction,
        board,
        alight,
        rideKm,
        walkKm: board.offsetKm + alight.offsetKm,
        fare: jeepFare(rules, route.type, Math.max(0, rideKm)),
      };
    }),
  );

  const trips = candidates
    .filter(
      (trip) => trip.rideKm > 0 && trip.board.offsetKm <= maxWalkKm && trip.alight.offsetKm <= maxWalkKm,
    )
    .sort((x, y) => x.walkKm - y.walkKm || x.fare.regular - y.fare.regular);

  if (trips.length > 0 || candidates.length === 0) return { trips };

  const closest = candidates.reduce((best, trip) => (trip.board.offsetKm < best.board.offsetKm ? trip : best));
  return { trips, nearest: { route: closest.route, offsetKm: closest.board.offsetKm } };
}
