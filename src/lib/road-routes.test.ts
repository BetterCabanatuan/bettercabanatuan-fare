import { describe, expect, it } from "vitest";

import { cumulativeKm, haversineKm, projectOntoLine, type LngLat } from "@/lib/geo";
import {
  detourVias,
  fastestIndex,
  hasBacktrack,
  labelPoint,
  pickRoadOptions,
  sharedShare,
  type RoadOption,
} from "@/lib/road-routes";

// Test roads around a 2.2 km east-bound trip in Cabanatuan. Not real streets.
const A: LngLat = [120.96, 15.48];
const B: LngLat = [120.98, 15.48];

/** Straight along the A–B line. */
const straight: LngLat[] = [A, [120.97, 15.48], B];
/** Up 330 m, across, and back down: a 2.9 km box-shaped road north of the straight one. */
const northBox: LngLat[] = [A, [120.96, 15.483], [120.98, 15.483], B];
/** Up 1.1 km and back: 4.4 km, twice the straight road. */
const tallBox: LngLat[] = [A, [120.96, 15.49], [120.98, 15.49], B];
/** Straight, plus a 400 m spur north at the midpoint and back. */
const spur: LngLat[] = [A, [120.97, 15.48], [120.97, 15.4836], [120.97, 15.48], B];

const road = (line: LngLat[], durationMin: number): RoadOption => ({
  line,
  distanceKm: cumulativeKm(line).at(-1) ?? 0,
  durationMin,
});

describe("detourVias", () => {
  it("puts one via point on each side of the midpoint, 30% of the trip away", () => {
    const vias = detourVias(A, B);
    expect(vias).toHaveLength(2);
    const tripKm = haversineKm(A, B);
    const midpoint: LngLat = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    for (const via of vias) {
      expect(haversineKm(midpoint, via)).toBeCloseTo(tripKm * 0.3, 1);
      // Perpendicular: as far from A as from B.
      expect(haversineKm(A, via)).toBeCloseTo(haversineKm(B, via), 3);
    }
    expect(Math.sign(vias[0][1] - A[1])).toBe(-Math.sign(vias[1][1] - A[1]));
  });

  it("offers no detour for a trip under 800 m", () => {
    expect(detourVias(A, [120.965, 15.48])).toEqual([]);
  });

  it("caps the bend at 3 km on long trips", () => {
    const far: LngLat = [121.2, 15.48];
    const midpoint: LngLat = [(A[0] + far[0]) / 2, A[1]];
    expect(haversineKm(midpoint, detourVias(A, far)[0])).toBeCloseTo(3, 1);
  });
});

describe("sharedShare", () => {
  it("is 1 for the same road and low for a separate one", () => {
    expect(sharedShare(straight, straight)).toBe(1);
    expect(sharedShare(northBox, straight)).toBeLessThan(0.1);
  });
});

describe("hasBacktrack", () => {
  it("spots a dead-end spur driven out and back", () => {
    expect(hasBacktrack(spur)).toBe(true);
  });

  it("accepts roads that never revisit themselves", () => {
    expect(hasBacktrack(straight)).toBe(false);
    expect(hasBacktrack(northBox)).toBe(false);
  });
});

describe("pickRoadOptions", () => {
  it("puts the shortest road first, whichever request found it", () => {
    const options = pickRoadOptions([road(northBox, 6)], [road(straight, 7)]);
    expect(options.map((option) => option.line)).toEqual([straight, northBox]);
  });

  it("drops a detour that repeats a road already offered", () => {
    const options = pickRoadOptions([road(straight, 5)], [road(straight, 5), road(northBox, 7)]);
    expect(options.map((option) => option.line)).toEqual([straight, northBox]);
  });

  it("drops detours that double back, but never a direct route", () => {
    expect(pickRoadOptions([road(straight, 5)], [road(spur, 6)])).toHaveLength(1);
    expect(pickRoadOptions([road(spur, 6)], [])).toHaveLength(1);
  });

  it("drops roads more than 1.5 times the shortest", () => {
    const options = pickRoadOptions([road(straight, 5)], [road(tallBox, 6)]);
    expect(options.map((option) => option.line)).toEqual([straight]);
  });

  it("offers at most three roads", () => {
    const box = (lat: number): LngLat[] => [A, [120.965, lat], [120.975, lat], B];
    const options = pickRoadOptions(
      [road(straight, 5)],
      [road(box(15.483), 6), road(box(15.477), 6), road(box(15.486), 6)],
    );
    expect(options).toHaveLength(3);
    expect(options[0].line).toBe(straight);
  });

  it("returns nothing when no road was found", () => {
    expect(pickRoadOptions([], [])).toEqual([]);
  });
});

describe("fastestIndex", () => {
  it("finds the quickest road, preferring the shorter one on a tie", () => {
    expect(fastestIndex([road(straight, 8), road(northBox, 6)])).toBe(1);
    expect(fastestIndex([road(straight, 6), road(northBox, 6)])).toBe(0);
  });
});

describe("labelPoint", () => {
  it("sits on the road where it is farthest from the others", () => {
    const point = labelPoint(northBox, [straight]);
    expect(projectOntoLine(point, northBox).offsetKm).toBeLessThan(0.001);
    // On the top edge, 330 m clear of the straight road.
    expect(point[1]).toBeCloseTo(15.483, 4);
  });

  it("uses the middle of the road when it is the only one", () => {
    const [lng, lat] = labelPoint(straight, []);
    expect(lng).toBeCloseTo(120.97, 4);
    expect(lat).toBeCloseTo(15.48, 4);
  });
});
