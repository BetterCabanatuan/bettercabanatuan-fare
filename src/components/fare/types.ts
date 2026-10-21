// Shared contracts between the fare planner, its map, search and side panels.
import type { Passengers } from "@/lib/fare";
import type { LngLat } from "@/lib/geo";

/** What the rider sets in the tricycle panel. The planner owns it so the map can show the same fare. */
export type TricycleOptions = {
  passengers: Passengers;
  specialTripRequested: boolean;
  /** Index into the fuel bands; 0 is the base rate. */
  fuelBandIndex: number;
};

export type PointKey = "a" | "b";

export type Place = {
  position: LngLat;
  /** Main line, e.g. a landmark or street name. */
  label: string;
  /** Second line, e.g. the barangay. */
  detail?: string;
};

export type RoadRoute = {
  line: LngLat[];
  distanceKm: number;
  /** Road distance between each pair of consecutive points asked for. */
  legsKm: number[];
  /** Driving time at car speeds, from OSRM. */
  durationMin: number;
  /** Name of a national road on the route (tricycles may be restricted there), or null. */
  nationalRoad: string | null;
};

/** When ready, `routes` is shortest first and never empty; `selected` is the road the rider picked. */
export type RouteStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ready"; routes: RoadRoute[]; selected: number }
  | { state: "error"; reason: "no-route" | "unreachable" };

export type MapLine = {
  id: string;
  line: LngLat[];
  /**
   * road: the picked road route between A and B. ride/walk/faded: a matched jeep trip.
   * route: a preset jeep route in the background. routeActive: the route the rider picked.
   */
  kind: "road" | "ride" | "faded" | "walk" | "route" | "routeActive";
};
