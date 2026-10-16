// Shared contracts between the fare planner, its map, search and side panels.
import type { LngLat } from "@/lib/geo";

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
  /** Name of a national road on the route (tricycles may be restricted there), or null. */
  nationalRoad: string | null;
};

export type RouteStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ready"; route: RoadRoute }
  | { state: "error"; reason: "no-route" | "unreachable" };

export type MapLine = {
  id: string;
  line: LngLat[];
  kind: "road" | "ride" | "faded" | "walk";
};
