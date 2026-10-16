import { describe, expect, it } from "vitest";

import { cityBoundary, jeepRoutes, jeepRules, landmarks, tricycleRules, tricycleSource } from "@/lib/data";
import { haversineKm, isInsideRing } from "@/lib/geo";

describe("data files", () => {
  it("load the tricycle matrix in centavos", () => {
    expect(tricycleRules.regular.solo).toBe(2000);
    expect(tricycleSource.reference).toBeNull();
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
