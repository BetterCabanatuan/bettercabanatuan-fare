import { describe, expect, it } from "vitest";

import { cityBoundary, jeepRoutes, jeepRules, landmarks, tricycleRules, tricycleSource } from "@/lib/data";
import { isInsideRing } from "@/lib/geo";

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
