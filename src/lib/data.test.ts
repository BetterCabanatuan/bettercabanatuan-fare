import { describe, expect, it } from "vitest";

import {
  cityBoundary,
  jeepRoutes,
  jeepRules,
  landmarks,
  releases,
  terminals,
  tricycleHotline,
  tricyclePenalties,
  tricycleRules,
  tricycleSource,
} from "@/lib/data";
import { haversineKm, isInsideRing } from "@/lib/geo";
import { appVersion } from "@/lib/site";

describe("data files", () => {
  it("load the tricycle matrix in centavos", () => {
    expect(tricycleRules.baseFare.regular).toBe(3500);
    expect(tricycleRules.perSucceedingKm.discounted).toBe(400);
    expect(tricycleSource.reference).toBe("050-2026");
  });

  it("load the Sec. 5 fuel bands and Sec. 8 penalties", () => {
    expect(tricycleRules.fuelBands).toHaveLength(11);
    expect(tricycleRules.fuelBands[4]).toEqual({
      gasolineFrom: 9000,
      gasolineTo: 9999,
      baseFare: { regular: 4500, discounted: 3600 },
      perSucceedingKm: { regular: 700, discounted: 550 },
    });
    expect(tricyclePenalties).toEqual([
      { offense: 1, fine: 50000, impoundDays: 1 },
      { offense: 2, fine: 100000, impoundDays: 7 },
      { offense: 3, mtopRevoked: true },
    ]);
    expect(tricycleHotline).toBe("0998-500-2726");
  });

  it("list the current version first on the What's new page", () => {
    expect(releases[0].version).toBe(appVersion);
  });

  it("load the jeep rules and every route", () => {
    expect(jeepRules.types.modern.perSucceedingKm).toBe(240);
    expect(jeepRoutes).toHaveLength(15);
  });

  it("place every landmark inside the city boundary", () => {
    expect(landmarks.every((landmark) => isInsideRing(landmark.position, cityBoundary))).toBe(true);
  });
});

describe("approximate jeep route lines", () => {
  const approximate = jeepRoutes.filter((route) => route.status === "approximate");

  it("give every approximate route a terminal and two directions with a drawable line", () => {
    expect(approximate.length).toBeGreaterThan(0);
    for (const route of approximate) {
      expect(route.terminalPosition, route.id).toBeDefined();
      expect(route.directions, route.id).toHaveLength(2);
      for (const direction of route.directions) expect(direction.line.length, `${route.id} ${direction.id}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("keep every line point inside Central Luzon", () => {
    for (const route of jeepRoutes) {
      for (const direction of route.directions) {
        for (const [lng, lat] of direction.line) {
          expect(lng, `${route.id} ${direction.id}`).toBeGreaterThanOrEqual(120.4);
          expect(lng, `${route.id} ${direction.id}`).toBeLessThanOrEqual(121.4);
          expect(lat, `${route.id} ${direction.id}`).toBeGreaterThanOrEqual(14.7);
          expect(lat, `${route.id} ${direction.id}`).toBeLessThanOrEqual(16.0);
        }
      }
    }
  });

  it("start each outbound line at its terminal", () => {
    for (const route of approximate) {
      const outbound = route.directions.find((direction) => direction.id === "outbound");
      expect(outbound, route.id).toBeDefined();
      expect(haversineKm(outbound!.line[0], route.terminalPosition!), route.id).toBeLessThan(0.5);
    }
  });
});

describe("stops derived from waypoints", () => {
  it("gives every preset route named stops in km order, starting at the terminal", () => {
    for (const route of jeepRoutes.filter((candidate) => candidate.status === "approximate")) {
      expect(route.stops.length, route.id).toBeGreaterThanOrEqual(2);
      expect(route.stops[0].km, route.id).toBeLessThan(0.5);
      const kms = route.stops.map((stop) => stop.km ?? 0);
      expect([...kms].sort((x, y) => x - y), route.id).toEqual(kms);
      expect(route.stops.some((stop) => stop.name.includes("routing aid")), route.id).toBe(false);
    }
  });
});

describe("terminals", () => {
  it("lists every terminal inside the city with a unique id", () => {
    expect(terminals.length).toBeGreaterThanOrEqual(5);
    expect(new Set(terminals.map((terminal) => terminal.id)).size).toBe(terminals.length);
    expect(terminals.every((terminal) => isInsideRing(terminal.position, cityBoundary))).toBe(true);
  });
});
