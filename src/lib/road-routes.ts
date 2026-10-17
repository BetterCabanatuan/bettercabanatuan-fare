// Chooses the roads offered between A and B, the way a map app offers route choices.
// OSRM returns alternatives only for longer trips, so for short city trips the planner
// also asks for detours through a point on either side of the straight line. Those
// detours are filtered here: a detour that doubles back, repeats a road already offered,
// or runs far longer than the shortest road is not a real choice.
import { cumulativeKm, pointAlong, projectOntoLine, sliceLine, type LngLat } from "@/lib/geo";

export type RoadOption = {
  line: LngLat[];
  distanceKm: number;
  /** OSRM's driving time at car speeds; tricycles and jeeps that stop take longer. */
  durationMin: number;
};

const MAX_OPTIONS = 3;
// A road more than half again as long as the shortest is a detour, not a choice.
const MAX_STRETCH = 1.5;
// A road that runs this much on a road already offered counts as the same road.
const MAX_SHARED = 0.8;
// Points this close count as the same road; OSRM draws both directions on one centreline.
const SAME_ROAD_KM = 0.025;
const SAMPLE_KM = 0.05;
// Detours bend away from the midpoint by this share of the straight-line distance.
const DETOUR_SHARE = 0.3;
const MIN_DETOUR_KM = 0.3;
const MAX_DETOUR_KM = 3;
// Below this straight-line distance there is no detour worth showing.
const MIN_DETOUR_TRIP_KM = 0.8;
// A detour that goes out and back along the same road for this long is a dead-end spur:
// OSRM snapped the via point onto a side street and drove to it and back.
const MAX_BACKTRACK_KM = 0.15;
// Distance along the line before the road counts as revisited rather than still underfoot.
const REVISIT_GAP_KM = 0.2;
// Label positions are searched over at most this many points per road.
const LABEL_SAMPLES = 40;

const toFlat = (origin: LngLat) => {
  const kmPerLng = 111.32 * Math.cos((origin[1] * Math.PI) / 180);
  const kmPerLat = 110.574;
  return {
    toKm: ([lng, lat]: LngLat): [number, number] => [(lng - origin[0]) * kmPerLng, (lat - origin[1]) * kmPerLat],
    toLngLat: ([x, y]: [number, number]): LngLat => [origin[0] + x / kmPerLng, origin[1] + y / kmPerLat],
  };
};

/** Via points for detour requests: one on each side of the A–B midpoint, or none for short trips. */
export function detourVias(a: LngLat, b: LngLat): LngLat[] {
  const flat = toFlat(a);
  const [bx, by] = flat.toKm(b);
  const length = Math.hypot(bx, by);
  if (length < MIN_DETOUR_TRIP_KM) return [];

  const offset = Math.min(MAX_DETOUR_KM, Math.max(MIN_DETOUR_KM, length * DETOUR_SHARE));
  const [px, py] = [(-by / length) * offset, (bx / length) * offset];
  return [
    flat.toLngLat([bx / 2 + px, by / 2 + py]),
    flat.toLngLat([bx / 2 - px, by / 2 - py]),
  ];
}

type Sample = { point: LngLat; alongKm: number };

function sampleLine(line: LngLat[], stepKm: number): Sample[] {
  const totals = cumulativeKm(line);
  const total = totals[totals.length - 1];
  const count = Math.max(1, Math.ceil(total / stepKm));
  return Array.from({ length: count + 1 }, (_, i) => {
    const alongKm = (total * i) / count;
    return { point: pointAlong(line, alongKm, totals), alongKm };
  });
}

/** Share of `line` that runs along `other`. */
export function sharedShare(line: LngLat[], other: LngLat[]): number {
  const samples = sampleLine(line, SAMPLE_KM);
  const shared = samples.filter(({ point }) => projectOntoLine(point, other).offsetKm <= SAME_ROAD_KM);
  return shared.length / samples.length;
}

/** True when the line goes out and comes back along the same road for a stretch. */
export function hasBacktrack(line: LngLat[]): boolean {
  const totalKm = cumulativeKm(line).at(-1) ?? 0;
  const revisited = sampleLine(line, SAMPLE_KM).filter(({ point, alongKm }) => {
    const laterFrom = alongKm + REVISIT_GAP_KM;
    if (laterFrom >= totalKm) return false;
    return projectOntoLine(point, sliceLine(line, laterFrom, totalKm)).offsetKm <= SAME_ROAD_KM;
  });
  return revisited.length * SAMPLE_KM >= MAX_BACKTRACK_KM;
}

/**
 * The roads to offer, shortest first. Direct routes come from OSRM as they are; detours
 * must not double back. Fares are charged by distance, so the shortest road leads.
 */
export function pickRoadOptions<T extends RoadOption>(direct: T[], detours: T[]): T[] {
  const candidates = [...direct, ...detours.filter((detour) => !hasBacktrack(detour.line))].sort(
    (x, y) => x.distanceKm - y.distanceKm,
  );
  if (candidates.length === 0) return [];

  const longestKm = candidates[0].distanceKm * MAX_STRETCH;
  return candidates
    .filter((candidate) => candidate.distanceKm <= longestKm)
    .reduce<T[]>(
      (kept, candidate) =>
        kept.length < MAX_OPTIONS && kept.every((road) => sharedShare(candidate.line, road.line) < MAX_SHARED)
          ? [...kept, candidate]
          : kept,
      [],
    );
}

/** Index of the quickest road; the earlier (shorter) one wins a tie. */
export function fastestIndex(options: RoadOption[]): number {
  return options.reduce((best, option, i) => (option.durationMin < options[best].durationMin ? i : best), 0);
}

/**
 * Where to pin a road's label on the map: the point in its middle stretch farthest from
 * the other roads, so each label sits on its own road rather than on a shared stretch.
 */
export function labelPoint(line: LngLat[], others: LngLat[][]): LngLat {
  const totalKm = cumulativeKm(line).at(-1) ?? 0;
  const middle = sampleLine(line, Math.max(SAMPLE_KM, totalKm / LABEL_SAMPLES)).filter(
    ({ alongKm }) => alongKm >= totalKm * 0.2 && alongKm <= totalKm * 0.8,
  );
  if (others.length === 0 || middle.length === 0) return pointAlong(line, totalKm / 2);

  const gapTo = (point: LngLat): number => Math.min(...others.map((other) => projectOntoLine(point, other).offsetKm));
  return middle
    .map(({ point }) => ({ point, gap: gapTo(point) }))
    .reduce((best, candidate) => (candidate.gap > best.gap ? candidate : best)).point;
}
