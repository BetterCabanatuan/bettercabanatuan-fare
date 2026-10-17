// Stops a rider adds between A and B on the suggest form. Riders tap the map in whatever
// order they think of the stops, so each new one goes where it bends the trip the least
// rather than at the end of the list.
import { haversineKm, type LngLat } from "@/lib/geo";

/** A stop between A and B. The id only keeps map markers and list rows matched to their stop. */
export type RouteStop = { id: string; position: LngLat };

/**
 * Where `point` belongs in `stops`: between the consecutive pair of points
 * (A, ...stops, B) where it adds the least straight-line distance. Ties go to the
 * earlier pair, so a point between A and B with no stops yet becomes stop 1.
 */
export function stopIndex(a: LngLat, stops: LngLat[], b: LngLat, point: LngLat): number {
  const points = [a, ...stops, b];
  const added = (index: number): number =>
    haversineKm(points[index], point) + haversineKm(point, points[index + 1]) - haversineKm(points[index], points[index + 1]);

  return stops.reduce((best, _, index) => (added(index + 1) < added(best) ? index + 1 : best), 0);
}

// A leg of road this much longer than the straight line between its points means the line
// drives around a block, usually because a stop landed on a parallel or side street that
// doesn't connect where the rider tapped. Short legs are skipped so a junction's turns don't count.
const LOOP_RATIO = 3;
const LOOP_MIN_KM = 0.3;

/**
 * The number (from 1) of the first stop the road loops around to reach, or null when
 * there is none. `legsKm` is the road distance between each consecutive pair of
 * `points` (A, ...stops, B).
 */
export function loopingStop(points: LngLat[], legsKm: number[]): number | null {
  const stopCount = points.length - 2;
  const leg = legsKm.findIndex(
    (km, index) => km >= LOOP_MIN_KM && km > LOOP_RATIO * haversineKm(points[index], points[index + 1]),
  );
  if (leg === -1 || stopCount === 0) return null;
  // Leg i ends at point i + 1, which is stop i + 1; the last leg ends at B, so it names the last stop.
  return Math.min(leg + 1, stopCount);
}
