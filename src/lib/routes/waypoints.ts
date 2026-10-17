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
