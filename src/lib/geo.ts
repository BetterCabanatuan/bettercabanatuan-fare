// Small geometry helpers for city-scale distances. Coordinates are [longitude, latitude].

export type LngLat = [number, number];

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export function haversineKm([lng1, lat1]: LngLat, [lng2, lat2]: LngLat): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** Ray-casting test against a polygon's outer ring. */
export function isInsideRing([lng, lat]: LngLat, ring: LngLat[]): boolean {
  return ring.reduce((inside, [lngA, latA], i) => {
    const [lngB, latB] = ring[(i + ring.length - 1) % ring.length];
    const crosses =
      latA > lat !== latB > lat && lng < ((lngB - lngA) * (lat - latA)) / (latB - latA) + lngA;
    return crosses ? !inside : inside;
  }, false);
}

/** Running distance in km from the start of the line to each vertex. */
export function cumulativeKm(line: LngLat[]): number[] {
  return line.reduce<number[]>(
    (totals, point, i) => [...totals, i === 0 ? 0 : totals[i - 1] + haversineKm(line[i - 1], point)],
    [],
  );
}

export type LineProjection = {
  /** Closest point on the line. */
  point: LngLat;
  /** Distance along the line from its start to that point. */
  alongKm: number;
  /** Straight-line distance from the input point to the line. */
  offsetKm: number;
};

/**
 * Closest point on a polyline. Uses a flat-earth approximation around the input
 * point, which is accurate to metres at city scale.
 */
export function projectOntoLine(target: LngLat, line: LngLat[]): LineProjection {
  const kmPerLng = 111.32 * Math.cos(toRadians(target[1]));
  const kmPerLat = 110.574;
  const toXY = ([lng, lat]: LngLat): [number, number] => [
    (lng - target[0]) * kmPerLng,
    (lat - target[1]) * kmPerLat,
  ];
  const totals = cumulativeKm(line);

  const candidates = line.slice(1).map((end, i) => {
    const start = line[i];
    const [ax, ay] = toXY(start);
    const [bx, by] = toXY(end);
    const lengthSq = (bx - ax) ** 2 + (by - ay) ** 2;
    const t = lengthSq === 0 ? 0 : Math.min(1, Math.max(0, -(ax * (bx - ax) + ay * (by - ay)) / lengthSq));
    const point: LngLat = [start[0] + t * (end[0] - start[0]), start[1] + t * (end[1] - start[1])];
    return {
      point,
      alongKm: totals[i] + t * (totals[i + 1] - totals[i]),
      offsetKm: Math.hypot(ax + t * (bx - ax), ay + t * (by - ay)),
    };
  });

  return candidates.reduce((best, candidate) => (candidate.offsetKm < best.offsetKm ? candidate : best));
}

/** The point a given distance along a line; `totals` is the line's cumulativeKm. */
export function pointAlong(line: LngLat[], km: number, totals: number[] = cumulativeKm(line)): LngLat {
  const index = totals.findIndex((total) => total >= km);
  const i = index === -1 ? totals.length - 1 : Math.max(1, index);
  const segment = totals[i] - totals[i - 1];
  const t = segment === 0 ? 0 : (km - totals[i - 1]) / segment;
  const [start, end] = [line[i - 1], line[i]];
  return [start[0] + t * (end[0] - start[0]), start[1] + t * (end[1] - start[1])];
}

/** The part of a line between two distances along it. */
export function sliceLine(line: LngLat[], fromKm: number, toKm: number): LngLat[] {
  const totals = cumulativeKm(line);
  const inner = line.filter((_, i) => totals[i] > fromKm && totals[i] < toKm);
  return [pointAlong(line, fromKm, totals), ...inner, pointAlong(line, toKm, totals)];
}
