import { describe, expect, it } from "vitest";

import type { JeepFareRules } from "@/lib/fare";
import { cumulativeKm, isInsideRing, sliceLine, type LngLat } from "@/lib/geo";
import { findTrips, isMapped, type JeepRoute } from "@/lib/jeep-routes";

const rules: JeepFareRules = {
  effectiveDate: "2026-09-28",
  discountRate: 0.2,
  types: {
    traditional: { label: "Traditional jeepney", baseFare: 1400, baseKm: 4, perSucceedingKm: 200 },
    modern: { label: "Modern jeepney", baseFare: 1700, baseKm: 4, perSucceedingKm: 240 },
  },
};

// A straight north-bound test line, about 11 km long. Not a real route.
const northLine: LngLat[] = [
  [120.97, 15.45],
  [120.97, 15.5],
  [120.97, 15.55],
];

const route = (overrides: Partial<JeepRoute> = {}): JeepRoute => ({
  id: "test",
  name: "Test route",
  via: "Test",
  type: "traditional",
  source: "test fixture",
  status: "active",
  verifiedOn: "2026-10-16",
  directions: [{ id: "north", label: "Northbound", line: northLine }],
  stops: [],
  ...overrides,
});

describe("isMapped", () => {
  it("needs an active status, a line and a verification date", () => {
    expect(isMapped(route())).toBe(true);
    expect(isMapped(route({ status: "unverified" }))).toBe(false);
    expect(isMapped(route({ directions: [] }))).toBe(false);
    expect(isMapped(route({ verifiedOn: undefined }))).toBe(false);
  });
});

describe("findTrips", () => {
  const a: LngLat = [120.971, 15.46];
  const b: LngLat = [120.969, 15.54];

  it("finds a trip when both points are near the line in travel order", () => {
    const { trips } = findTrips([route()], rules, a, b, 0.5);
    expect(trips).toHaveLength(1);
    expect(trips[0].rideKm).toBeCloseTo(8.85, 1);
    expect(trips[0].fare.regular).toBe(2400);
  });

  it("skips a direction that travels away from B", () => {
    expect(findTrips([route()], rules, b, a, 0.5).trips).toHaveLength(0);
  });

  it("reports the nearest route when the walk is too long", () => {
    const far: LngLat = [120.99, 15.46];
    const search = findTrips([route()], rules, far, b, 0.5);
    expect(search.trips).toHaveLength(0);
    expect(search.nearest?.offsetKm).toBeGreaterThan(2);
  });

  it("ignores routes that are not mapped", () => {
    expect(findTrips([route({ status: "suspended" })], rules, a, b, 0.5)).toEqual({ trips: [] });
  });
});

describe("geo helpers", () => {
  it("slices a line between two distances", () => {
    const slice = sliceLine(northLine, 1, 6);
    const totals = cumulativeKm(slice);
    expect(totals[totals.length - 1]).toBeCloseTo(5, 1);
  });

  it("tests points against a polygon ring", () => {
    const square: LngLat[] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    expect(isInsideRing([0.5, 0.5], square)).toBe(true);
    expect(isInsideRing([1.5, 0.5], square)).toBe(false);
  });
});
