import { jeepFare, type Centavos, type JeepFare, type JeepFareRules, type JeepType } from "@/lib/fare";
import { projectOntoLine, type LineProjection, type LngLat } from "@/lib/geo";

export type JeepStop = { name: string; barangay?: string; km?: number; position: LngLat };

/** jeep: jeeps queue here. bus: provincial buses only. mixed: both. stop: a roadside loading spot. */
export type TerminalKind = "jeep" | "bus" | "mixed" | "stop";

export type JeepTerminal = {
  id: string;
  name: string;
  kind: TerminalKind;
  position: LngLat;
  /** False when the spot comes from a community source or is inferred. */
  verified: boolean;
  note?: string;
  source: string;
};

/** One direction of travel; outbound and return can use different streets. */
export type RouteDirection = { id: string; label: string; line: LngLat[] };

export type JeepRoute = {
  id: string;
  name: string;
  via: string;
  type: JeepType;
  terminal?: string;
  /** Where the jeeps queue, when known. */
  terminalPosition?: LngLat;
  source: string;
  /**
   * active: confirmed line and verification date. approximate: a preset line drawn along the
   * main roads between the terminal and the towns the route names, not an official route line.
   */
  status: "active" | "approximate" | "suspended" | "unverified";
  /** preset: from data/jeepney/routes.json. community: a verified resident submission. */
  origin: "preset" | "community";
  /** What a rider reported paying end to end, in centavos, when known. */
  reportedFare?: Centavos;
  verifiedOn?: string;
  directions: RouteDirection[];
  stops: JeepStop[];
};

/** Routes with a confirmed line and a verification date. */
export const isMapped = (route: JeepRoute): boolean =>
  route.status === "active" && route.directions.length > 0 && Boolean(route.verifiedOn);

/** Routes that can be drawn and matched: confirmed ones plus approximate presets. */
export const hasLine = (route: JeepRoute): boolean =>
  isMapped(route) || (route.status === "approximate" && route.directions.length > 0);

export const isApproximate = (route: JeepRoute): boolean => !isMapped(route);

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
  const candidates = routes.filter(hasLine).flatMap((route) =>
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
